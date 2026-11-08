"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useLanguage } from "@/app/component/AppLanguage";

type LanguageCode = "ja" | "en" | "de" | "es" | "zh-CN" | "zh-TW";
type TaskStatus = "未着手" | "進行中" | "完了";
type TaskUnit = "単語" | "ページ" | "分" | "章" | "回";

type StudyTask = {
  id: string;
  title: string;
  type: "教材の学習" | "単語の暗記・復習";
  material: string;
  target: number;
  unit: TaskUnit;
  startDate: string;
  scheduledDate: string;
  dueDate: string;
  status: TaskStatus;
  repeat: "なし" | "毎日" | "毎週";
  repeatDays: number[];
};

type StudyLog = {
  date: string;
  words: number;
  pages: number;
  minutes: number;
  note: string;
};

type Exam = {
  id: string;
  name: string;
  date: string;
};

type CalendarData = {
  logs: StudyLog[];
  exams: Exam[];
  freezeCount?: number;
  usedFreezeDates?: string[];
};

const STORAGE_KEY = "anki-calendar-data-v1";

const EMPTY_DATA: CalendarData = {
  logs: [],
  exams: [],
  freezeCount: 1,
  usedFreezeDates: [],
};

const translations: Record<LanguageCode, any> = {
  ja: {
    slogan: "小さな積み重ねが、未来の自分をつくる。",
    today: "今日に戻る",
    closeMessage: "メッセージを閉じる",
    loading: "学習データを読み込んでいます…",
    studyDays: "学習日数",
    studyDaysCaption: "今月、学習した日数",
    taskCompletion: "タスク達成率",
    tasksCompleted: "タスク完了",
    vocabulary: "単語",
    vocabularyCaption: "今月、学習した単語",
    studyTime: "学習時間",
    pagesStudied: "ページ学習",
    schedule: "学習予定",
    monthlySchedule: "月の学習予定と記録",
    previousMonth: "前の月",
    nextMonth: "次の月",
    weekdays: ["月", "火", "水", "木", "金", "土", "日"],
    todayLabel: "今日",
    studyRecord: "学習記録",
    task: "タスク",
    examDay: "試験日",
    selectedTasks: "選択日のタスク",
    noTasks: "この日のタスクはありません",
    tasksHint: "タスク管理ページで登録した予定もここに表示されます。",
    addCommonTask: "共通タスクを追加",
    commonTaskDescription: "ここで追加したタスクはタスク管理ページにも反映されます。",
    taskName: "タスク名",
    taskNamePlaceholder: "例：中国語の単語復習",
    materialName: "教材・デッキ名（任意）",
    materialPlaceholder: "例：TOCFL中級単語",
    taskType: "タスクの種類",
    vocabularyReview: "単語の暗記・復習",
    materialStudy: "教材の学習",
    targetAmount: "目標量",
    unit: "単位",
    units: ["単語", "ページ", "分", "章", "回"],
    addTask: "共通タスクを追加",
    loginToShare: "ログインすると、タスク管理と共有できます。",
    loginRequired: "共通タスクを登録するにはログインしてください。",
    enterTaskName: "タスク名を入力してください。",
    invalidTarget: "目標量は1以上の整数にしてください。",
    taskCreateError: "タスクを登録できませんでした。",
    taskLoginRequired: "タスクの更新にはログインが必要です。",
    taskUpdateError: "タスクの状態を更新できませんでした。",
    taskDeleteError: "タスクを削除できませんでした。",
    changeTaskStatus: "の完了状態を変更",
    target: "目標",
    deadline: "期限日",
    delete: "削除",
    journal: "学習の記録",
    journalDescription: "できたことを記録し、小さな進歩を残しましょう。",
    wordCount: "単語数",
    pageCount: "ページ数",
    minutes: "時間（分）",
    dailyNote: "今日のメモ",
    notePlaceholder: "今日できたこと、気づいたこと、次にやりたいこと…",
    saveRecord: "記録を保存する",
    savedRecord: "この日の学習記録を保存済み",
    invalidStudyAmount: "学習量は0以上の整数にしてください。",
    milestones: "試験日カウントダウン",
    milestoneDescription: "目標の日まで、一歩ずつ。",
    noExams: "試験日を登録してみましょう",
    noExamsDescription: "大切な目標をカレンダーに残せます。",
    todayExam: "今日！",
    daysAgo: "日前",
    daysLeft: "あと {n} 日",
    pastExam: "終了した試験",
    examToday: "本番の日",
    keepGoing: "KEEP GOING",
    examName: "試験名",
    examNamePlaceholder: "例：TOCFL CAT",
    examDate: "試験日",
    addExam: "試験日を登録",
    examLimit: "試験日は最大5件まで登録できます。",
    examCount: "{n}/5 件登録済み",
    enterExam: "試験名と試験日を入力してください。",
    nextMilestone: "次の目標",
    preparingFor: "に向けて準備中",
    daysToGo: "残り日数",
    loadingError: "学習記録を読み込めませんでした。保存先をご確認ください。",
    tasksLoadingError: "タスクを読み込めませんでした。",
    localSaveError: "ブラウザへの保存に失敗しました。",
    saveError: "保存に失敗しました。ログイン状態をご確認ください。",
    saving: "保存中…",
    cloudSaved: "クラウドに保存",
    browserSaved: "このブラウザに保存",
    reading: "読み込み中",
    home: "ホーム",
    todayPage: "今日のノルマ",
    plan: "学習計画",
    decks: "教材・デッキ",
    footer: "Make progress, one little step at a time.",
    freezeTicketTitle: "🛡️ お休みチケット (Streak Freeze)",
    freezeTicketDesc: "チケットを使うと、この日をお休みにしても連続記録が守られます。",
    useFreezeBtn: "この日にお休みチケットを使う",
    freezeUsedLabel: "🛡️ お休み適用中",
    freezeCancelBtn: "解除する",
    freezeCountLabel: "所持: {n}枚",
    dateFormat: (y: number, m: number, d: number) => `${y}年${m}月${d}日`,
    monthFormat: (y: number, m: number) => `${y}年${m}月`,
    monthNames: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    status: {
      未着手: "未着手",
      進行中: "進行中",
      完了: "完了",
    },
    unitLabel: {
      単語: "単語",
      ページ: "ページ",
      分: "分",
      章: "章",
      回: "回",
    },
  },

  en: {
    slogan: "Small steps today shape who you become tomorrow.",
    today: "Today",
    closeMessage: "Close message",
    loading: "Loading your study data…",
    studyDays: "STUDY DAYS",
    studyDaysCaption: "Days studied this month",
    taskCompletion: "TASK COMPLETION",
    tasksCompleted: "tasks completed",
    vocabulary: "VOCABULARY",
    vocabularyCaption: "Words studied this month",
    studyTime: "STUDY TIME",
    pagesStudied: "pages studied",
    schedule: "YOUR SCHEDULE",
    monthlySchedule: "Study schedule and records",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    todayLabel: "TODAY",
    studyRecord: "Study record",
    task: "Task",
    examDay: "Exam",
    selectedTasks: "Tasks for selected date",
    noTasks: "No tasks scheduled for this day",
    tasksHint: "Tasks created on the Task Management page will also appear here.",
    addCommonTask: "Add a shared task",
    commonTaskDescription: "Tasks added here will also appear on the Task Management page.",
    taskName: "Task name",
    taskNamePlaceholder: "e.g. Review Chinese vocabulary",
    materialName: "Material / deck name (optional)",
    materialPlaceholder: "e.g. TOCFL Intermediate Vocabulary",
    taskType: "Task type",
    vocabularyReview: "Vocabulary memorization / review",
    materialStudy: "Study materials",
    targetAmount: "Target amount",
    unit: "Unit",
    units: ["Words", "Pages", "Minutes", "Chapters", "Sessions"],
    addTask: "Add shared task",
    loginToShare: "Log in to share tasks with Task Management.",
    loginRequired: "Please log in to add a shared task.",
    enterTaskName: "Please enter a task name.",
    invalidTarget: "The target must be a whole number of at least 1.",
    taskCreateError: "Could not create the task.",
    taskLoginRequired: "Please log in to update tasks.",
    taskUpdateError: "Could not update the task status.",
    taskDeleteError: "Could not delete the task.",
    changeTaskStatus: "Change completion status for ",
    target: "Target",
    deadline: "Due date",
    delete: "Delete",
    journal: "Study journal",
    journalDescription: "Record what you accomplished and celebrate small steps forward.",
    wordCount: "Words",
    pageCount: "Pages",
    minutes: "Time (minutes)",
    dailyNote: "Daily notes",
    notePlaceholder: "What did you accomplish, notice, or plan to do next?",
    saveRecord: "Save record",
    savedRecord: "Study record saved for this day",
    invalidStudyAmount: "Study amounts must be whole numbers of 0 or more.",
    milestones: "Exam countdown",
    milestoneDescription: "One step at a time toward your goal.",
    noExams: "Add an exam date",
    noExamsDescription: "Keep your important goals on your calendar.",
    todayExam: "Today!",
    daysAgo: "days ago",
    daysLeft: "{n} days left",
    pastExam: "Past exam",
    examToday: "Exam day",
    keepGoing: "KEEP GOING",
    examName: "Exam name",
    examNamePlaceholder: "e.g. TOCFL CAT",
    examDate: "Exam date",
    addExam: "Add exam date",
    examLimit: "You can register up to 5 exam dates.",
    examCount: "{n}/5 registered",
    enterExam: "Please enter an exam name and date.",
    nextMilestone: "YOUR NEXT MILESTONE",
    preparingFor: "Preparing for",
    daysToGo: "DAYS TO GO",
    loadingError: "Could not load study records. Please check your storage.",
    tasksLoadingError: "Could not load tasks.",
    localSaveError: "Could not save data to this browser.",
    saveError: "Could not save. Please check your login status.",
    saving: "Saving…",
    cloudSaved: "Saved to cloud",
    browserSaved: "Saved in this browser",
    reading: "Loading",
    home: "Home",
    todayPage: "Today's tasks",
    plan: "Study plan",
    decks: "Materials & decks",
    footer: "Make progress, one little step at a time.",
    freezeTicketTitle: "🛡️ Streak Freeze",
    freezeTicketDesc: "Protect your streak on this day even if you take a break.",
    useFreezeBtn: "Use Streak Freeze on this day",
    freezeUsedLabel: "🛡️ Protected",
    freezeCancelBtn: "Cancel",
    freezeCountLabel: "Tickets: {n}",
    dateFormat: (y: number, m: number, d: number) => `${y}/${m}/${d}`,
    monthFormat: (y: number, m: number) => `${m}/${y}`,
    monthNames: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    status: {
      未着手: "Not started",
      進行中: "In progress",
      完了: "Completed",
    },
    unitLabel: {
      単語: "Words",
      ページ: "Pages",
      分: "Minutes",
      章: "Chapters",
      回: "Sessions",
    },
  },

  de: {
    slogan: "Kleine Schritte heute gestalten dein Morgen.",
    today: "Heute",
    closeMessage: "Meldung schließen",
    loading: "Lernfortschritt wird geladen…",
    studyDays: "LERNTAGE",
    studyDaysCaption: "Gelernte Tage in diesem Monat",
    taskCompletion: "AUFGABENFORTSCHRITT",
    tasksCompleted: "Aufgaben erledigt",
    vocabulary: "WORTSCHATZ",
    vocabularyCaption: "Gelernte Wörter in diesem Monat",
    studyTime: "LERNZEIT",
    pagesStudied: "Seiten gelernt",
    schedule: "DEIN LERNPLAN",
    monthlySchedule: "Lernplan und Aufzeichnungen",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    todayLabel: "HEUTE",
    studyRecord: "Lernaufzeichnung",
    task: "Aufgabe",
    examDay: "Prüfung",
    selectedTasks: "Aufgaben für den ausgewählten Tag",
    noTasks: "Für diesen Tag sind keine Aufgaben geplant.",
    tasksHint: "Aufgaben aus der Aufgabenverwaltung werden hier ebenfalls angezeigt.",
    addCommonTask: "Gemeinsame Aufgabe hinzufügen",
    commonTaskDescription: "Hier hinzugefügte Aufgaben erscheinen auch in der Aufgabenverwaltung.",
    taskName: "Aufgabenname",
    taskNamePlaceholder: "z. B. Chinesische Vokabeln wiederholen",
    materialName: "Material / Deck (optional)",
    materialPlaceholder: "z. B. TOCFL-Wortschatz Mittelstufe",
    taskType: "Aufgabentyp",
    vocabularyReview: "Vokabeln lernen / wiederholen",
    materialStudy: "Lernmaterial bearbeiten",
    targetAmount: "Zielmenge",
    unit: "Einheit",
    units: ["Wörter", "Seiten", "Minuten", "Kapitel", "Einheiten"],
    addTask: "Gemeinsame Aufgabe hinzufügen",
    loginToShare: "Melde dich an, um Aufgaben gemeinsam zu nutzen.",
    loginRequired: "Bitte melde dich an, um eine gemeinsame Aufgabe hinzuzufügen.",
    enterTaskName: "Bitte gib einen Aufgabennamen ein.",
    invalidTarget: "Das Ziel muss eine ganze Zahl von mindestens 1 sein.",
    taskCreateError: "Die Aufgabe konnte nicht erstellt werden.",
    taskLoginRequired: "Bitte melde dich an, um Aufgaben zu aktualisieren.",
    taskUpdateError: "Der Aufgabenstatus konnte nicht aktualisiert werden.",
    taskDeleteError: "Die Aufgabe konnte nicht gelöscht werden.",
    changeTaskStatus: "Abschlussstatus ändern: ",
    target: "Ziel",
    deadline: "Frist",
    delete: "Löschen",
    journal: "Lerntagebuch",
    journalDescription: "Halte fest, was du geschafft hast, und sammle kleine Fortschritte.",
    wordCount: "Wörter",
    pageCount: "Seiten",
    minutes: "Zeit (Minuten)",
    dailyNote: "Tagesnotiz",
    notePlaceholder: "Was hast du heute geschafft, entdeckt oder möchtest du als Nächstes tun?",
    saveRecord: "Aufzeichnung speichern",
    savedRecord: "Lernaufzeichnung für diesen Tag gespeichert",
    invalidStudyAmount: "Lernmengen müssen ganze Zahlen ab 0 sein.",
    milestones: "Prüfungs-Countdown",
    milestoneDescription: "Schritt für Schritt deinem Ziel entgegen.",
    noExams: "Füge einen Prüfungstermin hinzu",
    noExamsDescription: "Halte deine wichtigen Ziele im Kalender fest.",
    todayExam: "Heute!",
    daysAgo: "Tage zuvor",
    daysLeft: "Noch {n} Tage",
    pastExam: "Vergangene Prüfung",
    examToday: "Prüfungstag",
    keepGoing: "WEITER SO",
    examName: "Prüfungsname",
    examNamePlaceholder: "z. B. TOCFL CAT",
    examDate: "Prüfungstermin",
    addExam: "Prüfungstermin hinzufügen",
    examLimit: "Du kannst bis zu 5 Prüfungstermine eintragen.",
    examCount: "{n}/5 eingetragen",
    enterExam: "Bitte gib den Prüfungsnamen und das Datum ein.",
    nextMilestone: "DEIN NÄCHSTES ZIEL",
    preparingFor: "Vorbereitung auf",
    daysToGo: "TAGE VERBLEIBEND",
    loadingError: "Lernaufzeichnungen konnten nicht geladen werden. Bitte überprüfe den Speicherort.",
    tasksLoadingError: "Aufgaben konnten nicht geladen werden.",
    localSaveError: "Die Daten konnten nicht im Browser gespeichert werden.",
    saveError: "Speichern fehlgeschlagen. Bitte überprüfe deinen Anmeldestatus.",
    saving: "Wird gespeichert…",
    cloudSaved: "In der Cloud gespeichert",
    browserSaved: "In diesem Browser gespeichert",
    reading: "Wird geladen",
    home: "Startseite",
    todayPage: "Heutige Aufgaben",
    plan: "Lernplan",
    decks: "Materialien & Decks",
    footer: "Make progress, one little step at a time.",
    freezeTicketTitle: "🛡️ Streak-Schutz",
    freezeTicketDesc: "Schütze deine Serie an diesem Tag.",
    useFreezeBtn: "Streak-Schutz aktivieren",
    freezeUsedLabel: "🛡️ Geschützt",
    freezeCancelBtn: "Abbrechen",
    freezeCountLabel: "Tickets: {n}",
    dateFormat: (y: number, m: number, d: number) => `${d}.${m}.${y}`,
    monthFormat: (y: number, m: number) => `${m}/${y}`,
    monthNames: [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember",
    ],
    status: {
      未着手: "Nicht begonnen",
      進行中: "In Bearbeitung",
      完了: "Abgeschlossen",
    },
    unitLabel: {
      単語: "Wörter",
      ページ: "Seiten",
      分: "Minuten",
      章: "Kapitel",
      回: "Einheiten",
    },
  },

  es: {
    slogan: "Los pequeños pasos de hoy construyen tu futuro.",
    today: "Hoy",
    closeMessage: "Cerrar mensaje",
    loading: "Cargando tus datos de estudio…",
    studyDays: "DÍAS DE ESTUDIO",
    studyDaysCaption: "Días estudiados este mes",
    taskCompletion: "TAREAS COMPLETADAS",
    tasksCompleted: "tareas completadas",
    vocabulary: "VOCABULARIO",
    vocabularyCaption: "Palabras estudiadas este mes",
    studyTime: "TIEMPO DE ESTUDIO",
    pagesStudied: "páginas estudiadas",
    schedule: "TU CALENDARIO",
    monthlySchedule: "Plan y registros de estudio",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    todayLabel: "HOY",
    studyRecord: "Registro de estudio",
    task: "Tarea",
    examDay: "Examen",
    selectedTasks: "Tareas del día seleccionado",
    noTasks: "No hay tareas para este día.",
    tasksHint: "Las tareas de la página de gestión también aparecerán aquí.",
    addCommonTask: "Añadir tarea compartida",
    commonTaskDescription: "Las tareas añadidas aquí también aparecerán en la página de gestión.",
    taskName: "Nombre de la tarea",
    taskNamePlaceholder: "Ej.: Repasar vocabulario chino",
    materialName: "Material / nombre del mazo (opcional)",
    materialPlaceholder: "Ej.: Vocabulario TOCFL intermedio",
    taskType: "Tipo de tarea",
    vocabularyReview: "Memorizar / repasar vocabulario",
    materialStudy: "Estudiar material",
    targetAmount: "Cantidad objetivo",
    unit: "Unidad",
    units: ["Palabras", "Páginas", "Minutos", "Capítulos", "Sesiones"],
    addTask: "Añadir tarea compartida",
    loginToShare: "Inicia sesión para compartir tareas con la página de gestión.",
    loginRequired: "Inicia sesión para añadir una tarea compartida.",
    enterTaskName: "Introduce el nombre de la tarea.",
    invalidTarget: "El objetivo debe ser un número entero igual o superior a 1.",
    taskCreateError: "No se pudo crear la tarea.",
    taskLoginRequired: "Inicia sesión para actualizar las tareas.",
    taskUpdateError: "No se pudo actualizar el estado de la tarea.",
    taskDeleteError: "No se pudo eliminar la tarea.",
    changeTaskStatus: "Cambiar el estado de finalización de ",
    target: "Objetivo",
    deadline: "Fecha límite",
    delete: "Eliminar",
    journal: "Diario de estudio",
    journalDescription: "Registra tus logros y conserva cada pequeño avance.",
    wordCount: "Palabras",
    pageCount: "Páginas",
    minutes: "Tiempo (minutos)",
    dailyNote: "Notas del día",
    notePlaceholder: "¿Qué has conseguido hoy, qué has descubierto o qué quieres hacer después?",
    saveRecord: "Guardar registro",
    savedRecord: "Registro de estudio guardado para este día",
    invalidStudyAmount: "Las cantidades deben ser números enteros iguales o superiores a 0.",
    milestones: "Cuenta atrás para el examen",
    milestoneDescription: "Un paso a la vez hacia tu objetivo.",
    noExams: "Añade una fecha de examen",
    noExamsDescription: "Guarda tus objetivos importantes en el calendario.",
    todayExam: "¡Hoy!",
    daysAgo: "días atrás",
    daysLeft: "Quedan {n} días",
    pastExam: "Examen finalizado",
    examToday: "Día del examen",
    keepGoing: "¡SIGUE ASÍ!",
    examName: "Nombre del examen",
    examNamePlaceholder: "Ej.: TOCFL CAT",
    examDate: "Fecha del examen",
    addExam: "Añadir fecha de examen",
    examLimit: "Puedes registrar hasta 5 fechas de examen.",
    examCount: "{n}/5 registrados",
    enterExam: "Introduce el nombre y la fecha del examen.",
    nextMilestone: "TU PRÓXIMO OBJETIVO",
    preparingFor: "Preparándote para",
    daysToGo: "DÍAS RESTANTES",
    loadingError: "No se pudieron cargar los registros. Comprueba dónde se guardan los datos.",
    tasksLoadingError: "No se pudieron cargar las tareas.",
    localSaveError: "No se pudieron guardar los datos en este navegador.",
    saveError: "No se pudo guardar. Comprueba tu sesión.",
    saving: "Guardando…",
    cloudSaved: "Guardado en la nube",
    browserSaved: "Guardado en este navegador",
    reading: "Cargando",
    home: "Inicio",
    todayPage: "Tareas de hoy",
    plan: "Plan de estudio",
    decks: "Materiales y mazos",
    footer: "Make progress, one little step at a time.",
    freezeTicketTitle: "🛡️ Protector de racha",
    freezeTicketDesc: "Protege tu racha en este día.",
    useFreezeBtn: "Usar protector de racha",
    freezeUsedLabel: "🛡️ Protegido",
    freezeCancelBtn: "Cancelar",
    freezeCountLabel: "Tickets: {n}",
    dateFormat: (y: number, m: number, d: number) => `${d}/${m}/${y}`,
    monthFormat: (y: number, m: number) => `${m}/${y}`,
    monthNames: [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ],
    status: {
      未着手: "Sin empezar",
      進行中: "En curso",
      完了: "Completada",
    },
    unitLabel: {
      単語: "Palabras",
      ページ: "Páginas",
      分: "Minutos",
      章: "Capítulos",
      回: "Sesiones",
    },
  },

  "zh-CN": {
    slogan: "今天的点滴积累，成就明天的自己。",
    today: "返回今天",
    closeMessage: "关闭消息",
    loading: "正在加载学习数据…",
    studyDays: "学习天数",
    studyDaysCaption: "本月学习天数",
    taskCompletion: "任务完成率",
    tasksCompleted: "项任务已完成",
    vocabulary: "词汇",
    vocabularyCaption: "本月学习的单词",
    studyTime: "学习时间",
    pagesStudied: "学习页数",
    schedule: "学习日程",
    monthlySchedule: "本月学习计划与记录",
    previousMonth: "上个月",
    nextMonth: "下个月",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    todayLabel: "今天",
    studyRecord: "学习记录",
    task: "任务",
    examDay: "考试日",
    selectedTasks: "所选日期的任务",
    noTasks: "这一天没有安排任务",
    tasksHint: "在任务管理页面添加的计划也会显示在这里。",
    addCommonTask: "添加共享任务",
    commonTaskDescription: "在这里添加的任务也会同步到任务管理页面。",
    taskName: "任务名称",
    taskNamePlaceholder: "例如：复习中文单词",
    materialName: "教材／卡组名称（选填）",
    materialPlaceholder: "例如：TOCFL中级词汇",
    taskType: "任务类型",
    vocabularyReview: "单词记忆／复习",
    materialStudy: "教材学习",
    targetAmount: "目标数量",
    unit: "单位",
    units: ["单词", "页", "分钟", "章", "次"],
    addTask: "添加共享任务",
    loginToShare: "登录后即可与任务管理页面共享任务。",
    loginRequired: "请登录后再添加共享任务。",
    enterTaskName: "请输入任务名称。",
    invalidTarget: "目标数量必须是大于或等于1的整数。",
    taskCreateError: "无法添加任务。",
    taskLoginRequired: "请登录后再更新任务。",
    taskUpdateError: "无法更新任务状态。",
    taskDeleteError: "无法删除任务。",
    changeTaskStatus: "更改完成状态：",
    target: "目标",
    deadline: "截止日期",
    delete: "删除",
    journal: "学习记录",
    journalDescription: "记录完成的事情，留下每一个小小的进步。",
    wordCount: "单词数",
    pageCount: "页数",
    minutes: "时间（分钟）",
    dailyNote: "今日笔记",
    notePlaceholder: "今天完成了什么、有什么发现、接下来想做什么……",
    saveRecord: "保存记录",
    savedRecord: "这一天的学习记录已保存",
    invalidStudyAmount: "学习数量必须是大于或等于0的整数。",
    milestones: "考试倒计时",
    milestoneDescription: "一步一步，走向目标。",
    noExams: "添加考试日期吧",
    noExamsDescription: "把重要的目标留在日历里。",
    todayExam: "今天！",
    daysAgo: "天前",
    daysLeft: "还有 {n} 天",
    pastExam: "已结束的考试",
    examToday: "考试当天",
    keepGoing: "继续加油",
    examName: "考试名称",
    examNamePlaceholder: "例如：TOCFL CAT",
    examDate: "考试日期",
    addExam: "添加考试日期",
    examLimit: "最多可以添加5个考试日期。",
    examCount: "已添加 {n}/5 个",
    enterExam: "请输入考试名称和日期。",
    nextMilestone: "下一个目标",
    preparingFor: "正在为以下考试做准备：",
    daysToGo: "距离考试还有",
    loadingError: "无法加载学习记录，请检查保存位置。",
    tasksLoadingError: "无法加载任务。",
    localSaveError: "无法保存到浏览器。",
    saveError: "保存失败，请检查登录状态。",
    saving: "正在保存…",
    cloudSaved: "已保存到云端",
    browserSaved: "已保存到此浏览器",
    reading: "正在加载",
    home: "首页",
    todayPage: "今日任务",
    plan: "学习计划",
    decks: "教材与卡组",
    footer: "Make progress, one little step at a time.",
    freezeTicketTitle: "🛡️ 请假卡 (Streak Freeze)",
    freezeTicketDesc: "使用请假卡保护这一天的打卡连击。",
    useFreezeBtn: "在此日期使用请假卡",
    freezeUsedLabel: "🛡️ 已受保护",
    freezeCancelBtn: "取消",
    freezeCountLabel: "请假卡: {n}张",
    dateFormat: (y: number, m: number, d: number) => `${y}年${m}月${d}日`,
    monthFormat: (y: number, m: number) => `${y}年${m}月`,
    monthNames: [
      "一月", "二月", "三月", "四月", "五月", "六月",
      "七月", "八月", "九月", "十月", "十一月", "十二月",
    ],
    status: {
      未着手: "未开始",
      進行中: "进行中",
      完了: "已完成",
    },
    unitLabel: {
      単語: "单词",
      ページ: "页",
      分: "分钟",
      章: "章",
      回: "次",
    },
  },

  "zh-TW": {
    slogan: "今天的點滴累積，成就明天的自己。",
    today: "回到今天",
    closeMessage: "關閉訊息",
    loading: "正在載入學習資料…",
    studyDays: "學習天數",
    studyDaysCaption: "本月學習天數",
    taskCompletion: "任務完成率",
    tasksCompleted: "項任務已完成",
    vocabulary: "詞彙",
    vocabularyCaption: "本月學習的單字",
    studyTime: "學習時間",
    pagesStudied: "學習頁數",
    schedule: "學習行程",
    monthlySchedule: "本月學習計畫與紀錄",
    previousMonth: "上個月",
    nextMonth: "下個月",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    todayLabel: "今天",
    studyRecord: "學習紀錄",
    task: "任務",
    examDay: "考試日",
    selectedTasks: "所選日期的任務",
    noTasks: "這一天沒有安排任務",
    tasksHint: "在任務管理頁面新增的計畫也會顯示在這裡。",
    addCommonTask: "新增共用任務",
    commonTaskDescription: "在這裡新增的任務也會同步到任務管理頁面。",
    taskName: "任務名稱",
    taskNamePlaceholder: "例如：複習中文單字",
    materialName: "教材／牌組名稱（選填）",
    materialPlaceholder: "例如：TOCFL中級詞彙",
    taskType: "任務類型",
    vocabularyReview: "單字記憶／複習",
    materialStudy: "教材學習",
    targetAmount: "目標數量",
    unit: "單位",
    units: ["單字", "頁", "分鐘", "章", "次"],
    addTask: "新增共用任務",
    loginToShare: "登入後即可與任務管理頁面共用任務。",
    loginRequired: "請先登入，再新增共用任務。",
    enterTaskName: "請輸入任務名稱。",
    invalidTarget: "目標數量必須是大於或等於1的整數。",
    taskCreateError: "無法新增任務。",
    taskLoginRequired: "請登入後再更新任務。",
    taskUpdateError: "無法更新任務狀態。",
    taskDeleteError: "無法刪除任務。",
    changeTaskStatus: "變更完成狀態：",
    target: "目標",
    deadline: "截止日期",
    delete: "刪除",
    journal: "學習紀錄",
    journalDescription: "記錄完成的事情，留下每一個小小的進步。",
    wordCount: "單字數",
    pageCount: "頁數",
    minutes: "時間（分鐘）",
    dailyNote: "今日筆記",
    notePlaceholder: "今天完成了什麼、有哪些發現、接下來想做什麼……",
    saveRecord: "儲存紀錄",
    savedRecord: "這一天的學習紀錄已儲存",
    invalidStudyAmount: "學習數量必須是大於或等於0的整數。",
    milestones: "考試倒數",
    milestoneDescription: "一步一步，朝目標前進。",
    noExams: "新增考試日期吧",
    noExamsDescription: "把重要的目標留在行事曆裡。",
    todayExam: "今天！",
    daysAgo: "天前",
    daysLeft: "還有 {n} 天",
    pastExam: "已結束的考試",
    examToday: "考試當天",
    keepGoing: "繼續加油",
    examName: "考試名稱",
    examNamePlaceholder: "例如：TOCFL CAT",
    examDate: "考試日期",
    addExam: "新增考試日期",
    examLimit: "最多可以新增5個考試日期。",
    examCount: "已新增 {n}/5 個",
    enterExam: "請輸入考試名稱和日期。",
    nextMilestone: "下一個目標",
    preparingFor: "正在為以下考試做準備：",
    daysToGo: "距離考試還有",
    loadingError: "無法載入學習紀錄，請檢查儲存位置。",
    tasksLoadingError: "無法載入任務。",
    localSaveError: "無法儲存到瀏覽器。",
    saveError: "儲存失敗，請檢查登入狀態。",
    saving: "正在儲存…",
    cloudSaved: "已儲存至雲端",
    browserSaved: "已儲存至此瀏覽器",
    reading: "正在載入",
    home: "首頁",
    todayPage: "今日任務",
    plan: "學習計畫",
    decks: "教材與牌組",
    footer: "Make progress, one little step at a time.",
    freezeTicketTitle: "🛡️ 請假卡 (Streak Freeze)",
    freezeTicketDesc: "使用請假卡保護這一天的打卡連擊不中斷。",
    useFreezeBtn: "在此日期使用請假卡",
    freezeUsedLabel: "🛡️ 已受保護",
    freezeCancelBtn: "取消",
    freezeCountLabel: "請假卡: {n}張",
    dateFormat: (y: number, m: number, d: number) => `${y}年${m}月${d}日`,
    monthFormat: (y: number, m: number) => `${y}年${m}月`,
    monthNames: [
      "一月", "二月", "三月", "四月", "五月", "六月",
      "七月", "八月", "九月", "十月", "十一月", "十二月",
    ],
    status: {
      未着手: "未開始",
      進行中: "進行中",
      完了: "已完成",
    },
    unitLabel: {
      単語: "單字",
      ページ: "頁",
      分: "分鐘",
      章: "章",
      回: "次",
    },
  },
};

function dateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function readLocalData(): CalendarData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;

    const parsed = JSON.parse(raw);

    return {
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
      freezeCount: typeof parsed.freezeCount === "number" ? parsed.freezeCount : 1,
      usedFreezeDates: Array.isArray(parsed.usedFreezeDates) ? parsed.usedFreezeDates : [],
    };
  } catch {
    return EMPTY_DATA;
  }
}

function normalizeTask(id: string, data: Record<string, unknown>): StudyTask {
  return {
    id,
    title: String(data.title ?? ""),
    type:
      data.type === "单語の暗記・復習" ||
      data.type === "単語の暗記・復習"
        ? "単語の暗記・復習"
        : "教材の学習",
    material: String(data.material ?? ""),
    target: Number(data.target ?? 0),
    unit: (
      ["単語", "ページ", "分", "章", "回"].includes(String(data.unit))
        ? data.unit
        : "ページ"
    ) as TaskUnit,
    startDate: String(data.startDate ?? ""),
    scheduledDate: String(data.scheduledDate ?? ""),
    dueDate: String(data.dueDate ?? ""),
    status: (
      ["未着手", "進行中", "完了"].includes(String(data.status))
        ? data.status
        : "未着手"
    ) as TaskStatus,
    repeat: (
      ["なし", "毎日", "毎週"].includes(String(data.repeat))
        ? data.repeat
        : "なし"
    ) as StudyTask["repeat"],
    repeatDays: Array.isArray(data.repeatDays)
      ? data.repeatDays.map(Number).filter(Number.isInteger)
      : [],
  };
}

