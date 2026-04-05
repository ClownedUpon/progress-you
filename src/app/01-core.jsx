const { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } = React;
const CtxMenuCtx = React.createContext(null);
const NavCtx     = React.createContext(null);

// ─── Tiptap ──────────────────────────────────────────────────────────────────
var _TT = window.Tiptap || {};
var useEditor       = _TT.useEditor;
var EditorContent   = _TT.EditorContent;
var NodeViewWrapper = _TT.NodeViewWrapper;
var ReactNodeViewRenderer = _TT.ReactNodeViewRenderer;
var TiptapNode      = _TT.Node;
var TiptapMark      = _TT.Mark;
var TiptapExtension = _TT.Extension;
var mergeAttributes = _TT.mergeAttributes;
var InputRule       = _TT.InputRule;
var wrappingInputRule = _TT.wrappingInputRule;
var TiptapDoc       = _TT.Document;
var TiptapParagraph = _TT.Paragraph;
var TiptapText      = _TT.Text;
var TiptapBold      = _TT.Bold;
var TiptapItalic    = _TT.Italic;
var TiptapUnderline = _TT.Underline;
var TiptapHeading   = _TT.Heading;
var TiptapBulletList  = _TT.BulletList;
var TiptapOrderedList = _TT.OrderedList;
var TiptapListItem    = _TT.ListItem;
var TiptapHardBreak   = _TT.HardBreak;
var TiptapHistory     = _TT.History;
var TiptapDropcursor  = _TT.Dropcursor;
var TiptapGapcursor   = _TT.Gapcursor;
var TiptapColor       = _TT.Color;
var TiptapTextStyle   = _TT.TextStyle;
var TiptapFontFamily  = _TT.FontFamily;
var TiptapImage       = _TT.Image;
var TiptapPlaceholder = _TT.Placeholder;
var TiptapSuggestion  = _TT.Suggestion;
var TiptapTable         = _TT.Table;
var TiptapTableRow      = _TT.TableRow;
var TiptapTableCell     = _TT.TableCell;
var TiptapTableHeader   = _TT.TableHeader;
var TiptapTaskList      = _TT.TaskList;
var TiptapTaskItem      = _TT.TaskItem;
var TiptapCodeBlock     = _TT.CodeBlock;
var TiptapHorizontalRule = _TT.HorizontalRule;
var TiptapSubscript     = _TT.Subscript;
var TiptapSuperscript   = _TT.Superscript;
var TiptapHighlight     = _TT.Highlight;
var TiptapTextAlign     = _TT.TextAlign;
var TiptapCharacterCount = _TT.CharacterCount;

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
const EDITOR_FORMAT = [
  { label:"Small",     value:"small",  group:"text"    },
  { label:"Body",      value:"p",      group:"text"    },
  { label:"Large",     value:"large",  group:"text"    },
  { label:"Heading 1", value:"h1",     group:"heading" },
  { label:"Heading 2", value:"h2",     group:"heading" },
  { label:"Heading 3", value:"h3",     group:"heading" },
];
var TOOLBAR_ITEMS = [
  { id:"font",      label:"Font Family",      row:1, type:"dropdown" },
  { id:"format",    label:"Text Format",       row:1, type:"dropdown" },
  { id:"bold",      label:"Bold",              row:1, shortcut:"Ctrl+B",       type:"toggle" },
  { id:"italic",    label:"Italic",            row:1, shortcut:"Ctrl+I",       type:"toggle" },
  { id:"underline", label:"Underline",         row:1, shortcut:"Ctrl+U",       type:"toggle" },
  { id:"sub",       label:"Subscript",         row:1, type:"toggle" },
  { id:"super",     label:"Superscript",       row:1, type:"toggle" },
  { id:"highlight", label:"Highlight",         row:1, type:"toggle" },
  { id:"color",     label:"Text Colour",       row:1, type:"picker" },
  { id:"alignL",    label:"Align Left",        row:1, type:"toggle" },
  { id:"alignC",    label:"Align Centre",      row:1, type:"toggle" },
  { id:"alignR",    label:"Align Right",       row:1, type:"toggle" },
  { id:"alignJ",    label:"Justify",           row:1, type:"toggle" },
  { id:"clearFmt",  label:"Clear Formatting",  row:1, type:"action" },
  { id:"bullet",    label:"Bullet List",       row:2, type:"toggle" },
  { id:"ordered",   label:"Numbered List",     row:2, type:"toggle" },
  { id:"taskList",  label:"Task List",         row:2, type:"toggle" },
  { id:"callout",   label:"Callout",           row:2, type:"action" },
  { id:"collapse",  label:"Collapsible",       row:2, type:"action" },
  { id:"codeBlock", label:"Code Block",        row:2, type:"toggle" },
  { id:"hr",        label:"Horizontal Rule",   row:2, type:"action" },
  { id:"table",     label:"Table",             row:2, type:"action" },
  { id:"dateChip",  label:"Date Chip",         row:2, type:"picker" },
  { id:"taskChip",  label:"Task Chip",         row:2, type:"picker" },
  { id:"image",     label:"Image",             row:2, type:"action" },
  { id:"undo",      label:"Undo",              row:2, shortcut:"Ctrl+Z",       type:"action" },
  { id:"redo",      label:"Redo",              row:2, shortcut:"Ctrl+Shift+Z", type:"action" },
  { id:"charCount", label:"Character Count",   row:2, type:"display" },
];
const TEXT_COLORS = [
  "#1C1714","#4A3F30","#7A6C5E","#9B8E80",
  "#C43A3A","#B05A12","#7A4010","#1A7A43",
  "#0C7B7B","#135D99","#4B3FC7","#9B1A55",
];

