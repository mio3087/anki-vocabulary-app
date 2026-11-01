"use client";

import Link from "next/link";
import { useAppLanguage } from "@/app/component/AppLanguage";
import type { AppLanguage } from "@/app/component/AppLanguage";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Search,
  Brain,
  ChartNoAxesColumn,
  CheckCircle2,
  Headphones,
  PenLine,
  MessageCircle,
  Lightbulb,
} from "lucide-react";

const translations: {
  ja: Record<string, string>;
} & Partial<Record<Exclude<AppLanguage, "ja">, Record<string, string>>> = {
  ja: {
    back: "Reality Check に戻る",
    heading: "「分かったつもり」を見つける",
    intro: "自分では理解できたと思っていても、実際には説明できない、思い出せない、使えないことがあります。Reality Checkは、その認識と実力の差を見つけるための記録ツールです。",
    basic: "基本の使い方",
    step1: "分析する教材を選ぶ",
    step1Desc: "実際に学習した文章・ニュース・音声などを選びます。教材を最後まで学習してからでも、途中で難しさを感じた段階でも構いません。",
    step1Action: "言語とスキルを選び、教材名を入力する",
    step1Result: "どの言語の、どの能力を検証した記録なのかが分かります。",
    step2: "理解度を予測する",
    step2Desc: "答え合わせや辞書での確認をする前に、自分がどれくらい理解できたと思うかを考えます。",
    step2Action: "自信度のスライダーを動かす",
    step2Result: "自分の主観的な理解度を記録できます。",
    step3: "実際に理解できているか検証する",
    step3Desc: "ここがReality Checkの中心です。単に分かった気がするかではなく、実際に知識を使えるかを確認します。",
    step3Action: "下のスキル別の検証方法を試す",
    step3Result: "理解できている部分と、理解できていない部分を区別できます。",
    step4: "実際の理解度を評価する",
    step4Desc: "検証して分かったことをもとに、実際の理解度を数値で入力します。",
    step4Action: "実際の理解度のスライダーを動かす",
    step4Result: "自信度と実際の理解度の差が明らかになります。",
    step5: "誤解の種類を記録する",
    step5Desc: "今回どこでつまずいたのかを選びます。複数選択できます。",
    step5Action: "語彙・文法・構造・推論などを選択する",
    step5Result: "自分が繰り返し間違える原因を分析できるようになります。",
    step6: "分析結果を保存する",
    step6Desc: "気づいたことや、次回気をつけたいことをメモして保存します。",
    step6Action: "分析内容を確認して保存する",
    step6Result: "検証した教材数、誤解の傾向、理解度の変化を蓄積できます。",
    action: "操作すること",
    result: "分かるようになること",
    skillMethods: "スキル別の検証方法",
    skillIntro: "どのスキルを選んだかによって、実際に確認する内容が変わります。",
    reading: "文章を読む",
    listening: "音声を聞く",
    writing: "文章を書く",
    speaking: "言葉で伝える",
    reading1: "文章を閉じて、内容を自分の言葉で説明できるか",
    reading2: "重要な単語を文脈に合った意味で理解しているか",
    reading3: "筆者の主張と、その根拠を説明できるか",
    reading4: "文章の前後関係や因果関係を理解しているか",
    readingDiscovery: "読めたつもりでも、語彙・文構造・論理関係を誤解していたことが分かります。",
    listening1: "聞いた内容を音声なしで説明できるか",
    listening2: "否定・条件・数字を正確に聞き取れたか",
    listening3: "聞き取れなかった箇所と意味が分からなかった箇所を区別できるか",
    listening4: "音声の内容を別の言葉で言い換えられるか",
    listeningDiscovery: "音が聞こえなかったのか、聞こえたのに意味を理解できなかったのかが分かります。",
    writing1: "伝えたい内容を外国語で組み立てられるか",
    writing2: "文法や語彙を適切に使えているか",
    writing3: "母語からの直訳になっていないか",
    writing4: "読み手に意図が正しく伝わる文章か",
    writingDiscovery: "知っている単語や文法を、実際の文章で使えているかが分かります。",
    speaking1: "準備なしで質問に答えられるか",
    speaking2: "言いたいことをすぐに言葉にできるか",
    speaking3: "別の表現を使って説明し直せるか",
    speaking4: "予想外の質問にも対応できるか",
    speakingDiscovery: "知識として知っていることと、会話中に瞬時に使えることの違いが分かります。",
    discovery: "この検証で分かること",
    gap: "自信度と実際の理解度の差に注目する",
    gapDesc: "例えば、自分では80%理解できたと思っていたのに、検証してみると実際には50%しか理解できていなかった場合、その差は30ポイントです。",
    confidence: "自信度",
    actual: "実際の理解度",
    gapResult: "理解度の見積もりに30ポイントの差があることが分かります。",
    rules: "記録するときの大切なルール",
    rule1: "自信度は、答え合わせや調査をする前に入力する。",
    rule2: "実際の理解度は、検証した結果をもとに入力する。",
    rule3: "分からなかったことを無理に理解できたことにしない。",
    rule4: "一度の結果だけで自分の能力を決めつけない。",
    rule5: "同じ誤解が繰り返されていないか、記録を蓄積して確認する。",
    startTitle: "さっそく検証してみましょう",
    startDesc: "小さな教材ひとつから始めて大丈夫です。",
    startButton: "新しい分析を記録する",
  },

  en: {
    back: "Back to Reality Check",
    heading: "Discover What You Only Thought You Understood",
    intro: "You may feel that you understand something, but still be unable to explain it, recall it, or use it. Reality Check is a tool for recording the gap between your perceived understanding and your actual ability.",
    basic: "How to Use",
    step1: "Choose Learning Material",
    step1Desc: "Choose a text, news article, audio recording, or other material you have studied. You can do this after finishing the material or whenever you encounter something difficult.",
    step1Action: "Choose a language and skill, then enter the material's title.",
    step1Result: "You can identify which language and skill you are evaluating.",
    step2: "Estimate Your Understanding",
    step2Desc: "Before checking answers or looking up words, consider how much you think you understood.",
    step2Action: "Adjust the confidence slider.",
    step2Result: "You can record your subjective understanding.",
    step3: "Test Your Actual Understanding",
    step3Desc: "This is the core of Reality Check. Instead of simply asking whether something feels familiar, test whether you can actually use the knowledge.",
    step3Action: "Try the skill-specific tests below.",
    step3Result: "You can distinguish what you understand from what you do not.",
    step4: "Evaluate Your Actual Understanding",
    step4Desc: "Based on what you discovered during testing, enter your actual understanding as a percentage.",
    step4Action: "Adjust the actual understanding slider.",
    step4Result: "The difference between your confidence and actual understanding becomes clear.",
    step5: "Record Types of Misunderstanding",
    step5Desc: "Select where you struggled this time. You can choose multiple items.",
    step5Action: "Select vocabulary, grammar, structure, inference, and other categories.",
    step5Result: "You can analyze the causes of recurring mistakes.",
    step6: "Save Your Analysis",
    step6Desc: "Write down what you noticed and what you want to pay attention to next time, then save your analysis.",
    step6Action: "Review and save your analysis.",
    step6Result: "You can accumulate records of materials tested, misunderstanding patterns, and changes in understanding.",
    action: "What to Do",
    result: "What You Will Learn",
    skillMethods: "How to Test Each Skill",
    skillIntro: "The things you need to check will vary depending on the skill you choose.",
    reading: "Read a Text",
    listening: "Listen to Audio",
    writing: "Write a Text",
    speaking: "Communicate Verbally",
    reading1: "Can you explain the content in your own words without looking at the text?",
    reading2: "Do you understand important words in a way that fits the context?",
    reading3: "Can you explain the author's main point and supporting evidence?",
    reading4: "Do you understand the relationships between ideas and cause and effect?",
    readingDiscovery: "You may discover that you misunderstood vocabulary, sentence structure, or logical relationships even though you thought you had understood the text.",
    listening1: "Can you explain what you heard without replaying the audio?",
    listening2: "Did you accurately hear negatives, conditions, and numbers?",
    listening3: "Can you distinguish between sounds you could not hear and parts whose meaning you could not understand?",
    listening4: "Can you paraphrase the content of the audio?",
    listeningDiscovery: "You can identify whether you failed to hear the sounds or heard them but could not understand their meaning.",
    writing1: "Can you organize and express your ideas in the target language?",
    writing2: "Are you using grammar and vocabulary appropriately?",
    writing3: "Does your writing avoid direct translation from your native language?",
    writing4: "Does your writing communicate your intended meaning clearly to the reader?",
    writingDiscovery: "You can see whether you can actually use the vocabulary and grammar you know in your own writing.",
    speaking1: "Can you answer questions without preparation?",
    speaking2: "Can you put your thoughts into words quickly?",
    speaking3: "Can you explain something again using different expressions?",
    speaking4: "Can you respond to unexpected questions?",
    speakingDiscovery: "You can see the difference between knowing something as information and being able to use it instantly in conversation.",
    discovery: "What This Test Reveals",
    gap: "Pay Attention to the Gap Between Confidence and Actual Understanding",
    gapDesc: "For example, if you think you understood 80% of something but testing shows that you actually understood only 50%, the difference is 30 percentage points.",
    confidence: "Confidence",
    actual: "Actual Understanding",
    gapResult: "You can see a 30-point difference between your estimated and actual understanding.",
    rules: "Important Rules for Recording",
    rule1: "Enter your confidence level before checking answers or doing research.",
    rule2: "Enter your actual understanding based on the results of your test.",
    rule3: "Do not force yourself to count something as understood when it was not.",
    rule4: "Do not judge your overall ability based on a single result.",
    rule5: "Accumulate records and check whether the same misunderstandings keep recurring.",
    startTitle: "Ready to Test Your Understanding?",
    startDesc: "You can start with just one small piece of learning material.",
    startButton: "Record a New Analysis",
  },

  de: {
    back: "Zurück zu Reality Check",
    heading: "Entdecke, was du nur zu verstehen glaubtest",
    intro: "Manchmal glauben wir, etwas verstanden zu haben, können es aber nicht erklären, abrufen oder anwenden. Reality Check hilft dir, den Unterschied zwischen deinem empfundenen Verständnis und deinen tatsächlichen Fähigkeiten festzuhalten.",
    basic: "Grundlegende Anleitung",
    step1: "Lernmaterial auswählen",
    step1Desc: "Wähle einen Text, einen Nachrichtenartikel, eine Audioaufnahme oder anderes Material, das du gelernt hast. Du kannst dies nach Abschluss oder auch dann tun, wenn du während des Lernens auf Schwierigkeiten stößt.",
    step1Action: "Wähle eine Sprache und eine Fähigkeit aus und gib den Titel des Materials ein.",
    step1Result: "Du kannst nachvollziehen, welche Sprache und welche Fähigkeit du überprüft hast.",
    step2: "Verständnis einschätzen",
    step2Desc: "Überlege vor der Lösungskontrolle oder einer Wörterbuchsuche, wie viel du deiner Meinung nach verstanden hast.",
    step2Action: "Passe den Schieberegler für dein Selbstvertrauen an.",
    step2Result: "Du kannst deine subjektive Einschätzung des Verständnisses festhalten.",
    step3: "Tatsächliches Verständnis überprüfen",
    step3Desc: "Das ist der Kern von Reality Check. Es geht nicht nur darum, ob dir etwas bekannt vorkommt, sondern darum, ob du das Wissen tatsächlich anwenden kannst.",
    step3Action: "Probiere die unten beschriebenen Tests für die einzelnen Fähigkeiten aus.",
    step3Result: "Du kannst unterscheiden, was du verstanden hast und was nicht.",
    step4: "Tatsächliches Verständnis bewerten",
    step4Desc: "Trage anhand deiner Überprüfung ein, wie hoch dein tatsächliches Verständnis ist.",
    step4Action: "Passe den Schieberegler für das tatsächliche Verständnis an.",
    step4Result: "Der Unterschied zwischen deiner Einschätzung und deinem tatsächlichen Verständnis wird sichtbar.",
    step5: "Arten von Missverständnissen festhalten",
    step5Desc: "Wähle aus, wo du diesmal Schwierigkeiten hattest. Mehrfachauswahl ist möglich.",
    step5Action: "Wähle Kategorien wie Wortschatz, Grammatik, Struktur oder Schlussfolgerungen aus.",
    step5Result: "Du kannst die Ursachen wiederkehrender Fehler analysieren.",
    step6: "Analyse speichern",
    step6Desc: "Notiere deine Erkenntnisse und worauf du beim nächsten Mal achten möchtest. Speichere anschließend deine Analyse.",
    step6Action: "Überprüfe und speichere deine Analyse.",
    step6Result: "Du kannst die Anzahl überprüfter Materialien, Muster von Missverständnissen und Veränderungen deines Verständnisses sammeln.",
    action: "Was zu tun ist",
    result: "Was du dadurch erkennst",
    skillMethods: "Überprüfungsmethoden nach Fähigkeit",
    skillIntro: "Je nachdem, welche Fähigkeit du auswählst, überprüfst du unterschiedliche Dinge.",
    reading: "Einen Text lesen",
    listening: "Audio anhören",
    writing: "Einen Text schreiben",
    speaking: "Mündlich kommunizieren",
    reading1: "Kannst du den Text schließen und den Inhalt mit eigenen Worten erklären?",
    reading2: "Verstehst du wichtige Wörter in einer zum Kontext passenden Bedeutung?",
    reading3: "Kannst du die Hauptaussage des Autors und die dazugehörigen Belege erklären?",
    reading4: "Verstehst du die Zusammenhänge und Ursache-Wirkungs-Beziehungen im Text?",
    readingDiscovery: "Du erkennst möglicherweise, dass du Wortschatz, Satzbau oder logische Zusammenhänge falsch verstanden hast, obwohl du dachtest, den Text verstanden zu haben.",
    listening1: "Kannst du den gehörten Inhalt ohne Audio erklären?",
    listening2: "Hast du Verneinungen, Bedingungen und Zahlen richtig verstanden?",
    listening3: "Kannst du unterscheiden, ob du etwas akustisch nicht erkannt oder dessen Bedeutung nicht verstanden hast?",
    listening4: "Kannst du den Inhalt der Aufnahme mit anderen Worten wiedergeben?",
    listeningDiscovery: "Du kannst erkennen, ob du die Laute nicht gehört oder sie gehört, aber ihre Bedeutung nicht verstanden hast.",
    writing1: "Kannst du deine Gedanken in der Fremdsprache strukturieren und ausdrücken?",
    writing2: "Verwendest du Grammatik und Wortschatz angemessen?",
    writing3: "Vermeidest du eine direkte Übersetzung aus deiner Muttersprache?",
    writing4: "Kann der Leser deine beabsichtigte Aussage richtig verstehen?",
    writingDiscovery: "Du erkennst, ob du bekannte Wörter und Grammatik tatsächlich beim Schreiben anwenden kannst.",
    speaking1: "Kannst du Fragen ohne Vorbereitung beantworten?",
    speaking2: "Kannst du deine Gedanken schnell in Worte fassen?",
    speaking3: "Kannst du etwas mit anderen Formulierungen erneut erklären?",
    speaking4: "Kannst du auch auf unerwartete Fragen reagieren?",
    speakingDiscovery: "Du erkennst den Unterschied zwischen theoretischem Wissen und der Fähigkeit, es im Gespräch spontan anzuwenden.",
    discovery: "Was du durch diese Überprüfung erkennst",
    gap: "Achte auf den Unterschied zwischen Selbstvertrauen und tatsächlichem Verständnis",
    gapDesc: "Wenn du beispielsweise glaubst, etwas zu 80 % verstanden zu haben, die Überprüfung aber zeigt, dass du tatsächlich nur 50 % verstanden hast, beträgt der Unterschied 30 Prozentpunkte.",
    confidence: "Selbstvertrauen",
    actual: "Tatsächliches Verständnis",
    gapResult: "Du erkennst einen Unterschied von 30 Prozentpunkten zwischen deiner Einschätzung und deinem tatsächlichen Verständnis.",
    rules: "Wichtige Regeln für die Dokumentation",
    rule1: "Trage dein Selbstvertrauen ein, bevor du Antworten kontrollierst oder recherchierst.",
    rule2: "Bewerte dein tatsächliches Verständnis anhand des Überprüfungsergebnisses.",
    rule3: "Zähle etwas nicht künstlich als verstanden, wenn du es nicht verstanden hast.",
    rule4: "Beurteile deine Fähigkeiten nicht anhand eines einzigen Ergebnisses.",
    rule5: "Sammle Einträge und überprüfe, ob dieselben Missverständnisse wiederholt auftreten.",
    startTitle: "Probiere es gleich aus",
    startDesc: "Du kannst mit einem einzigen kleinen Lernmaterial beginnen.",
    startButton: "Neue Analyse speichern",
  },

  "zh-CN": {
    back: "返回 Reality Check",
    heading: "发现那些自以为理解了的内容",
    intro: "有时我们觉得自己已经理解了，但实际上却无法解释、回忆或运用。Reality Check 是一个记录工具，帮助你发现主观理解与实际能力之间的差距。",
    basic: "基本使用方法",
    step1: "选择要分析的学习材料",
    step1Desc: "选择自己实际学习过的文章、新闻、音频等材料。可以在学完整份材料后进行，也可以在学习过程中感到困难时进行。",
    step1Action: "选择语言和技能，并输入教材名称。",
    step1Result: "明确记录自己检验的是哪种语言、哪项能力。",
    step2: "预估理解程度",
    step2Desc: "在核对答案或查阅词典之前，先思考自己认为理解了多少。",
    step2Action: "调整自信程度滑块。",
    step2Result: "记录自己主观上的理解程度。",
    step3: "检验实际理解情况",
    step3Desc: "这是 Reality Check 的核心。不只是判断自己是否觉得听懂或看懂，而是确认自己能否真正运用所学知识。",
    step3Action: "尝试下方针对不同技能的检验方法。",
    step3Result: "区分已经理解的部分和仍未理解的部分。",
    step4: "评估实际理解程度",
    step4Desc: "根据检验过程中发现的情况，以数字形式填写实际理解程度。",
    step4Action: "调整实际理解程度滑块。",
    step4Result: "明确自信程度与实际理解程度之间的差距。",
    step5: "记录误解的类型",
    step5Desc: "选择这次学习中遇到的问题。可以多选。",
    step5Action: "选择词汇、语法、结构、推理等类别。",
    step5Result: "分析自己反复出错的原因。",
    step6: "保存分析结果",
    step6Desc: "记录自己的发现以及下次需要注意的地方，然后保存分析结果。",
    step6Action: "确认分析内容并保存。",
    step6Result: "逐步积累检验过的材料数量、误解倾向和理解程度的变化。",
    action: "需要进行的操作",
    result: "可以了解的内容",
    skillMethods: "不同技能的检验方法",
    skillIntro: "根据选择的技能，需要实际确认的内容也会有所不同。",
    reading: "阅读文章",
    listening: "听取音频",
    writing: "写作",
    speaking: "口语表达",
    reading1: "合上文章后，能否用自己的话说明文章内容？",
    reading2: "是否理解了重要词汇在上下文中的含义？",
    reading3: "能否说明作者的观点及其依据？",
    reading4: "是否理解文章前后内容及因果关系？",
    readingDiscovery: "你可能会发现，虽然觉得自己读懂了文章，但实际上误解了词汇、句子结构或逻辑关系。",
    listening1: "能否在不播放音频的情况下说明听到的内容？",
    listening2: "是否准确听出了否定、条件和数字？",
    listening3: "能否区分没有听清的部分和听清了却不理解意思的部分？",
    listening4: "能否用其他表达方式复述音频内容？",
    listeningDiscovery: "你可以判断自己是没有听清声音，还是听到了声音却无法理解其含义。",
    writing1: "能否用外语组织并表达自己想传达的内容？",
    writing2: "是否恰当地使用语法和词汇？",
    writing3: "是否避免了从母语直接翻译？",
    writing4: "读者能否准确理解你想表达的意思？",
    writingDiscovery: "你可以确认自己是否能够在实际写作中运用已经学过的词汇和语法。",
    speaking1: "能否在没有准备的情况下回答问题？",
    speaking2: "能否迅速将想法转化为语言？",
    speaking3: "能否换一种表达方式重新解释？",
    speaking4: "能否应对意料之外的问题？",
    speakingDiscovery: "你可以了解把知识作为信息记住，与在对话中即时运用知识之间的区别。",
    discovery: "通过检验可以了解的内容",
    gap: "关注自信程度与实际理解程度之间的差距",
    gapDesc: "例如，你原本认为自己理解了 80%，但经过检验发现实际上只理解了 50%，两者之间就相差 30 个百分点。",
    confidence: "自信程度",
    actual: "实际理解程度",
    gapResult: "可以看出，你对理解程度的预估与实际情况相差 30 个百分点。",
    rules: "记录时的重要规则",
    rule1: "在核对答案或查阅资料之前填写自信程度。",
    rule2: "根据实际检验结果填写实际理解程度。",
    rule3: "不要勉强把自己不理解的内容当作已经理解。",
    rule4: "不要仅凭一次结果就判断自己的整体能力。",
    rule5: "持续积累记录，确认是否反复出现相同的误解。",
    startTitle: "现在就开始检验吧",
    startDesc: "从一份简单的学习材料开始就可以。",
    startButton: "记录新的分析",
  },

  "zh-TW": {
    back: "返回 Reality Check",
    heading: "找出那些自以為理解了的內容",
    intro: "有時候我們覺得自己已經理解了，但實際上卻無法解釋、回想或運用。Reality Check 是一個記錄工具，幫助你找出主觀理解與實際能力之間的差距。",
    basic: "基本使用方式",
    step1: "選擇要分析的學習材料",
    step1Desc: "選擇自己實際學習過的文章、新聞、音訊等材料。可以在學完整份材料後進行，也可以在學習過程中感到困難時進行。",
    step1Action: "選擇語言和技能，並輸入教材名稱。",
    step1Result: "明確記錄自己檢驗的是哪種語言、哪項能力。",
    step2: "預估理解程度",
    step2Desc: "在核對答案或查閱字典之前，先思考自己認為理解了多少。",
    step2Action: "調整自信程度滑桿。",
    step2Result: "記錄自己主觀上的理解程度。",
    step3: "檢驗實際理解情況",
    step3Desc: "這是 Reality Check 的核心。不只是判斷自己是否覺得聽懂或看懂，而是確認自己能否真正運用所學知識。",
    step3Action: "嘗試下方針對不同技能的檢驗方法。",
    step3Result: "區分已經理解的部分和仍未理解的部分。",
    step4: "評估實際理解程度",
    step4Desc: "根據檢驗過程中發現的情況，以數字形式填寫實際理解程度。",
    step4Action: "調整實際理解程度滑桿。",
    step4Result: "明確自信程度與實際理解程度之間的差距。",
    step5: "記錄誤解的類型",
    step5Desc: "選擇這次學習中遇到的問題。可以複選。",
    step5Action: "選擇詞彙、文法、結構、推論等類別。",
    step5Result: "分析自己反覆出錯的原因。",
    step6: "儲存分析結果",
    step6Desc: "記錄自己的發現以及下次需要注意的地方，然後儲存分析結果。",
    step6Action: "確認分析內容並儲存。",
    step6Result: "逐步累積檢驗過的材料數量、誤解傾向和理解程度的變化。",
    action: "需要進行的操作",
    result: "可以了解的內容",
    skillMethods: "不同技能的檢驗方法",
    skillIntro: "根據選擇的技能，需要實際確認的內容也會有所不同。",
    reading: "閱讀文章",
    listening: "聆聽音訊",
    writing: "寫作",
    speaking: "口說表達",
    reading1: "合上文章後，能否用自己的話說明文章內容？",
    reading2: "是否理解了重要詞彙在上下文中的含義？",
    reading3: "能否說明作者的觀點及其依據？",
    reading4: "是否理解文章前後內容及因果關係？",
    readingDiscovery: "你可能會發現，雖然覺得自己讀懂了文章，但實際上誤解了詞彙、句子結構或邏輯關係。",
    listening1: "能否在不播放音訊的情況下說明聽到的內容？",
    listening2: "是否準確聽出了否定、條件和數字？",
    listening3: "能否區分沒有聽清楚的部分和聽清楚卻不理解意思的部分？",
    listening4: "能否用其他表達方式重新說明音訊內容？",
    listeningDiscovery: "你可以判斷自己是沒有聽清楚聲音，還是聽到了聲音卻無法理解其含義。",
    writing1: "能否用外語組織並表達自己想傳達的內容？",
    writing2: "是否恰當地使用文法和詞彙？",
    writing3: "是否避免了從母語直接翻譯？",
    writing4: "讀者能否正確理解你想表達的意思？",
    writingDiscovery: "你可以確認自己是否能在實際寫作中運用已經學過的詞彙和文法。",
    speaking1: "能否在沒有準備的情況下回答問題？",
    speaking2: "能否迅速將想法轉化為語言？",
    speaking3: "能否換一種表達方式重新解釋？",
    speaking4: "能否應對意料之外的問題？",
    speakingDiscovery: "你可以了解將知識作為資訊記住，與在對話中即時運用知識之間的差異。",
    discovery: "透過檢驗可以了解的內容",
    gap: "留意自信程度與實際理解程度之間的差距",
    gapDesc: "例如，你原本認為自己理解了 80%，但經過檢驗發現實際上只理解了 50%，兩者之間就相差 30 個百分點。",
    confidence: "自信程度",
    actual: "實際理解程度",
    gapResult: "可以看出，你對理解程度的預估與實際情況相差 30 個百分點。",
    rules: "記錄時的重要規則",
    rule1: "在核對答案或查閱資料之前填寫自信程度。",
    rule2: "根據實際檢驗結果填寫實際理解程度。",
    rule3: "不要勉強把自己不理解的內容當作已經理解。",
    rule4: "不要只憑一次結果就判斷自己的整體能力。",
    rule5: "持續累積記錄，確認是否反覆出現相同的誤解。",
    startTitle: "現在就開始檢驗吧",
    startDesc: "從一份簡單的學習材料開始就可以。",
    startButton: "記錄新的分析",
  },

  es: {
    back: "Volver a Reality Check",
    heading: "Descubre lo que creías haber entendido",
    intro: "A veces creemos que hemos entendido algo, pero en realidad no podemos explicarlo, recordarlo ni utilizarlo. Reality Check es una herramienta para registrar la diferencia entre nuestra percepción y nuestra capacidad real.",
    basic: "Cómo utilizarlo",
    step1: "Elegir el material que se analizará",
    step1Desc: "Elige un texto, una noticia, un audio u otro material que hayas estudiado. Puedes hacerlo después de terminarlo o cuando encuentres alguna dificultad durante el estudio.",
    step1Action: "Selecciona el idioma y la habilidad, e introduce el título del material.",
    step1Result: "Podrás identificar qué idioma y qué habilidad has evaluado.",
    step2: "Estimar tu comprensión",
    step2Desc: "Antes de comprobar las respuestas o consultar el diccionario, piensa cuánto crees que has entendido.",
    step2Action: "Ajusta el control deslizante de confianza.",
    step2Result: "Podrás registrar tu percepción subjetiva de comprensión.",
    step3: "Comprobar la comprensión real",
    step3Desc: "Este es el núcleo de Reality Check. No se trata solo de sentir que has entendido algo, sino de comprobar si realmente puedes utilizar esos conocimientos.",
    step3Action: "Prueba los métodos de comprobación específicos para cada habilidad que aparecen abajo.",
    step3Result: "Podrás distinguir lo que has entendido de lo que todavía no comprendes.",
    step4: "Evaluar la comprensión real",
    step4Desc: "Basándote en lo que has descubierto durante la comprobación, introduce tu nivel real de comprensión en forma de porcentaje.",
    step4Action: "Ajusta el control deslizante de comprensión real.",
    step4Result: "Se hará visible la diferencia entre tu confianza y tu comprensión real.",
    step5: "Registrar los tipos de malentendidos",
    step5Desc: "Selecciona dónde has tenido dificultades esta vez. Puedes elegir varias opciones.",
    step5Action: "Selecciona categorías como vocabulario, gramática, estructura e inferencia.",
    step5Result: "Podrás analizar las causas de los errores que cometes repetidamente.",
    step6: "Guardar el análisis",
    step6Desc: "Anota lo que has descubierto y aquello a lo que quieres prestar atención la próxima vez. Después, guarda el análisis.",
    step6Action: "Revisa y guarda el contenido del análisis.",
    step6Result: "Podrás acumular datos sobre los materiales evaluados, los patrones de malentendidos y los cambios en tu comprensión.",
    action: "Qué hacer",
    result: "Qué podrás descubrir",
    skillMethods: "Métodos de comprobación por habilidad",
    skillIntro: "Los aspectos que debes comprobar cambian según la habilidad que selecciones.",
    reading: "Leer un texto",
    listening: "Escuchar un audio",
    writing: "Escribir un texto",
    speaking: "Comunicarse oralmente",
    reading1: "¿Puedes cerrar el texto y explicar su contenido con tus propias palabras?",
    reading2: "¿Comprendes las palabras importantes con el significado adecuado al contexto?",
    reading3: "¿Puedes explicar la idea principal del autor y sus argumentos?",
    reading4: "¿Comprendes las relaciones entre las partes del texto y las relaciones de causa y efecto?",
    readingDiscovery: "Descubrirás si, aunque creías haber entendido el texto, en realidad habías interpretado mal el vocabulario, la estructura de las oraciones o las relaciones lógicas.",
    listening1: "¿Puedes explicar lo que has escuchado sin volver a reproducir el audio?",
    listening2: "¿Has identificado correctamente las negaciones, condiciones y cifras?",
    listening3: "¿Puedes distinguir entre lo que no has oído y lo que has oído pero no has comprendido?",
    listening4: "¿Puedes expresar el contenido del audio con otras palabras?",
    listeningDiscovery: "Podrás identificar si no has percibido los sonidos o si los has oído, pero no has comprendido su significado.",
    writing1: "¿Puedes organizar y expresar tus ideas en el idioma extranjero?",
    writing2: "¿Utilizas correctamente la gramática y el vocabulario?",
    writing3: "¿Evitas traducir directamente desde tu lengua materna?",
    writing4: "¿El lector puede comprender correctamente lo que quieres comunicar?",
    writingDiscovery: "Podrás comprobar si realmente sabes utilizar el vocabulario y la gramática que has aprendido al escribir.",
    speaking1: "¿Puedes responder preguntas sin preparación previa?",
    speaking2: "¿Puedes expresar tus ideas rápidamente con palabras?",
    speaking3: "¿Puedes explicar algo de nuevo utilizando otras expresiones?",
    speaking4: "¿Puedes responder a preguntas inesperadas?",
    speakingDiscovery: "Podrás reconocer la diferencia entre conocer algo como información y ser capaz de utilizarlo espontáneamente durante una conversación.",
    discovery: "Qué revela esta comprobación",
    gap: "Presta atención a la diferencia entre confianza y comprensión real",
    gapDesc: "Por ejemplo, si creías haber entendido el 80 %, pero al comprobarlo descubres que en realidad solo entendiste el 50 %, la diferencia es de 30 puntos porcentuales.",
    confidence: "Confianza",
    actual: "Comprensión real",
    gapResult: "Puedes observar una diferencia de 30 puntos entre tu estimación y tu comprensión real.",
    rules: "Reglas importantes para registrar los resultados",
    rule1: "Introduce tu nivel de confianza antes de comprobar las respuestas o investigar.",
    rule2: "Introduce tu comprensión real basándote en el resultado de la comprobación.",
    rule3: "No consideres comprendido algo que en realidad no has entendido.",
    rule4: "No juzgues tu capacidad general basándote en un único resultado.",
    rule5: "Acumula registros y comprueba si se repiten los mismos malentendidos.",
    startTitle: "Vamos a comprobar tu comprensión",
    startDesc: "Puedes empezar con un solo material de estudio sencillo.",
    startButton: "Registrar un nuevo análisis",
  },
};