export default function CalendarPage() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode =
    language in translations ? (language as LanguageCode) : "ja";

  const t = translations[currentLanguage];

  const today = dateString(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [freezeCount, setFreezeCount] = useState<number>(1);
  const [usedFreezeDates, setUsedFreezeDates] = useState<string[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskTarget, setTaskTarget] = useState("20");
  const [taskUnit, setTaskUnit] = useState<TaskUnit>("単語");
  const [taskType, setTaskType] =
    useState<StudyTask["type"]>("単語の暗記・復習");
  const [taskMaterial, setTaskMaterial] = useState("");

  const [words, setWords] = useState("0");
  const [pages, setPages] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [note, setNote] = useState("");

  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  function formatDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    return t.dateFormat(year, month, day);
  }

  function formatDaysLeft(n: number) {
    return t.daysLeft.replace("{n}", String(n));
  }

  // 認証状態と学習記録・試験日・お休みチケットの読み込み
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      setLoaded(false);
      setTasksLoaded(false);
      setUser(currentUser);
      setMessage("");

      try {
        let data = EMPTY_DATA;

        if (currentUser) {
          const snapshot = await getDoc(
            doc(db, "calendarData", currentUser.uid)
          );

          if (!active) return;

          if (snapshot.exists()) {
            const saved = snapshot.data();

            data = {
              logs: Array.isArray(saved.logs) ? saved.logs : [],
              exams: Array.isArray(saved.exams) ? saved.exams : [],
              freezeCount: typeof saved.freezeCount === "number" ? saved.freezeCount : 1,
              usedFreezeDates: Array.isArray(saved.usedFreezeDates) ? saved.usedFreezeDates : [],
            };
          }
        } else {
          data = readLocalData();
        }

        if (!active) return;

        setLogs(data.logs);
        setExams(data.exams);
        setFreezeCount(data.freezeCount ?? 1);
        setUsedFreezeDates(data.usedFreezeDates ?? []);
        setLoaded(true);
      } catch (error) {
        console.error("Calendar loading error:", error);

        if (!active) return;

        const fallback = readLocalData();
        setLogs(fallback.logs);
        setExams(fallback.exams);
        setFreezeCount(fallback.freezeCount ?? 1);
        setUsedFreezeDates(fallback.usedFreezeDates ?? []);
        setMessage(t.loadingError);
        setLoaded(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // タスク管理と共通の users/{uid}/tasks をリアルタイム購読
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setTasksLoaded(true);
      return;
    }

    setTasksLoaded(false);

    const tasksRef = collection(db, "users", user.uid, "tasks");

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const nextTasks = snapshot.docs.map((item) =>
          normalizeTask(item.id, item.data())
        );

        setTasks(nextTasks);
        setTasksLoaded(true);
      },
      (error) => {
        console.error("Tasks loading error:", error);
        setMessage(t.tasksLoadingError);
        setTasksLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 学習記録・試験日・お休みチケット情報の保存
  useEffect(() => {
    if (!loaded) return;

    let active = true;

    async function saveData() {
      const data: CalendarData = { logs, exams, freezeCount, usedFreezeDates };

      if (!user) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              ...data,
              tasks: readLegacyTasks(),
            })
          );

          if (active) setMessage("");
        } catch (error) {
          console.error("Local save error:", error);
          if (active) setMessage(t.localSaveError);
        }
        return;
      }

      setSaving(true);

      try {
        await setDoc(
          doc(db, "calendarData", user.uid),
          {
            ...data,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        if (active) setMessage("");
      } catch (error) {
        console.error("Firestore save error:", error);

        if (active) setMessage(t.saveError);
      } finally {
        if (active) setSaving(false);
      }
    }

    void saveData();

    return () => {
      active = false;
    };
  }, [logs, exams, freezeCount, usedFreezeDates, loaded, user]);

  const selectedLog = logs.find((log) => log.date === selectedDate);

  useEffect(() => {
    setWords(String(selectedLog?.words ?? 0));
    setPages(String(selectedLog?.pages ?? 0));
    setMinutes(String(selectedLog?.minutes ?? 0));
    setNote(selectedLog?.note ?? "");
  }, [
    selectedDate,
    selectedLog?.words,
    selectedLog?.pages,
    selectedLog?.minutes,
    selectedLog?.note,
  ]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const calendarCells = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (string | null)[] = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) =>
        dateString(new Date(year, month, index + 1))
      ),
    ];

    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [year, month]);

  function tasksOnDate(date: string) {
    return tasks.filter(
      (task) => task.scheduledDate === date || task.dueDate === date
    );
  }

  const monthTasks = tasks.filter(
    (task) =>
      task.scheduledDate.startsWith(monthPrefix) ||
      task.dueDate.startsWith(monthPrefix)
  );

  const uniqueMonthTasks = Array.from(
    new Map(monthTasks.map((task) => [task.id, task])).values()
  );

  const completedTasks = uniqueMonthTasks.filter(
    (task) => task.status === "完了"
  ).length;

  const completionRate = uniqueMonthTasks.length
    ? Math.round((completedTasks / uniqueMonthTasks.length) * 100)
    : 0;

  const monthLogs = logs.filter((log) => log.date.startsWith(monthPrefix));

  const studyDays = new Set([
    ...monthLogs
      .filter((log) => log.words > 0 || log.pages > 0 || log.minutes > 0)
      .map((log) => log.date),
    ...usedFreezeDates.filter((d) => d.startsWith(monthPrefix)),
  ]).size;

  const totalWords = monthLogs.reduce((sum, log) => sum + log.words, 0);
  const totalPages = monthLogs.reduce((sum, log) => sum + log.pages, 0);
  const totalMinutes = monthLogs.reduce((sum, log) => sum + log.minutes, 0);

  const selectedTasks = tasksOnDate(selectedDate);
  const selectedDone = selectedTasks.filter(
    (task) => task.status === "完了"
  ).length;

  const selectedHasStudy = Boolean(
    selectedLog &&
      (selectedLog.words > 0 ||
        selectedLog.pages > 0 ||
        selectedLog.minutes > 0)
  );

  const sortedExams = [...exams].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const upcomingExams = sortedExams.filter((exam) => exam.date >= today);

  function goToToday() {
    setCurrentMonth(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    setSelectedDate(today);
  }

  function selectDay(date: string) {
    setSelectedDate(date);
    setMessage("");
  }

  async function addTask() {
    if (!user) {
      setMessage(t.loginRequired);
      return;
    }

    if (!taskTitle.trim()) {
      setMessage(t.enterTaskName);
      return;
    }

    const target = Number(taskTarget);

    if (!Number.isInteger(target) || target < 1) {
      setMessage(t.invalidTarget);
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "tasks"), {
        title: taskTitle.trim(),
        type: taskType,
        material: taskMaterial.trim(),
        target,
        unit: taskUnit,
        startDate: selectedDate,
        scheduledDate: selectedDate,
        dueDate: selectedDate,
        status: "未着手",
        repeat: "なし",
        repeatDays: [],
        createdAt: new Date().toISOString(),
      });

      setTaskTitle("");
      setTaskTarget("20");
      setTaskMaterial("");
      setMessage("");
    } catch (error) {
      console.error("Task creation error:", error);
      setMessage(t.taskCreateError);
    }
  }

  async function toggleTask(task: StudyTask) {
    if (!user) {
      setMessage(t.taskLoginRequired);
      return;
    }

    const nextStatus: TaskStatus =
      task.status === "完了" ? "進行中" : "完了";

    try {
      await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
        status: nextStatus,
      });
      setMessage("");
    } catch (error) {
      console.error("Task update error:", error);
      setMessage(t.taskUpdateError);
    }
  }

  async function removeTask(task: StudyTask) {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "tasks", task.id));
      setMessage("");
    } catch (error) {
      console.error("Task deletion error:", error);
      setMessage(t.taskDeleteError);
    }
  }

  function saveLog() {
    const wordCount = Number(words);
    const pageCount = Number(pages);
    const minuteCount = Number(minutes);

    if (
      ![wordCount, pageCount, minuteCount].every(
        (value) => Number.isInteger(value) && value >= 0
      )
    ) {
      setMessage(t.invalidStudyAmount);
      return;
    }

    const newLog: StudyLog = {
      date: selectedDate,
      words: wordCount,
      pages: pageCount,
      minutes: minuteCount,
      note: note.trim(),
    };

    setLogs((current) =>
      [
        ...current.filter((log) => log.date !== selectedDate),
        newLog,
      ].sort((a, b) => a.date.localeCompare(b.date))
    );

    setMessage("");
  }

  function addExam() {
    if (!examName.trim() || !examDate) {
      setMessage(t.enterExam);
      return;
    }

    if (exams.length >= 5) {
      setMessage(t.examLimit);
      return;
    }

    setExams((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: examName.trim(),
        date: examDate,
      },
    ]);

    setExamName("");
    setExamDate("");
    setMessage("");
  }

  function deleteExam(id: string) {
    setExams((current) => current.filter((exam) => exam.id !== id));
  }

  // お休みチケット（Streak Freeze）の切り替え処理
  function toggleFreezeDate(date: string) {
    if (usedFreezeDates.includes(date)) {
      setUsedFreezeDates((current) => current.filter((d) => d !== date));
      setFreezeCount((current) => current + 1);
    } else {
      if (freezeCount <= 0) return;
      setUsedFreezeDates((current) => [...current, date]);
      setFreezeCount((current) => current - 1);
    }
  }

  const inputClass = "field";
  const selectedDateLabel = formatDate(selectedDate);
  const isSelectedProtected = usedFreezeDates.includes(selectedDate);

  return (
    <main className="calendar-page">
      <div className="shell">
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">a.</span>
            <span>
              ANKI <span className="brand-muted">/ YOUR LEARNING</span>
            </span>
          </Link>
          <div className="topbar-right" style={{ marginLeft: "auto" }}>
            <div className="freeze-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "var(--accent-soft)", borderRadius: "10px", fontSize: "11px", fontWeight: "700", color: "var(--accent-dark)" }}>
              <span>🛡️ {t.freezeCountLabel.replace("{n}", String(freezeCount))}</span>
            </div>
          </div>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">YOUR PERSONAL LEARNING SPACE</p>
            <h1>
              Calendar<span className="title-period">.</span>
            </h1>
            <p className="hero-description">{t.slogan}</p>
          </div>

          <button
            className="button button-primary hero-today"
            onClick={goToToday}
          >
            <span aria-hidden="true">↗</span> {t.today}
          </button>
        </section>

        {message && (
          <div className="notice" role="alert">
            <span>!</span>
            {message}
            <button
              onClick={() => setMessage("")}
              aria-label={t.closeMessage}
            >
              ×
            </button>
          </div>
        )}

        {!loaded || !tasksLoaded ? (
          <div className="loading">
            <span className="loading-dot" />
            {t.loading}
          </div>
        ) : (
          <>
            <section className="stats-grid" aria-label={t.studyDaysCaption}>
              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">{t.studyDays}</span>
                  <span className="stat-icon">◷</span>
                </div>
                <div className="stat-value">
                  {studyDays}<span> {currentLanguage === "ja" ? "日" : currentLanguage.startsWith("zh") ? "天" : ""}</span>
                </div>
                <div className="stat-caption">{t.studyDaysCaption}</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">{t.taskCompletion}</span>
                  <span className="stat-icon">✓</span>
                </div>
                <div className="stat-value">
                  {completionRate}<span>%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="stat-caption">
                  {completedTasks} / {uniqueMonthTasks.length} {t.tasksCompleted}
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">{t.vocabulary}</span>
                  <span className="stat-icon">文</span>
                </div>
                <div className="stat-value">
                  {totalWords.toLocaleString()}
                </div>
                <div className="stat-caption">{t.vocabularyCaption}</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">{t.studyTime}</span>
                  <span className="stat-icon">◷</span>
                </div>
                <div className="stat-value">
                  {Math.floor(totalMinutes / 60)}
                  <span> h </span>
                  {totalMinutes % 60}
                  <span> m</span>
                </div>
                <div className="stat-caption">
                  {totalPages.toLocaleString()} {t.pagesStudied}
                </div>
              </article>
            </section>

            <section className="calendar-card">
              <div className="calendar-heading">
                <div>
                  <p className="eyebrow">{t.schedule}</p>
                  <h2>
                    {t.monthNames[month]} <span>{year}</span>
                  </h2>
                  <p className="muted">
                    {t.monthFormat(year, month + 1)} · {t.monthlySchedule}
                  </p>
                </div>

                <div className="month-controls">
                  <button
                    className="icon-button"
                    onClick={() =>
                      setCurrentMonth(shiftMonth(currentMonth, -1))
                    }
                    aria-label={t.previousMonth}
                  >
                    ‹
                  </button>
                  <button
                    className="button button-subtle"
                    onClick={goToToday}
                  >
                    {t.today}
                  </button>
                  <button
                    className="icon-button"
                    onClick={() =>
                      setCurrentMonth(shiftMonth(currentMonth, 1))
                    }
                    aria-label={t.nextMonth}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="calendar-grid">
                {t.weekdays.map((day: string, index: number) => (
                  <div
                    key={day}
                    className={`weekday ${
                      index === 5 ? "saturday" : ""
                    } ${index === 6 ? "sunday" : ""}`}
                  >
                    {day}
                  </div>
                ))}

                {calendarCells.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        className="day-cell day-empty"
                        key={`empty-${index}`}
                      />
                    );
                  }

                  const dayTasks = tasksOnDate(date);
                  const done = dayTasks.filter(
                    (task) => task.status === "完了"
                  ).length;

                  const dayLog = logs.find((log) => log.date === date);
                  const dayExams = exams.filter(
                    (exam) => exam.date === date
                  );

                  const hasStudy = Boolean(
                    dayLog &&
                      (dayLog.words > 0 ||
                        dayLog.pages > 0 ||
                        dayLog.minutes > 0)
                  );
                  const isProtected = usedFreezeDates.includes(date);

                  const isSelected = date === selectedDate;
                  const isToday = date === today;
                  const dayNumber = Number(date.slice(-2));
                  const weekday =
                    (new Date(`${date}T12:00:00`).getDay() + 6) % 7;

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => selectDay(date)}
                      aria-pressed={isSelected}
                      aria-label={`${formatDate(date)}${
                        isToday ? `, ${t.todayLabel}` : ""
                      }`}
                      className={[
                        "day-cell",
                        isSelected ? "day-selected" : "",
                        isToday ? "day-today" : "",
                        weekday === 5 ? "day-saturday" : "",
                        weekday === 6 ? "day-sunday" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="day-number">{dayNumber}</span>

                      {isToday && (
                        <span className="today-label">{t.todayLabel}</span>
                      )}

                      <div className="day-markers">
                        {isProtected && (
                          <span
                            className="marker marker-freeze"
                            title={t.freezeTicketTitle}
                            style={{ background: "#e5a942" }}
                          />
                        )}
                        {hasStudy && (
                          <span
                            className="marker marker-study"
                            title={t.studyRecord}
                          />
                        )}
                        {dayTasks.length > 0 && (
                          <span
                            className={`marker marker-task ${
                              done === dayTasks.length ? "marker-done" : ""
                            }`}
                            title={t.task}
                          />
                        )}
                        {dayExams.length > 0 && (
                          <span
                            className="marker marker-exam"
                            title={t.examDay}
                          />
                        )}
                      </div>

                      {dayTasks.length > 0 && (
                        <span className="day-task-count">
                          {done}/{dayTasks.length}
                        </span>
                      )}

                      {dayExams.length > 0 && (
                        <span className="day-exam-label">{t.examDay}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="calendar-legend">
                <span>
                  <i className="legend-dot legend-study" /> {t.studyRecord}
                </span>
                <span>
                  <i className="legend-dot" style={{ background: "#e5a942", display: "inline-block", width: "5px", height: "5px", borderRadius: "50%" }} /> {t.freezeTicketTitle}
                </span>
                <span>
                  <i className="legend-dot legend-task" /> {t.task}
                </span>
                <span>
                  <i className="legend-dot legend-exam" /> {t.examDay}
                </span>
              </div>
            </section>

            <div className="content-grid">
              <section className="panel tasks-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">DAILY FOCUS</p>
                    <h2>{t.selectedTasks}</h2>
                    <p className="muted">{selectedDateLabel}</p>
                  </div>
                  <span className="count-pill">
                    {selectedDone}/{selectedTasks.length}
                  </span>
                </div>

                {selectedTasks.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">＋</span>
                    <p>{t.noTasks}</p>
                    <span>{t.tasksHint}</span>
                  </div>
                ) : (
                  <div className="task-list">
                    {selectedTasks.map((task) => (
                      <div className="task-row" key={task.id}>
                        <input
                          className="task-checkbox"
                          type="checkbox"
                          checked={task.status === "完了"}
                          onChange={() => void toggleTask(task)}
                          aria-label={`${task.title}${t.changeTaskStatus}`}
                        />
                        <div className="task-content">
                          <span
                            className={`task-title ${
                              task.status === "完了"
                                ? "task-completed"
                                : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="task-meta">
                            {task.material ? `${task.material} · ` : ""}
                            {t.target} {task.target.toLocaleString()}{" "}
                            {t.unitLabel[task.unit]}
                            {task.dueDate &&
                              task.dueDate !== task.scheduledDate &&
                              task.dueDate === selectedDate &&
                              ` · ${t.deadline}`}
                          </span>
                          <span className="task-status">
                            {t.status[task.status]}
                          </span>
                        </div>
                        <button
                          className="text-button danger"
                          onClick={() => void removeTask(task)}
                        >
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-divider" />
                <h3 className="form-title">{t.addCommonTask}</h3>
                <p className="section-description">
                  {t.commonTaskDescription}
                </p>

                <form
                  className="stack-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void addTask();
                  }}
                >
                  <label className="form-field">
                    <span>{t.taskName}</span>
                    <input
                      className={inputClass}
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder={t.taskNamePlaceholder}
                      maxLength={120}
                    />
                  </label>

                  <label className="form-field">
                    <span>{t.materialName}</span>
                    <input
                      className={inputClass}
                      value={taskMaterial}
                      onChange={(event) =>
                        setTaskMaterial(event.target.value)
                      }
                      placeholder={t.materialPlaceholder}
                      maxLength={120}
                    />
                  </label>

                  <label className="form-field">
                    <span>{t.taskType}</span>
                    <select
                      className={inputClass}
                      value={taskType}
                      onChange={(event) =>
                        setTaskType(event.target.value as StudyTask["type"])
                      }
                    >
                      <option value="単語の暗記・復習">
                        {t.vocabularyReview}
                      </option>
                      <option value="教材の学習">{t.materialStudy}</option>
                    </select>
                  </label>

                  <div className="form-row">
                    <label className="form-field">
                      <span>{t.targetAmount}</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        step="1"
                        value={taskTarget}
                        onChange={(event) =>
                          setTaskTarget(event.target.value)
                        }
                      />
                    </label>

                    <label className="form-field">
                      <span>{t.unit}</span>
                      <select
                        className={inputClass}
                        value={taskUnit}
                        onChange={(event) =>
                          setTaskUnit(event.target.value as TaskUnit)
                        }
                      >
                        {(["単語", "ページ", "分", "章", "回"] as TaskUnit[]).map(
                          (unit, index) => (
                            <option key={unit} value={unit}>
                              {t.units[index]}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  <button
                    className="button button-primary button-full"
                    type="submit"
                    disabled={!user}
                  >
                    ＋ {t.addTask}
                  </button>

                  {!user && <p className="form-hint">{t.loginToShare}</p>}
                </form>
              </section>

              <div className="right-stack" style={{ display: "grid", gap: "20px" }}>
                <section className="panel log-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">DAILY JOURNAL</p>
                      <h2>{t.journal}</h2>
                      <p className="muted">{selectedDateLabel}</p>
                    </div>
                    <span className="journal-icon">✎</span>
                  </div>

                  <p className="section-description">
                    {t.journalDescription}
                  </p>

                  <form
                    className="stack-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveLog();
                    }}
                  >
                    <div className="form-row three-columns">
                      <label className="form-field">
                        <span>{t.wordCount}</span>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step="1"
                          value={words}
                          onChange={(event) => setWords(event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>{t.pageCount}</span>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step="1"
                          value={pages}
                          onChange={(event) => setPages(event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>{t.minutes}</span>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step="1"
                          value={minutes}
                          onChange={(event) => setMinutes(event.target.value)}
                        />
                      </label>
                    </div>

                    <label className="form-field">
                      <span>{t.dailyNote}</span>
                      <textarea
                        className={`${inputClass} note-field`}
                        rows={4}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={t.notePlaceholder}
                        maxLength={2000}
                      />
                    </label>

                    <button
                      className="button button-primary button-full"
                      type="submit"
                    >
                      {t.saveRecord}
                    </button>
                  </form>

                  {selectedHasStudy && (
                    <div className="saved-indicator">
                      <span className="saved-dot" />
                      {t.savedRecord}
                    </div>
                  )}
                </section>

                {/* お休みチケット（Streak Freeze）ウィジェット */}
                <section className="panel freeze-panel" style={{ padding: "20px 25px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <p className="eyebrow" style={{ margin: "0 0 4px" }}>STREAK PROTECTION</p>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 650 }}>{t.freezeTicketTitle}</h3>
                    </div>
                    <span style={{ fontSize: "20px" }}>🛡️</span>
                  </div>
                  <p className="section-description" style={{ margin: "0 0 14px" }}>
                    {t.freezeTicketDesc}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#686b62", fontWeight: 600 }}>
                      {selectedDate}
                    </span>
                    {isSelectedProtected ? (
                      <button
                        type="button"
                        className="button button-subtle"
                        onClick={() => toggleFreezeDate(selectedDate)}
                        style={{ fontSize: "11px", minHeight: "34px", borderColor: "#e5a942", color: "#b37b12" }}
                      >
                        {t.freezeUsedLabel} ({t.freezeCancelBtn})
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={freezeCount <= 0}
                        onClick={() => toggleFreezeDate(selectedDate)}
                        style={{ fontSize: "11px", minHeight: "34px" }}
                      >
                        {t.useFreezeBtn}
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </div>

            <section className="panel exams-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">UPCOMING MILESTONES</p>
                  <h2>{t.milestones}</h2>
                  <p className="muted">{t.milestoneDescription}</p>
                </div>
                <span className="milestone-icon">◎</span>
              </div>

              {sortedExams.length === 0 ? (
                <div className="empty-state exam-empty">
                  <span className="empty-icon">◎</span>
                  <p>{t.noExams}</p>
                  <span>{t.noExamsDescription}</span>
                </div>
              ) : (
                <div className="exam-list">
                  {sortedExams.map((exam) => {
                    const remaining = daysBetween(today, exam.date);
                    const past = remaining < 0;

                    return (
                      <article className="exam-row" key={exam.id}>
                        <div className="exam-date-block">
                          <span>{Number(exam.date.slice(5, 7))}</span>
                          <strong>{Number(exam.date.slice(8, 10))}</strong>
                        </div>
                        <div className="exam-info">
                          <strong>{exam.name}</strong>
                          <span>{exam.date.replaceAll("-", " / ")}</span>
                        </div>
                        <div className="exam-countdown">
                          <strong>
                            {remaining === 0
                              ? t.todayExam
                              : past
                                ? `${Math.abs(remaining)} ${t.daysAgo}`
                                : formatDaysLeft(remaining)}
                          </strong>
                          <span>
                            {past
                              ? t.pastExam
                              : remaining === 0
                                ? t.examToday
                                : t.keepGoing}
                          </span>
                        </div>
                        <button
                          className="text-button danger"
                          onClick={() => deleteExam(exam.id)}
                        >
                          {t.delete}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}

              {exams.length < 5 && (
                <>
                  <div className="form-divider" />
                  <form
                    className="exam-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addExam();
                    }}
                  >
                    <label className="form-field">
                      <span>{t.examName}</span>
                      <input
                        className={inputClass}
                        value={examName}
                        onChange={(event) => setExamName(event.target.value)}
                        placeholder={t.examNamePlaceholder}
                        maxLength={100}
                      />
                    </label>
                    <label className="form-field">
                      <span>{t.examDate}</span>
                      <input
                        className={inputClass}
                        type="date"
                        min={today}
                        value={examDate}
                        onChange={(event) => setExamDate(event.target.value)}
                      />
                    </label>
                    <button
                      className="button button-primary exam-add-button"
                      type="submit"
                    >
                      ＋ {t.addExam}
                    </button>
                  </form>
                  <p className="form-hint">
                    {t.examCount.replace("{n}", String(exams.length))}
                  </p>
                </>
              )}
            </section>

            {upcomingExams.length > 0 && (
              <section className="next-exam">
                <div className="next-exam-symbol">✦</div>
                <div className="next-exam-copy">
                  <span className="eyebrow">{t.nextMilestone}</span>
                  <h2>{upcomingExams[0].name}</h2>
                  <p>
                    {formatDate(upcomingExams[0].date)} · {t.preparingFor}
                  </p>
                </div>
                <div className="next-exam-days">
                  <strong>
                    {daysBetween(today, upcomingExams[0].date)}
                  </strong>
                  <span>{t.daysToGo}</span>
                </div>
              </section>
            )}
          </>
        )}

        <footer className="footer">
          <div className="footer-brand">a.</div>
          <p>{t.footer}</p>
          <div className="save-status">
            <span className={`status-dot ${saving ? "status-saving" : ""}`} />
            {!loaded
              ? t.reading
              : saving
                ? t.saving
                : user
                  ? t.cloudSaved
                  : t.browserSaved}
          </div>
          <nav className="footer-links">
            <Link href="/">{t.home}</Link>
            <Link href="/today">{t.todayPage}</Link>
            <Link href="/plan">{t.plan}</Link>
            <Link href="/decks">{t.decks}</Link>
          </nav>
        </footer>
      </div>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        .calendar-page {
          --bg: var(--background, #f6f6f3);
          --calendar-surface: var(--surface, #fff);
          --text: var(--foreground, #242522);
          --muted: #8a8c85;
          --line: var(--border, #e9e9e4);
          --accent: var(--anki-theme-color, #718675);
          --accent-soft: var(--anki-theme-light, #edf1e9);
          --accent-soft-strong: var(--anki-theme-soft, #dce6dd);
          --accent-dark: var(--anki-theme-dark, #526555);
          min-height: 100vh;
          padding: 0 24px 60px;
          background: var(--bg);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .shell {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .topbar {
          min-height: 72px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--line);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          color: var(--text);
          font-size: 12px;
          font-weight: 750;
          letter-spacing: .13em;
          text-decoration: none;
        }

        .brand-mark,
        .footer-brand {
          display: inline-grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: var(--accent);
          color: white;
          font-size: 19px;
          letter-spacing: -2px;
          font-weight: 750;
        }

        .brand-muted {
          color: var(--muted);
          font-weight: 500;
          letter-spacing: .07em;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-links a {
          color: #777970;
          font-size: 12px;
          text-decoration: none;
        }

        .footer-links a:hover {
          color: var(--text);
        }

        .hero {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          padding: 44px 0 30px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #85877e;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .16em;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(35px, 5vw, 49px);
          line-height: 1.08;
          font-weight: 650;
          letter-spacing: -.055em;
        }

        .title-period {
          color: var(--accent);
        }

        .hero-description {
          margin: 13px 0 0;
          color: #85877e;
          font-size: 13px;
          line-height: 1.8;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid transparent;
          border-radius: 11px;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: background .15s, transform .15s;
        }

        .button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .button:active,
        .icon-button:active {
          transform: scale(.98);
        }

        .button-primary {
          background: var(--accent);
          color: white;
        }

        .button-primary:hover:not(:disabled) {
          background: var(--accent-dark);
        }

        .button-subtle {
          border-color: var(--line);
          background: white;
          color: #50534b;
        }

        .button-subtle:hover,
        .icon-button:hover {
          background: var(--accent-soft);
        }

        .hero-today {
          flex-shrink: 0;
          margin-bottom: 3px;
        }

        .notice {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 12px 14px;
          border: 1px solid #ead6cb;
          border-radius: 12px;
          background: #fff8f3;
          color: #915741;
          font-size: 12px;
          line-height: 1.7;
        }

        .notice > span {
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f5e5da;
          font-weight: 750;
        }

        .notice button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 19px;
          cursor: pointer;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 220px;
          color: var(--muted);
          font-size: 13px;
        }

        .loading-dot,
        .status-dot,
        .saved-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat-card,
        .calendar-card,
        .panel {
          min-width: 0;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: var(--calendar-surface);
          box-shadow: 0 2px 8px rgba(33, 37, 30, .018);
        }

        .stat-card {
          padding: 20px;
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .stat-label {
          color: #8b8d85;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: .11em;
        }

        .stat-icon {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 9px;
          background: var(--accent-soft);
          color: var(--accent-dark);
          font-size: 14px;
        }

        .stat-value {
          margin-top: 18px;
          font-size: clamp(24px, 3vw, 31px);
          line-height: 1.1;
          font-weight: 650;
          letter-spacing: -.045em;
          overflow-wrap: anywhere;
        }

        .stat-value > span {
          color: #777a71;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .stat-caption {
          margin-top: 9px;
          color: #96978f;
          font-size: 11px;
          line-height: 1.6;
        }

        .progress-track {
          height: 4px;
          margin-top: 13px;
          overflow: hidden;
          border-radius: 10px;
          background: var(--accent-soft);
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: var(--accent);
          transition: width .25s;
        }

        .calendar-card {
          padding: 28px;
        }

        .calendar-heading,
        .panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .calendar-heading h2 {
          margin: 0;
          font-size: 25px;
          line-height: 1.3;
          font-weight: 650;
          letter-spacing: -.04em;
        }

        .calendar-heading h2 span {
          color: #9a9b94;
          font-size: 15px;
          font-weight: 450;
          letter-spacing: 0;
        }

        .muted {
          margin: 7px 0 0;
          color: #96978f;
          font-size: 11px;
          line-height: 1.6;
        }

        .month-controls {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .icon-button {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border: 1px solid var(--line);
          border-radius: 11px;
          background: white;
          color: #484a43;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 5px;
          margin-top: 26px;
        }

        .weekday {
          padding: 10px 0 13px;
          color: #93958d;
          font-size: 11px;
          font-weight: 650;
          text-align: center;
        }

        .saturday {
          color: #8296ae;
        }

        .sunday {
          color: #c18b83;
        }

        .day-cell {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 83px;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 2px 7px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #42443e;
          font: inherit;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }

        button.day-cell:hover:not(.day-selected) {
          border-color: var(--accent-soft-strong);
          background: var(--accent-soft);
        }

        .day-empty {
          pointer-events: none;
        }

        .day-number {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 550;
        }

        .day-saturday .day-number {
          color: #8296ae;
        }

        .day-sunday .day-number {
          color: #c18b83;
        }

        .day-today:not(.day-selected) .day-number {
          background: var(--accent-soft);
          color: var(--accent-dark);
          font-weight: 750;
        }

        .day-selected {
          border-color: var(--accent) !important;
          background: var(--accent) !important;
          color: white;
          box-shadow: 0 3px 8px color-mix(in srgb, var(--accent) 20%, transparent);
        }

        .day-selected .day-number {
          color: white;
        }

        .today-label {
          color: var(--accent);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .06em;
        }

        .day-selected .today-label {
          color: white;
          opacity: .8;
        }

        .day-markers {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-height: 5px;
          margin-top: 2px;
        }

        .marker,
        .legend-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .marker-study,
        .legend-study {
          background: #88a17f;
        }

        .marker-task,
        .legend-task {
          background: #8da4c1;
        }

        .marker-done {
          background: #c4d6b8;
        }

        .marker-exam,
        .legend-exam {
          background: #d9a16b;
        }

        .day-selected .marker-study,
        .day-selected .marker-task,
        .day-selected .marker-exam {
          background: white;
        }

        .day-task-count {
          color: #8b8e85;
          font-size: 9px;
          font-weight: 550;
        }

        .day-selected .day-task-count {
          color: white;
          opacity: .85;
        }

        .day-exam-label {
          max-width: 100%;
          color: #b47c48;
          font-size: 9px;
        }

        .day-selected .day-exam-label {
          color: #f2d5b5;
        }

        .calendar-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 20px;
          padding-top: 17px;
          border-top: 1px solid #f0f0ec;
        }

        .calendar-legend span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #85877f;
          font-size: 10px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
          gap: 18px;
          margin-top: 20px;
        }

        .panel {
          padding: 25px;
        }

        .panel-heading h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 650;
          letter-spacing: -.035em;
        }

        .count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 43px;
          padding: 7px 10px;
          border-radius: 9px;
          background: var(--accent-soft);
          color: var(--accent-dark);
          font-size: 11px;
          font-weight: 750;
        }

        .journal-icon,
        .milestone-icon {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          border-radius: 11px;
          background: var(--accent-soft);
          color: var(--accent-dark);
          font-size: 20px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 26px 8px;
          text-align: center;
        }

        .empty-icon {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border: 1px solid var(--accent-soft-strong);
          border-radius: 12px;
          color: var(--accent);
          font-size: 20px;
        }

        .empty-state p {
          margin: 12px 0 5px;
          font-size: 12px;
          font-weight: 650;
        }

        .empty-state > span:last-child {
          color: #999a93;
          font-size: 10px;
          line-height: 1.7;
        }

        .task-list {
          display: grid;
          gap: 0;
          margin-top: 15px;
        }

        .task-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 0;
          border-bottom: 1px solid #f0f0ec;
        }

        .task-checkbox {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .task-content {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 5px;
        }

        .task-title {
          overflow-wrap: anywhere;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.6;
        }

        .task-completed {
          color: #9b9d95;
          text-decoration: line-through;
        }

        .task-meta,
        .task-status {
          color: #96978f;
          font-size: 10px;
          line-height: 1.6;
        }

        .text-button {
          flex-shrink: 0;
          padding: 6px 3px;
          border: 0;
          background: transparent;
          font: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .danger {
          color: #b77d70;
        }

        .danger:hover {
          color: #8d4133;
        }

        .form-divider {
          height: 1px;
          margin: 20px 0;
          background: var(--line);
        }

        .form-title {
          margin: 0 0 15px;
          font-size: 13px;
          font-weight: 650;
        }

        .stack-form {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .form-field {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 7px;
        }

        .form-field > span {
          color: #686b62;
          font-size: 11px;
          font-weight: 600;
        }

        .field {
          width: 100%;
          min-width: 0;
          min-height: 41px;
          padding: 10px 12px;
          border: 1px solid #e5e6df;
          border-radius: 10px;
          outline: none;
          background: #fcfcfa;
          color: #30322c;
          font: inherit;
          font-size: 12px;
          transition: border-color .15s, box-shadow .15s;
        }

        .field::placeholder {
          color: #b1b2aa;
        }

        .field:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
        }

        .note-field {
          min-height: 100px;
          resize: vertical;
          line-height: 1.8;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .three-columns {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .button-full {
          width: 100%;
          margin-top: 2px;
        }

        .section-description {
          margin: 16px 0 0;
          color: #898b82;
          font-size: 11px;
          line-height: 1.8;
        }

        .saved-indicator {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 15px;
          color: var(--accent-dark);
          font-size: 10px;
        }

        .saved-dot {
          width: 6px;
          height: 6px;
        }

        .exams-panel {
          margin-top: 20px;
        }

        .exam-list {
          margin-top: 18px;
        }

        .exam-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #f0f0ec;
        }

        .exam-date-block {
          display: flex;
          width: 53px;
          height: 57px;
          flex-shrink: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          border-radius: 12px;
          background: var(--accent-soft);
        }

        .exam-date-block span {
          color: #888a80;
          font-size: 9px;
        }

        .exam-date-block strong {
          font-size: 22px;
          font-weight: 650;
          line-height: 1.2;
        }

        .exam-info {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 6px;
        }

        .exam-info strong {
          overflow-wrap: anywhere;
          font-size: 12px;
          font-weight: 650;
        }

        .exam-info span {
          color: #92948b;
          font-size: 10px;
        }

        .exam-countdown {
          display: flex;
          flex-shrink: 0;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .exam-countdown strong {
          font-size: 14px;
          font-weight: 700;
        }

        .exam-countdown span {
          color: #96988e;
          font-size: 8px;
          letter-spacing: .09em;
        }

        .exam-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          align-items: end;
          gap: 12px;
        }

        .exam-add-button {
          white-space: nowrap;
        }

        .form-hint {
          margin: 12px 0 0;
          color: #a0a197;
          font-size: 10px;
        }

        .next-exam {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 20px;
          padding: 25px;
          border: 1px solid var(--accent-soft-strong);
          border-radius: 18px;
          background: var(--accent-soft);
        }

        .next-exam-symbol {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border: 1px solid var(--accent-soft-strong);
          border-radius: 15px;
          background: rgba(255,255,255,.55);
          color: var(--accent);
          font-size: 23px;
        }

        .next-exam-copy {
          min-width: 0;
          flex: 1;
        }

        .next-exam-copy .eyebrow {
          margin-bottom: 6px;
          color: var(--accent-dark);
        }

        .next-exam-copy h2 {
          margin: 0;
          overflow-wrap: anywhere;
          font-size: 17px;
          font-weight: 650;
        }

        .next-exam-copy p {
          margin: 6px 0 0;
          color: #808779;
          font-size: 11px;
        }

        .next-exam-days {
          display: flex;
          flex-shrink: 0;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .next-exam-days strong {
          color: var(--accent-dark);
          font-size: 32px;
          font-weight: 650;
          letter-spacing: -.05em;
        }

        .next-exam-days span {
          color: var(--accent-dark);
          opacity: .8;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: .1em;
        }

        .footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 42px;
          text-align: center;
        }

        .footer-brand {
          width: 29px;
          height: 29px;
          border-radius: 9px;
          font-size: 17px;
        }

        .footer > p {
          margin: 11px 0 15px;
          color: #96978f;
          font-size: 10px;
          letter-spacing: .02em;
        }

        .save-status {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 19px;
          color: #85877f;
          font-size: 10px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
        }

        .status-saving {
          background: #d6a06a;
        }

        @media (max-width: 760px) {
          .calendar-page {
            padding: 0 16px 40px;
          }

          .topbar {
            min-height: 65px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .stat-card {
            padding: 16px;
          }

          .calendar-card {
            padding: 19px 13px;
          }

          .calendar-grid {
            gap: 2px;
            margin-top: 19px;
          }

          .day-cell {
            min-height: 70px;
            padding: 7px 0 5px;
            border-radius: 9px;
          }

          .day-number {
            width: 26px;
            height: 26px;
            font-size: 11px;
          }

          .content-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .panel {
            padding: 20px;
          }

          .exam-form {
            grid-template-columns: 1fr 1fr;
          }

          .exam-add-button {
            grid-column: 1 / -1;
          }

          .topbar {
            padding-left: 52px;
          }

          .brand {
            font-size: 11px;
          }

          .hero {
            align-items: flex-start;
            padding: 32px 0 22px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero-description {
            max-width: 235px;
            font-size: 11px;
          }

          .hero-today {
            min-height: 35px;
            padding: 0 10px;
            font-size: 10px;
          }

          .stat-card {
            padding: 13px;
            border-radius: 14px;
          }

          .stat-label {
            font-size: 8px;
            letter-spacing: .06em;
          }

          .stat-value {
            margin-top: 14px;
            font-size: 25px;
          }

          .calendar-heading h2 {
            font-size: 21px;
          }

          .calendar-heading h2 span {
            font-size: 12px;
          }

          .calendar-heading .eyebrow {
            font-size: 9px;
          }

          .month-controls {
            gap: 4px;
          }

          .icon-button {
            width: 31px;
            height: 34px;
          }

          .button-subtle {
            min-height: 34px;
            padding: 0 10px;
          }

          .weekday {
            padding: 8px 0 10px;
            font-size: 10px;
          }

          .day-cell {
            min-height: 62px;
          }

          .day-number {
            width: 23px;
            height: 23px;
          }

          .today-label {
            font-size: 7px;
          }

          .day-task-count {
            font-size: 8px;
          }

          .calendar-legend {
            gap: 12px;
          }

          .calendar-legend span {
            font-size: 9px;
          }

          .three-columns {
            gap: 6px;
          }

          .three-columns .field {
            padding: 9px 6px;
            font-size: 11px;
          }

          .form-row {
            gap: 9px;
          }

          .exam-row {
            gap: 9px;
          }

          .exam-date-block {
            width: 43px;
            height: 51px;
          }

          .exam-info strong {
            font-size: 11px;
          }

          .exam-countdown strong {
            font-size: 12px;
          }

          .exam-countdown span {
            font-size: 7px;
          }

          .next-exam {
            gap: 12px;
            padding: 18px 14px;
          }

          .next-exam-symbol {
            width: 38px;
            height: 38px;
          }

          .next-exam-copy h2 {
            font-size: 14px;
          }

          .next-exam-days strong {
            font-size: 26px;
          }

          .footer-links {
            gap: 14px;
          }
        }
      `}</style>
    </main>
  );
}

function readLegacyTasks(): unknown[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.tasks) ? parsed.tasks : [];
  } catch {
    return [];
  }
}