// Bump this number whenever the data schema changes (new fields, renamed keys, etc.)
// so exported files can be versioned and future imports can handle old formats.
const EXPORT_VERSION = 9;

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
function trackerAvg(trk, days) {
  var end = todayISO();
  var vals = [];
  var d = new Date(end + "T12:00:00");
  for (var i = 0; i < days; i++) {
    var iso = d.toISOString().slice(0, 10);
    var v = trk.completions[iso];
    if (typeof v === "number") vals.push(v);
    d.setDate(d.getDate() - 1);
  }
  if (vals.length === 0) return null;
  return vals.reduce(function(a, b) { return a + b; }, 0) / vals.length;
}

function trackerMinMax(trk) {
  var vals = [];
  var keys = Object.keys(trk.completions);
  for (var i = 0; i < keys.length; i++) {
    var v = trk.completions[keys[i]];
    if (typeof v === "number") vals.push(v);
  }
  if (vals.length === 0) return null;
  return { min: Math.min.apply(null, vals), max: Math.max.apply(null, vals) };
}

function trackerChoiceDist(trk, days) {
  var dist = {};
  if (days) {
    var d = new Date(todayISO() + "T12:00:00");
    for (var i = 0; i < days; i++) {
      var iso = d.toISOString().slice(0, 10);
      var v = trk.completions[iso];
      if (typeof v === "string") dist[v] = (dist[v] || 0) + 1;
      d.setDate(d.getDate() - 1);
    }
  } else {
    var keys = Object.keys(trk.completions);
    for (var j = 0; j < keys.length; j++) {
      var val = trk.completions[keys[j]];
      if (typeof val === "string") dist[val] = (dist[val] || 0) + 1;
    }
  }
  return dist;
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
    { id:trHealth1, title:"Morning Run", sectionId:"health", color:"#1A7A43", mode:"habit",
      activeDays:[1,1,1,1,1,0,0], completions:{}, linkedTaskIds:[tHealth1], linkedNoteIds:[],
      order:0, archived:false, createdAt:now },
    { id:trLearn1, title:"Read 30 Minutes", sectionId:"learning", color:"#4B3FC7", mode:"habit",
      activeDays:[1,1,1,1,1,1,1], completions:{}, linkedTaskIds:[tLearn1], linkedNoteIds:[nLearn1],
      order:1, archived:false, createdAt:now },
    { id:trHealth2, title:"Drink Water", sectionId:"health", color:"#0C7B7B", mode:"tally",
      activeDays:[1,1,1,1,1,1,1], completions:{}, linkedTaskIds:[], linkedNoteIds:[],
      order:2, archived:false, createdAt:now },
    { id:uid(), title:"Coffees", sectionId:null, color:"#8B5E3C", mode:"tally",
      activeDays:[1,1,1,1,1,1,1], completions:{}, linkedTaskIds:[], linkedNoteIds:[],
      order:3, archived:false, createdAt:now },
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

function buildShowcaseData() {
  var now = new Date().toISOString();
  var today = todayISO();
  var thisWeekMon = mondayOf(new Date());
  var yesterday = addDays(today, -1);
  var twoDaysAgo = addDays(today, -2);
  var threeDaysAgo = addDays(today, -3);
  var tomorrow = addDays(today, 1);
  var dayAfterTmrw = addDays(today, 2);
  var in3days = addDays(today, 3);
  var nextWeekMon = addDays(thisWeekMon, 7);
  var lastWeekMon = addDays(thisWeekMon, -7);
  var monthKey = today.slice(0, 7);

  var sections = DEFAULT_SECTIONS.map(function(s) { return Object.assign({}, s); });

  // ── IDs — tasks
  var tW1 = uid(), tW2 = uid(), tW3 = uid(), tW4 = uid(), tW5 = uid(), tW6 = uid();
  var tP1 = uid(), tP2 = uid(), tP3 = uid(), tP4 = uid();
  var tH1 = uid(), tH2 = uid(), tH3 = uid(), tH4 = uid();
  var tL1 = uid(), tL2 = uid(), tL3 = uid(), tL4 = uid();
  // ── IDs — notes
  var nW1 = uid(), nW2 = uid(), nW3 = uid();
  var nL1 = uid(), nL2 = uid(), nL3 = uid();
  var nP1 = uid();
  var nH1 = uid();
  // ── IDs — trackers
  var trH1 = uid(), trL1 = uid(), trH2 = uid(), trP1 = uid(), trC1 = uid(), trL2 = uid();

  // ── Tasks
  var tasks = [
    // Work
    { id:tW1, sectionId:"work", title:"Prepare Q2 report", notes:"Compile data from all departments. Sync with finance before Friday.",
      type:"task", status:"doing", order:0, priority:"high",
      checklist:[{id:uid(),text:"Collect sales figures",done:true},{id:uid(),text:"Get marketing metrics",done:true},{id:uid(),text:"Draft executive summary",done:false},{id:uid(),text:"Final review with manager",done:false}],
      linkedNoteIds:[nW1], linkedTrackerIds:[], dueDate:tomorrow, dueTime:"14:00", allDay:false,
      remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tW2, sectionId:"work", title:"Client presentation slides", notes:"Use the new brand template. Include case studies.",
      type:"task", status:"doing", order:1, priority:"normal",
      checklist:[{id:uid(),text:"Outline key points",done:true},{id:uid(),text:"Design slide deck",done:false},{id:uid(),text:"Add speaker notes",done:false}],
      linkedNoteIds:[], linkedTrackerIds:[], dueDate:dayAfterTmrw, dueTime:null, allDay:true,
      remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tW3, sectionId:"work", title:"Review pull requests", notes:"Focus on the auth refactor branch.",
      type:"task", status:"backlog", order:2, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tW4, sectionId:"work", title:"Update project documentation", notes:"",
      type:"task", status:"done", order:3, priority:"normal", checklist:[], linkedNoteIds:[nW2], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false,
      createdAt:new Date(new Date(yesterday + "T12:00:00").getTime() - 86400000).toISOString(),
      completedAt:new Date(yesterday + "T16:30:00").toISOString(), monthCompleted:monthKey },
    { id:tW5, sectionId:"work", title:"Schedule team standup", notes:"",
      type:"task", status:"done", order:4, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false,
      createdAt:new Date(new Date(twoDaysAgo + "T12:00:00").getTime() - 86400000).toISOString(),
      completedAt:new Date(twoDaysAgo + "T10:00:00").toISOString(), monthCompleted:monthKey },
    { id:tW6, sectionId:"work", title:"Refactor authentication module", notes:"Move to JWT-based flow. Low priority until Q3.",
      type:"task", status:"backlog", order:5, priority:"low", checklist:[], linkedNoteIds:[nW3], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },

    // Personal
    { id:tP1, sectionId:"personal", title:"Grocery shopping", notes:"",
      type:"task", status:"doing", order:0, priority:"normal",
      checklist:[{id:uid(),text:"Eggs and milk",done:false},{id:uid(),text:"Chicken breast",done:false},{id:uid(),text:"Vegetables",done:false},{id:uid(),text:"Olive oil",done:false}],
      linkedNoteIds:[], linkedTrackerIds:[], dueDate:today, dueTime:null, allDay:true,
      remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tP2, sectionId:"personal", title:"Call dentist for appointment", notes:"Ask about evening slots.",
      type:"task", status:"backlog", order:1, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:addDays(nextWeekMon, 2), dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tP3, sectionId:"personal", title:"Organize photo albums", notes:"Sort by year, back up to external drive.",
      type:"task", status:"backlog", order:2, priority:"low", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tP4, sectionId:"personal", title:"Plan weekend trip", notes:"Check cabin availability near the lake.",
      type:"task", status:"doing", order:3, priority:"normal", checklist:[], linkedNoteIds:[nP1], linkedTrackerIds:[],
      dueDate:in3days, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },

    // Health
    { id:tH1, sectionId:"health", title:"Register for 5K run", notes:"Early-bird registration closes soon.",
      type:"task", status:"doing", order:0, priority:"high", checklist:[], linkedNoteIds:[], linkedTrackerIds:[trH1],
      dueDate:in3days, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tH2, sectionId:"health", title:"Meal prep Sunday", notes:"",
      type:"task", status:"backlog", order:1, priority:"normal",
      checklist:[{id:uid(),text:"Plan meals",done:false},{id:uid(),text:"Buy ingredients",done:false},{id:uid(),text:"Cook and portion",done:false}],
      linkedNoteIds:[], linkedTrackerIds:[], dueDate:null, dueTime:null, allDay:true,
      remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tH3, sectionId:"health", title:"Book annual checkup", notes:"",
      type:"task", status:"done", order:2, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false,
      createdAt:new Date(new Date(threeDaysAgo + "T12:00:00").getTime() - 86400000).toISOString(),
      completedAt:new Date(threeDaysAgo + "T11:00:00").toISOString(), monthCompleted:monthKey },
    { id:tH4, sectionId:"health", title:"Research yoga classes", notes:"Look for beginner-friendly studios nearby.",
      type:"task", status:"backlog", order:3, priority:"normal", checklist:[], linkedNoteIds:[nH1], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },

    // Learning
    { id:tL1, sectionId:"learning", title:"Complete React course module 5", notes:"Covers hooks and context API.",
      type:"task", status:"doing", order:0, priority:"normal",
      checklist:[{id:uid(),text:"Watch lectures",done:true},{id:uid(),text:"Complete exercises",done:false},{id:uid(),text:"Submit quiz",done:false}],
      linkedNoteIds:[nL3], linkedTrackerIds:[], dueDate:dayAfterTmrw, dueTime:null, allDay:true,
      remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tL2, sectionId:"learning", title:"Read chapter 8 of Design Patterns", notes:"Observer and Strategy patterns.",
      type:"task", status:"doing", order:1, priority:"normal", checklist:[], linkedNoteIds:[nL2], linkedTrackerIds:[trL1],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tL3, sectionId:"learning", title:"Write blog post draft", notes:"Topic: lessons learned from the refactor project.",
      type:"task", status:"backlog", order:2, priority:"high", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:addDays(nextWeekMon, 4), dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false, createdAt:now, completedAt:null, monthCompleted:null },
    { id:tL4, sectionId:"learning", title:"Practice typing speed", notes:"",
      type:"task", status:"done", order:3, priority:"normal", checklist:[], linkedNoteIds:[], linkedTrackerIds:[],
      dueDate:null, dueTime:null, allDay:true, remindAt:null, remindFired:false, archived:false,
      createdAt:new Date(new Date(twoDaysAgo + "T12:00:00").getTime() - 86400000).toISOString(),
      completedAt:new Date(twoDaysAgo + "T15:00:00").toISOString(), monthCompleted:monthKey },
  ];

  // ── Notes
  var dateLabel = new Date(yesterday + "T12:00:00").toLocaleDateString("en-GB", {day:"numeric", month:"short", year:"numeric"});
  var notes = {
    work: [
      { id:nW1, parentId:null, title:"Weekly Standup Notes", order:0, createdAt:now, tags:["meeting","sprint"],
        linkedTaskIds:[tW1, tW2], linkedTrackerIds:[], remindAt:null, remindFired:false,
        content:"<h2>Sprint Review \u2014 Week 14</h2>" +
          "<p>Meeting held on <span class=\"note-date-chip\" data-date=\"" + yesterday + "\" contenteditable=\"false\">\uD83D\uDCC5 " + dateLabel + "</span></p>" +
          "<p>Action item: <span class=\"note-task-chip\" data-task-id=\"" + tW1 + "\" data-snapshot=\"Prepare Q2 report\" contenteditable=\"false\">\uD83D\uDCCC Prepare Q2 report</span></p>" +
          "<div class=\"note-callout\">Key takeaway: Focus on reducing response times before the quarterly review.</div>" +
          "<ul><li>Reviewed sprint velocity</li><li>Discussed blockers</li><li>Assigned action items</li></ul>" },
      { id:nW2, parentId:null, title:"Project Roadmap", order:1, createdAt:now, tags:["project","roadmap"],
        linkedTaskIds:[tW4], linkedTrackerIds:[], remindAt:null, remindFired:false,
        content:"<h2>Project Roadmap 2026</h2>" +
          "<div class=\"note-collapse\" data-open=\"true\"><div class=\"note-collapse-head\">Phase 1: Foundation</div><div class=\"note-collapse-body\"><p>Set up infrastructure, define API contracts, build authentication flow.</p></div></div>" +
          "<div class=\"note-collapse\" data-open=\"false\"><div class=\"note-collapse-head\">Phase 2: Core Features</div><div class=\"note-collapse-body\"><p>Implement dashboards, reporting, and notification system.</p></div></div>" },
      { id:nW3, parentId:null, title:"API Reference", order:2, createdAt:now, tags:["reference","api"],
        linkedTaskIds:[tW6], linkedTrackerIds:[], remindAt:null, remindFired:false,
        content:"<h2>API Reference</h2>" +
          "<table><thead><tr><th>Endpoint</th><th>Method</th><th>Description</th></tr></thead>" +
          "<tbody><tr><td>/api/users</td><td>GET</td><td>List all users</td></tr>" +
          "<tr><td>/api/users/:id</td><td>POST</td><td>Update user</td></tr>" +
          "<tr><td>/api/reports</td><td>GET</td><td>Generate report</td></tr></tbody></table>" },
    ],
    learning: [
      { id:nL1, parentId:null, title:"Reading List", order:0, createdAt:now, tags:["books"],
        linkedTaskIds:[tL2], linkedTrackerIds:[trL1], remindAt:null, remindFired:false,
        content:"<h2>Reading List</h2><ol><li>Design Patterns \u2014 Gang of Four</li><li>Clean Code \u2014 Robert C. Martin</li><li>The Pragmatic Programmer \u2014 Hunt & Thomas</li><li>Refactoring \u2014 Martin Fowler</li></ol>" },
      { id:nL2, parentId:nL1, title:"Design Patterns Notes", order:0, createdAt:now, tags:["books","patterns"],
        linkedTaskIds:[tL2], linkedTrackerIds:[], remindAt:null, remindFired:false,
        content:"<h2>Design Patterns Notes</h2><p>The <mark>Observer pattern</mark> defines a one-to-many dependency between objects so that when one changes state, all dependents are notified.</p>" +
          "<p>The <mark>Strategy pattern</mark> defines a family of algorithms and makes them interchangeable.</p>" },
      { id:nL3, parentId:null, title:"Course Progress", order:1, createdAt:now, tags:["course","react"],
        linkedTaskIds:[tL1], linkedTrackerIds:[], remindAt:null, remindFired:false,
        content:"<h2>React Course Progress</h2>" +
          "<ul data-type=\"taskList\">" +
          "<li data-type=\"taskItem\" data-checked=\"true\"><label><input type=\"checkbox\" checked=\"checked\"><span></span></label><div><p>Module 1: Introduction</p></div></li>" +
          "<li data-type=\"taskItem\" data-checked=\"true\"><label><input type=\"checkbox\" checked=\"checked\"><span></span></label><div><p>Module 2: Components</p></div></li>" +
          "<li data-type=\"taskItem\" data-checked=\"true\"><label><input type=\"checkbox\" checked=\"checked\"><span></span></label><div><p>Module 3: State Management</p></div></li>" +
          "<li data-type=\"taskItem\" data-checked=\"true\"><label><input type=\"checkbox\" checked=\"checked\"><span></span></label><div><p>Module 4: Routing</p></div></li>" +
          "<li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"><span></span></label><div><p>Module 5: Hooks & Context</p></div></li></ul>" },
    ],
    personal: [
      { id:nP1, parentId:null, title:"Trip Planning", order:0, createdAt:now, tags:["travel"],
        linkedTaskIds:[tP4], linkedTrackerIds:[], remindAt:null, remindFired:false,
        content:"<h2>Weekend Trip Planning</h2>" +
          "<div class=\"note-callout\">Book the cabin before Thursday \u2014 limited availability!</div>" +
          "<ul><li>Check weather forecast</li><li>Pack hiking gear</li><li>Prepare snacks and drinks</li><li>Charge camera batteries</li></ul>" },
    ],
    health: [
      { id:nH1, parentId:null, title:"Workout Log", order:0, createdAt:now, tags:["fitness"],
        linkedTaskIds:[tH4], linkedTrackerIds:[trH1], remindAt:null, remindFired:false,
        content:"<h2>Workout Log</h2>" +
          "<table><thead><tr><th>Date</th><th>Activity</th><th>Duration</th></tr></thead>" +
          "<tbody><tr><td>" + threeDaysAgo + "</td><td>Morning run</td><td>30 min</td></tr>" +
          "<tr><td>" + twoDaysAgo + "</td><td>Yoga</td><td>45 min</td></tr>" +
          "<tr><td>" + yesterday + "</td><td>Morning run</td><td>35 min</td></tr></tbody></table>" },
    ],
  };

  // ── Trackers with 28 days of historical completions
  var trackerDefs = [
    { id:trH1, title:"Morning Run",    sectionId:"health",   color:"#1A7A43", mode:"habit",  activeDays:[1,1,1,1,1,0,0], linkedTaskIds:[tH1], linkedNoteIds:[nH1], order:0 },
    { id:trL1, title:"Read 30 Minutes",sectionId:"learning", color:"#4B3FC7", mode:"habit",  activeDays:[1,1,1,1,1,1,1], linkedTaskIds:[tL2], linkedNoteIds:[nL1], order:1 },
    { id:trH2, title:"Drink Water",    sectionId:"health",   color:"#0C7B7B", mode:"tally",  activeDays:[1,1,1,1,1,1,1], linkedTaskIds:[],    linkedNoteIds:[],    order:2 },
    { id:trP1, title:"Meditate",       sectionId:"personal", color:"#8B6A30", mode:"habit",  activeDays:[1,1,1,1,1,1,1], linkedTaskIds:[],    linkedNoteIds:[],    order:3 },
    { id:trC1, title:"Coffees",        sectionId:null,       color:"#8B5E3C", mode:"tally",  activeDays:[1,1,1,1,1,1,1], linkedTaskIds:[],    linkedNoteIds:[],    order:4 },
    { id:trL2, title:"Code Practice",  sectionId:"learning", color:"#C43A3A", mode:"habit",  activeDays:[1,1,1,1,1,0,0], linkedTaskIds:[],    linkedNoteIds:[],    order:5 },
  ];

  var trackers = trackerDefs.map(function(def, tIdx) {
    var completions = {};
    for (var dayOff = 0; dayOff < 28; dayOff++) {
      var dStr = addDays(today, -(27 - dayOff));
      var di = dayIndex(dStr);
      if (!def.activeDays[di]) continue;
      if (def.mode === "habit") {
        if ((dayOff * 7 + tIdx) % 10 < 7) completions[dStr] = true;
      } else if (def.title === "Drink Water") {
        completions[dStr] = 2 + (dayOff % 4);
      } else {
        completions[dStr] = 1 + (dayOff % 3);
      }
    }
    return { id:def.id, title:def.title, sectionId:def.sectionId, color:def.color, mode:def.mode,
      activeDays:def.activeDays, completions:completions, linkedTaskIds:def.linkedTaskIds,
      linkedNoteIds:def.linkedNoteIds, order:def.order, archived:false, createdAt:now };
  });

  // ── Timetable — current week + last week
  var tt = {};
  var weekDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  var makeBlock = function(typ, sec, lbl, s, e, links) {
    return { id:uid(), type:typ, sectionId:sec, label:lbl, start:s, end:e, linkedItems:links || [] };
  };

  // Current week
  tt[thisWeekMon] = {};
  tt[thisWeekMon]["Monday"] = [
    makeBlock("section","work","Morning Focus","09:00","11:00",[{type:"task",id:tW1,snapshot:"Prepare Q2 report"}]),
    makeBlock("section","work","Team Standup","11:15","11:45",[{type:"note",id:nW1,snapshot:"Weekly Standup Notes"}]),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","work","Client Work","14:00","16:00",[{type:"task",id:tW2,snapshot:"Client presentation slides"}]),
    makeBlock("section","health","Exercise","17:00","18:00",[{type:"tracker",id:trH1,snapshot:"Morning Run"}]),
  ];
  tt[thisWeekMon]["Tuesday"] = [
    makeBlock("section","work","Deep Work","09:00","11:30"),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","learning","Learning Block","14:00","15:30",[{type:"task",id:tL1,snapshot:"Complete React course module 5"}]),
    makeBlock("section","work","Admin Tasks","16:00","17:00"),
  ];
  tt[thisWeekMon]["Wednesday"] = [
    makeBlock("section","work","Sprint Planning","09:00","10:00"),
    makeBlock("section","work","Code Review","10:15","12:00",[{type:"task",id:tW3,snapshot:"Review pull requests"}]),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","personal","Errands","14:00","15:00",[{type:"task",id:tP1,snapshot:"Grocery shopping"}]),
    makeBlock("section","health","Yoga","17:30","18:30"),
  ];
  tt[thisWeekMon]["Thursday"] = [
    makeBlock("section","work","Morning Focus","09:00","11:00",[{type:"task",id:tW1,snapshot:"Prepare Q2 report"},{type:"note",id:nW2,snapshot:"Project Roadmap"}]),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","learning","Reading Time","14:00","15:00",[{type:"task",id:tL2,snapshot:"Read chapter 8 of Design Patterns"}]),
    makeBlock("section","work","Meetings","15:30","17:00"),
  ];
  tt[thisWeekMon]["Friday"] = [
    makeBlock("section","work","Weekly Review","09:00","10:00"),
    makeBlock("section","work","Documentation","10:15","12:00",[{type:"note",id:nW3,snapshot:"API Reference"}]),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","learning","Blog Writing","14:00","15:30",[{type:"task",id:tL3,snapshot:"Write blog post draft"}]),
  ];

  tt[thisWeekMon]["Saturday"] = [
    makeBlock("section","health","Morning Run","08:00","09:00",[{type:"tracker",id:trH1,snapshot:"Morning Run"}]),
    makeBlock("section","personal","Errands & Chores","10:00","12:00",[{type:"task",id:tP1,snapshot:"Grocery shopping"}]),
    makeBlock("break",null,"Lunch","12:30","13:30"),
    makeBlock("section","learning","Reading","14:00","15:30",[{type:"task",id:tL2,snapshot:"Read chapter 8 of Design Patterns"}]),
  ];
  tt[thisWeekMon]["Sunday"] = [
    makeBlock("section","health","Yoga","09:00","10:00"),
    makeBlock("section","personal","Trip Planning","10:30","12:00",[{type:"task",id:tP4,snapshot:"Plan weekend trip"},{type:"note",id:nP1,snapshot:"Trip Planning"}]),
    makeBlock("break",null,"Lunch","12:30","13:30"),
    makeBlock("section","health","Meal Prep","14:00","16:00",[{type:"task",id:tH2,snapshot:"Meal prep Sunday"}]),
  ];

  // Last week (lighter, for historical data)
  tt[lastWeekMon] = {};
  tt[lastWeekMon]["Monday"] = [
    makeBlock("section","work","Morning Focus","09:00","11:00"),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","work","Afternoon Work","14:00","16:30"),
    makeBlock("section","health","Run","17:00","18:00"),
  ];
  tt[lastWeekMon]["Tuesday"] = [
    makeBlock("section","work","Deep Work","09:00","11:30"),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","learning","Study Session","14:00","16:00"),
  ];
  tt[lastWeekMon]["Wednesday"] = [
    makeBlock("section","work","Meetings","09:00","11:00"),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","work","Code Review","14:00","16:00"),
    makeBlock("section","health","Exercise","17:00","18:00"),
  ];
  tt[lastWeekMon]["Thursday"] = [
    makeBlock("section","work","Project Work","09:00","12:00"),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","learning","Reading","14:00","15:30"),
  ];
  tt[lastWeekMon]["Friday"] = [
    makeBlock("section","work","Weekly Review","09:00","10:30"),
    makeBlock("break",null,"Lunch","12:00","13:00"),
    makeBlock("section","work","Wrap-up","14:00","16:00"),
  ];
  tt[lastWeekMon]["Saturday"] = [
    makeBlock("section","health","Morning Run","08:00","09:00"),
    makeBlock("section","personal","Household","10:00","12:00"),
    makeBlock("section","learning","Side Project","14:00","16:00"),
  ];
  tt[lastWeekMon]["Sunday"] = [
    makeBlock("section","health","Yoga","09:00","10:00"),
    makeBlock("section","personal","Free Time","11:00","13:00"),
    makeBlock("section","health","Meal Prep","14:00","16:00"),
  ];

  // ── Template
  var template = {
    id:uid(), name:"Standard Work Week", color:"#0C7B7B",
    blocks:{
      Monday:[
        {id:uid(),type:"section",sectionId:"work",label:"Morning Focus",start:"09:00",end:"11:00",linkedItems:[]},
        {id:uid(),type:"break",sectionId:null,label:"Lunch",start:"12:00",end:"13:00",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"work",label:"Afternoon Work",start:"14:00",end:"16:30",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"health",label:"Exercise",start:"17:00",end:"18:00",linkedItems:[]},
      ],
      Tuesday:[
        {id:uid(),type:"section",sectionId:"work",label:"Deep Work",start:"09:00",end:"11:30",linkedItems:[]},
        {id:uid(),type:"break",sectionId:null,label:"Lunch",start:"12:00",end:"13:00",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"learning",label:"Learning Block",start:"14:00",end:"15:30",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"work",label:"Admin",start:"16:00",end:"17:00",linkedItems:[]},
      ],
      Wednesday:[
        {id:uid(),type:"section",sectionId:"work",label:"Sprint Planning",start:"09:00",end:"10:00",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"work",label:"Code Review",start:"10:15",end:"12:00",linkedItems:[]},
        {id:uid(),type:"break",sectionId:null,label:"Lunch",start:"12:00",end:"13:00",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"work",label:"Project Work",start:"14:00",end:"16:30",linkedItems:[]},
      ],
      Thursday:[
        {id:uid(),type:"section",sectionId:"work",label:"Morning Focus",start:"09:00",end:"11:00",linkedItems:[]},
        {id:uid(),type:"break",sectionId:null,label:"Lunch",start:"12:00",end:"13:00",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"learning",label:"Reading Time",start:"14:00",end:"15:00",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"work",label:"Meetings",start:"15:30",end:"17:00",linkedItems:[]},
      ],
      Friday:[
        {id:uid(),type:"section",sectionId:"work",label:"Weekly Review",start:"09:00",end:"10:00",linkedItems:[]},
        {id:uid(),type:"section",sectionId:"work",label:"Documentation",start:"10:15",end:"12:00",linkedItems:[]},
        {id:uid(),type:"break",sectionId:null,label:"Lunch",start:"12:00",end:"13:00",linkedItems:[]},
      ],
      Saturday:[],
      Sunday:[],
    },
  };

  return { sections:sections, tasks:tasks, notes:notes, trackers:trackers, tt:tt, templates:[template] };
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
    mode:          t.mode          ?? "habit",
    activeDays:    t.activeDays    ?? [1,1,1,1,1,0,0],
    completions:   t.completions   ?? {},
    linkedTaskIds: t.linkedTaskIds ?? [],
    linkedNoteIds: t.linkedNoteIds ?? [],
    archived:      t.archived      ?? false,
    config:        t.config        ?? null,
  }));
}

