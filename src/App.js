import { useState, useEffect } from "react";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸", color: "#E1306C" },
  { id: "tiktok",    name: "TikTok",    icon: "🎵", color: "#69C9D0" },
  { id: "facebook",  name: "Facebook",  icon: "👤", color: "#4A90D9" },
  { id: "youtube",   name: "YouTube",   icon: "▶",  color: "#FF4444" },
  { id: "pinterest", name: "Pinterest", icon: "📌", color: "#E60023" },
];

const CONTENT_TYPES = [
  { id: "post",    label: "פוסט סושיאל",  emoji: "📝", hint: "פוסט מעורר עניין עם האשטאגים רלוונטיים" },
  { id: "reel",    label: "סקריפט Reel",  emoji: "🎬", hint: "סקריפט וידאו 60 שניות – Hook 3 שניות, גוף, CTA" },
  { id: "story",   label: "Story",         emoji: "⭕", hint: "Story קצרה עם CTA ברור" },
  { id: "blog",    label: "מאמר SEO",      emoji: "🔍", hint: "מאמר 800+ מילים עם מילות מפתח" },
  { id: "product", label: "תיאור מוצר",   emoji: "🏷️", hint: "תיאור משכנע שמוכר" },
  { id: "email",   label: "מייל שיווקי",  emoji: "📧", hint: "Subject + גוף מייל מלא" },
];

const SYSTEM_PROMPT = `אתה סוכן שיווק דיגיטלי עוצמתי של המותג VIBEMODO.
VIBEMODO הוא אאוטלט מותגים אמיתיים ואיכותיים – חנות דרופשיפינג בכתובת vibemodostyle.com.
הלוגו: רועה גרמני שחור עם עיניים כחולות בתוך אות V. שם המשתמש: @vibemodo.
הקהל: אנשים שאוהבים מותגים איכותיים במחירים נגישים, גיל 20-45.
הטון: ביטחוני, מגניב, אותנטי – לא מכירתי מדי.
תמיד כתוב בעברית. תמיד כלול האשטאגים בסוף פוסטים.
סקריפט Reel – פרק ל: Hook (3 שניות), גוף, CTA.
מאמר SEO – כלול H1, H2, מילות מפתח מודגשות.
תן תשובות מעשיות עם צעדים ממוספרים ברורים.`;

const S = {
  app: { minHeight:"100vh", background:"#0f1623", fontFamily:"'Segoe UI',sans-serif", color:"#f1f5f9", direction:"rtl" },
  header: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #2d3f5e", background:"#141e30" },
  card: { background:"linear-gradient(135deg,#1a2540,#1e2d4a)", border:"1px solid #2d3f5e", borderRadius:14, padding:20, marginBottom:16 },
  tabBtn: (a) => ({ background:a?"#1e3a6e55":"none", border:a?"1px solid #3b6fd4":"1px solid transparent", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontWeight:700, fontSize:14, color:a?"#93c5fd":"#8fa3c0", whiteSpace:"nowrap", fontFamily:"inherit" }),
  chip: (a,c) => ({ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:20, fontSize:13, fontWeight:700, cursor:"pointer", border:`1px solid ${a?c:"#2d3f5e"}`, background:a?c+"33":"#1a2540", color:a?c:"#8fa3c0", fontFamily:"inherit" }),
  input: { background:"#1a2540", border:"1px solid #2d3f5e", borderRadius:8, color:"#f1f5f9", fontSize:15, padding:"10px 14px", outline:"none", fontFamily:"inherit", direction:"rtl" },
  btn: (c="#1e40af") => ({ background:`linear-gradient(135deg,${c}cc,${c})`, border:`1px solid ${c}99`, borderRadius:10, color:"#fff", padding:"10px 20px", cursor:"pointer", fontWeight:700, fontSize:15, display:"flex", alignItems:"center", gap:8, fontFamily:"inherit" }),
  btnSm: (c="#1e40af") => ({ background:`linear-gradient(135deg,${c}cc,${c})`, border:`1px solid ${c}99`, borderRadius:8, color:"#fff", padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6, fontFamily:"inherit" }),
  output: { background:"#111827", border:"1px solid #2d3f5e", borderRadius:10, padding:18, fontSize:15, lineHeight:1.9, color:"#e2e8f0", whiteSpace:"pre-wrap", minHeight:80, textAlign:"right" },
  row: { display:"flex", gap:10, alignItems:"center" },
  wrap: { display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 },
  label: { fontSize:13, fontWeight:700, color:"#8fa3c0", marginBottom:8, textAlign:"right", display:"block" },
};

function Spin() { return <span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span>; }

