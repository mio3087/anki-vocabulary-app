"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAppLanguage } from "@/app/component/AppLanguage";

const STORAGE_KEY = "little-library-books-v1";

const categories = ["語学", "小説", "教養", "歴史", "実用書", "漫画", "その他"] as const;
const statuses = ["未読", "読書中", "読了"] as const;

type Category = (typeof categories)[number];
type ReadingStatus = (typeof statuses)[number];
type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  totalPages: number;
  category: Category;
  status: ReadingStatus;
};

const translations: Record<Language, {
  loading: string;
  library: string;
  eyebrow: string;
  title: string;
  description: string;
  scanBook: string;
  totalBooks: string;
  reading: string;
  completed: string;
  bookUnit: string;
  bookDetails: string;
  editBook: string;
  addBook: string;
  optionalDescription: string;
  bookTitle: string;
  required: string;
  titlePlaceholder: string;
  author: string;
  authorPlaceholder: string;
  isbn: string;
  pages: string;
  pagesPlaceholder: string;
  category: string;
  status: string;
  saveChanges: string;
  register: string;
  cancelEdit: string;
  saveError: string;
  saved: string;
  titleRequired: string;
  updated: string;
  registered: string;
  deleteConfirm: (title: string) => string;
  deleted: string;
  collection: string;
  bookshelf: string;
  booksCount: (count: number) => string;
  all: string;
  emptyBookshelf: string;
  emptyCategory: string;
  emptyBookshelfDescription: string;
  emptyCategoryDescription: string;
  authorUnknown: string;
  pageUnit: string;
  readingRecord: string;
  edit: string;
  delete: string;
  backToLibrary: string;
  categoryLabels: Record<Category, string>;
  statusLabels: Record<ReadingStatus, string>;
}> = {
  ja: {
    loading: "本棚を読み込み中…",
    library: "← Little Library",
    eyebrow: "Your Personal Library",
    title: "My Bookshelf",
    description: "読みたい本も、読みかけの本も。一冊ずつ、自分だけの本棚に記録していきましょう。",
    scanBook: "＋ 本をスキャンして登録",
    totalBooks: "本棚の本",
    reading: "読書中",
    completed: "読了",
    bookUnit: "冊",
    bookDetails: "Book Details",
    editBook: "本の情報を編集",
    addBook: "本を本棚に登録",
    optionalDescription: "タイトル以外は、わかる項目だけ入力すれば大丈夫です。",
    bookTitle: "タイトル",
    required: "必須",
    titlePlaceholder: "本のタイトル",
    author: "著者",
    authorPlaceholder: "著者名",
    isbn: "ISBN",
    pages: "総ページ数",
    pagesPlaceholder: "例：320",
    category: "分類",
    status: "読書状況",
    saveChanges: "変更を保存",
    register: "＋ 本棚に登録",
    cancelEdit: "編集をキャンセル",
    saveError: "保存できませんでした。ブラウザの空き容量をご確認ください。",
    saved: "保存しました。",
    titleRequired: "本のタイトルを入力してください。",
    updated: "本の情報を更新しました。",
    registered: "本を本棚に登録しました。",
    deleteConfirm: (title) => `「${title}」を本棚から削除しますか？`,
    deleted: "本を削除しました。",
    collection: "Collection",
    bookshelf: "本棚",
    booksCount: (count) => `${count} 冊の本`,
    all: "すべて",
    emptyBookshelf: "本棚はまだ空です",
    emptyCategory: "この分類には本がありません",
    emptyBookshelfDescription: "上のフォームから登録するか、本をスキャンして本棚に加えましょう。",
    emptyCategoryDescription: "別の分類を選択すると、登録した本を確認できます。",
    authorUnknown: "著者未登録",
    pageUnit: "ページ",
    readingRecord: "読書記録",
    edit: "編集",
    delete: "削除",
    backToLibrary: "← Little Library トップへ戻る",
    categoryLabels: {
      語学: "語学",
      小説: "小説",
      教養: "教養",
      歴史: "歴史",
      実用書: "実用書",
      漫画: "漫画",
      その他: "その他",
    },
    statusLabels: {
      未読: "未読",
      読書中: "読書中",
      読了: "読了",
    },
  },
  de: {
    loading: "Bücherregal wird geladen…",
    library: "← Little Library",
    eyebrow: "Your Personal Library",
    title: "Mein Bücherregal",
    description: "Ob Bücher, die du lesen möchtest, oder Bücher, die du gerade liest – halte sie Stück für Stück in deiner persönlichen Sammlung fest.",
    scanBook: "＋ Buch scannen und hinzufügen",
    totalBooks: "Bücher insgesamt",
    reading: "In Bearbeitung",
    completed: "Abgeschlossen",
    bookUnit: "Bücher",
    bookDetails: "Book Details",
    editBook: "Buchinformationen bearbeiten",
    addBook: "Buch hinzufügen",
    optionalDescription: "Du musst nur die Angaben ausfüllen, die du kennst. Der Titel ist erforderlich.",
    bookTitle: "Titel",
    required: "Pflichtfeld",
    titlePlaceholder: "Buchtitel",
    author: "Autor/in",
    authorPlaceholder: "Name des Autors",
    isbn: "ISBN",
    pages: "Seitenzahl",
    pagesPlaceholder: "z. B. 320",
    category: "Kategorie",
    status: "Lesestatus",
    saveChanges: "Änderungen speichern",
    register: "＋ Ins Bücherregal aufnehmen",
    cancelEdit: "Bearbeitung abbrechen",
    saveError: "Speichern fehlgeschlagen. Bitte überprüfe den verfügbaren Speicherplatz deines Browsers.",
    saved: "Gespeichert.",
    titleRequired: "Bitte gib einen Buchtitel ein.",
    updated: "Die Buchinformationen wurden aktualisiert.",
    registered: "Das Buch wurde zum Bücherregal hinzugefügt.",
    deleteConfirm: (title) => `Möchtest du „${title}“ aus deinem Bücherregal entfernen?`,
    deleted: "Das Buch wurde gelöscht.",
    collection: "Collection",
    bookshelf: "Bücherregal",
    booksCount: (count) => `${count} Bücher`,
    all: "Alle",
    emptyBookshelf: "Dein Bücherregal ist noch leer.",
    emptyCategory: "In dieser Kategorie gibt es keine Bücher.",
    emptyBookshelfDescription: "Füge oben ein Buch hinzu oder scanne ein Buch, um es in deine Sammlung aufzunehmen.",
    emptyCategoryDescription: "Wähle eine andere Kategorie aus, um deine gespeicherten Bücher zu sehen.",
    authorUnknown: "Autor/in nicht angegeben",
    pageUnit: "Seiten",
    readingRecord: "Leseprotokoll",
    edit: "Bearbeiten",
    delete: "Löschen",
    backToLibrary: "← Zurück zur Little Library",
    categoryLabels: {
      語学: "Sprachen",
      小説: "Romane",
      教養: "Allgemeinbildung",
      歴史: "Geschichte",
      実用書: "Sachbücher",
      漫画: "Manga",
      その他: "Sonstiges",
    },
    statusLabels: {
      未読: "Ungelesen",
      読書中: "In Bearbeitung",
      読了: "Abgeschlossen",
    },
  },
  en: {
    loading: "Loading your bookshelf…",
    library: "← Little Library",
    eyebrow: "Your Personal Library",
    title: "My Bookshelf",
    description: "Books you want to read and books you're currently reading. Build your own personal collection, one book at a time.",
    scanBook: "＋ Scan and add a book",
    totalBooks: "Total books",
    reading: "Currently reading",
    completed: "Completed",
    bookUnit: "books",
    bookDetails: "Book Details",
    editBook: "Edit book details",
    addBook: "Add a book",
    optionalDescription: "Only the title is required. Fill in any other details you know.",
    bookTitle: "Title",
    required: "Required",
    titlePlaceholder: "Book title",
    author: "Author",
    authorPlaceholder: "Author name",
    isbn: "ISBN",
    pages: "Total pages",
    pagesPlaceholder: "e.g. 320",
    category: "Category",
    status: "Reading status",
    saveChanges: "Save changes",
    register: "＋ Add to bookshelf",
    cancelEdit: "Cancel editing",
    saveError: "Unable to save. Please check your browser's available storage space.",
    saved: "Saved.",
    titleRequired: "Please enter a book title.",
    updated: "Book details updated.",
    registered: "Book added to your bookshelf.",
    deleteConfirm: (title) => `Remove "${title}" from your bookshelf?`,
    deleted: "Book deleted.",
    collection: "Collection",
    bookshelf: "Bookshelf",
    booksCount: (count) => `${count} books`,
    all: "All",
    emptyBookshelf: "Your bookshelf is empty",
    emptyCategory: "No books in this category",
    emptyBookshelfDescription: "Add a book using the form above, or scan a book to add it to your collection.",
    emptyCategoryDescription: "Select another category to view your registered books.",
    authorUnknown: "Author not specified",
    pageUnit: "pages",
    readingRecord: "Reading journal",
    edit: "Edit",
    delete: "Delete",
    backToLibrary: "← Back to Little Library",
    categoryLabels: {
      語学: "Languages",
      小説: "Fiction",
      教養: "General knowledge",
      歴史: "History",
      実用書: "Non-fiction",
      漫画: "Comics",
      その他: "Other",
    },
    statusLabels: {
      未読: "Unread",
      読書中: "Reading",
      読了: "Completed",
    },
  },
  "zh-CN": {
    loading: "正在加载书架…",
    library: "← Little Library",
    eyebrow: "Your Personal Library",
    title: "我的书架",
    description: "无论是想读的书，还是正在读的书，都可以一本一本地收藏到自己的书架中。",
    scanBook: "＋ 扫描并添加书籍",
    totalBooks: "书架藏书",
    reading: "正在阅读",
    completed: "已读完",
    bookUnit: "本",
    bookDetails: "Book Details",
    editBook: "编辑书籍信息",
    addBook: "添加书籍到书架",
    optionalDescription: "除了书名以外，其他信息只需填写已知的部分即可。",
    bookTitle: "书名",
    required: "必填",
    titlePlaceholder: "书籍名称",
    author: "作者",
    authorPlaceholder: "作者姓名",
    isbn: "ISBN",
    pages: "总页数",
    pagesPlaceholder: "例如：320",
    category: "分类",
    status: "阅读状态",
    saveChanges: "保存修改",
    register: "＋ 添加到书架",
    cancelEdit: "取消编辑",
    saveError: "保存失败。请检查浏览器的可用存储空间。",
    saved: "已保存。",
    titleRequired: "请输入书名。",
    updated: "书籍信息已更新。",
    registered: "书籍已添加到书架。",
    deleteConfirm: (title) => `确定要将《${title}》从书架中删除吗？`,
    deleted: "书籍已删除。",
    collection: "Collection",
    bookshelf: "书架",
    booksCount: (count) => `${count} 本书`,
    all: "全部",
    emptyBookshelf: "书架还是空的",
    emptyCategory: "这个分类中还没有书籍",
    emptyBookshelfDescription: "可以通过上方的表单添加书籍，也可以扫描书籍后添加到书架。",
    emptyCategoryDescription: "选择其他分类，即可查看已添加的书籍。",
    authorUnknown: "未填写作者",
    pageUnit: "页",
    readingRecord: "阅读记录",
    edit: "编辑",
    delete: "删除",
    backToLibrary: "← 返回 Little Library 首页",
    categoryLabels: {
      語学: "语言学习",
      小説: "小说",
      教養: "知识文化",
      歴史: "历史",
      実用書: "实用书籍",
      漫画: "漫画",
      その他: "其他",
    },
    statusLabels: {
      未読: "未读",
      読書中: "正在阅读",
      読了: "已读完",
    },
  },
  "zh-TW": {
    loading: "正在載入書架…",
    library: "← Little Library",
    eyebrow: "Your Personal Library",
    title: "我的書架",
    description: "無論是想讀的書，還是正在讀的書，都可以一本一本地收藏到自己的書架中。",
    scanBook: "＋ 掃描並新增書籍",
    totalBooks: "書架藏書",
    reading: "閱讀中",
    completed: "已讀完",
    bookUnit: "本",
    bookDetails: "Book Details",
    editBook: "編輯書籍資訊",
    addBook: "新增書籍到書架",
    optionalDescription: "除了書名以外，其他資訊只需填寫已知的部分即可。",
    bookTitle: "書名",
    required: "必填",
    titlePlaceholder: "書籍名稱",
    author: "作者",
    authorPlaceholder: "作者姓名",
    isbn: "ISBN",
    pages: "總頁數",
    pagesPlaceholder: "例如：320",
    category: "分類",
    status: "閱讀狀態",
    saveChanges: "儲存變更",
    register: "＋ 新增到書架",
    cancelEdit: "取消編輯",
    saveError: "儲存失敗。請檢查瀏覽器的可用儲存空間。",
    saved: "已儲存。",
    titleRequired: "請輸入書名。",
    updated: "書籍資訊已更新。",
    registered: "書籍已新增到書架。",
    deleteConfirm: (title) => `確定要將《${title}》從書架中刪除嗎？`,
    deleted: "書籍已刪除。",
    collection: "Collection",
    bookshelf: "書架",
    booksCount: (count) => `${count} 本書`,
    all: "全部",
    emptyBookshelf: "書架還是空的",
    emptyCategory: "這個分類中還沒有書籍",
    emptyBookshelfDescription: "可以透過上方的表單新增書籍，也可以掃描書籍後加入書架。",
    emptyCategoryDescription: "選擇其他分類，即可查看已新增的書籍。",
    authorUnknown: "未填寫作者",
    pageUnit: "頁",
    readingRecord: "閱讀紀錄",
    edit: "編輯",
    delete: "刪除",
    backToLibrary: "← 返回 Little Library 首頁",
    categoryLabels: {
      語学: "語言學習",
      小説: "小說",
      教養: "知識文化",
      歴史: "歷史",
      実用書: "實用書籍",
      漫画: "漫畫",
      その他: "其他",
    },
    statusLabels: {
      未読: "未讀",
      読書中: "閱讀中",
      読了: "已讀完",
    },
  },
  es: {
    loading: "Cargando tu estantería…",
    library: "← Little Library",
    eyebrow: "Your Personal Library",
    title: "Mi estantería",
    description: "Tanto los libros que quieres leer como los que estás leyendo. Organiza tu colección personal, libro a libro.",
    scanBook: "＋ Escanear y añadir un libro",
    totalBooks: "Libros en total",
    reading: "En lectura",
    completed: "Terminados",
    bookUnit: "libros",
    bookDetails: "Book Details",
    editBook: "Editar información del libro",
    addBook: "Añadir un libro",
    optionalDescription: "Solo el título es obligatorio. Completa los demás campos si conoces la información.",
    bookTitle: "Título",
    required: "Obligatorio",
    titlePlaceholder: "Título del libro",
    author: "Autor/a",
    authorPlaceholder: "Nombre del autor",
    isbn: "ISBN",
    pages: "Número total de páginas",
    pagesPlaceholder: "Ej.: 320",
    category: "Categoría",
    status: "Estado de lectura",
    saveChanges: "Guardar cambios",
    register: "＋ Añadir a la estantería",
    cancelEdit: "Cancelar edición",
    saveError: "No se pudo guardar. Comprueba el espacio de almacenamiento disponible en tu navegador.",
    saved: "Guardado.",
    titleRequired: "Por favor, introduce el título del libro.",
    updated: "La información del libro se ha actualizado.",
    registered: "El libro se ha añadido a tu estantería.",
    deleteConfirm: (title) => `¿Quieres eliminar «${title}» de tu estantería?`,
    deleted: "El libro se ha eliminado.",
    collection: "Collection",
    bookshelf: "Estantería",
    booksCount: (count) => `${count} libros`,
    all: "Todos",
    emptyBookshelf: "Tu estantería todavía está vacía",
    emptyCategory: "No hay libros en esta categoría",
    emptyBookshelfDescription: "Añade un libro con el formulario de arriba o escanéalo para incorporarlo a tu colección.",
    emptyCategoryDescription: "Selecciona otra categoría para ver los libros que has registrado.",
    authorUnknown: "Autor/a no indicado",
    pageUnit: "páginas",
    readingRecord: "Registro de lectura",
    edit: "Editar",
    delete: "Eliminar",
    backToLibrary: "← Volver a Little Library",
    categoryLabels: {
      語学: "Idiomas",
      小説: "Novela",
      教養: "Cultura general",
      歴史: "Historia",
      実用書: "Libros prácticos",
      漫画: "Cómics",
      その他: "Otros",
    },
    statusLabels: {
      未読: "Sin leer",
      読書中: "Leyendo",
      読了: "Terminado",
    },
  },
};

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  totalPages: "",
  category: "その他" as Category,
  status: "未読" as ReadingStatus,
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
    totalPages: Number(item.totalPages) || 0,
    category: categories.includes(item.category as Category)
      ? (item.category as Category)
      : "その他",
    status: statuses.includes(item.status as ReadingStatus)
      ? (item.status as ReadingStatus)
      : "未読",
  };
}

