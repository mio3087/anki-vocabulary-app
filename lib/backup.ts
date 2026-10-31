
import type { User } from "firebase/auth";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ========================================
// バックアップの基本設定
// ========================================

const BACKUP_FORMAT = "anki-personal-backup";
const BACKUP_VERSION = 1;

const LOCAL_STORAGE_KEYS = [
  // アプリ設定
  "anki-theme-color",
  "anki-custom-color",
  "anki-auto-read",
  "anki-speech-rate",
  "anki-app-language",
  "anki-study-language",

  // 本棚・読書記録
  "little-library-books-v1",
  "little-library-reading-logs-v1",

  // 学習計画・カレンダー
  "anki-study-plans-v1",
  "anki-calendar-data-v1",

  // Little Moments
  "anki-little-moments-v1",
] as const;

// ========================================
// 型定義
// ========================================

type BackupDocument = {
  id: string;
  data: Record<string, unknown>;
};

type BackupData = {
  format: string;
  version: number;
  createdAt: string;
  sourceUid: string;

  firestore: {
    decks: BackupDocument[];
    folders: BackupDocument[];
    words: BackupDocument[];
    materials: BackupDocument[];
    tasks: BackupDocument[];
    calendarData: Record<string, unknown> | null;
    littleMoments: Record<string, unknown> | null;
  };

  localStorage: Record<string, string | null>;

  warnings?: string[];
};

export type RestoreResult = {
  decks: number;
  folders: number;
  words: number;
  materials: number;
  tasks: number;
  calendarData: boolean;
  littleMoments: boolean;
  localStorage: number;
  warnings: string[];
};

// ========================================
// Firestoreデータの変換
// ========================================

// Firestore TimestampなどをJSON保存できる形式に変換
function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return {
      __ankiType: "firestore-timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  }

  if (value instanceof Date) {
    return {
      __ankiType: "date",
      value: value.toISOString(),
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      result[key] = serializeValue(item);
    }

    return result;
  }

  return value;
}

// JSONからFirestore Timestampなどを復元
function deserializeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deserializeValue);
  }

  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;

    if (
      object.__ankiType === "firestore-timestamp" &&
      typeof object.seconds === "number" &&
      typeof object.nanoseconds === "number"
    ) {
      return new Timestamp(
        object.seconds,
        object.nanoseconds
      );
    }

    if (
      object.__ankiType === "date" &&
      typeof object.value === "string"
    ) {
      const date = new Date(object.value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(object)) {
      result[key] = deserializeValue(item);
    }

    return result;
  }

  return value;
}

// ========================================
// Firestoreコレクションの読み込み
// ========================================

async function readCollection(
  path: string[]
): Promise<BackupDocument[]> {
  const collectionRef = collection(
    db,
    path.join("/")
  );

  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    data: serializeValue(
      document.data()
    ) as Record<string, unknown>,
  }));
}

// ========================================
// バックアップデータの作成
// ========================================

export async function createBackup(
  user: User
): Promise<BackupData> {
  if (!user?.uid) {
    throw new Error("ログインしてからバックアップしてください。");
  }

  const uid = user.uid;
  const warnings: string[] = [];

  // Firestoreのコレクション
  const [
    decks,
    folders,
    words,
    materials,
    tasks,
  ] = await Promise.all([
    readCollection(["decks"]),
    readCollection(["folders"]),
    readCollection(["words"]),
    readCollection(["users", uid, "materials"]),
    readCollection(["users", uid, "tasks"]),
  ]);

  // カレンダー
  const calendarSnapshot = await getDoc(
    doc(db, "calendarData", uid)
  );

  const calendarData = calendarSnapshot.exists()
    ? serializeValue(calendarSnapshot.data()) as Record<string, unknown>
    : null;

  // Little Moments
  let littleMoments: Record<string, unknown> | null = null;

  try {
    const momentsSnapshot = await getDoc(
      doc(db, "littleMoments", uid)
    );

    if (momentsSnapshot.exists()) {
      littleMoments = serializeValue(
        momentsSnapshot.data()
      ) as Record<string, unknown>;
    }
  } catch {
    warnings.push(
      "Little MomentsのFirestoreデータは読み込めませんでした。ブラウザ側の保存データはバックアップ対象に含まれています。"
    );
  }

  // localStorage
  const localStorageData: Record<string, string | null> = {};

  for (const key of LOCAL_STORAGE_KEYS) {
    try {
      localStorageData[key] = window.localStorage.getItem(key);
    } catch {
      localStorageData[key] = null;
      warnings.push(
        `localStorageの「${key}」を読み込めませんでした。`
      );
    }
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    sourceUid: uid,

    firestore: {
      decks,
      folders,
      words,
      materials,
      tasks,
      calendarData,
      littleMoments,
    },

    localStorage: localStorageData,
    warnings,
  };
}

// ========================================
// JSONファイルのダウンロード
// ========================================

