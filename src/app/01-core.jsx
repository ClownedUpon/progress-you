const { useState, useEffect, useRef, useCallback } = React;
const CtxMenuCtx = React.createContext(null);
const NavCtx     = React.createContext(null);
// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS = [
  { id:"work",     label:"Work",            color:"#0C7B7B" },
  { id:"personal", label:"Personal",        color:"#B05A12" },
  { id:"health",   label:"Health & Fitness", color:"#1A7A43" },
  { id:"learning", label:"Learning",        color:"#4B3FC7" },
  { id:"projects", label:"Side Projects",   color:"#135D99" },
  { id:"finance",  label:"Finance",         color:"#7C7166" },
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const PRESET_COLORS = ["#0C7B7B","#4B3FC7","#1A7A43","#135D99","#9B1A55","#B05A12","#7A4010","#7C7166","#C43A3A","#6B5080","#2A7A8A","#7A7A2A","#A0782A","#3A6A7A"];
const EDITOR_FONTS  = [
  { label:"Sans",  value:'"DM Sans", sans-serif'        },
  { label:"Serif", value:'"Playfair Display", serif'    },
  { label:"Lora",  value:'"Lora", serif'                },
  { label:"Mono",  value:'"JetBrains Mono", monospace'  },
];
const EDITOR_SIZES  = [
  { label:"Small", value:"11px" },
  { label:"Body",  value:"13px" },
  { label:"Large", value:"16px" },
  { label:"H2",    value:"20px" },
  { label:"H1",    value:"26px" },
];
const TEXT_COLORS = [
  "#1C1714","#4A3F30","#7A6C5E","#9B8E80",
  "#C43A3A","#B05A12","#7A4010","#1A7A43",
  "#0C7B7B","#135D99","#4B3FC7","#9B1A55",
];

// Bump this number whenever the data schema changes (new fields, renamed keys, etc.)
// so exported files can be versioned and future imports can handle old formats.
const EXPORT_VERSION = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => {
  const buf = new Uint8Array(10);
  crypto.getRandomValues(buf);
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[buf[i] % 36];
  return s;
};

