
"use client";
import Link from "next/link";
import { useLanguage } from "@/app/component/AppLanguage";



import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { db } from "@/lib/firebase";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

type Folder = {
  id: string;
  name: string;
};

type LearningStatus =
  | "weak"
  | "almost"
  | "vague"
  | "learned"
  | "perfect"
  | "unlearned";

type LearningStatus =
  | "weak"
  | "almost"
  | "vague"
  | "learned"
  | "perfect"
  | "unlearned";

type Card = {
  id: string;
  front: string;
  pinyin: string;
  japanese: string;
  example: string;
  exampleJapanese: string;

  reviewCount?: number;
  correctCount?: number;
  incorrectCount?: number;
  lastReviewedAt?: number;
  lastResult?: "correct" | "incorrect";

  learningStatus?: LearningStatus;
  nextReviewAt?: number | null;
};

type Deck = {
  name: string;
  language: string;
  cards: Card[];
  folderId: string | null;
};

type StudyRecord = {
  id: string;
  date: string;
  time?: string;
  startedAt?: number;
  deckName: string;
  answered: number;
  correct: number;
  incorrect: number;
  duration: number;
};

type ThemeColors = {
  blue: string;
  blueDark: string;
  blueLight: string;
  pink: string;
  pinkDark: string;
  pinkLight: string;
  green: string;
  greenLight: string;
  white: string;
  gray: string;
  border: string;
  dark: string;
};



