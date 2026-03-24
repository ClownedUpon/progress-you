// ─── Error Boundary ──────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { this.setState({ errorInfo }); console.error("ErrorBoundary caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error ? this.state.error.toString() : "Unknown error";
      const stack = this.state.errorInfo ? this.state.errorInfo.componentStack : "";
      return React.createElement("div", {
        style: {
          minHeight: "100vh", background: "#F8F3EC", display: "flex", alignItems: "center",
          justifyContent: "center", padding: 40, fontFamily: '"DM Sans", sans-serif'
        }
      },
        React.createElement("div", {
          style: {
            background: "#FDFAF6", borderRadius: 16, padding: "36px 40px", maxWidth: 560,
            width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #E3D9CC",
            textAlign: "center"
          }
        },
          React.createElement("div", { style: { fontSize: 36, marginBottom: 14 } }, "\u26A0"),
          React.createElement("h1", {
            style: { fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700,
              color: "#1C1714", marginBottom: 10 }
          }, "Something went wrong"),
          React.createElement("p", {
            style: { fontSize: 13, color: "#6B5E4E", lineHeight: 1.6, marginBottom: 20 }
          }, "Your data is safe \u2014 it\u2019s stored separately and has not been affected. Try refreshing the app to continue."),
          React.createElement("div", {
            style: {
              background: "#F3EDE3", borderRadius: 10, padding: "14px 16px", marginBottom: 20,
              textAlign: "left", maxHeight: 160, overflowY: "auto", border: "1px solid #E3D9CC"
            }
          },
            React.createElement("div", {
              style: { fontSize: 10, fontWeight: 700, color: "#7A6C5E", letterSpacing: "0.6px",
                textTransform: "uppercase", marginBottom: 6 }
            }, "Error Details"),
            React.createElement("pre", {
              style: { fontSize: 11, color: "#C43A3A", fontFamily: '"JetBrains Mono", monospace',
                whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }
            }, errMsg),
            stack ? React.createElement("pre", {
              style: { fontSize: 10, color: "#9B8E80", fontFamily: '"JetBrains Mono", monospace',
                whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "8px 0 0", maxHeight: 80, overflowY: "auto" }
            }, stack.trim()) : null
          ),
          React.createElement("button", {
            onClick: () => window.location.reload(),
            style: {
              padding: "10px 28px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "#1C1714", color: "#F8F3EC", fontFamily: '"DM Sans", sans-serif',
              fontSize: 13, fontWeight: 600
            }
          }, "Refresh App")
        )
      );
    }
    return this.props.children;
  }
}

// ─── App Root ─────────────────────────────────────────────────────────────────