function readBooks(): Book[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeBook).filter((book): book is Book => book !== null);
  } catch {
    return [];
  }
}

const buttonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--anki-theme-soft)] bg-[var(--anki-theme-light)] px-4 py-2 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--anki-theme-color)] bg-[var(--anki-theme-color)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--anki-theme-dark)]";

const linkClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--anki-theme-soft)] bg-[var(--anki-theme-light)] px-4 py-2 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]";

const inputClass =
  "library-field w-full rounded-xl border border-[#D5D8D0] bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 transition focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]";

export default function BooksPage() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("すべて");
  const [form, setForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBooks(readBooks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {
      setMessage(t.saveError);
    }
  }, [books, loaded, t.saveError]);

  function saveBooks(nextBooks: Book[]) {
    setBooks(nextBooks);
    setMessage(t.saved);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setMessage(t.titleRequired);
      return;
    }

    const book: Book = {
      id: editingId ?? Date.now(),
      title,
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      totalPages: Math.max(0, Number(form.totalPages) || 0),
      category: form.category,
      status: form.status,
    };

    if (editingId !== null) {
      saveBooks(books.map((item) => (item.id === editingId ? book : item)));
      setMessage(t.updated);
    } else {
      saveBooks([book, ...books]);
      setMessage(t.registered);
    }

    setForm(emptyBook);
    setEditingId(null);
  }

  function startEditing(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      totalPages: book.totalPages ? String(book.totalPages) : "",
      category: book.category,
      status: book.status,
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyBook);
    setMessage("");
  }

  function deleteBook(book: Book) {
    if (!window.confirm(t.deleteConfirm(book.title))) return;

    saveBooks(books.filter((item) => item.id !== book.id));

    if (editingId === book.id) {
      setEditingId(null);
      setForm(emptyBook);
    }
    setMessage(t.deleted);
  }

  const visibleBooks =
    filter === "すべて"
      ? books
      : books.filter((book) => book.category === filter);

  const readCount = books.filter((book) => book.status === "読了").length;
  const readingCount = books.filter((book) => book.status === "読書中").length;

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F7F7F2] px-5 py-12 text-black">
        <div className="mx-auto max-w-5xl">
          <p>Little Library</p>
          <h1 className="mt-3 text-2xl font-semibold">{t.loading}</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F2] px-4 py-8 text-black sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <Link href="/library" className={linkClass}>
            {t.library}
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--anki-theme-dark)]">
                {t.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--anki-theme-dark)] sm:text-4xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#666a60]">
                {t.description}
              </p>
            </div>

            <Link href="/library/scan" className={primaryButtonClass}>
              {t.scanBook}
            </Link>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: t.totalBooks, value: books.length },
            { label: t.reading, value: readingCount },
            { label: t.completed, value: readCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#E6E7E1] bg-white p-5"
            >
              <p className="text-sm text-[#666a60]">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--anki-theme-dark)]">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-[#85877f]">{t.bookUnit}</p>
            </div>
          ))}
        </section>

        <section className="mb-10 rounded-3xl border border-[#E6E7E1] bg-white p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--anki-theme-dark)]">
              {t.bookDetails}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
              {editingId !== null ? t.editBook : t.addBook}
            </h2>
            <p className="mt-2 text-sm text-[#77796f]">
              {t.optionalDescription}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4e554b]">
                {t.bookTitle}（{t.required}）
              </label>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder={t.titlePlaceholder}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">
                  {t.author}
                </label>
                <input
                  value={form.author}
                  onChange={(event) => setForm({ ...form, author: event.target.value })}
                  placeholder={t.authorPlaceholder}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">
                  {t.isbn}
                </label>
                <input
                  value={form.isbn}
                  onChange={(event) => setForm({ ...form, isbn: event.target.value })}
                  placeholder="ISBN"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">
                  {t.pages}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.totalPages}
                  onChange={(event) => setForm({ ...form, totalPages: event.target.value })}
                  placeholder={t.pagesPlaceholder}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">
                  {t.category}
                </label>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value as Category })}
                  className={inputClass}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {t.categoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">
                  {t.status}
                </label>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as ReadingStatus })}
                  className={inputClass}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {t.statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" className={primaryButtonClass}>
                {editingId !== null ? t.saveChanges : t.register}
              </button>

              {editingId !== null && (
                <button type="button" onClick={cancelEditing} className={buttonClass}>
                  {t.cancelEdit}
                </button>
              )}

              {message && (
                <p aria-live="polite" className="text-sm text-[#66705f]">
                  {message}
                </p>
              )}
            </div>
          </form>
        </section>

        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--anki-theme-dark)]">
                {t.collection}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--anki-theme-dark)]">
                {t.bookshelf}
              </h2>
              <p className="mt-2 text-sm text-[#77796f]">
                {t.booksCount(visibleBooks.length)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["すべて", ...categories].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    filter === category
                      ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)]"
                      : "border-[#E2E5DC] bg-white text-[#555b51] hover:border-[var(--anki-theme-soft)] hover:bg-[var(--anki-theme-light)]"
                  }`}
                >
                  {category === "すべて" ? t.all : t.categoryLabels[category as Category]}
                </button>
              ))}
            </div>
          </div>

          {visibleBooks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D8DDD3] bg-white/70 px-6 py-16 text-center">
              <p className="text-lg font-medium text-[#50574d]">
                {books.length === 0 ? t.emptyBookshelf : t.emptyCategory}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#77796f]">
                {books.length === 0
                  ? t.emptyBookshelfDescription
                  : t.emptyCategoryDescription}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleBooks.map((book) => (
                <article
                  key={book.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#E6E7E1] bg-white p-5 transition hover:border-[var(--anki-theme-soft)] sm:p-6"
                >
                  <div className="flex flex-1 gap-4">
                    <div className="flex h-32 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--anki-theme-light)] text-center text-xs leading-5 text-[var(--anki-theme-dark)]">
                      <span className="break-words px-2">
                        {t.categoryLabels[book.category]}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--anki-theme-light)] px-3 py-1 text-xs text-[var(--anki-theme-dark)]">
                          {t.categoryLabels[book.category]}
                        </span>
                        <span className="rounded-full bg-[#F5F3ED] px-3 py-1 text-xs text-[#686b62]">
                          {t.statusLabels[book.status]}
                        </span>
                      </div>

                      <h3 className="break-words text-base font-semibold leading-6 text-[#30352e]">
                        {book.title}
                      </h3>
                      <p className="mt-2 break-words text-sm text-[#77796f]">
                        {book.author || t.authorUnknown}
                      </p>

                      {book.totalPages > 0 && (
                        <p className="mt-3 text-xs text-[#85877f]">
                          {book.totalPages} {t.pageUnit}
                        </p>
                      )}

                      {book.isbn && (
                        <p className="mt-1 break-all text-xs text-[#85877f]">
                          ISBN: {book.isbn}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#EEF0EA] pt-4">
                    <Link href={`/library/read?id=${book.id}`} className={linkClass}>
                      {t.readingRecord} →
                    </Link>

                    <button
                      type="button"
                      onClick={() => startEditing(book)}
                      className={buttonClass}
                    >
                      {t.edit}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteBook(book)}
                      className="inline-flex items-center justify-center rounded-xl border border-[#ead8d0] bg-[#fcf3ee] px-4 py-2 text-sm font-medium text-[#a66f65] transition hover:bg-[#f8e8e1]"
                    >
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-[#E6E7E1] pb-8 pt-6">
          <Link href="/library" className={linkClass}>
            {t.backToLibrary}
          </Link>
        </footer>
      </div>
    </main>
  );
}