const pageTranslations: Record<string, Record<string, string>> = {
  "ja": {
    "color.title": "カラー選択",
    "color.custom": "カスタムカラーを選択",
    "color.customDesc": "カラーピッカーで自由に色を選択できます。",
    "color.choose": "自由に色を選択",
    "color.change": "色を変更する",
    "color.clickHint": "色のエリアをクリックすると、色選択ツールが開きます。",
    "color.hue": "色相（色の種類）",
    "color.hex": "HEX カラーコード",
    "color.copy": "コピー",
    "color.hexError": "#RRGGBB形式で入力してください。",
    "color.rgb": "RGB カラー値",
    "color.selected": "選択中のカラー",
    "color.saved": "保存済みのテーマカラー",
    "color.current": "現在のテーマカラー",
    "color.savedHint": "保存するとテーマカラーとして記録されます。",
    "common.cancel": "キャンセル",
    "common.save": "保存する",
    "common.saved": "保存しました ✓",
    "study.back": "← 戻る",
    "study.correct": "正解",
    "study.incorrect": "不正解",
    "study.answered": "回答",
    "study.tap": "タップして答えを見る",
    "study.noReading": "読み方なし",
    "study.noTranslation": "日本語訳なし",
    "study.pronunciation": "発音",
    "study.finished": "学習終了！",
    "study.accuracy": "正答率",
    "deck.back": "← デッキ一覧",
    "deck.cards": "語",
    "deck.start": "学習開始",
    "deck.csv": "CSVインポート",
    "deck.addWord": "単語を追加",
    "deck.editWord": "単語を編集",
    "deck.word": "単語 *",
    "deck.reading": "ピンイン・読み方",
    "deck.translation": "日本語訳",
    "deck.example": "例文",
    "deck.exampleTranslation": "例文の日本語訳",
    "deck.save": "保存",
    "deck.list": "単語一覧",
    "deck.search": "単語を検索",
    "deck.found": "語が見つかりました",
    "deck.empty": "まだ単語がありません",
    "deck.noMatchStart": "「",
    "deck.noMatchEnd": "」に一致する単語がありません。",
    "deck.clearSearch": "検索をクリア",
    "deck.edit": "編集",
    "deck.delete": "削除",
    "deck.manage": "暗記デッキ管理",
    "deck.description": "フォルダや単語デッキを整理して、学習を始めましょう。",
    "folder.uncategorized": "未分類",
    "folder.move": "フォルダへ移動",
    "folder.new": "新しいフォルダ",
    "folder.example": "例：中国語",
    "folder.create": "フォルダ作成",
    "deck.new": "新しいデッキ作成",
    "deck.exampleName": "例：HSK6",
    "deck.noFolder": "フォルダなし",
    "deck.create": "作成",
    "alert.deckName": "デッキ名を入力してください",
    "alert.deckDuplicate": "同じ名前のデッキがあります",
    "alert.deckCreated": "デッキを作成しました",
    "alert.deckSaveFailed": "デッキの保存に失敗しました",
    "alert.deckDeleteConfirm": "「{name}」を削除しますか？",
    "alert.deckDeleteFailed": "デッキの削除に失敗しました",
    "alert.folderName": "フォルダ名を入力してください",
    "alert.folderCreated": "フォルダを作成しました",
    "alert.folderSaveFailed": "フォルダの保存に失敗しました",
    "alert.folderDeleteConfirm": "このフォルダを削除しますか？",
    "alert.folderDeleteFailed": "フォルダの削除に失敗しました",
    "alert.deckMoveFailed": "デッキの移動に失敗しました",
    "alert.csvReadFailed": "CSVを読み込めませんでした",
    "alert.csvEmpty": "CSVにデータがありません",
    "alert.wordReadFailed": "単語を読み込めませんでした",
    "alert.deckNotFound": "デッキが見つかりません",
    "alert.csvImported": "{count}語をインポートしました",
    "alert.csvFileFailed": "CSVファイルを読み込めませんでした",
    "alert.wordRequired": "単語を入力してください",
    "alert.currentDeckMissing": "現在のデッキが見つかりません",
    "alert.duplicateWord": "「{word}」はすでに存在します。\n\nそれでも追加しますか？",
    "alert.wordSaveFailed": "単語の保存に失敗しました。\n",
    "alert.wordDeleteConfirm": "「{word}」を削除しますか？",
    "alert.wordDeleteFailed": "単語の削除に失敗しました",
    "alert.noWords": "単語がありません",
    "alert.studyRecordDeleteConfirm": "この学習記録を削除しますか？",
    "alert.studyRecordDeleteFailed": "学習記録の削除に失敗しました",
    "alert.studyRecordSaveFailed": "学習記録の保存に失敗しました",
    "alert.cardRecordSaveFailed": "カードの学習記録を保存できませんでした。\n\n",
    "duration.seconds": "秒",
    "duration.minutes": "分",
    "duration.separator": "",
    "color.preset.sakura": "さくら",
    "color.preset.sky": "スカイ",
    "color.preset.lavender": "ラベンダー",
    "color.preset.mint": "ミント",
    "color.preset.lemon": "レモン",
    "color.preset.peach": "ピーチ",
    "color.preset.coral": "コーラル",
    "color.preset.ocean": "オーシャン",
    "color.preset.grape": "グレープ",
    "color.preset.rose": "ローズ",
    "color.preset.forest": "フォレスト",
    "color.preset.dark": "ダーク",
    "language.zhCN": "中国語（簡体字）",
    "language.zhTW": "中国語（繁体字）",
    "language.de": "ドイツ語",
    "language.es": "スペイン語",
    "language.it": "イタリア語",
    "language.ja": "日本語",
    "language.ko": "韓国語",
    "language.nl": "オランダ語",
    "language.da": "デンマーク語",
    "language.fr": "フランス語",
    "language.ptPT": "ポルトガル語（ヨーロッパ）",
    "language.ptBR": "ポルトガル語（ブラジル）",
    "language.vi": "ベトナム語",
    "language.sv": "スウェーデン語",
    "language.nb": "ノルウェー語（ブークモール）",
    "language.id": "インドネシア語",
    "language.tr": "トルコ語",
    "language.pl": "ポーランド語",
    "language.ru": "ロシア語",
    "language.el": "ギリシャ語",
    "language.th": "タイ語",
    "language.cs": "チェコ語",
    "language.ro": "ルーマニア語",
    "language.hi": "ヒンディー語",
    "language.ar": "アラビア語",
    "alert.firestoreLoadFailed": "Firestoreからデータを読み込めませんでした。\n\n",
    "alert.csvError": "CSVエラー: "
  },
  "de": {
    "color.title": "Farbauswahl",
    "color.custom": "Benutzerdefinierte Farbe wählen",
    "color.customDesc": "Wähle eine beliebige Farbe mit dem Farbwähler.",
    "color.choose": "Farbe frei wählen",
    "color.change": "Farbe ändern",
    "color.clickHint": "Klicke auf den Farbbereich, um den Farbwähler zu öffnen.",
    "color.hue": "Farbton",
    "color.hex": "HEX-Farbcode",
    "color.copy": "Kopieren",
    "color.hexError": "Bitte im Format #RRGGBB eingeben.",
    "color.rgb": "RGB-Farbwerte",
    "color.selected": "Ausgewählte Farbe",
    "color.saved": "Gespeicherte Designfarbe",
    "color.current": "Aktuelle Designfarbe",
    "color.savedHint": "Die gespeicherte Farbe wird als Designfarbe übernommen.",
    "common.cancel": "Abbrechen",
    "common.save": "Speichern",
    "common.saved": "Gespeichert ✓",
    "study.back": "← Zurück",
    "study.correct": "Richtig",
    "study.incorrect": "Falsch",
    "study.answered": "Beantwortet",
    "study.tap": "Tippe, um die Antwort zu sehen",
    "study.noReading": "Keine Lesung",
    "study.noTranslation": "Keine Übersetzung",
    "study.pronunciation": "Aussprache",
    "study.finished": "Lernen beendet!",
    "study.accuracy": "Trefferquote",
    "deck.back": "← Deckliste",
    "deck.cards": "Karten",
    "deck.start": "Lernen starten",
    "deck.csv": "CSV importieren",
    "deck.addWord": "Wort hinzufügen",
    "deck.editWord": "Wort bearbeiten",
    "deck.word": "Wort *",
    "deck.reading": "Pinyin / Lesung",
    "deck.translation": "Japanische Übersetzung",
    "deck.example": "Beispielsatz",
    "deck.exampleTranslation": "Japanische Übersetzung des Beispiels",
    "deck.save": "Speichern",
    "deck.list": "Wortliste",
    "deck.search": "Wörter suchen",
    "deck.found": "Wörter gefunden",
    "deck.empty": "Noch keine Wörter vorhanden",
    "deck.noMatchStart": "Keine Wörter stimmen mit „",
    "deck.noMatchEnd": "“ überein.",
    "deck.clearSearch": "Suche zurücksetzen",
    "deck.edit": "Bearbeiten",
    "deck.delete": "Löschen",
    "deck.manage": "Karteikarten-Decks verwalten",
    "deck.description": "Organisiere Ordner und Wortdecks und beginne mit dem Lernen.",
    "folder.uncategorized": "Nicht zugeordnet",
    "folder.move": "In Ordner verschieben",
    "folder.new": "Neuer Ordner",
    "folder.example": "z. B. Chinesisch",
    "folder.create": "Ordner erstellen",
    "deck.new": "Neues Deck erstellen",
    "deck.exampleName": "z. B. HSK6",
    "deck.noFolder": "Kein Ordner",
    "deck.create": "Erstellen",
    "alert.deckName": "Bitte gib einen Decknamen ein.",
    "alert.deckDuplicate": "Ein Deck mit diesem Namen existiert bereits.",
    "alert.deckCreated": "Deck erstellt.",
    "alert.deckSaveFailed": "Deck konnte nicht gespeichert werden.",
    "alert.deckDeleteConfirm": "„{name}“ wirklich löschen?",
    "alert.deckDeleteFailed": "Deck konnte nicht gelöscht werden.",
    "alert.folderName": "Bitte gib einen Ordnernamen ein.",
    "alert.folderCreated": "Ordner erstellt.",
    "alert.folderSaveFailed": "Ordner konnte nicht gespeichert werden.",
    "alert.folderDeleteConfirm": "Diesen Ordner wirklich löschen?",
    "alert.folderDeleteFailed": "Ordner konnte nicht gelöscht werden.",
    "alert.deckMoveFailed": "Deck konnte nicht verschoben werden.",
    "alert.csvReadFailed": "CSV konnte nicht gelesen werden.",
    "alert.csvEmpty": "Die CSV-Datei enthält keine Daten.",
    "alert.wordReadFailed": "Wörter konnten nicht importiert werden.",
    "alert.deckNotFound": "Deck nicht gefunden.",
    "alert.csvImported": "{count} Wörter importiert.",
    "alert.csvFileFailed": "CSV-Datei konnte nicht gelesen werden.",
    "alert.wordRequired": "Bitte gib ein Wort ein.",
    "alert.currentDeckMissing": "Das aktuelle Deck wurde nicht gefunden.",
    "alert.duplicateWord": "„{word}“ ist bereits vorhanden.\n\nTrotzdem hinzufügen?",
    "alert.wordSaveFailed": "Wort konnte nicht gespeichert werden.\n",
    "alert.wordDeleteConfirm": "„{word}“ wirklich löschen?",
    "alert.wordDeleteFailed": "Wort konnte nicht gelöscht werden.",
    "alert.noWords": "Keine Wörter vorhanden.",
    "alert.studyRecordDeleteConfirm": "Diesen Lernverlauf wirklich löschen?",
    "alert.studyRecordDeleteFailed": "Lernverlauf konnte nicht gelöscht werden.",
    "alert.studyRecordSaveFailed": "Lernverlauf konnte nicht gespeichert werden.",
    "alert.cardRecordSaveFailed": "Lernfortschritt der Karte konnte nicht gespeichert werden.\n\n",
    "duration.seconds": "Sek.",
    "duration.minutes": "Min.",
    "duration.separator": " ",
    "color.preset.sakura": "Kirschblüte",
    "color.preset.sky": "Himmelblau",
    "color.preset.lavender": "Lavendel",
    "color.preset.mint": "Minze",
    "color.preset.lemon": "Zitrone",
    "color.preset.peach": "Pfirsich",
    "color.preset.coral": "Koralle",
    "color.preset.ocean": "Ozean",
    "color.preset.grape": "Traube",
    "color.preset.rose": "Rose",
    "color.preset.forest": "Wald",
    "color.preset.dark": "Dunkel",
    "language.zhCN": "Chinesisch (vereinfacht)",
    "language.zhTW": "Chinesisch (traditionell)",
    "language.de": "Deutsch",
    "language.es": "Spanisch",
    "language.it": "Italienisch",
    "language.ja": "Japanisch",
    "language.ko": "Koreanisch",
    "language.nl": "Niederländisch",
    "language.da": "Dänisch",
    "language.fr": "Französisch",
    "language.ptPT": "Portugiesisch (Europa)",
    "language.ptBR": "Portugiesisch (Brasilien)",
    "language.vi": "Vietnamesisch",
    "language.sv": "Schwedisch",
    "language.nb": "Norwegisch (Bokmål)",
    "language.id": "Indonesisch",
    "language.tr": "Türkisch",
    "language.pl": "Polnisch",
    "language.ru": "Russisch",
    "language.el": "Griechisch",
    "language.th": "Thailändisch",
    "language.cs": "Tschechisch",
    "language.ro": "Rumänisch",
    "language.hi": "Hindi",
    "language.ar": "Arabisch",
    "alert.firestoreLoadFailed": "Daten konnten nicht aus Firestore geladen werden.\n\n",
    "alert.csvError": "CSV-Fehler: "
  },
  "en": {
    "color.title": "Choose a color",
    "color.custom": "Choose a custom color",
    "color.customDesc": "Choose any color using the color picker.",
    "color.choose": "Choose a color freely",
    "color.change": "Change color",
    "color.clickHint": "Click the color area to open the color picker.",
    "color.hue": "Hue",
    "color.hex": "HEX color code",
    "color.copy": "Copy",
    "color.hexError": "Enter a color in #RRGGBB format.",
    "color.rgb": "RGB color values",
    "color.selected": "Selected color",
    "color.saved": "Saved theme color",
    "color.current": "Current theme color",
    "color.savedHint": "Your saved color will be used as the theme color.",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.saved": "Saved ✓",
    "study.back": "← Back",
    "study.correct": "Correct",
    "study.incorrect": "Incorrect",
    "study.answered": "Answered",
    "study.tap": "Tap to reveal the answer",
    "study.noReading": "No reading available",
    "study.noTranslation": "No translation available",
    "study.pronunciation": "Pronunciation",
    "study.finished": "Study complete!",
    "study.accuracy": "Accuracy",
    "deck.back": "← Deck list",
    "deck.cards": "cards",
    "deck.start": "Start studying",
    "deck.csv": "Import CSV",
    "deck.addWord": "Add a word",
    "deck.editWord": "Edit word",
    "deck.word": "Word *",
    "deck.reading": "Pinyin / Reading",
    "deck.translation": "Japanese translation",
    "deck.example": "Example sentence",
    "deck.exampleTranslation": "Japanese translation of example",
    "deck.save": "Save",
    "deck.list": "Word list",
    "deck.search": "Search words",
    "deck.found": "words found",
    "deck.empty": "No words yet",
    "deck.noMatchStart": "No words match “",
    "deck.noMatchEnd": "”.",
    "deck.clearSearch": "Clear search",
    "deck.edit": "Edit",
    "deck.delete": "Delete",
    "deck.manage": "Flashcard deck management",
    "deck.description": "Organize folders and word decks, then start learning.",
    "folder.uncategorized": "Uncategorized",
    "folder.move": "Move to folder",
    "folder.new": "New folder",
    "folder.example": "e.g. Chinese",
    "folder.create": "Create folder",
    "deck.new": "Create a new deck",
    "deck.exampleName": "e.g. HSK6",
    "deck.noFolder": "No folder",
    "deck.create": "Create",
    "alert.deckName": "Please enter a deck name.",
    "alert.deckDuplicate": "A deck with this name already exists.",
    "alert.deckCreated": "Deck created.",
    "alert.deckSaveFailed": "Could not save the deck.",
    "alert.deckDeleteConfirm": "Delete “{name}”?",
    "alert.deckDeleteFailed": "Could not delete the deck.",
    "alert.folderName": "Please enter a folder name.",
    "alert.folderCreated": "Folder created.",
    "alert.folderSaveFailed": "Could not save the folder.",
    "alert.folderDeleteConfirm": "Delete this folder?",
    "alert.folderDeleteFailed": "Could not delete the folder.",
    "alert.deckMoveFailed": "Could not move the deck.",
    "alert.csvReadFailed": "Could not read the CSV.",
    "alert.csvEmpty": "The CSV contains no data.",
    "alert.wordReadFailed": "Could not import the words.",
    "alert.deckNotFound": "Deck not found.",
    "alert.csvImported": "Imported {count} words.",
    "alert.csvFileFailed": "Could not read the CSV file.",
    "alert.wordRequired": "Please enter a word.",
    "alert.currentDeckMissing": "The current deck could not be found.",
    "alert.duplicateWord": "“{word}” already exists.\n\nAdd it anyway?",
    "alert.wordSaveFailed": "Could not save the word.\n",
    "alert.wordDeleteConfirm": "Delete “{word}”?",
    "alert.wordDeleteFailed": "Could not delete the word.",
    "alert.noWords": "There are no words in this deck.",
    "alert.studyRecordDeleteConfirm": "Delete this study record?",
    "alert.studyRecordDeleteFailed": "Could not delete the study record.",
    "alert.studyRecordSaveFailed": "Could not save the study record.",
    "alert.cardRecordSaveFailed": "Could not save this card’s study record.\n\n",
    "duration.seconds": "sec",
    "duration.minutes": "min",
    "duration.separator": " ",
    "color.preset.sakura": "Sakura",
    "color.preset.sky": "Sky",
    "color.preset.lavender": "Lavender",
    "color.preset.mint": "Mint",
    "color.preset.lemon": "Lemon",
    "color.preset.peach": "Peach",
    "color.preset.coral": "Coral",
    "color.preset.ocean": "Ocean",
    "color.preset.grape": "Grape",
    "color.preset.rose": "Rose",
    "color.preset.forest": "Forest",
    "color.preset.dark": "Dark",
    "language.zhCN": "Chinese (Simplified)",
    "language.zhTW": "Chinese (Traditional)",
    "language.de": "German",
    "language.es": "Spanish",
    "language.it": "Italian",
    "language.ja": "Japanese",
    "language.ko": "Korean",
    "language.nl": "Dutch",
    "language.da": "Danish",
    "language.fr": "French",
    "language.ptPT": "Portuguese (European)",
    "language.ptBR": "Portuguese (Brazilian)",
    "language.vi": "Vietnamese",
    "language.sv": "Swedish",
    "language.nb": "Norwegian (Bokmål)",
    "language.id": "Indonesian",
    "language.tr": "Turkish",
    "language.pl": "Polish",
    "language.ru": "Russian",
    "language.el": "Greek",
    "language.th": "Thai",
    "language.cs": "Czech",
    "language.ro": "Romanian",
    "language.hi": "Hindi",
    "language.ar": "Arabic",
    "alert.firestoreLoadFailed": "Could not load data from Firestore.\n\n",
    "alert.csvError": "CSV error: "
  },
  "zh-CN": {
    "color.title": "选择颜色",
    "color.custom": "选择自定义颜色",
    "color.customDesc": "使用取色器自由选择颜色。",
    "color.choose": "自由选择颜色",
    "color.change": "更改颜色",
    "color.clickHint": "点击颜色区域即可打开取色工具。",
    "color.hue": "色相",
    "color.hex": "HEX 颜色代码",
    "color.copy": "复制",
    "color.hexError": "请使用 #RRGGBB 格式输入。",
    "color.rgb": "RGB 颜色值",
    "color.selected": "当前选择的颜色",
    "color.saved": "已保存的主题颜色",
    "color.current": "当前主题颜色",
    "color.savedHint": "保存后将把该颜色设为主题颜色。",
    "common.cancel": "取消",
    "common.save": "保存",
    "common.saved": "已保存 ✓",
    "study.back": "← 返回",
    "study.correct": "正确",
    "study.incorrect": "错误",
    "study.answered": "已回答",
    "study.tap": "点击查看答案",
    "study.noReading": "暂无读音",
    "study.noTranslation": "暂无翻译",
    "study.pronunciation": "发音",
    "study.finished": "学习结束！",
    "study.accuracy": "正确率",
    "deck.back": "← 卡组列表",
    "deck.cards": "个词",
    "deck.start": "开始学习",
    "deck.csv": "导入 CSV",
    "deck.addWord": "添加单词",
    "deck.editWord": "编辑单词",
    "deck.word": "单词 *",
    "deck.reading": "拼音 / 读音",
    "deck.translation": "日语翻译",
    "deck.example": "例句",
    "deck.exampleTranslation": "例句的日语翻译",
    "deck.save": "保存",
    "deck.list": "单词列表",
    "deck.search": "搜索单词",
    "deck.found": "个单词已找到",
    "deck.empty": "还没有单词",
    "deck.noMatchStart": "没有与“",
    "deck.noMatchEnd": "”匹配的单词。",
    "deck.clearSearch": "清除搜索",
    "deck.edit": "编辑",
    "deck.delete": "删除",
    "deck.manage": "记忆卡组管理",
    "deck.description": "整理文件夹和单词卡组，开始学习吧。",
    "folder.uncategorized": "未分类",
    "folder.move": "移动到文件夹",
    "folder.new": "新建文件夹",
    "folder.example": "例如：中文",
    "folder.create": "创建文件夹",
    "deck.new": "新建卡组",
    "deck.exampleName": "例如：HSK6",
    "deck.noFolder": "无文件夹",
    "deck.create": "创建",
    "alert.deckName": "请输入卡组名称。",
    "alert.deckDuplicate": "已存在同名卡组。",
    "alert.deckCreated": "卡组已创建。",
    "alert.deckSaveFailed": "无法保存卡组。",
    "alert.deckDeleteConfirm": "确定删除“{name}”吗？",
    "alert.deckDeleteFailed": "无法删除卡组。",
    "alert.folderName": "请输入文件夹名称。",
    "alert.folderCreated": "文件夹已创建。",
    "alert.folderSaveFailed": "无法保存文件夹。",
    "alert.folderDeleteConfirm": "确定删除此文件夹吗？",
    "alert.folderDeleteFailed": "无法删除文件夹。",
    "alert.deckMoveFailed": "无法移动卡组。",
    "alert.csvReadFailed": "无法读取 CSV。",
    "alert.csvEmpty": "CSV 文件中没有数据。",
    "alert.wordReadFailed": "无法导入单词。",
    "alert.deckNotFound": "未找到卡组。",
    "alert.csvImported": "已导入 {count} 个词。",
    "alert.csvFileFailed": "无法读取 CSV 文件。",
    "alert.wordRequired": "请输入单词。",
    "alert.currentDeckMissing": "未找到当前卡组。",
    "alert.duplicateWord": "“{word}”已存在。\n\n仍要添加吗？",
    "alert.wordSaveFailed": "无法保存单词。\n",
    "alert.wordDeleteConfirm": "确定删除“{word}”吗？",
    "alert.wordDeleteFailed": "无法删除单词。",
    "alert.noWords": "卡组中没有单词。",
    "alert.studyRecordDeleteConfirm": "确定删除这条学习记录吗？",
    "alert.studyRecordDeleteFailed": "无法删除学习记录。",
    "alert.studyRecordSaveFailed": "无法保存学习记录。",
    "alert.cardRecordSaveFailed": "无法保存此卡片的学习记录。\n\n",
    "duration.seconds": "秒",
    "duration.minutes": "分钟",
    "duration.separator": "",
    "color.preset.sakura": "樱花",
    "color.preset.sky": "天空",
    "color.preset.lavender": "薰衣草",
    "color.preset.mint": "薄荷",
    "color.preset.lemon": "柠檬",
    "color.preset.peach": "蜜桃",
    "color.preset.coral": "珊瑚",
    "color.preset.ocean": "海洋",
    "color.preset.grape": "葡萄",
    "color.preset.rose": "玫瑰",
    "color.preset.forest": "森林",
    "color.preset.dark": "深色",
    "language.zhCN": "中文（简体）",
    "language.zhTW": "中文（繁體）",
    "language.de": "德语",
    "language.es": "西班牙语",
    "language.it": "意大利语",
    "language.ja": "日语",
    "language.ko": "韩语",
    "language.nl": "荷兰语",
    "language.da": "丹麦语",
    "language.fr": "法语",
    "language.ptPT": "葡萄牙语（欧洲）",
    "language.ptBR": "葡萄牙语（巴西）",
    "language.vi": "越南语",
    "language.sv": "瑞典语",
    "language.nb": "挪威语（书面语）",
    "language.id": "印度尼西亚语",
    "language.tr": "土耳其语",
    "language.pl": "波兰语",
    "language.ru": "俄语",
    "language.el": "希腊语",
    "language.th": "泰语",
    "language.cs": "捷克语",
    "language.ro": "罗马尼亚语",
    "language.hi": "印地语",
    "language.ar": "阿拉伯语",
    "alert.firestoreLoadFailed": "无法从 Firestore 加载数据。\n\n",
    "alert.csvError": "CSV 错误："
  },
  "zh-TW": {
    "color.title": "選擇顏色",
    "color.custom": "選擇自訂顏色",
    "color.customDesc": "使用取色器自由選擇顏色。",
    "color.choose": "自由選擇顏色",
    "color.change": "變更顏色",
    "color.clickHint": "點擊顏色區域即可開啟取色工具。",
    "color.hue": "色相",
    "color.hex": "HEX 色碼",
    "color.copy": "複製",
    "color.hexError": "請使用 #RRGGBB 格式輸入。",
    "color.rgb": "RGB 色彩數值",
    "color.selected": "目前選取的顏色",
    "color.saved": "已儲存的主題顏色",
    "color.current": "目前的主題顏色",
    "color.savedHint": "儲存後會將此顏色設為主題顏色。",
    "common.cancel": "取消",
    "common.save": "儲存",
    "common.saved": "已儲存 ✓",
    "study.back": "← 返回",
    "study.correct": "正確",
    "study.incorrect": "錯誤",
    "study.answered": "已回答",
    "study.tap": "點擊查看答案",
    "study.noReading": "沒有讀音",
    "study.noTranslation": "沒有翻譯",
    "study.pronunciation": "發音",
    "study.finished": "學習結束！",
    "study.accuracy": "正確率",
    "deck.back": "← 卡組列表",
    "deck.cards": "個單字",
    "deck.start": "開始學習",
    "deck.csv": "匯入 CSV",
    "deck.addWord": "新增單字",
    "deck.editWord": "編輯單字",
    "deck.word": "單字 *",
    "deck.reading": "拼音／讀音",
    "deck.translation": "日文翻譯",
    "deck.example": "例句",
    "deck.exampleTranslation": "例句的日文翻譯",
    "deck.save": "儲存",
    "deck.list": "單字列表",
    "deck.search": "搜尋單字",
    "deck.found": "個單字已找到",
    "deck.empty": "目前還沒有單字",
    "deck.noMatchStart": "沒有符合「",
    "deck.noMatchEnd": "」的單字。",
    "deck.clearSearch": "清除搜尋",
    "deck.edit": "編輯",
    "deck.delete": "刪除",
    "deck.manage": "記憶卡組管理",
    "deck.description": "整理資料夾與單字卡組，開始學習吧。",
    "folder.uncategorized": "未分類",
    "folder.move": "移至資料夾",
    "folder.new": "新增資料夾",
    "folder.example": "例如：中文",
    "folder.create": "建立資料夾",
    "deck.new": "建立新卡組",
    "deck.exampleName": "例如：HSK6",
    "deck.noFolder": "不指定資料夾",
    "deck.create": "建立",
    "alert.deckName": "請輸入卡組名稱。",
    "alert.deckDuplicate": "已經有相同名稱的卡組。",
    "alert.deckCreated": "卡組已建立。",
    "alert.deckSaveFailed": "無法儲存卡組。",
    "alert.deckDeleteConfirm": "確定要刪除「{name}」嗎？",
    "alert.deckDeleteFailed": "無法刪除卡組。",
    "alert.folderName": "請輸入資料夾名稱。",
    "alert.folderCreated": "資料夾已建立。",
    "alert.folderSaveFailed": "無法儲存資料夾。",
    "alert.folderDeleteConfirm": "確定要刪除此資料夾嗎？",
    "alert.folderDeleteFailed": "無法刪除資料夾。",
    "alert.deckMoveFailed": "無法移動卡組。",
    "alert.csvReadFailed": "無法讀取 CSV。",
    "alert.csvEmpty": "CSV 檔案沒有資料。",
    "alert.wordReadFailed": "無法匯入單字。",
    "alert.deckNotFound": "找不到卡組。",
    "alert.csvImported": "已匯入 {count} 個單字。",
    "alert.csvFileFailed": "無法讀取 CSV 檔案。",
    "alert.wordRequired": "請輸入單字。",
    "alert.currentDeckMissing": "找不到目前的卡組。",
    "alert.duplicateWord": "「{word}」已經存在。\n\n仍要新增嗎？",
    "alert.wordSaveFailed": "無法儲存單字。\n",
    "alert.wordDeleteConfirm": "確定要刪除「{word}」嗎？",
    "alert.wordDeleteFailed": "無法刪除單字。",
    "alert.noWords": "卡組中沒有單字。",
    "alert.studyRecordDeleteConfirm": "確定要刪除這筆學習紀錄嗎？",
    "alert.studyRecordDeleteFailed": "無法刪除學習紀錄。",
    "alert.studyRecordSaveFailed": "無法儲存學習紀錄。",
    "alert.cardRecordSaveFailed": "無法儲存此卡片的學習紀錄。\n\n",
    "duration.seconds": "秒",
    "duration.minutes": "分鐘",
    "duration.separator": "",
    "color.preset.sakura": "櫻花",
    "color.preset.sky": "天空",
    "color.preset.lavender": "薰衣草",
    "color.preset.mint": "薄荷",
    "color.preset.lemon": "檸檬",
    "color.preset.peach": "蜜桃",
    "color.preset.coral": "珊瑚",
    "color.preset.ocean": "海洋",
    "color.preset.grape": "葡萄",
    "color.preset.rose": "玫瑰",
    "color.preset.forest": "森林",
    "color.preset.dark": "深色",
    "language.zhCN": "中文（簡體）",
    "language.zhTW": "中文（繁體）",
    "language.de": "德語",
    "language.es": "西班牙語",
    "language.it": "義大利語",
    "language.ja": "日語",
    "language.ko": "韓語",
    "language.nl": "荷蘭語",
    "language.da": "丹麥語",
    "language.fr": "法語",
    "language.ptPT": "葡萄牙語（歐洲）",
    "language.ptBR": "葡萄牙語（巴西）",
    "language.vi": "越南語",
    "language.sv": "瑞典語",
    "language.nb": "挪威語（書面語）",
    "language.id": "印尼語",
    "language.tr": "土耳其語",
    "language.pl": "波蘭語",
    "language.ru": "俄語",
    "language.el": "希臘語",
    "language.th": "泰語",
    "language.cs": "捷克語",
    "language.ro": "羅馬尼亞語",
    "language.hi": "印地語",
    "language.ar": "阿拉伯語",
    "alert.firestoreLoadFailed": "無法從 Firestore 載入資料。\n\n",
    "alert.csvError": "CSV 錯誤："
  },
  "es": {
    "color.title": "Elegir color",
    "color.custom": "Elegir un color personalizado",
    "color.customDesc": "Elige libremente un color con el selector.",
    "color.choose": "Elegir cualquier color",
    "color.change": "Cambiar color",
    "color.clickHint": "Haz clic en el área de color para abrir el selector.",
    "color.hue": "Tono",
    "color.hex": "Código de color HEX",
    "color.copy": "Copiar",
    "color.hexError": "Introduce el color en formato #RRGGBB.",
    "color.rgb": "Valores de color RGB",
    "color.selected": "Color seleccionado",
    "color.saved": "Color del tema guardado",
    "color.current": "Color del tema actual",
    "color.savedHint": "El color guardado se aplicará como color del tema.",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.saved": "Guardado ✓",
    "study.back": "← Volver",
    "study.correct": "Correcto",
    "study.incorrect": "Incorrecto",
    "study.answered": "Respondidas",
    "study.tap": "Toca para ver la respuesta",
    "study.noReading": "Sin lectura disponible",
    "study.noTranslation": "Sin traducción disponible",
    "study.pronunciation": "Pronunciación",
    "study.finished": "¡Estudio terminado!",
    "study.accuracy": "Porcentaje de aciertos",
    "deck.back": "← Lista de mazos",
    "deck.cards": "tarjetas",
    "deck.start": "Empezar a estudiar",
    "deck.csv": "Importar CSV",
    "deck.addWord": "Añadir palabra",
    "deck.editWord": "Editar palabra",
    "deck.word": "Palabra *",
    "deck.reading": "Pinyin / Lectura",
    "deck.translation": "Traducción al japonés",
    "deck.example": "Frase de ejemplo",
    "deck.exampleTranslation": "Traducción japonesa del ejemplo",
    "deck.save": "Guardar",
    "deck.list": "Lista de palabras",
    "deck.search": "Buscar palabras",
    "deck.found": "palabras encontradas",
    "deck.empty": "Todavía no hay palabras",
    "deck.noMatchStart": "No hay palabras que coincidan con «",
    "deck.noMatchEnd": "».",
    "deck.clearSearch": "Borrar búsqueda",
    "deck.edit": "Editar",
    "deck.delete": "Eliminar",
    "deck.manage": "Administrar mazos de tarjetas",
    "deck.description": "Organiza las carpetas y los mazos de palabras y empieza a estudiar.",
    "folder.uncategorized": "Sin categoría",
    "folder.move": "Mover a una carpeta",
    "folder.new": "Nueva carpeta",
    "folder.example": "p. ej., chino",
    "folder.create": "Crear carpeta",
    "deck.new": "Crear un mazo nuevo",
    "deck.exampleName": "p. ej., HSK6",
    "deck.noFolder": "Sin carpeta",
    "deck.create": "Crear",
    "alert.deckName": "Introduce un nombre para el mazo.",
    "alert.deckDuplicate": "Ya existe un mazo con ese nombre.",
    "alert.deckCreated": "Mazo creado.",
    "alert.deckSaveFailed": "No se pudo guardar el mazo.",
    "alert.deckDeleteConfirm": "¿Eliminar «{name}»?",
    "alert.deckDeleteFailed": "No se pudo eliminar el mazo.",
    "alert.folderName": "Introduce un nombre para la carpeta.",
    "alert.folderCreated": "Carpeta creada.",
    "alert.folderSaveFailed": "No se pudo guardar la carpeta.",
    "alert.folderDeleteConfirm": "¿Eliminar esta carpeta?",
    "alert.folderDeleteFailed": "No se pudo eliminar la carpeta.",
    "alert.deckMoveFailed": "No se pudo mover el mazo.",
    "alert.csvReadFailed": "No se pudo leer el CSV.",
    "alert.csvEmpty": "El archivo CSV no contiene datos.",
    "alert.wordReadFailed": "No se pudieron importar las palabras.",
    "alert.deckNotFound": "No se encontró el mazo.",
    "alert.csvImported": "Se importaron {count} palabras.",
    "alert.csvFileFailed": "No se pudo leer el archivo CSV.",
    "alert.wordRequired": "Introduce una palabra.",
    "alert.currentDeckMissing": "No se encontró el mazo actual.",
    "alert.duplicateWord": "«{word}» ya existe.\n\n¿Quieres añadirla de todos modos?",
    "alert.wordSaveFailed": "No se pudo guardar la palabra.\n",
    "alert.wordDeleteConfirm": "¿Eliminar «{word}»?",
    "alert.wordDeleteFailed": "No se pudo eliminar la palabra.",
    "alert.noWords": "Este mazo no contiene palabras.",
    "alert.studyRecordDeleteConfirm": "¿Eliminar este registro de estudio?",
    "alert.studyRecordDeleteFailed": "No se pudo eliminar el registro de estudio.",
    "alert.studyRecordSaveFailed": "No se pudo guardar el registro de estudio.",
    "alert.cardRecordSaveFailed": "No se pudo guardar el registro de estudio de esta tarjeta.\n\n",
    "duration.seconds": "s",
    "duration.minutes": "min",
    "duration.separator": " ",
    "color.preset.sakura": "Cerezo",
    "color.preset.sky": "Cielo",
    "color.preset.lavender": "Lavanda",
    "color.preset.mint": "Menta",
    "color.preset.lemon": "Limón",
    "color.preset.peach": "Melocotón",
    "color.preset.coral": "Coral",
    "color.preset.ocean": "Océano",
    "color.preset.grape": "Uva",
    "color.preset.rose": "Rosa",
    "color.preset.forest": "Bosque",
    "color.preset.dark": "Oscuro",
    "language.zhCN": "Chino (simplificado)",
    "language.zhTW": "Chino (tradicional)",
    "language.de": "Alemán",
    "language.es": "Español",
    "language.it": "Italiano",
    "language.ja": "Japonés",
    "language.ko": "Coreano",
    "language.nl": "Neerlandés",
    "language.da": "Danés",
    "language.fr": "Francés",
    "language.ptPT": "Portugués (europeo)",
    "language.ptBR": "Portugués (Brasil)",
    "language.vi": "Vietnamita",
    "language.sv": "Sueco",
    "language.nb": "Noruego (bokmål)",
    "language.id": "Indonesio",
    "language.tr": "Turco",
    "language.pl": "Polaco",
    "language.ru": "Ruso",
    "language.el": "Griego",
    "language.th": "Tailandés",
    "language.cs": "Checo",
    "language.ro": "Rumano",
    "language.hi": "Hindi",
    "language.ar": "Árabe",
    "alert.firestoreLoadFailed": "No se pudieron cargar los datos de Firestore.\n\n",
    "alert.csvError": "Error de CSV: "
  }
};