function textFor(hex="#888") {
  if(!hex||hex.length<7) return "#fff";
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return 0.299*r+0.587*g+0.114*b>145?"#1C1714":"#FFFFFF";
}
function mondayOf(date) {
  const d=new Date(date); d.setHours(12,0,0,0);
  const day=d.getDay(); d.setDate(d.getDate()-(day===0?6:day-1));
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function shiftWeek(wk,n) {
  const [y,m,d]=wk.split("-").map(Number);
  const dt=new Date(y,m-1,d,12,0,0); dt.setDate(dt.getDate()+n*7);
  return mondayOf(dt);
}
function weekLabel(wk) {
  const [y,m,d]=wk.split("-").map(Number);
  const s=new Date(y,m-1,d),e=new Date(y,m-1,d+6);
  const fmt=(dt,yr)=>dt.toLocaleDateString("en-GB",{day:"numeric",month:"short",...(yr?{year:"numeric"}:{})});
  return `${fmt(s)} – ${fmt(e,true)}`;
}
function monthKeyOf(ts) {
  const d=new Date(ts);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0")].join("-");
}
function fmtMonth(mk) {
  const [y,m]=mk.split("-").map(Number);
  return new Date(y,m-1,1).toLocaleDateString("en-GB",{month:"long",year:"numeric"});
}
function blockMins(blk) {
  const [sh,sm]=blk.start.split(":").map(Number);
  const [eh,em]=blk.end.split(":").map(Number);
  return Math.max(0,(eh*60+em)-(sh*60+sm));
}
function weekDayToISO(wk,dayName) {
  const di=DAYS.indexOf(dayName); if(di<0) return wk;
  const [y,m,d]=wk.split("-").map(Number);
  const dt=new Date(y,m-1,d+di,12,0,0);
  return dt.toISOString().slice(0,10);
}
function stripHtmlText(html) { return (html||"").replace(/<[^>]*>/g,"").trim(); }
function todayName()   { return new Date().toLocaleDateString("en-GB",{weekday:"long"}); }
function nowStamp()    { return new Date().toISOString().slice(0,16).replace("T","_").replace(":","-"); }
function todayISO()    { return new Date().toISOString().slice(0,10); }
function addDays(iso,n){ const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function dayIndex(iso){ const d=new Date(iso+"T12:00:00"); return (d.getDay()+6)%7; } // Monday=0
function trackerStreak(trk) {
  // Counts consecutive *scheduled* completions, skipping non-active days
  let streak=0; const d=new Date(todayISO()+"T12:00:00");
  for(let i=0;i<366;i++){
    const iso=d.toISOString().slice(0,10); const di=(d.getDay()+6)%7;
    if(trk.activeDays[di]){
      if(trk.completions[iso]) streak++;
      else if(iso===todayISO()) { /* today not yet done — don't break, just skip */ }
      else break;
    }
    // non-active days are simply skipped (not counted, not breaking)
    d.setDate(d.getDate()-1);
  }
  return streak;
}
function fmtDue(iso, dueTime=null, allDay=true) {
  const today=todayISO(), diff=Math.round((new Date(iso+"T12:00:00")-new Date(today+"T12:00:00"))/(1000*60*60*24));
  const d=new Date(iso+"T12:00:00");
  const timeSuffix=(!allDay&&dueTime)?" · "+dueTime:"";
  if(diff<0)  return { label:`${Math.abs(diff)}d overdue`+timeSuffix, urgent:true };
  if(diff===0)return { label:"Due today"+timeSuffix, urgent:true };
  if(diff===1)return { label:"Due tomorrow"+timeSuffix, urgent:false };
  return { label:"Due "+d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})+timeSuffix, urgent:false };
}

// ─── Note tree helpers ────────────────────────────────────────────────────────

