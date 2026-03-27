function TrackerNavPanel({trackerId,trackers,byId,toggleTrackerDay}) {
  const trk=(trackers||[]).find(t=>t.id===trackerId);
  if(!trk) return <div style={{padding:24,color:"#9B8E80"}}>Tracker not found.</div>;
  const today=todayISO();
  const todayDi=dayIndex(today);
  const done=trk.completions[today];
  const streak=trackerStreak(trk);
  const sec=byId[trk.sectionId];
  return (
    <div style={{padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{width:12,height:12,borderRadius:4,background:trk.color}}/>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,margin:0}}>{trk.title}</h3>
        {sec&&<span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:sec.color+"20",color:sec.color}}>{sec.label}</span>}
      </div>
      <div style={{fontSize:12,color:"#7A6C5E",marginBottom:12}}>Active: {DAYS.filter(function(_,i){return trk.activeDays[i];}).map(function(d){return d.slice(0,3);}).join(", ")}</div>
      {trk.activeDays[todayDi]&&(
        <div onClick={()=>toggleTrackerDay(trk.id,today)}
          style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:9,cursor:"pointer",marginBottom:16,
            background:done?"#D4F0E0":"#F8F3EC",border:done?"1.5px solid #1A7A43":"1px solid #E3D9CC"}}>
          <div style={{width:22,height:22,borderRadius:5,border:"2px solid "+trk.color,
            background:done?trk.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
            color:"#fff",fontSize:13,fontWeight:700}}>{done?"\u2713":""}</div>
          <span style={{fontSize:14,fontWeight:600}}>{done?"Completed today":"Mark as done today"}</span>
        </div>
      )}
      <div style={{display:"flex",gap:12}}>
        <div style={{flex:1,background:"#EBE4D8",borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:'"Playfair Display",serif',color:trk.color}}>{streak}</div>
          <div style={{fontSize:11,fontWeight:600,color:"#4A3F30"}}>Current Streak</div>
        </div>
        <div style={{flex:1,background:"#EBE4D8",borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:'"Playfair Display",serif',color:trk.color}}>{Object.keys(trk.completions).length}</div>
          <div style={{fontSize:11,fontWeight:600,color:"#4A3F30"}}>Total</div>
        </div>
      </div>
    </div>
  );
}