const PRIORITY = {
  high:   {label:"↑ High",  color:"#C43A3A", bg:"#FAE8E8"},
  normal: null,
  low:    {label:"↓ Low",   color:"#9B8E80", bg:"#EBE4D8"},
};

// ─── Tiptap Custom Extensions ────────────────────────────────────────────────

var CalloutNode = TiptapNode ? TiptapNode.create({
  name: "callout",
  group: "block",
  content: "inline*",
  defining: true,
  parseHTML: function() { return [{ tag: "div.note-callout" }]; },
  renderHTML: function(p) {
    return ["div", mergeAttributes(p.HTMLAttributes, { class: "note-callout" }), 0];
  },
  addInputRules: function() {
    var t = this.type;
    return [wrappingInputRule({ find: /^>\s$/, type: t })];
  },
}) : null;

var DateChipNode = TiptapNode ? TiptapNode.create({
  name: "dateChip",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: function() {
    return {
      date: { default: null, parseHTML: function(el) { return el.getAttribute("data-date"); } },
    };
  },
  parseHTML: function() { return [{ tag: "span.note-date-chip" }]; },
  renderHTML: function(p) {
    var d = p.node.attrs.date;
    var label = d ? new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "?";
    return ["span", { class: "note-date-chip", "data-date": d, contenteditable: "false" }, "\uD83D\uDCC5 " + label];
  },
}) : null;