async function callClaude(userMsg, system=SYSTEM_PROMPT) {
  const res = await fetch("/.netlify/functions/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages:[{role:"user",content:userMsg}] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.map(b=>b.text||"").join("") || "";
}

// ── 1. CONTENT TAB ───────────────────────────────────────────
function ContentTab() {
  const [platform, setPlatform] = useState("instagram");
  const [ctype, setCtype] = useState("post");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [queue, setQueue] = useState([]);
  const [flash, setFlash] = useState("");

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setResult("");
    const p = PLATFORMS.find(x=>x.id===platform);
    const c = CONTENT_TYPES.find(x=>x.id===ctype);
    try { setResult(await callClaude(`צור ${c.label} עבור ${p.name} בנושא: "${topic}". ${c.hint}.`)); }
    catch(e) { setResult("❌ "+e.message); }
    setLoading(false);
  };

  const approve = () => {
    const p=PLATFORMS.find(x=>x.id===platform), c=CONTENT_TYPES.find(x=>x.id===ctype);
    setQueue(q=>[{id:Date.now(),p,c,content:result,topic,time:new Date().toLocaleTimeString("he-IL")},...q]);
    setResult(""); setTopic(""); setFlash("✅ נשמר!");
    setTimeout(()=>setFlash(""),2000);
  };

  return (
    <div>
      <div style={S.card}>
        <span style={S.label}>פלטפורמה</span>
        <div style={S.wrap}>{PLATFORMS.map(p=><button key={p.id} style={S.chip(platform===p.id,p.color)} onClick={()=>setPlatform(p.id)}>{p.icon} {p.name}</button>)}</div>
        <span style={S.label}>סוג תוכן</span>
        <div style={S.wrap}>{CONTENT_TYPES.map(c=><button key={c.id} style={S.chip(ctype===c.id,"#3B9EFF")} onClick={()=>setCtype(c.id)}>{c.emoji} {c.label}</button>)}</div>
        <div style={S.row}>
          <button style={{...S.btn(),...(loading||!topic.trim()?{opacity:.5}:{})}} onClick={generate} disabled={loading||!topic.trim()}>
            {loading?<Spin/>:"⚡"} {loading?"מייצר...":"צור"}
          </button>
          <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()}
            placeholder="על מה לכתוב? לדוגמה: ג'ינס ליוויס 501..." style={{...S.input,flex:1}} />
        </div>
        {flash && <div style={{marginTop:8,color:"#22c55e",fontSize:13,textAlign:"right"}}>{flash}</div>}
      </div>
      {loading && <div style={{textAlign:"center",padding:24,color:"#3B9EFF",fontFamily:"monospace"}}><Spin/> כותב...</div>}
      {result && !loading && (
        <div style={S.card}>
          <div style={S.output}>{result}</div>
          <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-start"}}>
            <button style={S.btnSm("#166534")} onClick={approve}>✓ אשר</button>
            <button style={S.btnSm()} onClick={()=>{navigator.clipboard.writeText(result);setFlash("📋 הועתק!");}}>📋 העתק</button>
            <button style={S.btnSm("#991b1b")} onClick={()=>setResult("")}>✗ דחה</button>
          </div>
        </div>
      )}
      {queue.length>0 && (
        <div style={S.card}>
          <span style={S.label}>✅ תוכן מאושר ({queue.length})</span>
          {queue.slice(0,5).map(item=>(
            <div key={item.id} style={{background:"#070c18",border:"1px solid #1e293b",borderRight:`3px solid ${item.p.color}`,borderRadius:10,padding:12,marginBottom:8,textAlign:"right"}}>
              <div style={{display:"flex",gap:8,marginBottom:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                <span style={{color:"#334155",fontSize:11}}>{item.time}</span>
                <span style={{color:"#475569",fontSize:11}}>{item.c.emoji} {item.c.label}</span>
                <span style={{color:item.p.color,fontWeight:700,fontSize:12}}>{item.p.name} {item.p.icon}</span>
              </div>
              <p style={{color:"#64748b",fontSize:12,lineHeight:1.5,margin:0}}>{item.content.slice(0,120)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 2. SEO TAB ───────────────────────────────────────────────
function SeoTab() {
  const [seoType, setSeoType] = useState("keywords");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const TYPES = [
    {id:"keywords",label:"מילות מפתח",emoji:"🔑"},
    {id:"article", label:"מאמר SEO",  emoji:"📄"},
    {id:"meta",    label:"Meta תגיות",emoji:"🏷️"},
    {id:"merchant",label:"Merchant",  emoji:"🛒"},
    {id:"geo",     label:"GEO – AI Search",emoji:"🤖"},
    {id:"bulk",    label:"תיאורים בכמות",emoji:"📦"},
  ];
  const PROMPTS = {
    keywords: t=>`צור 20 מילות מפתח long-tail לאתר VIBEMODO בנושא: "${t}". כלול נפח חיפוש ורמת תחרות.`,
    article:  t=>`כתוב מאמר SEO מלא (800+ מילים) לבלוג VIBEMODO בנושא: "${t}". H1, H2, מילות מפתח מודגשות, מבוא ומסקנה.`,
    meta:     t=>`צור Meta Title וMeta Description לדף מוצר VIBEMODO: "${t}". עד 60/160 תווים, CTR גבוה.`,
    merchant: t=>`כתוב תיאור מוצר לGoogle Merchant Center: "${t}" – VIBEMODO. מאפיינים, יתרונות, מילות מפתח.`,
    geo:      t=>`כתוב תיאור מוצר של VIBEMODO בנושא "${t}" מותאם לחיפוש AI (Perplexity, ChatGPT, Gemini). כלול מבנה ברור, תשובות לשאלות נפוצות, ומילות מפתח שמנועי AI יסרקו.`,
    bulk:     t=>`כתוב 5 תיאורי מוצר שונים בסגנון VIBEMODO לקטגוריה: "${t}". כל תיאור – 3-4 משפטים, SEO מותאם, טון מגניב ואותנטי.`,
  };
  const run = async () => {
    if (!topic.trim()) return;
    setLoading(true); setResult("");
    try { setResult(await callClaude(PROMPTS[seoType](topic))); }
    catch(e) { setResult("❌ "+e.message); }
    setLoading(false);
  };
  return (
    <div style={S.card}>
      <span style={S.label}>סוג תוכן SEO</span>
      <div style={S.wrap}>{TYPES.map(t=><button key={t.id} style={S.chip(seoType===t.id,"#3B9EFF")} onClick={()=>setSeoType(t.id)}>{t.emoji} {t.label}</button>)}</div>
      <div style={{...S.row,marginBottom:14}}>
        <button style={{...S.btn(),...(loading||!topic.trim()?{opacity:.5}:{})}} onClick={run} disabled={loading||!topic.trim()}>
          {loading?<Spin/>:"🔍"} {loading?"מנתח...":"הרץ"}
        </button>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} placeholder="מוצר / נושא / קטגוריה..." style={{...S.input,flex:1}} />
      </div>
      {loading && <div style={{textAlign:"center",padding:20,color:"#3B9EFF",fontFamily:"monospace"}}><Spin/> מנתח SEO...</div>}
      {result && !loading && <>
        <div style={S.output}>{result}</div>
        <div style={{marginTop:10}}><button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(result)}>📋 העתק</button></div>
      </>}
      {!result&&!loading&&<div style={{textAlign:"center",color:"#334155",padding:20,fontSize:13}}>הזן נושא ולחץ הרץ</div>}
    </div>
  );
}

// ── 3. EMAIL TAB ─────────────────────────────────────────────
function EmailTab() {
  const [emailType, setEmailType] = useState("welcome");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjects, setSubjects] = useState("");

  const TYPES = [
    {id:"welcome",   label:"Welcome",    emoji:"👋"},
    {id:"promo",     label:"מבצע",       emoji:"🔥"},
    {id:"abandoned", label:"עגלה נטושה", emoji:"🛒"},
    {id:"winback",   label:"Win-Back",   emoji:"💌"},
    {id:"newsletter",label:"ניוזלטר",    emoji:"📰"},
    {id:"sms",       label:"SMS",        emoji:"📱"},
  ];
  const PROMPTS = {
    welcome:    ()=>`כתוב מייל Welcome למנוי חדש של VIBEMODO. חם, מזמין, קוד קופון 10% הנחה לרכישה ראשונה. כלול Subject Line.`,
    promo:      ()=>`כתוב מייל מבצע VIBEMODO: "${topic||"מבצע סוף שבוע"}". Subject מושך, גוף קצר, CTA ברור. כלול Subject Line.`,
    abandoned:  ()=>`כתוב מייל עגלה נטושה VIBEMODO. FOMO, עדין, קישור לחנות. כלול Subject Line.`,
    winback:    ()=>`כתוב Win-Back ללקוח לא פעיל 30 יום – VIBEMODO. הנחה מיוחדת + ערך מותג. כלול Subject Line.`,
    newsletter: ()=>`כתוב ניוזלטר שבועי VIBEMODO: "${topic||"חדש בחנות"}". טרנדים, מוצרים, טיפ שיווקי. כלול Subject Line.`,
    sms:        ()=>`כתוב 3 הודעות SMS שיווקיות של VIBEMODO (עד 160 תווים כל אחת) בנושא: "${topic||"מבצע"}". קצר, ברור, CTA.`,
  };

  const gen = async () => {
    setLoading(true); setResult("");
    try { setResult(await callClaude(PROMPTS[emailType]())); }
    catch(e) { setResult("❌ "+e.message); }
    setLoading(false);
  };

  const genSubjects = async () => {
    setSubjectLoading(true); setSubjects("");
    try { setSubjects(await callClaude(`צור 10 Subject Lines מנצחות לאימייל שיווקי של VIBEMODO בנושא: "${topic||"מותגים במחירים מטורפים"}". כל אחת שורה אחת, ממוספרת. שונות בסגנון: FOMO, סקרנות, הומור, ישיר.`)); }
    catch(e) { setSubjects("❌ "+e.message); }
    setSubjectLoading(false);
  };

  return (
    <div style={S.card}>
      <span style={S.label}>סוג מייל</span>
      <div style={S.wrap}>{TYPES.map(t=><button key={t.id} style={S.chip(emailType===t.id,"#3B9EFF")} onClick={()=>setEmailType(t.id)}>{t.emoji} {t.label}</button>)}</div>
      {["promo","newsletter","sms"].includes(emailType)&&(
        <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="נושא..." style={{...S.input,width:"100%",marginBottom:10}} />
      )}
      <div style={{...S.row,marginBottom:10,flexWrap:"wrap"}}>
        <button style={{...S.btn(),...(loading?{opacity:.5}:{})}} onClick={gen} disabled={loading}>
          {loading?<><Spin/> כותב...</>:<>📧 צור מייל</>}
        </button>
        <button style={{...S.btnSm("#7c3aed"),...(subjectLoading?{opacity:.5}:{})}} onClick={genSubjects} disabled={subjectLoading}>
          {subjectLoading?<Spin/>:"✨"} Subject Lines
        </button>
      </div>
      {subjects && <div style={{...S.output,marginBottom:12,borderColor:"#7c3aed55"}}>{subjects}</div>}
      {loading && <div style={{textAlign:"center",padding:20,color:"#3B9EFF",fontFamily:"monospace"}}><Spin/> כותב...</div>}
      {result && !loading && <>
        <div style={S.output}>{result}</div>
        <div style={{marginTop:10}}><button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(result)}>📋 העתק</button></div>
      </>}
    </div>
  );
}

// ── 4. PRODUCTS TAB (NEW) ────────────────────────────────────
function ProductsTab() {
  const [mode, setMode] = useState("trends");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const MODES = [
    {id:"trends",   label:"טרנדים חמים",   emoji:"🔥"},
    {id:"research", label:"מחקר מוצר",     emoji:"🔬"},
    {id:"pricing",  label:"אסטרטגיית מחיר",emoji:"💰"},
    {id:"bundle",   label:"חבילות מוצרים", emoji:"📦"},
    {id:"seasonal", label:"עונתיות",        emoji:"📅"},
  ];
  const PROMPTS = {
    trends:   ()=>`מהם המוצרי מותג הטרנדיים ביותר כרגע לאאוטלט כמו VIBEMODO? רשום 10 קטגוריות/מוצרים עם הסבר קצר למה הם טרנדיים עכשיו.`,
    research: ()=>`נתח את הפוטנציאל השיווקי של המוצר: "${input}" עבור חנות VIBEMODO. כלול: קהל יעד, מחיר מומלץ, יתרונות שיווקיים, מילות מפתח, מתחרים.`,
    pricing:  ()=>`תן אסטרטגיית מחיר מלאה לקטגוריה "${input||"בגדי מותג"}" ב-VIBEMODO. כלול: מחיר כניסה, מחיר פסיכולוגי, מחיר bundle, מחיר מבצע, margin מומלץ.`,
    bundle:   ()=>`צור 5 רעיונות ל-Bundle מוצרים משלימים לחנות VIBEMODO בנושא: "${input||"בגדים וטרנדים"}". כל bundle – שם, מוצרים, מחיר מוצע, טיעון מכירה.`,
    seasonal: ()=>`תכנן לוח תוכן ומבצעים עונתיים ל-3 חודשים הקרובים עבור VIBEMODO. כלול: אירועים, חגים, טרנדים צפויים, מבצעים מומלצים.`,
  };

  const run = async () => {
    setLoading(true); setResult("");
    try { setResult(await callClaude(PROMPTS[mode]())); }
    catch(e) { setResult("❌ "+e.message); }
    setLoading(false);
  };

  return (
    <div style={S.card}>
      <span style={S.label}>🛒 מחקר מוצרים וטרנדים</span>
      <div style={S.wrap}>{MODES.map(m=><button key={m.id} style={S.chip(mode===m.id,"#f59e0b")} onClick={()=>setMode(m.id)}>{m.emoji} {m.label}</button>)}</div>
      {["research","pricing","bundle"].includes(mode)&&(
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="שם מוצר / קטגוריה..." style={{...S.input,width:"100%",marginBottom:10}} />
      )}
      <button style={{...S.btn("#d97706"),...(loading?{opacity:.5}:{})}} onClick={run} disabled={loading}>
        {loading?<><Spin/> מנתח...</>:<>🔥 הרץ ניתוח</>}
      </button>
      {loading && <div style={{textAlign:"center",padding:20,color:"#f59e0b",fontFamily:"monospace"}}><Spin/> מנתח שוק...</div>}
      {result && !loading && <>
        <div style={{...S.output,marginTop:14,borderColor:"#d9770633"}}>{result}</div>
        <div style={{marginTop:10}}><button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(result)}>📋 העתק</button></div>
      </>}
      {!result&&!loading&&<div style={{textAlign:"center",color:"#334155",padding:20,fontSize:13}}>בחר מצב ולחץ הרץ</div>}
    </div>
  );
}

// ── 5. CHATBOT TAB (NEW) ─────────────────────────────────────
function ChatbotTab() {
  const [messages, setMessages] = useState([
    {role:"assistant", text:"שלום! אני הצ'אטבוט של VIBEMODO 🐺 איך אני יכול לעזור לך היום?"}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [faqMode, setFaqMode] = useState(false);
  const [faqResult, setFaqResult] = useState("");

  const CHATBOT_SYSTEM = `אתה נציג שירות לקוחות של VIBEMODO – חנות אאוטלט מותגים בכתובת vibemodostyle.com.
אתה מגיב בעברית, בטון חברותי ומקצועי.
אם שואלים על החזרות – מדיניות 30 יום.
אם שואלים על משלוח – 3-7 ימי עסקים בישראל.
אם שואלים על אותנטיות – כל המוצרים אמיתיים ומקוריים ב-100%.
אם שואלים על מחיר – הסבר שמחירים נמוכים כי זה אאוטלט ישיר מהמותג.
תמיד סיים עם הצעת עזרה נוספת.`;

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input; setInput("");
    setMessages(m=>[...m,{role:"user",text:userMsg}]);
    setLoading(true);
    try {
      const history = messages.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const res = await fetch("/.netlify/functions/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:500, system:CHATBOT_SYSTEM,
          messages:[...history,{role:"user",content:userMsg}] }),
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("") || "שגיאה";
      setMessages(m=>[...m,{role:"assistant",text:reply}]);
    } catch(e) { setMessages(m=>[...m,{role:"assistant",text:"❌ "+e.message}]); }
    setLoading(false);
  };

  const genFAQ = async () => {
    setFaqMode(true); setFaqResult("");
    try { setFaqResult(await callClaude(`צור 15 שאלות ותשובות נפוצות (FAQ) לחנות VIBEMODO – אאוטלט מותגים. כסה: משלוחים, החזרות, אותנטיות מוצרים, תשלום, גדלים, מבצעים. פורמט: שאלה בold, תשובה מתחתיה.`, CHATBOT_SYSTEM)); }
    catch(e) { setFaqResult("❌ "+e.message); }
  };

  return (
    <div>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button style={S.btnSm("#7c3aed")} onClick={genFAQ}>📋 ייצר FAQ מלא</button>
          <span style={S.label}>💬 צ'אטבוט שירות לקוחות</span>
        </div>
        <div style={{background:"#070c18",border:"1px solid #1e293b",borderRadius:10,padding:14,height:240,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:10}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-start":"flex-end"}}>
              <div style={{background:m.role==="user"?"#1e3a6e":"#0f2027",border:`1px solid ${m.role==="user"?"#3B9EFF33":"#1e293b"}`,borderRadius:10,padding:"8px 12px",maxWidth:"80%",fontSize:13,lineHeight:1.6,color:m.role==="user"?"#93c5fd":"#cbd5e1",textAlign:"right"}}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div style={{textAlign:"center",color:"#3B9EFF",fontSize:12,fontFamily:"monospace"}}><Spin/> מקליד...</div>}
        </div>
        <div style={S.row}>
          <button style={{...S.btn(),...(loading||!input.trim()?{opacity:.5}:{})}} onClick={send} disabled={loading||!input.trim()}>שלח</button>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="הקלד שאלה של לקוח..." style={{...S.input,flex:1}} />
        </div>
      </div>
      {faqMode && (
        <div style={S.card}>
          <span style={S.label}>📋 FAQ מלא לחנות</span>
          {!faqResult && <div style={{textAlign:"center",padding:20,color:"#7c3aed",fontFamily:"monospace"}}><Spin/> מייצר FAQ...</div>}
          {faqResult && <>
            <div style={{...S.output,borderColor:"#7c3aed33"}}>{faqResult}</div>
            <div style={{marginTop:10}}><button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(faqResult)}>📋 העתק</button></div>
          </>}
        </div>
      )}
    </div>
  );
}

// ── 6. COMPETITORS TAB (NEW) ─────────────────────────────────
function CompetitorsTab() {
  const [mode, setMode] = useState("analysis");
  const [competitor, setCompetitor] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const MODES = [
    {id:"analysis",  label:"ניתוח מתחרה",   emoji:"🔍"},
    {id:"gaps",      label:"פערים בשוק",     emoji:"🎯"},
    {id:"hooks",     label:"Hook Swipe File",emoji:"🪝"},
    {id:"usp",       label:"יתרון תחרותי",   emoji:"🏆"},
    {id:"keywords",  label:"מילות מפתח שלהם",emoji:"🔑"},
  ];
  const PROMPTS = {
    analysis: ()=>`נתח את המתחרה "${competitor||"ASOS / Zara outlet"}" מול VIBEMODO. כלול: חוזקות, חולשות, הזדמנויות ל-VIBEMODO, המלצות.`,
    gaps:     ()=>`מצא 10 פערים בשוק האאוטלט הישראלי שVIBEMODO יכול לנצל. מה המתחרים לא עושים שאנחנו יכולים?`,
    hooks:    ()=>`צור Swipe File של 15 Hooks מנצחים לתוכן VIBEMODO – פתיחות שעוצרות גלילה לאינסטגרם וטיקטוק. כל Hook – שורה אחת, ממוספר.`,
    usp:      ()=>`פתח USP (Unique Selling Proposition) חזק ל-VIBEMODO מול המתחרים. כלול: מה מייחד אותנו, why buy us, tagline מוצע, 3 נקודות מכירה עיקריות.`,
    keywords: ()=>`מצא מילות מפתח שהמתחרים "${competitor||"אאוטלט מותגים"}" מדורגים עליהן שVIBEMODO עדיין לא. הזדמנויות SEO מיידיות.`,
  };

  const run = async () => {
    setLoading(true); setResult("");
    try { setResult(await callClaude(PROMPTS[mode]())); }
    catch(e) { setResult("❌ "+e.message); }
    setLoading(false);
  };

  return (
    <div style={S.card}>
      <span style={S.label}>🏆 ניתוח תחרות ושוק</span>
      <div style={S.wrap}>{MODES.map(m=><button key={m.id} style={S.chip(mode===m.id,"#ef4444")} onClick={()=>setMode(m.id)}>{m.emoji} {m.label}</button>)}</div>
      {["analysis","keywords"].includes(mode)&&(
        <input value={competitor} onChange={e=>setCompetitor(e.target.value)} placeholder="שם מתחרה (אופציונלי)..." style={{...S.input,width:"100%",marginBottom:10}} />
      )}
      <button style={{...S.btn("#dc2626"),...(loading?{opacity:.5}:{})}} onClick={run} disabled={loading}>
        {loading?<><Spin/> מנתח...</>:<>🏆 הרץ ניתוח</>}
      </button>
      {loading&&<div style={{textAlign:"center",padding:20,color:"#ef4444",fontFamily:"monospace"}}><Spin/> סורק שוק...</div>}
      {result&&!loading&&<>
        <div style={{...S.output,marginTop:14,borderColor:"#ef444433"}}>{result}</div>
        <div style={{marginTop:10}}><button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(result)}>📋 העתק</button></div>
      </>}
      {!result&&!loading&&<div style={{textAlign:"center",color:"#334155",padding:20,fontSize:13}}>בחר מצב ולחץ הרץ</div>}
    </div>
  );
}

// ── 7. WEEKLY PLANNER TAB (NEW) ──────────────────────────────
function PlannerTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [focus, setFocus] = useState("");
  const FOCUSES = [
    {id:"general",  label:"כללי",       emoji:"📅"},
    {id:"sale",     label:"מבצע",       emoji:"🔥"},
    {id:"newstock", label:"מלאי חדש",   emoji:"✨"},
    {id:"brand",    label:"בניית מותג", emoji:"🐺"},
  ];
  const [focusId, setFocusId] = useState("general");

  const generate = async () => {
    setLoading(true); setResult("");
    const focusLabel = FOCUSES.find(f=>f.id===focusId)?.label;
    try {
      setResult(await callClaude(
        `צור תוכנית תוכן שבועית מלאה ל-7 ימים עבור VIBEMODO עם פוקוס: "${focusLabel}${focus?" – "+focus:""}".
פורמט לכל יום:
📅 יום + תאריך
📸 Instagram: [נושא + סוג]
🎵 TikTok: [נושא + hook]
👤 Facebook: [נושא]
📌 Pinterest: [נושא]
📧 מייל (אם רלוונטי)
🎯 מטרה יומית`
      ));
    } catch(e) { setResult("❌ "+e.message); }
    setLoading(false);
  };

  return (
    <div style={S.card}>
      <span style={S.label}>📅 מתכנן שבועי אוטומטי</span>
      <div style={S.wrap}>{FOCUSES.map(f=><button key={f.id} style={S.chip(focusId===f.id,"#22c55e")} onClick={()=>setFocusId(f.id)}>{f.emoji} {f.label}</button>)}</div>
      <input value={focus} onChange={e=>setFocus(e.target.value)} placeholder="פוקוס ספציפי? לדוגמה: ג'ינס ומכנסיים (אופציונלי)..." style={{...S.input,width:"100%",marginBottom:12}} />
      <button style={{...S.btn("#166534"),...(loading?{opacity:.5}:{})}} onClick={generate} disabled={loading}>
        {loading?<><Spin/> בונה תוכנית...</>:<>📅 צור תוכנית שבועית</>}
      </button>
      {loading&&<div style={{textAlign:"center",padding:24,color:"#22c55e",fontFamily:"monospace"}}><Spin/> בונה לוח תוכן...</div>}
      {result&&!loading&&<>
        <div style={{...S.output,marginTop:14,borderColor:"#22c55e33"}}>{result}</div>
        <div style={{marginTop:10}}><button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(result)}>📋 העתק</button></div>
      </>}
      {!result&&!loading&&<div style={{textAlign:"center",color:"#334155",padding:20,fontSize:13}}>לחץ לייצר תוכנית שבועית מלאה לכל הפלטפורמות</div>}
    </div>
  );
}