function App() {
  const [view,      setView]      = useState("today");
  const [week,      setWeek]      = useState(()=>mondayOf(new Date()));
  const [sections,  setSections]  = useState(DEFAULT_SECTIONS);
  const [tt,        setTt]        = useState({});
  const [tasks,     setTasks]     = useState([]);
  const [notes,     setNotes]     = useState({});
  const [ready,     setReady]     = useState(false);
  const [showSett,  setShowSett]  = useState(false);
  const [showIO,    setShowIO]    = useState(false);
  const [showCap,   setShowCap]   = useState(false);
  const [dialog,    setDialog]    = useState(null);
  const [updateInfo,setUpdateInfo]= useState(null);
  const [showUpdate,setShowUpdate]= useState(false);
  const [ctxMenu,  setCtxMenu]   = useState(null);
  const openCtx = (e, items) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({x:e.clientX,y:e.clientY,items}); };
  const [navStack,    setNavStack]    = useState([]);
  function navigateTo(item){ setNavStack(s=>[...s,item]); }
  function navigateToFresh(item){ setNavStack([item]); }
  function navigateBack(){ setNavStack(s=>s.slice(0,-1)); }
  function navigateToDate(dateStr){ setNavStack([]); setView("timetable"); setWeek(mondayOf(new Date(dateStr+"T12:00:00"))); }
  const [lastBoardSec, setLastBoardSec] = useState(null);
  const [showPin,      setShowPin]      = useState(false);
  const [pinnedNoteId, setPinnedNoteId] = useState(null);
  const [showNotePicker, setShowNotePicker] = useState(false);
  const [notePickerQ, setNotePickerQ] = useState("");
  const [lastNoteKey,  setLastNoteKey]  = useState({sec:null,id:null});
  const [templates,    setTemplates]    = useState([]);
  const [setBlocks,    setSetBlocks]    = useState([]);
  const [showSearch,   setShowSearch]   = useState(false);
  const [trackers,     setTrackers]     = useState([]);
  const [undoStack,    setUndoStack]    = useState([]);
  const undoTimers = useRef({});

  useEffect(()=>{
    const isDev=!!window.location.port;
    if(!isDev) document.addEventListener('contextmenu', e => e.preventDefault());
    (async()=>{
      try { if(window.__TAURI__?.fs){ const { mkdir, BaseDirectory } = window.__TAURI__.fs; await mkdir(".", { baseDir: BaseDirectory.AppData, recursive: true }); } } catch(e) {}
      const sec=await sget("py-sections");
      const t  =await sget("py-tt");
      const k  =await sget("py-tasks");
      const n  =await sget("py-notes");
      const tmpl=await sget('py-tt-templates');
      const sb=await sget('py-tt-setblocks');
      const trk=await sget('py-trackers');
      const isFirstRun = !sec && !t && !k && !n && !tmpl && !sb && !trk;
      if (isFirstRun) {
        try {
          const seed = buildSeedData();
          setTasks(seed.tasks);
          setNotes(seed.notes);
          setTrackers(seed.trackers);
          setTt(seed.tt);
        } catch(e) { console.error("Seed data error:", e); }
      } else {
        if(sec) setSections(sec);
        if(t) { const migrated = migrateTt(t); const pruned = await pruneTt(migrated); setTt(pruned); }
        if(k)   setTasks(migrateTasks(k));
        if(n)   setNotes(migrateNotes(n));
        if(tmpl) setTemplates(tmpl);
        if(sb)   setSetBlocks(sb);
        if(trk)  setTrackers(migrateTrackers(trk));
      }
      setReady(true);
      checkForUpdate();
      runBackupIfDue();
    })();
  },[]);
  useEffect(()=>{ if(ready) ssetDebounced("py-sections",sections); },[sections,ready]);
  useEffect(()=>{ if(ready) ssetDebounced('py-tt-templates',templates); },[templates,ready]);
  useEffect(()=>{ if(ready) ssetDebounced('py-tt-setblocks',setBlocks); },[setBlocks,ready]);
  useEffect(()=>{ if(ready) ssetDebounced("py-tt",tt); },[tt,ready]);
  useEffect(()=>{ if(ready) ssetDebounced("py-tasks",tasks); },[tasks,ready]);
  useEffect(()=>{ if(ready) ssetDebounced("py-notes",notes); },[notes,ready]);
  useEffect(()=>{ if(ready) ssetDebounced("py-trackers",trackers); },[trackers,ready]);

  // ── Undo system — tracks last 5 destructive actions
  function pushUndo(title,detail,undoFn){
    const id=uid();
    setUndoStack(prev=>[{id,title,detail,undoFn},...prev].slice(0,5));
    undoTimers.current[id]=setTimeout(()=>{
      setUndoStack(prev=>prev.filter(u=>u.id!==id));
      delete undoTimers.current[id];
    },5000);
  }
  function executeUndo(id){
    setUndoStack(prev=>{
      const entry=prev.find(u=>u.id===id);
      if(entry){ entry.undoFn(); clearTimeout(undoTimers.current[id]); delete undoTimers.current[id]; }
      return prev.filter(u=>u.id!==id);
    });
  }
  function dismissUndo(id){
    clearTimeout(undoTimers.current[id]); delete undoTimers.current[id];
    setUndoStack(prev=>prev.filter(u=>u.id!==id));
  }

  // ── Reminder engine — polls every 30s
  const [toasts, setToasts] = useState([]); // in-app fallback banners
  function fireReminder(title, body){
    // Native notification via Tauri invoke command
    try{ window.__TAURI__?.core?.invoke("fire_notification",{title,body,appName:"Progress You"}); }catch(e){}
    // In-app toast banner (always shown as confirmation)
    const id=uid();
    setToasts(p=>[...p,{id,title,body}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),6000);
  }
  useEffect(()=>{
    function checkReminders(){
      const now=new Date();
      setTasks(prev=>{
        let changed=false;
        const next=prev.map(t=>{
          if(!t.remindAt||t.remindFired||new Date(t.remindAt)>now) return t;
          changed=true;
          fireReminder("Task reminder",t.title);
          return{...t,remindFired:true};
        });
        return changed?next:prev;
      });
      setNotes(prev=>{
        let changed=false;
        const next={};
        for(const [sid,arr] of Object.entries(prev)){
          next[sid]=(Array.isArray(arr)?arr:[]).map(n=>{
            if(!n.remindAt||n.remindFired||new Date(n.remindAt)>now) return n;
            changed=true;
            fireReminder("Note reminder",n.title);
            return{...n,remindFired:true};
          });
        }
        return changed?next:prev;
      });
    }
    const id=setInterval(checkReminders,15000);
    return()=>clearInterval(id);
  },[]);

  // Global keyboard shortcut: Ctrl/Cmd+Space → Quick Capture
  useEffect(()=>{
    const handler = e => {
      if((e.ctrlKey||e.metaKey) && e.code==="Space") { e.preventDefault(); setShowCap(true); }
      if((e.ctrlKey||e.metaKey) && e.key==="k") { e.preventDefault(); setShowSearch(true); }
      if(e.key==="F3"||e.key==="F7") { e.preventDefault(); }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  const byId = Object.fromEntries(sections.map(s=>[s.id,s]));

  // ── Timetable ops
  const getDayBlocks=day=>[...((tt[week]||{})[day]||[])].sort((a,b)=>a.start.localeCompare(b.start));
  function upsertBlock(day,blk,insertBeforeId=null){
    setTt(prev=>{
      const w={...(prev[week]||{})},arr=[...(w[day]||[])];
      const i=arr.findIndex(b=>b.id===blk.id);
      if(i>=0){ arr[i]=blk; }
      else if(insertBeforeId){ const bi=arr.findIndex(b=>b.id===insertBeforeId); arr.splice(bi>=0?bi:arr.length,0,blk); }
      else arr.push(blk);
      return{...prev,[week]:{...w,[day]:arr}};
    });
  }
  function deleteBlock(day,id){
    const blocks=(tt[week]||{})[day]||[];
    const block=blocks.find(b=>b.id===id);
    const capturedWeek=week;
    setTt(prev=>{const w={...(prev[capturedWeek]||{})};return{...prev,[capturedWeek]:{...w,[day]:(w[day]||[]).filter(b=>b.id!==id)}};});
    if(block) pushUndo("Block deleted",block.label||"Block",()=>{
      setTt(prev=>{const w={...(prev[capturedWeek]||{})};return{...prev,[capturedWeek]:{...w,[day]:[...(w[day]||[]),block]}};});
    });
  }
  function copyPrevWeek(){
    const prev=shiftWeek(week,-1);
    if(!tt[prev]) { setDialog({message:"No timetable data found for last week.",onClose:()=>setDialog(null)}); return; }
    setDialog({
      message:"Copy last week's timetable?",
      detail:"This will replace any blocks already added for this week.",
      confirmLabel:"Copy",
      onConfirm:()=>{ setTt(p=>({...p,[week]:JSON.parse(JSON.stringify(tt[prev]))})); setDialog(null); },
      onClose:()=>setDialog(null)
    });
  }

  // ── Template ops
  function addTemplate(t)    { setTemplates(p=>[...p,t]); }
  function updateTemplate(t) { setTemplates(p=>p.map(x=>x.id===t.id?t:x)); }
  function deleteTemplate(id){ setTemplates(p=>p.filter(x=>x.id!==id)); }
  function addSetBlock(blk){
    const sb={id:uid(),type:blk.type,sectionId:blk.sectionId||null,label:blk.label||"",start:blk.start,end:blk.end};
    setSetBlocks(p=>[...p.filter(x=>!(x.type===sb.type&&x.sectionId===sb.sectionId&&x.label===sb.label&&x.start===sb.start&&x.end===sb.end)),sb]);
  }
  function removeSetBlock(id){ setSetBlocks(p=>p.filter(x=>x.id!==id)); }
  function reorderSetBlock(dragId,dropId){ setSetBlocks(function(p){ var fi=p.findIndex(function(x){return x.id===dragId;}); var ti=p.findIndex(function(x){return x.id===dropId;}); if(fi<0||ti<0||fi===ti)return p; var a=p.slice(); var item=a.splice(fi,1)[0]; a.splice(ti,0,item); return a; }); }

  function applyTemplate(tmpl,mode){
    if(mode==="confirm"){
      setDialog({
        message:`Apply template "${tmpl.name}"?`,
        detail:"Replace this week's blocks, or merge (keeps existing blocks)?",
        confirmLabel:"Replace",
        onConfirm:()=>{ applyTemplate(tmpl,"replace"); setDialog(null); },
        onExtra:  ()=>{ applyTemplate(tmpl,"merge");   setDialog(null); },
        extraLabel:"Merge",
        onClose:()=>setDialog(null)
      });
      return;
    }
    setTt(prev=>{
      const w=mode==="merge"?{...(prev[week]||{})}:{};
      DAYS.forEach(day=>{
        const newBlocks=(tmpl.blocks[day]||[]).map(b=>({...b,id:uid()}));
        if(mode==="merge"){ w[day]=[...(w[day]||[]),...newBlocks]; }
        else { w[day]=newBlocks; }
      });
      return{...prev,[week]:w};
    });
  }

  // ── Task ops
  function addTask(sid,title,notesT,extra={}){
    setTasks(prev=>{
      const maxOrder=prev.filter(t=>t.sectionId===sid).reduce((m,t)=>Math.max(m,t.order??0),0);
      return[{
        id:extra.id||uid(),sectionId:sid,title,notes:notesT,
        type:extra.type||"task",status:extra.status||"backlog",
        order:maxOrder+1,priority:extra.priority||"normal",
        checklist:[],linkedNoteIds:[],linkedTrackerIds:[],
        dueDate:extra.dueDate||null,dueTime:null,allDay:true,remindAt:null,remindFired:false,
        createdAt:Date.now(),completedAt:null,monthCompleted:null
      },...prev];
    });
  }
  function updateTask(id,upd){ setTasks(p=>p.map(t=>t.id===id?{...t,...upd}:t)); }
  function deleteTask(id){
    const task=tasks.find(t=>t.id===id);
    setTasks(p=>p.filter(t=>t.id!==id));
    if(task&&task.type!=="spacer") pushUndo("Task deleted",task.title,()=>setTasks(prev=>[task,...prev]));
  }
  function completeTask(id){
    const task=tasks.find(t=>t.id===id);
    const now=Date.now();
    const prev=task?{status:task.status,completedAt:task.completedAt,monthCompleted:task.monthCompleted}:null;
    updateTask(id,{status:"done",completedAt:now,monthCompleted:monthKeyOf(now)});
    if(task) pushUndo("Task completed",task.title,()=>updateTask(id,prev));
  }
  function archiveTask(id){
    const task=tasks.find(t=>t.id===id);
    updateTask(id,{archived:true});
    if(task) pushUndo("Task archived",task.title,()=>updateTask(id,{archived:false}));
  }
  function archiveDoneTasks(secId){
    const toArchive=tasks.filter(t=>t.sectionId===secId&&t.status==="done"&&!t.archived&&t.type!=="spacer");
    if(toArchive.length===0) return;
    const ids=toArchive.map(t=>t.id);
    setTasks(p=>p.map(t=>ids.includes(t.id)?{...t,archived:true}:t));
    pushUndo("Archived "+toArchive.length+" tasks",byId[secId]?.label||"section",()=>{
      setTasks(p=>p.map(t=>ids.includes(t.id)?{...t,archived:false}:t));
    });
  }
  function moveTask(dragId,beforeId,newStatus){
    setTasks(prev=>{
      const dragged=prev.find(t=>t.id===dragId); if(!dragged) return prev;
      const arr=prev.filter(t=>t.id!==dragId);
      const updated={...dragged,status:newStatus};
      if(beforeId){const idx=arr.findIndex(t=>t.id===beforeId);arr.splice(idx>=0?idx:arr.length,0,updated);}
      else arr.push(updated);
      // Renumber order within each section to persist drag positions
      const counters={};
      return arr.map(t=>{ const k=t.sectionId; counters[k]=(counters[k]??0); return{...t,order:counters[k]++}; });
    });
  }

  // ── Tracker ops
  function addTracker(title,opts={}){
    setTrackers(prev=>[{
      id:uid(),title,sectionId:opts.sectionId||null,color:opts.color||"#0C7B7B",
      activeDays:opts.activeDays||[1,1,1,1,1,0,0],completions:{},
      linkedTaskIds:[],linkedNoteIds:[],order:prev.length,archived:false,createdAt:Date.now()
    },...prev]);
  }
  function updateTracker(id,upd){ setTrackers(p=>p.map(t=>t.id===id?{...t,...upd}:t)); }
  function deleteTracker(id){
    const trk=trackers.find(t=>t.id===id);
    setTrackers(p=>p.filter(t=>t.id!==id));
    if(trk) pushUndo("Tracker deleted",trk.title,()=>setTrackers(prev=>[trk,...prev]));
  }
  function toggleTrackerDay(id,dateISO){
    setTrackers(p=>p.map(t=>{
      if(t.id!==id) return t;
      const c={...t.completions};
      if(c[dateISO]) delete c[dateISO]; else c[dateISO]=true;
      return{...t,completions:c};
    }));
  }
  function archiveTracker(id){
    const trk=trackers.find(t=>t.id===id);
    updateTracker(id,{archived:true});
    if(trk) pushUndo("Tracker archived",trk.title,()=>updateTracker(id,{archived:false}));
  }
  function linkTrackerToTask(trackerId,taskId){
    updateTracker(trackerId,{linkedTaskIds:[...(trackers.find(t=>t.id===trackerId)?.linkedTaskIds||[]),taskId]});
    updateTask(taskId,{linkedTrackerIds:[...(tasks.find(t=>t.id===taskId)?.linkedTrackerIds||[]),trackerId]});
  }
  function unlinkTrackerFromTask(trackerId,taskId){
    updateTracker(trackerId,{linkedTaskIds:(trackers.find(t=>t.id===trackerId)?.linkedTaskIds||[]).filter(x=>x!==taskId)});
    updateTask(taskId,{linkedTrackerIds:(tasks.find(t=>t.id===taskId)?.linkedTrackerIds||[]).filter(x=>x!==trackerId)});
  }
  function linkTrackerToNote(trackerId,noteId,secId){
    updateTracker(trackerId,{linkedNoteIds:[...(trackers.find(t=>t.id===trackerId)?.linkedNoteIds||[]),noteId]});
    setNotes(prev=>{
      const items=[...(prev[secId]||[])];
      return{...prev,[secId]:items.map(n=>n.id===noteId?{...n,linkedTrackerIds:[...(n.linkedTrackerIds||[]),trackerId]}:n)};
    });
  }
  function unlinkTrackerFromNote(trackerId,noteId,secId){
    updateTracker(trackerId,{linkedNoteIds:(trackers.find(t=>t.id===trackerId)?.linkedNoteIds||[]).filter(x=>x!==noteId)});
    setNotes(prev=>{
      const items=[...(prev[secId]||[])];
      return{...prev,[secId]:items.map(n=>n.id===noteId?{...n,linkedTrackerIds:(n.linkedTrackerIds||[]).filter(x=>x!==trackerId)}:n)};
    });
  }

  // ── Notes ops
  const getSectionNotes=sid=>{ const val=notes[sid]; return Array.isArray(val)?val:[]; };
  function addNote(sid,parentId=null,opts={}){
    setNotes(prev=>{
      const items=prev[sid]||[];
      const siblings=items.filter(n=>n.parentId===(parentId||null));
      const order=siblings.length?Math.max(...siblings.map(n=>n.order))+1:0;
      const base=makeNote(parentId,order);
      const newNote={...base,...(opts.id?{id:opts.id}:{}),...(opts.title?{title:opts.title}:{}),...(opts.content?{content:opts.content}:{}),...(opts.linkedTrackerIds?{linkedTrackerIds:opts.linkedTrackerIds}:{})};
      return{...prev,[sid]:[...items,newNote]};
    });
  }
  function updateNoteField(sid,noteId,upd){
    setNotes(prev=>({...prev,[sid]:(prev[sid]||[]).map(n=>n.id===noteId?{...n,...upd}:n)}));
  }
  function deleteNote(sid,noteId){
    const items=notes[sid]||[];
    const toRemove=new Set([noteId,...noteDescendants(items,noteId)]);
    const removed=items.filter(n=>toRemove.has(n.id));
    const mainNote=removed.find(n=>n.id===noteId);
    setNotes(prev=>({...prev,[sid]:(prev[sid]||[]).filter(n=>!toRemove.has(n.id))}));
    if(removed.length>0) pushUndo("Note deleted",mainNote?.title||"Untitled",()=>{
      setNotes(prev=>({...prev,[sid]:[...(prev[sid]||[]),...removed]}));
    });
  }

  // ── Import / Export
  async function exportData(opts={}){
    const payload={};
    if(opts.inclTasks){
      let ts=tasks.filter(t=>t.type!=="spacer");
      if(opts.taskSecIds?.length) ts=ts.filter(t=>opts.taskSecIds.includes(t.sectionId));
      if(opts.dateFrom) ts=ts.filter(t=>!t.createdAt||(new Date(t.createdAt)>=new Date(opts.dateFrom)));
      if(opts.dateTo)   ts=ts.filter(t=>!t.createdAt||(new Date(t.createdAt)<=new Date(opts.dateTo+"T23:59:59")));
      payload.tasks=ts;
    }
    if(opts.inclTt) payload.tt=tt;
    if(opts.inclNotes){
      if(opts.noteSecIds?.length){
        const filtered={};
        opts.noteSecIds.forEach(sid=>{ if(notes[sid]) filtered[sid]=notes[sid]; });
        payload.notes=filtered;
      } else { payload.notes=notes; }
    }
    if(opts.inclSections) payload.sections=sections;
    if(opts.inclTrackers) payload.trackers=trackers;
    const mode=opts.inclTasks&&opts.inclNotes&&opts.inclTt&&opts.inclSections&&opts.inclTrackers?"all":opts.inclSections&&!opts.inclTasks?"settings":"custom";
    payload._export={mode,exportedAt:new Date().toISOString(),version:EXPORT_VERSION};
    const json=JSON.stringify(payload,null,2);
    const filename=`progress-you_export_${nowStamp()}.json`;
    // Tauri: show native save-as dialog
    if(window.__TAURI__?.dialog?.save||window.__TAURI__?.dialog?.open){
      try{
        const lastPath=await sget("py-export-path");
        const defaultPath=(lastPath?lastPath.replace(/[^/\\]*$/,"")+filename:null)||filename;
        const savePath=await window.__TAURI__.dialog.save({
          defaultPath,
          filters:[{name:"JSON",extensions:["json"]}]
        });
        if(!savePath) return; // user cancelled
        await window.__TAURI__.fs.writeTextFile(savePath,json);
        await sset("py-export-path",savePath);
        // Toast confirmation
        const id=uid();
        const short=savePath.split(/[/\\]/).pop();
        setToasts(p=>[...p,{id,title:"Export saved",body:short}]);
        setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),5000);
        return;
      }catch(e){}
    }
    // Fallback: browser download (Babel / dev)
    const blob=new Blob([json],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    a.click(); URL.revokeObjectURL(a.href);
  }
  function importData(file){
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=JSON.parse(e.target.result);
        const mode=data._export?.mode||"all";
        const lines=[];
        if(data.tasks)    lines.push(`${data.tasks.length} tasks`);
        if(data.tt)       lines.push("timetable data");
        if(data.notes){const total=Object.values(data.notes).reduce((s,a)=>s+(Array.isArray(a)?a.length:1),0);lines.push(`${total} notes`);}
        if(data.sections) lines.push(`${data.sections.length} sections`);
        if(data.trackers) lines.push(`${data.trackers.length} trackers`);
        setDialog({
          message:`Import "${mode}" backup?`,
          detail:`This will replace: ${lines.join(", ")}. This cannot be undone.`,
          confirmLabel:"Import",
          onConfirm:()=>{
            if(data.tasks)    setTasks(data.tasks);
            if(data.tt)       setTt(data.tt);
            if(data.notes)    setNotes(data.notes);
            if(data.sections) setSections(data.sections);
            if(data.trackers) setTrackers(migrateTrackers(data.trackers));
            setDialog({message:"Import successful!",onClose:()=>setDialog(null)});
          },
          onClose:()=>setDialog(null)
        });
      }catch{ setDialog({message:"Could not read file.",detail:"Make sure it's a valid Progress You export (.json).",onClose:()=>setDialog(null)}); }
    };
    reader.readAsText(file);
  }

  // ── Update check
  async function checkForUpdate(onResult) {
    try {
      const skipped = await sget("py-skipped-version");
      const result  = await window.__TAURI__.core.invoke('check_update');
      if (result && result.version !== skipped) {
        setUpdateInfo(result);
        setShowUpdate(true);
        onResult?.({ status: "available", version: result.version });
      } else {
        onResult?.({ status: result ? "skipped" : "latest" });
      }
    } catch(e) {
      onResult?.({ status: "error", message: e?.message || e?.toString() || "Unknown error" });
    }
  }

  if(!ready) return <div style={{minHeight:"100vh",background:"#F8F3EC",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:'"DM Sans",sans-serif',color:"#9B8E80"}}>Loading…</div>;

  const tp={sections,byId,tasks,addTask,updateTask,deleteTask,completeTask,moveTask,archiveTask,archiveDoneTasks};

  return (
    <NavCtx.Provider value={{navigateTo,navigateToFresh,navigateBack,navigateToDate,navStack,navigateToIndex:i=>setNavStack(s=>s.slice(0,i+1)),setView,getDayBlocks,upsertBlock,sections}}>
    <CtxMenuCtx.Provider value={openCtx}>
    <div style={{background:"#F8F3EC",minHeight:"100vh",fontFamily:'"DM Sans",sans-serif',color:"#1C1714"}}>
      <style>{`
        @import url('./vendor/fonts.css');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{overflow-x:hidden;}
        button{font-family:inherit;cursor:pointer;} button:hover{opacity:0.82;}
        input:focus,select:focus,textarea:focus{border-color:#8B7D6B!important;outline:none;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#EBE4D8;}
        ::-webkit-scrollbar-thumb{background:#C2B49E;border-radius:4px;}
        .hov-card:hover{box-shadow:0 4px 14px rgba(0,0,0,0.1)!important;}
        .chip-hov:hover{filter:brightness(0.91);}
        .add-btn:hover{background:#EBE4D8!important;border-color:#9B8E80!important;}
        .nav-p{padding:6px 13px;border-radius:8px;border:none;font-size:12px;font-weight:600;transition:all 0.18s;white-space:nowrap;}
        .nav-scroll{display:flex;gap:3;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
        .nav-scroll::-webkit-scrollbar{display:none;}
        .hdr-btn-label{display:inline;}
        @media(max-width:1100px){.hdr-btn-label{display:none;}}
        @media(max-width:1100px){.cap-btn span:nth-child(3){display:none!important;}}
        @media(max-width:950px){.nav-p{padding:5px 9px;font-size:11px;}}
        .dz-active{outline:2px dashed #8B7D6B!important;outline-offset:3px;}
        .ProseMirror{outline:none;}
        .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);float:left;color:#C2B49E;pointer-events:none;height:0;font-style:italic;}
        .ProseMirror h1{font-family:"Playfair Display",serif;font-size:26px;font-weight:700;margin:12px 0 6px;color:#1C1714;}
        .ProseMirror h2{font-family:"Playfair Display",serif;font-size:20px;font-weight:700;margin:10px 0 4px;color:#1C1714;}
        .ProseMirror h3{font-family:"Playfair Display",serif;font-size:16px;font-weight:700;margin:8px 0 4px;color:#1C1714;}
        .ProseMirror ol{margin:4px 0 4px 20px;padding:0;list-style-type:decimal;}
        .ProseMirror ol ol{margin-left:20px;}
        .ProseMirror ol li{margin:2px 0;line-height:1.65;}
        .slash-menu{position:fixed;background:#FDFAF6;border:1.5px solid #E3D9CC;border-radius:9px;padding:4px;min-width:200px;max-height:280px;overflow-y:auto;box-shadow:0 4px 16px rgba(0,0,0,0.13);z-index:200;}
        .slash-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 10px;border:none;background:transparent;border-radius:6px;font-size:12px;color:#1C1714;cursor:pointer;text-align:left;font-family:inherit;}
        .slash-menu button:hover,.slash-menu button.active{background:#EBE4D8;}
        .note-editor{outline:none;}
        .note-editor p{margin:0 0 4px;line-height:1.65;}
        .note-editor ul{margin:4px 0 4px 20px;padding:0;}
        .note-editor ul ul{margin-left:20px;}
        .note-editor li{margin:2px 0;line-height:1.65;}
        .note-editor b,.note-editor strong{font-weight:700;}
        .note-editor i,.note-editor em{font-style:italic;}
        .note-editor u{text-decoration:underline;}
        .tb-btn{position:relative;padding:4px 8px;border-radius:5px;border:1px solid transparent;background:transparent;font-size:12px;color:#4A3F30;transition:all 0.12s;line-height:1.4;}
        .tb-btn:hover{background:#D4C9B4;border-color:#C2B49E;opacity:1;}
        .tb-btn.on{background:#1C1714;color:#F8F3EC;border-color:#1C1714;}
        .tb-btn[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);white-space:nowrap;background:#1C1714;color:#F8F3EC;font-size:10px;font-weight:500;padding:3px 8px;border-radius:5px;pointer-events:none;z-index:300;opacity:0;animation:tipIn 0.15s 0.4s forwards;}
        @keyframes tipIn{to{opacity:1;}}
        select.tb-sel{padding:4px 7px;border-radius:5px;border:1px solid #D6CEC3;background:#FDFAF6;font-family:inherit;font-size:11px;color:#4A3F30;outline:none;}
        select.tb-sel:focus{border-color:#8B7D6B;}
        .note-row{display:flex;align-items:center;gap:4px;padding:5px 8px 5px 6px;border-radius:7px;cursor:pointer;transition:background 0.12s;}
        .note-row:hover{background:#E3D9CC;}
        .note-row.active{background:#1C1714;color:#F8F3EC;}
        .note-actions{visibility:hidden;display:flex;gap:2px;margin-left:auto;flex-shrink:0;}
        .note-row:hover .note-actions,.note-row.active .note-actions{visibility:visible;}
        .note-act-btn{width:18px;height:18px;border-radius:4px;border:none;background:transparent;font-size:11px;display:flex;align-items:center;justify-content:center;color:#7A6C5E;cursor:pointer;flex-shrink:0;}
        .note-act-btn:hover{background:#C2B49E;opacity:1;color:#1C1714;}
        .note-row.active .note-act-btn{color:#C2B49E;}
        .note-row.active .note-act-btn:hover{background:rgba(255,255,255,0.15);color:#F8F3EC;}
        .cap-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:none;
          background:linear-gradient(135deg,#C8A86B,#A07840);color:#1C1714;font-size:12px;font-weight:700;
          cursor:pointer;transition:all 0.18s;box-shadow:0 2px 8px rgba(200,168,107,0.35);}
        .cap-btn:hover{opacity:1;transform:translateY(-1px);box-shadow:0 4px 14px rgba(200,168,107,0.45);}
        .upcoming-task:hover{background:#E8E0D4!important;}
        body.dragging *{cursor:grabbing!important;user-select:none!important;}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .ctx-sub-item:hover{background:#F3EDE3;}
        .ctx-item:hover{background:#F3EDE3;}
        .note-callout{background:#FFF8ED;border-left:4px solid #C8A86B;border-radius:0 8px 8px 0;padding:10px 14px;margin:8px 0;display:block;color:#4A3F30;font-style:italic;}
        .note-collapse{border:1px solid #E3D9CC;border-radius:8px;margin:8px 0;display:block;}
        .note-collapse-head{display:flex;align-items:center;gap:6px;padding:7px 12px;cursor:pointer;background:#F3EDE3;border-radius:8px;user-select:none;}
        .note-collapse[data-open] .note-collapse-head{border-radius:8px 8px 0 0;}
        .note-collapse-arrow{font-size:18px;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;transition:transform 0.18s;flex-shrink:0;color:#7A6C5E;cursor:pointer;}
        .note-collapse[data-open] .note-collapse-arrow{transform:rotate(90deg);}
        .note-collapse-title{flex:1;font-weight:600;font-size:12px;color:#4A3F30;outline:none;min-width:0;}
        .note-collapse-del{background:none;border:none;cursor:pointer;color:#C43A3A;font-size:20px;font-weight:700;padding:0;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;border-radius:4px;}
        .note-collapse-del:hover{color:#A02020;opacity:1;background:rgba(196,58,58,0.12);}
        .note-collapse-body{display:none;padding:10px 14px;font-size:13px;border-top:1px solid #E3D9CC;outline:none;min-height:24px;}
        .note-collapse[data-open] .note-collapse-body{display:block;}
        .note-date-chip{display:inline-flex;align-items:center;gap:3px;background:#E3F0FB;color:#2A6FAD;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:600;cursor:pointer;user-select:none;}
        .note-task-chip{display:inline-flex;align-items:center;gap:3px;background:#F0EBF8;color:#6B3FC7;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:600;cursor:pointer;user-select:none;}
        .note-img-wrap{display:block;margin:6px 0;}
        .note-img{max-width:100%;border-radius:8px;display:block;cursor:pointer;}
        .ProseMirror-selectednode .note-img-wrap{outline:none;}
        .ProseMirror ul[data-type="taskList"]{list-style:none;padding:0;margin:4px 0;}
        .ProseMirror ul[data-type="taskList"] li{display:flex;align-items:flex-start;gap:6px;margin:2px 0;}
        .ProseMirror ul[data-type="taskList"] li label{flex-shrink:0;margin-top:3px;cursor:pointer;}
        .ProseMirror ul[data-type="taskList"] li label input[type="checkbox"]{accent-color:#1C1714;width:14px;height:14px;cursor:pointer;}
        .ProseMirror ul[data-type="taskList"] li div{flex:1;}
        .ProseMirror ul[data-type="taskList"] li[data-checked="true"]>div>p{text-decoration:line-through;color:#9B8E80;}
        .ProseMirror pre{background:#2C2522;color:#E8E0D4;border-radius:8px;padding:12px 16px;margin:8px 0;font-family:"JetBrains Mono",monospace;font-size:12px;overflow-x:auto;}
        .ProseMirror code{background:#EBE4D8;color:#4A3F30;padding:1px 4px;border-radius:3px;font-family:"JetBrains Mono",monospace;font-size:12px;}
        .ProseMirror pre code{background:transparent;color:inherit;padding:0;}
        .ProseMirror table{border-collapse:collapse;width:100%;margin:8px 0;}
        .ProseMirror th,.ProseMirror td{border:1px solid #D6CEC3;padding:6px 10px;text-align:left;font-size:12px;min-width:60px;vertical-align:top;}
        .ProseMirror th{background:#F3EDE3;font-weight:700;font-size:11px;color:#4A3F30;}
        .ProseMirror td{background:#FDFAF6;}
        .ProseMirror .selectedCell{background:#E3F0FB;}
        .ProseMirror hr{border:none;border-top:2px solid #E3D9CC;margin:12px 0;}
        .ProseMirror mark{background:#FFF3C4;padding:1px 2px;border-radius:2px;}
        .ProseMirror sub{font-size:0.75em;}
        .ProseMirror sup{font-size:0.75em;}
        .table-bubble{position:absolute;display:flex;gap:2px;background:#1C1714;border-radius:8px;padding:4px;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:200;}
        .table-bubble button{padding:4px 7px;border:none;background:transparent;color:#C2B49E;font-size:10px;border-radius:4px;cursor:pointer;white-space:nowrap;font-family:inherit;}
        .table-bubble button:hover{background:#3C3330;color:#F8F3EC;opacity:1;}
        .table-bubble button.del{color:#C43A3A;}
        .table-bubble button.del:hover{background:rgba(196,58,58,0.2);color:#E85555;}
        .tb-customize{position:absolute;top:calc(100% + 4px);right:0;background:#FDFAF6;border:1.5px solid #E3D9CC;border-radius:10px;padding:12px;min-width:240px;max-height:360px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.14);z-index:300;}
        .tb-customize label{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:5px;font-size:11px;color:#4A3F30;cursor:pointer;}
        .tb-customize label:hover{background:#F3EDE3;}
        .tb-customize input[type="checkbox"]{accent-color:#1C1714;width:13px;height:13px;cursor:pointer;}
      `}</style>

      {/* ── Header ── */}
      <header style={{background:"#1C1714",color:"#F8F3EC",padding:"8px 16px",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,zIndex:100,boxShadow:"0 3px 20px rgba(0,0,0,0.38)",flexWrap:"wrap"}}>
        <div style={{flexShrink:0,marginRight:4}}>
          <div style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,lineHeight:1}}>
            Progress <em style={{fontStyle:"italic",color:"#C8A86B"}}>You</em>
          </div>
          <div style={{fontSize:9,color:"#5A4E46",letterSpacing:"1.6px",textTransform:"uppercase",marginTop:2}}>Notebook System</div>
        </div>

        <nav style={{background:"#2C2522",borderRadius:10,padding:3,minWidth:0,flexShrink:1}}>
          <div className="nav-scroll">
          {[["today","Today"],["timetable","Timetable"],["boards","Taskboards"],["notes","Notes"],["trackers","Trackers"],["calendar","Calendar"],["monthly","Log"],["stats","Stats"]].map(([v,l])=>(
            <button key={v} className="nav-p" onClick={()=>setView(v)}
              style={{background:view===v?"#F8F3EC":"transparent",color:view===v?"#1C1714":"#7A6C5E"}}>{l}</button>
          ))}
          </div>
        </nav>

        {/* ⚡ Quick Capture — always visible */}
        <button className="cap-btn" onClick={()=>setShowCap(true)} title="Quick Capture (Ctrl+Space)">
          <span style={{fontSize:14}}>&#x26A1;</span>
          <span>Capture</span>
          <span style={{fontSize:9,opacity:0.6,fontWeight:400}}>Ctrl+Space</span>
        </button>

        {view==="timetable"&&(
          <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto",flexWrap:"wrap"}}>
            <button onClick={copyPrevWeek} style={{padding:"5px 11px",borderRadius:7,border:"1px solid #3A302A",background:"transparent",color:"#7A6C5E",fontSize:11,fontWeight:600}}>&#x21A9; <span className="hdr-btn-label">Copy prev</span></button>
            <button onClick={()=>setWeek(w=>shiftWeek(w,-1))} style={{width:28,height:28,borderRadius:7,border:"1px solid #3A302A",background:"transparent",color:"#F8F3EC",fontSize:16}}>&#x2039;</button>
            <span style={{fontSize:11,color:"#C2B49E",minWidth:0,textAlign:"center",fontWeight:500,whiteSpace:"nowrap"}}>{weekLabel(week)}</span>
            <button onClick={()=>setWeek(w=>shiftWeek(w, 1))} style={{width:28,height:28,borderRadius:7,border:"1px solid #3A302A",background:"transparent",color:"#F8F3EC",fontSize:16}}>&#x203A;</button>
            <button onClick={()=>setWeek(mondayOf(new Date()))} style={{padding:"5px 11px",borderRadius:7,border:"1px solid #3A302A",background:"transparent",color:"#7A6C5E",fontSize:11,fontWeight:600}}><span className="hdr-btn-label">Today</span><span style={{display:"none"}} className="hdr-icon-only">&#x2302;</span></button>
          </div>
        )}

        <div style={{display:"flex",gap:5,marginLeft:"auto",alignItems:"center",flexShrink:0}}>
          <button onClick={()=>setShowSearch(true)} title="Search (Ctrl+K)" style={{padding:"6px 10px",borderRadius:8,border:"1px solid #3A302A",background:"transparent",color:"#7A6C5E",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>&#x1F50D;<span className="hdr-btn-label"> Search</span></button>
          <button onClick={()=>setShowPin(v=>!v)} title={showPin?"Hide today dashboard":"Show today dashboard"} style={{padding:"6px 10px",borderRadius:8,border:"1px solid #3A302A",background:showPin?"#3A302A":"transparent",color:showPin?"#C8A86B":"#7A6C5E",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>&#x1F4CC;<span className="hdr-btn-label"> Today</span></button>
          <div style={{position:"relative"}}>
            <button onClick={()=>{if(pinnedNoteId){setPinnedNoteId(null);setShowNotePicker(false);}else{setShowNotePicker(v=>!v);}}} title={pinnedNoteId?"Unpin note":"Pin a note"} style={{padding:"6px 10px",borderRadius:8,border:"1px solid #3A302A",background:pinnedNoteId?"#3A302A":"transparent",color:pinnedNoteId?"#C8A86B":"#7A6C5E",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>&#x1F4DD;<span className="hdr-btn-label"> Note</span></button>
            {showNotePicker&&!pinnedNoteId&&(()=>{
              var allNotes=Object.values(notes||{}).flat();
              var q=notePickerQ.toLowerCase();
              var filtered=q?allNotes.filter(function(n){return n.title&&n.title.toLowerCase().indexOf(q)>=0;}):allNotes.slice(0,20);
              return <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:10,padding:8,minWidth:260,maxHeight:280,boxShadow:"0 6px 24px rgba(0,0,0,0.18)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:6}}>Pin a Note</div>
                <input value={notePickerQ} onChange={e=>setNotePickerQ(e.target.value)} placeholder="Search notes\u2026" autoFocus
                  style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid #E3D9CC",fontSize:11,marginBottom:6,outline:"none"}}/>
                <div style={{overflowY:"auto",maxHeight:200}}>
                {filtered.length===0&&<div style={{fontSize:11,color:"#9B8E80",padding:"4px 2px"}}>No notes found.</div>}
                {filtered.map(function(n){return <div key={n.id} onClick={function(){setPinnedNoteId(n.id);setShowNotePicker(false);setNotePickerQ("");}}
                  onMouseEnter={function(e){e.currentTarget.style.background="#EBE4D8";}}
                  onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}
                  style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer",color:"#1C1714",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {n.title||"Untitled"}</div>;})}
                </div>
              </div>;
            })()}
          </div>
          <button onClick={()=>setShowIO(true)} title="Import / Export Data" style={{padding:"6px 10px",borderRadius:8,border:"1px solid #3A302A",background:"transparent",color:"#7A6C5E",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>&#x21C5;<span className="hdr-btn-label"> Data</span></button>
          <button onClick={()=>setShowSett(true)} title="Settings" style={{width:32,height:32,borderRadius:8,border:"1px solid #3A302A",background:"transparent",color:"#7A6C5E",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>&#x2699;</button>
        </div>
      </header>

      <main style={{padding:"24px 28px",maxWidth:1500,margin:"0 auto"}}>
        {view==="today"     && <TodayView     {...tp} getDayBlocks={getDayBlocks} onOpenCapture={()=>setShowCap(true)} trackers={trackers} toggleTrackerDay={toggleTrackerDay}/>}
        {view==="timetable" && <TimetableView sections={sections} byId={byId} getDayBlocks={getDayBlocks} upsertBlock={upsertBlock} deleteBlock={deleteBlock} templates={templates} addTemplate={addTemplate} updateTemplate={updateTemplate} deleteTemplate={deleteTemplate} applyTemplate={applyTemplate} tasks={tasks} notes={notes} setBlocks={setBlocks} addSetBlock={addSetBlock} removeSetBlock={removeSetBlock} reorderSetBlock={reorderSetBlock} trackers={trackers}/>}
        {view==="boards"    && <BoardsView    {...tp} notes={notes} setView={setView} initialSecId={lastBoardSec} onSecChange={setLastBoardSec} archiveTask={archiveTask} archiveDoneTasks={archiveDoneTasks}/>}
        {view==="notes"     && <NotesView     sections={sections} byId={byId} getSectionNotes={getSectionNotes} addNote={addNote} updateNoteField={updateNoteField} deleteNote={deleteNote} tasks={tasks} setView={setView} initialSecId={lastNoteKey.sec} initialNoteId={lastNoteKey.id} onNoteChange={(sec,id)=>setLastNoteKey({sec,id})}/>}
        {view==="trackers"  && <TrackersView  trackers={trackers} addTracker={addTracker} updateTracker={updateTracker} deleteTracker={deleteTracker} toggleTrackerDay={toggleTrackerDay} archiveTracker={archiveTracker} sections={sections} byId={byId} tasks={tasks} notes={notes} addTask={addTask} addNote={addNote} linkTrackerToTask={linkTrackerToTask} unlinkTrackerFromTask={unlinkTrackerFromTask} linkTrackerToNote={linkTrackerToNote} unlinkTrackerFromNote={unlinkTrackerFromNote}/>}
        {view==="monthly"   && <MonthlyView   tasks={tasks} sections={sections} byId={byId} initialMode="log"/>}
        {view==="calendar"   && <MonthlyView   tasks={tasks} sections={sections} byId={byId} initialMode="calendar"/>}
        {view==="stats"     && <StatsView     tasks={tasks} tt={tt} week={week} sections={sections} byId={byId} notes={notes} trackers={trackers}/>}
      </main>

      {showSett && <SettingsModal sections={sections} setSections={setSections} onClose={()=>setShowSett(false)} checkForUpdate={checkForUpdate}
        tasks={tasks} setTasks={setTasks} notes={notes} setNotes={setNotes} tt={tt} setTt={setTt} trackers={trackers} setTrackers={setTrackers}/>}
      {showIO   && <ImportExportModal onExport={exportData} onImport={importData} onClose={()=>setShowIO(false)} sections={sections}/>}
      {showCap  && <QuickCaptureModal sections={sections} byId={byId} addTask={addTask} addNote={addNote} onClose={()=>setShowCap(false)}/>}
      {showSearch && <SearchModal tasks={tasks} notes={notes} sections={sections} byId={byId} tt={tt} trackers={trackers} onClose={()=>setShowSearch(false)} setView={setView}/>}
      <AppDialog dialog={dialog} onClose={dialog?.onClose}/>
      {showUpdate && updateInfo && (
        <UpdateDialog
          info={updateInfo}
          onSkip={async()=>{ await sset("py-skipped-version", updateInfo.version); setShowUpdate(false); }}
          onRemind={()=>setShowUpdate(false)}
        />
      )}
      {/* Toast banners (reminders + undo) */}
      <div style={{position:"fixed",bottom:20,right:20,zIndex:500,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:"#1C1714",color:"#F8F3EC",borderRadius:10,padding:"12px 18px",
            boxShadow:"0 8px 24px rgba(0,0,0,0.35)",minWidth:240,maxWidth:320,pointerEvents:"auto",
            animation:"slideIn 0.2s ease"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#C8A86B",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:3}}>{t.title}</div>
            <div style={{fontSize:13}}>{t.body}</div>
          </div>
        ))}
        {undoStack.map(u=>(
          <div key={u.id} style={{background:"#1C1714",color:"#F8F3EC",borderRadius:10,padding:"12px 18px",
            boxShadow:"0 8px 24px rgba(0,0,0,0.35)",minWidth:260,maxWidth:340,pointerEvents:"auto",
            animation:"slideIn 0.2s ease",borderLeft:"3px solid #C8A86B"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#C8A86B",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:3}}>{u.title}</div>
            <div style={{fontSize:12,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.detail}</div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>executeUndo(u.id)} style={{padding:"4px 12px",borderRadius:6,border:"1px solid #C8A86B",background:"transparent",color:"#C8A86B",fontSize:11,fontWeight:700,cursor:"pointer"}}>Undo</button>
              <button onClick={()=>dismissUndo(u.id)} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"transparent",color:"#5A4E46",fontSize:11,cursor:"pointer"}}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>
      {ctxMenu&&<ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={()=>setCtxMenu(null)}/>}
      {navStack.length>0&&<NavOverlay stack={navStack} tasks={tasks} notes={notes} trackers={trackers} byId={byId} updateTask={updateTask} completeTask={completeTask} toggleTrackerDay={toggleTrackerDay} onClose={()=>setNavStack([])} onNavigateToLevel={i=>setNavStack(s=>s.slice(0,i+1))}/>}
    </div>
      {showPin&&<PinOverlay tasks={tasks} tt={tt} week={week} sections={sections} byId={byId} trackers={trackers} toggleTrackerDay={toggleTrackerDay} onClose={()=>setShowPin(false)} navigateTo={navigateTo} navigateToFresh={navigateToFresh} navigateToDate={navigateToDate}/>}
      {pinnedNoteId&&<NoteFloatOverlay noteId={pinnedNoteId} notes={notes} onClose={()=>setPinnedNoteId(null)} onOpenNote={function(nid){var secKey=null;var entries=Object.entries(notes||{});for(var i=0;i<entries.length;i++){if(entries[i][1].some(function(n){return n.id===nid;})){secKey=entries[i][0];break;}}setLastNoteKey({sec:secKey||sections[0]?.id,id:nid});setView("notes");}}/>}
    </CtxMenuCtx.Provider>
    </NavCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>);
