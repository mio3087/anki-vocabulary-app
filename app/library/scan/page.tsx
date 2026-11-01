
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppLanguage } from "@/app/component/AppLanguage";

const STORAGE_KEY = "little-library-books-v1";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

type BookDraft = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  totalPages: string;
  selected: boolean;
  searching?: boolean;
  info?: string;
};

type SourceFile = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "pdf";
};

type GoogleBook = {
  title?: string;
  authors?: string[];
  pageCount?: number;
  industryIdentifiers?: { type: string; identifier: string }[];
};

type SavedBook = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  totalPages: string;
  category: string;
  status: string;
};

const primaryButton =
  "rounded-xl bg-[#E5E7EB] px-4 py-3 text-sm font-semibold !text-black transition hover:bg-[#D1D5DB] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium !text-black transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50";

const translations: Record<Language, Record<string, string>> = {
  ja: {
    back: "← Libraryトップへ戻る",
    title: "本・教材を読み取る",
    description: "表紙や裏表紙を撮影するか、写真・PDFを選択してください。ISBNから書名・著者・総ページ数を検索できます。",
    camera: "カメラを起動",
    selectPhoto: "写真を選択",
    selectPdf: "PDFを選択",
    cameraError: "カメラを利用できません。localhostまたはHTTPSで開いてください。",
    cameraStartError: "カメラ映像を開始できません。ブラウザの権限を確認してください。",
    cameraPermissionError: "カメラを起動できません。ブラウザのカメラ使用を許可してください。",
    cameraReady: "カメラ映像を準備しています。少し待ってください。",
    photoFailed: "撮影に失敗しました。",
    photoCreateFailed: "写真を作成できませんでした。",
    photoSuccess: "撮影しました。「読み取り・書籍情報を検索」を押してください。",
    invalidFile: "画像またはPDFファイルを選択してください。",
    selectedFiles: "選択したファイル",
    delete: "削除",
    takePhoto: "撮影する",
    closeCamera: "カメラを閉じる",
    read: "読み取り・書籍情報を検索",
    reading: "読み取り・書籍検索中…",
    starting: "読み取りを開始しています…",
    readingFile: "読み取り中",
    readingPdf: "PDF読み取り中",
    readNothing: "文字を読み取れませんでした。写真を明るくし、文字やISBNがはっきり写るように撮り直してください。",
    readComplete: "読み取り完了。ISBNを",
    detected: "件検出しました。書籍情報を検索します。",
    noIsbn: "文字の読み取りが完了しましたが、ISBNは検出できませんでした。候補を手入力してください。",
    readFailed: "読み取りに失敗しました。",
    cause: "原因",
    preview: "読み取り文章",
    pdfPages: "PDFページ数",
    bookInfo: "書籍情報",
    register: "選択した本を本棚に登録",
    autoInfo: "自動取得した情報を確認してください。取得できない項目は手入力できます。総ページ数には本の最後のページ番号を入力してください。",
    registerTarget: "登録対象",
    candidateDelete: "候補を削除",
    titleLabel: "タイトル",
    author: "著者",
    isbn: "ISBN",
    totalPages: "総ページ数",
    bookTitlePlaceholder: "本のタイトル",
    authorPlaceholder: "著者名",
    isbnPlaceholder: "ISBN-13 または ISBN-10",
    pagesPlaceholder: "例：320",
    searching: "検索中…",
    searchAgain: "ISBNから情報を再検索",
    enterIsbn: "先にISBNを入力してください。",
    searchingInfo: "書籍情報を検索中…",
    searchServiceError: "書籍情報サービスに接続できませんでした。",
    notFound: "書籍情報が見つかりませんでした。タイトルや著者を手入力できます。",
    fetched: "書籍情報を取得しました。内容を確認してください。",
    fetchedPartial: "書名・著者を取得しました。総ページ数は必要なら手入力してください。",
    searchFailed: "検索に失敗しました。インターネット接続を確認するか、情報を手入力してください。",
    selectFirst: "先に写真またはPDFを選択してください。",
    selectBook: "登録する本を選択し、タイトルを入力してください。",
    invalidData: "本棚の保存データが正しくありません。",
    alreadyExists: "選択した本はすでに本棚に登録されているようです。ISBNやタイトルを確認してください。",
    registered: "冊を本棚に登録しました。",
    registerFailed: "登録できませんでした。本棚の保存データを確認してください。",
  },
  de: {
    back: "← Zurück zur Library-Startseite",
    title: "Bücher und Lernmaterialien scannen",
    description: "Fotografiere den Buchumschlag oder wähle ein Bild bzw. eine PDF-Datei aus. Über die ISBN kannst du Titel, Autor und Seitenzahl suchen.",
    camera: "Kamera starten",
    selectPhoto: "Foto auswählen",
    selectPdf: "PDF auswählen",
    cameraError: "Die Kamera ist nicht verfügbar. Öffne die Seite über localhost oder HTTPS.",
    cameraStartError: "Das Kamerabild konnte nicht gestartet werden. Überprüfe die Browserberechtigungen.",
    cameraPermissionError: "Die Kamera konnte nicht gestartet werden. Erlaube dem Browser den Kamerazugriff.",
    cameraReady: "Die Kamera wird vorbereitet. Bitte warte einen Moment.",
    photoFailed: "Das Fotografieren ist fehlgeschlagen.",
    photoCreateFailed: "Das Foto konnte nicht erstellt werden.",
    photoSuccess: "Foto aufgenommen. Klicke auf „Scannen und Buchinformationen suchen“.",
    invalidFile: "Bitte wähle eine Bild- oder PDF-Datei aus.",
    selectedFiles: "Ausgewählte Dateien",
    delete: "Löschen",
    takePhoto: "Foto aufnehmen",
    closeCamera: "Kamera schließen",
    read: "Scannen und Buchinformationen suchen",
    reading: "Scannen und Bücher suchen…",
    starting: "Scan wird gestartet…",
    readingFile: "Wird gescannt",
    readingPdf: "PDF wird gescannt",
    readNothing: "Es konnte kein Text erkannt werden. Sorge für bessere Beleuchtung und fotografiere den Text oder die ISBN erneut.",
    readComplete: "Scan abgeschlossen. ISBNs erkannt:",
    detected: ". Suche nach Buchinformationen.",
    noIsbn: "Der Text wurde erkannt, aber es wurde keine ISBN gefunden. Du kannst die Buchinformationen manuell eingeben.",
    readFailed: "Der Scan ist fehlgeschlagen.",
    cause: "Ursache",
    preview: "Erkannter Text",
    pdfPages: "PDF-Seiten",
    bookInfo: "Buchinformationen",
    register: "Ausgewählte Bücher ins Regal aufnehmen",
    autoInfo: "Überprüfe die automatisch abgerufenen Informationen. Fehlende Angaben kannst du manuell eingeben. Gib bei der Seitenzahl die Nummer der letzten Buchseite an.",
    registerTarget: "Registrieren",
    candidateDelete: "Vorschlag löschen",
    titleLabel: "Titel",
    author: "Autor",
    isbn: "ISBN",
    totalPages: "Seitenzahl",
    bookTitlePlaceholder: "Buchtitel",
    authorPlaceholder: "Name des Autors",
    isbnPlaceholder: "ISBN-13 oder ISBN-10",
    pagesPlaceholder: "z. B. 320",
    searching: "Suche läuft…",
    searchAgain: "Informationen erneut über ISBN suchen",
    enterIsbn: "Bitte gib zuerst eine ISBN ein.",
    searchingInfo: "Suche nach Buchinformationen…",
    searchServiceError: "Der Buchinformationsdienst ist nicht erreichbar.",
    notFound: "Keine Buchinformationen gefunden. Titel und Autor können manuell eingegeben werden.",
    fetched: "Buchinformationen wurden abgerufen. Bitte überprüfe die Angaben.",
    fetchedPartial: "Titel und Autor wurden abgerufen. Die Seitenzahl kannst du bei Bedarf manuell eingeben.",
    searchFailed: "Die Suche ist fehlgeschlagen. Überprüfe deine Internetverbindung oder gib die Informationen manuell ein.",
    selectFirst: "Bitte wähle zuerst ein Foto oder eine PDF-Datei aus.",
    selectBook: "Wähle ein Buch zur Registrierung aus und gib einen Titel ein.",
    invalidData: "Die gespeicherten Regaldaten sind ungültig.",
    alreadyExists: "Die ausgewählten Bücher scheinen bereits im Regal vorhanden zu sein. Überprüfe ISBN und Titel.",
    registered: " Bücher wurden ins Regal aufgenommen.",
    registerFailed: "Die Registrierung ist fehlgeschlagen. Überprüfe die gespeicherten Regaldaten.",
  },
  en: {
    back: "← Back to Library",
    title: "Scan Books and Learning Materials",
    description: "Take a photo of the front or back cover, or select an image or PDF. Search for the title, author, and total pages using the ISBN.",
    camera: "Open Camera",
    selectPhoto: "Choose Photo",
    selectPdf: "Choose PDF",
    cameraError: "Camera access is unavailable. Open this page using localhost or HTTPS.",
    cameraStartError: "Could not start the camera preview. Check your browser permissions.",
    cameraPermissionError: "Could not start the camera. Please allow camera access in your browser.",
    cameraReady: "Preparing the camera. Please wait a moment.",
    photoFailed: "Failed to take the photo.",
    photoCreateFailed: "Could not create the photo.",
    photoSuccess: "Photo captured. Press “Scan and Search Book Information”.",
    invalidFile: "Please select an image or PDF file.",
    selectedFiles: "Selected Files",
    delete: "Delete",
    takePhoto: "Take Photo",
    closeCamera: "Close Camera",
    read: "Scan and Search Book Information",
    reading: "Scanning and searching…",
    starting: "Starting scan…",
    readingFile: "Scanning",
    readingPdf: "Scanning PDF",
    readNothing: "No text could be recognized. Improve the lighting and retake the photo so the text and ISBN are clear.",
    readComplete: "Scan complete. ISBNs detected: ",
    detected: ". Searching for book information.",
    noIsbn: "Text recognition is complete, but no ISBN was detected. You can enter the book details manually.",
    readFailed: "Scanning failed.",
    cause: "Cause",
    preview: "Recognized Text",
    pdfPages: "PDF Pages",
    bookInfo: "Book Information",
    register: "Add Selected Books to Library",
    autoInfo: "Check the automatically retrieved information. You can enter missing details manually. For total pages, enter the page number of the last page of the book.",
    registerTarget: "Book",
    candidateDelete: "Remove Candidate",
    titleLabel: "Title",
    author: "Author",
    isbn: "ISBN",
    totalPages: "Total Pages",
    bookTitlePlaceholder: "Book title",
    authorPlaceholder: "Author name",
    isbnPlaceholder: "ISBN-13 or ISBN-10",
    pagesPlaceholder: "e.g. 320",
    searching: "Searching…",
    searchAgain: "Search ISBN Again",
    enterIsbn: "Please enter an ISBN first.",
    searchingInfo: "Searching for book information…",
    searchServiceError: "Could not connect to the book information service.",
    notFound: "No book information found. You can enter the title and author manually.",
    fetched: "Book information retrieved. Please review the details.",
    fetchedPartial: "Title and author retrieved. Enter the total pages manually if needed.",
    searchFailed: "Search failed. Check your internet connection or enter the information manually.",
    selectFirst: "Please select a photo or PDF first.",
    selectBook: "Select a book to register and enter its title.",
    invalidData: "The saved library data is invalid.",
    alreadyExists: "The selected books appear to be already registered. Check the ISBN or title.",
    registered: " books added to your library.",
    registerFailed: "Could not register the books. Please check your saved library data.",
  },
  "zh-CN": {
    back: "← 返回 Library 首页",
    title: "扫描书籍和学习资料",
    description: "拍摄书籍封面或封底，或者选择照片、PDF文件。可以通过ISBN查询书名、作者和总页数。",
    camera: "启动相机",
    selectPhoto: "选择照片",
    selectPdf: "选择PDF",
    cameraError: "无法使用相机。请通过localhost或HTTPS打开页面。",
    cameraStartError: "无法启动相机画面。请检查浏览器权限。",
    cameraPermissionError: "无法启动相机。请允许浏览器使用相机。",
    cameraReady: "正在准备相机画面，请稍等。",
    photoFailed: "拍照失败。",
    photoCreateFailed: "无法创建照片。",
    photoSuccess: "拍摄完成。请点击“扫描并查询书籍信息”。",
    invalidFile: "请选择图片或PDF文件。",
    selectedFiles: "已选择的文件",
    delete: "删除",
    takePhoto: "拍照",
    closeCamera: "关闭相机",
    read: "扫描并查询书籍信息",
    reading: "正在扫描并查询书籍信息…",
    starting: "正在开始扫描…",
    readingFile: "正在扫描",
    readingPdf: "正在扫描PDF",
    readNothing: "无法识别文字。请改善光线，并重新拍摄，确保文字和ISBN清晰可见。",
    readComplete: "扫描完成，检测到ISBN：",
    detected: "个。正在查询书籍信息。",
    noIsbn: "文字识别已完成，但未检测到ISBN。你可以手动输入书籍信息。",
    readFailed: "扫描失败。",
    cause: "原因",
    preview: "识别出的文字",
    pdfPages: "PDF页数",
    bookInfo: "书籍信息",
    register: "将选中的书籍添加到书架",
    autoInfo: "请确认自动获取的信息。未获取到的内容可以手动输入。总页数请填写书籍最后一页的页码。",
    registerTarget: "登记项目",
    candidateDelete: "删除候选项",
    titleLabel: "书名",
    author: "作者",
    isbn: "ISBN",
    totalPages: "总页数",
    bookTitlePlaceholder: "书名",
    authorPlaceholder: "作者姓名",
    isbnPlaceholder: "ISBN-13或ISBN-10",
    pagesPlaceholder: "例如：320",
    searching: "查询中…",
    searchAgain: "重新通过ISBN查询信息",
    enterIsbn: "请先输入ISBN。",
    searchingInfo: "正在查询书籍信息…",
    searchServiceError: "无法连接书籍信息服务。",
    notFound: "未找到书籍信息。可以手动输入书名和作者。",
    fetched: "已获取书籍信息，请确认内容。",
    fetchedPartial: "已获取书名和作者。如有需要，请手动输入总页数。",
    searchFailed: "查询失败。请检查网络连接，或手动输入信息。",
    selectFirst: "请先选择照片或PDF文件。",
    selectBook: "请选择要登记的书籍，并输入书名。",
    invalidData: "书架保存的数据格式不正确。",
    alreadyExists: "所选书籍似乎已经添加到书架。请确认ISBN或书名。",
    registered: "本书籍已添加到书架。",
    registerFailed: "无法完成登记。请检查书架的保存数据。",
  },
  "zh-TW": {
    back: "← 返回 Library 首頁",
    title: "掃描書籍與學習教材",
    description: "拍攝書籍封面或封底，或選擇照片、PDF檔案。可以透過ISBN查詢書名、作者及總頁數。",
    camera: "啟動相機",
    selectPhoto: "選擇照片",
    selectPdf: "選擇PDF",
    cameraError: "無法使用相機。請透過localhost或HTTPS開啟頁面。",
    cameraStartError: "無法啟動相機畫面。請檢查瀏覽器權限。",
    cameraPermissionError: "無法啟動相機。請允許瀏覽器使用相機。",
    cameraReady: "正在準備相機畫面，請稍候。",
    photoFailed: "拍照失敗。",
    photoCreateFailed: "無法建立照片。",
    photoSuccess: "拍攝完成。請點選「掃描並查詢書籍資訊」。",
    invalidFile: "請選擇圖片或PDF檔案。",
    selectedFiles: "已選擇的檔案",
    delete: "刪除",
    takePhoto: "拍照",
    closeCamera: "關閉相機",
    read: "掃描並查詢書籍資訊",
    reading: "正在掃描並查詢書籍資訊…",
    starting: "正在開始掃描…",
    readingFile: "正在掃描",
    readingPdf: "正在掃描PDF",
    readNothing: "無法辨識文字。請改善光線，重新拍攝，並確保文字與ISBN清晰可見。",
    readComplete: "掃描完成，偵測到ISBN：",
    detected: "筆。正在查詢書籍資訊。",
    noIsbn: "文字辨識已完成，但未偵測到ISBN。你可以手動輸入書籍資訊。",
    readFailed: "掃描失敗。",
    cause: "原因",
    preview: "辨識出的文字",
    pdfPages: "PDF頁數",
    bookInfo: "書籍資訊",
    register: "將選取的書籍加入書架",
    autoInfo: "請確認自動取得的資訊。未取得的項目可以手動輸入。總頁數請填寫書籍最後一頁的頁碼。",
    registerTarget: "登記項目",
    candidateDelete: "刪除候選項目",
    titleLabel: "書名",
    author: "作者",
    isbn: "ISBN",
    totalPages: "總頁數",
    bookTitlePlaceholder: "書名",
    authorPlaceholder: "作者姓名",
    isbnPlaceholder: "ISBN-13或ISBN-10",
    pagesPlaceholder: "例如：320",
    searching: "查詢中…",
    searchAgain: "重新透過ISBN查詢資訊",
    enterIsbn: "請先輸入ISBN。",
    searchingInfo: "正在查詢書籍資訊…",
    searchServiceError: "無法連線至書籍資訊服務。",
    notFound: "找不到書籍資訊。可以手動輸入書名和作者。",
    fetched: "已取得書籍資訊，請確認內容。",
    fetchedPartial: "已取得書名和作者。如有需要，請手動輸入總頁數。",
    searchFailed: "查詢失敗。請檢查網路連線，或手動輸入資訊。",
    selectFirst: "請先選擇照片或PDF檔案。",
    selectBook: "請選擇要登記的書籍，並輸入書名。",
    invalidData: "書架儲存的資料格式不正確。",
    alreadyExists: "所選書籍似乎已經加入書架。請確認ISBN或書名。",
    registered: "本書籍已加入書架。",
    registerFailed: "無法完成登記。請檢查書架的儲存資料。",
  },
  es: {
    back: "← Volver a la biblioteca",
    title: "Escanear libros y materiales de estudio",
    description: "Fotografía la portada o contraportada, o selecciona una imagen o un PDF. Puedes buscar el título, el autor y el número total de páginas mediante el ISBN.",
    camera: "Abrir cámara",
    selectPhoto: "Seleccionar foto",
    selectPdf: "Seleccionar PDF",
    cameraError: "La cámara no está disponible. Abre la página mediante localhost o HTTPS.",
    cameraStartError: "No se pudo iniciar la vista de la cámara. Comprueba los permisos del navegador.",
    cameraPermissionError: "No se pudo iniciar la cámara. Permite el acceso a la cámara en el navegador.",
    cameraReady: "Preparando la cámara. Espera un momento.",
    photoFailed: "No se pudo tomar la foto.",
    photoCreateFailed: "No se pudo crear la foto.",
    photoSuccess: "Foto tomada. Pulsa «Escanear y buscar información del libro».",
    invalidFile: "Selecciona una imagen o un archivo PDF.",
    selectedFiles: "Archivos seleccionados",
    delete: "Eliminar",
    takePhoto: "Tomar foto",
    closeCamera: "Cerrar cámara",
    read: "Escanear y buscar información del libro",
    reading: "Escaneando y buscando libros…",
    starting: "Iniciando el escaneo…",
    readingFile: "Escaneando",
    readingPdf: "Escaneando PDF",
    readNothing: "No se pudo reconocer ningún texto. Mejora la iluminación y vuelve a tomar la foto para que el texto y el ISBN se vean claramente.",
    readComplete: "Escaneo completado. ISBN detectados: ",
    detected: ". Buscando información del libro.",
    noIsbn: "El reconocimiento de texto ha terminado, pero no se ha detectado ningún ISBN. Puedes introducir los datos manualmente.",
    readFailed: "No se pudo completar el escaneo.",
    cause: "Causa",
    preview: "Texto reconocido",
    pdfPages: "Páginas del PDF",
    bookInfo: "Información del libro",
    register: "Añadir los libros seleccionados a la biblioteca",
    autoInfo: "Revisa la información obtenida automáticamente. Puedes introducir manualmente los datos que falten. En el número total de páginas, indica el número de la última página del libro.",
    registerTarget: "Registrar",
    candidateDelete: "Eliminar candidato",
    titleLabel: "Título",
    author: "Autor",
    isbn: "ISBN",
    totalPages: "Total de páginas",
    bookTitlePlaceholder: "Título del libro",
    authorPlaceholder: "Nombre del autor",
    isbnPlaceholder: "ISBN-13 o ISBN-10",
    pagesPlaceholder: "Ej.: 320",
    searching: "Buscando…",
    searchAgain: "Volver a buscar mediante ISBN",
    enterIsbn: "Introduce primero el ISBN.",
    searchingInfo: "Buscando información del libro…",
    searchServiceError: "No se pudo conectar con el servicio de información de libros.",
    notFound: "No se encontró información del libro. Puedes introducir el título y el autor manualmente.",
    fetched: "Se ha obtenido la información del libro. Revísala, por favor.",
    fetchedPartial: "Se han obtenido el título y el autor. Introduce el total de páginas manualmente si es necesario.",
    searchFailed: "La búsqueda ha fallado. Comprueba tu conexión a Internet o introduce los datos manualmente.",
    selectFirst: "Selecciona primero una foto o un PDF.",
    selectBook: "Selecciona un libro para registrar e introduce su título.",
    invalidData: "Los datos guardados de la biblioteca no son válidos.",
    alreadyExists: "Parece que los libros seleccionados ya están registrados. Comprueba el ISBN o el título.",
    registered: " libros añadidos a la biblioteca.",
    registerFailed: "No se pudieron registrar los libros. Comprueba los datos guardados de la biblioteca.",
  },
};

