"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppLanguage } from "@/app/component/AppLanguage";
import "./reading-sanctuary.css";

const BOOKS_KEY = "little-library-books-v1";
const READING_KEY = "reading-sanctuary-progress-v1";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const categories = [
  "語学",
  "小説",
  "教養",
  "歴史",
  "実用書",
  "漫画",
  "その他",
] as const;

const statuses = ["未読", "読書中", "読了"] as const;

type Category = (typeof categories)[number];
type ReadingStatus = (typeof statuses)[number];

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  totalPages: number;
  category: Category;
  status: ReadingStatus;
};

type ReadingProgress = {
  bookId: number;
  currentPage: number;
  pagesRead: number;
  totalMinutes: number;
};

const translations: Record<Language, any> = {
  ja: {
    loading: "図書館の扉を開いています……",
    subtitle: "一冊読むたびに、あなたの図書館が育っていく。",
    libraryLevel: "LIBRARY LEVEL",
    roomLabel: "THE GRAND LIBRARY",
    everyPage: "EVERY PAGE",
    opensDoor: "opens a door",
    established: "EST. BY YOUR CURIOSITY",
    growingBookshelf: "育っていく本棚",
    booksCompleted: "BOOKS COMPLETED",
    firstBook: "最初の一冊を読み終えると、本棚が育ち始めます。",
    firstLight: (n: number) =>
      `読了した本は${n}冊。図書館に最初の光が宿りました。`,
    growingLight: (n: number) =>
      `${n}冊読了！本棚が少しずつ輝きを増しています。`,
    magicalLight: (n: number) =>
      `${n}冊読了！図書館に魔法の光が広がっています。`,
    richLibrary: (n: number) =>
      `${n}冊以上読了！あなたの図書館が豊かに育ちました。`,
    journey: "YOUR JOURNEY",
    growthRecord: "図書館の成長記録",
    nextLevel: (n: number) => `次のレベルまであと ${n} XP`,
    pagesRead: "読んだページ",
    readingTime: "読書時間",
    booksRead: "読了した本",
    pages: "ページ",
    minutes: "分",
    books: "冊",
    bookDetails: "BOOK DETAILS",
    editBook: "本の情報を編集",
    addBook: "本を本棚に迎える",
    editDescription: "内容を変更して、下の保存ボタンを押してください。",
    addDescription: "新しい本を登録します。タイトルを入力して追加してください。",
    bookTitle: "本のタイトル",
    author: "著者",
    isbn: "ISBN",
    totalPages: "総ページ数",
    category: "分類",
    readingStatus: "読書状況",
    titlePlaceholder: "本のタイトルを入力",
    authorPlaceholder: "著者名（任意）",
    isbnPlaceholder: "ISBN（任意）",
    pagePlaceholder: "例：320",
    saveChanges: "変更を保存する",
    addBookButton: "本を登録して本棚に追加",
    cancel: "キャンセル",
    readingMoment: "A LITTLE MOMENT",
    recordToday: "今日の読書を記録",
    recordDescription: "読んだ本・ページ数・時間を入力して、読書の成果を保存します。",
    noBooks: "読書を記録するには、まず本を登録してください。",
    registerBook: "本を登録する",
    readBook: "読んだ本",
    selectBook: "▼ 記録する本を選択",
    recordTarget: (title: string) => `✓ 「${title}」を記録します`,
    pagesThisTime: "今回読んだページ数",
    pagesThisTimeHint: "今回読んだ分",
    readingMinutes: "読書時間（分）",
    minuteRange: "1〜1440分",
    recordButton: "この内容で読書を記録",
    collection: "YOUR COLLECTION",
    bookshelf: "本棚の本たち",
    filterBooks: "本を絞り込む",
    all: "すべて",
    emptyFirstTitle: "最初の一冊を迎えよう。",
    emptyFirstDescription: "「本を本棚に迎える」から登録できます。",
    emptyCategoryTitle: "この分類には本がありません。",
    emptyCategoryDescription: "別の分類を選ぶと、登録した本を確認できます。",
    firstBookButton: "最初の本を登録する",
    authorNotRegistered: "著者未登録",
    unread: "未読",
    reading: "読書中",
    completed: "読了",
    allPages: (n: string) => `全 ${n} ページ`,
    cumulative: (n: string) => `累計 ${n} 分`,
    recordedPages: (n: string) => `記録済み ${n} ページ`,
    currentPage: "ページ",
    readThisBook: "この本を読む",
    selectedForRecord: "記録対象に選択中",
    finished: "読了しました",
    edit: "編集",
    delete: "削除",
    footer: "急がなくていい。一ページずつ、あなたの世界を広げよう。",
    titleRequired: "本のタイトルを入力してください。",
    pageCountInvalid: "総ページ数は0以上の整数で入力してください。",
    bookUpdated: "✓ 本の情報を更新しました。",
    bookAdded: "✦ 新しい本を本棚に追加しました。",
    editCancelled: "編集をキャンセルしました。",
    deleteConfirm: (title: string) =>
      `「${title}」と読書記録を削除しますか？`,
    bookDeleted: "本と読書記録を削除しました。",
    bookRequired: "記録する本を選択してください。",
    alreadyCompleted: "この本は読了済みです。",
    readingInputInvalid:
      "ページ数は0以上、読書時間は1〜1440分で入力してください。",
    readingCompleted: (title: string) => `✦「${title}」を読了しました！`,
    readingRecorded: (pages: number, minutes: number) =>
      `✓ ${pages}ページ・${minutes}分を記録しました。`,
    selectedBook: (title: string) =>
      `「${title}」を記録対象に選びました。ページ数と時間を入力してください。`,
    storageError: "保存できませんでした。ブラウザの空き容量を確認してください。",
    categories: {
      語学: "語学",
      小説: "小説",
      教養: "教養",
      歴史: "歴史",
      実用書: "実用書",
      漫画: "漫画",
      その他: "その他",
    },
    statuses: {
      未読: "未読",
      読書中: "読書中",
      読了: "読了",
    },
  },

  de: {
    loading: "Die Türen der Bibliothek werden geöffnet …",
    subtitle: "Mit jedem gelesenen Buch wächst deine Bibliothek.",
    libraryLevel: "BIBLIOTHEKSLEVEL",
    roomLabel: "DIE GROSSE BIBLIOTHEK",
    everyPage: "JEDE SEITE",
    opensDoor: "öffnet eine Tür",
    established: "GEWACHSEN DURCH DEINE NEUGIER",
    growingBookshelf: "Dein wachsendes Bücherregal",
    booksCompleted: "BÜCHER ABGESCHLOSSEN",
    firstBook: "Wenn du dein erstes Buch beendet hast, beginnt dein Bücherregal zu wachsen.",
    firstLight: (n: number) =>
      `${n} ${n === 1 ? "Buch gelesen" : "Bücher gelesen"}. Das erste Licht ist in deiner Bibliothek erschienen.`,
    growingLight: (n: number) =>
      `${n} Bücher gelesen! Dein Bücherregal beginnt allmählich zu leuchten.`,
    magicalLight: (n: number) =>
      `${n} Bücher gelesen! Magisches Licht erfüllt deine Bibliothek.`,
    richLibrary: (n: number) =>
      `${n} oder mehr Bücher gelesen! Deine Bibliothek ist prächtig gewachsen.`,
    journey: "DEINE REISE",
    growthRecord: "Das Wachstum deiner Bibliothek",
    nextLevel: (n: number) => `Noch ${n} XP bis zum nächsten Level`,
    pagesRead: "Gelesene Seiten",
    readingTime: "Lesezeit",
    booksRead: "Abgeschlossene Bücher",
    pages: "Seiten",
    minutes: "Min.",
    books: "Bücher",
    bookDetails: "BUCHDETAILS",
    editBook: "Buchinformationen bearbeiten",
    addBook: "Ein Buch ins Regal stellen",
    editDescription: "Ändere die Angaben und klicke anschließend auf Speichern.",
    addDescription: "Füge ein neues Buch hinzu. Gib dazu den Titel ein.",
    bookTitle: "Buchtitel",
    author: "Autor/in",
    isbn: "ISBN",
    totalPages: "Seitenzahl",
    category: "Kategorie",
    readingStatus: "Lesestatus",
    titlePlaceholder: "Buchtitel eingeben",
    authorPlaceholder: "Name des Autors (optional)",
    isbnPlaceholder: "ISBN (optional)",
    pagePlaceholder: "z. B. 320",
    saveChanges: "Änderungen speichern",
    addBookButton: "Buch hinzufügen",
    cancel: "Abbrechen",
    readingMoment: "EIN KLEINER MOMENT",
    recordToday: "Heutige Lektüre festhalten",
    recordDescription: "Gib das Buch, die Seitenzahl und die Lesezeit ein, um deinen Fortschritt zu speichern.",
    noBooks: "Um deine Lektüre festzuhalten, füge zuerst ein Buch hinzu.",
    registerBook: "Buch hinzufügen",
    readBook: "Gelesenes Buch",
    selectBook: "▼ Buch auswählen",
    recordTarget: (title: string) => `✓ „${title}“ wird erfasst`,
    pagesThisTime: "Diesmal gelesene Seiten",
    pagesThisTimeHint: "Seiten dieser Leseeinheit",
    readingMinutes: "Lesezeit (Min.)",
    minuteRange: "1–1440 Minuten",
    recordButton: "Lektüre speichern",
    collection: "DEINE SAMMLUNG",
    bookshelf: "Deine Bücher",
    filterBooks: "Bücher filtern",
    all: "Alle",
    emptyFirstTitle: "Heiße dein erstes Buch willkommen.",
    emptyFirstDescription: "Du kannst es unter „Ein Buch ins Regal stellen“ hinzufügen.",
    emptyCategoryTitle: "In dieser Kategorie gibt es noch keine Bücher.",
    emptyCategoryDescription: "Wähle eine andere Kategorie, um deine Bücher anzusehen.",
    firstBookButton: "Erstes Buch hinzufügen",
    authorNotRegistered: "Autor/in nicht angegeben",
    unread: "Ungelesen",
    reading: "Wird gelesen",
    completed: "Gelesen",
    allPages: (n: string) => `Insgesamt ${n} Seiten`,
    cumulative: (n: string) => `Insgesamt ${n} Min.`,
    recordedPages: (n: string) => `${n} Seiten erfasst`,
    currentPage: "Seiten",
    readThisBook: "Dieses Buch lesen",
    selectedForRecord: "Zur Erfassung ausgewählt",
    finished: "Abgeschlossen",
    edit: "Bearbeiten",
    delete: "Löschen",
    footer: "Du musst dich nicht beeilen. Erweitere deine Welt Seite für Seite.",
    titleRequired: "Bitte gib einen Buchtitel ein.",
    pageCountInvalid: "Die Seitenzahl muss eine ganze Zahl von mindestens 0 sein.",
    bookUpdated: "✓ Die Buchinformationen wurden aktualisiert.",
    bookAdded: "✦ Ein neues Buch wurde deinem Regal hinzugefügt.",
    editCancelled: "Die Bearbeitung wurde abgebrochen.",
    deleteConfirm: (title: string) =>
      `Möchtest du „${title}“ und den Lesefortschritt löschen?`,
    bookDeleted: "Das Buch und der Lesefortschritt wurden gelöscht.",
    bookRequired: "Bitte wähle ein Buch aus.",
    alreadyCompleted: "Dieses Buch wurde bereits abgeschlossen.",
    readingInputInvalid:
      "Die Seitenzahl muss mindestens 0 und die Lesezeit zwischen 1 und 1440 Minuten liegen.",
    readingCompleted: (title: string) => `✦ „${title}“ wurde abgeschlossen!`,
    readingRecorded: (pages: number, minutes: number) =>
      `✓ ${pages} Seiten und ${minutes} Min. wurden erfasst.`,
    selectedBook: (title: string) =>
      `„${title}“ wurde zur Erfassung ausgewählt. Gib die Seitenzahl und die Lesezeit ein.`,
    storageError: "Speichern fehlgeschlagen. Bitte überprüfe den verfügbaren Speicherplatz deines Browsers.",
    categories: {
      語学: "Sprachen",
      小説: "Roman",
      教養: "Allgemeinbildung",
      歴史: "Geschichte",
      実用書: "Sachbuch",
      漫画: "Manga",
      その他: "Sonstiges",
    },
    statuses: {
      未読: "Ungelesen",
      読書中: "Wird gelesen",
      読了: "Gelesen",
    },
  },

  en: {
    loading: "Opening the doors to your library…",
    subtitle: "Your library grows with every book you read.",
    libraryLevel: "LIBRARY LEVEL",
    roomLabel: "THE GRAND LIBRARY",
    everyPage: "EVERY PAGE",
    opensDoor: "opens a door",
    established: "EST. BY YOUR CURIOSITY",
    growingBookshelf: "Your Growing Bookshelf",
    booksCompleted: "BOOKS COMPLETED",
    firstBook: "Finish your first book to watch your bookshelf begin to grow.",
    firstLight: (n: number) =>
      `${n} ${n === 1 ? "book completed" : "books completed"}. The first light has appeared in your library.`,
    growingLight: (n: number) =>
      `${n} books completed! Your bookshelf is gradually beginning to shine.`,
    magicalLight: (n: number) =>
      `${n} books completed! Magical light is spreading throughout your library.`,
    richLibrary: (n: number) =>
      `${n} or more books completed! Your library has grown beautifully.`,
    journey: "YOUR JOURNEY",
    growthRecord: "Your Library's Growth",
    nextLevel: (n: number) => `${n} XP to the next level`,
    pagesRead: "Pages Read",
    readingTime: "Reading Time",
    booksRead: "Books Completed",
    pages: "pages",
    minutes: "min",
    books: "books",
    bookDetails: "BOOK DETAILS",
    editBook: "Edit Book Details",
    addBook: "Welcome a Book to Your Shelf",
    editDescription: "Make your changes and press the save button below.",
    addDescription: "Add a new book by entering its title.",
    bookTitle: "Book Title",
    author: "Author",
    isbn: "ISBN",
    totalPages: "Total Pages",
    category: "Category",
    readingStatus: "Reading Status",
    titlePlaceholder: "Enter the book title",
    authorPlaceholder: "Author's name (optional)",
    isbnPlaceholder: "ISBN (optional)",
    pagePlaceholder: "e.g. 320",
    saveChanges: "Save Changes",
    addBookButton: "Add Book to Bookshelf",
    cancel: "Cancel",
    readingMoment: "A LITTLE MOMENT",
    recordToday: "Record Today's Reading",
    recordDescription: "Enter the book, pages read, and time spent to save your reading progress.",
    noBooks: "Add a book first to start recording your reading.",
    registerBook: "Add a Book",
    readBook: "Book Read",
    selectBook: "▼ Select a book",
    recordTarget: (title: string) => `✓ Recording "${title}"`,
    pagesThisTime: "Pages Read This Time",
    pagesThisTimeHint: "Pages read in this session",
    readingMinutes: "Reading Time (minutes)",
    minuteRange: "1–1440 minutes",
    recordButton: "Save Reading Record",
    collection: "YOUR COLLECTION",
    bookshelf: "Your Bookshelf",
    filterBooks: "Filter Books",
    all: "All",
    emptyFirstTitle: "Welcome your first book.",
    emptyFirstDescription: "You can add it from “Welcome a Book to Your Shelf.”",
    emptyCategoryTitle: "There are no books in this category.",
    emptyCategoryDescription: "Choose another category to see your registered books.",
    firstBookButton: "Add Your First Book",
    authorNotRegistered: "Author not specified",
    unread: "Unread",
    reading: "Reading",
    completed: "Completed",
    allPages: (n: string) => `${n} pages in total`,
    cumulative: (n: string) => `${n} min total`,
    recordedPages: (n: string) => `${n} pages recorded`,
    currentPage: "pages",
    readThisBook: "Read This Book",
    selectedForRecord: "Selected for recording",
    finished: "Completed",
    edit: "Edit",
    delete: "Delete",
    footer: "There's no need to rush. Expand your world, one page at a time.",
    titleRequired: "Please enter a book title.",
    pageCountInvalid: "Total pages must be a whole number of 0 or greater.",
    bookUpdated: "✓ Book details updated.",
    bookAdded: "✦ A new book has been added to your bookshelf.",
    editCancelled: "Editing cancelled.",
    deleteConfirm: (title: string) =>
      `Delete "${title}" and its reading records?`,
    bookDeleted: "The book and its reading records have been deleted.",
    bookRequired: "Please select a book to record.",
    alreadyCompleted: "This book has already been completed.",
    readingInputInvalid:
      "Pages must be 0 or more, and reading time must be between 1 and 1440 minutes.",
    readingCompleted: (title: string) => `✦ You finished "${title}"!`,
    readingRecorded: (pages: number, minutes: number) =>
      `✓ Recorded ${pages} pages and ${minutes} minutes.`,
    selectedBook: (title: string) =>
      `"${title}" selected for recording. Enter the pages and time you read.`,
    storageError: "Unable to save. Please check your browser's available storage.",
    categories: {
      語学: "Languages",
      小説: "Fiction",
      教養: "General Knowledge",
      歴史: "History",
      実用書: "Non-fiction",
      漫画: "Manga",
      その他: "Other",
    },
    statuses: {
      未読: "Unread",
      読書中: "Reading",
      読了: "Completed",
    },
  },

  "zh-CN": {
    loading: "正在开启图书馆的大门……",
    subtitle: "每读完一本书，你的图书馆就会成长一点。",
    libraryLevel: "图书馆等级",
    roomLabel: "宏伟图书馆",
    everyPage: "每一页",
    opensDoor: "都会打开一扇门",
    established: "由你的好奇心建立",
    growingBookshelf: "不断成长的书架",
    booksCompleted: "已读完的书籍",
    firstBook: "读完第一本书后，书架就会开始成长。",
    firstLight: (n: number) => `已读完${n}本书。图书馆迎来了第一道光。`,
    growingLight: (n: number) => `已读完${n}本书！书架正逐渐闪耀起来。`,
    magicalLight: (n: number) => `已读完${n}本书！魔法般的光芒正在图书馆中蔓延。`,
    richLibrary: (n: number) => `已读完${n}本以上的书！你的图书馆变得更加丰富了。`,
    journey: "你的旅程",
    growthRecord: "图书馆成长记录",
    nextLevel: (n: number) => `距离下一级还差 ${n} XP`,
    pagesRead: "已读页数",
    readingTime: "阅读时间",
    booksRead: "已读完的书",
    pages: "页",
    minutes: "分钟",
    books: "本",
    bookDetails: "书籍信息",
    editBook: "编辑书籍信息",
    addBook: "将一本书加入书架",
    editDescription: "修改内容后，请点击下方的保存按钮。",
    addDescription: "添加新书。请输入书名。",
    bookTitle: "书名",
    author: "作者",
    isbn: "ISBN",
    totalPages: "总页数",
    category: "分类",
    readingStatus: "阅读状态",
    titlePlaceholder: "请输入书名",
    authorPlaceholder: "作者姓名（选填）",
    isbnPlaceholder: "ISBN（选填）",
    pagePlaceholder: "例如：320",
    saveChanges: "保存修改",
    addBookButton: "添加到书架",
    cancel: "取消",
    readingMoment: "阅读时光",
    recordToday: "记录今天的阅读",
    recordDescription: "输入书名、阅读页数和时间，保存你的阅读成果。",
    noBooks: "请先添加书籍，然后再记录阅读情况。",
    registerBook: "添加书籍",
    readBook: "阅读的书籍",
    selectBook: "▼ 选择要记录的书籍",
    recordTarget: (title: string) => `✓ 正在记录《${title}》`,
    pagesThisTime: "本次阅读页数",
    pagesThisTimeHint: "本次阅读的页数",
    readingMinutes: "阅读时间（分钟）",
    minuteRange: "1～1440分钟",
    recordButton: "保存阅读记录",
    collection: "你的收藏",
    bookshelf: "书架上的书",
    filterBooks: "筛选书籍",
    all: "全部",
    emptyFirstTitle: "迎接你的第一本书吧。",
    emptyFirstDescription: "可以通过“将一本书加入书架”来添加。",
    emptyCategoryTitle: "这个分类中还没有书籍。",
    emptyCategoryDescription: "选择其他分类即可查看已添加的书籍。",
    firstBookButton: "添加第一本书",
    authorNotRegistered: "未填写作者",
    unread: "未读",
    reading: "阅读中",
    completed: "已读完",
    allPages: (n: string) => `共 ${n} 页`,
    cumulative: (n: string) => `累计 ${n} 分钟`,
    recordedPages: (n: string) => `已记录 ${n} 页`,
    currentPage: "页",
    readThisBook: "阅读这本书",
    selectedForRecord: "已选为记录对象",
    finished: "已读完",
    edit: "编辑",
    delete: "删除",
    footer: "不必着急。每读一页，你的世界就会更加宽广。",
    titleRequired: "请输入书名。",
    pageCountInvalid: "总页数必须是大于或等于0的整数。",
    bookUpdated: "✓ 书籍信息已更新。",
    bookAdded: "✦ 新书已添加到书架。",
    editCancelled: "已取消编辑。",
    deleteConfirm: (title: string) => `要删除《${title}》及其阅读记录吗？`,
    bookDeleted: "书籍及其阅读记录已删除。",
    bookRequired: "请选择要记录的书籍。",
    alreadyCompleted: "这本书已经读完了。",
    readingInputInvalid: "页数必须大于或等于0，阅读时间必须为1～1440分钟。",
    readingCompleted: (title: string) => `✦ 你读完《${title}》了！`,
    readingRecorded: (pages: number, minutes: number) =>
      `✓ 已记录${pages}页、${minutes}分钟。`,
    selectedBook: (title: string) =>
      `已选择《${title}》作为记录对象。请输入阅读页数和时间。`,
    storageError: "保存失败。请检查浏览器的可用存储空间。",
    categories: {
      語学: "语言学习",
      小説: "小说",
      教養: "通识",
      歴史: "历史",
      実用書: "实用书",
      漫画: "漫画",
      その他: "其他",
    },
    statuses: {
      未読: "未读",
      読書中: "阅读中",
      読了: "已读完",
    },
  },

  "zh-TW": {
    loading: "正在開啟圖書館的大門……",
    subtitle: "每讀完一本書，你的圖書館就會成長一點。",
    libraryLevel: "圖書館等級",
    roomLabel: "宏偉圖書館",
    everyPage: "每一頁",
    opensDoor: "都會打開一扇門",
    established: "由你的好奇心建立",
    growingBookshelf: "持續成長的書架",
    booksCompleted: "已讀完的書籍",
    firstBook: "讀完第一本書後，書架就會開始成長。",
    firstLight: (n: number) => `已讀完${n}本書。圖書館迎來了第一道光。`,
    growingLight: (n: number) => `已讀完${n}本書！書架正逐漸閃耀起來。`,
    magicalLight: (n: number) => `已讀完${n}本書！魔法般的光芒正在圖書館中蔓延。`,
    richLibrary: (n: number) => `已讀完${n}本以上的書！你的圖書館變得更加豐富了。`,
    journey: "你的旅程",
    growthRecord: "圖書館成長紀錄",
    nextLevel: (n: number) => `距離下一級還差 ${n} XP`,
    pagesRead: "已讀頁數",
    readingTime: "閱讀時間",
    booksRead: "已讀完的書",
    pages: "頁",
    minutes: "分鐘",
    books: "本",
    bookDetails: "書籍資訊",
    editBook: "編輯書籍資訊",
    addBook: "將一本書加入書架",
    editDescription: "修改內容後，請點擊下方的儲存按鈕。",
    addDescription: "新增書籍。請輸入書名。",
    bookTitle: "書名",
    author: "作者",
    isbn: "ISBN",
    totalPages: "總頁數",
    category: "分類",
    readingStatus: "閱讀狀態",
    titlePlaceholder: "請輸入書名",
    authorPlaceholder: "作者姓名（選填）",
    isbnPlaceholder: "ISBN（選填）",
    pagePlaceholder: "例如：320",
    saveChanges: "儲存修改",
    addBookButton: "新增至書架",
    cancel: "取消",
    readingMoment: "閱讀時光",
    recordToday: "記錄今天的閱讀",
    recordDescription: "輸入書名、閱讀頁數和時間，儲存你的閱讀成果。",
    noBooks: "請先新增書籍，再記錄閱讀情況。",
    registerBook: "新增書籍",
    readBook: "閱讀的書籍",
    selectBook: "▼ 選擇要記錄的書籍",
    recordTarget: (title: string) => `✓ 正在記錄《${title}》`,
    pagesThisTime: "本次閱讀頁數",
    pagesThisTimeHint: "本次閱讀的頁數",
    readingMinutes: "閱讀時間（分鐘）",
    minuteRange: "1～1440分鐘",
    recordButton: "儲存閱讀紀錄",
    collection: "你的收藏",
    bookshelf: "書架上的書",
    filterBooks: "篩選書籍",
    all: "全部",
    emptyFirstTitle: "迎接你的第一本書吧。",
    emptyFirstDescription: "可以透過「將一本書加入書架」來新增。",
    emptyCategoryTitle: "這個分類中還沒有書籍。",
    emptyCategoryDescription: "選擇其他分類即可查看已新增的書籍。",
    firstBookButton: "新增第一本書",
    authorNotRegistered: "未填寫作者",
    unread: "未讀",
    reading: "閱讀中",
    completed: "已讀完",
    allPages: (n: string) => `共 ${n} 頁`,
    cumulative: (n: string) => `累計 ${n} 分鐘`,
    recordedPages: (n: string) => `已記錄 ${n} 頁`,
    currentPage: "頁",
    readThisBook: "閱讀這本書",
    selectedForRecord: "已選為記錄對象",
    finished: "已讀完",
    edit: "編輯",
    delete: "刪除",
    footer: "不必著急。每讀一頁，你的世界就會更加寬廣。",
    titleRequired: "請輸入書名。",
    pageCountInvalid: "總頁數必須是大於或等於0的整數。",
    bookUpdated: "✓ 書籍資訊已更新。",
    bookAdded: "✦ 新書已新增至書架。",
    editCancelled: "已取消編輯。",
    deleteConfirm: (title: string) => `要刪除《${title}》及其閱讀紀錄嗎？`,
    bookDeleted: "書籍及其閱讀紀錄已刪除。",
    bookRequired: "請選擇要記錄的書籍。",
    alreadyCompleted: "這本書已經讀完了。",
    readingInputInvalid: "頁數必須大於或等於0，閱讀時間必須為1～1440分鐘。",
    readingCompleted: (title: string) => `✦ 你讀完《${title}》了！`,
    readingRecorded: (pages: number, minutes: number) =>
      `✓ 已記錄${pages}頁、${minutes}分鐘。`,
    selectedBook: (title: string) =>
      `已選擇《${title}》作為記錄對象。請輸入閱讀頁數和時間。`,
    storageError: "儲存失敗。請檢查瀏覽器的可用儲存空間。",
    categories: {
      語学: "語言學習",
      小説: "小說",
      教養: "通識",
      歴史: "歷史",
      実用書: "實用書",
      漫画: "漫畫",
      その他: "其他",
    },
    statuses: {
      未読: "未讀",
      読書中: "閱讀中",
      読了: "已讀完",
    },
  },

  es: {
    loading: "Abriendo las puertas de tu biblioteca…",
    subtitle: "Tu biblioteca crece con cada libro que lees.",
    libraryLevel: "NIVEL DE LA BIBLIOTECA",
    roomLabel: "LA GRAN BIBLIOTECA",
    everyPage: "CADA PÁGINA",
    opensDoor: "abre una puerta",
    established: "CREADA GRACIAS A TU CURIOSIDAD",
    growingBookshelf: "Tu estantería en crecimiento",
    booksCompleted: "LIBROS TERMINADOS",
    firstBook: "Cuando termines tu primer libro, tu estantería empezará a crecer.",
    firstLight: (n: number) =>
      `${n} ${n === 1 ? "libro terminado" : "libros terminados"}. La primera luz ha llegado a tu biblioteca.`,
    growingLight: (n: number) =>
      `¡${n} libros terminados! Tu estantería empieza a brillar poco a poco.`,
    magicalLight: (n: number) =>
      `¡${n} libros terminados! Una luz mágica se extiende por tu biblioteca.`,
    richLibrary: (n: number) =>
      `¡${n} libros o más terminados! Tu biblioteca ha crecido maravillosamente.`,
    journey: "TU VIAJE",
    growthRecord: "El crecimiento de tu biblioteca",
    nextLevel: (n: number) => `Te faltan ${n} XP para el siguiente nivel`,
    pagesRead: "Páginas leídas",
    readingTime: "Tiempo de lectura",
    booksRead: "Libros terminados",
    pages: "páginas",
    minutes: "min",
    books: "libros",
    bookDetails: "DATOS DEL LIBRO",
    editBook: "Editar los datos del libro",
    addBook: "Dar la bienvenida a un libro",
    editDescription: "Modifica los datos y pulsa el botón de guardar.",
    addDescription: "Añade un libro nuevo introduciendo su título.",
    bookTitle: "Título del libro",
    author: "Autor/a",
    isbn: "ISBN",
    totalPages: "Número total de páginas",
    category: "Categoría",
    readingStatus: "Estado de lectura",
    titlePlaceholder: "Introduce el título del libro",
    authorPlaceholder: "Nombre del autor (opcional)",
    isbnPlaceholder: "ISBN (opcional)",
    pagePlaceholder: "Ej.: 320",
    saveChanges: "Guardar cambios",
    addBookButton: "Añadir a la estantería",
    cancel: "Cancelar",
    readingMoment: "UN PEQUEÑO MOMENTO",
    recordToday: "Registrar la lectura de hoy",
    recordDescription: "Introduce el libro, las páginas leídas y el tiempo para guardar tu progreso.",
    noBooks: "Primero añade un libro para empezar a registrar tus lecturas.",
    registerBook: "Añadir un libro",
    readBook: "Libro leído",
    selectBook: "▼ Selecciona un libro",
    recordTarget: (title: string) => `✓ Registrando «${title}»`,
    pagesThisTime: "Páginas leídas esta vez",
    pagesThisTimeHint: "Páginas de esta sesión",
    readingMinutes: "Tiempo de lectura (minutos)",
    minuteRange: "1–1440 minutos",
    recordButton: "Guardar registro de lectura",
    collection: "TU COLECCIÓN",
    bookshelf: "Tus libros",
    filterBooks: "Filtrar libros",
    all: "Todos",
    emptyFirstTitle: "Da la bienvenida a tu primer libro.",
    emptyFirstDescription: "Puedes añadirlo desde «Dar la bienvenida a un libro».",
    emptyCategoryTitle: "No hay libros en esta categoría.",
    emptyCategoryDescription: "Elige otra categoría para ver los libros registrados.",
    firstBookButton: "Añadir el primer libro",
    authorNotRegistered: "Autor no especificado",
    unread: "Sin leer",
    reading: "Leyendo",
    completed: "Terminado",
    allPages: (n: string) => `${n} páginas en total`,
    cumulative: (n: string) => `${n} min en total`,
    recordedPages: (n: string) => `${n} páginas registradas`,
    currentPage: "páginas",
    readThisBook: "Leer este libro",
    selectedForRecord: "Seleccionado para registrar",
    finished: "Terminado",
    edit: "Editar",
    delete: "Eliminar",
    footer: "No hace falta correr. Amplía tu mundo página a página.",
    titleRequired: "Introduce el título del libro.",
    pageCountInvalid: "El número total de páginas debe ser un entero igual o mayor que 0.",
    bookUpdated: "✓ Los datos del libro se han actualizado.",
    bookAdded: "✦ Se ha añadido un nuevo libro a tu estantería.",
    editCancelled: "Se ha cancelado la edición.",
    deleteConfirm: (title: string) =>
      `¿Quieres eliminar «${title}» y sus registros de lectura?`,
    bookDeleted: "Se han eliminado el libro y sus registros de lectura.",
    bookRequired: "Selecciona el libro que quieres registrar.",
    alreadyCompleted: "Este libro ya está terminado.",
    readingInputInvalid:
      "Las páginas deben ser 0 o más y el tiempo de lectura debe estar entre 1 y 1440 minutos.",
    readingCompleted: (title: string) => `✦ ¡Has terminado «${title}»!`,
    readingRecorded: (pages: number, minutes: number) =>
      `✓ Se han registrado ${pages} páginas y ${minutes} minutos.`,
    selectedBook: (title: string) =>
      `Has seleccionado «${title}». Introduce las páginas y el tiempo de lectura.`,
    storageError: "No se ha podido guardar. Comprueba el espacio disponible en el navegador.",
    categories: {
      語学: "Idiomas",
      小説: "Novela",
      教養: "Cultura general",
      歴史: "Historia",
      実用書: "Libros prácticos",
      漫画: "Manga",
      その他: "Otros",
    },
    statuses: {
      未読: "Sin leer",
      読書中: "Leyendo",
      読了: "Terminado",
    },
  },
};

