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

// ── MAIN ─────────────────────────────────────────────────────
const TABS = [
  {id:"content",    label:"✍️ תוכן",       C:ContentTab},
  {id:"seo",        label:"🔍 SEO",         C:SeoTab},
  {id:"email",      label:"📧 מיילים",      C:EmailTab},
  {id:"products",   label:"🛒 מוצרים",      C:ProductsTab},
  {id:"chatbot",    label:"💬 צ'אטבוט",     C:ChatbotTab},
  {id:"competitors",label:"🏆 מתחרים",      C:CompetitorsTab},
  {id:"planner",    label:"📅 מתכנן",        C:PlannerTab},
  {id:"monitor",    label:"🛡️ ניטור",       C:MonitorTab},
  {id:"strategy",   label:"🧠 אסטרטגיה",   C:StrategyTab},
];

export default function App() {
  const [tab, setTab] = useState("content");
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