function pageText(language: string, key: string) {
  return pageTranslations[language]?.[key] ?? pageTranslations.ja[key] ?? key;
}

const presets = [
  { name: "color.preset.sakura", color: "#FF5A9E" },
  { name: "color.preset.sky", color: "#78C5FF" },
  { name: "color.preset.lavender", color: "#B69AFB" },
  { name: "color.preset.mint", color: "#70D6B5" },
  { name: "color.preset.lemon", color: "#FFE16A" },
  { name: "color.preset.peach", color: "#FFB477" },
  { name: "color.preset.coral", color: "#FF7185" },
  { name: "color.preset.ocean", color: "#36B6C8" },
  { name: "color.preset.grape", color: "#8A70C8" },
  { name: "color.preset.rose", color: "#E887B0" },
  { name: "color.preset.forest", color: "#59A982" },
  { name: "color.preset.dark", color: "#46546B" },
];

function normalizeHex(value: string) {
  const hex = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toUpperCase() : null;
}

function getRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function prioritizeWeakCards(cards: Card[]) {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.sort((a, b) => {
    const aRate = (a.reviewCount || 0) > 0
      ? (a.correctCount || 0) / (a.reviewCount || 1)
      : 0;
    const bRate = (b.reviewCount || 0) > 0
      ? (b.correctCount || 0) / (b.reviewCount || 1)
      : 0;
    const aPriority = (a.reviewCount || 0) === 0 ? -1 : aRate;
    const bPriority = (b.reviewCount || 0) === 0 ? -1 : bRate;
    return aPriority - bPriority;
  });
}

