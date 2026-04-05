// ─── Taskboards View ──────────────────────────────────────────────────────────────

function BoardsView({sections,byId,tasks,addTask,updateTask,deleteTask,completeTask,moveTask,notes,setView,initialSecId,onSecChange,archiveTask,archiveDoneTasks}) {
  const boardSecs=sections.filter(s=>s.id!=="overhead");
  const [secId,   setSecId]   =useState(()=>{ const id=initialSecId||boardSecs[0]?.id||""; return boardSecs.find(s=>s.id===id)?id:boardSecs[0]?.id||""; });
  const [showAddTask,setShowAddTask]=useState(false);
  const [drag,    setDrag]    =useState(null); // {id,task,startX,startY,x,y,active}
  const [overInfo,setOverInfo]=useState(null);
  const dragRef    =React.useRef(null);
  const overRef    =React.useRef(null);
  const [sortByPriority,setSortByPriority]=useState(false);
  const allNotes=Object.values(notes||{}).flat();
  useEffect(()=>{ if(!boardSecs.find(s=>s.id===secId)&&boardSecs.length>0) setSecId(boardSecs[0].id); },[sections]);
  useEffect(()=>{ onSecChange?.(secId); },[secId]);
  const sec=byId[secId]||boardSecs[0]||{color:"#7C7166",label:""};
  const sTasks=tasks.filter(t=>t.sectionId===secId&&!t.archived);
  const COLS=[{key:"backlog",label:"Backlog",dot:"#8B7D6B"},{key:"this-week",label:"This Week",dot:"#4B3FC7"},{key:"done",label:"Done",dot:"#1A7A43"}];

  // Pointer-based drag — replaces HTML5 drag API (unreliable in WebView2/Tauri)
  function startDrag(e,task){
    e.preventDefault();
    const d={id:task.id,task,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false};
    dragRef.current=d; setDrag(d);
  }
  useEffect(()=>{
    if(!drag) return;
    document.body.classList.add("dragging");
    function onMove(e){
      const prev=dragRef.current; if(!prev) return;
      const dx=e.clientX-prev.startX, dy=e.clientY-prev.startY;
      const active=prev.active||(Math.abs(dx)>5||Math.abs(dy)>5);
      const next={...prev,x:e.clientX,y:e.clientY,active};
      dragRef.current=next; setDrag(next);
      if(active){
        const els=document.elementsFromPoint(e.clientX,e.clientY);
        const colEl=els.find(el=>el.dataset&&el.dataset.col);
        const taskEl=els.find(el=>el.dataset&&el.dataset.taskId&&el.dataset.taskId!==prev.id);
        let beforeId=null;
        if(taskEl){
          const rect=taskEl.getBoundingClientRect();
          const inBottomHalf=e.clientY>rect.top+rect.height/2;
          if(inBottomHalf){
            let sib=taskEl.nextElementSibling;
            while(sib&&!sib.dataset?.taskId) sib=sib.nextElementSibling;
            beforeId=sib?.dataset?.taskId||null;
          } else {
            beforeId=taskEl.dataset.taskId;
          }
        }
        const oi=colEl?{col:colEl.dataset.col,beforeId}:null;
        overRef.current=oi; setOverInfo(oi);
      }
    }
    function onUp(){
      const prev=dragRef.current; const oi=overRef.current;
      if(prev?.active&&oi) moveTask(prev.id,oi.beforeId,oi.col);
      dragRef.current=null; overRef.current=null;
      setDrag(null); setOverInfo(null);
      document.body.classList.remove("dragging");
    }
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
    return()=>{ window.removeEventListener("pointermove",onMove); window.removeEventListener("pointerup",onUp); document.body.classList.remove("dragging"); };
  },[drag?.id]);
  const dragId=drag?.active?drag.id:null;
  return (
    <div>
      <div style={{display:"flex",gap:4,marginBottom:22,flexWrap:"wrap",background:"#EBE4D8",borderRadius:12,padding:4,width:"fit-content",maxWidth:"100%"}}>
        {boardSecs.map(s=>(
          <button key={s.id} onClick={()=>{setSecId(s.id);onSecChange?.(s.id);}} style={{padding:"6px 14px",borderRadius:9,border:"none",fontSize:12,fontWeight:600,transition:"all 0.2s",background:secId===s.id?s.color:"transparent",color:secId===s.id?textFor(s.color):"#6B5E4E"}}>{s.label}</button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <Dot color={sec.color} size={13}/>
        <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:24,fontWeight:700}}>{sec.label}</h2>
        <div style={{flex:1}}/>
        <button onClick={()=>setSortByPriority(v=>!v)} style={{...S.btnGhost,fontSize:12,background:sortByPriority?"#EBE4D8":"transparent",color:sortByPriority?"#4A3F30":"#6B5E4E"}}>⬆ Priority{sortByPriority?" ✓":""}</button>
        <button onClick={()=>addTask(secId,"","",{type:"spacer",status:"backlog"})} style={{...S.btnGhost,fontSize:12}}>+ Spacer</button>
        {sTasks.filter(t=>t.status==="done"&&t.type!=="spacer").length>0&&<button onClick={()=>archiveDoneTasks?.(secId)} style={{...S.btnGhost,fontSize:12,borderColor:"#9AD4B5",color:"#1A7A43"}}>&#x1F4E6; Archive Done</button>}
        <button onClick={()=>setShowAddTask(true)} style={{...S.btnDark,background:sec.color}}>+ Add Task</button>
      </div>
      {showAddTask&&<AddTaskModal secColor={sec.color} onClose={()=>setShowAddTask(false)} onAdd={(title,notes,opts)=>{addTask(secId,title,notes,opts);setShowAddTask(false);}}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {COLS.map(col=>{
          const PRIO_ORDER={high:0,normal:1,low:2};
          const colTasks=sTasks.filter(t=>t.status===col.key).sort((a,b)=>{
            if(sortByPriority){
              const pd=(PRIO_ORDER[a.priority||"normal"]??1)-(PRIO_ORDER[b.priority||"normal"]??1);
              if(pd!==0) return pd;
            }
            return (a.order??0)-(b.order??0);
          });
          const isColOver=overInfo?.col===col.key&&overInfo?.beforeId===null;
          return (
            <div key={col.key} data-col={col.key} className={isColOver?"dz-active":""}
                 style={{background:"#EBE4D8",borderRadius:13,padding:"14px 14px 16px",minHeight:140,transition:"background 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                <Dot color={col.dot} size={8}/>
                <span style={{fontWeight:700,fontSize:13}}>{col.label}</span>
                <span style={{marginLeft:"auto",background:"#D4C9B4",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700,color:"#6B5E4E"}}>{colTasks.filter(t=>t.type!=="spacer").length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {colTasks.length===0&&!dragId&&<div style={{fontSize:12,color:"#9B8E80",fontStyle:"italic",padding:"4px 2px"}}>Empty</div>}
                {colTasks.map(task=>{
                  const isOver=overInfo?.col===col.key&&overInfo?.beforeId===task.id;
                  if(task.type==="spacer") return (
                    <SpacerCard key={task.id} task={task} isOver={isOver} isDragging={dragId===task.id}
                      onPointerDown={e=>startDrag(e,task)} deleteTask={deleteTask}/>
                  );
                  return (
                    <TaskCard key={task.id} task={task} secColor={sec.color} isOver={isOver} isDragging={dragId===task.id}
                      onDragStart={e=>startDrag(e,task)}
                      updateTask={updateTask} deleteTask={deleteTask} completeTask={completeTask}
                      addTask={addTask} sections={sections} allNotes={allNotes} setView={setView} archiveTask={archiveTask}/>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {drag?.active&&(
        <div style={{position:"fixed",left:drag.x+14,top:drag.y-16,zIndex:900,pointerEvents:"none",
          background:"#FDFAF6",borderRadius:9,padding:"9px 13px",border:"1px solid #E3D9CC",
          borderLeft:`3px solid ${sec.color}`,boxShadow:"0 8px 28px rgba(0,0,0,0.22)",
          maxWidth:220,opacity:0.93,fontFamily:'"DM Sans",sans-serif',fontSize:12,fontWeight:500,color:"#1C1714"}}>
          {drag.task.title||<em style={{color:"#9B8E80"}}>Untitled</em>}
        </div>
      )}
    </div>
  );
}
function SpacerCard({task,isOver,isDragging,onPointerDown,deleteTask}) {
  const [hov,setHov]=useState(false);
  return (
    <div data-task-id={task.id} onPointerDown={onPointerDown}
         onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
         style={{display:"flex",alignItems:"center",gap:8,padding:"5px 4px",cursor:isDragging?"grabbing":"grab",opacity:isDragging?0.35:1,outline:isOver?"2px dashed #8B7D6B":"none",borderRadius:6,userSelect:"none"}}>
      <div style={{flex:1,height:1,background:"#C2B49E",borderRadius:1}}/>
      {hov&&<button onClick={e=>{e.stopPropagation();deleteTask(task.id);}} style={{...S.btnMicro,background:"#FAE0E0",color:"#C43A3A",padding:"2px 6px",fontSize:10}}>✕</button>}
      <div style={{flex:1,height:1,background:"#C2B49E",borderRadius:1}}/>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({task,secColor,isOver,isDragging,onDragStart,updateTask,deleteTask,completeTask,addTask,sections,allNotes,setView,archiveTask}) {
  const openCtx = React.useContext(CtxMenuCtx);
  const {navigateTo:navTo,getDayBlocks,upsertBlock,setTt,sections:navSections}=React.useContext(NavCtx)||{};
  const [open,      setOpen]      = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [schedModal,setSchedModal]= useState(false);

  const done      = task.status==="done";
  const due       = task.dueDate ? fmtDue(task.dueDate, task.dueTime, task.allDay!==false) : null;
  const prio      = PRIORITY[task.priority||"normal"];
  const checklist = task.checklist||[];
  const doneItems = checklist.filter(i=>i.done).length;
  const linkedNotes = (task.linkedNoteIds||[]).map(id=>(allNotes||[]).find(n=>n.id===id)).filter(Boolean);

  // Properties that are set / non-default
  const hasNotes     = !!task.notes;
  const hasDue       = !!task.dueDate;
  const hasRemind    = !!task.remindAt;
  const hasChecklist = checklist.length > 0;
  const hasLinks     = linkedNotes.length > 0;
  const hasAny       = hasNotes||hasDue||hasRemind||hasChecklist||hasLinks;

  return (
    <div data-task-id={task.id}
         onPointerDown={e=>{ if(e.button!==0||e.target.closest("button,input,textarea,select")) return; onDragStart(e); }}
         className="hov-card"
         onContextMenu={e=>{ if(!openCtx) return; openCtx(e,[
           {label:"Edit",       action:()=>setEditModal(true)},
           {label:"\uD83D\uDCC5 Schedule", action:()=>setSchedModal(true)},
           {label:"Duplicate",  action:()=>addTask(task.sectionId,task.title,task.notes,{dueDate:task.dueDate,status:task.status})},
           {label:"Move to…",   submenu:(sections||[]).filter(s=>s.id!==task.sectionId).map(s=>({label:s.label,action:()=>updateTask(task.id,{sectionId:s.id})}))},
           {label:"Priority",   submenu:[
             {label:"↑ High",   action:()=>updateTask(task.id,{priority:"high"})},
             {label:"● Normal", action:()=>updateTask(task.id,{priority:"normal"})},
             {label:"↓ Low",    action:()=>updateTask(task.id,{priority:"low"})},
           ]},
           {divider:true},
           task.status==="done"
             ?{label:"Mark as active",action:()=>updateTask(task.id,{status:"backlog",completedAt:null,monthCompleted:null})}
             :{label:"Mark as done",  action:()=>completeTask(task.id)},
           task.status==="done"?{label:"\uD83D\uDCE6 Archive",action:()=>archiveTask?.(task.id)}:null,
           {divider:true},
           {label:"Delete",danger:true,action:()=>deleteTask(task.id)},
         ].filter(Boolean)); }}
         style={{background:"#FDFAF6",borderRadius:9,padding:"10px 12px",border:"1px solid #E3D9CC",borderLeft:`3px solid ${secColor}`,opacity:isDragging?0.35:1,outline:isOver?"2px dashed #8B7D6B":"none",transition:"box-shadow 0.15s,opacity 0.15s",cursor:isDragging?"grabbing":"grab",userSelect:"none"}}>

      {/* Header row */}
      <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
        <div onClick={()=>setOpen(o=>!o)}
          style={{fontSize:13,fontWeight:500,color:done?"#9B8E80":"#1C1714",textDecoration:done?"line-through":"none",lineHeight:1.4,cursor:"pointer",flex:1,userSelect:"none"}}>
          {task.title}
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end",marginTop:1}}>
          {prio&&<span style={{fontSize:10,fontWeight:700,color:prio.color,background:prio.bg,padding:"2px 6px",borderRadius:8}}>{prio.label}</span>}
          {hasChecklist&&<span style={{fontSize:10,fontWeight:700,color:doneItems===checklist.length?"#1A7A43":"#7A6C5E",background:doneItems===checklist.length?"#D4F0E0":"#EBE4D8",padding:"2px 6px",borderRadius:8}}>{doneItems}/{checklist.length}</span>}
          {due&&!done&&<span style={{fontSize:10,fontWeight:700,color:due.urgent?"#C43A3A":"#7A6C5E",background:due.urgent?"#FAE8E8":"#EBE4D8",padding:"2px 6px",borderRadius:8}}>{due.label}</span>}
        </div>
      </div>

      {/* Compact peek — only non-default properties */}
      {open&&hasAny&&(
        <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}} onMouseDown={e=>e.stopPropagation()}>
          {hasNotes&&(
            <p style={{fontSize:11,color:"#6B5E4E",lineHeight:1.45,margin:0,padding:"5px 8px",background:"#F3EDE3",borderRadius:6}}>{task.notes}</p>
          )}
          {hasChecklist&&(
            <div style={{padding:"5px 8px",background:"#F3EDE3",borderRadius:6}}>
              {checklist.map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:6,padding:"2px 0",cursor:"pointer"}}
                  onClick={()=>updateTask(task.id,{checklist:checklist.map(i=>i.id===item.id?{...i,done:!i.done}:i)})}>
                  <div style={{width:11,height:11,borderRadius:2,border:`1.5px solid ${item.done?"#1A7A43":"#C2B49E"}`,background:item.done?"#1A7A43":"transparent",flexShrink:0}}/>
                  <span style={{fontSize:11,color:item.done?"#9B8E80":"#1C1714",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                </div>
              ))}
            </div>
          )}
          {hasDue&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:10,fontWeight:700,color:due?.urgent?"#C43A3A":"#4A3F30",background:due?.urgent?"#FAE8E8":"#EBE4D8",padding:"2px 8px",borderRadius:20}}>&#x1F4C5; {due?.label}</span>
            </div>
          )}
          {hasRemind&&(
            <span style={{fontSize:10,color:"#6B5E4E",background:"#EBE4D8",padding:"2px 8px",borderRadius:20,width:"fit-content"}}>&#x23F0; {new Date(task.remindAt).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
          )}
          {hasLinks&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {linkedNotes.map(n=>(
                <div key={n.id} onClick={e=>{e.stopPropagation();navTo?.({type:"note",id:n.id});}}
                  style={{display:"inline-flex",alignItems:"center",gap:3,background:"#E6E3F5",borderRadius:7,padding:"2px 8px",fontSize:10,fontWeight:500,color:"#4B3FC7",cursor:"pointer"}}>
                  &#x1F4DD; {n.title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action strip — shown when open */}
      {open&&(
        <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}} onMouseDown={e=>e.stopPropagation()}>
          {!done&&<button onClick={e=>{e.stopPropagation();completeTask(task.id);}} style={{...S.btnMicro,background:"#D4F0E0",color:"#1A7A43"}}>&#x2713; Done</button>}
          {!done&&task.status!=="this-week"&&<button onClick={e=>{e.stopPropagation();updateTask(task.id,{status:"this-week"});}} style={{...S.btnMicro,background:"#E6E3F5",color:"#4B3FC7"}}>&#x2192; This Week</button>}
          {!done&&<button onClick={e=>{e.stopPropagation();setSchedModal(true);}} style={{...S.btnMicro,background:"#E3F0FB",color:"#2A6FAD"}}>&#x1F4C5; Schedule</button>}
          {done&&<button onClick={e=>{e.stopPropagation();archiveTask?.(task.id);}} style={{...S.btnMicro,background:"#EBE4D8",color:"#7A6C5E"}}>&#x1F4E6; Archive</button>}
          <button onClick={e=>{e.stopPropagation();setEditModal(true);}} style={{...S.btnMicro}}>Edit</button>
        </div>
      )}

      {editModal&&<TaskEditModal task={task} secColor={secColor} sections={sections} allNotes={allNotes}
        updateTask={updateTask} completeTask={completeTask} deleteTask={deleteTask} onClose={()=>setEditModal(false)}/>}
      {schedModal&&<ScheduleTaskModal task={task} sections={navSections||sections||[]} byId={Object.fromEntries((navSections||sections||[]).map(s=>[s.id,s]))} getDayBlocks={getDayBlocks||(()=>[])} upsertBlock={upsertBlock||(()=>{})} setTt={setTt||(()=>{})} onClose={()=>setSchedModal(false)}/>}
    </div>
  );
}