const steps = [
  { number: "01", icon: BookOpen, keys: ["step1", "step1Desc", "step1Action", "step1Result"] },
  { number: "02", icon: Target, keys: ["step2", "step2Desc", "step2Action", "step2Result"] },
  { number: "03", icon: Search, keys: ["step3", "step3Desc", "step3Action", "step3Result"] },
  { number: "04", icon: Brain, keys: ["step4", "step4Desc", "step4Action", "step4Result"] },
  { number: "05", icon: Lightbulb, keys: ["step5", "step5Desc", "step5Action", "step5Result"] },
  { number: "06", icon: CheckCircle2, keys: ["step6", "step6Desc", "step6Action", "step6Result"] },
] as const;

const skillData = [
  {
    id: "reading",
    title: "Reading",
    icon: BookOpen,
    checks: ["reading1", "reading2", "reading3", "reading4"],
    discovery: "readingDiscovery",
  },
  {
    id: "listening",
    title: "Listening",
    icon: Headphones,
    checks: ["listening1", "listening2", "listening3", "listening4"],
    discovery: "listeningDiscovery",
  },
  {
    id: "writing",
    title: "Writing",
    icon: PenLine,
    checks: ["writing1", "writing2", "writing3", "writing4"],
    discovery: "writingDiscovery",
  },
  {
    id: "speaking",
    title: "Speaking",
    icon: MessageCircle,
    checks: ["speaking1", "speaking2", "speaking3", "speaking4"],
    discovery: "speakingDiscovery",
  },
] as const;