function NavOverlay({stack,tasks,notes,trackers,byId,updateTask,completeTask,toggleTrackerDay,onClose,onNavigateToLevel}) {
  const allNotes=Object.values(notes||{}).flat();
  const {navigateTo,navigateToDate}=React.useContext(NavCtx)||{};
  const current=stack[stack.length-1];

  function labelFor(item){
    if(item.type==="task"){ const t=tasks.find(t=>t.id===item.id); return "Task: "+(t?.title||"Untitled"); }
    if(item.type==="note"){ const n=allNotes.find(n=>n.id===item.id); return "Note: "+(n?.title||"Untitled"); }
    if(item.type==="tracker"){ const t=(trackers||[]).find(t=>t.id===item.id); return "Tracker: "+(t?.title||"Untitled"); }
    return item.type;
  }

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(28,23,20,0.35)"}}>
      <div onClick={e=>e.stopPropagation()}
        style={{position:"fixed",top:0,right:0,bottom:0,width:500,maxWidth:"90vw",background:"#FDFAF6",
          boxShadow:"-6px 0 28px rgba(0,0,0,0.22)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Breadcrumb header */}
        <div style={{padding:"12px 18px 10px",borderBottom:"1px solid #EBE4D8",background:"#F3EDE3",flexShrink:0,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",paddingRight:30}}>
            <button onClick={onClose} style={{fontSize:11,fontWeight:600,color:"#6B5E4E",background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}>Today</button>
            {stack.map((item,i)=>(
              <React.Fragment key={i}>
                <span style={{color:"#C2B49E",fontSize:11}}>&#x203A;</span>
                <button onClick={()=>i<stack.length-1&&onNavigateToLevel(i)}
                  style={{fontSize:11,fontWeight:600,
                    color:i===stack.length-1?"#1C1714":"#6B5E4E",
                    background:"none",border:"none",
                    cursor:i<stack.length-1?"pointer":"default",
                    padding:"2px 0",maxWidth:180,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {labelFor(item)}
                </button>
              </React.Fragment>
            ))}
          </div>
          <button onClick={onClose} style={{position:"absolute",top:9,right:14,background:"none",border:"none",cursor:"pointer",color:"#9B8E80",fontSize:19,lineHeight:1,padding:0}}>&#xd7;</button>
        </div>
        {/* Content */}
        <div style={{flex:1,overflowY:"auto"}}>
          {current?.type==="task"&&<TaskPanel taskId={current.id} tasks={tasks} allNotes={allNotes} byId={byId} updateTask={updateTask} completeTask={completeTask}/>}
          {current?.type==="note"&&<NotePanel noteId={current.id} allNotes={allNotes} tasks={tasks} byId={byId}/>}
          {current?.type==="tracker"&&<TrackerNavPanel trackerId={current.id} trackers={trackers} byId={byId} toggleTrackerDay={toggleTrackerDay}/>}
        </div>
      </div>
    </div>
  );
}

function NoteDeleteOverlay({hasChildren,onConfirm,onClose}) {
  return (
    <Overlay onClose={onClose} width={380}>
      <div style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,marginBottom:8,color:"#1C1714"}}>
        Delete {hasChildren?"note & sub-notes":"note"}?
      </div>
      <p style={{fontSize:13,color:"#6B5E4E",lineHeight:1.55,marginBottom:22}}>
        {hasChildren
          ?"This note has sub-notes that will also be deleted. This cannot be undone."
          :"This cannot be undone."}
      </p>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onConfirm} style={{...S.btnDark,background:"#C43A3A",flex:1}}>Delete</button>
        <button onClick={onClose} style={{...S.btnGhost,flex:1}}>Cancel</button>
      </div>
    </Overlay>
  );
}

function TaskPanel({taskId,tasks,allNotes,byId,updateTask,completeTask}) {
  const {navigateTo,navigateToFresh,setView,getDayBlocks,upsertBlock,setTt,sections:navSections}=React.useContext(NavCtx)||{};
  const task=tasks.find(t=>t.id===taskId);
  const [editing,  setEditing]  = useState(false);
  const [editTitle,setEditTitle]= useState("");
  const [editNotes,setEditNotes]= useState("");
  const [editStatus,setEditStatus]=useState("");
  const [editPriority,setEditPriority]=useState("normal");
  const [editSecId,setEditSecId]=useState("");
  const [editHasDue,setEditHasDue]=useState(false);
  const [editDueDate,setEditDueDate]=useState(todayISO());
  const [editHasRemind,setEditHasRemind]=useState(false);
  const [editRemindDate,setEditRemindDate]=useState(todayISO());
  const [editRemindTime,setEditRemindTime]=useState("09:00");
  const [editChecklist,setEditChecklist]=useState([]);
  const [editNewItem,setEditNewItem]=useState("");
  const [scheduleModal,setScheduleModal]=useState(false);

  useEffect(()=>{
    if(task){
      setEditTitle(task.title||"");
      setEditNotes(task.notes||"");
      setEditStatus(task.status||"backlog");
      setEditPriority(task.priority||"normal");
      setEditSecId(task.sectionId||"");
      setEditHasDue(!!task.dueDate);
      setEditDueDate(task.dueDate||todayISO());
      setEditChecklist((task.checklist||[]).map(function(i){return{...i};}));
      var ra=task.remindAt?new Date(task.remindAt):null;
      setEditHasRemind(!!ra);
      if(ra){
        setEditRemindDate(ra.toISOString().slice(0,10));
        setEditRemindTime(ra.toTimeString().slice(0,5));
      }
    }
    setEditing(false);
  },[taskId]);

  if(!task) return <div style={{padding:24,color:"#9B8E80",fontSize:13}}>Task not found.</div>;
  const sec=byId[task.sectionId]||{color:"#9B8E80",label:"?"};
  const prio=PRIORITY[task.priority||"normal"];
  const due=task.dueDate?fmtDue(task.dueDate,task.dueTime,task.allDay!==false):null;
  const checklist=task.checklist||[];
  const doneItems=checklist.filter(i=>i.done).length;
  const linkedNotes=(task.linkedNoteIds||[]).map(id=>allNotes.find(n=>n.id===id)).filter(Boolean);
  const PRIORITIES=[{key:"high",label:"High",color:"#C43A3A"},{key:"normal",label:"Normal",color:"#9B8E80"},{key:"low",label:"Low",color:"#7A6C5E"}];
  const STATUSES=[{key:"backlog",label:"Backlog"},{key:"this-week",label:"This Week"},{key:"done",label:"Done"}];

  function addEditCheckItem(){ if(!editNewItem.trim()) return; setEditChecklist(function(p){return[...p,{id:uid(),text:editNewItem.trim(),done:false}];}); setEditNewItem(""); }
  function removeEditCheckItem(cid){ setEditChecklist(function(p){return p.filter(function(i){return i.id!==cid;});}); }
  function toggleEditCheckItem(cid){ setEditChecklist(function(p){return p.map(function(i){return i.id===cid?{...i,done:!i.done}:i;});}); }

  function saveEdit(){
    var remind = editHasRemind ? new Date(editRemindDate+"T"+editRemindTime).toISOString() : null;
    updateTask(task.id,{
      title:editTitle.trim()||task.title,
      notes:editNotes.trim()||null,
      status:editStatus,
      priority:editPriority,
      sectionId:editSecId||task.sectionId,
      dueDate:editHasDue?editDueDate:null,
      remindAt:remind,
      remindFired:remind?false:task.remindFired,
      checklist:editChecklist
    });
    setEditing(false);
  }

  return (
    <div style={{padding:"22px 24px"}}>
      {/* Section + badges + title */}
      <div style={{borderLeft:`4px solid ${sec.color}`,paddingLeft:14,marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,flexWrap:"wrap"}}>
          <span style={{fontSize:10,fontWeight:700,background:sec.color+"22",color:sec.color,padding:"2px 8px",borderRadius:20}}>{sec.label}</span>
          {prio&&<span style={{fontSize:10,fontWeight:700,color:prio.color,background:prio.bg,padding:"2px 6px",borderRadius:8}}>{prio.label}</span>}
          <span style={{fontSize:10,fontWeight:700,color:"#9B8E80",background:"#EBE4D8",padding:"2px 7px",borderRadius:8}}>{task.status}</span>
          {task.archived&&<span style={{fontSize:10,fontWeight:700,color:"#7A6C5E",background:"#E3D9CC",padding:"2px 7px",borderRadius:8}}>archived</span>}
        </div>
        {editing?(
          <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} autoFocus
            style={{...S.input,fontSize:17,fontWeight:700,fontFamily:'"Playfair Display",serif',marginBottom:0}}/>
        ):(
          <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:20,fontWeight:700,color:"#1C1714",lineHeight:1.3,textDecoration:task.status==="done"?"line-through":"none"}}>{task.title}</h2>
        )}
      </div>

      {/* Due date */}
      {due&&<div style={{marginBottom:14}}>
        <span style={{fontSize:11,fontWeight:700,color:due.urgent?"#C43A3A":"#6B5E4E",background:due.urgent?"#FAE8E8":"#EBE4D8",padding:"3px 10px",borderRadius:20}}>Due: {due.label}</span>
      </div>}

      {/* Notes / edit area */}
      {editing?(
        <div style={{marginBottom:14}}>
          {/* Section */}
          <div style={{marginBottom:10}}>
            <span style={S.lbl}>Section</span>
            <select value={editSecId} onChange={e=>setEditSecId(e.target.value)} style={{...S.input,marginBottom:0}}>
              {(navSections||[]).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {/* Notes */}
          <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={3} placeholder="Notes..."
            style={{...S.input,resize:"vertical",fontSize:13}}/>
          {/* Status + Priority */}
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <div style={{flex:1}}>
              <span style={S.lbl}>Status</span>
              <div style={{display:"flex",gap:4}}>
                {STATUSES.map(s=>(
                  <button key={s.key} onClick={()=>setEditStatus(s.key)}
                    style={{flex:1,padding:"5px 0",borderRadius:7,border:"1.5px solid "+(editStatus===s.key?"#4B3FC7":"#D6CEC3"),
                      background:editStatus===s.key?"#E6E3F5":"transparent",
                      color:editStatus===s.key?"#4B3FC7":"#7A6C5E",fontSize:10,fontWeight:600}}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={{flex:1}}>
              <span style={S.lbl}>Priority</span>
              <div style={{display:"flex",gap:4}}>
                {PRIORITIES.map(p=>(
                  <button key={p.key} onClick={()=>setEditPriority(p.key)}
                    style={{flex:1,padding:"5px 0",borderRadius:7,border:"1.5px solid "+(editPriority===p.key?p.color:"#D6CEC3"),
                      background:editPriority===p.key?p.color+"18":"transparent",
                      color:editPriority===p.key?p.color:"#7A6C5E",fontSize:10,fontWeight:600}}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Due date */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
            <button onClick={()=>setEditHasDue(v=>!v)} style={{width:16,height:16,borderRadius:4,border:"2px solid "+(editHasDue?"#4B3FC7":"#C2B49E"),
              background:editHasDue?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>
              {editHasDue?"\u2713":""}
            </button>
            <span style={{fontSize:11,fontWeight:600,color:"#4A3F30",cursor:"pointer"}} onClick={()=>setEditHasDue(v=>!v)}>Due date</span>
            {editHasDue&&<input type="date" value={editDueDate} onChange={e=>setEditDueDate(e.target.value)}
              style={{...S.input,marginBottom:0,flex:1,padding:"4px 8px",fontSize:11}}/>}
          </div>
          {/* Reminder */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
            <button onClick={()=>setEditHasRemind(v=>!v)} style={{width:16,height:16,borderRadius:4,border:"2px solid "+(editHasRemind?"#4B3FC7":"#C2B49E"),
              background:editHasRemind?"#4B3FC7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>
              {editHasRemind?"\u2713":""}
            </button>
            <span style={{fontSize:11,fontWeight:600,color:"#4A3F30",cursor:"pointer"}} onClick={()=>setEditHasRemind(v=>!v)}>Reminder</span>
            {editHasRemind&&<>
              <input type="date" value={editRemindDate} onChange={e=>setEditRemindDate(e.target.value)}
                style={{...S.input,marginBottom:0,padding:"4px 8px",fontSize:11,flex:1}}/>
              <input type="time" value={editRemindTime} onChange={e=>setEditRemindTime(e.target.value)}
                style={{...S.input,marginBottom:0,padding:"4px 8px",fontSize:11,width:90}}/>
            </>}
          </div>
          {/* Checklist */}
          <div style={{marginBottom:10,padding:"8px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
            <span style={S.lbl}>Checklist</span>
            {editChecklist.map(function(item){return(
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                <button onClick={function(){toggleEditCheckItem(item.id);}}
                  style={{width:13,height:13,borderRadius:3,border:"1.5px solid "+(item.done?"#1A7A43":"#C2B49E"),background:item.done?"#1A7A43":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff"}}>{item.done?"\u2713":""}</button>
                <span style={{fontSize:12,flex:1,textDecoration:item.done?"line-through":"none",color:item.done?"#9B8E80":"#1C1714"}}>{item.text}</span>
                <button onClick={function(){removeEditCheckItem(item.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#C2B49E",fontSize:11,padding:0}}>&#xd7;</button>
              </div>
            );})}
            <div style={{display:"flex",gap:6,marginTop:4}}>
              <input value={editNewItem} onChange={e=>setEditNewItem(e.target.value)} placeholder="Add item..."
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addEditCheckItem();}}}
                style={{...S.input,marginBottom:0,flex:1,padding:"4px 8px",fontSize:11}}/>
              <button onClick={addEditCheckItem} style={{...S.btnMicro,padding:"4px 10px",fontSize:11}}>+</button>
            </div>
          </div>
          {/* Save/Cancel */}
          <div style={{display:"flex",gap:6,marginTop:10}}>
            <button onClick={saveEdit} style={{...S.btnDark,background:sec.color}}>Save</button>
            <button onClick={()=>setEditing(false)} style={S.btnGhost}>Cancel</button>
          </div>
        </div>
      ):task.notes?(
        <p style={{fontSize:13,color:"#4A3F30",lineHeight:1.65,marginBottom:18,padding:"12px 14px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>{task.notes}</p>
      ):null}

      {/* Checklist */}
      {checklist.length>0&&(
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
            Checklist <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:doneItems===checklist.length?"#1A7A43":"#9B8E80"}}>{doneItems}/{checklist.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {checklist.map(item=>(
              <div key={item.id}
                onClick={()=>updateTask(task.id,{checklist:checklist.map(i=>i.id===item.id?{...i,done:!i.done}:i)})}
                style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",borderRadius:8,background:"#F3EDE3",cursor:"pointer",border:"1px solid #E3D9CC"}}>
                <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${item.done?"#1A7A43":"#C2B49E"}`,background:item.done?"#1A7A43":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>{item.done?"\u2713":""}</div>
                <span style={{fontSize:13,flex:1,color:item.done?"#9B8E80":"#1C1714",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked notes */}
      {linkedNotes.length>0&&(
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:8}}>Linked Notes</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {linkedNotes.map(n=>(
              <div key={n.id} onClick={()=>navigateTo?.({type:"note",id:n.id})}
                style={{display:"inline-flex",alignItems:"center",gap:4,background:"#E6E3F5",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:500,color:"#4B3FC7",cursor:"pointer",border:"1px solid #D0C8F0"}}>
                {n.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {!editing&&<button onClick={()=>setEditing(true)} style={{...S.btnMicro,background:"#EBE4D8",color:"#4A3F30"}}>&#x270E; Edit</button>}
        {task.status!=="done"&&!editing&&<button onClick={()=>completeTask(task.id)} style={{...S.btnMicro,background:"#D4F0E0",color:"#1A7A43"}}>&#x2713; Mark done</button>}
        {!editing&&<button onClick={()=>setView?.("boards")} style={{...S.btnMicro,background:"#F3EDE3",color:"#4A3F30",marginLeft:"auto"}}>Go to board &#x2192;</button>}
        {!editing&&<button onClick={()=>setScheduleModal(true)} style={{...S.btnMicro,background:"#E3F0FB",color:"#2A6FAD"}}>&#x1F4C5; Schedule</button>}
      </div>
      {scheduleModal&&<ScheduleTaskModal task={task} sections={navSections||[]} byId={byId} getDayBlocks={getDayBlocks||(()=>[])} upsertBlock={upsertBlock||(()=>{})} setTt={setTt||(()=>{})} onClose={()=>setScheduleModal(false)}/>}
    </div>
  );
}

function NotePanel({noteId,allNotes,tasks,byId}) {
  var navCtx=React.useContext(NavCtx)||{};
  var navigateTo=navCtx.navigateTo;
  var navigateToDate=navCtx.navigateToDate;
  var setView=navCtx.setView;
  var note=allNotes.find(function(n){return n.id===noteId;});

  var readOnlyExts = useMemo(function() {
    return TIPTAP_BASE_EXTENSIONS.slice();
  }, []);

  var panelEditor = useEditor({
    extensions: readOnlyExts,
    content: note ? (note.content || "<p></p>") : "<p></p>",
    editable: false,
    editorProps: {
      attributes: { class: "note-editor", style: "font-size:13px;color:#1C1714;line-height:1.65;outline:none;" },
      handleClick: function(view, pos, event) {
        var dateChip = event.target.closest(".note-date-chip");
        if (dateChip && dateChip.dataset.date) { if (navigateToDate) navigateToDate(dateChip.dataset.date); return true; }
        var taskChip = event.target.closest(".note-task-chip");
        if (taskChip && taskChip.dataset.taskId) { if (navigateTo) navigateTo({type:"task",id:taskChip.dataset.taskId}); return true; }
        var head = event.target.closest(".note-collapse-head");
        if (head) { var col = head.closest(".note-collapse"); if (col) col.toggleAttribute("data-open"); return true; }
        return false;
      },
    },
    immediatelyRender: false,
  });

  useEffect(function() {
    if (!panelEditor || !note) return;
    panelEditor.commands.setContent(note.content || "<p></p>");
    setTimeout(function() { restoreNoteImages(panelEditor.view.dom); }, 50);
  }, [note ? note.id : null, note ? note.content : null]);

  // Initial image restore
  useEffect(function() {
    if (!panelEditor) return;
    var timer = setTimeout(function() { restoreNoteImages(panelEditor.view.dom); }, 50);
    return function() { clearTimeout(timer); };
  }, [panelEditor]);

  if(!note) return <div style={{padding:24,color:"#9B8E80",fontSize:13}}>Note not found.</div>;

  return (
    <div style={{padding:"22px 24px"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
        <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:20,fontWeight:700,color:"#1C1714",flex:1}}>{note.title||"Untitled"}</h2>
        <button onClick={function(){ if(setView) setView("notes"); }}
          style={{...S.btnMicro,background:"#F3EDE3",color:"#4A3F30",whiteSpace:"nowrap",flexShrink:0}}>Go to note &#x2192;</button>
      </div>
      {(note.tags||[]).length>0&&(
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {(note.tags||[]).map(function(t){return <span key={t} style={{background:"#EBE4D8",color:"#4A3F30",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:600}}>#{t}</span>;})}
        </div>
      )}
      {panelEditor ? <EditorContent editor={panelEditor}/> : <div style={{fontSize:13,color:"#C2B49E"}}>Loading\u2026</div>}
    </div>
  );
}

function PinOverlay({tasks,tt,week,sections,byId,trackers,toggleTrackerDay,onClose,navigateTo,navigateToDate,navigateToFresh}) {
  const [pos,  setPos]  = useState({x:null,y:null}); // null = anchored bottom-right
  const [dragging,setDragging]=useState(false);
  const dragRef=React.useRef(null);
  const panelRef=React.useRef(null);

  // Pointer-based drag for repositioning
  function onHeaderPointerDown(e){
    if(e.button!==0) return;
    e.preventDefault();
    const panel=panelRef.current;
    if(!panel) return;
    const rect=panel.getBoundingClientRect();
    const offX=e.clientX-rect.left, offY=e.clientY-rect.top;
    dragRef.current={offX,offY};
    setDragging(true);
    function onMove(e){
      const {offX,offY}=dragRef.current;
      setPos({x:Math.max(0,Math.min(window.innerWidth-rect.width,e.clientX-offX)),
              y:Math.max(0,Math.min(window.innerHeight-rect.height,e.clientY-offY))});
    }
    function onUp(){ setDragging(false); window.removeEventListener("pointermove",onMove); window.removeEventListener("pointerup",onUp); }
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
  }

  // Data
  const dayName=todayName();
  const blocks=[...((tt[week]||{})[dayName]||[])].sort((a,b)=>a.start.localeCompare(b.start));
  const todaySids=[...new Set(blocks.filter(b=>b.sectionId&&byId[b.sectionId]).map(b=>b.sectionId))];
  const activeTasks=tasks.filter(t=>t.status!=="done"&&t.type!=="spacer"&&todaySids.includes(t.sectionId));
  const pinTodayDi=dayIndex(todayISO());
  const pinTrackers=(trackers||[]).filter(t=>!t.archived&&t.activeDays[pinTodayDi]);
  const pinToday=todayISO();

  const now=new Date();
  const nowM=now.getHours()*60+now.getMinutes();
  const currentBlock=blocks.find(b=>{
    const [sh,sm]=b.start.split(":").map(Number);
    const [eh,em]=b.end.split(":").map(Number);
    return nowM>=(sh*60+sm)&&nowM<(eh*60+em);
  });

  const posStyle=pos.x!==null
    ?{left:pos.x,top:pos.y}
    :{right:20,bottom:20};

  return (
    <div ref={panelRef} style={{
      position:"fixed",...posStyle,
      width:280,maxHeight:"70vh",
      background:"#1C1714",color:"#F8F3EC",
      borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.45)",
      zIndex:800,display:"flex",flexDirection:"column",
      fontFamily:'"DM Sans",sans-serif',fontSize:12,
      overflow:"hidden",
      cursor:dragging?"grabbing":"default",
      userSelect:"none",
    }}>
      {/* Drag handle / header */}
      <div onPointerDown={onHeaderPointerDown}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"10px 12px",borderBottom:"1px solid #2C2420",cursor:"grab",flexShrink:0}}>
        <div>
          <span style={{fontSize:13,fontWeight:700}}>{dayName}</span>
          {currentBlock&&(()=>{
            const sec=byId[currentBlock.sectionId];
            return sec?(
              <span style={{marginLeft:8,fontSize:10,background:sec.color,color:textFor(sec.color),
                borderRadius:4,padding:"1px 6px",fontWeight:700}}>
                Now: {currentBlock.label||sec.label}
              </span>
            ):null;
          })()}
        </div>
        <button onPointerDown={e=>e.stopPropagation()} onClick={onClose}
          style={{background:"none",border:"none",cursor:"pointer",color:"#7A6C5E",fontSize:16,
            lineHeight:1,padding:"0 2px",flexShrink:0}}>&#xd7;</button>
      </div>

      <div style={{overflowY:"auto",flex:1}}>
        {/* Schedule */}
        {blocks.length>0&&(
          <div style={{padding:"8px 12px 4px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#4A3F30",letterSpacing:"0.6px",
              textTransform:"uppercase",marginBottom:5}}>Schedule</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {blocks.map(blk=>{
                if(blk.type==="break") return (
                  <div key={blk.id} style={{display:"flex",gap:6,padding:"3px 7px",borderRadius:4,background:"#2C2420"}}>
                    <span style={{fontSize:9,color:"#4A3F30",fontWeight:600,minWidth:76,flexShrink:0}}>{blk.start}–{blk.end}</span>
                    <span style={{fontSize:10,color:"#4A3F30",fontStyle:"italic"}}>{blk.label||"Break"}</span>
                  </div>
                );
                const sec=byId[blk.sectionId]; if(!sec) return null;
                const [sh,sm]=blk.start.split(":").map(Number);
                const [eh,em]=blk.end.split(":").map(Number);
                const isCurrent=nowM>=(sh*60+sm)&&nowM<(eh*60+em);
                return (
                  <div key={blk.id} onClick={()=>navigateToDate&&navigateToDate(todayISO())}
                    style={{display:"flex",gap:6,padding:"3px 7px",borderRadius:4,
                      background:isCurrent?sec.color+"33":"#2C2420",
                      borderLeft:`2px solid ${sec.color}`,cursor:"pointer"}}>
                    <span style={{fontSize:9,color:"#7A6C5E",fontWeight:600,minWidth:76,flexShrink:0}}>{blk.start}–{blk.end}</span>
                    <span style={{fontSize:10,color:isCurrent?sec.color:"#C2B49E",fontWeight:isCurrent?700:400,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {blk.label||sec.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active tasks */}
        {activeTasks.length>0&&(
          <div style={{padding:"8px 12px 10px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#4A3F30",letterSpacing:"0.6px",
              textTransform:"uppercase",marginBottom:5}}>Active Tasks</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {activeTasks.map(t=>{
                const sec=byId[t.sectionId]||{color:"#9B8E80"};
                const prio=PRIORITY[t.priority||"normal"];
                return (
                  <div key={t.id} onClick={()=>(navigateToFresh||navigateTo)?.({type:"task",id:t.id})}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"4px 7px",
                      borderRadius:4,background:"#2C2420",borderLeft:`2px solid ${sec.color}`,cursor:"pointer"}}>
                    <span style={{fontSize:11,flex:1,color:"#EBE4D8",overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                    {prio&&<span style={{fontSize:9,color:prio.color,fontWeight:700,flexShrink:0}}>{prio.label}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Trackers */}
        {pinTrackers.length>0&&(
          <div style={{padding:"8px 12px 10px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#4A3F30",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:5}}>Trackers</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {pinTrackers.map(trk=>{
                const done=trk.completions[pinToday];
                return (
                  <div key={trk.id} onClick={()=>toggleTrackerDay?.(trk.id,pinToday)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"4px 7px",borderRadius:4,
                      background:done?"#1A3A2A":"#2C2420",borderLeft:"2px solid "+trk.color,cursor:"pointer"}}>
                    <span style={{fontSize:11,flex:1,color:done?"#9AD4B5":"#EBE4D8"}}>{done?"\u2713 ":""}{trk.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {blocks.length===0&&activeTasks.length===0&&pinTrackers.length===0&&(
          <div style={{padding:"20px 12px",textAlign:"center",color:"#4A3F30",fontSize:11}}>
            No blocks, tasks, or trackers today.
          </div>
        )}
      </div>
    </div>
  );
}

function NoteFloatOverlay({noteId,notes,onClose,onOpenNote}) {
  var allN=Object.values(notes||{}).flat();
  var note=allN.find(function(n){return n.id===noteId;});
  var pos=useState({x:null,y:null});
  var posVal=pos[0]; var setPos=pos[1];
  var isDragging=useState(false);
  var dragging=isDragging[0]; var setDragging=isDragging[1];
  var dragRef=React.useRef(null);
  var panelRef=React.useRef(null);
  var contentRef=React.useRef(null);

  function onHeaderPointerDown(e){
    if(e.button!==0) return;
    e.preventDefault();
    var panel=panelRef.current; if(!panel) return;
    var rect=panel.getBoundingClientRect();
    var offX=e.clientX-rect.left, offY=e.clientY-rect.top;
    dragRef.current={offX:offX,offY:offY};
    setDragging(true);
    function onMove(ev){
      var d=dragRef.current;
      setPos({x:Math.max(0,Math.min(window.innerWidth-rect.width,ev.clientX-d.offX)),
              y:Math.max(0,Math.min(window.innerHeight-rect.height,ev.clientY-d.offY))});
    }
    function onUp(){ setDragging(false); window.removeEventListener("pointermove",onMove); window.removeEventListener("pointerup",onUp); }
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
  }

  useEffect(function(){
    if(contentRef.current&&note){
      contentRef.current.innerHTML=note.content||"<p style='color:#9B8E80;font-style:italic'>Empty note</p>";
      if(typeof restoreNoteImages==="function") restoreNoteImages(contentRef.current);
    }
  },[noteId,note&&note.content]);

  var posStyle=posVal.x!==null?{left:posVal.x,top:posVal.y}:{left:20,bottom:20};

  if(!note) return null;
  return (
    <div ref={panelRef} style={{
      position:"fixed",...posStyle,
      width:340,maxHeight:"60vh",
      background:"#FDFAF6",color:"#1C1714",
      borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.25)",border:"1px solid #E3D9CC",
      zIndex:790,display:"flex",flexDirection:"column",
      fontFamily:'"DM Sans",sans-serif',fontSize:12,
      overflow:"hidden",
      cursor:dragging?"grabbing":"default",
      userSelect:dragging?"none":"auto",
    }}>
      <div onPointerDown={onHeaderPointerDown}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"8px 12px",borderBottom:"1px solid #E3D9CC",cursor:"grab",flexShrink:0,background:"#F3EDE3"}}>
        <span style={{fontSize:12,fontWeight:700,color:"#1C1714",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{note.title||"Untitled"}</span>
        <button onPointerDown={function(e){e.stopPropagation();}} onClick={function(){if(onOpenNote)onOpenNote(note.id);}}
          style={{background:"none",border:"none",cursor:"pointer",color:"#9B8E80",fontSize:10,padding:"2px 6px",marginRight:4}} title="Open in editor">{"\u2197"}</button>
        <button onPointerDown={function(e){e.stopPropagation();}} onClick={onClose}
          style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:16,lineHeight:1,padding:"0 2px",flexShrink:0,fontWeight:700}}>&#xd7;</button>
      </div>
      <div ref={contentRef} style={{overflowY:"auto",flex:1,padding:"12px 14px",fontSize:13,lineHeight:1.6,color:"#1C1714",wordBreak:"break-word"}}/>
    </div>
  );
}