var TaskChipNode = TiptapNode ? TiptapNode.create({
  name: "taskChip",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: function() {
    return {
      taskId:   { default: null, parseHTML: function(el) { return el.getAttribute("data-task-id"); } },
      snapshot: { default: "",   parseHTML: function(el) { return el.getAttribute("data-snapshot") || el.textContent.replace(/^\uD83D\uDCCC\s*/, ""); } },
    };
  },
  parseHTML: function() { return [{ tag: "span.note-task-chip" }]; },
  renderHTML: function(p) {
    var a = p.node.attrs;
    return ["span", { class: "note-task-chip", "data-task-id": a.taskId, "data-snapshot": a.snapshot, contenteditable: "false" }, "\uD83D\uDCCC " + a.snapshot];
  },
}) : null;

function NoteImageView(props) {
  var path = props.node.attrs.path;
  var width = props.node.attrs.width;
  var updateAttrs = props.updateAttributes;
  var selected = props.selected;
  var imgSrc = useState(null);
  var src = imgSrc[0];
  var setSrc = imgSrc[1];
  var resizing = useRef(false);
  var startX = useRef(0);
  var startW = useRef(0);
  var imgRef = useRef(null);

  useEffect(function() {
    if (!path) return;
    if (path.indexOf("data:") === 0) { setSrc(path); return; }
    var cancelled = false;
    var ext = (path.split(".").pop() || "png").toLowerCase();
    var mime = {png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",svg:"image/svg+xml"}[ext] || "image/png";
    var fs = window.__TAURI__ && window.__TAURI__.fs;
    if (fs && fs.readFile) {
      fs.readFile(path, {baseDir: undefined}).then(function(bytes) {
        if (cancelled) return;
        var binary = "";
        var arr = new Uint8Array(bytes);
        for (var i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
        setSrc("data:" + mime + ";base64," + btoa(binary));
      }).catch(function(e) { console.error("Image load error:", e); });
    }
    return function() { cancelled = true; };
  }, [path]);

  var onResizeStart = function(e) {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = imgRef.current ? imgRef.current.offsetWidth : (width || 400);
    var onMove = function(ev) {
      if (!resizing.current) return;
      var newW = Math.max(80, startW.current + (ev.clientX - startX.current));
      if (imgRef.current) imgRef.current.style.width = newW + "px";
    };
    var onUp = function(ev) {
      if (!resizing.current) return;
      resizing.current = false;
      var finalW = Math.max(80, startW.current + (ev.clientX - startX.current));
      if (updateAttrs) updateAttrs({ width: finalW });
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  var wrapStyle = { position: "relative", display: "inline-block", maxWidth: "100%" };
  if (selected) wrapStyle.outline = "2px solid #C8A86B";
  wrapStyle.borderRadius = "8px";

  var imgStyle = { display: "block", borderRadius: "8px", cursor: "pointer", maxWidth: "100%" };
  if (width) imgStyle.width = width + "px";

  return React.createElement(NodeViewWrapper, {className: "note-img-wrap"},
    src ? React.createElement("div", {style: wrapStyle},
      React.createElement("img", {ref: imgRef, className: "note-img", src: src, "data-path": path, alt: "", draggable: false, style: imgStyle}),
      selected ? React.createElement("div", {
        onMouseDown: onResizeStart,
        style: {position:"absolute",bottom:4,right:4,width:14,height:14,background:"#C8A86B",borderRadius:2,cursor:"nwse-resize",border:"2px solid #FDFAF6"}
      }) : null
    ) : React.createElement("div", {style: {padding: "12px 16px", color: "#9B8E80", fontSize: 12, fontStyle: "italic"}}, "Loading image\u2026")
  );
}

var NoteImageNode = TiptapNode ? TiptapNode.create({
  name: "noteImage",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: function() {
    return {
      path: { default: null, parseHTML: function(el) { return el.getAttribute("data-path"); } },
      width: {
        default: null,
        parseHTML: function(el) {
          var w = el.getAttribute("data-width") || el.style.width;
          return w ? parseInt(w, 10) : null;
        },
        renderHTML: function(attrs) {
          return attrs.width ? { "data-width": attrs.width, style: "width:" + attrs.width + "px" } : {};
        },
      },
    };
  },
  parseHTML: function() { return [{ tag: "img[data-path]" }, { tag: "img.note-img" }]; },
  renderHTML: function(p) {
    var a = p.node.attrs;
    var htmlAttrs = { class: "note-img", "data-path": a.path, alt: "" };
    if (a.width) { htmlAttrs["data-width"] = a.width; htmlAttrs.style = "width:" + a.width + "px"; }
    return ["img", htmlAttrs];
  },
  addNodeView: function() { return ReactNodeViewRenderer(NoteImageView); },
}) : null;

var CollapsibleTitle = TiptapNode ? TiptapNode.create({
  name: "collapsibleTitle",
  content: "inline*",
  defining: true,
  parseHTML: function() {
    return [{
      tag: "div.note-collapse-head",
      getContent: function(el, schema) {
        var ts = el.querySelector(".note-collapse-title");
        if (ts) {
          var frag = schema.nodeFromJSON({ type: "collapsibleTitle", content: [{ type: "text", text: ts.textContent || "Section" }] });
          return frag.content;
        }
        return null;
      },
    }];
  },
  renderHTML: function(p) {
    return ["div", { class: "note-collapse-head" },
      ["span", { class: "note-collapse-arrow" }, "\u25B6"],
      ["span", mergeAttributes(p.HTMLAttributes, { class: "note-collapse-title" }), 0],
      ["button", { class: "note-collapse-del", contenteditable: "false", title: "Remove section" }, "\u00D7"],
    ];
  },
}) : null;

var CollapsibleBody = TiptapNode ? TiptapNode.create({
  name: "collapsibleBody",
  content: "block+",
  defining: true,
  parseHTML: function() { return [{ tag: "div.note-collapse-body" }]; },
  renderHTML: function(p) {
    return ["div", mergeAttributes(p.HTMLAttributes, { class: "note-collapse-body" }), 0];
  },
}) : null;

var CollapsibleNode = TiptapNode ? TiptapNode.create({
  name: "collapsible",
  group: "block",
  content: "collapsibleTitle collapsibleBody",
  defining: true,
  addAttributes: function() {
    return {
      open: {
        default: false,
        parseHTML: function(el) { return el.hasAttribute("data-open"); },
        renderHTML: function(attrs) { return attrs.open ? { "data-open": "" } : {}; },
      },
    };
  },
  parseHTML: function() { return [{ tag: "div.note-collapse" }]; },
  renderHTML: function(p) {
    return ["div", mergeAttributes(p.HTMLAttributes, { class: "note-collapse" }), 0];
  },
}) : null;

var FontSizeMark = TiptapMark ? TiptapMark.create({
  name: "fontSize",
  addAttributes: function() {
    return {
      size: {
        default: null,
        parseHTML: function(el) { return el.style.fontSize || null; },
        renderHTML: function(attrs) { return attrs.size ? { style: "font-size:" + attrs.size } : {}; },
      },
    };
  },
  parseHTML: function() {
    return [{ tag: "span", getAttrs: function(el) { return el.style.fontSize ? {} : false; } }];
  },
  renderHTML: function(p) {
    return ["span", mergeAttributes(p.HTMLAttributes), 0];
  },
}) : null;

var LegacyFontColor = TiptapExtension ? TiptapExtension.create({
  name: "legacyFontColor",
  addGlobalAttributes: function() {
    return [{
      types: ["textStyle"],
      attributes: {
        color: {
          parseHTML: function(el) {
            if (el.tagName === "FONT" && el.getAttribute("color")) return el.getAttribute("color");
            return null;
          },
          renderHTML: function(attrs) {
            if (!attrs.color) return {};
            return { style: "color:" + attrs.color };
          },
        },
      },
    }];
  },
  addParsing: function() { return []; },
}) : null;

var TIPTAP_BASE_EXTENSIONS = (function() {
  if (!TiptapDoc) return [];
  return [
    TiptapDoc,
    TiptapParagraph,
    TiptapText,
    TiptapBold,
    TiptapItalic,
    TiptapUnderline,
    TiptapHeading.configure({ levels: [1, 2, 3] }),
    TiptapBulletList,
    TiptapOrderedList,
    TiptapListItem,
    TiptapHardBreak,
    TiptapHistory,
    TiptapDropcursor.configure({ color: "#C8A86B" }),
    TiptapGapcursor,
    TiptapTextStyle,
    TiptapColor,
    TiptapFontFamily,
    FontSizeMark,
    CalloutNode,
    CollapsibleNode,
    CollapsibleTitle,
    CollapsibleBody,
    DateChipNode,
    TaskChipNode,
    NoteImageNode,
    TiptapTable ? TiptapTable.configure({ resizable: false }) : null,
    TiptapTableRow,
    TiptapTableCell,
    TiptapTableHeader,
    TiptapTaskList,
    TiptapTaskItem ? TiptapTaskItem.configure({ nested: true }) : null,
    TiptapCodeBlock,
    TiptapHorizontalRule,
    TiptapSubscript,
    TiptapSuperscript,
    TiptapHighlight ? TiptapHighlight.configure({ multicolor: true }) : null,
    TiptapTextAlign ? TiptapTextAlign.configure({ types: ["heading", "paragraph"] }) : null,
    TiptapCharacterCount,
  ].filter(Boolean);
})();

function restoreNoteImages(domEl) {
  if (!domEl) return;
  var fs = window.__TAURI__ && window.__TAURI__.fs;
  if (!fs || !fs.readFile) return;
  domEl.querySelectorAll("img[data-path]").forEach(function(img) {
    if (img.src && img.src.indexOf("data:") === 0) return;
    var path = img.dataset.path;
    if (!path) return;
    var ext = (path.split(".").pop() || "png").toLowerCase();
    var mime = {png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",svg:"image/svg+xml"}[ext] || "image/png";
    fs.readFile(path, {baseDir: undefined}).then(function(bytes) {
      var binary = "";
      var arr = new Uint8Array(bytes);
      for (var i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
      img.src = "data:" + mime + ";base64," + btoa(binary);
    }).catch(function(e) { console.error("Image load error:", e); });
  });
}