function normalizeBook(value: unknown): Book | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  if (typeof item.title !== "string" || !item.title.trim()) return null;

  return {
    id: typeof item.id === "number" ? item.id : Date.now(),
    title: item.title,
    author: typeof item.author === "string" ? item.author : "",
    isbn: typeof item.isbn === "string" ? item.isbn : "",
    totalPages: Math.max(0, Number(item.totalPages) || 0),
    category: categories.includes(item.category as Category)
      ? (item.category as Category)
      : "その他",
    status: statuses.includes(item.status as ReadingStatus)
      ? (item.status as ReadingStatus)
      : "未読",
  };
}

function readJson(key: string): unknown {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function normalizeProgress(value: unknown): ReadingProgress[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object"
    )
    .filter((item) => typeof item.bookId === "number")
    .map((item) => ({
      bookId: item.bookId as number,
      currentPage: Math.max(0, Number(item.currentPage) || 0),
      pagesRead: Math.max(0, Number(item.pagesRead) || 0),
      totalMinutes: Math.max(0, Number(item.totalMinutes) || 0),
    }));
}

export default function ReadingSanctuary() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  const locale =
    currentLanguage === "zh-CN"
      ? "zh-CN"
      : currentLanguage === "zh-TW"
        ? "zh-TW"
        : currentLanguage;

  const [books, setBooks] = useState<Book[]>([]);
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [category, setCategory] = useState<Category>("その他");
  const [status, setStatus] = useState<ReadingStatus>("未読");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [activeBookId, setActiveBookId] = useState("");
  const [pagesInput, setPagesInput] = useState("10");
  const [minutesInput, setMinutesInput] = useState("20");
  const [filter, setFilter] = useState("すべて");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedBooks = readJson(BOOKS_KEY);
    const normalizedBooks = Array.isArray(savedBooks)
      ? savedBooks
          .map(normalizeBook)
          .filter((book): book is Book => book !== null)
      : [];

    const savedProgress = normalizeProgress(readJson(READING_KEY));

    setBooks(normalizedBooks);
    setProgressList(
      savedProgress.filter((progress) =>
        normalizedBooks.some((book) => book.id === progress.bookId)
      )
    );
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
      localStorage.setItem(READING_KEY, JSON.stringify(progressList));
    } catch {
      setMessage(t.storageError);
    }
  }, [books, progressList, loaded, t.storageError]);

  function getProgress(bookId: number): ReadingProgress {
    return (
      progressList.find((item) => item.bookId === bookId) ?? {
        bookId,
        currentPage: 0,
        pagesRead: 0,
        totalMinutes: 0,
      }
    );
  }

  function resetBookForm() {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setTotalPages("");
    setCategory("その他");
    setStatus("未読");
    setEditingId(null);
  }

  function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const pageCount = totalPages.trim() === "" ? 0 : Number(totalPages);

    if (!cleanTitle) {
      setMessage(t.titleRequired);
      return;
    }

    if (!Number.isInteger(pageCount) || pageCount < 0) {
      setMessage(t.pageCountInvalid);
      return;
    }

    const id = editingId ?? Date.now();

    const nextBook: Book = {
      id,
      title: cleanTitle,
      author: author.trim(),
      isbn: isbn.trim(),
      totalPages: pageCount,
      category,
      status,
    };

    if (editingId !== null) {
      setBooks((current) =>
        current.map((book) => (book.id === editingId ? nextBook : book))
      );

      setProgressList((current) =>
        current.map((item) => {
          if (item.bookId !== editingId || pageCount === 0) return item;
          return {
            ...item,
            currentPage: Math.min(item.currentPage, pageCount),
          };
        })
      );

      setMessage(t.bookUpdated);
    } else {
      setBooks((current) => [nextBook, ...current]);
      setMessage(t.bookAdded);
    }

    resetBookForm();
  }

  function startEditing(book: Book) {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setTotalPages(book.totalPages ? String(book.totalPages) : "");
    setCategory(book.category);
    setStatus(book.status);
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteBook(book: Book) {
    if (!window.confirm(t.deleteConfirm(book.title))) {
      return;
    }

    setBooks((current) => current.filter((item) => item.id !== book.id));
    setProgressList((current) =>
      current.filter((item) => item.bookId !== book.id)
    );

    if (activeBookId === String(book.id)) setActiveBookId("");
    if (editingId === book.id) resetBookForm();

    setMessage(t.bookDeleted);
  }

  function recordReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const bookId = Number(activeBookId);
    const book = books.find((item) => item.id === bookId);
    const pages = Number(pagesInput);
    const minutes = Number(minutesInput);

    if (!book) {
      setMessage(t.bookRequired);
      return;
    }

    if (book.status === "読了") {
      setMessage(t.alreadyCompleted);
      return;
    }

    if (
      !Number.isInteger(pages) ||
      pages < 0 ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      pages > 100000 ||
      minutes > 1440
    ) {
      setMessage(t.readingInputInvalid);
      return;
    }

    const previous = getProgress(bookId);
    const remaining =
      book.totalPages > 0
        ? Math.max(0, book.totalPages - previous.currentPage)
        : pages;
    const actualPages =
      book.totalPages > 0 ? Math.min(pages, remaining) : pages;
    const newCurrentPage = previous.currentPage + actualPages;
    const isCompleted =
      book.totalPages > 0 && newCurrentPage >= book.totalPages;

    setProgressList((current) => {
      const existing = current.some((item) => item.bookId === bookId);

      const updated: ReadingProgress = {
        bookId,
        currentPage: newCurrentPage,
        pagesRead: previous.pagesRead + actualPages,
        totalMinutes: previous.totalMinutes + minutes,
      };

      return existing
        ? current.map((item) => (item.bookId === bookId ? updated : item))
        : [...current, updated];
    });

    setBooks((current) =>
      current.map((item) =>
        item.id === bookId
          ? { ...item, status: isCompleted ? "読了" : "読書中" }
          : item
      )
    );

    setMessage(
      isCompleted
        ? t.readingCompleted(book.title)
        : t.readingRecorded(actualPages, minutes)
    );
  }

  const stats = useMemo(() => {
    const pagesRead = progressList.reduce(
      (sum, item) => sum + item.pagesRead,
      0
    );

    const minutes = progressList.reduce(
      (sum, item) => sum + item.totalMinutes,
      0
    );

    const completed = books.filter((book) => book.status === "読了").length;
    const xp = minutes + pagesRead * 2 + completed * 50;
    const level = Math.floor(xp / 100) + 1;

    return {
      pagesRead,
      minutes,
      completed,
      xp,
      level,
      progress: xp % 100,
    };
  }, [books, progressList]);

  const bookshelfLevel = Math.min(
    4,
    Math.floor(stats.completed / 3) + 1
  );

  const readableBooks = books.filter((book) => book.status !== "読了");

  const visibleBooks =
    filter === "すべて"
      ? books
      : filter === "読了"
        ? books.filter((book) => book.status === "読了")
        : filter === "読書中"
          ? books.filter((book) => book.status === "読書中")
          : books.filter((book) => book.category === filter);

  const filterItems = ["すべて", "読書中", "読了", ...categories];

  function displayFilter(item: string) {
    if (item === "すべて") return t.all;
    if (item === "読書中") return t.statuses.読書中;
    if (item === "読了") return t.statuses.読了;
    return t.categories[item as Category] ?? item;
  }

  if (!loaded) {
    return (
      <main className="lgrowth-page">
        <p className="lgrowth-loading">{t.loading}</p>
      </main>
    );
  }

  return (
    <main className="lgrowth-page">
      <header className="lgrowth-header">
        <div>
          <p className="lgrowth-eyebrow">YOUR PERSONAL READING SANCTUARY</p>
          <h1>The Living Library</h1>
          <p className="lgrowth-subtitle">{t.subtitle}</p>
        </div>

        <div className="lgrowth-level-badge">
          <span>{t.libraryLevel}</span>
          <strong>{stats.level}</strong>
        </div>
      </header>

      <section
        className={`lgrowth-room lgrowth-room--${Math.min(stats.level, 4)}`}
        aria-label={`${t.libraryLevel} ${stats.level}`}
      >
        <div className="lgrowth-room-top">
          <span className="lgrowth-room-label">{t.roomLabel}</span>
          <span className="lgrowth-room-level">LEVEL {stats.level}</span>
        </div>

        <div className="lgrowth-window">
          <div className="lgrowth-window-glow" />
          <div className="lgrowth-window-cross lgrowth-window-cross--vertical" />
          <div className="lgrowth-window-cross lgrowth-window-cross--horizontal" />
        </div>

        <div className="lgrowth-arch">
          <div className="lgrowth-arch-inner">
            <span className="lgrowth-star lgrowth-star--one">✦</span>
            <span className="lgrowth-star lgrowth-star--two">✧</span>
            <span className="lgrowth-star lgrowth-star--three">✦</span>
            <div className="lgrowth-arch-message">
              <span>{t.everyPage}</span>
              <strong>{t.opensDoor}</strong>
            </div>
          </div>
        </div>

        <div className="lgrowth-room-shelves">
          {Array.from({ length: Math.min(3 + stats.level, 8) }).map(
            (_, index) => (
              <div className="lgrowth-decorative-shelf" key={index}>
                {Array.from({ length: 7 }).map((__, bookIndex) => (
                  <span
                    className={`lgrowth-decorative-book lgrowth-decorative-book--${
                      (index + bookIndex + stats.level) % 6
                    }`}
                    key={bookIndex}
                    style={{
                      height: `${30 + ((index * 13 + bookIndex * 7) % 28)}px`,
                    }}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {stats.level >= 2 && (
          <div className="lgrowth-room-decoration lgrowth-room-decoration--left">
            ✧
          </div>
        )}

        {stats.level >= 3 && (
          <div className="lgrowth-room-decoration lgrowth-room-decoration--right">
            ✦
          </div>
        )}

        {stats.level >= 4 && <div className="lgrowth-room-crown">♕</div>}

        <div className="lgrowth-room-floor">
          <span>{t.established}</span>
        </div>
      </section>

      <section className="lgrowth-illustrated-library">
        <div className="lgrowth-section-heading">
          <div>
            <p className="lgrowth-eyebrow">YOUR GROWING BOOKSHELF</p>
            <h2>{t.growingBookshelf}</h2>
          </div>

          <span className="lgrowth-book-count">
            {stats.completed} {t.booksCompleted}
          </span>
        </div>

        <div
          className={`lgrowth-illustrated-library__frame lgrowth-illustrated-library__frame--${bookshelfLevel}`}
        >
          <img
            src="/images/library/bookshelf.png"
            alt={t.growingBookshelf}
            className="lgrowth-illustrated-library__image"
          />

          <div
            className="lgrowth-illustrated-library__glow"
            aria-hidden="true"
          />
        </div>

        <div className="lgrowth-illustrated-library__caption">
          <span>✦</span>
          {stats.completed === 0
            ? t.firstBook
            : stats.completed < 3
              ? t.firstLight(stats.completed)
              : stats.completed < 6
                ? t.growingLight(stats.completed)
                : stats.completed < 9
                  ? t.magicalLight(stats.completed)
                  : t.richLibrary(stats.completed)}
        </div>
      </section>

      <section className="lgrowth-progress-panel">
        <div className="lgrowth-progress-heading">
          <div>
            <p className="lgrowth-eyebrow">{t.journey}</p>
            <h2>{t.growthRecord}</h2>
          </div>
          <span className="lgrowth-xp">{stats.xp} XP</span>
        </div>

        <div
          className="lgrowth-progress-track"
          role="progressbar"
          aria-label={t.nextLevel(100 - stats.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.progress}
        >
          <div
            className="lgrowth-progress-fill"
            style={{ width: `${stats.progress}%` }}
          />
        </div>

        <div className="lgrowth-progress-caption">
          <span>LEVEL {stats.level}</span>
          <span>{t.nextLevel(100 - stats.progress)}</span>
        </div>

        <div className="lgrowth-stats">
          <div className="lgrowth-stat">
            <span className="lgrowth-stat-icon">▤</span>
            <span className="lgrowth-stat-label">{t.pagesRead}</span>
            <strong>{stats.pagesRead.toLocaleString(locale)}</strong>
            <small>{t.pages}</small>
          </div>

          <div className="lgrowth-stat">
            <span className="lgrowth-stat-icon">◷</span>
            <span className="lgrowth-stat-label">{t.readingTime}</span>
            <strong>{stats.minutes.toLocaleString(locale)}</strong>
            <small>{t.minutes}</small>
          </div>

          <div className="lgrowth-stat">
            <span className="lgrowth-stat-icon">✧</span>
            <span className="lgrowth-stat-label">{t.booksRead}</span>
            <strong>{stats.completed.toLocaleString(locale)}</strong>
            <small>{t.books}</small>
          </div>
        </div>
      </section>

      <div className="lgrowth-columns">
        <section
          className={`lgrowth-panel lgrowth-panel--book ${
            editingId !== null ? "lgrowth-panel--editing" : ""
          }`}
          id="book-form"
        >
          <div className="lgrowth-panel-heading">
            <span className="lgrowth-panel-symbol" aria-hidden="true">
              {editingId !== null ? "✎" : "＋"}
            </span>

            <div>
              <p className="lgrowth-eyebrow">{t.bookDetails}</p>
              <h2>{editingId !== null ? t.editBook : t.addBook}</h2>
            </div>
          </div>

          <p className="lgrowth-description">
            {editingId !== null ? t.editDescription : t.addDescription}
          </p>

          <form className="lgrowth-form" onSubmit={saveBook}>
            <label>
              {t.bookTitle} <span>*</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t.titlePlaceholder}
                maxLength={200}
                required
              />
            </label>

            <label>
              {t.author}
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder={t.authorPlaceholder}
              />
            </label>

            <label>
              {t.isbn}
              <input
                value={isbn}
                onChange={(event) => setIsbn(event.target.value)}
                placeholder={t.isbnPlaceholder}
              />
            </label>

            <label>
              {t.totalPages}
              <input
                type="number"
                min="0"
                step="1"
                value={totalPages}
                onChange={(event) => setTotalPages(event.target.value)}
                placeholder={t.pagePlaceholder}
              />
            </label>

            <div className="lgrowth-form-row">
              <label>
                {t.category}
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as Category)
                  }
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {t.categories[item]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.readingStatus}
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ReadingStatus)
                  }
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {t.statuses[item]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="lgrowth-button lgrowth-button--primary"
              type="submit"
            >
              <span aria-hidden="true">{editingId !== null ? "✓" : "＋"}</span>
              {editingId !== null ? t.saveChanges : t.addBookButton}
            </button>

            {editingId !== null && (
              <button
                className="lgrowth-button lgrowth-button--secondary"
                type="button"
                onClick={() => {
                  resetBookForm();
                  setMessage(t.editCancelled);
                }}
              >
                {t.cancel}
              </button>
            )}
          </form>
        </section>

        <section
          className="lgrowth-panel lgrowth-panel--reading"
          id="reading-form"
        >
          <div className="lgrowth-panel-heading">
            <span className="lgrowth-panel-symbol" aria-hidden="true">
              ↗
            </span>

            <div>
              <p className="lgrowth-eyebrow">{t.readingMoment}</p>
              <h2>{t.recordToday}</h2>
            </div>
          </div>

          <p className="lgrowth-description">{t.recordDescription}</p>

          {readableBooks.length === 0 ? (
            <div className="lgrowth-action-empty">
              <span aria-hidden="true">✧</span>
              <p>{t.noBooks}</p>

              <button
                type="button"
                className="lgrowth-button lgrowth-button--secondary"
                onClick={() => {
                  document
                    .getElementById("book-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                ＋ {t.registerBook}
              </button>
            </div>
          ) : (
            <form className="lgrowth-form" onSubmit={recordReading}>
              <label>
                {t.readBook}
                <select
                  className={activeBookId ? "lgrowth-input--selected" : ""}
                  value={activeBookId}
                  onChange={(event) => setActiveBookId(event.target.value)}
                  required
                >
                  <option value="">{t.selectBook}</option>
                  {readableBooks.map((book) => (
                    <option key={book.id} value={String(book.id)}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </label>

              {activeBookId && (
                <p className="lgrowth-selected-note">
                  {t.recordTarget(
                    books.find((book) => String(book.id) === activeBookId)
                      ?.title ?? ""
                  )}
                </p>
              )}

              <div className="lgrowth-form-row">
                <label>
                  {t.pagesThisTime}
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={pagesInput}
                    onChange={(event) => setPagesInput(event.target.value)}
                    required
                  />
                  <small className="lgrowth-field-hint">
                    {t.pagesThisTimeHint}
                  </small>
                </label>

                <label>
                  {t.readingMinutes}
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    step="1"
                    value={minutesInput}
                    onChange={(event) => setMinutesInput(event.target.value)}
                    required
                  />
                  <small className="lgrowth-field-hint">
                    {t.minuteRange}
                  </small>
                </label>
              </div>

              <button
                className="lgrowth-button lgrowth-button--dark"
                type="submit"
              >
                <span aria-hidden="true">✦</span>
                {t.recordButton}
                <span className="lgrowth-button-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </form>
          )}
        </section>
      </div>

      {message && (
        <p className="lgrowth-message" role="status">
          <span aria-hidden="true">✦</span> {message}
        </p>
      )}

      <section className="lgrowth-book-section">
        <div className="lgrowth-section-heading">
          <div>
            <p className="lgrowth-eyebrow">{t.collection}</p>
            <h2>{t.bookshelf}</h2>
          </div>

          <span className="lgrowth-book-count">
            {books.length} BOOKS
          </span>
        </div>

        <div className="lgrowth-library-toolbar">
          <span className="lgrowth-toolbar-label">{t.filterBooks}</span>

          <div className="lgrowth-filter-list">
            {filterItems.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                className={`lgrowth-filter ${
                  filter === item ? "lgrowth-filter--active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {filter === item && (
                  <span aria-hidden="true" className="lgrowth-filter-check">
                    ✓
                  </span>
                )}
                {displayFilter(item)}
              </button>
            ))}
          </div>
        </div>

        {visibleBooks.length === 0 ? (
          <div className="lgrowth-empty-library">
            <span className="lgrowth-empty-symbol">✧</span>
            <h3>
              {books.length === 0
                ? t.emptyFirstTitle
                : t.emptyCategoryTitle}
            </h3>
            <p>
              {books.length === 0
                ? t.emptyFirstDescription
                : t.emptyCategoryDescription}
            </p>

            {books.length === 0 && (
              <button
                type="button"
                className="lgrowth-button lgrowth-button--primary lgrowth-empty-cta"
                onClick={() =>
                  document
                    .getElementById("book-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                ＋ {t.firstBookButton}
              </button>
            )}
          </div>
        ) : (
          <div className="lgrowth-book-list">
            {visibleBooks.map((book, index) => {
              const progress = getProgress(book.id);
              const percent =
                book.status === "読了"
                  ? 100
                  : book.totalPages > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (progress.currentPage / book.totalPages) * 100
                        )
                      )
                    : 0;

              const isActive = activeBookId === String(book.id);

              return (
                <article
                  className={`lgrowth-book-card ${
                    isActive ? "lgrowth-book-card--active" : ""
                  }`}
                  key={book.id}
                >
                  <div
                    className={`lgrowth-book-spine lgrowth-book-spine--${index % 6}`}
                    aria-hidden="true"
                  >
                    <span>{book.status === "読了" ? "✦" : "❖"}</span>
                  </div>

                  <div className="lgrowth-book-content">
                    <div className="lgrowth-book-title-row">
                      <div className="lgrowth-book-title">
                        <h3>{book.title}</h3>
                        <p className="lgrowth-book-author">
                          {book.author || t.authorNotRegistered}
                        </p>
                      </div>

                      <span
                        className={`lgrowth-status-pill ${
                          book.status === "読了"
                            ? "lgrowth-status-pill--done"
                            : book.status === "読書中"
                              ? "lgrowth-status-pill--reading"
                              : "lgrowth-status-pill--unread"
                        }`}
                      >
                        <span aria-hidden="true">
                          {book.status === "読了"
                            ? "✓"
                            : book.status === "読書中"
                              ? "◷"
                              : "○"}
                        </span>
                        {t.statuses[book.status]}
                      </span>
                    </div>

                    <div className="lgrowth-book-tags">
                      <span>{t.categories[book.category]}</span>
                      {book.totalPages > 0 && (
                        <span>
                          {t.allPages(book.totalPages.toLocaleString(locale))}
                        </span>
                      )}
                    </div>

                    <div
                      className="lgrowth-book-progress-track"
                      role="progressbar"
                      aria-label={`${book.title} - ${percent}%`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <div
                        className="lgrowth-book-progress-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="lgrowth-book-meta">
                      <span>
                        {progress.currentPage.toLocaleString(locale)} /{" "}
                        {book.totalPages > 0
                          ? book.totalPages.toLocaleString(locale)
                          : "—"}{" "}
                        {t.currentPage}
                      </span>
                      <strong>{percent}%</strong>
                    </div>

                    <p className="lgrowth-book-minutes">
                      {t.cumulative(
                        progress.totalMinutes.toLocaleString(locale)
                      )}{" "}
                      ·{" "}
                      {t.recordedPages(
                        progress.pagesRead.toLocaleString(locale)
                      )}
                    </p>

                    {book.isbn && (
                      <p className="lgrowth-book-minutes">ISBN: {book.isbn}</p>
                    )}

                    <div className="lgrowth-book-actions">
                      {book.status !== "読了" ? (
                        <button
                          type="button"
                          className={`lgrowth-small-button lgrowth-small-button--read ${
                            isActive ? "lgrowth-small-button--selected" : ""
                          }`}
                          aria-pressed={isActive}
                          onClick={() => {
                            setActiveBookId(String(book.id));
                            setMessage(t.selectedBook(book.title));
                            document
                              .getElementById("reading-form")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                          }}
                        >
                          <span aria-hidden="true">
                            {isActive ? "✓" : "▶"}
                          </span>
                          {isActive ? t.selectedForRecord : t.readThisBook}
                        </button>
                      ) : (
                        <span className="lgrowth-finished-note">
                          ✓ {t.finished}
                        </span>
                      )}

                      <button
                        type="button"
                        className="lgrowth-small-button lgrowth-small-button--edit"
                        onClick={() => startEditing(book)}
                      >
                        <span aria-hidden="true">✎</span>
                        {t.edit}
                      </button>

                      <button
                        type="button"
                        className="lgrowth-small-button lgrowth-small-button--delete"
                        onClick={() => deleteBook(book)}
                      >
                        <span aria-hidden="true">×</span>
                        {t.delete}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="lgrowth-footer">
        <span>THE LIVING LIBRARY</span>
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}