export default function LibraryScanPage() {
  const { language } = useAppLanguage();
  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";
  const t = translations[currentLanguage];

  const cameraRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  const [sources, setSources] = useState<SourceFile[]>([]);
  const [drafts, setDrafts] = useState<BookDraft[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [pdfPages, setPdfPages] = useState(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function startCamera() {
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(t.cameraError);
      return;
    }

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          cameraRef.current.play().catch(() => {
            setMessage(t.cameraStartError);
          });
        }
      });
    } catch (error) {
      console.error("カメラ起動エラー:", error);
      setMessage(t.cameraPermissionError);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  function addFiles(files: File[]) {
    const accepted = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    const next: SourceFile[] = accepted.map((file, index) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);

      return {
        id: `${Date.now()}-${index}-${Math.random()}`,
        file,
        url,
        kind:
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
            ? "pdf"
            : "image",
      };
    });

    if (accepted.length !== files.length) {
      setMessage(t.invalidFile);
    } else {
      setMessage("");
    }

    if (next.length) {
      setSources((current) => [...current, ...next]);
      setDrafts([]);
      setPreviewText("");
      setPdfPages(0);
    }

    if (photoRef.current) photoRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";
  }

  function takePhoto() {
    const video = cameraRef.current;

    if (!video?.videoWidth || !video.videoHeight) {
      setMessage(t.cameraReady);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setMessage(t.photoFailed);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setMessage(t.photoCreateFailed);
          return;
        }

        const file = new File([blob], `book-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        addFiles([file]);
        stopCamera();
        setMessage(t.photoSuccess);
      },
      "image/jpeg",
      0.95
    );
  }

  function removeSource(id: string) {
    const target = sources.find((source) => source.id === id);

    if (target) {
      URL.revokeObjectURL(target.url);
      urlsRef.current = urlsRef.current.filter((url) => url !== target.url);
    }

    setSources((current) => current.filter((source) => source.id !== id));
    setDrafts([]);
    setPreviewText("");
    setPdfPages(0);
    setMessage("");
  }

  function extractISBNs(text: string): string[] {
    const normalized = text
      .replace(/[‐‑‒–—―ー]/g, "-")
      .replace(/[０-９]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
      );

    const candidates =
      normalized.match(
        /(?:ISBN(?:-1[03])?\s*:?\s*)?(?:97[89][-\s]?)?(?:\d[-\s]?){9,12}[\dXx]/gi
      ) ?? [];

    const valid: string[] = [];

    for (const candidate of candidates) {
      const digits = candidate
        .replace(/^ISBN(?:-1[03])?\s*:?\s*/i, "")
        .replace(/[-\s]/g, "")
        .toUpperCase();

      if (digits.length === 13 && /^\d{13}$/.test(digits)) {
        const sum = digits
          .slice(0, 12)
          .split("")
          .reduce(
            (total, digit, index) =>
              total + Number(digit) * (index % 2 === 0 ? 1 : 3),
            0
          );

        const check = (10 - (sum % 10)) % 10;

        if (check === Number(digits[12])) {
          valid.push(digits);
        }
      } else if (digits.length === 10 && /^\d{9}[\dX]$/.test(digits)) {
        const sum = digits.split("").reduce(
          (total, digit, index) =>
            total + (digit === "X" ? 10 : Number(digit)) * (10 - index),
          0
        );

        if (sum % 11 === 0) {
          valid.push(digits);
        }
      }
    }

    return Array.from(new Set(valid));
  }

  async function lookupBook(id: string, isbnOverride?: string) {
    const draft = drafts.find((item) => item.id === id);
    const isbn = (isbnOverride ?? draft?.isbn ?? "").replace(/[-\s]/g, "");

    if (!isbn) {
      setDrafts((current) =>
        current.map((item) =>
          item.id === id ? { ...item, info: t.enterIsbn } : item
        )
      );
      return;
    }

    setDrafts((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, isbn, searching: true, info: t.searchingInfo }
          : item
      )
    );

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&maxResults=10`
      );

      if (!response.ok) {
        throw new Error(t.searchServiceError);
      }

      const data = await response.json();
      const items: { volumeInfo?: GoogleBook }[] = data.items ?? [];

      const normalizedISBN = (value: string) =>
        value.replace(/[-\s]/g, "").toUpperCase();

      const exact = items.find((item) =>
        item.volumeInfo?.industryIdentifiers?.some(
          (identifier) =>
            normalizedISBN(identifier.identifier) === normalizedISBN(isbn)
        )
      );

      const volume = (exact ?? items[0])?.volumeInfo;

      if (!volume) {
        setDrafts((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  searching: false,
                  info: t.notFound,
                }
              : item
          )
        );
        return;
      }

      const resultISBN =
        volume.industryIdentifiers?.find((item) => item.type === "ISBN_13")
          ?.identifier ??
        volume.industryIdentifiers?.find((item) => item.type === "ISBN_10")
          ?.identifier ??
        isbn;

      setDrafts((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                title: volume.title || item.title,
                author: volume.authors?.join(", ") || item.author,
                isbn: resultISBN,
                totalPages:
                  volume.pageCount && volume.pageCount > 0
                    ? String(volume.pageCount)
                    : item.totalPages,
                searching: false,
                info: volume.pageCount ? t.fetched : t.fetchedPartial,
              }
            : item
        )
      );
    } catch (error) {
      console.error("書籍情報検索エラー:", error);

      setDrafts((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                searching: false,
                info: t.searchFailed,
              }
            : item
        )
      );
    }
  }

  async function readFiles() {
    if (!sources.length) {
      setMessage(t.selectFirst);
      return;
    }

    setScanning(true);
    setMessage(t.starting);
    setPreviewText("");
    setDrafts([]);
    setPdfPages(0);

    const extractedTexts: string[] = [];

    try {
      let pdfjs: typeof import("pdfjs-dist") | null = null;
      let Tesseract: typeof import("tesseract.js") | null = null;
      let pageCount = 0;

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];

        setMessage(`${t.readingFile}：${i + 1}/${sources.length}`);

        if (source.kind === "pdf") {
          if (!pdfjs) {
            pdfjs = await import("pdfjs-dist");

            pdfjs.GlobalWorkerOptions.workerSrc = new URL(
              "pdfjs-dist/build/pdf.worker.min.mjs",
              import.meta.url
            ).toString();
          }

          const buffer = await source.file.arrayBuffer();
          const pdf = await pdfjs.getDocument({
            data: new Uint8Array(buffer),
          }).promise;

          pageCount += pdf.numPages;

          for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
          ) {
            setMessage(
              `${t.readingPdf}：${i + 1}/${sources.length}　${pageNumber}/${pdf.numPages}`
            );

            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();

            let pageText = content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ");

            if (!pageText.trim()) {
              if (!Tesseract) {
                Tesseract = await import("tesseract.js");
              }

              const viewport = page.getViewport({ scale: 2 });
              const canvas = document.createElement("canvas");

              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);

              const context = canvas.getContext("2d");
              if (!context) continue;

              await page.render({
                canvas,
                canvasContext: context,
                viewport,
              }).promise;

              const result = await Tesseract.recognize(canvas, "jpn+eng");
              pageText = result.data.text;

              canvas.width = 0;
              canvas.height = 0;
            }

            extractedTexts.push(
              `【${source.file.name}・${pageNumber}ページ】\n${pageText}`
            );
          }
        } else {
          if (!Tesseract) {
            Tesseract = await import("tesseract.js");
          }

          const result = await Tesseract.recognize(source.file, "jpn+eng");

          extractedTexts.push(
            `【${source.file.name}】\n${result.data.text}`
          );
        }
      }

      setPdfPages(pageCount);

      const allText = extractedTexts.join("\n\n---\n\n").trim();
      setPreviewText(allText);

      if (!allText) {
        setMessage(t.readNothing);
        return;
      }

      const isbns = extractISBNs(allText);

      const nextDrafts: BookDraft[] = isbns.length
        ? isbns.map((isbn, index) => ({
            id: `${Date.now()}-${index}-${Math.random()}`,
            title: "",
            author: "",
            isbn,
            totalPages: "",
            selected: true,
            info: t.searchingInfo,
          }))
        : [
            {
              id: `${Date.now()}-${Math.random()}`,
              title: "",
              author: "",
              isbn: "",
              totalPages: "",
              selected: true,
              info: t.noIsbn,
            },
          ];

      setDrafts(nextDrafts);

      setMessage(
        isbns.length
          ? `${t.readComplete}${isbns.length}${t.detected}`
          : t.noIsbn
      );

      if (isbns.length) {
        for (const draft of nextDrafts) {
          await lookupBook(draft.id, draft.isbn);
        }
      }
    } catch (error) {
      console.error("書籍読み取りエラー:", error);

      const detail =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);

      setMessage(`${t.readFailed}\n${t.cause}: ${detail}`);
    } finally {
      setScanning(false);
    }
  }

  function updateDraft(
    id: string,
    field: "title" | "author" | "isbn" | "totalPages",
    value: string
  ) {
    setDrafts((current) =>
      current.map((book) =>
        book.id === id ? { ...book, [field]: value, info: "" } : book
      )
    );
  }

  function toggleDraft(id: string) {
    setDrafts((current) =>
      current.map((book) =>
        book.id === id ? { ...book, selected: !book.selected } : book
      )
    );
  }

  function removeDraft(id: string) {
    setDrafts((current) => current.filter((book) => book.id !== id));
  }

  function registerBooks() {
    const selected = drafts.filter(
      (book) => book.selected && book.title.trim()
    );

    if (!selected.length) {
      setMessage(t.selectBook);
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) {
        throw new Error(t.invalidData);
      }

      const existing = parsed as SavedBook[];

      const existingISBNs = new Set(
        existing
          .map((book) =>
            (book.isbn || "").replace(/[-\s]/g, "").toUpperCase()
          )
          .filter(Boolean)
      );

      const addedISBNs = new Set<string>();
      const addedTitles = new Set<string>();

      const newBooks: SavedBook[] = selected
        .filter((book) => {
          const isbn = book.isbn.replace(/[-\s]/g, "").toUpperCase();
          const title = book.title.trim().toLowerCase();

          if (isbn && (existingISBNs.has(isbn) || addedISBNs.has(isbn))) {
            return false;
          }

          if (!isbn && addedTitles.has(title)) {
            return false;
          }

          if (isbn) addedISBNs.add(isbn);
          else addedTitles.add(title);

          return true;
        })
        .map((book, index) => ({
          id: Date.now() + index,
          title: book.title.trim(),
          author: book.author.trim(),
          isbn: book.isbn.trim(),
          totalPages: book.totalPages.trim(),
          category: "その他",
          status: "未読",
        }));

      if (!newBooks.length) {
        setMessage(t.alreadyExists);
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...existing, ...newBooks])
      );

      const registeredIds = new Set(
        selected
          .filter((draft) =>
            newBooks.some(
              (book) =>
                book.title === draft.title.trim() &&
                book.isbn === draft.isbn.trim()
            )
          )
          .map((draft) => draft.id)
      );

      setDrafts((current) =>
        current.filter((draft) => !registeredIds.has(draft.id))
      );

      setMessage(
        currentLanguage === "ja"
          ? `${newBooks.length}${t.registered}`
          : currentLanguage === "zh-CN" || currentLanguage === "zh-TW"
            ? `${newBooks.length}${t.registered}`
            : `${newBooks.length}${t.registered}`
      );
    } catch (error) {
      console.error("本棚登録エラー:", error);
      setMessage(t.registerFailed);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <Link
            href="/library"
            className="text-sm font-medium text-[#526B59] hover:underline"
          >
            {t.back}
          </Link>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {t.title}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#626A62]">
            {t.description}
          </p>
        </header>

        <section className="rounded-2xl border border-[#E2E5DE] bg-white p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={startCamera}
              className={secondaryButton}
              style={{ color: "#000000" }}
            >
              {t.camera}
            </button>

            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className={secondaryButton}
              style={{ color: "#000000" }}
            >
              {t.selectPhoto}
            </button>

            <button
              type="button"
              onClick={() => pdfRef.current?.click()}
              className={secondaryButton}
              style={{ color: "#000000" }}
            >
              {t.selectPdf}
            </button>
          </div>

          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) =>
              addFiles(Array.from(event.target.files ?? []))
            }
          />

          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(event) =>
              addFiles(Array.from(event.target.files ?? []))
            }
          />

          {cameraOpen && (
            <div className="mt-5 space-y-3">
              <video
                ref={cameraRef}
                autoPlay
                playsInline
                muted
                className="max-h-[65vh] w-full rounded-xl bg-black object-contain"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={takePhoto}
                  className={primaryButton}
                  style={{ color: "#000000" }}
                >
                  {t.takePhoto}
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className={secondaryButton}
                  style={{ color: "#000000" }}
                >
                  {t.closeCamera}
                </button>
              </div>
            </div>
          )}

          {sources.length > 0 && (
            <div className="mt-6 space-y-3">
              <h2 className="text-sm font-semibold text-[#30332F]">
                {t.selectedFiles}（{sources.length}）
              </h2>

              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 rounded-xl border border-[#E2E5DE] p-3"
                >
                  {source.kind === "image" ? (
                    <img
                      src={source.url}
                      alt={source.file.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#E9EDF2] text-sm font-semibold text-black">
                      PDF
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#30332F]">
                      {source.file.name}
                    </p>
                    <p className="mt-1 text-xs text-[#626A62]">
                      {(source.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSource(source.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-black hover:bg-[#F1F5F9] hover:text-red-700"
                  >
                    {t.delete}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={readFiles}
            disabled={!sources.length || scanning}
            className={`${primaryButton} mt-5 w-full sm:w-auto`}
            style={{ color: "#000000" }}
          >
            {scanning ? t.reading : t.read}
          </button>

          {message && (
            <p
              role="status"
              className="mt-4 whitespace-pre-wrap rounded-xl bg-[#F1F5F9] p-3 text-sm leading-6 text-[#334155]"
            >
              {message}
            </p>
          )}
        </section>

        {previewText && (
          <section className="mt-7 rounded-2xl border border-[#E2E5DE] bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold">{t.preview}</h2>

            {pdfPages > 0 && (
              <p className="mt-2 text-xs text-[#626A62]">
                {t.pdfPages}：{pdfPages}
              </p>
            )}

            <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#F7F7F5] p-4 text-sm leading-6 text-[#30332F]">
              {previewText}
            </pre>
          </section>
        )}

        {drafts.length > 0 && (
          <section className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                {t.bookInfo}（{drafts.length}）
              </h2>

              <button
                type="button"
                onClick={registerBooks}
                className={primaryButton}
                style={{ color: "#000000" }}
              >
                {t.register}
              </button>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#626A62]">
              {t.autoInfo}
            </p>

            <div className="mt-4 space-y-4">
              {drafts.map((book, index) => (
                <article
                  key={book.id}
                  className="rounded-2xl border border-[#E2E5DE] bg-white p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#30332F]">
                      <input
                        type="checkbox"
                        checked={book.selected}
                        onChange={() => toggleDraft(book.id)}
                        className="h-4 w-4 accent-[#334155]"
                      />
                      {t.registerTarget} {index + 1}
                    </label>

                    <button
                      type="button"
                      onClick={() => removeDraft(book.id)}
                      className="text-xs font-medium text-black hover:text-red-700"
                    >
                      {t.candidateDelete}
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-medium text-[#626A62]">
                      {t.titleLabel}
                      <input
                        value={book.title}
                        onChange={(event) =>
                          updateDraft(book.id, "title", event.target.value)
                        }
                        placeholder={t.bookTitlePlaceholder}
                        className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#334155] focus:ring-2 focus:ring-[#CBD5E1]"
                      />
                    </label>

                    <label className="text-xs font-medium text-[#626A62]">
                      {t.author}
                      <input
                        value={book.author}
                        onChange={(event) =>
                          updateDraft(book.id, "author", event.target.value)
                        }
                        placeholder={t.authorPlaceholder}
                        className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#334155] focus:ring-2 focus:ring-[#CBD5E1]"
                      />
                    </label>

                    <label className="text-xs font-medium text-[#626A62]">
                      {t.isbn}
                      <input
                        value={book.isbn}
                        onChange={(event) =>
                          updateDraft(book.id, "isbn", event.target.value)
                        }
                        placeholder={t.isbnPlaceholder}
                        className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#334155] focus:ring-2 focus:ring-[#CBD5E1]"
                      />
                    </label>

                    <label className="text-xs font-medium text-[#626A62]">
                      {t.totalPages}
                      <input
                        type="number"
                        min="1"
                        value={book.totalPages}
                        onChange={(event) =>
                          updateDraft(
                            book.id,
                            "totalPages",
                            event.target.value
                          )
                        }
                        placeholder={t.pagesPlaceholder}
                        className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#334155] focus:ring-2 focus:ring-[#CBD5E1]"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => lookupBook(book.id)}
                      disabled={book.searching || !book.isbn.trim()}
                      className={secondaryButton}
                      style={{ color: "#000000" }}
                    >
                      {book.searching ? t.searching : t.searchAgain}
                    </button>

                    {book.info && (
                      <p className="text-xs leading-5 text-[#475569]">
                        {book.info}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={registerBooks}
              className={`${primaryButton} mt-5`}
              style={{ color: "#000000" }}
            >
              {t.register}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