function makeThemeColors(primary: string): ThemeColors {
  const rgb = getRgb(primary);
  const mix = (amount: number) =>
    "#" + [rgb.r, rgb.g, rgb.b]
      .map((v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0"))
      .join("");
  const darken = (amount: number) =>
    "#" + [rgb.r, rgb.g, rgb.b]
      .map((v) => Math.round(v * (1 - amount)).toString(16).padStart(2, "0"))
      .join("");
  return {
    blue: primary,
    blueDark: darken(0.38),
    blueLight: mix(0.88),
    pink: "#F28CB8",
    pinkDark: "#B74378",
    pinkLight: "#FFF0F6",
    green: "#63B995",
    greenLight: "#E8F8F0",
    white: "#FFFFFF",
    gray: "#718096",
    border: "#E2E8F0",
    dark: "#26365D",
  };
}

export default function Home() {
  const { language } = useLanguage();
  const tx = (key: string) => pageText(language, key);
  const [themeColor, setThemeColor] = useState("#718675");
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [color, setColor] = useState("#718675");
  const [savedColor, setSavedColor] = useState("#718675");
  const [hexInput, setHexInput] = useState("#718675");
  const [hexError, setHexError] = useState(false);
  const [saved, setSaved] = useState(false);
  const colors = makeThemeColors(themeColor);
  const rgb = getRgb(color);





  
  useEffect(() => {
    const stored = localStorage.getItem("anki-theme-color");
    const valid = stored ? normalizeHex(stored) : null;
    if (valid) {
      setThemeColor(valid);
      setColor(valid);
      setSavedColor(valid);
      setHexInput(valid);
    }
  }, []);


  // ホーム画面のデザインを Apple × Notion の落ち着いた見た目に整える

  
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "anki-home-design-v2";
    style.textContent = `
      .anki-home {
        --home-bg: #F7F8F5;
        --home-text: #252824;
        --home-muted: #7D827B;
        --home-border: #E5E8E1;
        max-width: 1080px !important;
        margin: 0 auto !important;
        padding: 34px 30px 72px !important;
        color: var(--home-text);
        background: var(--home-bg);
        min-height: 100vh;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", sans-serif;
        letter-spacing: -0.015em;
      }
      .anki-home-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 0 0 28px;
        padding: 4px 0 24px;
        border-bottom: 1px solid var(--home-border);
      }
      .anki-home-mark {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        border-radius: 16px;
        background: #26372D;
        color: #F8FAF6;
        font-size: 25px;
        font-weight: 750;
        letter-spacing: -0.06em;
        box-shadow: 0 5px 14px rgba(38,55,45,.12);
      }
      .anki-home-eyebrow { margin: 0 0 5px; color: #7B847A; font-size: 10px; font-weight: 700; letter-spacing: .16em; }
      .anki-home-header h1 { margin: 0; font-size: clamp(27px, 3vw, 35px); line-height: 1.12; letter-spacing: -0.05em; font-weight: 750; }
      .anki-home-tagline { margin: 7px 0 0; color: var(--home-muted); font-size: 13px; line-height: 1.6; }
      .anki-home h2 { font-size: 16px; font-weight: 650; letter-spacing: -0.02em; margin: 0 0 12px; }
      .anki-home > a[href="/login"], .anki-home > a[href="/today"] {
        display: inline-flex !important; width: auto !important; align-items: center; justify-content: center;
        padding: 11px 16px !important; margin: 0 8px 14px 0 !important; border-radius: 11px !important;
        font-size: 13px !important; font-weight: 650 !important; text-decoration: none !important;
        transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
      }
      .anki-home > a[href="/login"] { background: #26372D !important; color: #fff !important; border: 1px solid #26372D !important; }
      .anki-home > a[href="/today"] { background: #E9EEE8 !important; border: 1px solid #DCE4DA !important; color: #435747 !important; }
      .anki-home .anki-settings-button {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        padding: 10px 15px; margin: 0 0 14px; border: 1px solid #DDE2DA;
        border-radius: 11px; background: #FFFFFF; color: #435747; cursor: pointer;
        font-family: inherit; font-size: 13px; font-weight: 650; text-decoration: none;
        transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
      }
      .anki-home > a[href="/armada"], .anki-home > a[href="/story1"], .anki-home > a[href="/game"] {
        display: flex !important; border-radius: 16px !important; padding: 18px 20px !important;
        margin: 12px 0 15px !important; box-shadow: 0 5px 18px rgba(30,38,31,.08) !important;
        transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
      }
      .anki-home > a[href="/armada"]:hover, .anki-home > a[href="/story1"]:hover, .anki-home > a[href="/game"]:hover,
      .anki-home > a[href="/login"]:hover, .anki-home > a[href="/today"]:hover, .anki-home .anki-settings-button:hover {
        transform: translateY(-2px); box-shadow: 0 9px 24px rgba(30,38,31,.11) !important;
      }
      .anki-home > button { border-radius: 10px !important; padding: 10px 14px !important; font-size: 13px !important; font-weight: 650 !important; margin: 0 8px 16px 0 !important; }
      .anki-home > div { border-width: 1px !important; border-color: var(--home-border) !important; border-radius: 15px !important; padding: 17px !important; margin-bottom: 14px !important; background: #FFFFFF !important; }
      .anki-home > div > div:first-child { margin-bottom: 12px !important; }
      .anki-home > div button { font-family: inherit; }
      .anki-home input, .anki-home select { border: 1px solid #DADDD6 !important; border-radius: 9px !important; background: #fff !important; color: #252824 !important; font: inherit; font-size: 13px !important; padding: 10px 11px !important; }
      .anki-home input:focus, .anki-home select:focus { outline: 2px solid #C9D5C8; outline-offset: 1px; }
      .anki-home h2 + input, .anki-home h2 + select { margin-top: 2px; }
      .anki-home button { transition: filter .15s ease, transform .15s ease; }
      .anki-home button:hover { filter: brightness(.98); }
      .anki-home a:focus-visible, .anki-home button:focus-visible { outline: 3px solid #9BAE9A; outline-offset: 3px; }
      @media (max-width: 640px) {
        .anki-home { padding: 22px 15px 44px !important; }
        .anki-home-header { gap: 12px; margin-bottom: 22px; padding-bottom: 19px; }
        .anki-home-mark { width: 46px; height: 46px; flex-basis: 46px; border-radius: 14px; }
        .anki-home > a[href="/login"], .anki-home > a[href="/today"] { margin-bottom: 9px !important; }
        .anki-home > a[href="/armada"], .anki-home > a[href="/story1"], .anki-home > a[href="/game"] { gap: 10px !important; padding: 14px !important; }
        .anki-home > a[href="/armada"] strong, .anki-home > a[href="/game"] strong { font-size: 17px !important; }
        .anki-home > a[href="/story1"] > div:first-child { font-size: 32px !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .anki-home *, .anki-home *::before, .anki-home *::after { transition: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  function chooseColor(value: string) {
    const valid = normalizeHex(value);
    if (!valid) return;
    setColor(valid);
    setHexInput(valid);
    setHexError(false);
    setSaved(false);
  }

  function saveColor() {
    localStorage.setItem("anki-theme-color", color);
    localStorage.setItem("anki-custom-color", color);
    document.documentElement.style.setProperty("--anki-theme-color", color);
    setSavedColor(color);
    setThemeColor(color);
    setSaved(true);
    setShowThemeSettings(false);
  }

  function cancelColor() {
    chooseColor(savedColor);
    setSaved(false);
    setShowThemeSettings(false);
  }



  



  
  // =========================================================
  // フォルダ
  // =========================================================

  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "default",
      name: "中国語",
    },
  ]);

  // =========================================================
  // デッキ
  // =========================================================

  const [decks, setDecks] = useState<Deck[]>([
    {
      name: "中国語",
      language: "zh-CN",
      cards: [],
      folderId: "default",
    },
  ]);

  const [currentDeck, setCurrentDeck] = useState("中国語");
const [deckOpen, setDeckOpen] = useState(false);

// 回答方式
const [answerMode, setAnswerMode] = useState<"2" | "4">("2");

  // =========================================================
  // 学習
  // =========================================================

  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [studyCorrect, setStudyCorrect] = useState(0);
  const [studyIncorrect, setStudyIncorrect] =
    useState(0);

  const [studyStartTime, setStudyStartTime] =
    useState<number | null>(null);

  // 1回の学習ごとに固有IDを持たせる
  const [studySessionId, setStudySessionId] =
    useState<string | null>(null);

  // =========================================================
  // 学習記録
  // =========================================================

  const [studyRecords, setStudyRecords] =
    useState<StudyRecord[]>([]);

  const [showStudyRecords, setShowStudyRecords] =
    useState(false);











    

  // =========================================================
  // デッキ作成
  // =========================================================

  const [newDeckName, setNewDeckName] =
    useState("");

  const [newDeckLanguage, setNewDeckLanguage] =
    useState("zh-CN");

  const [newDeckFolderId, setNewDeckFolderId] =
    useState<string | null>(null);

  // =========================================================
  // フォルダ作成
  // =========================================================

  const [newFolderName, setNewFolderName] =
    useState("");

  // =========================================================
  // 単語フォーム
  // =========================================================

  const [showCardForm, setShowCardForm] =
    useState(false);

  const [editingCardId, setEditingCardId] =
    useState<string | null>(null);

  const [cardFront, setCardFront] = useState("");
  const [cardPinyin, setCardPinyin] = useState("");
  const [cardJapanese, setCardJapanese] =
    useState("");
  const [cardExample, setCardExample] =
    useState("");
  const [cardExampleJapanese, setCardExampleJapanese] =
    useState("");

  // =========================================================
  // 単語検索
  // =========================================================

  const [cardSearch, setCardSearch] =
    useState("");

  // =========================================================
  // CSV
  // =========================================================

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // =========================================================
  // Firestore読み込み
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        // -----------------------------------------------------
        // フォルダ
        // -----------------------------------------------------

        const folderSnapshot = await getDocs(
          collection(db, "folders")
        );

        if (!folderSnapshot.empty) {
          const loadedFolders: Folder[] =
            folderSnapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,
                name: data.name || item.id,
              };
            });

          setFolders(loadedFolders);
        }

        // -----------------------------------------------------
        // デッキ
        // -----------------------------------------------------

        const deckSnapshot = await getDocs(
          collection(db, "decks")
        );

        if (!deckSnapshot.empty) {
          const loadedDecks: Deck[] =
            deckSnapshot.docs.map((item) => {
              const data = item.data();

              

              return {
                name:
                  data.name || item.id,

                language:
                  data.language ||
                  "zh-CN",

                cards: Array.isArray(data.cards)
                  ? data.cards.map((card: Partial<Card>) => ({
                      id: card.id || createId(),
                      front: card.front || "",
                      pinyin: card.pinyin || "",
                      japanese: card.japanese || "",
                      example: card.example || "",
                      exampleJapanese: card.exampleJapanese || "",
                      reviewCount: Number(card.reviewCount || 0),
                      correctCount: Number(card.correctCount || 0),
                      incorrectCount: Number(card.incorrectCount || 0),
                      lastReviewedAt: Number(card.lastReviewedAt || 0),
                      ...(card.lastResult === "correct" || card.lastResult === "incorrect"
                        ? { lastResult: card.lastResult }
                        : {}),
                    }))
                  : [],

                folderId:
                  data.folderId ?? null,
              };
            });

          setDecks(loadedDecks);

          if (loadedDecks.length > 0) {
            setCurrentDeck(
              loadedDecks[0].name
            );
          }
        }

        // -----------------------------------------------------
        // 学習記録
        // -----------------------------------------------------

        const recordSnapshot = await getDocs(
          collection(db, "studyRecords")
        );

        if (!recordSnapshot.empty) {
          const loadedRecords: StudyRecord[] =
            recordSnapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,

                date:
                  data.date || "",

                time:
                  data.time || "",

                startedAt:
                  Number(
                    data.startedAt || 0
                  ),

                deckName:
                  data.deckName || "",

                answered:
                  Number(
                    data.answered || 0
                  ),

                correct:
                  Number(
                    data.correct || 0
                  ),

                incorrect:
                  Number(
                    data.incorrect || 0
                  ),

                duration:
                  Number(
                    data.duration || 0
                  ),
              };
            });

          loadedRecords.sort((a, b) => {
            const aTime =
              a.startedAt || 0;

            const bTime =
              b.startedAt || 0;

            if (aTime && bTime) {
              return bTime - aTime;
            }

            return b.date.localeCompare(
              a.date
            );
          });

          setStudyRecords(
            loadedRecords
          );
        }

        console.log(
          "Firestoreからデータを読み込みました"
        );
      } catch (error) {
        console.error(
          "Firestore読み込みエラー:",
          error
        );

        alert(
          tx("alert.firestoreLoadFailed") +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

    loadData();
  }, []);

  // =========================================================
  // 音声
  // =========================================================

  const speakWord = (word: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const deck = decks.find(
      (item) =>
        item.name === currentDeck
    );

    const utterance =
      new SpeechSynthesisUtterance(word);

    let configuredLanguage = "";
    let configuredRate = 0.8;
    try {
      configuredLanguage = localStorage.getItem("anki-study-language") || "";
      const storedRate = Number(localStorage.getItem("anki-speech-rate") ?? "0.8");
      if (Number.isFinite(storedRate) && storedRate >= 0.5 && storedRate <= 2.0) {
        configuredRate = storedRate;
      }
    } catch {
      // ブラウザーの保存機能が使えない場合は既定値を使用します。
    }

    utterance.lang = configuredLanguage || deck?.language || "zh-CN";
    utterance.rate = configuredRate;

    window.speechSynthesis.speak(utterance);
  };

  // =========================================================
  // 学習中の自動音声
  // =========================================================

  useEffect(() => {
    if (!studyMode) {
      return;
    }

    const card = studyCards[studyIndex];

    if (!card) {
      return;
    }

    let autoReadEnabled = true;
    try {
      autoReadEnabled = localStorage.getItem("anki-auto-read") !== "false";
    } catch {
      autoReadEnabled = true;
    }

    if (!autoReadEnabled) {
      return;
    }

    speakWord(card.front);

    return () => {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    studyMode,
    studyIndex,
    studyCards,
  ]);

  // =========================================================
  // デッキ作成
  // =========================================================

  const addDeck = async () => {
    const name =
      newDeckName.trim();

    if (!name) {
      alert(
        tx("alert.deckName")
      );
      return;
    }

    if (
      decks.some(
        (deck) =>
          deck.name === name
      )
    ) {
      alert(
        tx("alert.deckDuplicate")
      );
      return;
    }

    const newDeck: Deck = {
      name,
      language:
        newDeckLanguage,
      cards: [],
      folderId:
        newDeckFolderId,
    };

    try {
      await setDoc(
        doc(db, "decks", name),
        newDeck
      );

      setDecks(
        (currentDecks) => [
          ...currentDecks,
          newDeck,
        ]
      );

      setCurrentDeck(name);
      setNewDeckName("");
      setNewDeckFolderId(null);

      alert(
        tx("alert.deckCreated")
      );
    } catch (error) {
      console.error(error);

      alert(
        tx("alert.deckSaveFailed")
      );
    }
  };

  // =========================================================
  // デッキ削除
  // =========================================================

  const deleteDeck = async (
    deckName: string
  ) => {
    if (
      !confirm(
        tx("alert.deckDeleteConfirm").replace("{name}", deckName)
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "decks", deckName)
      );

      const updatedDecks =
        decks.filter(
          (deck) =>
            deck.name !== deckName
        );

      setDecks(updatedDecks);

      if (
        currentDeck === deckName
      ) {
        setCurrentDeck(
          updatedDecks.length > 0
            ? updatedDecks[0].name
            : ""
        );

        setDeckOpen(false);
      }
    } catch (error) {
      console.error(error);

      alert(
        tx("alert.deckDeleteFailed")
      );
    }
  };

  // =========================================================
  // フォルダ作成
  // =========================================================

  const addFolder = async () => {
    const name =
      newFolderName.trim();

    if (!name) {
      alert(
        tx("alert.folderName")
      );
      return;
    }

    const newFolder: Folder = {
      id: createId(),
      name,
    };

    try {
      await setDoc(
        doc(
          db,
          "folders",
          newFolder.id
        ),
        newFolder
      );

      setFolders(
        (currentFolders) => [
          ...currentFolders,
          newFolder,
        ]
      );

      setNewFolderName("");

      alert(
        tx("alert.folderCreated")
      );
    } catch (error) {
      console.error(error);

      alert(
        tx("alert.folderSaveFailed")
      );
    }
  };

  // =========================================================
  // フォルダ削除
  // =========================================================

  const deleteFolder = async (
    folderId: string
  ) => {
    if (
      !confirm(
        tx("alert.folderDeleteConfirm")
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "folders",
          folderId
        )
      );

      const updatedFolders =
        folders.filter(
          (folder) =>
            folder.id !== folderId
        );

      setFolders(
        updatedFolders
      );

      const updatedDecks =
        decks.map((deck) =>
          deck.folderId ===
          folderId
            ? {
                ...deck,
                folderId: null,
              }
            : deck
        );

      setDecks(
        updatedDecks
      );

      for (const deck of updatedDecks) {
        await setDoc(
          doc(
            db,
            "decks",
            deck.name
          ),
          deck
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        tx("alert.folderDeleteFailed")
      );
    }
  };

  // =========================================================
  // デッキ移動
  // =========================================================

  const moveDeck = async (
    deckName: string,
    folderId: string | null
  ) => {
    const deck = decks.find(
      (item) =>
        item.name === deckName
    );

    if (!deck) {
      return;
    }

    const updatedDeck: Deck = {
      ...deck,
      folderId,
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deckName
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name === deckName
                ? updatedDeck
                : item
          )
      );
    } catch (error) {
      console.error(error);

      alert(
        tx("alert.deckMoveFailed")
      );
    }
  };

  // =========================================================
  // CSV
  // =========================================================

  const importCSV = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const input =
      event.currentTarget;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    input.value = "";

    const reader =
      new FileReader();

    reader.onload = async () => {
      try {
        const result =
          reader.result;

        if (
          typeof result !==
          "string"
        ) {
          alert(
            tx("alert.csvReadFailed")
          );
          return;
        }

        const text =
          result.replace(
            /^\uFEFF/,
            ""
          );

        const lines =
          text
            .split(/\r?\n/)
            .map((line) =>
              line.trim()
            )
            .filter(
              (line) =>
                line.length > 0
            );

        if (
          lines.length === 0
        ) {
          alert(
            tx("alert.csvEmpty")
          );
          return;
        }

        const importedCards: Card[] =
          [];

        for (const line of lines) {
          const parts =
            line.split(",");





function parseCSVLine(line: string): string[] {
  // CSVの引用符を考慮して解析
  if (line.includes('"')) {
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        fields.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }

    fields.push(field.trim());
    return fields;
  }

  // 引用符がない場合は、先頭の文章を優先して保持する
const parts = parseCSVLine(line);

  if (parts.length > 5) {
    return [
      parts.slice(0, parts.length - 4).join(",").trim(),
      ...parts.slice(-4).map((part) => part.trim()),
    ];
  }

  return parts.map((part) => part.trim());
}













          const card: Card = {
            id: createId(),

            front:
              (parts[0] || "")
                .trim(),

            pinyin:
              (parts[1] || "")
                .trim(),

            japanese:
              (parts[2] || "")
                .trim(),

            example:
              (parts[3] || "")
                .trim(),

            exampleJapanese:
              parts
                .slice(4)
                .join(",")
                .trim(),
          };

          if (card.front) {
            importedCards.push(
              card
            );
          }
        }

        if (
          importedCards.length ===
          0
        ) {
          alert(
            tx("alert.wordReadFailed")
          );
          return;
        }

        const deck =
          decks.find(
            (item) =>
              item.name ===
              currentDeck
          );

        if (!deck) {
          alert(
            tx("alert.deckNotFound")
          );
          return;
        }

        const updatedDeck: Deck = {
          ...deck,

          cards: [
            ...deck.cards,
            ...importedCards,
          ],
        };

        await setDoc(
          doc(
            db,
            "decks",
            deck.name
          ),
          updatedDeck
        );

        setDecks(
          (currentDecks) =>
            currentDecks.map(
              (item) =>
                item.name ===
                deck.name
                  ? updatedDeck
                  : item
            )
        );

        alert(
          tx("alert.csvImported").replace("{count}", String(importedCards.length))
        );
      } catch (error) {
        console.error(
          "CSV読み込みエラー:",
          error
        );

        alert(
          tx("alert.csvError") +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

    reader.onerror = () => {
      alert(
        tx("alert.csvFileFailed")
      );
    };

    reader.readAsText(
      file,
      "UTF-8"
    );
  };

  const openCSVPicker = () => {
    fileInputRef.current?.click();
  };

  



  // =========================================================
  // 単語追加
  // =========================================================

  const openAddCard = () => {
    setEditingCardId(null);

    setCardFront("");
    setCardPinyin("");
    setCardJapanese("");
    setCardExample("");
    setCardExampleJapanese("");

    setShowCardForm(true);
  };

  // =========================================================
  // 単語編集
  // =========================================================

  const openEditCard = (
    card: Card
  ) => {
    setEditingCardId(card.id);

    setCardFront(
      card.front
    );

    setCardPinyin(
      card.pinyin
    );

    setCardJapanese(
      card.japanese
    );

    setCardExample(
      card.example
    );

    setCardExampleJapanese(
      card.exampleJapanese
    );

    setShowCardForm(true);
  };

  // =========================================================
  // フォーム閉じる
  // =========================================================

  const closeCardForm = () => {
    setShowCardForm(false);
    setEditingCardId(null);

    setCardFront("");
    setCardPinyin("");
    setCardJapanese("");
    setCardExample("");
    setCardExampleJapanese("");
  };

  // =========================================================
  // 単語保存
  // =========================================================

  const saveCard = async () => {
    const front =
      cardFront.trim();

    if (!front) {
      alert(
        tx("alert.wordRequired")
      );
      return;
    }

    const deck =
      decks.find(
        (item) =>
          item.name ===
          currentDeck
      );

    if (!deck) {
      alert(
        tx("alert.currentDeckMissing")
      );
      return;
    }

    let updatedCards: Card[];

    if (editingCardId) {
      updatedCards =
        deck.cards.map(
          (card) =>
            card.id ===
            editingCardId
              ? {
                  ...card,

                  front,

                  pinyin:
                    cardPinyin.trim(),

                  japanese:
                    cardJapanese.trim(),

                  example:
                    cardExample.trim(),

                  exampleJapanese:
                    cardExampleJapanese.trim(),
                }
              : card
        );
    } else {
      const duplicate =
        deck.cards.some(
          (card) =>
            card.front
              .trim()
              .toLowerCase() ===
            front.toLowerCase()
        );

      if (duplicate) {
        const shouldAdd =
          confirm(
            tx("alert.duplicateWord").replace("{word}", front)
          );

        if (!shouldAdd) {
          return;
        }
      }

    const newCard: Card = {
  id: createId(),

  front,

  pinyin:
    cardPinyin.trim(),

  japanese:
    cardJapanese.trim(),

  example:
    cardExample.trim(),

  exampleJapanese:
    cardExampleJapanese.trim(),

  reviewCount: 0,
  correctCount: 0,
  incorrectCount: 0,
  lastReviewedAt: 0,
};

      updatedCards = [
        ...deck.cards,
        newCard,
      ];
    }

    const updatedDeck: Deck = {
      ...deck,
      cards: updatedCards,
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deck.name
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name ===
              deck.name
                ? updatedDeck
                : item
          )
      );

      closeCardForm();
    } catch (error) {
      console.error(
        "単語保存エラー:",
        error
      );

      alert(
        tx("alert.wordSaveFailed") +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    }
  };

  // =========================================================
  // 単語削除
  // =========================================================

  const deleteCard = async (
    cardId: string
  ) => {
    const deck =
      decks.find(
        (item) =>
          item.name ===
          currentDeck
      );

    if (!deck) {
      return;
    }

    const card =
      deck.cards.find(
        (item) =>
          item.id === cardId
      );

    if (!card) {
      return;
    }

    if (
      !confirm(
        tx("alert.wordDeleteConfirm").replace("{word}", card.front)
      )
    ) {
      return;
    }

    const updatedDeck: Deck = {
      ...deck,

      cards:
        deck.cards.filter(
          (item) =>
            item.id !== cardId
        ),
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deck.name
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name ===
              deck.name
                ? updatedDeck
                : item
          )
      );
    } catch (error) {
      console.error(error);

      alert(
        tx("alert.wordDeleteFailed")
      );
    }
  };

  // =========================================================
  // 学習開始
  // =========================================================

  const startStudy = () => {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck || deck.cards.length === 0) {
      alert(tx("alert.noWords"));
      return;
    }

    setStudyCards(prioritizeWeakCards(deck.cards));
    setStudyIndex(0);
    setShowAnswer(false);
    setStudyCorrect(0);
    setStudyIncorrect(0);
    setStudyStartTime(Date.now());
    setStudySessionId(createId());
    setStudyMode(true);
  };

  // =========================================================
  // 学習記録を1回分保存
  //
  // 重要：
  // 以前は「日付＋デッキ名」をIDにしていたため、
  // 同じ日に同じデッキをやると上書きされていた。
  //
  // 今回は studySessionId を使って、
  // 「1回の学習＝1つの記録」にする。
  // =========================================================

  const saveStudyRecord = async (
    correctCount: number,
    incorrectCount: number
  ) => {
    if (
      studyStartTime === null ||
      studySessionId === null
    ) {
      return;
    }

    const answered =
      correctCount +
      incorrectCount;

    if (answered === 0) {
      return;
    }

    const now = Date.now();

    const duration =
      Math.max(
        0,
        Math.floor(
          (now -
            studyStartTime) /
            1000
        )
      );

    const dateObject =
      new Date(now);

    const date =
      dateObject
        .toISOString()
        .slice(0, 10);

    const time =
      dateObject.toLocaleTimeString(
        language,
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );

    // ★ここが今回の重要部分
    // 毎回違うIDなので上書きされない
    const recordId =
      studySessionId;

    const newRecord: StudyRecord = {
      id: recordId,

      date,

      time,

      startedAt:
        studyStartTime,

      deckName:
        currentDeck,

      answered,

      correct:
        correctCount,

      incorrect:
        incorrectCount,

      duration,
    };

    try {
      await setDoc(
        doc(
          db,
          "studyRecords",
          recordId
        ),
        newRecord
      );

      setStudyRecords(
        (currentRecords) => {
          const updated = [
            newRecord,
            ...currentRecords.filter(
              (record) =>
                record.id !==
                recordId
            ),
          ];

          return updated.sort(
            (a, b) => {
              const aTime =
                a.startedAt || 0;

              const bTime =
                b.startedAt || 0;

              if (
                aTime &&
                bTime
              ) {
                return (
                  bTime -
                  aTime
                );
              }

              return b.date.localeCompare(
                a.date
              );
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "学習記録保存エラー:",
        error
      );

      alert(
        tx("alert.studyRecordSaveFailed")
      );
    }
  };

  // =========================================================
  // 学習終了
  // =========================================================

  const finishStudy = async () => {
    if (
      typeof window !==
        "undefined" &&
      "speechSynthesis" in
        window
    ) {
      window.speechSynthesis.cancel();
    }

    await saveStudyRecord(
      studyCorrect,
      studyIncorrect
    );

    setStudyMode(false);
    setShowAnswer(false);

    setStudyCards([]);
    setStudyIndex(0);

    setStudyCorrect(0);
    setStudyIncorrect(0);

    setStudyStartTime(null);
    setStudySessionId(null);
  };

  // =========================================================
  // 答え表示
  // =========================================================

  const toggleAnswer = () => {
    setShowAnswer(
      (current) => !current
    );
  };

  // =========================================================
  // 正解・不正解
  // =========================================================


  // =========================================================
  // 学習記録削除
  // =========================================================

  const deleteStudyRecord =
    async (
      recordId: string
    ) => {
      if (
        !confirm(
          tx("alert.studyRecordDeleteConfirm")
        )
      ) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "studyRecords",
            recordId
          )
        );

        setStudyRecords(
          (records) =>
            records.filter(
              (record) =>
                record.id !==
                recordId
            )
        );
      } catch (error) {
        console.error(error);

        alert(
          tx("alert.studyRecordDeleteFailed")
        );
      }
    };

  // =========================================================
  // 時間表示
  // =========================================================

  const formatDuration = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const remaining =
      seconds % 60;

    if (minutes === 0) {
      return `${remaining}${tx("duration.seconds")}`;
    }

    if (remaining === 0) {
      return `${minutes}${tx("duration.minutes")}`;
    }

    return `${minutes}${tx("duration.minutes")}${tx("duration.separator")}${remaining}${tx("duration.seconds")}`;
  };

  const answerCard = async (
  correct: boolean,
  learningStatus?: LearningStatus,
  reviewDays?: number
) => {
  const currentCard =
    studyCards[studyIndex];

  if (!currentCard) {
    return;
  }

  // -----------------------------
  // セッション全体の成績
  // -----------------------------

  const nextCorrect =
    studyCorrect +
    (correct ? 1 : 0);

  const nextIncorrect =
    studyIncorrect +
    (correct ? 0 : 1);

  setStudyCorrect(nextCorrect);
  setStudyIncorrect(nextIncorrect);


  // -----------------------------
  // カード個別の学習記録
  // -----------------------------

const updatedCard: Card = {
  ...currentCard,

  reviewCount:
    (currentCard.reviewCount || 0) + 1,

  correctCount:
    (currentCard.correctCount || 0) +
    (correct ? 1 : 0),

  incorrectCount:
    (currentCard.incorrectCount || 0) +
    (correct ? 0 : 1),

  lastReviewedAt: Date.now(),

  lastResult: correct ? "correct" : "incorrect",

  learningStatus:
    learningStatus ?? currentCard.learningStatus,

  nextReviewAt:
    reviewDays !== undefined
      ? Date.now() + reviewDays * 24 * 60 * 60 * 1000
      : currentCard.nextReviewAt ?? null,
};


  // -----------------------------
  // デッキに保存
  // -----------------------------

  const deck = decks.find(
    (item) =>
      item.name === currentDeck
  );

  if (deck) {
    const updatedDeck: Deck = {
      ...deck,

      cards: deck.cards.map(
        (card) =>
          card.id === currentCard.id
            ? updatedCard
            : card
      ),
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deck.name
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name === deck.name
                ? updatedDeck
                : item
          )
      );
    } catch (error) {
      console.error(
        "カード学習記録保存エラー:",
        error
      );

      alert(
        tx("alert.cardRecordSaveFailed") +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }


  // -----------------------------
  // 次のカードへ
  // -----------------------------

  if (
    studyIndex <
    studyCards.length - 1
  ) {
    setStudyIndex(
      (index) => index + 1
    );

    setShowAnswer(false);

    return;
  }


  // -----------------------------
  // 最後のカード
  // -----------------------------

  const answered =
    nextCorrect +
    nextIncorrect;

  await saveStudyRecord(
    nextCorrect,
    nextIncorrect
  );

  alert(
    tx("study.finished") + "\n\n" +
      `${tx("study.correct")}: ${nextCorrect}\n` +
      `${tx("study.incorrect")}: ${nextIncorrect}\n` +
      `${tx("study.answered")}: ${answered}\n` +
      `${tx("study.accuracy")}: ${
        answered > 0
          ? Math.round(
              (nextCorrect /
                answered) *
                100
            )
          : 0
      }%`
  );

  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }

  setStudyMode(false);
  setShowAnswer(false);

  setStudyCards([]);
  setStudyIndex(0);

  setStudyCorrect(0);
  setStudyIncorrect(0);

  setStudyStartTime(null);
  setStudySessionId(null);
};

  if (showThemeSettings) {
    return (
    <main className="min-h-screen bg-[#f5f7fc] text-[#26365d] md:flex">
      

      <section className="mx-auto w-full max-w-6xl p-5 md:p-10">
        <header className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight">
            {tx("color.title")}
          </h1>

        </header>

        <section className="mb-5 rounded-2xl border border-[#e6ebf5] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
            
              <p className="mt-1 text-sm text-slate-500">
              </p>
            </div>
            
          </div>

          <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
            {presets.map((preset) => {
              const active = color === preset.color;

              return (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => chooseColor(preset.color)}
                  aria-label={tx(preset.name)}
                  aria-pressed={active}
                  className="group flex flex-col items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full border-4 transition sm:h-[72px] sm:w-[72px] ${
                      active
                        ? "border-white ring-2 ring-purple-500 ring-offset-2"
                        : "border-white shadow-sm group-hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.color }}
                  >
                    {active && (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-xl font-bold text-white">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {tx(preset.name)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e6ebf5] bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-bold">
            🖌 {tx("color.custom")}
          </h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            {tx("color.customDesc")}
          </p>

          <div className="grid gap-7 md:grid-cols-2">
            <div>
              <label
                htmlFor="color-picker"
                className="mb-3 block text-sm font-semibold"
              >
                {tx("color.choose")}
              </label>

              <div
                className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200"
                style={{
                  background: `linear-gradient(135deg, white, ${color})`,
                }}
              >
                <input
                  id="color-picker"
                  type="color"
                  value={color}
                  onChange={(e) => chooseColor(e.target.value)}
                  aria-label={tx("color.custom")} 
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div
                  className="pointer-events-none rounded-full border-4 border-white px-5 py-3 text-sm font-bold text-white shadow"
                  style={{ backgroundColor: color }}
                >
                  {tx("color.change")}
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {tx("color.clickHint")}
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <label
                  htmlFor="hue-slider"
                  className="mb-3 block text-sm font-semibold"
                >
                  {tx("color.hue")}
                </label>
                <input
                  id="hue-slider"
                  type="range"
                  min="0"
                  max="359"
                  value={(() => {
                    const { r, g, b } = rgb;
                    const rr = r / 255;
                    const gg = g / 255;
                    const bb = b / 255;
                    const max = Math.max(rr, gg, bb);
                    const min = Math.min(rr, gg, bb);
                    const d = max - min;
                    if (d === 0) return 0;
                    let h = 0;
                    if (max === rr) h = ((gg - bb) / d) % 6;
                    else if (max === gg) h = (bb - rr) / d + 2;
                    else h = (rr - gg) / d + 4;
                    return Math.round((h * 60 + 360) % 360);
                  })()}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    const rgbValue = `hsl(${h}, 100%, 50%)`;
                    const canvas = document.createElement("canvas");
                    canvas.width = 1;
                    canvas.height = 1;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.fillStyle = rgbValue;
                    ctx.fillRect(0, 0, 1, 1);
                    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                    chooseColor(
                      "#" +
                        [r, g, b]
                          .map((v) => v.toString(16).padStart(2, "0"))
                          .join("")
                    );
                  }}
                  className="h-3 w-full cursor-pointer accent-purple-600"
                  style={{
                    background:
                      "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="hex-code"
                  className="mb-2 block text-sm font-semibold"
                >
                  {tx("color.hex")}
                </label>
                <div className="flex gap-2">
                  <input
                    id="hex-code"
                    value={hexInput}
                    onChange={(e) => {
                      setHexInput(e.target.value);
                      const valid = normalizeHex(e.target.value);
                      setHexError(!valid);
                      if (valid) {
                        setColor(valid);
                        setSaved(false);
                      }
                    }}
                    onBlur={() => {
                      const valid = normalizeHex(hexInput);
                      if (valid) setHexInput(valid);
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    aria-invalid={hexError}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(color);
                    }}
                    className="rounded-xl border border-slate-200 px-4 text-sm hover:bg-slate-50"
                    aria-label={tx("color.copy")} 
                  >
                    {tx("color.copy")}
                  </button>
                </div>
                {hexError && (
                  <p className="mt-1 text-sm text-red-500">
                    {tx("color.hexError")}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold">
                  {tx("color.rgb")}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["R", rgb.r],
                    ["G", rgb.g],
                    ["B", rgb.b],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <label
                        className="mb-1 block text-xs text-slate-500"
                        htmlFor={`rgb-${label}`}
                      >
                        {label}
                      </label>
                      <input
                        id={`rgb-${label}`}
                        value={value}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold">
                  {tx("color.selected")}
                </p>
                <div
                  className="h-24 rounded-xl shadow-inner"
                  style={{ backgroundColor: color }}
                />
                <p className="mt-3 font-mono text-sm text-slate-600">
                  {color}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="h-12 w-12 shrink-0 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: color }}
              />
              <div>
                <p className="text-sm font-semibold">
                  {saved ? tx("color.saved") : tx("color.current")}
                </p>
                <p className="mt-1 font-mono text-sm text-slate-500">
                  {color}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              {tx("color.savedHint")}
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={cancelColor}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              {tx("common.cancel")}
            </button>
            <button
              type="button"
              onClick={saveColor}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
              style={{ backgroundColor: color }}
            >
              {saved ? tx("common.saved") : tx("common.save")}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
  }


  

  // =========================================================
  // 学習画面
  // =========================================================

  if (studyMode) {
    const card =
      studyCards[
        studyIndex
      ];

    if (!card) {
      return null;
    }

    const currentAnswered =
      studyCorrect +
      studyIncorrect;

    return (
      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding:
            "30px 20px",
          textAlign:
            "center",
          background:
            colors.blueLight,
          minHeight:
            "100vh",
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "20px",
          }}
        >
          <button
            onClick={
              finishStudy
            }
            style={{
              padding:
                "8px 15px",
              border:
                "none",
              background:
                "transparent",
              fontSize:
                "16px",
              cursor:
                "pointer",
              color:
                colors.blueDark,
              fontWeight:
                "bold",
            }}
          >
            {tx("study.back")}
          </button>

          <p
            style={{
              margin: 0,
              color:
                colors.gray,
              fontSize:
                "15px",
            }}
          >
            {studyIndex + 1} /{" "}
            {
              studyCards.length
            }
          </p>
        </div>

        <div
          style={{
            marginBottom:
              "15px",
            fontSize:
              "14px",
            color:
              colors.gray,
          }}
        >
          {tx("study.correct")}:           {studyCorrect}
          {"　"}
          {tx("study.incorrect")}:           {studyIncorrect}
          {"　"}
          {tx("study.answered")}:           {currentAnswered}
        </div>

        <div
          onClick={
            toggleAnswer
          }
          style={{
            minHeight:
              "380px",
            padding:
              "40px 25px",
            background:
              showAnswer
                ? colors.pinkLight
                : colors.white,
            border:
              `3px solid ${
                showAnswer
                  ? colors.pink
                  : colors.blue
              }`,
            borderRadius:
              "25px",
            boxShadow:
              "0 5px 18px rgba(100,150,180,0.15)",
            cursor:
              "pointer",
            display:
              "flex",
            flexDirection:
              "column",
            justifyContent:
              "center",
            boxSizing:
              "border-box",
          }}
        >
          {!showAnswer ? (
            <>
              <div
                style={{
                  fontSize:
                    "42px",
                  fontWeight:
                    "bold",
                  marginBottom:
                    "30px",
                }}
              >
                {
                  card.front
                }
              </div>

              <div
                style={{
                  fontSize:
                    "15px",
                  color:
                    colors.gray,
                }}
              >
                {tx("study.tap")}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize:
                    "36px",
                  fontWeight:
                    "bold",
                  marginBottom:
                    "20px",
                }}
              >
                {
                  card.front
                }
              </div>

              <div
                style={{
                  fontSize:
                    "24px",
                  marginBottom:
                    "15px",
                }}
              >
                {card.pinyin ||
                  tx("study.noReading")}
              </div>

              <div
                style={{
                  fontSize:
                    "28px",
                  fontWeight:
                    "bold",
                  marginBottom:
                    "25px",
                }}
              >
                {card.japanese ||
                  tx("study.noTranslation")}
              </div>

              {card.example && (
                <div
                  style={{
                    fontSize:
                      "20px",
                    marginBottom:
                      "12px",
                  }}
                >
                  {
                    card.example
                  }
                </div>
              )}

              {card.exampleJapanese && (
                <div
                  style={{
                    fontSize:
                      "18px",
                    color:
                      colors.gray,
                  }}
                >
                  {
                    card.exampleJapanese
                  }
                            <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              speakWord(card.front);
            }}
            title="音声を再生"
            aria-label="音声を再生"
            style={{
              alignSelf: "center",
              marginTop: "24px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: `1px solid ${colors.blue}`,
              background: colors.white,
              color: colors.blueDark,
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >🔊
            
          </button>
                </div>
              )}
            </>
          )}
        </div>

        

        {showAnswer && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginTop: "25px",
      width: "100%",
    }}
  >
    {answerMode === "2" ? (
      <>
        <button
          type="button"
          onClick={() => void answerCard(false)}
          style={{
            minHeight: "70px",
            borderRadius: "16px",
            border: "none",
            background: colors.pink,
            color: colors.white,
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {tx("study.incorrect")}
        </button>

        <button
          type="button"
          onClick={() => void answerCard(true)}
          style={{
            minHeight: "70px",
            borderRadius: "16px",
            border: "none",
            background: colors.green,
            color: colors.white,
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {tx("study.correct")}
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={() => void answerCard(false, "weak", 1)}
          style={{
            minHeight: "80px",
            borderRadius: "16px",
            border: "none",
            background: colors.pink,
            color: colors.white,
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          苦手
          <div style={{ fontSize: "12px", marginTop: "5px" }}>
            明日復習
          </div>
        </button>

        <button
          type="button"
          onClick={() => void answerCard(false, "vague", 3)}
          style={{
            minHeight: "80px",
            borderRadius: "16px",
            border: "none",
            background: "#C49A62",
            color: colors.white,
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          うろ覚え
          <div style={{ fontSize: "12px", marginTop: "5px" }}>
            3日後復習
          </div>
        </button>

        <button
          type="button"
          onClick={() => void answerCard(true, "learned", 5)}
          style={{
            minHeight: "80px",
            borderRadius: "16px",
            border: "none",
            background: colors.green,
            color: colors.white,
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          覚えた
          <div style={{ fontSize: "12px", marginTop: "5px" }}>
            5日後復習
          </div>
        </button>

        <button
          type="button"
          onClick={() => void answerCard(true, "perfect", 7)}
          style={{
            minHeight: "80px",
            borderRadius: "16px",
            border: "none",
            background: colors.blue,
            color: colors.white,
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          簡単
          <div style={{ fontSize: "12px", marginTop: "5px" }}>
            7日後復習
          </div>
        </button>
      </>
    )}
  </div>
)}
      </main>
    );
  }


  // =========================================================
  // デッキ詳細
  // =========================================================

  if (deckOpen) {
    const deck =
      decks.find(
        (item) =>
          item.name ===
          currentDeck
      );

    if (!deck) {
      return null;
    }

    // -------------------------------------------------------
    // 検索
    // -------------------------------------------------------

    const normalizedSearch =
      cardSearch
        .trim()
        .toLowerCase();

    const filteredCards =
      normalizedSearch === ""
        ? deck.cards
        : deck.cards.filter(
            (card) => {
              const searchableText =
                [
                  card.front,
                  card.pinyin,
                  card.japanese,
                  card.example,
                  card.exampleJapanese,
                ]
                  .join(" ")
                  .toLowerCase();

              return searchableText.includes(
                normalizedSearch
              );
            }
          );

    return (
      <main
        style={{
          maxWidth:
            "600px",
          margin:
            "40px auto",
          padding:
            "20px",
        }}
      >
        <button
          onClick={() => {
            setDeckOpen(
              false
            );

            setCardSearch("");
          }}
          style={{
            marginBottom:
              "20px",
            padding:
              "8px 15px",
            border:
              "none",
            background:
              "transparent",
            color:
              colors.blueDark,
            fontWeight:
              "bold",
            cursor:
              "pointer",
            fontSize:
              "16px",
          }}
        >
          {tx("deck.back")}
        </button>

        <h1
          style={{
            color:
              colors.blueDark,
          }}
        >
          {currentDeck}
        </h1>

        <p
          style={{
            color:
              colors.gray,
          }}
        >
          {deck.cards.length} {tx("deck.cards")}
        </p>

<div
  style={{
    marginTop: "24px",
    padding: "18px",
    background: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
  }}
>
  <div
    style={{
      fontSize: "15px",
      fontWeight: "bold",
      marginBottom: "12px",
      color: colors.text,
    }}
  >
    回答方式
  </div>

  <div
    style={{
      display: "flex",
      gap: "10px",
    }}
  >
    <button
      type="button"
      onClick={() => setAnswerMode("2")}
      style={{
        flex: 1,
        padding: "13px 8px",
        borderRadius: "12px",
        border: `1px solid ${
          answerMode === "2"
            ? colors.blue
            : colors.border
        }`,
        background:
          answerMode === "2"
            ? colors.blue
            : colors.white,
        color:
          answerMode === "2"
            ? colors.white
            : colors.text,
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      2択
      <div style={{ fontSize: "12px", marginTop: "4px" }}>
        正解・不正解
      </div>
    </button>

    <button
      type="button"
      onClick={() => setAnswerMode("4")}
      style={{
        flex: 1,
        padding: "13px 8px",
        borderRadius: "12px",
        border: `1px solid ${
          answerMode === "4"
            ? colors.blue
            : colors.border
        }`,
        background:
          answerMode === "4"
            ? colors.blue
            : colors.white,
        color:
          answerMode === "4"
            ? colors.white
            : colors.text,
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      4択
      <div style={{ fontSize: "12px", marginTop: "4px" }}>
        習熟度で評価
      </div>
    </button>
  </div>
</div>
        <button
          onClick={
            startStudy
          }
          style={{
            display:
              "block",
            width:
              "100%",
            padding:
              "15px",
            marginTop:
              "20px",
            background:
              colors.blue,
            color:
              colors.white,
            border:
              "none",
            borderRadius:
              "20px",
            fontSize:
              "18px",
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          {tx("deck.start")}
        </button>

        <input
          ref={
            fileInputRef
          }
          type="file"
          accept=".csv,text/csv"
          onChange={
            importCSV
          }
          style={{
            display:
              "none",
          }}
        />

        <button
          onClick={
            openCSVPicker
          }
          style={{
            display:
              "block",
            width:
              "100%",
            padding:
              "15px",
            marginTop:
              "10px",
            background:
              colors.pinkLight,
            border:
              `2px solid ${colors.pink}`,
            color:
              colors.pinkDark,
            borderRadius:
              "20px",
            fontSize:
              "17px",
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          {tx("deck.csv")}
        </button>

        <button
          onClick={
            openAddCard
          }
          style={{
            display:
              "block",
            width:
              "100%",
            padding:
              "15px",
            marginTop:
              "10px",
            background:
              colors.blueLight,
            border:
              `2px solid ${colors.blue}`,
            color:
              colors.blueDark,
            borderRadius:
              "20px",
            fontSize:
              "17px",
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          {tx("deck.addWord")}
        </button>

        {/* 単語フォーム */}

        {showCardForm && (
          <div
            style={{
              marginTop:
                "25px",
              padding:
                "20px",
              background:
                colors.pinkLight,
              border:
                `2px solid ${colors.pink}`,
              borderRadius:
                "20px",
            }}
          >
            <h2
              style={{
                color:
                  colors.pinkDark,
                marginTop:
                  0,
              }}
            >
              {editingCardId
                ? tx("deck.editWord")
                : tx("deck.addWord")}
            </h2>

            <input
              placeholder={tx("deck.word")}
              value={
                cardFront
              }
              onChange={(e) =>
                setCardFront(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder={tx("deck.reading")}
              value={
                cardPinyin
              }
              onChange={(e) =>
                setCardPinyin(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder={tx("deck.translation")}
              value={
                cardJapanese
              }
              onChange={(e) =>
                setCardJapanese(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.pink}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder={tx("deck.example")}
              value={
                cardExample
              }
              onChange={(e) =>
                setCardExample(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder={tx("deck.exampleTranslation")}
              value={
                cardExampleJapanese
              }
              onChange={(e) =>
                setCardExampleJapanese(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "15px",
                border:
                  `2px solid ${colors.pink}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
              }}
            >
              <button
                onClick={
                  saveCard
                }
                style={{
                  flex:
                    1,
                  padding:
                    "13px",
                  background:
                    colors.blue,
                  color:
                    colors.white,
                  border:
                    "none",
                  borderRadius:
                    "15px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                {tx("deck.save")}
              </button>

              <button
                onClick={
                  closeCardForm
                }
                style={{
                  flex:
                    1,
                  padding:
                    "13px",
                  background:
                    colors.white,
                  color:
                    colors.gray,
                  border:
                    `2px solid ${colors.border}`,
                  borderRadius:
                    "15px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                {tx("common.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* 単語一覧 */}

        <div
          style={{
            marginTop:
              "35px",
          }}
        >
          <h2
            style={{
              color:
                colors.blueDark,
              marginBottom:
                "12px",
            }}
          >
            {tx("deck.list")}
          </h2>

          {/* 検索 */}

          {deck.cards.length >
            0 && (
            <div
              style={{
                marginBottom:
                  "18px",
              }}
            >
              <input
                type="text"
                placeholder={tx("deck.search")}
                value={
                  cardSearch
                }
                onChange={(e) =>
                  setCardSearch(
                    e.target.value
                  )
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "14px 16px",
                  boxSizing:
                    "border-box",
                  border:
                    `2px solid ${colors.blue}`,
                  borderRadius:
                    "14px",
                  fontSize:
                    "17px",
                  outline:
                    "none",
                  background:
                    colors.white,
                }}
              />

              {cardSearch.trim() && (
                <div
                  style={{
                    marginTop:
                      "8px",
                    fontSize:
                      "14px",
                    color:
                      colors.gray,
                  }}
                >
                  {
                    filteredCards.length
                  }
                  {" "}{tx("deck.found")}
                </div>
              )}
            </div>
          )}

          {deck.cards.length ===
          0 ? (
            <div
              style={{
                padding:
                  "30px 15px",
                textAlign:
                  "center",
                background:
                  colors.blueLight,
                borderRadius:
                  "18px",
                color:
                  colors.gray,
              }}
            >
              {tx("deck.empty")}
            </div>
          ) : filteredCards.length ===
            0 ? (
            <div
              style={{
                padding:
                  "30px 15px",
                textAlign:
                  "center",
                background:
                  colors.pinkLight,
                borderRadius:
                  "18px",
                color:
                  colors.gray,
              }}
            >
              {tx("deck.noMatchStart")}{cardSearch}{tx("deck.noMatchEnd")}
              <br />

              <button
                onClick={() =>
                  setCardSearch(
                    ""
                  )
                }
                style={{
                  marginTop:
                    "12px",
                  padding:
                    "8px 16px",
                  background:
                    colors.white,
                  border:
                    `1px solid ${colors.pink}`,
                  borderRadius:
                    "10px",
                  color:
                    colors.pinkDark,
                  cursor:
                    "pointer",
                }}
              >
                {tx("deck.clearSearch")}
              </button>
            </div>
          ) : (
            filteredCards.map(
              (card, index) => (
                <div
                  key={
                    card.id
                  }
                  style={{
                    marginBottom:
                      "12px",
                    padding:
                      "15px",
                    background:
                      colors.white,
                    border:
                      `2px solid ${
                        index % 2 ===
                        0
                          ? colors.blue
                          : colors.pink
                      }`,
                    borderRadius:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap:
                        "10px",
                    }}
                  >
                    <div
                      style={{
                        flex:
                          1,
                        minWidth:
                          0,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "21px",
                          fontWeight:
                            "bold",
                          color:
                            colors.dark,
                          marginBottom:
                            "5px",
                        }}
                      >
                        {
                          card.front
                        }
                      </div>

                      {card.pinyin && (
                        <div
                          style={{
                            color:
                              colors.gray,
                            marginBottom:
                              "4px",
                          }}
                        >
                          {
                            card.pinyin
                          }
                        </div>
                      )}

                      {card.japanese && (
                        <div
                          style={{
                            fontSize:
                              "17px",
                          }}
                        >
                          {
                            card.japanese
                          }
                        </div>
                      )}

                      {card.example && (
                        <div
                          style={{
                            marginTop:
                              "8px",
                            fontSize:
                              "14px",
                            color:
                              colors.gray,
                          }}
                        >
                          {
                            card.example
                          }
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap:
                          "6px",
                      }}
                    >
                      <button
                        onClick={() =>
                          openEditCard(
                            card
                          )
                        }
                        style={{
                          padding:
                            "8px 12px",
                          background:
                            colors.blueLight,
                          border:
                            `1px solid ${colors.blue}`,
                          color:
                            colors.blueDark,
                          borderRadius:
                            "10px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {tx("deck.edit")}
                      </button>

                      <button
                        onClick={() =>
                          deleteCard(
                            card.id
                          )
                        }
                        style={{
                          padding:
                            "8px 12px",
                          background:
                            colors.pinkLight,
                          border:
                            `1px solid ${colors.pink}`,
                          color:
                            colors.pinkDark,
                          borderRadius:
                            "10px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {tx("deck.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </main>
    );
  }

  // =========================================================
  // デッキ一覧
  // =========================================================

    return (
    <main
      className="anki-home"
      style={{
        maxWidth:
          "600px",
        margin:
          "40px auto",
        padding:
          "20px",
      }}
    >

      <div id="deck-management" style={{ scrollMarginTop: "28px", margin: "28px 0 16px", padding: "18px 18px 6px", borderTop: "1px solid #E5E9E2" }}>
        <p style={{ margin: 0, color: "#7B847A", fontSize: "10px", fontWeight: 750, letterSpacing: ".14em" }}>YOUR LIBRARY</p>
        <h2 style={{ margin: "7px 0 0", fontSize: "21px", letterSpacing: "-.04em", color: "#252824" }}>{tx("deck.manage")}</h2>
        <p style={{ margin: "7px 0 0", color: "#858780", fontSize: "12px", lineHeight: 1.7 }}>{tx("deck.description")}</p>
      </div>

      {/* フォルダ */}

      {folders.map(
        (folder) => (
          <div
            key={
              folder.id
            }
            style={{
              border:
                `2px solid ${colors.blue}`,
              borderRadius:
                "18px",
              padding:
                "15px",
              marginBottom:
                "15px",
              background:
                colors.blueLight,
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "10px",
              }}
            >
              <h2
                style={{
                  margin:
                    0,
                }}
              >
                {
                  folder.name
                }
              </h2>

              <button
                onClick={() =>
                  deleteFolder(
                    folder.id
                  )
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  color:
                    colors.pinkDark,
                  cursor:
                    "pointer",
                }}
              >
                {tx("deck.delete")}
              </button>
            </div>

            {decks
              .filter(
                (deck) =>
                  deck.folderId ===
                  folder.id
              )
              .map(
                (deck) => (
                  <div
                    key={
                      deck.name
                    }
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      marginBottom:
                        "8px",
                    }}
                  >
                    <button
                      onClick={() => {
                        setCurrentDeck(
                          deck.name
                        );

                        setDeckOpen(
                          true
                        );
                      }}
                      style={{
                        flex:
                          1,
                        padding:
                          "15px",
                        textAlign:
                          "left",
                        background:
                          colors.white,
                        border:
                          `2px solid ${colors.pink}`,
                        borderRadius:
                          "12px",
                        cursor:
                          "pointer",
                      }}
                    >
                      {
                        deck.name
                      }

                      <span
                        style={{
                          marginLeft:
                            "10px",
                          fontSize:
                            "14px",
                          color:
                            colors.gray,
                        }}
                      >
                        {
                          deck
                            .cards
                            .length
                        }
                        {tx("deck.cards")}
                      </span>
                    </button>

                    <select
                      value={
                        deck.folderId ||
                        ""
                      }
                      onChange={(
                        e
                      ) =>
                        moveDeck(
                          deck.name,
                          e.target
                            .value ||
                            null
                        )
                      }
                      style={{
                        marginLeft:
                          "8px",
                      }}
                    >
                      <option value="">
                        {tx("folder.uncategorized")}
                      </option>

                      {folders.map(
                        (
                          folderItem
                        ) => (
                          <option
                            key={
                              folderItem.id
                            }
                            value={
                              folderItem.id
                            }
                          >
                            {
                              folderItem.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <button
                      onClick={() =>
                        deleteDeck(
                          deck.name
                        )
                      }
                      style={{
                        marginLeft:
                          "8px",
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          colors.pinkDark,
                        cursor:
                          "pointer",
                      }}
                    >
                      {tx("deck.delete")}
                    </button>
                  </div>
                )
              )}
          </div>
        )
      )}

      {/* 未分類 */}

      {decks.some(
        (deck) =>
          deck.folderId ===
          null
      ) && (
        <div
          style={{
            border:
              `2px solid ${colors.pink}`,
            borderRadius:
              "18px",
            padding:
              "15px",
            marginBottom:
              "20px",
            background:
              colors.pinkLight,
          }}
        >
          <h2>
            {tx("folder.uncategorized")}
          </h2>

          {decks
            .filter(
              (deck) =>
                deck.folderId ===
                null
            )
            .map(
              (deck) => (
                <div
                  key={
                    deck.name
                  }
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    marginBottom:
                      "8px",
                  }}
                >
                  <button
                    onClick={() => {
                      setCurrentDeck(
                        deck.name
                      );

                      setDeckOpen(
                        true
                      );
                    }}
                    style={{
                      flex:
                        1,
                      padding:
                        "15px",
                      textAlign:
                        "left",
                      background:
                        colors.white,
                      border:
                        `2px solid ${colors.blue}`,
                      borderRadius:
                        "12px",
                      cursor:
                        "pointer",
                    }}
                  >
                    {
                      deck.name
                    }{" "}
                    {
                      deck
                        .cards
                        .length
                    }
                    {tx("deck.cards")}
                  </button>

                  <select
                    value={
                      deck.folderId ||
                      ""
                    }
                    onChange={(
                      e
                    ) =>
                      moveDeck(
                        deck.name,
                        e.target
                          .value ||
                          null
                      )
                    }
                    style={{
                      marginLeft:
                        "8px",
                    }}
                  >
                    <option value="">
                      {tx("folder.move")}
                    </option>

                    {folders.map(
                      (
                        folderItem
                      ) => (
                        <option
                          key={
                            folderItem.id
                          }
                          value={
                            folderItem.id
                          }
                        >
                          {
                            folderItem.name
                          }
                        </option>
                      )
                    )}
                  </select>

                  <button
                    onClick={() =>
                      deleteDeck(
                        deck.name
                      )
                    }
                    style={{
                      marginLeft:
                        "8px",
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        colors.pinkDark,
                      cursor:
                        "pointer",
                    }}
                  >
                    {tx("deck.delete")}
                  </button>
                </div>
              )
            )}
        </div>
      )}

      {/* 新しいフォルダ */}

      <h2>
        {tx("folder.new")}
      </h2>

      <input
        placeholder={tx("folder.example")}
        value={
          newFolderName
        }
        onChange={(e) =>
          setNewFolderName(
            e.target.value
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          boxSizing:
            "border-box",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.blue}`,
          borderRadius:
            "12px",
        }}
      />

      <button
        onClick={
          addFolder
        }
        style={{
          padding:
            "12px 30px",
          background:
            colors.pink,
          color:
            colors.white,
          border:
            "none",
          borderRadius:
            "20px",
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        {tx("folder.create")}
      </button>

      {/* 新しいデッキ */}

      <h2>
        {tx("deck.new")}
      </h2>

      <input
        placeholder={tx("deck.exampleName")}
        value={
          newDeckName
        }
        onChange={(e) =>
          setNewDeckName(
            e.target.value
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          boxSizing:
            "border-box",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.pink}`,
          borderRadius:
            "12px",
        }}
      />

      <select
        value={
          newDeckLanguage
        }
        onChange={(e) =>
          setNewDeckLanguage(
            e.target.value
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.blue}`,
          borderRadius:
            "12px",
        }}
      >
        



<option value="zh-CN">{tx("language.zhCN")}</option>
<option value="zh-TW">{tx("language.zhTW")}</option>
<option value="de-DE">{tx("language.de")}</option>
<option value="es-ES">{tx("language.es")}</option>
<option value="it-IT">{tx("language.it")}</option>
<option value="ja-JP">{tx("language.ja")}</option>
<option value="ko-KR">{tx("language.ko")}</option>
<option value="nl-NL">{tx("language.nl")}</option>
<option value="da-DK">{tx("language.da")}</option>
<option value="fr-FR">{tx("language.fr")}</option>
<option value="pt-PT">{tx("language.ptPT")}</option>
<option value="pt-BR">{tx("language.ptBR")}</option>
<option value="vi-VN">{tx("language.vi")}</option>
<option value="sv-SE">{tx("language.sv")}</option>
<option value="nb-NO">{tx("language.nb")}</option>
<option value="id-ID">{tx("language.id")}</option>
<option value="tr-TR">{tx("language.tr")}</option>
<option value="pl-PL">{tx("language.pl")}</option>
<option value="ru-RU">{tx("language.ru")}</option>
<option value="el-GR">{tx("language.el")}</option>
<option value="th-TH">{tx("language.th")}</option>
<option value="cs-CZ">{tx("language.cs")}</option>
<option value="ro-RO">{tx("language.ro")}</option>
<option value="hi-IN">{tx("language.hi")}</option>
<option value="ar-SA">{tx("language.ar")}</option>






        
      </select>

      <select
        value={
          newDeckFolderId ||
          ""
        }
        onChange={(e) =>
          setNewDeckFolderId(
            e.target
              .value ||
              null
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.blue}`,
          borderRadius:
            "12px",
        }}
      >
        <option value="">
          {tx("deck.noFolder")}
        </option>

        {folders.map(
          (folder) => (
            <option
              key={
                folder.id
              }
              value={
                folder.id
              }
            >
              {
                folder.name
              }
            </option>
          )
        )}
      </select>

      <button
        onClick={
          addDeck
        }
        style={{
          padding:
            "12px 30px",
          background:
            colors.blue,
          color:
            colors.white,
          border:
            "none",
          borderRadius:
            "20px",
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        {tx("deck.create")}
      </button>
    </main>
  );
}
