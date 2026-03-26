// ─── Quick Capture Modal ──────────────────────────────────────────────────────

function QuickCaptureModal({sections,byId,addTask,addNote,onClose}) {
  const [type,      setType]      = useState(()=>{ try{ const v=sessionStorage.getItem("py-cap-type"); return v||"task"; }catch{ return "task"; } });
  const [secId,     setSecId]     = useState(()=>{ try{ const v=sessionStorage.getItem("py-cap-sec"); return sections.find(s=>s.id===v)?v:sections[0]?.id||""; }catch{ return sections[0]?.id||""; } });
  const [title,     setTitle]     = useState("");
  const [body,      setBody]      = useState("");
  const [hasDue,    setHasDue]    = useState(false);
  const [dueDate,   setDueDate]   = useState(todayISO());
  const [status,    setStatus]    = useState("backlog");
  const [priority,  setPriority]  = useState("normal");
  const [checklist, setChecklist] = useState([]);
  const [newItem,   setNewItem]   = useState("");
  const [hasRemind, setHasRemind] = useState(false);
  const [remindDate,setRemindDate]= useState(todayISO());
  const [remindTime,setRemindTime]= useState("09:00");
  const [saved,     setSaved]     = useState(false);
  const titleRef = useRef();

  // Persist last used type + section
  useEffect(()=>{ try{ sessionStorage.setItem("py-cap-type",type); }catch{} },[type]);
  useEffect(()=>{ try{ sessionStorage.setItem("py-cap-sec",secId); }catch{} },[secId]);

  useEffect(()=>{ setTimeout(()=>titleRef.current?.focus(),60); },[]);

  useEffect(()=>{
    const handler = e => {
      if(e.key==="Escape") onClose();
      if((e.ctrlKey||e.metaKey)&&e.key==="Enter") handleSave();
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[title,body,type,secId,hasDue,dueDate,status,priority,checklist]);

  function addCheckItem(){ if(!newItem.trim()) return; setChecklist(p=>[...p,{id:uid(),text:newItem.trim(),done:false}]); setNewItem(""); }
  function removeCheckItem(id){ setChecklist(p=>p.filter(i=>i.id!==id)); }

  function handleSave() {
    if(!title.trim()) { titleRef.current?.focus(); return; }
    if(type==="task") {
      var remind = hasRemind ? new Date(remindDate+"T"+remindTime).toISOString() : null;
      addTask(secId,title.trim(),body.trim(),{dueDate:hasDue?dueDate:null,status,priority,checklist,remindAt:remind});
    } else {
      addNote(secId, null, {
        title: title.trim(),
        content: body.trim() ? `<p>${body.trim()}</p>` : "<p><br></p>"
      });
    }
    setSaved(true);
    setTimeout(()=>{ onClose(); },500);
  }

  const sec = byId[secId]||sections[0]||{color:"#7C7166"};
  const PRIORITIES=[{key:"high",label:"↑ High",color:"#C43A3A"},{key:"normal",label:"Normal",color:"#9B8E80"},{key:"low",label:"↓ Low",color:"#7A6C5E"}];
  const STATUSES=[{key:"backlog",label:"Backlog"},{key:"this-week",label:"This Week"}];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(28,23,20,0.72)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:300,padding:"60px 20px 20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF6",borderRadius:16,width:"100%",maxWidth:560,boxShadow:"0 32px 80px rgba(0,0,0,0.48)",border:"1px solid #E3D9CC",overflow:"hidden",maxHeight:"calc(100vh - 80px)",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{background:"#1C1714",padding:"14px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:18}}>&#x26A1;</span>
          <span style={{fontFamily:'"Playfair Display",serif',fontSize:16,fontWeight:700,color:"#F8F3EC"}}>Quick Capture</span>
          <span style={{fontSize:11,color:"#5A4E46",marginLeft:4}}>Ctrl+Enter to save &#xB7; Esc to dismiss</span>
          <button onClick={onClose} style={{marginLeft:"auto",width:26,height:26,borderRadius:6,border:"none",background:"transparent",color:"#7A6C5E",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>&#xd7;</button>
        </div>

        <div style={{padding:"20px",overflowY:"auto",flex:1}}>
          {/* Type + Section row */}
          <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
            <div style={{display:"flex",gap:2,background:"#EBE4D8",borderRadius:8,padding:3}}>
              {[["task","&#x1F4CB; Task"],["note","&#x1F4DD; Note"]].map(([t,l])=>(
                <button key={t} onClick={()=>setType(t)} style={{padding:"5px 12px",borderRadius:6,border:"none",fontSize:12,fontWeight:600,background:type===t?"#FDFAF6":"transparent",color:type===t?"#1C1714":"#7A6C5E",boxShadow:type===t?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}} dangerouslySetInnerHTML={{__html:l}}/>
              ))}
            </div>
            <div style={{flex:1,position:"relative"}}>
              <select value={secId} onChange={e=>setSecId(e.target.value)}
                style={{...S.input,marginBottom:0,paddingLeft:32,appearance:"none",
                  borderColor:sec.color+"80",background:sec.color+"12",fontWeight:600,color:sec.color}}>
                {sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:10,height:10,borderRadius:"50%",background:sec.color,pointerEvents:"none"}}/>
            </div>
          </div>

          {/* Title */}
          <input ref={titleRef} value={title} onChange={e=>setTitle(e.target.value)}
            placeholder={type==="task"?"Task title…":"Note title…"}
            style={{...S.input,fontSize:15,fontWeight:600,marginBottom:10}}/>

          {/* Body */}
          <textarea value={body} onChange={e=>setBody(e.target.value)}
            placeholder={type==="task"?"Notes, context… (optional)":"Jot it down… (optional)"}
            style={{...S.input,resize:"vertical",minHeight:56,fontSize:13,fontWeight:400,marginBottom:12}}/>

          {type==="task"&&<>
            {/* Status + Priority */}
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              <div style={{flex:1}}>
                <span style={S.lbl}>Add to</span>
                <div style={{display:"flex",gap:4}}>
                  {STATUSES.map(s=>(
                    <button key={s.key} onClick={()=>setStatus(s.key)}
                      style={{flex:1,padding:"5px 0",borderRadius:7,border:`1.5px solid ${status===s.key?"#4B3FC7":"#D6CEC3"}`,
                        background:status===s.key?"#E6E3F5":"transparent",
                        color:status===s.key?"#4B3FC7":"#7A6C5E",fontSize:11,fontWeight:600}}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{flex:1}}>
                <span style={S.lbl}>Priority</span>
                <div style={{display:"flex",gap:4}}>
                  {PRIORITIES.map(p=>(
                    <button key={p.key} onClick={()=>setPriority(p.key)}
                      style={{flex:1,padding:"5px 0",borderRadius:7,border:`1.5px solid ${priority===p.key?p.color:"#D6CEC3"}`,
                        background:priority===p.key?p.color+"18":"transparent",
                        color:priority===p.key?p.color:"#7A6C5E",fontSize:10,fontWeight:600}}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Due date */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
              <button onClick={()=>setHasDue(v=>!v)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${hasDue?"#4B3FC7":"#C2B49E"}`,
                background:hasDue?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>
                {hasDue?"\u2713":""}
              </button>
              <span style={{fontSize:12,fontWeight:600,color:"#4A3F30",cursor:"pointer"}} onClick={()=>setHasDue(v=>!v)}>Due date</span>
              {hasDue&&<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                style={{...S.input,marginBottom:0,flex:1,padding:"4px 8px",fontSize:12}}/>}
            </div>

            {/* Reminder */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
              <button onClick={()=>setHasRemind(v=>!v)} style={{width:18,height:18,borderRadius:4,border:"2px solid "+(hasRemind?"#4B3FC7":"#C2B49E"),
                background:hasRemind?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>
                {hasRemind?"\u2713":""}
              </button>
              <span style={{fontSize:12,fontWeight:600,color:"#4A3F30",cursor:"pointer"}} onClick={()=>setHasRemind(v=>!v)}>Reminder</span>
              {hasRemind&&<>
                <input type="date" value={remindDate} onChange={e=>setRemindDate(e.target.value)}
                  style={{...S.input,marginBottom:0,padding:"4px 8px",fontSize:12,flex:1}}/>
                <input type="time" value={remindTime} onChange={e=>setRemindTime(e.target.value)}
                  style={{...S.input,marginBottom:0,padding:"4px 8px",fontSize:12,width:100}}/>
              </>}
            </div>

            {/* Checklist */}
            <div style={{marginBottom:12,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
              <span style={S.lbl}>Checklist</span>
              {checklist.map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                  <div style={{width:11,height:11,borderRadius:3,border:"1.5px solid #C2B49E",flexShrink:0}}/>
                  <span style={{fontSize:12,flex:1}}>{item.text}</span>
                  <button onClick={()=>removeCheckItem(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#C2B49E",fontSize:11,padding:0}}>&#xd7;</button>
                </div>
              ))}
              <div style={{display:"flex",gap:6,marginTop:4}}>
                <input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Add item…"
                  onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addCheckItem())}
                  style={{...S.input,marginBottom:0,flex:1,padding:"4px 8px",fontSize:11}}/>
                <button onClick={addCheckItem} style={{...S.btnMicro,padding:"4px 10px",fontSize:11}}>+</button>
              </div>
            </div>
          </>}

          {/* Actions */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={handleSave} style={{...S.btnDark,background:saved?"#1A7A43":sec.color,flex:1,display:"flex",justifyContent:"center",alignItems:"center",gap:8,transition:"background 0.3s"}}>
              {saved?"\u2713 Saved!":(type==="task"?"Add Task":"Create Note")}
              {!saved&&<span style={{fontSize:9,opacity:0.6,fontWeight:400}}>Ctrl+Enter</span>}
            </button>
            <button onClick={onClose} style={S.btnGhost}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────

// Fuzzy match: allows up to maxDist character edits (Levenshtein) between query and any substring of text
function fuzzyMatch(text, query, maxDist) {
  if (!text || !query) return false;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  if (q.length <= 2 || q.length > 40) return false;
  // Sliding window: check substrings of text near query length
  const wMin = Math.max(1, q.length - maxDist);
  const wMax = q.length + maxDist;
  for (let wLen = wMin; wLen <= wMax; wLen++) {
    for (let i = 0; i <= t.length - wLen; i++) {
      const sub = t.slice(i, i + wLen);
      let dist = 0;
      const rows = q.length + 1;
      const cols = sub.length + 1;
      const d = new Array(rows);
      for (let r = 0; r < rows; r++) { d[r] = new Array(cols); d[r][0] = r; }
      for (let c = 0; c < cols; c++) d[0][c] = c;
      for (let r = 1; r < rows; r++) {
        for (let c = 1; c < cols; c++) {
          const cost = q[r - 1] === sub[c - 1] ? 0 : 1;
          d[r][c] = Math.min(d[r - 1][c] + 1, d[r][c - 1] + 1, d[r - 1][c - 1] + cost);
        }
      }
      dist = d[q.length][sub.length];
      if (dist <= maxDist) return true;
    }
  }
  return false;
}

function SearchModal({tasks,notes,sections,byId,tt,trackers,onClose,setView}) {
  const {navigateToFresh,navigateToDate}=React.useContext(NavCtx)||{};
  const [query,setQuery]=useState("");
  const [selIdx,setSelIdx]=useState(0);
  const [showArchived,setShowArchived]=useState(false);
  const inputRef=useRef(null);

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),50); },[]);
  useEffect(()=>{
    const handler=e=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const q=query.trim();
  const qLow=q.toLowerCase();

  // Detect regex: query wrapped in /pattern/ or /pattern/flags
  let useRegex=false, regexObj=null;
  if (q.length>=3 && q[0]==="/") {
    const lastSlash=q.lastIndexOf("/");
    if (lastSlash>0) {
      const pattern=q.slice(1,lastSlash);
      const flags=q.slice(lastSlash+1);
      try { regexObj=new RegExp(pattern,flags.includes("i")?flags:flags+"i"); useRegex=true; }
      catch(e) { /* invalid regex, fall through to plain search */ }
    }
  }

  // Determine typo tolerance: 1 for short queries, 2 for longer
  const maxTypo = qLow.length <= 5 ? 1 : 2;

  function matches(text) {
    if (!q) return false;
    if (useRegex && regexObj) return regexObj.test(text || "");
    return fuzzyMatch(text, qLow, maxTypo);
  }

  // Search tasks
  const taskResults=q?tasks.filter(t=>
    t.type!=="spacer"&&
    (!t.archived||showArchived)&&
    (matches(t.title)||matches(t.notes))
  ).slice(0,12).map(t=>({
    kind:"task",id:t.id,title:t.title,
    section:byId[t.sectionId],
    detail:t.notes?t.notes.slice(0,80):null,
    status:t.status,archived:t.archived,
  })):[];

  // Search notes
  const allNotes=Object.entries(notes||{}).flatMap(function(entry){
    const sid=entry[0]; const arr=entry[1];
    return (Array.isArray(arr)?arr:[]).map(function(n){ return Object.assign({},n,{_sid:sid}); });
  });
  const noteResults=q?allNotes.filter(n=>
    matches(n.title)||matches(stripHtmlText(n.content))
  ).slice(0,12).map(n=>({
    kind:"note",id:n.id,title:n.title,
    section:byId[n._sid],
    detail:stripHtmlText(n.content).slice(0,80)||null,
  })):[];

  // Search blocks
  const blockResults=[];
  if(q){
    const entries=Object.entries(tt||{});
    for(let wi=0;wi<entries.length;wi++){
      const wk=entries[wi][0]; const weekData=entries[wi][1];
      const dayEntries=Object.entries(weekData||{});
      for(let di=0;di<dayEntries.length;di++){
        const day=dayEntries[di][0]; const arr=dayEntries[di][1];
        for(let bi=0;bi<(arr||[]).length;bi++){
          const blk=arr[bi];
          const sec=blk.sectionId?byId[blk.sectionId]:null;
          const blkLabel=blk.label||(sec?sec.label:"")||"";
          if(matches(blkLabel)){
            blockResults.push({
              kind:"block",id:blk.id,
              title:blkLabel||"Block",
              section:sec,
              detail:day+" "+blk.start+"--"+blk.end+" ("+weekLabel(wk)+")",
              week:wk,day:day,
            });
          }
        }
      }
    }
  }

  // Search trackers
  const trackerResults=q?(trackers||[]).filter(t=>
    !t.archived&&matches(t.title)
  ).slice(0,8).map(t=>({
    kind:"tracker",id:t.id,title:t.title,
    section:byId[t.sectionId],
    detail:DAYS.filter(function(_,i){return t.activeDays[i];}).map(function(d){return d.slice(0,3);}).join(", "),
  })):[];

  const results=[...taskResults,...noteResults,...trackerResults,...blockResults.slice(0,8)];
  useEffect(()=>{ setSelIdx(0); },[query,showArchived]);

  function handleClick(r){
    if(r.kind==="task") navigateToFresh?.({type:"task",id:r.id});
    else if(r.kind==="note") navigateToFresh?.({type:"note",id:r.id});
    else if(r.kind==="tracker"){ setView?.("trackers"); }
    else if(r.kind==="block"&&r.week&&r.day) navigateToDate?.(weekDayToISO(r.week,r.day));
    onClose();
  }

  function handleKeyDown(e){
    if(e.key==="ArrowDown"){ e.preventDefault(); setSelIdx(i=>Math.min(i+1,results.length-1)); }
    if(e.key==="ArrowUp"){ e.preventDefault(); setSelIdx(i=>Math.max(i-1,0)); }
    if(e.key==="Enter"&&results[selIdx]){ e.preventDefault(); handleClick(results[selIdx]); }
  }

  const TYPE_ICON={task:"&#x1F4CB;",note:"&#x1F4DD;",block:"&#x1F4C5;",tracker:"&#x1F4CA;"};
  const TYPE_LABEL={task:"Task",note:"Note",block:"Block",tracker:"Tracker"};
  const TYPE_COLOR={task:"#4B3FC7",note:"#6B3FC7",block:"#2A6FAD",tracker:"#0C7B7B"};

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(28,23,20,0.72)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:300,padding:"80px 20px 20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF6",borderRadius:16,width:"100%",maxWidth:580,boxShadow:"0 32px 80px rgba(0,0,0,0.48)",border:"1px solid #E3D9CC",overflow:"hidden",maxHeight:"calc(100vh - 120px)",display:"flex",flexDirection:"column"}}>

        {/* Search input */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:"1px solid #EBE4D8"}}>
          <span style={{fontSize:18,flexShrink:0}}>&#x1F50D;</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, blocks..."
            style={{flex:1,border:"none",background:"transparent",fontSize:15,fontWeight:500,fontFamily:'"DM Sans",sans-serif',color:"#1C1714",outline:"none"}}/>
          <button onClick={()=>setShowArchived(v=>!v)} title={showArchived?"Hiding archived":"Showing archived"}
            style={{...S.btnMicro,background:showArchived?"#1C1714":"#EBE4D8",color:showArchived?"#F8F3EC":"#9B8E80",padding:"2px 8px",fontSize:10,flexShrink:0}}>
            {showArchived?"+ Archived":"No Archive"}
          </button>
          <span style={{fontSize:10,color:"#9B8E80",flexShrink:0,background:"#EBE4D8",padding:"2px 8px",borderRadius:4,fontWeight:600}}>Ctrl+K</span>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:6,border:"none",background:"transparent",color:"#7A6C5E",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>&#xd7;</button>
        </div>

        {/* Results */}
        <div style={{overflowY:"auto",flex:1,padding:"6px 0"}}>
          {!q&&(
            <div style={{padding:"28px 20px",textAlign:"center",color:"#9B8E80"}}>
              <div style={{fontSize:11,fontWeight:600}}>Type to search across all tasks, notes, and timetable blocks</div>
              <div style={{fontSize:10,marginTop:6,color:"#B8ADA0"}}>Supports fuzzy matching. Use /pattern/ for regex.</div>
            </div>
          )}
          {q&&results.length===0&&(
            <div style={{padding:"28px 20px",textAlign:"center",color:"#9B8E80"}}>
              <div style={{fontSize:24,marginBottom:6}}>&#x1F50E;</div>
              <div style={{fontSize:13,fontWeight:600}}>No results for "{query}"</div>
            </div>
          )}
          {results.map(function(r,i){
            const sec=r.section;
            const selected=i===selIdx;
            return (
              <div key={r.kind+"-"+r.id+"-"+i} onClick={()=>handleClick(r)}
                onMouseEnter={()=>setSelIdx(i)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 18px",cursor:"pointer",
                  background:selected?"#EBE4D8":"transparent",transition:"background 0.1s"}}>
                {/* Type badge */}
                <span style={{fontSize:10,fontWeight:700,color:TYPE_COLOR[r.kind],background:TYPE_COLOR[r.kind]+"18",
                  padding:"2px 8px",borderRadius:6,flexShrink:0,textTransform:"uppercase",letterSpacing:"0.3px"}}
                  dangerouslySetInnerHTML={{__html:TYPE_ICON[r.kind]+" "+TYPE_LABEL[r.kind]}}/>
                {/* Content */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1C1714",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    textDecoration:(r.status==="done"||r.archived)?"line-through":"none",
                    opacity:r.archived?0.6:1}}>
                    {r.title||"Untitled"}
                  </div>
                  {r.detail&&<div style={{fontSize:11,color:"#9B8E80",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{r.detail}</div>}
                </div>
                {/* Section badge */}
                {sec&&(
                  <span style={{fontSize:10,fontWeight:700,background:sec.color+"20",color:sec.color,
                    padding:"2px 8px",borderRadius:10,flexShrink:0,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {sec.label}
                  </span>
                )}
                {/* Status */}
                {r.archived&&<span style={{fontSize:9,fontWeight:700,color:"#9B8E80",background:"#EBE4D8",padding:"1px 6px",borderRadius:4,flexShrink:0}}>archived</span>}
                {r.status==="done"&&!r.archived&&<span style={{fontSize:9,fontWeight:700,color:"#1A7A43",background:"#D4F0E0",padding:"1px 6px",borderRadius:4,flexShrink:0}}>done</span>}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {results.length>0&&(
          <div style={{padding:"8px 18px",borderTop:"1px solid #EBE4D8",background:"#F3EDE3",display:"flex",gap:14,flexShrink:0}}>
            <span style={{fontSize:10,color:"#9B8E80"}}>&#x2191;&#x2193; navigate</span>
            <span style={{fontSize:10,color:"#9B8E80"}}>&#x23CE; open</span>
            <span style={{fontSize:10,color:"#9B8E80"}}>Esc close</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Schedule Task Modal ──────────────────────────────────────────────────────

function ScheduleTaskModal({task,sections,byId,getDayBlocks,upsertBlock,setTt,onClose}) {
  const [mode,    setMode]    = useState("week");
  const [day,     setDay]     = useState(todayName());
  const [pickDate,setPickDate]= useState(todayISO());
  const [start,   setStart]   = useState("09:00");
  const [end,     setEnd]     = useState("10:00");
  const [saved,   setSaved]   = useState(false);

  // Derived day name from date picker
  const dateDayName = (function(){
    var d = new Date(pickDate+"T12:00:00");
    return DAYS[(d.getDay()+6)%7];
  })();

  const effectiveDay = mode==="date" ? dateDayName : day;

  // Smart default: end of last block for chosen day
  useEffect(()=>{
    if(mode==="week"){
      const blocks=getDayBlocks(effectiveDay);
      if(blocks.length>0){
        const sorted=[...blocks].sort((a,b)=>a.start.localeCompare(b.start));
        const lastEnd=sorted[sorted.length-1].end;
        setStart(lastEnd);
        const [h,m]=lastEnd.split(":").map(Number);
        const endM=h*60+m+60;
        setEnd(String(Math.floor(endM/60)%24).padStart(2,"0")+":"+String(endM%60).padStart(2,"0"));
      } else {
        setStart("09:00"); setEnd("10:00");
      }
    }
  },[day,mode]);

  function handleSave(){
    const blk={
      id:uid(),type:"section",sectionId:task.sectionId,
      label:task.title,start,end,
      linkedItems:[{type:"task",id:task.id,snapshot:task.title},
        ...(task.linkedNoteIds||[]).map(nid=>({type:"note",id:nid,snapshot:""}))],
    };
    if(mode==="date"){
      var wk = mondayOf(new Date(pickDate+"T12:00:00"));
      setTt(function(prev){
        var w = Object.assign({},prev[wk]||{});
        var arr = [].concat(w[dateDayName]||[]);
        arr.push(blk);
        w[dateDayName] = arr;
        return Object.assign({},prev,function(){var o={};o[wk]=w;return o;}());
      });
    } else {
      upsertBlock(effectiveDay,blk);
    }
    setSaved(true);
    setTimeout(onClose,600);
  }

  const sec=byId[task.sectionId]||{color:"#9B8E80",label:"?"};

  return (
    <Overlay onClose={onClose} width={440}>
      <div style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,marginBottom:4}}>Schedule Task</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,padding:"8px 12px",background:sec.color+"18",borderRadius:9,border:"1px solid "+sec.color+"40"}}>
        <Dot color={sec.color} size={8}/>
        <span style={{fontSize:13,fontWeight:600,color:"#1C1714",flex:1}}>{task.title}</span>
        <span style={{fontSize:11,color:sec.color,fontWeight:700}}>{sec.label}</span>
      </div>

      {/* Mode toggle */}
      <div style={{display:"flex",gap:4,marginBottom:14,background:"#EBE4D8",borderRadius:8,padding:3}}>
        <button onClick={()=>setMode("week")} style={{flex:1,padding:"5px 0",borderRadius:6,border:"none",fontSize:11,fontWeight:600,background:mode==="week"?"#FDFAF6":"transparent",color:mode==="week"?"#1C1714":"#7A6C5E",boxShadow:mode==="week"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>This Week</button>
        <button onClick={()=>setMode("date")} style={{flex:1,padding:"5px 0",borderRadius:6,border:"none",fontSize:11,fontWeight:600,background:mode==="date"?"#FDFAF6":"transparent",color:mode==="date"?"#1C1714":"#7A6C5E",boxShadow:mode==="date"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>Pick a Date</button>
      </div>

      {mode==="week" ? <>
        <span style={S.lbl}>Day</span>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:16}}>
          {DAYS.map(d=>(
            <button key={d} onClick={()=>setDay(d)}
              style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,border:"1.5px solid",
                borderColor:day===d?sec.color:"#D6CEC3",
                background:day===d?sec.color:"transparent",
                color:day===d?textFor(sec.color):"#6B5E4E"}}>
              {d.slice(0,3)}
            </button>
          ))}
        </div>
      </> : <>
        <span style={S.lbl}>Date</span>
        <input type="date" value={pickDate} onChange={e=>setPickDate(e.target.value)}
          style={{...S.input,marginBottom:6,fontSize:13}}/>
        <div style={{fontSize:11,color:"#7A6C5E",marginBottom:16}}>
          {dateDayName} &middot; Week of {mondayOf(new Date(pickDate+"T12:00:00"))}
        </div>
      </>}

      <div style={{display:"flex",gap:14,marginBottom:20}}>
        <TimePicker value={start} onChange={v=>{setStart(v);}} label="Start"/>
        <TimePicker value={end}   onChange={v=>{setEnd(v);}}   label="End"/>
      </div>

      <div style={{display:"flex",gap:8}}>
        <button onClick={handleSave} disabled={saved}
          style={{...S.btnDark,background:saved?"#1A7A43":sec.color,flex:1}}>
          {saved?"\u2713 Scheduled!":"Add to Timetable"}
        </button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
      </div>
    </Overlay>
  );
}


// ─── Import/Export Modal ──────────────────────────────────────────────────────

// ─── Import / Export Modal ────────────────────────────────────────────────────

function ImportExportModal({onExport,onImport,onClose,sections}) {
  const fileRef=useRef();
  const [tab,         setTab]         = useState("export");
  const [inclSections,setInclSections]= useState(true);
  const [inclTasks,   setInclTasks]   = useState(true);
  const [inclTt,      setInclTt]      = useState(true);
  const [inclNotes,   setInclNotes]   = useState(true);
  const [inclTrackers,setInclTrackers]= useState(true);
  const [taskSecIds,  setTaskSecIds]  = useState([]); // empty = all
  const [noteSecIds,  setNoteSecIds]  = useState([]);
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  function toggleSec(id, list, setList){
    setList(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  }

  function doExport(){
    onExport({inclSections,inclTasks,taskSecIds,dateFrom:dateFrom||null,dateTo:dateTo||null,inclTt,inclNotes,noteSecIds,inclTrackers});
    onClose();
  }

  const anythingSelected=inclSections||inclTasks||inclTt||inclNotes||inclTrackers;

  return (
    <Overlay onClose={onClose} width={520}>
      <div style={{fontFamily:'"Playfair Display",serif',fontSize:20,fontWeight:700,marginBottom:16}}>Import / Export</div>
      {/* Tab bar */}
      <div style={{display:"flex",gap:6,marginBottom:20,background:"#EBE4D8",borderRadius:9,padding:3,width:"fit-content"}}>
        {[["export","Export"],["import","Import"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"5px 18px",borderRadius:7,border:"none",fontSize:12,fontWeight:600,
            background:tab===t?"#FDFAF6":"transparent",color:tab===t?"#1C1714":"#6B5E4E",
            boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{l}</button>
        ))}
      </div>

      {tab==="export"&&(
        <div>
          {/* What to include */}
          <label style={S.lbl}>Include</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[[inclSections,setInclSections,"Sections (settings)"],[inclTasks,setInclTasks,"Tasks"],[inclTt,setInclTt,"Timetable"],[inclNotes,setInclNotes,"Notes"],[inclTrackers,setInclTrackers,"Trackers"]].map(([val,set,label],i)=>(
              <label key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#F3EDE3",borderRadius:8,border:`1.5px solid ${val?"#4B3FC7":"#E3D9CC"}`,cursor:"pointer",fontSize:12,fontWeight:500}}>
                <input type="checkbox" checked={val} onChange={()=>set(v=>!v)} style={{accentColor:"#4B3FC7",width:14,height:14}}/>
                {label}
              </label>
            ))}
          </div>

          {/* Task filters */}
          {inclTasks&&(
            <div style={{marginBottom:14,padding:"10px 14px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
              <label style={{...S.lbl,marginBottom:8}}>Filter Tasks</label>
              <div style={{marginBottom:10}}>
                <span style={{fontSize:11,color:"#6B5E4E",fontWeight:600,display:"block",marginBottom:5}}>Sections (leave all unchecked = export all)</span>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {sections.map(s=>(
                    <button key={s.id} onClick={()=>toggleSec(s.id,taskSecIds,setTaskSecIds)}
                      style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,border:"1.5px solid",
                        borderColor:taskSecIds.includes(s.id)?s.color:"#D6CEC3",
                        background:taskSecIds.includes(s.id)?s.color+"22":"transparent",
                        color:taskSecIds.includes(s.id)?s.color:"#6B5E4E"}}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <div style={{flex:1}}>
                  <span style={{fontSize:11,color:"#6B5E4E",fontWeight:600,display:"block",marginBottom:4}}>Created from</span>
                  <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...S.input,marginBottom:0,padding:"4px 8px",fontSize:11}}/>
                </div>
                <div style={{flex:1}}>
                  <span style={{fontSize:11,color:"#6B5E4E",fontWeight:600,display:"block",marginBottom:4}}>Created to</span>
                  <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...S.input,marginBottom:0,padding:"4px 8px",fontSize:11}}/>
                </div>
              </div>
            </div>
          )}

          {/* Note section filter */}
          {inclNotes&&(
            <div style={{marginBottom:16,padding:"10px 14px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
              <label style={{...S.lbl,marginBottom:8}}>Filter Notes</label>
              <span style={{fontSize:11,color:"#6B5E4E",fontWeight:600,display:"block",marginBottom:5}}>Sections (leave all unchecked = export all)</span>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {sections.map(s=>(
                  <button key={s.id} onClick={()=>toggleSec(s.id,noteSecIds,setNoteSecIds)}
                    style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,border:"1.5px solid",
                      borderColor:noteSecIds.includes(s.id)?s.color:"#D6CEC3",
                      background:noteSecIds.includes(s.id)?s.color+"22":"transparent",
                      color:noteSecIds.includes(s.id)?s.color:"#6B5E4E"}}>{s.label}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:8}}>
            <button onClick={doExport} disabled={!anythingSelected}
              style={{...S.btnDark,flex:1,opacity:anythingSelected?1:0.4}}>Export JSON</button>
            <button onClick={onClose} style={S.btnGhost}>Cancel</button>
          </div>
          {!anythingSelected&&<p style={{fontSize:11,color:"#C43A3A",marginTop:8}}>Select at least one data type to export.</p>}
        </div>
      )}

      {tab==="import"&&(
        <div>
          <p style={{fontSize:12,color:"#6B5E4E",marginBottom:14,lineHeight:1.5}}>Load a <code style={{fontSize:11,background:"#EBE4D8",padding:"1px 5px",borderRadius:4}}>.json</code> file exported from Progress You. You'll confirm before anything is overwritten.</p>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}}
                 onChange={e=>{if(e.target.files[0]){onImport(e.target.files[0]);e.target.value="";onClose();}}}/>
          <button onClick={()=>fileRef.current?.click()} style={{...S.btnDark,width:"100%",display:"flex",justifyContent:"center",gap:8,marginBottom:12}}>
            &#x2191; Choose file to import&#x2026;
          </button>
          <button onClick={onClose} style={S.btnGhost}>Close</button>
        </div>
      )}
    </Overlay>
  );
}

// ─── Block Modal ──────────────────────────────────────────────────────────────

function BlockModal({day,block,sections,onSave,onDelete,onClose,tasks,allNotes,trackers,addSetBlock,dayBlocks}) {
  const {navigateTo}=React.useContext(NavCtx)||{};
  const [type,    setType]    = useState(block?.type||"section");
  const [secId,   setSecId]   = useState(block?.sectionId||sections[0]?.id||"");
  const [label,   setLabel]   = useState(block?.label||"");
  const [start,   setStart]   = useState(()=>{
    if(block?.start) return block.start;
    if(dayBlocks&&dayBlocks.length>0){
      const sorted=[...dayBlocks].sort((a,b)=>a.start.localeCompare(b.start));
      return sorted[sorted.length-1].end;
    }
    return "09:00";
  });
  const [end,     setEnd]     = useState(()=>{
    if(block?.end) return block.end;
    if(dayBlocks&&dayBlocks.length>0){
      const sorted=[...dayBlocks].sort((a,b)=>a.start.localeCompare(b.start));
      const lastEnd=sorted[sorted.length-1].end;
      const [h,m]=lastEnd.split(":").map(Number);
      const endM=h*60+m+90;
      return `${String(Math.floor(endM/60)%24).padStart(2,"0")}:${String(endM%60).padStart(2,"0")}`;
    }
    return "10:30";
  });
  // linkedItems: [{type:"task"|"note", id, snapshot}]
  const [linkedItems,setLinkedItems]=useState(()=>{
    if(block?.linkedItems) return block.linkedItems;
    // migrate old format
    const items=[];
    if(block?.linkedTaskId) items.push({type:"task",id:block.linkedTaskId,snapshot:block.linkedTaskSnapshot||""});
    if(block?.linkedNoteId) items.push({type:"note",id:block.linkedNoteId,snapshot:block.linkedNoteSnapshot||""});
    return items;
  });
  const [taskSearch,setTaskSearch]=useState("");
  const [noteSearch,setNoteSearch]=useState("");
  const [showTaskPick,setShowTaskPick]=useState(false);
  const [showNotePick,setShowNotePick]=useState(false);
  const [trackerSearch,setTrackerSearch]=useState("");
  const [showTrackerPick,setShowTrackerPick]=useState(false);

  const sec=sections.find(s=>s.id===secId)||sections[0]||{color:"#7C7166"};
  const filteredTasks=(tasks||[]).filter(t=>t.type!=="spacer"&&!linkedItems.find(i=>i.type==="task"&&i.id===t.id)&&(!taskSearch||t.title.toLowerCase().includes(taskSearch.toLowerCase()))).slice(0,10);
  const filteredNotes=(allNotes||[]).filter(n=>!linkedItems.find(i=>i.type==="note"&&i.id===n.id)&&(!noteSearch||n.title.toLowerCase().includes(noteSearch.toLowerCase()))).slice(0,10);
  const filteredTrackers=(trackers||[]).filter(t=>!t.archived&&!linkedItems.find(i=>i.type==="tracker"&&i.id===t.id)&&(!trackerSearch||t.title.toLowerCase().includes(trackerSearch.toLowerCase()))).slice(0,10);

  function linkTask(t){ setLinkedItems(p=>[...p,{type:"task",id:t.id,snapshot:t.title}]); setTaskSearch(""); setShowTaskPick(false); }
  function linkNote(n){ setLinkedItems(p=>[...p,{type:"note",id:n.id,snapshot:n.title}]); setNoteSearch(""); setShowNotePick(false); }
  function linkTracker(t){ setLinkedItems(p=>[...p,{type:"tracker",id:t.id,snapshot:t.title}]); setTrackerSearch(""); setShowTrackerPick(false); }
  function unlinkItem(idx){ setLinkedItems(p=>p.filter((_,i)=>i!==idx)); }

  function resolveItem(item){
    if(item.type==="task"){ const t=(tasks||[]).find(t=>t.id===item.id); return{label:t?.title||item.snapshot,live:!!t,obj:t}; }
    if(item.type==="tracker"){ const t=(trackers||[]).find(t=>t.id===item.id); return{label:t?.title||item.snapshot,live:!!t,obj:t}; }
    const n=(allNotes||[]).find(n=>n.id===item.id); return{label:n?.title||item.snapshot,live:!!n,obj:n};
  }

  function doSave(){
    onSave(day,{id:block?.id||uid(),type,sectionId:type==="section"?secId:null,label,start,end,linkedItems});
  }
  function doSaveAsSetBlock(){
    addSetBlock?.({type,sectionId:type==="section"?secId:null,label,start,end});
  }

  return (
    <Overlay onClose={onClose} width={480}>
      <div style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,marginBottom:4}}>{block?"Edit Block":"Add Block"}</div>
      <div style={{fontSize:12,color:"#9B8E80",marginBottom:20}}>{day}</div>
      <span style={S.lbl}>Block Type</span>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {[["section","Work Block"],["break","Break / Buffer"]].map(([t,l])=>(
          <Pill key={t} active={type===t} onClick={()=>setType(t)}>{l}</Pill>
        ))}
      </div>
      {type==="section"&&<>
        <span style={S.lbl}>Section</span>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:18}}>
          {sections.map(s=>(
            <button key={s.id} onClick={()=>setSecId(s.id)} style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,border:secId===s.id?`2px solid ${s.color}`:"1.5px solid #D6CEC3",background:secId===s.id?s.color:"transparent",color:secId===s.id?textFor(s.color):"#6B5E4E"}}>{s.label}</button>
          ))}
        </div>
      </>}
      <span style={S.lbl}>Label <span style={{fontSize:9,opacity:0.5,textTransform:"none"}}>(optional)</span></span>
      <input value={label} onChange={e=>setLabel(e.target.value)} placeholder={type==="break"?"e.g. Lunch, Admin…":sec.label} style={S.input}/>
      <div style={{display:"flex",gap:14,marginBottom:16}}>
        <TimePicker value={start} onChange={setStart} label="Start"/>
        <TimePicker value={end}   onChange={setEnd}   label="End"/>
      </div>

      {/* Linked items */}
      <div style={{marginBottom:16,padding:"9px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
        <span style={S.lbl}>Linked Tasks &amp; Notes</span>
        {linkedItems.map((item,i)=>{
          const r=resolveItem(item);
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,padding:"4px 8px",borderRadius:7,background:"#FDFAF6",border:"1px solid #E3D9CC"}}>
              <span style={{fontSize:11,color:item.type==="task"?"#4B3FC7":item.type==="tracker"?"#0C7B7B":"#6B3FC7",fontWeight:600,flexShrink:0}}>{item.type==="task"?"Task":item.type==="tracker"?"Tracker":"Note"}</span>
              <span onClick={()=>r.live&&navigateTo?.({type:item.type,id:item.id})}
                style={{fontSize:12,flex:1,color:r.live?"#1C1714":"#9B8E80",fontStyle:r.live?"normal":"italic",cursor:r.live?"pointer":"default",textDecoration:r.live?"underline":"none"}}>
                {r.label}{!r.live&&" (removed)"}
              </span>
              <button onClick={()=>unlinkItem(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:12,padding:0}}>&#xd7;</button>
            </div>
          );
        })}
        <div style={{display:"flex",gap:6,marginTop:linkedItems.length?6:0,flexWrap:"wrap"}}>
          {/* Add task */}
          <div style={{position:"relative"}}>
            <button onClick={()=>{setShowTaskPick(v=>!v);setShowNotePick(false);setShowTrackerPick(false);}} style={{...S.btnMicro,fontSize:11}}>+ Task</button>
            {showTaskPick&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:230,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
                <input value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} placeholder="Search tasks…"
                  style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}} autoFocus/>
                {filteredTasks.length===0&&<div style={{fontSize:11,color:"#9B8E80",padding:"4px 2px"}}>No tasks found.</div>}
                {filteredTasks.map(t=>(
                  <div key={t.id} onClick={()=>linkTask(t)} style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{t.title}</div>
                ))}
              </div>
            )}
          </div>
          {/* Add note */}
          <div style={{position:"relative"}}>
            <button onClick={()=>{setShowNotePick(v=>!v);setShowTaskPick(false);setShowTrackerPick(false);}} style={{...S.btnMicro,fontSize:11}}>+ Note</button>
            {showNotePick&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:230,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
                <input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Search notes…"
                  style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}} autoFocus/>
                {filteredNotes.length===0&&<div style={{fontSize:11,color:"#9B8E80",padding:"4px 2px"}}>No notes found.</div>}
                {filteredNotes.map(n=>(
                  <div key={n.id} onClick={()=>linkNote(n)} style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{n.title}</div>
                ))}
              </div>
            )}
          </div>
          {/* Add tracker */}
          <div style={{position:"relative"}}>
            <button onClick={()=>{setShowTrackerPick(v=>!v);setShowTaskPick(false);setShowNotePick(false);}} style={{...S.btnMicro,fontSize:11}}>+ Tracker</button>
            {showTrackerPick&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:230,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
                <input value={trackerSearch} onChange={e=>setTrackerSearch(e.target.value)} placeholder="Search trackers…"
                  style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}} autoFocus/>
                {filteredTrackers.length===0&&<div style={{fontSize:11,color:"#9B8E80",padding:"4px 2px"}}>No trackers found.</div>}
                {filteredTrackers.map(t=>(
                  <div key={t.id} onClick={()=>linkTracker(t)} style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}
                    onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{width:8,height:8,borderRadius:3,background:t.color,flexShrink:0}}/>{t.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={doSave} style={{...S.btnDark,background:type==="section"?sec.color:"#8B7D6B"}}>Save</button>
        <button onClick={()=>{doSave();doSaveAsSetBlock();}} style={{...S.btnGhost,fontSize:12}}>Save + Add to Palette</button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        {block&&<button onClick={()=>onDelete(day,block.id)} style={{...S.btnGhost,marginLeft:"auto",borderColor:"#F1A0A0",color:"#C43A3A"}}>Delete</button>}
      </div>
    </Overlay>
  );
}


// ─── Template Modal ───────────────────────────────────────────────────────────

function TemplateModal({template,sections,byId,tasks,allNotes,trackers,onSave,onClose}) {
  const openCtx=React.useContext(CtxMenuCtx);
  const isNew=!template;
  const [name,  setName]  = useState(template?.name||"");
  const [color, setColor] = useState(template?.color||"#4B3FC7");
  const [blocks,setBlocks]= useState(()=>JSON.parse(JSON.stringify(template?.blocks||{})));
  const [modal, setModal] = useState(null); // {day,block}

  function getTmplBlocks(day){ return [...(blocks[day]||[])].sort((a,b)=>a.start.localeCompare(b.start)); }
  function upsertTmplBlock(day,blk){
    setBlocks(prev=>{
      const arr=[...(prev[day]||[])]; const i=arr.findIndex(b=>b.id===blk.id);
      if(i>=0) arr[i]=blk; else arr.push(blk);
      return{...prev,[day]:arr};
    });
  }
  function deleteTmplBlock(day,id){
    setBlocks(prev=>({...prev,[day]:(prev[day]||[]).filter(b=>b.id!==id)}));
  }
  function handleSave(){
    if(!name.trim()) return;
    onSave({id:template?.id||uid(),name:name.trim(),color,blocks});
  }

  return (
    <Overlay onClose={onClose} width={900}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700}}>{isNew?"New Template":"Edit Template"}</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Template name…"
          style={{...S.input,marginBottom:0,flex:1,minWidth:140,fontSize:14,fontWeight:600}} autoFocus/>
        <div style={{minWidth:240}}><ColorPicker value={color} onChange={setColor} label="Template Colour"/></div>
        <button onClick={handleSave} style={{...S.btnDark,background:color}}>Save</button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
      </div>
      {/* Mini week grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,overflowX:"auto"}}>
        {DAYS.map(day=>{
          const dayBlocks=getTmplBlocks(day);
          return (
            <div key={day}>
              <div style={{marginBottom:8,paddingBottom:6,borderBottom:`2px solid ${color}40`}}>
                <span style={{fontFamily:'"Playfair Display",serif',fontWeight:700,fontSize:12,color:color}}>{day.slice(0,3)}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {dayBlocks.map(blk=>{
                  if(blk.type==="break") return (
                    <div key={blk.id} onClick={()=>setModal({day,block:blk})}
                      onContextMenu={e=>{if(!openCtx)return;openCtx(e,[{label:"Edit",action:()=>setModal({day,block:blk})},{divider:true},{label:"Delete",danger:true,action:()=>deleteTmplBlock(day,blk.id)}]);}}
                      style={{background:"#F3EDE3",borderRadius:7,padding:"5px 8px",border:"1.5px dashed #C2B49E",cursor:"pointer",fontSize:10}}>
                      <div style={{color:"#9B8E80",fontWeight:700}}>{blk.start}–{blk.end}</div>
                      <div style={{color:"#C2B49E",fontStyle:"italic"}}>{blk.label||"Break"}</div>
                    </div>
                  );
                  const sec=byId[blk.sectionId]||{color:"#9B8E80",label:"?"};
                  return (
                    <div key={blk.id} onClick={()=>setModal({day,block:blk})}
                      onContextMenu={e=>{if(!openCtx)return;openCtx(e,[{label:"Edit",action:()=>setModal({day,block:blk})},{divider:true},{label:"Delete",danger:true,action:()=>deleteTmplBlock(day,blk.id)}]);}}
                      style={{background:sec.color,color:textFor(sec.color),borderRadius:7,padding:"5px 8px",cursor:"pointer",borderLeft:`2px solid rgba(255,255,255,0.3)`,fontSize:10}}>
                      <div style={{opacity:0.7,fontWeight:700}}>{blk.start}–{blk.end}</div>
                      <div style={{fontWeight:600}}>{blk.label||sec.label}</div>
                    </div>
                  );
                })}
                <button onClick={()=>setModal({day,block:null})}
                  style={{padding:"5px",background:"transparent",border:"1.5px dashed #C2B49E",borderRadius:7,color:"#9B8E80",fontSize:14,lineHeight:1}}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      {modal&&<BlockModal day={modal.day} block={modal.block} sections={sections} tasks={tasks} allNotes={allNotes} trackers={trackers}
        onSave={(day,blk)=>{upsertTmplBlock(day,blk);setModal(null);}}
        onDelete={(day,id)=>{deleteTmplBlock(day,id);setModal(null);}}
        onClose={()=>setModal(null)}/>}
    </Overlay>
  );
}


// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({secColor,onClose,onAdd,initialTitle}) {
  const [title,    setTitle]    = useState(initialTitle||"");
  const [notes,    setNotes]    = useState("");
  const [hasDue,   setHasDue]   = useState(false);
  const [dueDate,  setDueDate]  = useState(todayISO());
  const [status,   setStatus]   = useState("backlog");
  const [priority, setPriority] = useState("normal");
  const [checklist,setChecklist]= useState([]);
  const [newItem,  setNewItem]  = useState("");
  function addItem(){ if(!newItem.trim()) return; setChecklist(p=>[...p,{id:uid(),text:newItem.trim(),done:false}]); setNewItem(""); }
  function removeItem(id){ setChecklist(p=>p.filter(i=>i.id!==id)); }
  function handleAdd(){
    if(!title.trim()) return;
    onAdd(title.trim(),notes.trim(),{dueDate:hasDue?dueDate:null,status,checklist,priority});
  }
  const STATUSES=[{key:"backlog",label:"Backlog",color:"#8B7D6B"},{key:"this-week",label:"This Week",color:"#4B3FC7"},{key:"done",label:"Done",color:"#1A7A43"}];
  return (
    <Overlay onClose={onClose} width={480}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <Dot color={secColor} size={11}/>
        <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700}}>New Task</h2>
      </div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title…"
        style={S.input} autoFocus onKeyDown={e=>e.key==="Enter"&&document.querySelector("[data-add-btn]")?.click()}/>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)…"
        style={{...S.input,resize:"vertical",minHeight:60}}/>
      {/* Status picker */}
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Add to</label>
        <div style={{display:"flex",gap:6}}>
          {STATUSES.map(s=>(
            <button key={s.key} onClick={()=>setStatus(s.key)}
              style={{flex:1,padding:"7px 0",borderRadius:8,border:`2px solid ${status===s.key?s.color:"#D6CEC3"}`,
                background:status===s.key?s.color+"18":"transparent",
                color:status===s.key?s.color:"#7A6C5E",fontSize:12,fontWeight:600}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {/* Priority */}
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Priority</label>
        <div style={{display:"flex",gap:6}}>
          {[["high","↑ High","#C43A3A"],["normal","Normal","#7A6C5E"],["low","↓ Low","#9B8E80"]].map(([k,l,c])=>(
            <button key={k} onClick={()=>setPriority(k)}
              style={{flex:1,padding:"7px 0",borderRadius:8,border:"2px solid "+(priority===k?c:"#D6CEC3"),
                background:priority===k?c+"18":"transparent",
                color:priority===k?c:"#7A6C5E",fontSize:12,fontWeight:600}}>{l}</button>
          ))}
        </div>
      </div>
      {/* Due date */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"9px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
        <button onClick={()=>setHasDue(v=>!v)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${hasDue?"#4B3FC7":"#C2B49E"}`,background:hasDue?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{hasDue?"\u2713":""}</button>
        <span style={{fontSize:12,fontWeight:600,color:"#4A3F30",cursor:"pointer"}} onClick={()=>setHasDue(v=>!v)}>Set due date</span>
        {hasDue&&<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{...S.input,marginBottom:0,flex:1,padding:"5px 10px",fontSize:12}}/>}
      </div>
      {/* Checklist */}
      <div style={{marginBottom:14,padding:"9px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
        <label style={{...S.lbl,marginBottom:8}}>Checklist</label>
        {checklist.map(item=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
            <div style={{width:12,height:12,borderRadius:3,border:"1.5px solid #C2B49E",background:"transparent",flexShrink:0}}/>
            <span style={{fontSize:12,flex:1}}>{item.text}</span>
            <button onClick={()=>removeItem(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#C2B49E",fontSize:11,padding:0}}>&#xd7;</button>
          </div>
        ))}
        <div style={{display:"flex",gap:6,marginTop:checklist.length?6:0}}>
          <input value={newItem} onChange={e=>setNewItem(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addItem()}
            placeholder="Add item…" style={{...S.input,marginBottom:0,flex:1,padding:"5px 9px",fontSize:12}}/>
          <button onClick={addItem} style={S.btnMicro}>+</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button data-add-btn onClick={handleAdd} style={{...S.btnDark,background:secColor,flex:1}}>Add Task</button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
      </div>
    </Overlay>
  );
}

// ─── Task Edit Modal ──────────────────────────────────────────────────────────

function TaskEditModal({task,secColor,sections,allNotes,updateTask,completeTask,deleteTask,onClose}) {
  const {navigateTo}=React.useContext(NavCtx)||{};
  const [title,    setTitle]    = useState(task.title||"");
  const [notes,    setNotes]    = useState(task.notes||"");
  const [status,   setStatus]   = useState(task.status||"backlog");
  const [priority, setPriority] = useState(task.priority||"normal");
  const [hasDue,   setHasDue]   = useState(!!task.dueDate);
  const [dueDate,  setDueDate]  = useState(task.dueDate||todayISO());
  const [dueTime,  setDueTime]  = useState(task.dueTime||"");
  const [allDay,   setAllDay]   = useState(task.allDay!==false);
  const [remindAt, setRemindAt] = useState(task.remindAt||"");
  const [checklist,setChecklist]= useState(task.checklist||[]);
  const [newItem,  setNewItem]  = useState("");
  const [noteSearch,setNoteSearch]=useState("");
  const [showNotePick,setShowNotePick]=useState(false);

  const linkedNotes=(task.linkedNoteIds||[]).map(id=>(allNotes||[]).find(n=>n.id===id)).filter(Boolean);
  const filteredNotes=(allNotes||[]).filter(n=>!(task.linkedNoteIds||[]).includes(n.id)&&(!noteSearch||n.title.toLowerCase().includes(noteSearch.toLowerCase()))).slice(0,10);

  function addCheckItem(){ if(!newItem.trim()) return; setChecklist(p=>[...p,{id:uid(),text:newItem.trim(),done:false}]); setNewItem(""); }
  function linkNote(id){ updateTask(task.id,{linkedNoteIds:[...(task.linkedNoteIds||[]),id]}); }
  function unlinkNote(id){ updateTask(task.id,{linkedNoteIds:(task.linkedNoteIds||[]).filter(x=>x!==id)}); }

  function save(){
    updateTask(task.id,{
      title:title.trim()||task.title, notes:notes.trim()||null,
      status, priority,
      dueDate:hasDue?dueDate:null, dueTime:hasDue&&!allDay&&dueTime?dueTime:null, allDay,
      checklist, remindAt:remindAt||null, remindFired:remindAt?task.remindFired:false,
    });
    onClose();
  }

  const STATUSES=[{k:"backlog",l:"Backlog"},{k:"this-week",l:"This Week"},{k:"done",l:"Done"}];
  const PRIORITIES=[{k:"high",l:"↑ High",c:"#C43A3A"},{k:"normal",l:"Normal",c:"#9B8E80"},{k:"low",l:"↓ Low",c:"#7A6C5E"}];

  return (
    <Overlay onClose={onClose} width={500}>
      <div style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:10,height:10,borderRadius:"50%",background:secColor,flexShrink:0}}/>
        Edit Task
      </div>
      <input value={title} onChange={e=>setTitle(e.target.value)} autoFocus
        style={{...S.input,fontSize:15,fontWeight:600}} placeholder="Task title…"/>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)…"
        style={{...S.input,resize:"vertical",minHeight:60,fontSize:13}}/>

      {/* Status + Priority */}
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1}}>
          <span style={S.lbl}>Status</span>
          <div style={{display:"flex",gap:4}}>
            {STATUSES.map(s=>(
              <button key={s.k} onClick={()=>setStatus(s.k)}
                style={{flex:1,padding:"5px 0",borderRadius:7,fontSize:11,fontWeight:600,border:`1.5px solid ${status===s.k?"#4B3FC7":"#D6CEC3"}`,background:status===s.k?"#E6E3F5":"transparent",color:status===s.k?"#4B3FC7":"#6B5E4E"}}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1}}>
          <span style={S.lbl}>Priority</span>
          <div style={{display:"flex",gap:4}}>
            {PRIORITIES.map(p=>(
              <button key={p.k} onClick={()=>setPriority(p.k)}
                style={{flex:1,padding:"5px 0",borderRadius:7,fontSize:11,fontWeight:600,border:`1.5px solid ${priority===p.k?p.c:"#D6CEC3"}`,background:priority===p.k?p.c+"18":"transparent",color:priority===p.k?p.c:"#6B5E4E"}}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Due date */}
      <div style={{marginBottom:12,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:hasDue?8:0}}>
          <button onClick={()=>setHasDue(v=>!v)}
            style={{width:16,height:16,borderRadius:3,border:`2px solid ${hasDue?"#4B3FC7":"#C2B49E"}`,background:hasDue?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>
            {hasDue?"\u2713":""}
          </button>
          <span onClick={()=>setHasDue(v=>!v)} style={{fontSize:12,fontWeight:600,color:"#4A3F30",cursor:"pointer"}}>Due date</span>
          {hasDue&&<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{...S.input,marginBottom:0,flex:1,padding:"3px 8px",fontSize:11}}/>}
        </div>
        {hasDue&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setAllDay(v=>!v)}
              style={{width:16,height:16,borderRadius:3,border:`2px solid ${allDay?"#4B3FC7":"#C2B49E"}`,background:allDay?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>
              {allDay?"\u2713":""}
            </button>
            <span onClick={()=>setAllDay(v=>!v)} style={{fontSize:11,fontWeight:600,color:"#4A3F30",cursor:"pointer"}}>All day</span>
            {!allDay&&<input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)} style={{...S.input,marginBottom:0,flex:1,padding:"3px 8px",fontSize:11}}/>}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div style={{marginBottom:12,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
        <span style={S.lbl}>Checklist</span>
        {checklist.map((item,i)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
            <button onClick={()=>setChecklist(p=>p.map((x,j)=>j===i?{...x,done:!x.done}:x))}
              style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${item.done?"#1A7A43":"#C2B49E"}`,background:item.done?"#1A7A43":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",cursor:"pointer"}}>
              {item.done?"\u2713":""}
            </button>
            <span style={{fontSize:12,flex:1,textDecoration:item.done?"line-through":"none",color:item.done?"#9B8E80":"#1C1714"}}>{item.text}</span>
            <button onClick={()=>setChecklist(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#C2B49E",fontSize:10,padding:0}}>&#xd7;</button>
          </div>
        ))}
        <div style={{display:"flex",gap:6,marginTop:checklist.length?6:0}}>
          <input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Add item…"
            onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addCheckItem())}
            style={{...S.input,marginBottom:0,flex:1,padding:"4px 8px",fontSize:11}}/>
          <button onClick={addCheckItem} style={{...S.btnMicro,padding:"4px 10px"}}>+</button>
        </div>
      </div>

      {/* Linked notes */}
      <div style={{marginBottom:12,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
        <span style={S.lbl}>Linked Notes</span>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:linkedNotes.length?8:0}}>
          {linkedNotes.map(n=>(
            <div key={n.id} style={{display:"inline-flex",alignItems:"center",gap:4,background:"#E6E3F5",borderRadius:7,padding:"3px 8px",fontSize:11,color:"#4B3FC7",fontWeight:500}}>
              {n.title}
              <button onClick={()=>unlinkNote(n.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#7A6CBF",fontSize:10,padding:"0 0 0 3px"}}>&#xd7;</button>
            </div>
          ))}
        </div>
        <div style={{position:"relative",display:"inline-block"}}>
          <button onClick={()=>setShowNotePick(v=>!v)} style={{...S.btnMicro,fontSize:11}}>+ Link note</button>
          {showNotePick&&(
            <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:210,maxHeight:180,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
              <input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Search notes…"
                style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}} autoFocus/>
              {filteredNotes.map(n=>(
                <div key={n.id} onClick={()=>{linkNote(n.id);setShowNotePick(false);}}
                  style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{n.title}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reminder */}
      <div style={{marginBottom:18,padding:"8px 12px",background:task.remindFired?"#D4F0E0":"#F3EDE3",borderRadius:9,border:`1px solid ${task.remindFired?"#9AD4B5":"#E3D9CC"}`,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,fontWeight:600,color:task.remindFired?"#1A7A43":"#4A3F30",flexShrink:0}}>{task.remindFired?"Reminded":"Remind at"}</span>
        <input type="datetime-local" value={remindAt} onChange={e=>setRemindAt(e.target.value)}
          style={{...S.input,marginBottom:0,flex:1,padding:"3px 8px",fontSize:11}}/>
        {remindAt&&<button onClick={()=>setRemindAt("")} style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:12,padding:0}}>&#xd7;</button>}
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={save} style={{...S.btnDark,background:secColor,flex:1}}>Save</button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        <button onClick={()=>{deleteTask(task.id);onClose();}} style={{...S.btnGhost,borderColor:"#F1A0A0",color:"#C43A3A"}}>Delete</button>
      </div>
    </Overlay>
  );
}

// ─── Section Delete Overlay ──────────────────────────────────────────────────

function SectionDeleteOverlay({secLabel,secColor,taskCount,noteCount,blockCount,otherSections,onDelete,onMigrate,onClose}) {
  const [action, setAction] = useState("migrate"); // "delete" | "migrate"
  const [targetId, setTargetId] = useState(otherSections[0]?.id||"");
  const totalItems = taskCount + noteCount + blockCount;
  const hasItems = totalItems > 0;

  function handleConfirm() {
    if (!hasItems) { onDelete(); return; }
    if (action === "delete") { onDelete(); }
    else { onMigrate(targetId); }
  }

  return (
    <Overlay onClose={onClose} width={460}>
      <div style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,marginBottom:6,color:"#1C1714",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:12,height:12,borderRadius:"50%",background:secColor,flexShrink:0}}/>
        Remove "{secLabel}"?
      </div>

      {hasItems ? (
        <div>
          <p style={{fontSize:13,color:"#6B5E4E",lineHeight:1.55,marginBottom:16}}>
            This section contains:
          </p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
            {taskCount>0 && <span style={{fontSize:12,fontWeight:600,background:"#E6E3F5",color:"#4B3FC7",padding:"3px 10px",borderRadius:20}}>{taskCount} task{taskCount!==1?"s":""}</span>}
            {noteCount>0 && <span style={{fontSize:12,fontWeight:600,background:"#E3F0FB",color:"#2A6FAD",padding:"3px 10px",borderRadius:20}}>{noteCount} note{noteCount!==1?"s":""}</span>}
            {blockCount>0 && <span style={{fontSize:12,fontWeight:600,background:"#EBE4D8",color:"#6B5E4E",padding:"3px 10px",borderRadius:20}}>{blockCount} timetable block{blockCount!==1?"s":""}</span>}
          </div>

          <div style={{marginBottom:18}}>
            <span style={S.lbl}>What should happen to these items?</span>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* Migrate option */}
              <div onClick={()=>setAction("migrate")}
                style={{padding:"12px 14px",borderRadius:10,border:`2px solid ${action==="migrate"?"#4B3FC7":"#E3D9CC"}`,
                  background:action==="migrate"?"#E6E3F520":"transparent",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:action==="migrate"?10:0}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${action==="migrate"?"#4B3FC7":"#C2B49E"}`,
                    background:action==="migrate"?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {action==="migrate"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#1C1714"}}>Move to another section</div>
                    <div style={{fontSize:11,color:"#9B8E80"}}>All tasks, notes, and blocks will be reassigned</div>
                  </div>
                </div>
                {action==="migrate"&&(
                  <div style={{marginLeft:24}}>
                    <select value={targetId} onChange={e=>setTargetId(e.target.value)}
                      style={{...S.input,marginBottom:0,fontSize:12,fontWeight:600}}>
                      {otherSections.map(s=>(
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Delete option */}
              <div onClick={()=>setAction("delete")}
                style={{padding:"12px 14px",borderRadius:10,border:`2px solid ${action==="delete"?"#C43A3A":"#E3D9CC"}`,
                  background:action==="delete"?"#FAE0E020":"transparent",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${action==="delete"?"#C43A3A":"#C2B49E"}`,
                    background:action==="delete"?"#C43A3A":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {action==="delete"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#C43A3A"}}>Delete everything</div>
                    <div style={{fontSize:11,color:"#9B8E80"}}>All tasks, notes, and blocks in this section will be permanently removed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p style={{fontSize:13,color:"#6B5E4E",lineHeight:1.55,marginBottom:18}}>
          This section has no tasks, notes, or timetable blocks. It can be safely removed.
        </p>
      )}

      <div style={{display:"flex",gap:8}}>
        <button onClick={handleConfirm}
          style={{...S.btnDark,flex:1,background:action==="delete"&&hasItems?"#C43A3A":"#1C1714"}}>
          {!hasItems?"Remove Section":action==="delete"?"Delete Section & Items":"Move Items & Remove Section"}
        </button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
      </div>
    </Overlay>
  );
}

// ─── Update Dialog ────────────────────────────────────────────────────────────

function UpdateDialog({info,onSkip,onRemind}) {

  const [phase,setPhase]=useState("idle"); // idle | downloading | done | error
  const [errMsg,setErrMsg]=useState("");

  async function handleUpdate() {
    setPhase("downloading");
    try {
      await window.__TAURI__.core.invoke('install_update');
      setPhase("done"); // app will restart automatically; this is a fallback
    } catch(e) {
      setErrMsg(e?.toString()||"Unknown error");
      setPhase("error");
    }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,23,20,0.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:20}}>
      <div style={{background:"#FDFAF6",borderRadius:14,width:480,maxWidth:"100%",boxShadow:"0 28px 72px rgba(0,0,0,0.42)",border:"1px solid #E3D9CC",overflow:"hidden"}}>

        {/* Header */}
        <div style={{background:"#1C1714",padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{"\u2B06"}</span>
          <span style={{fontFamily:'"Playfair Display",serif',fontSize:16,fontWeight:700,color:"#F8F3EC"}}>Update Available</span>
          <span style={{marginLeft:"auto",background:"#4B3FC7",color:"#fff",borderRadius:20,padding:"3px 11px",fontSize:12,fontWeight:700}}>v{info.version}</span>
        </div>

        <div style={{padding:"20px"}}>
          {/* Changelog */}
          {info.notes && (
            <div style={{background:"#F3EDE3",borderRadius:10,padding:"14px 16px",marginBottom:18,maxHeight:220,overflowY:"auto"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:8}}>What's new</div>
              <pre style={{fontSize:12,color:"#4A3F30",lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:'"DM Sans",sans-serif',margin:0}}>{info.notes}</pre>
            </div>
          )}

          {/* State-based body */}
          {phase==="idle"&&(
            <>
              <p style={{fontSize:13,color:"#6B5E4E",marginBottom:18,lineHeight:1.5}}>A new version of Progress You is ready to install. The app will restart automatically after updating.</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={handleUpdate} style={{...S.btnDark,flex:1}}>{"\u2B06"} Update Now</button>
                <button onClick={onRemind}     style={S.btnGhost}>Remind Next Launch</button>
                <button onClick={onSkip}       style={{...S.btnGhost,borderColor:"#F1A0A0",color:"#C43A3A"}}>Skip This Version</button>
              </div>
            </>
          )}
          {phase==="downloading"&&(
            <div style={{textAlign:"center",padding:"16px 0"}}>
              <div style={{fontSize:22,marginBottom:10}}>{"\u23F3"}</div>
              <div style={{fontSize:13,fontWeight:600,color:"#4A3F30"}}>Downloading update…</div>
              <div style={{fontSize:12,color:"#9B8E80",marginTop:5}}>The app will restart automatically when ready.</div>
            </div>
          )}
          {phase==="done"&&(
            <div style={{textAlign:"center",padding:"16px 0"}}>
              <div style={{fontSize:22,marginBottom:10}}>{"\u2713"}</div>
              <div style={{fontSize:13,fontWeight:600,color:"#1A7A43"}}>Update installed — restarting…</div>
            </div>
          )}
          {phase==="error"&&(
            <>
              <div style={{background:"#FAE0E0",borderRadius:9,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#C43A3A",marginBottom:4}}>Update failed</div>
                <div style={{fontSize:11,color:"#6B5E4E"}}>{errMsg}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setPhase("idle")} style={S.btnDark}>Try Again</button>
                <button onClick={onRemind} style={S.btnGhost}>Later</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
