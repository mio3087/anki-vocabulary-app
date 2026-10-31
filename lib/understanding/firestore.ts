
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type {
  Language,
  Skill,
  ErrorCategory,
} from "@/lib/understanding/types";

export interface NewRealityCheckRecord {
  language: Language;
  skill: Skill;
  title: string;
  confidence: number;
  actualUnderstanding: number;
  gap: number;
  errors: {
    category: ErrorCategory;
    label: string;
    description: string;
    count: number;
  }[];
  memo: string;
}

export async function saveRealityCheck(
  record: NewRealityCheckRecord
): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("ログインが必要です。");
  }

  const docRef = await addDoc(
    collection(db, "users", user.uid, "realityChecks"),
    {
      ...record,
      analyzedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    }
  );

  return docRef.id;
}