function noteChildren(items,parentId) {
  return items.filter(n=>n.parentId===(parentId||null)).sort((a,b)=>a.order-b.order);
}
function noteDescendants(items,id) {
  const children=items.filter(n=>n.parentId===id);
  return children.flatMap(c=>[c.id,...noteDescendants(items,c.id)]);
}
function makeNote(parentId=null,order=0) {
  return{id:uid(),parentId,title:"Untitled Note",content:"<p><br></p>",order,createdAt:Date.now(),tags:[],linkedTaskIds:[],linkedTrackerIds:[]};
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function buildSeedData() {
  const now = Date.now();
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const in3days = new Date(today); in3days.setDate(in3days.getDate() + 3);
  const fmtDate = function(d) { return d.toISOString().slice(0, 10); };
  const wk = mondayOf(today);
  const dayName = DAYS[(today.getDay() + 6) % 7]; // Monday=0 index

  // ── IDs (generated once, cross-referenced below)
  var tWork1 = uid(), tWork2 = uid();
  var tPers1 = uid(), tPers2 = uid();
  var tHealth1 = uid(), tHealth2 = uid();
  var tLearn1 = uid();
  var tProj1 = uid();

  var nWork1 = uid();
  var nProj1 = uid();
  var nLearn1 = uid();
  var nPers1 = uid();
  var nFin1 = uid();

  var trHealth1 = uid(), trLearn1 = uid(), trHealth2 = uid();

  // ── Tasks
  var tasks = [
    { id:tWork1, sectionId:"work", title:"Prepare weekly report", notes:"This task is linked to your Meeting Notes. Open the task panel to see linked items and click through!",
      type:"task", status:"doing", order:0, priority:"high", checklist:[], linkedNoteIds:[nWork1], linkedTrackerIds:[],
      dueDate:fmtDate(tomorrow), dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tWork2, sectionId:"work", title:"Review project timeline", notes:"",
      type:"task", status:"backlog", order:1, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tPers1, sectionId:"personal", title:"Plan weekend trip", notes:"This task is linked to a Trip Ideas note. Click the link to jump there!",
      type:"task", status:"doing", order:0, priority:"normal",
      checklist:[{id:uid(),text:"Pick destination",done:false},{id:uid(),text:"Book accommodation",done:false},{id:uid(),text:"Pack bags",done:false}],
      linkedNoteIds:[nPers1], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tPers2, sectionId:"personal", title:"Call dentist", notes:"",
      type:"task", status:"backlog", order:1, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:fmtDate(in3days), dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tHealth1, sectionId:"health", title:"Go for a morning run", notes:"This task is linked to your Morning Run tracker. Click the tracker link to log your runs!",
      type:"task", status:"doing", order:0, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[trHealth1],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tHealth2, sectionId:"health", title:"Meal prep for the week", notes:"",
      type:"task", status:"backlog", order:1, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tLearn1, sectionId:"learning", title:"Read a chapter of current book", notes:"This task links to both a Reading List note and a Read 30 Minutes tracker. Click either to explore!",
      type:"task", status:"doing", order:0, priority:"normal", checklist:[], linkedNoteIds:[nLearn1], linkedTrackerIds:[trLearn1],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tProj1, sectionId:"projects", title:"Brainstorm app ideas", notes:"This task is linked to a Project Ideas note. Use notes to flesh out your ideas!",
      type:"task", status:"backlog", order:0, priority:"normal", checklist:[], linkedNoteIds:[nProj1], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
  ];

  // ── Notes (keyed by sectionId)
  var notes = {
    work: [
      { id:nWork1, parentId:null, title:"Meeting Notes", order:0, createdAt:now, tags:["meetings"],
        linkedTaskIds:[tWork1], linkedTrackerIds:[],
        content:"<p><b>Team Sync - Sample</b></p><p>Agenda items discussed:</p><ul><li>Project status update</li><li>Upcoming deadlines</li><li>Resource planning</li></ul><p><br></p><p><i>This note is linked to the \"Prepare weekly report\" task. Click the linked task in the sidebar to jump there!</i></p>",
        remindAt:null, remindFired:false },
    ],
    personal: [
      { id:nPers1, parentId:null, title:"Trip Ideas", order:0, createdAt:now, tags:["travel"],
        linkedTaskIds:[tPers1], linkedTrackerIds:[],
        content:"<p><b>Weekend Getaway Ideas</b></p><ul><li>Mountain cabin retreat</li><li>Beach day trip</li><li>City food tour</li></ul><p><br></p><p><i>Linked to \"Plan weekend trip\". Right-click items anywhere to discover more actions!</i></p>",
        remindAt:null, remindFired:false },
    ],
    learning: [
      { id:nLearn1, parentId:null, title:"Reading List", order:0, createdAt:now, tags:["books","reading"],
        linkedTaskIds:[tLearn1], linkedTrackerIds:[trLearn1],
        content:"<p><b>Books to Read</b></p><ol><li>Atomic Habits - James Clear</li><li>Deep Work - Cal Newport</li><li>The Pragmatic Programmer</li></ol><p><br></p><p><i>This note links to the \"Read a chapter\" task and the \"Read 30 Minutes\" tracker. Everything connects!</i></p>",
        remindAt:null, remindFired:false },
    ],
    projects: [
      { id:nProj1, parentId:null, title:"Project Ideas", order:0, createdAt:now, tags:["ideas"],
        linkedTaskIds:[tProj1], linkedTrackerIds:[],
        content:"<p><b>App Ideas Brainstorm</b></p><ul><li>Habit tracker with streaks</li><li>Recipe manager</li><li>Budget planner</li></ul><p><br></p><p><i>Linked to \"Brainstorm app ideas\". Try the link button to connect more items together!</i></p>",
        remindAt:null, remindFired:false },
    ],
    finance: [
      { id:nFin1, parentId:null, title:"Budget Template", order:0, createdAt:now, tags:["budget"],
        linkedTaskIds:[], linkedTrackerIds:[],
        content:"<p><b>Monthly Budget</b></p><p>Income: ___</p><p>Rent/Mortgage: ___</p><p>Groceries: ___</p><p>Transport: ___</p><p>Savings: ___</p><p><br></p><p><i>Tip: Link this note to a task or tracker to keep your finances connected to your goals!</i></p>",
        remindAt:null, remindFired:false },
    ],
  };

  // ── Trackers
  var trackers = [
    { id:trHealth1, title:"Morning Run", sectionId:"health", color:"#1A7A43",
      activeDays:[1,1,1,1,1,0,0], completions:{}, linkedTaskIds:[tHealth1], linkedNoteIds:[],
      order:0, archived:false, createdAt:now },
    { id:trLearn1, title:"Read 30 Minutes", sectionId:"learning", color:"#4B3FC7",
      activeDays:[1,1,1,1,1,1,1], completions:{}, linkedTaskIds:[tLearn1], linkedNoteIds:[nLearn1],
      order:1, archived:false, createdAt:now },
    { id:trHealth2, title:"Drink Water", sectionId:"health", color:"#0C7B7B",
      activeDays:[1,1,1,1,1,1,1], completions:{}, linkedTaskIds:[], linkedNoteIds:[],
      order:2, archived:false, createdAt:now },
  ];

  // ── Timetable (blocks for today's day in current week)
  var dayBlocks = [
    { id:uid(), type:"section", sectionId:"work", label:"Morning Focus", start:"09:00", end:"11:00",
      linkedItems:[{type:"task",id:tWork1,snapshot:"Prepare weekly report"}] },
    { id:uid(), type:"break", sectionId:null, label:"Lunch Break", start:"12:00", end:"13:00",
      linkedItems:[] },
    { id:uid(), type:"section", sectionId:"learning", label:"Learning Time", start:"14:00", end:"15:30",
      linkedItems:[{type:"task",id:tLearn1,snapshot:"Read a chapter of current book"},{type:"note",id:nLearn1,snapshot:"Reading List"}] },
    { id:uid(), type:"section", sectionId:"health", label:"Exercise", start:"17:00", end:"18:00",
      linkedItems:[{type:"tracker",id:trHealth1,snapshot:"Morning Run"}] },
  ];
  var tt = {};
  tt[wk] = {};
  tt[wk][dayName] = dayBlocks;

  return { tasks:tasks, notes:notes, trackers:trackers, tt:tt };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function sget(k) {
  if (!window.__TAURI__?.fs) return null;
  try {
    const { exists, readTextFile, BaseDirectory } = window.__TAURI__.fs;
    const found = await exists(k + ".json", { baseDir: BaseDirectory.AppData });
    if (!found) return null;
    const text = await readTextFile(k + ".json", { baseDir: BaseDirectory.AppData });
    return JSON.parse(text);
  } catch { return null; }
}

async function sset(k, v) {
  if (!window.__TAURI__?.fs) return;
  try {
    const { writeTextFile, BaseDirectory } = window.__TAURI__.fs;
    await writeTextFile(k + ".json", JSON.stringify(v), { baseDir: BaseDirectory.AppData });
  } catch(e) { console.error("sset error:", e); }
}

// Debounced write — coalesces rapid state changes into one disk write per key
const _ssetTimers = {};
function ssetDebounced(k, v, delay=800) {
  if (_ssetTimers[k]) clearTimeout(_ssetTimers[k]);
  _ssetTimers[k] = setTimeout(() => { _ssetTimers[k] = null; sset(k, v); }, delay);
}

// ─── Automatic backup ─────────────────────────────────────────────────────────

const BACKUP_KEYS = ["py-sections","py-tt","py-tasks","py-notes","py-tt-templates","py-tt-setblocks","py-tt-archive","py-trackers"];
const DEFAULT_BACKUP_HOURS = 24;

async function getBackupInterval() {
  const val = await sget("py-backup-interval");
  if (val && typeof val === "number" && val >= 1 && val <= 168) return val;
  return DEFAULT_BACKUP_HOURS;
}
async function setBackupInterval(hours) {
  await sset("py-backup-interval", Math.max(1, Math.min(168, hours)));
}

async function runBackupIfDue(force) {
  if (!window.__TAURI__?.fs) return;
  try {
    const { exists, readTextFile, writeTextFile, mkdir, BaseDirectory } = window.__TAURI__.fs;
    const intervalHrs = await getBackupInterval();
    const metaFound = await exists("py-backup-meta.json", { baseDir: BaseDirectory.AppData });
    let lastBackup = 0;
    if (metaFound) {
      const raw = await readTextFile("py-backup-meta.json", { baseDir: BaseDirectory.AppData });
      const meta = JSON.parse(raw);
      lastBackup = meta.lastBackup || 0;
    }
    const now = Date.now();
    if (!force && now - lastBackup < intervalHrs * 3600000) return; // not due yet
    await mkdir("backups", { baseDir: BaseDirectory.AppData, recursive: true });
    const stamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, "-");
    for (const key of BACKUP_KEYS) {
      const found = await exists(key + ".json", { baseDir: BaseDirectory.AppData });
      if (!found) continue;
      const text = await readTextFile(key + ".json", { baseDir: BaseDirectory.AppData });
      await writeTextFile("backups/" + key + "_" + stamp + ".json", text, { baseDir: BaseDirectory.AppData });
    }
    await writeTextFile("py-backup-meta.json", JSON.stringify({ lastBackup: now, stamp }), { baseDir: BaseDirectory.AppData });
    // Prune old backups — keep only the 10 most recent sets
    await pruneOldBackups();
  } catch(e) { console.error("Backup error:", e); }
}

async function pruneOldBackups() {
  if (!window.__TAURI__?.fs) return;
  try {
    const { readDir, remove, BaseDirectory } = window.__TAURI__.fs;
    const entries = await readDir("backups", { baseDir: BaseDirectory.AppData });
    // Extract unique timestamps from filenames
    const stamps = [...new Set(entries.map(e => {
      const name = e.name || "";
      const match = name.match(/_(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})\.json$/);
      return match ? match[1] : null;
    }).filter(Boolean))].sort().reverse();
    // Keep 10 newest sets, delete the rest
    const toDelete = stamps.slice(10);
    for (const entry of entries) {
      const name = entry.name || "";
      if (toDelete.some(s => name.includes(s))) {
        try { await remove("backups/" + name, { baseDir: BaseDirectory.AppData }); } catch(e) {}
      }
    }
  } catch(e) {}
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  input:    {width:"100%",display:"block",padding:"9px 12px",borderRadius:8,border:"1.5px solid #D6CEC3",background:"#FDFAF6",fontFamily:'"DM Sans",sans-serif',fontSize:13,color:"#1C1714",outline:"none",marginBottom:12},
  btnDark:  {padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",background:"#1C1714",color:"#F8F3EC",fontFamily:'"DM Sans",sans-serif',fontSize:13,fontWeight:600},
  btnGhost: {padding:"8px 16px",borderRadius:8,border:"1.5px solid #C8BEB0",cursor:"pointer",background:"transparent",color:"#6B5E4E",fontFamily:'"DM Sans",sans-serif',fontSize:13,fontWeight:500},
  btnMicro: {padding:"4px 9px",borderRadius:6,border:"none",cursor:"pointer",background:"#EBE4D8",color:"#4A3F30",fontFamily:'"DM Sans",sans-serif',fontSize:11,fontWeight:600},
  lbl:      {display:"block",fontSize:11,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:7},
};

// ─── Data migration (fills missing fields on existing records) ───────────────

function migrateTt(tt) {
  if(!tt||typeof tt!=="object") return tt||{};
  const out={};
  for(const [wk,week] of Object.entries(tt)){
    out[wk]={};
    for(const [day,arr] of Object.entries(week)){
      out[wk][day]=(Array.isArray(arr)?arr:[]).map(blk=>{
        if(blk.linkedItems) return blk; // already migrated
        const items=[];
        if(blk.linkedTaskId) items.push({type:"task",id:blk.linkedTaskId,snapshot:blk.linkedTaskSnapshot||""});
        if(blk.linkedNoteId) items.push({type:"note",id:blk.linkedNoteId,snapshot:blk.linkedNoteSnapshot||""});
        const {linkedTaskId,linkedNoteId,linkedTaskSnapshot,linkedNoteSnapshot,...rest}=blk;
        return{...rest,linkedItems:items};
      });
    }
  }
  return out;
}

// Prune timetable weeks older than 6 months; archive them to a separate file
const TT_PRUNE_MONTHS = 6;
async function pruneTt(tt) {
  if (!tt || typeof tt !== "object") return tt || {};
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - TT_PRUNE_MONTHS);
  const cutoffStr = mondayOf(cutoff);
  const keep = {};
  const archive = {};
  let pruned = 0;
  for (const [wk, week] of Object.entries(tt)) {
    if (wk < cutoffStr) {
      // Only archive weeks that actually have blocks
      const hasData = Object.values(week).some(arr => Array.isArray(arr) && arr.length > 0);
      if (hasData) { archive[wk] = week; pruned++; }
    } else {
      keep[wk] = week;
    }
  }
  if (pruned > 0) {
    // Merge with existing archive
    const existing = await sget("py-tt-archive") || {};
    const merged = { ...existing, ...archive };
    await sset("py-tt-archive", merged);
    console.log("Timetable pruned: archived " + pruned + " old week(s)");
  }
  return keep;
}

function migrateTasks(tasks) {
  return tasks.map((t,i) => ({
    ...t,
    order:         t.order         ?? i,
    priority:      t.priority      ?? "normal",
    checklist:     t.checklist     ?? [],
    linkedNoteIds: t.linkedNoteIds ?? [],
    dueTime:       t.dueTime       ?? null,
    allDay:        t.allDay        ?? true,
    remindAt:      t.remindAt      ?? null,
    remindFired:   t.remindFired   ?? false,
    archived:          t.archived          ?? false,
    linkedTrackerIds:  t.linkedTrackerIds  ?? [],
  }));
}
function migrateNotes(notesMap) {
  const out = {};
  for(const [sid, arr] of Object.entries(notesMap)) {
    out[sid] = (Array.isArray(arr) ? arr : []).map(n => ({
      ...n,
      tags:              n.tags              ?? [],
      linkedTaskIds:     n.linkedTaskIds     ?? [],
      linkedTrackerIds:  n.linkedTrackerIds  ?? [],
      remindAt:          n.remindAt          ?? null,
      remindFired:       n.remindFired       ?? false,
    }));
  }
  return out;
}
function migrateTrackers(trackers) {
  return (Array.isArray(trackers) ? trackers : []).map((t, i) => ({
    ...t,
    order:         t.order         ?? i,
    color:         t.color         ?? "#0C7B7B",
    activeDays:    t.activeDays    ?? [1,1,1,1,1,0,0],
    completions:   t.completions   ?? {},
    linkedTaskIds: t.linkedTaskIds ?? [],
    linkedNoteIds: t.linkedNoteIds ?? [],
    archived:      t.archived      ?? false,
  }));
}

const PRIORITY = {
  high:   {label:"↑ High",  color:"#C43A3A", bg:"#FAE8E8"},
  normal: null,
  low:    {label:"↓ Low",   color:"#9B8E80", bg:"#EBE4D8"},
};