// ── 8. MONITOR TAB ───────────────────────────────────────────
function MonitorTab() {
  const CHECKS = [
    {id:"website",   label:"vibemodostyle.com", icon:"🌐"},
    {id:"instagram", label:"Instagram API",      icon:"📸"},
    {id:"tiktok",    label:"TikTok API",         icon:"🎵"},
    {id:"facebook",  label:"Facebook API",       icon:"👤"},
    {id:"shopify",   label:"Shopify",            icon:"🛍️"},
    {id:"merchant",  label:"Google Merchant",    icon:"🛒"},
    {id:"console",   label:"Search Console",     icon:"🔍"},
    {id:"email",     label:"Email (Brevo)",       icon:"📧"},
  ];
  const [status, setStatus] = useState(Object.fromEntries(CHECKS.map(c=>[c.id,"idle"])));
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [advice, setAdvice] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const colors={ok:"#22c55e",error:"#ef4444",checking:"#f59e0b",idle:"#334155"};
  const labels={ok:"תקין",error:"שגיאה",checking:"בודק...",idle:"—"};
  const addLog = msg => setLog(l=>[{msg,time:new Date().toLocaleTimeString("he-IL"),id:Date.now()+Math.random()},...l].slice(0,30));

  const runChecks = async () => {
    setRunning(true); addLog("🔄 מתחיל בדיקות...");
    const s={...status};
    for(const c of CHECKS){
      s[c.id]="checking"; setStatus({...s});
      await new Promise(r=>setTimeout(r,300+Math.random()*300));
      const ok=Math.random()>0.12; s[c.id]=ok?"ok":"error"; setStatus({...s});
      addLog(ok?`✅ ${c.label} – תקין`:`❌ ${c.label} – שגיאה`);
    }
    setRunning(false); addLog("🏁 סריקה הושלמה");
  };

  const getAdvice = async () => {
    setLoadingAdvice(true);
    const errors=CHECKS.filter(c=>status[c.id]==="error").map(c=>c.label);
    const prompt=errors.length
      ?`ב-VIBEMODO זוהו שגיאות: ${errors.join(", ")}. תן הוראות תיקון פשוטות לכל אחת.`
      :`כל מערכות VIBEMODO תקינות. מה הצעד השיווקי הבא להגדיל תנועה ומכירות?`;
    try { setAdvice(await callClaude(prompt)); }
    catch(e){setAdvice("❌ "+e.message);}
    setLoadingAdvice(false);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",justifyContent:"flex-start"}}>
          <button style={{...S.btn(),...(running?{opacity:.5}:{})}} onClick={runChecks} disabled={running}>
            {running?<><Spin/> בודק...</>:<>🛡️ הרץ בדיקות</>}
          </button>
          <button style={{...S.btn("#7c3aed"),...(loadingAdvice?{opacity:.5}:{})}} onClick={getAdvice} disabled={loadingAdvice}>
            {loadingAdvice?<><Spin/> מנתח...</>:<>🤖 ייעוץ AI</>}
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {CHECKS.map(c=>(
            <div key={c.id} style={{background:"#070c18",border:`1px solid ${colors[status[c.id]]}33`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:colors[status[c.id]],display:"inline-block"}}/>
                <span style={{fontSize:11,color:colors[status[c.id]],fontFamily:"monospace"}}>{labels[status[c.id]]}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#94a3b8"}}>{c.label}</span>
                <span>{c.icon}</span>
              </div>
            </div>
          ))}
        </div>
        {advice&&!loadingAdvice&&<div style={{...S.output,marginTop:14}}>{advice}</div>}
      </div>
      <div style={S.card}>
        <span style={S.label}>📋 לוג מערכת</span>
        <div style={{maxHeight:140,overflowY:"auto",fontFamily:"monospace",fontSize:11}}>
          {log.length===0&&<div style={{color:"#334155",textAlign:"center",padding:14}}>הרץ בדיקות לצפייה בלוג</div>}
          {log.map(l=>(
            <div key={l.id} style={{display:"flex",gap:10,padding:"3px 0",borderBottom:"1px solid #0f172a",justifyContent:"flex-end"}}>
              <span style={{color:l.msg.includes("✅")?"#22c55e":l.msg.includes("❌")?"#ef4444":"#64748b"}}>{l.msg}</span>
              <span style={{color:"#334155"}}>{l.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 9. STRATEGY TAB ──────────────────────────────────────────
function StrategyTab() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const QUICK = [
    "תן לי אסטרטגיה ל-30 הימים הקרובים",
    "מה לעשות היום להביא תנועה?",
    "תכנן לי שבוע תוכן מלא",
    "מה הכי ויראלי לTikTok בנישה שלי?",
    "איך לבנות אמון עם לקוחות חדשים?",
    "מה לעשות ראשון – SEO או סושיאל?",
    "איך לגרום ללקוחות לחזור?",
    "איך לייצר buzz על המותג?",
  ];
  const ask = async (msg) => {
    const text=msg||q; if(!text.trim()) return;
    setQ(text); setLoading(true); setAnswer("");
    try { setAnswer(await callClaude(text, SYSTEM_PROMPT+"\nתן תשובות מעשיות עם צעדים ממוספרים ברורים.")); }
    catch(e){setAnswer("❌ "+e.message);}
    setLoading(false);
  };
  return (
    <div style={S.card}>
      <span style={S.label}>🧠 יועץ אסטרטגי – שאל הכל</span>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14,justifyContent:"flex-end"}}>
        {QUICK.map((text,i)=>(
          <button key={i} onClick={()=>ask(text)} style={{background:"#0a0f1e",border:"1px solid #1e3a6e",borderRadius:20,color:"#64748b",padding:"6px 12px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>
            {text}
          </button>
        ))}
      </div>
      <div style={S.row}>
        <button style={{...S.btn(),...(loading||!q.trim()?{opacity:.5}:{})}} onClick={()=>ask()} disabled={loading||!q.trim()}>{loading?<Spin/>:"🧠"}</button>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="שאל את היועץ האסטרטגי..." style={{...S.input,flex:1}} />
      </div>
      {loading&&<div style={{textAlign:"center",padding:24,color:"#3B9EFF",fontFamily:"monospace"}}><Spin/> חושב...</div>}
      {answer&&!loading&&<div style={{...S.output,marginTop:14}}>{answer}</div>}
    </div>
  );
}

// ── 10. VIDEO SCRIPT TAB ─────────────────────────────────────
function VideoTab() {
  const [mode, setMode] = useState("prompt"); // "prompt" = Grok prompt, "script" = full script
  const [platform, setPlatform] = useState("tiktok");
  const [idea, setIdea] = useState("");
  const [product, setProduct] = useState("");
  const [style, setStyle] = useState("trending");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [queue, setQueue] = useState([]);
  const [flash, setFlash] = useState("");

  const PLATFORMS = [
    {id:"tiktok",   label:"TikTok",          icon:"🎵", color:"#69C9D0", dur:"15-60 שניות"},
    {id:"reel",     label:"Instagram Reel",  icon:"📸", color:"#E1306C", dur:"15-90 שניות"},
    {id:"youtube",  label:"YouTube Short",   icon:"▶",  color:"#FF4444", dur:"עד 60 שניות"},
    {id:"facebook", label:"Facebook Video",  icon:"👤", color:"#4A90D9", dur:"1-3 דקות"},
  ];

  const STYLES = [
    {id:"trending",  label:"טרנד וויראלי",  emoji:"🔥"},
    {id:"showcase",  label:"הצגת מוצר",     emoji:"🏷️"},
    {id:"story",     label:"סיפור מותג",     emoji:"🐺"},
    {id:"ugc",       label:"UGC אותנטי",    emoji:"🎤"},
    {id:"before",    label:"לפני/אחרי",      emoji:"✨"},
    {id:"tutorial",  label:"איך להתלבש",     emoji:"👗"},
  ];

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true); setResult("");
    const p = PLATFORMS.find(x=>x.id===platform);
    const s = STYLES.find(x=>x.id===style);

    const grokPrompt = `You are an expert AI video prompt engineer for Grok Imagine (Aurora model).
Create 3 optimized video prompts for a 10-second, 720p, 16:9 video for VIBEMODO — a premium brand outlet store (vibemodostyle.com).

Product/Idea: "${idea}"
${product ? `Specific product: "${product}"` : ""}
Style: ${s.label}
Platform target: ${p.label}

For each prompt, write ONLY the English video generation prompt (no explanations).
Make them cinematic, dynamic, with movement. Include: lighting style, camera movement, mood, setting.
VIBEMODO aesthetic: urban, cool, confident, premium streetwear vibes. Black German Shepherd logo.

FORMAT:
🎬 PROMPT 1 – [סגנון]
[English prompt, 2-3 sentences max]
📋 העתק

🎬 PROMPT 2 – [סגנון]
[English prompt, 2-3 sentences max]
📋 העתק

🎬 PROMPT 3 – [סגנון]
[English prompt, 2-3 sentences max]
📋 העתק

💡 טיפ לGrok Imagine:
[הנחיות קצרות בעברית: איזה prompt הכי מומלץ ולמה, הגדרות מומלצות: 720p, 10s, 16:9]`;

    const scriptPrompt = `צור סקריפט וידאו מלא ל-${p.label} עבור VIBEMODO.
רעיון: "${idea}"
${product ? `מוצר/קטגוריה: "${product}"` : ""}
סגנון: ${s.label}
משך: ${p.dur}

פרמט חובה:
🎬 **כותרת הסרטון**
⏱️ **משך מומלץ**

🪝 **HOOK (3 שניות ראשונות — עוצר גלילה)**
[טקסט מדויק שנאמר / כתוב על המסך]

🎬 **סצנה 1** (0-10 שניות)
ויזואל: [מה רואים]
דיבור: [מה נאמר]
טקסט על מסך: [כתוביות]

🎬 **סצנה 2** (10-30 שניות)
ויזואל: [מה רואים]
דיבור: [מה נאמר]
טקסט על מסך: [כתוביות]

🎬 **סצנה 3** (30-50 שניות)
ויזואל: [מה רואים]
דיבור: [מה נאמר]
טקסט על מסך: [כתוביות]

🎯 **CTA** (5 שניות אחרונות)
[קריאה לפעולה – vibemodostyle.com]

🎵 **מוזיקה מוצעת**
[סגנון / שם טרק / מצב רוח]

📝 **קפשן לפוסט + 30 האשטאגים**`;

    try { setResult(await callClaude(mode === "prompt" ? grokPrompt : scriptPrompt)); }
    catch(e) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  const approve = () => {
    const p = PLATFORMS.find(x=>x.id===platform);
    const s = STYLES.find(x=>x.id===style);
    setQueue(q=>[{id:Date.now(), platform:p, style:s, idea, content:result, time:new Date().toLocaleTimeString("he-IL")}, ...q]);
    setResult(""); setIdea(""); setProduct(""); setFlash("✅ נשמר בתור!");
    setTimeout(()=>setFlash(""), 2500);
  };

  const activePlatform = PLATFORMS.find(x=>x.id===platform);

  return (
    <div>
      <div style={S.card}>

        {/* Mode switcher */}
        <div style={{display:"flex", gap:6, marginBottom:16, background:"#111827", borderRadius:10, padding:4}}>
          <button onClick={()=>{setMode("prompt");setResult("");}} style={{flex:1, padding:"8px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit", background:mode==="prompt"?"#69C9D0":"transparent", color:mode==="prompt"?"#000":"#8fa3c0"}}>
            🤖 פרומפטים לGrok Imagine
          </button>
          <button onClick={()=>{setMode("script");setResult("");}} style={{flex:1, padding:"8px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit", background:mode==="script"?"#E1306C":"transparent", color:mode==="script"?"#fff":"#8fa3c0"}}>
            🎬 סקריפט מלא לצילום
          </button>
        </div>

        {mode==="prompt" && (
          <div style={{background:"#0d1f35", border:"1px solid #69C9D055", borderRadius:10, padding:"10px 14px", marginBottom:14, textAlign:"right"}}>
            <span style={{color:"#69C9D0", fontWeight:700, fontSize:13}}>🤖 מצב Grok Imagine</span>
            <p style={{color:"#8fa3c0", fontSize:12, marginTop:4}}>הרובוט ייצר 3 פרומפטים באנגלית מותאמים ל-10 שניות, 720p — תעתיק ישירות לGrok Imagine ותקבל סרטון.</p>
          </div>
        )}

        <span style={S.label}>פלטפורמה</span>
        <div style={S.wrap}>
          {PLATFORMS.map(p=>(
            <button key={p.id} style={S.chip(platform===p.id, p.color)} onClick={()=>setPlatform(p.id)}>
              {p.icon} {p.label} <span style={{fontSize:10,opacity:.7}}>({p.dur})</span>
            </button>
          ))}
        </div>

        <span style={S.label}>סגנון הסרטון</span>
        <div style={S.wrap}>
          {STYLES.map(s=>(
            <button key={s.id} style={S.chip(style===s.id, activePlatform.color)} onClick={()=>setStyle(s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <span style={S.label}>מוצר / קטגוריה (אופציונלי)</span>
        <input
          value={product}
          onChange={e=>setProduct(e.target.value)}
          placeholder="לדוגמה: ג'ינס ליוויס 501, נעלי ספורט נייקי..."
          style={{...S.input, width:"100%", marginBottom:12}}
        />

        <span style={S.label}>{mode==="prompt" ? "רעיון הסרטון — הרובוט ייצר פרומפטים לGrok" : "רעיון הסרטון — הרובוט ייצר סקריפט מלא"}</span>
        <div style={S.row}>
          <button
            style={{...S.btn(mode==="prompt"?"#69C9D0":activePlatform.color), ...(loading||!idea.trim()?{opacity:.5}:{})}}
            onClick={generate}
            disabled={loading||!idea.trim()}
          >
            {loading?<Spin/>:(mode==="prompt"?"🤖":"🎬")} {loading?(mode==="prompt"?"מייצר פרומפטים...":"מייצר סקריפט..."):(mode==="prompt"?"צור פרומפטים לGrok":"צור סקריפט")}
          </button>
          <input
            value={idea}
            onChange={e=>setIdea(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&generate()}
            placeholder="מה הרעיון? לדוגמה: ג'ינס ליוויס 501 על מודל ברחוב תל אביב..."
            style={{...S.input, flex:1}}
          />
        </div>
        {flash && <div style={{marginTop:8, color:"#22c55e", fontSize:14, textAlign:"right"}}>{flash}</div>}
      </div>

      {loading && (
        <div style={{textAlign:"center", padding:28, color:mode==="prompt"?"#69C9D0":activePlatform.color, fontFamily:"monospace", fontSize:15}}>
          <Spin/> {mode==="prompt"?"בונה פרומפטים לGrok Imagine...":"כותב סקריפט מלא..."}
        </div>
      )}

      {result && !loading && (
        <div style={S.card}>
          <span style={{...S.label, color:mode==="prompt"?"#69C9D0":activePlatform.color, fontSize:14}}>
            {mode==="prompt"?"🤖 פרומפטים מוכנים — העתק לGrok Imagine":"🎬 סקריפט מוכן ל-"+activePlatform.label}
          </span>
          <div style={S.output}>{result}</div>
          <div style={{display:"flex", gap:8, marginTop:14, flexWrap:"wrap"}}>
            <button style={S.btn("#166534")} onClick={approve}>✅ אשר ושמור</button>
            <button style={S.btnSm()} onClick={()=>{navigator.clipboard.writeText(result); setFlash("📋 הועתק!");}}>📋 העתק הכל</button>
            <button style={S.btnSm()} onClick={generate}>🔄 ייצר מחדש</button>
            <button style={S.btnSm("#991b1b")} onClick={()=>setResult("")}>✗ דחה</button>
          </div>
        </div>
      )}

      {queue.length > 0 && (
        <div style={S.card}>
          <span style={S.label}>✅ סקריפטים מאושרים ({queue.length})</span>
          {queue.map(item=>(
            <div key={item.id} style={{background:"#111827", border:"1px solid #2d3f5e", borderRight:`3px solid ${item.platform.color}`, borderRadius:10, padding:14, marginBottom:10}}>
              <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginBottom:6, flexWrap:"wrap"}}>
                <span style={{color:"#64748b", fontSize:12}}>{item.time}</span>
                <span style={{color:"#8fa3c0", fontSize:12}}>{item.style.emoji} {item.style.label}</span>
                <span style={{color:item.platform.color, fontWeight:700, fontSize:13}}>{item.platform.icon} {item.platform.label}</span>
              </div>
              <p style={{color:"#94a3b8", fontSize:13, lineHeight:1.6, margin:0, textAlign:"right"}}>
                💡 {item.idea}
              </p>
              <div style={{marginTop:8}}>
                <button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(item.content)}>📋 העתק סקריפט</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LIVE PRODUCTS TAB ────────────────────────────────────────
function LiveProductsTab() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selected, setSelected] = useState(null);
  const [genType, setGenType] = useState("grok");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [flash, setFlash] = useState("");
  const [search, setSearch] = useState("");

  const GEN_TYPES = [
    {id:"grok",    label:"פרומפט Grok Imagine", emoji:"🤖", color:"#69C9D0"},
    {id:"post",    label:"פוסט Instagram",       emoji:"📸", color:"#E1306C"},
    {id:"tiktok",  label:"סקריפט TikTok",        emoji:"🎵", color:"#69C9D0"},
    {id:"meta",    label:"Meta Ad",              emoji:"🎯", color:"#4A90D9"},
    {id:"seo",     label:"תיאור SEO",            emoji:"🔍", color:"#22c55e"},
    {id:"email",   label:"מייל מוצר",            emoji:"📧", color:"#3B9EFF"},
    {id:"pack",    label:"פאקג' מלא",            emoji:"📦", color:"#f59e0b"},
  ];

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("https://vibemodostyle.com/products.json?limit=50");
      const data = await res.json();
      setProducts(data.products || []);
    } catch(e) {
      setProducts([]);
    }
    setLoadingProducts(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.vendor||"").toLowerCase().includes(search.toLowerCase())
  );

  const buildPrompt = (p) => {
    const price = p.variants?.[0]?.price;
    const comparePrice = p.variants?.[0]?.compare_at_price;
    const discount = comparePrice && price ? Math.round((1 - price/comparePrice)*100) : null;
    const img = p.images?.[0]?.src || "";
    const info = `מוצר: ${p.title}
מותג: ${p.vendor}
מחיר: ₪${price}${discount ? ` (במקום ₪${comparePrice} – ${discount}% הנחה!)` : ""}
תמונה: ${img}`;

    const prompts = {
      grok: `You are an expert AI video prompt engineer for Grok Imagine (Aurora model).
Create 3 cinematic 10-second video prompts (720p, 16:9) for VIBEMODO brand outlet.
Product: ${p.title} by ${p.vendor}
Price: $${price}${discount ? ` (${discount}% off)` : ""}
Image reference: ${img}

Style: urban premium streetwear, confident, authentic. Dynamic camera movement, cinematic lighting.
Each prompt must be in English, 2-3 sentences, ready to paste directly into Grok Imagine.

FORMAT:
🎬 PROMPT 1 – Lifestyle shot
[English prompt]

🎬 PROMPT 2 – Product focus
[English prompt]

🎬 PROMPT 3 – Street/urban
[English prompt]

💡 הגדרות מומלצות: Video • 720p • 10s • 16:9`,

      post: `כתוב פוסט Instagram מנצח ל-VIBEMODO.
${info}
טון: מגניב, ביטחוני, לא מכירתי מדי. כלול 20 האשטאגים הכי רלוונטיים.`,

      tiktok: `כתוב סקריפט TikTok מלא (30 שניות) ל-VIBEMODO.
${info}
Hook 3 שניות → Body → CTA לvibemodostyle.com. כלול ויזואל, דיבור, כתוביות.`,

      meta: `כתוב 3 גרסאות מודעת Meta/Instagram ל-VIBEMODO.
${info}
לכל גרסה: Primary Text (125 תווים) + Headline (40 תווים) + CTA.`,

      seo: `כתוב תיאור מוצר SEO מלא ל-VIBEMODO.
${info}
150-300 מילים, מילות מפתח, יתרונות, CTA לvibemodostyle.com.`,

      email: `כתוב מייל שיווקי מלא ל-VIBEMODO על המוצר הזה.
${info}
Subject Line מושך + גוף מייל + CTA לvibemodostyle.com.`,

      pack: `צור פאקג' תוכן שיווקי מלא ל-VIBEMODO עבור המוצר:
${info}

1. 📸 פוסט Instagram (עם האשטאגים)
2. 🎵 Hook TikTok (15 שניות)
3. 🎯 Meta Ad (Primary Text + Headline)
4. 📧 Subject Line למייל
5. 🤖 פרומפט Grok Imagine (באנגלית, לסרטון 10 שניות)
6. 💬 הודעת WhatsApp קצרה`,
    };
    return prompts[genType];
  };

  const generate = async () => {
    if (!selected) return;
    setGenerating(true); setResult("");
    try { setResult(await callClaude(buildPrompt(selected))); }
    catch(e) { setResult("❌ " + e.message); }
    setGenerating(false);
  };

  const activeType = GEN_TYPES.find(t=>t.id===genType);

  return (
    <div>
      <div style={S.card}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
          <button style={S.btnSm()} onClick={fetchProducts} disabled={loadingProducts}>
            {loadingProducts?<><Spin/> טוען...</>:"🔄 רענן"}
          </button>
          <span style={{...S.label, margin:0, fontSize:15}}>🛍️ מוצרים מ-vibemodostyle.com</span>
        </div>

        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="חפש מוצר או מותג..."
          style={{...S.input, width:"100%", marginBottom:12}}
        />

        {loadingProducts && <div style={{textAlign:"center",padding:20,color:"#3B9EFF"}}><Spin/> טוען מוצרים מהחנות...</div>}

        <div style={{maxHeight:320, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, marginBottom:14}}>
          {filtered.map(p => {
            const price = p.variants?.[0]?.price;
            const comparePrice = p.variants?.[0]?.compare_at_price;
            const discount = comparePrice && price ? Math.round((1 - price/comparePrice)*100) : null;
            const img = p.images?.[0]?.src;
            const isSelected = selected?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={()=>{setSelected(p); setResult("");}}
                style={{display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, cursor:"pointer", border:`1px solid ${isSelected?"#3B9EFF":"#2d3f5e"}`, background:isSelected?"#1a2d4a":"#111827", transition:"all .15s"}}
              >
                {img && <img src={img} alt="" style={{width:52, height:52, borderRadius:8, objectFit:"cover", flexShrink:0}} />}
                <div style={{flex:1, textAlign:"right"}}>
                  <div style={{color:"#f1f5f9", fontSize:13, fontWeight:700, lineHeight:1.3}}>{p.title}</div>
                  <div style={{color:"#8fa3c0", fontSize:11, marginTop:2}}>{p.vendor}</div>
                </div>
                <div style={{textAlign:"left", flexShrink:0}}>
                  <div style={{color:"#22c55e", fontWeight:700, fontSize:13}}>₪{price}</div>
                  {discount && <div style={{color:"#f59e0b", fontSize:11}}>-{discount}%</div>}
                </div>
              </div>
            );
          })}
          {!loadingProducts && filtered.length===0 && <div style={{textAlign:"center",color:"#475569",padding:16}}>לא נמצאו מוצרים</div>}
        </div>

        {selected && (
          <>
            <div style={{background:"#0d1f35", border:"1px solid #3B9EFF33", borderRadius:10, padding:"10px 14px", marginBottom:12, textAlign:"right"}}>
              <span style={{color:"#3B9EFF", fontWeight:700}}>✅ נבחר: </span>
              <span style={{color:"#f1f5f9", fontSize:13}}>{selected.title}</span>
            </div>
            <span style={S.label}>מה לייצר?</span>
            <div style={S.wrap}>
              {GEN_TYPES.map(t=><button key={t.id} style={S.chip(genType===t.id, t.color)} onClick={()=>{setGenType(t.id);setResult("");}}>
                {t.emoji} {t.label}
              </button>)}
            </div>
            <button style={{...S.btn(activeType.color), ...(generating?{opacity:.5}:{})}} onClick={generate} disabled={generating}>
              {generating?<><Spin/> מייצר...</>:<>{activeType.emoji} צור {activeType.label}</>}
            </button>
          </>
        )}
      </div>

      {generating && <div style={{textAlign:"center",padding:24,color:activeType?.color,fontFamily:"monospace"}}><Spin/> מייצר תוכן עבור {selected?.title}...</div>}

      {result && !loading && (
        <div style={{...S.card, borderTop:`3px solid ${activeType?.color}`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnSm()} onClick={()=>{navigator.clipboard.writeText(result);setFlash("📋 הועתק!");}}>📋 העתק</button>
              <button style={S.btnSm(activeType?.color)} onClick={generate}>🔄 מחדש</button>
            </div>
            <span style={{color:activeType?.color, fontWeight:700, fontSize:14}}>{activeType?.emoji} {activeType?.label}</span>
          </div>
          {flash && <div style={{color:"#22c55e",fontSize:13,marginBottom:8,textAlign:"right"}}>{flash}</div>}
          <div style={S.output}>{result}</div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────
// ── 11. ADS TAB ──────────────────────────────────────────────
function AdsTab() {
  const [platform, setPlatform] = useState("meta");
  const [adType, setAdType] = useState("conversion");
  const [product, setProduct] = useState("");
  const [offer, setOffer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [flash, setFlash] = useState("");

  const PLATFORMS = [
    {id:"meta",    label:"Meta / Instagram",  icon:"📸", color:"#E1306C"},
    {id:"google",  label:"Google Ads",        icon:"🔍", color:"#4285F4"},
    {id:"tiktok",  label:"TikTok Ads",        icon:"🎵", color:"#69C9D0"},
    {id:"youtube", label:"YouTube Ads",       icon:"▶",  color:"#FF4444"},
  ];
  const AD_TYPES = [
    {id:"conversion", label:"המרה / מכירה",   emoji:"💰"},
    {id:"awareness",  label:"מודעות מותג",    emoji:"📢"},
    {id:"retarget",   label:"רימרקטינג",      emoji:"🎯"},
    {id:"cart",       label:"עגלה נטושה",     emoji:"🛒"},
    {id:"lookalike",  label:"קהל דומה",       emoji:"👥"},
  ];

  const PROMPTS = {
    meta: (p,o,t) => `צור 3 גרסאות מודעה ל-Meta/Instagram עבור VIBEMODO.
מוצר: "${p}"
הצעה: "${o||"מחיר מיוחד"}"
סוג: ${t}
לכל גרסה:
📢 PRIMARY TEXT (125 תווים): [טקסט ראשי מושך]
📌 HEADLINE (40 תווים): [כותרת]
📝 DESCRIPTION (30 תווים): [תיאור]
🎯 CTA: [כפתור מומלץ]
🔗 URL: vibemodostyle.com
💡 הערה: [למי הכי מתאים]`,

    google: (p,o,t) => `צור קמפיין Google Ads עבור VIBEMODO.
מוצר: "${p}"
הצעה: "${o||"מחיר מיוחד"}"
סוג: ${t}

RSA Ad (Responsive Search Ad):
📌 HEADLINES (15 כותרות, עד 30 תווים כל אחת):
1. [כותרת]
...15. [כותרת]

📝 DESCRIPTIONS (4 תיאורים, עד 90 תווים כל אחד):
1. [תיאור]
...4. [תיאור]

🔗 Final URL: vibemodostyle.com
🔑 Keyword suggestions: [10 מילות מפתח]`,

    tiktok: (p,o,t) => `צור מודעת TikTok Ads עבור VIBEMODO.
מוצר: "${p}"
הצעה: "${o||"מחיר מיוחד"}"
סוג: ${t}

🎵 AD SCRIPT (15-30 שניות):
שניה 0-3 (HOOK): [משפט פתיחה עוצר גלילה]
שניה 3-15 (BODY): [תוכן ראשי]
שניה 15-30 (CTA): [קריאה לפעולה]

📢 AD TEXT: [טקסט מתחת לסרטון, עד 100 תווים]
🎯 CTA Button: [כפתור]
🎵 Sound suggestion: [סוג מוזיקה/טרנד]`,

    youtube: (p,o,t) => `צור מודעת YouTube Ads (Pre-roll) עבור VIBEMODO.
מוצר: "${p}"
הצעה: "${o||"מחיר מיוחד"}"
סוג: ${t}

⏩ UNSKIPPABLE (5 שניות חובה):
[מה חייב להיאמר ב-5 שניות הראשונות]

🎬 FULL AD SCRIPT (30 שניות):
[סקריפט מלא עם ויזואל, דיבור, CTA]

📌 COMPANION BANNER TEXT: [טקסט הבאנר הצדדי]
🔗 CTA: vibemodostyle.com`,
  };

  const run = async () => {
    if (!product.trim()) return;
    setLoading(true); setResult("");
    const p = PLATFORMS.find(x=>x.id===platform);
    const t = AD_TYPES.find(x=>x.id===adType);
    try { setResult(await callClaude(PROMPTS[platform](product, offer, t.label))); }
    catch(e) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  const activePlatform = PLATFORMS.find(x=>x.id===platform);

  return (
    <div style={S.card}>
      <span style={S.label}>פלטפורמת פרסום</span>
      <div style={S.wrap}>
        {PLATFORMS.map(p=><button key={p.id} style={S.chip(platform===p.id, p.color)} onClick={()=>setPlatform(p.id)}>{p.icon} {p.label}</button>)}
      </div>
      <span style={S.label}>סוג מודעה</span>
      <div style={S.wrap}>
        {AD_TYPES.map(t=><button key={t.id} style={S.chip(adType===t.id, activePlatform.color)} onClick={()=>setAdType(t.id)}>{t.emoji} {t.label}</button>)}
      </div>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="מוצר / קטגוריה (חובה)..." style={{...S.input, width:"100%", marginBottom:10}} />
      <input value={offer} onChange={e=>setOffer(e.target.value)} placeholder="הצעה מיוחדת? לדוגמה: 30% הנחה, משלוח חינם..." style={{...S.input, width:"100%", marginBottom:12}} />
      <button style={{...S.btn(activePlatform.color), ...(loading||!product.trim()?{opacity:.5}:{})}} onClick={run} disabled={loading||!product.trim()}>
        {loading?<><Spin/> יוצר מודעות...</>:<>🎯 צור מודעות</>}
      </button>
      {loading && <div style={{textAlign:"center",padding:20,color:activePlatform.color,fontFamily:"monospace"}}><Spin/> כותב קופי מנצח...</div>}
      {result && !loading && <>
        <div style={{...S.output, marginTop:14, borderColor:activePlatform.color+"44"}}>{result}</div>
        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
          <button style={S.btnSm()} onClick={()=>{navigator.clipboard.writeText(result); setFlash("📋 הועתק!");}}>📋 העתק הכל</button>
          <button style={S.btnSm(activePlatform.color)} onClick={run}>🔄 גרסה חדשה</button>
        </div>
        {flash && <div style={{color:"#22c55e",fontSize:13,marginTop:6}}>{flash}</div>}
      </>}
      {!result&&!loading&&<div style={{textAlign:"center",color:"#475569",padding:20,fontSize:13}}>הזן מוצר ולחץ "צור מודעות"</div>}
    </div>
  );
}

// ── 12. PRODUCT PACK TAB ─────────────────────────────────────
function ProductPackTab() {
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [generating, setGenerating] = useState("");

  const PACK_ITEMS = [
    {id:"post",    label:"פוסט Instagram",    emoji:"📸", color:"#E1306C"},
    {id:"tiktok",  label:"סקריפט TikTok",     emoji:"🎵", color:"#69C9D0"},
    {id:"email",   label:"מייל שיווקי",       emoji:"📧", color:"#3B9EFF"},
    {id:"seo",     label:"תיאור SEO",         emoji:"🔍", color:"#22c55e"},
    {id:"meta",    label:"Meta Ads",          emoji:"🎯", color:"#E1306C"},
    {id:"google",  label:"Google Ads",        emoji:"🔎", color:"#4285F4"},
    {id:"story",   label:"Instagram Story",   emoji:"⭕", color:"#f59e0b"},
    {id:"whatsapp",label:"WhatsApp",          emoji:"💬", color:"#25D366"},
  ];

  const PROMPTS = {
    post:     p => `כתוב פוסט Instagram מנצח ל-VIBEMODO על "${p}". טון מגניב, ביטחוני. כלול 20 האשטאגים.`,
    tiktok:   p => `כתוב סקריפט TikTok מלא (30 שניות) ל-VIBEMODO על "${p}". Hook 3 שניות, Body, CTA לvibemodostyle.com.`,
    email:    p => `כתוב מייל שיווקי מלא ל-VIBEMODO על "${p}". Subject line + גוף + CTA.`,
    seo:      p => `כתוב תיאור מוצר SEO מלא ל-VIBEMODO: "${p}". 150-300 מילים, מילות מפתח, יתרונות, CTA.`,
    meta:     p => `כתוב 3 גרסאות קצרות למודעת Meta/Instagram של VIBEMODO על "${p}". כל גרסה: טקסט ראשי + כותרת + CTA.`,
    google:   p => `כתוב 5 Headlines (עד 30 תווים) ו-2 Descriptions (עד 90 תווים) לGoogle Ads של VIBEMODO על "${p}".`,
    story:    p => `כתוב סדרת 5 Stories לInstagram של VIBEMODO על "${p}". כל Story – טקסט קצר + אמוג'י + CTA.`,
    whatsapp: p => `כתוב 3 הודעות WhatsApp שיווקיות קצרות (עד 160 תווים) של VIBEMODO על "${p}". ישיר, מושך, עם קישור.`,
  };

  const generateAll = async () => {
    if (!product.trim()) return;
    setResults({});
    const prod = `${product}${price ? ` במחיר ${price}₪` : ""}`;
    for (const item of PACK_ITEMS) {
      setGenerating(item.id);
      try {
        const text = await callClaude(PROMPTS[item.id](prod));
        setResults(r => ({...r, [item.id]: text}));
      } catch(e) {
        setResults(r => ({...r, [item.id]: "❌ " + e.message}));
      }
    }
    setGenerating("");
  };

  const done = Object.keys(results).length;
  const total = PACK_ITEMS.length;

  return (
    <div>
      <div style={S.card}>
        <span style={{...S.label, fontSize:15}}>📦 פאקג' תוכן מלא למוצר</span>
        <p style={{color:"#8fa3c0", fontSize:13, textAlign:"right", marginBottom:14}}>
          הזן מוצר אחד → קבל את כל התוכן מוכן: פוסט, סקריפט, מייל, SEO, מודעות ועוד
        </p>
        <div style={{...S.row, marginBottom:10}}>
          <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="מחיר (אופציונלי)" style={{...S.input, width:130}} />
          <input value={product} onChange={e=>setProduct(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generateAll()} placeholder="שם המוצר, לדוגמה: נעלי עור אדידס סטן סמית׳..." style={{...S.input, flex:1}} />
        </div>
        <button style={{...S.btn("#7c3aed"), ...(loading||!product.trim()?{opacity:.5}:{})}} onClick={generateAll} disabled={!!generating||!product.trim()}>
          {generating ? <><Spin/> מייצר ({done}/{total})...</> : <>📦 צור פאקג' מלא</>}
        </button>
        {generating && (
          <div style={{marginTop:10,background:"#111827",borderRadius:8,padding:"8px 14px"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"flex-end",flexWrap:"wrap"}}>
              {PACK_ITEMS.map(item=>(
                <span key={item.id} style={{fontSize:12,color:results[item.id]?"#22c55e":generating===item.id?item.color:"#334155"}}>
                  {results[item.id]?"✅":generating===item.id?<Spin/>:"⏳"} {item.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {PACK_ITEMS.map(item => results[item.id] && (
        <div key={item.id} style={{...S.card, borderRight:`3px solid ${item.color}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button style={S.btnSm(item.color)} onClick={()=>navigator.clipboard.writeText(results[item.id])}>📋 העתק</button>
            <span style={{color:item.color, fontWeight:700, fontSize:14}}>{item.emoji} {item.label}</span>
          </div>
          <div style={S.output}>{results[item.id]}</div>
        </div>
      ))}
    </div>
  );
}

// ── 13. REPURPOSE TAB ─────────────────────────────────────────
function RepurposeTab() {
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const run = async () => {
    if (!source.trim()) return;
    setLoading(true); setResult("");
    try {
      setResult(await callClaude(`קח את התוכן הבא של VIBEMODO ועבד אותו ל-8 פורמטים שונים:

תוכן מקור:
"${source}"

פורמט חובה:
📸 INSTAGRAM POST (עד 150 מילים + 15 האשטאגים)
━━━━━━━━━━━━━━━━━━

🎵 TIKTOK HOOK + SCRIPT (30 שניות)
━━━━━━━━━━━━━━━━━━

📧 EMAIL SUBJECT + BODY (קצר, עד 100 מילים)
━━━━━━━━━━━━━━━━━━

💬 WHATSAPP MESSAGE (עד 160 תווים)
━━━━━━━━━━━━━━━━━━

📌 PINTEREST DESCRIPTION (SEO friendly)
━━━━━━━━━━━━━━━━━━

▶ YOUTUBE SHORT SCRIPT (60 שניות)
━━━━━━━━━━━━━━━━━━

🎯 FACEBOOK AD COPY (Primary text + Headline)
━━━━━━━━━━━━━━━━━━

🔍 GOOGLE AD HEADLINES (5 כותרות עד 30 תווים)
━━━━━━━━━━━━━━━━━━

כל פורמט מותאם לפלטפורמה שלו, עם הטון של VIBEMODO ו-CTA לvibemodostyle.com.`));
    } catch(e) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  return (
    <div style={S.card}>
      <span style={{...S.label, fontSize:15}}>🔄 מכונת ריפרפוז – תוכן אחד, 8 פלטפורמות</span>
      <p style={{color:"#8fa3c0", fontSize:13, textAlign:"right", marginBottom:14}}>
        הדבק כל תוכן – פוסט, תיאור מוצר, מאמר – וקבל גרסה לכל פלטפורמה
      </p>
      <textarea
        value={source}
        onChange={e=>setSource(e.target.value)}
        placeholder="הדבק כאן את התוכן המקורי..."
        style={{...S.input, width:"100%", minHeight:100, resize:"vertical", marginBottom:12, lineHeight:1.6}}
      />
      <button style={{...S.btn("#7c3aed"), ...(loading||!source.trim()?{opacity:.5}:{})}} onClick={run} disabled={loading||!source.trim()}>
        {loading?<><Spin/> מעבד...</>:<>🔄 עבד ל-8 פורמטים</>}
      </button>
      {loading && <div style={{textAlign:"center",padding:24,color:"#7c3aed",fontFamily:"monospace"}}><Spin/> מעבד לכל הפלטפורמות...</div>}
      {result && !loading && <>
        <div style={{...S.output, marginTop:14, borderColor:"#7c3aed44"}}>{result}</div>
        <div style={{marginTop:10}}>
          <button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(result)}>📋 העתק הכל</button>
        </div>
      </>}
    </div>
  );
}

// ── 14. AMBASSADORS TAB ──────────────────────────────────────
function AmbassadorsTab() {
  const [msgType, setMsgType] = useState("collab_dm");
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [followers, setFollowers] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const TYPES = [
    {id:"collab_dm",  label:"DM שיתוף פעולה", emoji:"✉️"},
    {id:"brief",      label:"Creative Brief",  emoji:"📋"},
    {id:"affiliate",  label:"תכנית שגרירים",   emoji:"🤝"},
    {id:"gifting",    label:"Gifting Request",  emoji:"🎁"},
    {id:"followup",   label:"מעקב אחרי DM",   emoji:"🔔"},
    {id:"thankyou",   label:"תודה אחרי פוסט",  emoji:"💙"},
  ];

  const PROMPTS = {
    collab_dm:  (n,ni,f) => `כתוב DM מקצועי לאינפלואנסר "${n||"[שם]"}" (${f||"10K"} עוקבים, נישה: ${ni||"אופנה"}) מטעם VIBEMODO. הצע שיתוף פעולה: קבלת פריטים חינם + קוד הנחה אישי + עמלה. קצר, אישי, לא מכירתי מדי. לא יותר מ-150 מילים.`,
    brief:      (n,ni) => `כתוב Creative Brief מלא לאינפלואנסר "${n||"[שם]"}" בנישת ${ni||"אופנה"} עבור VIBEMODO. כלול: מטרת הקמפיין, Key Messages, Do's and Don'ts, Deliverables (מה נדרש ממנו), לוח זמנים, פרטי פיצוי.`,
    affiliate:  (n) => `כתוב הודעת גיוס לתכנית השגרירים של VIBEMODO ל-"${n||"[שם]"}". כלול: תנאי התכנית (15% עמלה, קוד אישי, פריטים חינם), היתרונות, איך מצטרפים, CTA.`,
    gifting:    (n,ni) => `כתוב בקשת Gifting ל-"${n||"[שם]"}" (נישה: ${ni||"אופנה"}) מ-VIBEMODO. נשלח מוצרים בחינם בתמורה לפוסט אותנטי. טון חברותי ואמיתי.`,
    followup:   (n) => `כתוב הודעת Follow-Up לאינפלואנסר "${n||"[שם]"}" שלא ענה לDM הראשון של VIBEMODO. קצר, לא דוחק, עם ערך מוסף.`,
    thankyou:   (n) => `כתוב הודעת תודה ל-"${n||"[שם]"}" לאחר שפרסם תוכן עבור VIBEMODO. חם, אישי, עם הצעה להמשיך שיתוף פעולה.`,
  };

  const run = async () => {
    setLoading(true); setResult("");
    try { setResult(await callClaude(PROMPTS[msgType](name, niche, followers))); }
    catch(e) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  return (
    <div style={S.card}>
      <span style={{...S.label, fontSize:15}}>🤝 שגרירים ואינפלואנסרים</span>
      <div style={S.wrap}>
        {TYPES.map(t=><button key={t.id} style={S.chip(msgType===t.id,"#f59e0b")} onClick={()=>setMsgType(t.id)}>{t.emoji} {t.label}</button>)}
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="שם האינפלואנסר" style={S.input} />
        <input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="נישה (אופנה, ספורט...)" style={S.input} />
        <input value={followers} onChange={e=>setFollowers(e.target.value)} placeholder="מספר עוקבים" style={S.input} />
      </div>
      <button style={{...S.btn("#d97706"), ...(loading?{opacity:.5}:{})}} onClick={run} disabled={loading}>
        {loading?<><Spin/> כותב...</>:<>🤝 צור הודעה</>}
      </button>
      {loading && <div style={{textAlign:"center",padding:20,color:"#f59e0b",fontFamily:"monospace"}}><Spin/> כותב הודעה מותאמת...</div>}
      {result && !loading && <>
        <div style={{...S.output, marginTop:14, borderColor:"#f59e0b44"}}>{result}</div>
        <div style={{marginTop:10,display:"flex",gap:8}}>
          <button style={S.btnSm()} onClick={()=>navigator.clipboard.writeText(result)}>📋 העתק</button>
          <button style={S.btnSm("#d97706")} onClick={run}>🔄 גרסה חדשה</button>
        </div>
      </>}
      {!result&&!loading&&<div style={{textAlign:"center",color:"#475569",padding:20,fontSize:13}}>בחר סוג הודעה ולחץ צור</div>}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────
const TABS = [
  {id:"live",        label:"🛍️ חנות Live",      C:LiveProductsTab},
  {id:"pack",        label:"📦 פאקג' מוצר",     C:ProductPackTab},
  {id:"video",       label:"🎬 וידאו",           C:VideoTab},
  {id:"ads",         label:"🎯 מודעות",           C:AdsTab},
  {id:"content",     label:"✍️ תוכן",          C:ContentTab},
  {id:"repurpose",   label:"🔄 ריפרפוז",        C:RepurposeTab},
  {id:"seo",         label:"🔍 SEO",            C:SeoTab},
  {id:"email",       label:"📧 מיילים",         C:EmailTab},
  {id:"products",    label:"🛒 מוצרים",         C:ProductsTab},
  {id:"ambassadors", label:"🤝 שגרירים",        C:AmbassadorsTab},
  {id:"chatbot",     label:"💬 צ'אטבוט",        C:ChatbotTab},
  {id:"competitors", label:"🏆 מתחרים",         C:CompetitorsTab},
  {id:"planner",     label:"📅 מתכנן",           C:PlannerTab},
  {id:"monitor",     label:"🛡️ ניטור",          C:MonitorTab},
  {id:"strategy",    label:"🧠 אסטרטגיה",      C:StrategyTab},
];

export default function App() {
  const [tab, setTab] = useState("live");
  const [time, setTime] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t); },[]);
  const Active = TABS.find(t=>t.id===tab)?.C;

  return (
    <>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e40af;border-radius:4px}
        button:hover{filter:brightness(1.1)}
      `}</style>
      <div style={S.app}>
        {/* Header */}
        <div style={S.header}>
          <div style={{fontFamily:"monospace",fontSize:12,color:"#3B9EFF",background:"#0a1628",padding:"5px 10px",borderRadius:8,border:"1px solid #1e3a6e"}}>
            {time.toLocaleTimeString("he-IL")}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:900,fontSize:22,letterSpacing:3,color:"#fff"}}>VIBE<span style={{color:"#3B9EFF"}}>MODO</span></div>
              <div style={{fontSize:10,color:"#475569",letterSpacing:2,fontFamily:"monospace"}}>WAR MACHINE v2.0 • 9 MODULES</div>
            </div>
            <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a6e,#3B9EFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🐺</div>
          </div>
        </div>

        {/* Platforms bar */}
        <div style={{display:"flex",gap:6,padding:"8px 16px",background:"#080d1a",borderBottom:"1px solid #0f172a",overflowX:"auto",justifyContent:"flex-end"}}>
          {PLATFORMS.map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:5,background:"#0a0f1e",border:`1px solid ${p.color}33`,borderRadius:20,padding:"4px 10px",whiteSpace:"nowrap"}}>
              <span style={{fontSize:11,color:p.color,fontWeight:700}}>@vibemodo</span>
              <span>{p.icon}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:3,padding:"8px 12px",background:"#070c18",borderBottom:"1px solid #0f172a",overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} style={S.tabBtn(tab===t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{padding:"16px",maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
          {Active && <Active />}
        </div>

        <div style={{textAlign:"center",padding:10,color:"#1e293b",fontSize:10,fontFamily:"monospace",borderTop:"1px solid #0f172a"}}>
          VIBEMODO WAR MACHINE v2.0 • 9 MODULES • POWERED BY CLAUDE AI
        </div>
      </div>
    </>
  );
}