export async function exportBackup(
  user: User
): Promise<void> {
  const backup = await createBackup(user);

  const json = JSON.stringify(
    backup,
    null,
    2
  );

  const blob = new Blob(
    [json],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `anki-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ========================================
// バックアップファイルの検証
// ========================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validateBackup(
  value: unknown
): asserts value is BackupData {
  if (!isRecord(value)) {
    throw new Error("バックアップファイルの形式が正しくありません。");
  }

  if (value.format !== BACKUP_FORMAT) {
    throw new Error("Ankiのバックアップファイルではありません。");
  }

  if (value.version !== BACKUP_VERSION) {
    throw new Error(
      "対応していないバックアップ形式です。アプリのバージョンを確認してください。"
    );
  }

  if (!isRecord(value.firestore)) {
    throw new Error("Firestoreデータが見つかりません。");
  }

  if (!isRecord(value.localStorage)) {
    throw new Error("設定データが見つかりません。");
  }

  const collections = [
    "decks",
    "folders",
    "words",
    "materials",
    "tasks",
  ];

  for (const name of collections) {
    const items = value.firestore[name];

    if (!Array.isArray(items)) {
      throw new Error(
        `バックアップの「${name}」データが正しくありません。`
      );
    }

    for (const item of items) {
      if (
        !isRecord(item) ||
        typeof item.id !== "string" ||
        !isRecord(item.data)
      ) {
        throw new Error(
          `バックアップの「${name}」に不正なデータがあります。`
        );
      }
    }
  }

  for (const name of ["calendarData", "littleMoments"]) {
    const item = value.firestore[name];

    if (item !== null && !isRecord(item)) {
      throw new Error(
        `バックアップの「${name}」データが正しくありません。`
      );
    }
  }

  for (const [key, item] of Object.entries(value.localStorage)) {
    if (item !== null && typeof item !== "string") {
      throw new Error(
        `バックアップの「${key}」データが正しくありません。`
      );
    }
  }
}

// ========================================
// Firestoreデータの復元
// ========================================

async function restoreCollection(
  path: string[],
  documents: BackupDocument[]
): Promise<number> {
  // 一度に大量の書き込みを行わないよう分割
  const chunkSize = 20;

  for (
    let start = 0;
    start < documents.length;
    start += chunkSize
  ) {
    const chunk = documents.slice(
      start,
      start + chunkSize
    );

    await Promise.all(
      chunk.map((item) => {
        const restoredData = deserializeValue(
          item.data
        ) as DocumentData;

    
          

            return setDoc(
  doc(db, [...path, item.id].join("/")),
  restoredData,
  { merge: true }
);
      })
    );
  }

  return documents.length;
}

// ========================================
// JSONファイルからの復元
// ========================================

export async function restoreBackup(
  file: File,
  user: User
): Promise<RestoreResult> {
  if (!user?.uid) {
    throw new Error("ログインしてから復元してください。");
  }

  if (!file.name.toLowerCase().endsWith(".json")) {
    throw new Error("JSONファイルを選択してください。");
  }

  const text = await file.text();

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSONファイルを読み取れませんでした。");
  }

  validateBackup(parsed);

  const backup = parsed;
  const uid = user.uid;
  const warnings = [...(backup.warnings ?? [])];

  // Firestoreの復元
  // 既存のデータは削除せず、同じIDのデータを更新する

  const decks = await restoreCollection(
    ["decks"],
    backup.firestore.decks
  );

  const folders = await restoreCollection(
    ["folders"],
    backup.firestore.folders
  );

  const words = await restoreCollection(
    ["words"],
    backup.firestore.words
  );

  const materials = await restoreCollection(
    ["users", uid, "materials"],
    backup.firestore.materials
  );

  const tasks = await restoreCollection(
    ["users", uid, "tasks"],
    backup.firestore.tasks
  );

  let calendarDataRestored = false;

  if (backup.firestore.calendarData !== null) {
    await setDoc(
      doc(db, "calendarData", uid),
      deserializeValue(
        backup.firestore.calendarData
      ) as DocumentData,
      { merge: true }
    );

    calendarDataRestored = true;
  }

  let littleMomentsRestored = false;

  if (backup.firestore.littleMoments !== null) {
    try {
      await setDoc(
        doc(db, "littleMoments", uid),
        deserializeValue(
          backup.firestore.littleMoments
        ) as DocumentData,
        { merge: true }
      );

      littleMomentsRestored = true;
    } catch {
      warnings.push(
        "Little MomentsのFirestoreデータは復元できませんでした。Firestoreのセキュリティルールを確認してください。"
      );
    }
  }

  // localStorageの復元
  let localStorageRestored = 0;

  for (const [key, value] of Object.entries(
    backup.localStorage
  )) {
    if (value === null) {
      continue;
    }

    try {
      window.localStorage.setItem(key, value);
      localStorageRestored++;
    } catch {
      warnings.push(
        `localStorageの「${key}」を復元できませんでした。`
      );
    }
  }

  return {
    decks,
    folders,
    words,
    materials,
    tasks,
    calendarData: calendarDataRestored,
    littleMoments: littleMomentsRestored,
    localStorage: localStorageRestored,
    warnings,
  };
}