export default function RealityCheckGuidePage() {
  const { language } = useAppLanguage();

  const dictionary: Record<string, string> =
    translations[language] ?? translations.ja;

  const t = (key: string): string =>
    dictionary[key] ?? translations.ja[key] ?? key;

  const themeColor = "var(--anki-theme-color)";
  const themeDark = "var(--anki-theme-dark)";
  const themeLight = "var(--anki-theme-light)";
  const themeSoft = "var(--anki-theme-soft)";

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-10 text-[#303a32]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/understanding-analytics"
          className="mb-8 inline-flex items-center gap-2 text-sm transition hover:opacity-70"
          style={{ color: themeDark }}
        >
          <ArrowLeft size={16} />
          {t("back")}
        </Link>

        <header className="mb-12">
          <p
            className="mb-3 text-xs font-semibold tracking-[0.2em]"
            style={{ color: themeDark }}
          >
            REALITY CHECK / USER GUIDE
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#68766b]">
            {t("intro")}
          </p>
        </header>

        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold">{t("basic")}</h2>
          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const [title, description, action, result] = step.keys;

              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-[#e5e9e3] bg-white p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: themeLight,
                        color: themeDark,
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold tracking-widest"
                        style={{ color: themeDark }}
                      >
                        STEP {step.number}
                      </p>

                      <h3 className="mt-1 text-base font-semibold">
                        {t(title)}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[#68766b]">
                        {t(description)}
                      </p>

                      <div
                        className="mt-4 rounded-xl p-4"
                        style={{ backgroundColor: themeLight }}
                      >
                        <p
                          className="text-xs font-semibold"
                          style={{ color: themeDark }}
                        >
                          {t("action")}
                        </p>
                        <p className="mt-1 text-sm">{t(action)}</p>

                        <p
                          className="mt-3 text-xs font-semibold"
                          style={{ color: themeDark }}
                        >
                          {t("result")}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#68766b]">
                          {t(result)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-xl font-semibold">
            {t("skillMethods")}
          </h2>
          <p className="mb-6 text-sm leading-6 text-[#68766b]">
            {t("skillIntro")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {skillData.map((skill) => {
              const Icon = skill.icon;

              return (
                <article
                  key={skill.id}
                  className="rounded-2xl border border-[#e5e9e3] bg-white p-5"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} style={{ color: themeColor }} />
                    <div>
                      <h3 className="font-semibold">{skill.title}</h3>
                      <p className="text-xs text-[#829184]">
                        {t(skill.id)}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {skill.checks.map((check) => (
                      <li
                        key={check}
                        className="flex gap-2 text-sm leading-6 text-[#59665c]"
                      >
                        <span
                          className="mt-0.5 font-semibold"
                          style={{ color: themeColor }}
                        >
                          ✓
                        </span>
                        <span>{t(check)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 border-t border-[#edf0eb] pt-4">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: themeDark }}
                    >
                      {t("discovery")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#68766b]">
                      {t(skill.discovery)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="mb-12 rounded-2xl border p-6 sm:p-8"
          style={{
            borderColor: themeSoft,
            backgroundColor: themeLight,
          }}
        >
          <p
            className="text-xs font-semibold tracking-widest"
            style={{ color: themeDark }}
          >
            UNDERSTANDING GAP
          </p>

          <h2 className="mt-3 text-xl font-semibold">{t("gap")}</h2>

          <p className="mt-3 text-sm leading-7 text-[#59665c]">
            {t("gapDesc")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-[#829184]">
                {t("confidence")}
              </p>
              <p
                className="mt-1 text-3xl font-semibold"
                style={{ color: themeDark }}
              >
                80%
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-[#829184]">{t("actual")}</p>
              <p className="mt-1 text-3xl font-semibold text-orange-500">
                50%
              </p>
            </div>
          </div>

          <p
            className="mt-4 text-sm font-semibold"
            style={{ color: themeDark }}
          >
            {t("gapResult")}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-3 text-xl font-semibold">{t("rules")}</h2>

          <ul className="space-y-3 text-sm leading-7 text-[#59665c]">
            {[1, 2, 3, 4, 5].map((number) => (
              <li key={number}>・{t(`rule${number}`)}</li>
            ))}
          </ul>
        </section>

        <div className="rounded-2xl border border-[#e5e9e3] bg-white p-6 text-center">
          <ChartNoAxesColumn
            className="mx-auto"
            style={{ color: themeColor }}
            size={25}
          />

          <h2 className="mt-3 text-lg font-semibold">
            {t("startTitle")}
          </h2>

          <p className="mt-2 text-sm text-[#68766b]">
            {t("startDesc")}
          </p>

          <Link
            href="/understanding-analytics/new"
            className="mt-5 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            {t("startButton")}
          </Link>
        </div>
      </div>
    </main>
  );
}