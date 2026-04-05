// ─── Trackers View ────────────────────────────────────────────────────────────

function TrackersView({trackers,addTracker,updateTracker,deleteTracker,toggleTrackerDay,archiveTracker,sections,byId,tasks,notes,addTask,addNote,linkTrackerToTask,unlinkTrackerFromTask,linkTrackerToNote,unlinkTrackerFromNote}) {
  const {navigateToFresh}=React.useContext(NavCtx)||{};
  const openCtx=React.useContext(CtxMenuCtx);
  const [selId,setSelId]=useState(null);
  const [showCreate,setShowCreate]=useState(false);
  const [editId,setEditId]=useState(null);
  const [confirmDelId,setConfirmDelId]=useState(null);
  const [showArchived,setShowArchived]=useState(false);
  const [showAddTask,setShowAddTask]=useState(false);
  const [showPinTask,setShowPinTask]=useState(false);
  const [showPinNote,setShowPinNote]=useState(false);
  const [pinTaskQ,setPinTaskQ]=useState("");
  const [pinNoteQ,setPinNoteQ]=useState("");
  const pinTaskRef=useRef(null);
  const pinNoteRef=useRef(null);
  useEffect(()=>{
    if(!showPinTask&&!showPinNote) return;
    function handler(e){
      if(showPinTask&&pinTaskRef.current&&!pinTaskRef.current.contains(e.target)) setShowPinTask(false);
      if(showPinNote&&pinNoteRef.current&&!pinNoteRef.current.contains(e.target)) setShowPinNote(false);
    }
    window.addEventListener("mousedown",handler);
    return()=>window.removeEventListener("mousedown",handler);
  },[showPinTask,showPinNote]);

  const active=trackers.filter(t=>!t.archived);
  const grouped=sections.map(sec=>({sec,items:active.filter(t=>t.sectionId===sec.id)})).filter(g=>g.items.length>0);
  const ungrouped=active.filter(t=>!t.sectionId);
  const sel=trackers.find(t=>t.id===selId)||active[0]||null;
  const today=todayISO();

  // Monthly calendar for selected tracker
  function MonthGrid({trk}){
    const now=new Date();
    const [monthOff,setMonthOff]=useState(0);
    const ref=new Date(now.getFullYear(),now.getMonth()+monthOff,1);
    const year=ref.getFullYear(),month=ref.getMonth();
    const monthLabel=ref.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
    const firstDay=(new Date(year,month,1).getDay()+6)%7; // Monday=0
    const daysInMonth=new Date(year,month+1,0).getDate();
    const cells=[];
    for(let i=0;i<firstDay;i++) cells.push(null);
    for(let d=1;d<=daysInMonth;d++){
      const iso=[year,String(month+1).padStart(2,"0"),String(d).padStart(2,"0")].join("-");
      const di=(new Date(year,month,d).getDay()+6)%7;
      var rawV=trk.completions[iso];
      var cellActive=trk.mode==="tally"||trk.activeDays[di];
      var cellDone=trk.mode==="tally"?(typeof rawV==="number"?rawV:rawV?1:0)>0:!!rawV;
      var cellCount=trk.mode==="tally"?(typeof rawV==="number"?rawV:rawV?1:0):0;
      cells.push({day:d,iso,active:cellActive,done:cellDone,count:cellCount});
    }
    var isTally=trk.mode==="tally";
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <button onClick={()=>setMonthOff(m=>m-1)} style={{...S.btnMicro,padding:"2px 8px"}}>&#x25C0;</button>
          <span style={{fontSize:12,fontWeight:600}}>{monthLabel}</span>
          <button onClick={()=>setMonthOff(m=>m+1)} style={{...S.btnMicro,padding:"2px 8px"}}>&#x25B6;</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {DAYS.map(d=><div key={d} style={{fontSize:9,fontWeight:700,textAlign:"center",color:"#9B8E80"}}>{d.slice(0,2)}</div>)}
          {cells.map((c,i)=>{
            if(!c) return <div key={"e"+i}/>;
            const isToday=c.iso===today;
            return (
              <div key={c.iso}
                onClick={()=>{if(c.active) toggleTrackerDay(trk.id,c.iso,isTally?true:undefined);}}
                onContextMenu={isTally?function(e){e.preventDefault();if(c.count>0) toggleTrackerDay(trk.id,c.iso,false);}:undefined}
                title={isTally&&c.count>0?c.count+" occurrence"+(c.count!==1?"s":""):""}
                style={{width:"100%",aspectRatio:"1",borderRadius:4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  fontSize:isTally&&c.count>0?8:10,fontWeight:isToday?700:500,cursor:c.active?"pointer":"default",
                  background:c.done?(isTally?trk.color+"20":trk.color+"30"):c.active?"#F8F3EC":"#EBE4D8",
                  color:c.done?trk.color:c.active?"#4A3F30":"#C8BEB0",
                  border:isToday?"2px solid "+trk.color:"1px solid transparent"}}>
                <span>{c.day}</span>
                {isTally&&c.count>0&&<span style={{fontSize:8,fontWeight:700,lineHeight:1}}>{c.count}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function TrackerRow({trk}){
    const streak=trackerStreak(trk);
    const todayDi=dayIndex(today);
    const isActiveToday=trk.mode==="tally"||trk.activeDays[todayDi];
    const rawVal=trk.completions[today];
    const doneToday=trk.mode==="tally"?(typeof rawVal==="number"?rawVal:rawVal?1:0):!!rawVal;
    const tallyCount=trk.mode==="tally"?(typeof rawVal==="number"?rawVal:rawVal?1:0):0;
    return (
      <div onClick={()=>setSelId(trk.id)}
        onContextMenu={e=>openCtx?.(e,[
          {label:"Edit",action:()=>setEditId(trk.id)},
          {label:"Archive",action:()=>archiveTracker(trk.id)},
          {label:"Delete",action:()=>deleteTracker(trk.id),danger:true},
        ])}
        style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,cursor:"pointer",
          background:sel?.id===trk.id?"#EBE4D8":"transparent",border:sel?.id===trk.id?"1px solid #D5CBBC":"1px solid transparent"}}>
        <div style={{width:10,height:10,borderRadius:3,background:trk.color,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1C1714",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{trk.title}</div>
          <div style={{fontSize:10,color:"#9B8E80"}}>{trk.mode==="tally"?"Tally tracker":DAYS.filter((_,i)=>trk.activeDays[i]).map(d=>d.slice(0,3)).join(", ")}</div>
        </div>
        {trk.mode==="tally" ? (
          <div style={{display:"flex",alignItems:"center",gap:3}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>toggleTrackerDay(trk.id,today,false)} style={{width:18,height:18,borderRadius:4,border:"1px solid #D6CEC3",background:"#F8F3EC",fontSize:11,fontWeight:700,color:"#7A6C5E",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&minus;</button>
            <span style={{fontSize:12,fontWeight:700,color:trk.color,minWidth:18,textAlign:"center"}}>{tallyCount}</span>
            <button onClick={()=>toggleTrackerDay(trk.id,today,true)} style={{width:18,height:18,borderRadius:4,border:"1px solid "+trk.color,background:trk.color,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
        ) : isActiveToday ? (
          <div onClick={e=>{e.stopPropagation();toggleTrackerDay(trk.id,today);}}
            style={{width:20,height:20,borderRadius:5,border:"2px solid "+trk.color,
              background:doneToday?trk.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
              color:"#fff",fontSize:11,fontWeight:700,flexShrink:0,cursor:"pointer"}}>
            {doneToday?"\u2713":""}
          </div>
        ) : null}
        {trk.mode!=="tally"&&streak>0&&<span style={{fontSize:10,fontWeight:600,color:trk.color,flexShrink:0}}>{streak}d</span>}
      </div>
    );
  }

  return (
    <div style={{display:"flex",gap:24,height:"100%",minHeight:0}}>
      {/* Left: Tracker list */}
      <div style={{width:280,flexShrink:0,overflowY:"auto",paddingRight:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:20,margin:0}}>Trackers</h2>
          <button onClick={()=>setShowCreate(true)} style={{...S.btnDark,fontSize:12,padding:"6px 14px"}}>+ New</button>
        </div>
        {ungrouped.length>0&&(
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:"#9B8E80",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:4,paddingLeft:4}}>General</div>
            {ungrouped.map(t=><TrackerRow key={t.id} trk={t}/>)}
          </div>
        )}
        {grouped.map(({sec,items})=>(
          <div key={sec.id} style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:sec.color,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:4,paddingLeft:4,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:6,height:6,borderRadius:2,background:sec.color,display:"inline-block"}}/>{sec.label}
            </div>
            {items.map(t=><TrackerRow key={t.id} trk={t}/>)}
          </div>
        ))}
        {active.length===0&&(
          <div style={{textAlign:"center",padding:"40px 16px",color:"#9B8E80"}}>
            <div style={{fontSize:28,marginBottom:8}}>&#x1F4CB;</div>
            <div style={{fontSize:13,fontWeight:600}}>No trackers yet</div>
            <div style={{fontSize:11,marginTop:4}}>Create one to start tracking habits</div>
          </div>
        )}
        {(function(){
          var archived=trackers.filter(function(t){return t.archived;});
          if(archived.length===0) return null;
          return <div style={{borderTop:"1px solid #E3D9CC",marginTop:12,paddingTop:8}}>
            <button onClick={function(){setShowArchived(function(v){return !v;});}}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,color:"#9B8E80",letterSpacing:"0.5px",textTransform:"uppercase",padding:"4px 4px",display:"flex",alignItems:"center",gap:4}}>
              <span style={{transform:showArchived?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.15s",display:"inline-block"}}>{"\u25B6"}</span>
              Archived ({archived.length})
            </button>
            {showArchived&&archived.map(function(trk){return <div key={trk.id}
              style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:9,opacity:0.6}}>
              <div style={{width:10,height:10,borderRadius:3,background:trk.color,flexShrink:0}}/>
              <span style={{fontSize:12,color:"#9B8E80",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{trk.title}</span>
              <button onClick={function(){updateTracker(trk.id,{archived:false});}}
                style={{background:"none",border:"none",cursor:"pointer",color:"#2A7A8A",fontSize:10,fontWeight:600,padding:"2px 6px"}}>Restore</button>
              <button onClick={function(){setConfirmDelId(trk.id);}}
                style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:10,fontWeight:600,padding:"2px 6px"}}>Delete</button>
            </div>;})}
          </div>;
        })()}
      </div>
      {/* Right: Selected tracker detail */}
      <div style={{flex:1,overflowY:"auto"}}>
        {sel?(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:14,height:14,borderRadius:4,background:sel.color}}/>
              <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:22,margin:0}}>{sel.title}</h2>
              {sel.sectionId&&byId[sel.sectionId]&&(
                <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:byId[sel.sectionId].color+"20",color:byId[sel.sectionId].color}}>
                  {byId[sel.sectionId].label}
                </span>
              )}
              <div style={{flex:1}}/>
              <button onClick={()=>setEditId(sel.id)} style={{...S.btnGhost,fontSize:11,padding:"4px 12px"}}>Edit</button>
              <button onClick={function(){archiveTracker(sel.id);setSelId(null);}} style={{...S.btnGhost,fontSize:11,padding:"4px 12px",color:"#9B8E80"}}>Archive</button>
              <button onClick={function(){setConfirmDelId(sel.id);}} style={{...S.btnGhost,fontSize:11,padding:"4px 12px",color:"#C43A3A"}}>Delete</button>
            </div>

            {/* Pinned Tasks — active linked tasks (done tasks hidden) */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={S.lbl}>Pinned Tasks</span>
                <div style={{flex:1}}/>
                <div ref={pinTaskRef} style={{position:"relative"}}>
                  <button onClick={()=>{setShowPinTask(v=>!v);setShowPinNote(false);}} style={{...S.btnMicro,fontSize:10}}>+ Pin Existing</button>
                  {showPinTask&&(
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:250,maxHeight:220,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
                      <input value={pinTaskQ} onChange={e=>setPinTaskQ(e.target.value)} placeholder="Search tasks to pin…"
                        style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}} autoFocus/>
                      {tasks.filter(t=>t.type!=="spacer"&&t.status!=="done"&&!sel.linkedTaskIds.includes(t.id)&&(!pinTaskQ||t.title.toLowerCase().includes(pinTaskQ.toLowerCase()))).slice(0,10).map(t=>(
                        <div key={t.id} onClick={()=>{linkTrackerToTask(sel.id,t.id);setShowPinTask(false);setPinTaskQ("");}}
                          style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}
                          onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <Dot color={byId[t.sectionId]?.color||"#9B8E80"} size={6}/>{t.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={()=>setShowAddTask(true)} style={{...S.btnMicro,fontSize:10}}>+ Create New</button>
              </div>
              {sel.linkedTaskIds.map(tid=>{
                const t=tasks.find(x=>x.id===tid);
                if(!t||t.status==="done") return null;
                return (
                  <div key={tid} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:7,background:"#F8F3EC",marginBottom:4,fontSize:12,border:"1px solid #E3D9CC"}}>
                    <Dot color={byId[t.sectionId]?.color||"#9B8E80"} size={7}/>
                    <span style={{flex:1,cursor:"pointer",color:"#4B3FC7",fontWeight:500}} onClick={()=>navigateToFresh?.({type:"task",id:tid})}>{t.title}</span>
                    <button onClick={()=>unlinkTrackerFromTask(sel.id,tid)} title="Unpin"
                      style={{background:"none",border:"none",color:"#C2B49E",cursor:"pointer",fontSize:11,padding:0}}>&#xd7;</button>
                  </div>
                );
              })}
              {sel.linkedTaskIds.filter(tid=>{const t=tasks.find(x=>x.id===tid);return t&&t.status!=="done";}).length===0&&(
                <div style={{fontSize:11,color:"#C2B49E",padding:"4px 2px",fontStyle:"italic"}}>No pinned tasks</div>
              )}
            </div>

            {/* Pinned Notes — linked notes for reference */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={S.lbl}>Pinned Notes</span>
                <div style={{flex:1}}/>
                <div ref={pinNoteRef} style={{position:"relative"}}>
                  <button onClick={()=>{setShowPinNote(v=>!v);setShowPinTask(false);}} style={{...S.btnMicro,fontSize:10}}>+ Pin Existing</button>
                  {showPinNote&&(
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:250,maxHeight:220,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
                      <input value={pinNoteQ} onChange={e=>setPinNoteQ(e.target.value)} placeholder="Search notes to pin…"
                        style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}} autoFocus/>
                      {Object.entries(notes||{}).flatMap(function(entry){
                        const sid=entry[0]; const arr=entry[1];
                        return (Array.isArray(arr)?arr:[]).filter(function(n){
                          return !sel.linkedNoteIds.includes(n.id)&&(!pinNoteQ||n.title.toLowerCase().includes(pinNoteQ.toLowerCase()));
                        }).map(function(n){ return {note:n,sid:sid}; });
                      }).slice(0,10).map(function(item){
                        return (
                          <div key={item.note.id} onClick={function(){linkTrackerToNote(sel.id,item.note.id,item.sid);setShowPinNote(false);setPinNoteQ("");}}
                            style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}
                            onMouseEnter={function(e){e.currentTarget.style.background="#EBE4D8";}}
                            onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
                            <Dot color={byId[item.sid]?.color||"#9B8E80"} size={6}/>{item.note.title}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button onClick={function(){
                  const secForNote=sel.sectionId||sections.filter(function(s){return s.id!=="overhead";})[0]?.id;
                  if(!secForNote) return;
                  const noteId=uid();
                  addNote(secForNote,null,{id:noteId,title:sel.title+" — Log",linkedTrackerIds:[sel.id]});
                  updateTracker(sel.id,{linkedNoteIds:[...(sel.linkedNoteIds||[]),noteId]});
                }} style={{...S.btnMicro,fontSize:10}}>+ Create New</button>
              </div>
              {sel.linkedNoteIds.map(nid=>{
                let found=null; let foundSec=null;
                for(const [sid,arr] of Object.entries(notes||{})) {
                  const n=(Array.isArray(arr)?arr:[]).find(n=>n.id===nid);
                  if(n){ found=n; foundSec=sid; break; }
                }
                if(!found) return null;
                return (
                  <div key={nid} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:7,background:"#F8F3EC",marginBottom:4,fontSize:12,border:"1px solid #E3D9CC"}}>
                    <Dot color={byId[foundSec]?.color||"#9B8E80"} size={7}/>
                    <span style={{flex:1,cursor:"pointer",color:"#6B3FC7",fontWeight:500}} onClick={()=>navigateToFresh?.({type:"note",id:nid})}>{found.title}</span>
                    <button onClick={()=>unlinkTrackerFromNote(sel.id,nid,foundSec)} title="Unpin"
                      style={{background:"none",border:"none",color:"#C2B49E",cursor:"pointer",fontSize:11,padding:0}}>&#xd7;</button>
                  </div>
                );
              })}
              {sel.linkedNoteIds.filter(nid=>{
                for(const arr of Object.values(notes||{})){const n=(Array.isArray(arr)?arr:[]).find(n=>n.id===nid);if(n)return true;}return false;
              }).length===0&&(
                <div style={{fontSize:11,color:"#C2B49E",padding:"4px 2px",fontStyle:"italic"}}>No pinned notes</div>
              )}
            </div>

            {/* This week row */}
            <div style={{marginBottom:20}}>
              <div style={S.lbl}>This Week</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
                {DAYS.map((d,i)=>{
                  const wk=mondayOf(new Date());
                  const iso=addDays(wk,i);
                  const isActive=sel.activeDays[i];
                  const done=sel.completions[iso];
                  const isToday=iso===today;
                  return (
                    <div key={d} onClick={()=>{if(isActive) toggleTrackerDay(sel.id,iso);}}
                      style={{padding:"8px 4px",borderRadius:8,textAlign:"center",cursor:isActive?"pointer":"default",
                        background:done?sel.color+"20":isActive?"#F8F3EC":"#EBE4D8",
                        border:isToday?"2px solid "+sel.color:"1.5px solid "+(isActive?"#E3D9CC":"#EBE4D8")}}>
                      <div style={{fontSize:10,fontWeight:700,color:isToday?sel.color:"#9B8E80"}}>{d.slice(0,3)}</div>
                      <div style={{fontSize:18,marginTop:2,color:done?sel.color:isActive?"#C8BEB0":"#E3D9CC",fontWeight:700}}>
                        {done?"\u2713":isActive?"\u00B7":""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Streak & stats */}
            <div style={{display:"flex",gap:12,marginBottom:20}}>
              {[
                [trackerStreak(sel),"Current Streak","scheduled days"],
                [Object.keys(sel.completions).length,"Total Completions","all time"],
              ].map(([v,l,sub],i)=>(
                <div key={i} style={{flex:1,background:"#EBE4D8",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:22,fontWeight:700,fontFamily:'"Playfair Display",serif',color:sel.color}}>{v}</div>
                  <div style={{fontSize:11,fontWeight:600,color:"#4A3F30"}}>{l}</div>
                  <div style={{fontSize:9,color:"#9B8E80"}}>{sub}</div>
                </div>
              ))}
            </div>
            {/* Month grid */}
            <div style={{marginBottom:20,background:"#EBE4D8",borderRadius:12,padding:"14px 16px"}}>
              <MonthGrid trk={sel}/>
            </div>
          </div>
        ):(
          <div style={{textAlign:"center",padding:"80px 20px",color:"#9B8E80"}}>
            <div style={{fontSize:13}}>Select a tracker or create a new one</div>
          </div>
        )}
      </div>
      {/* Create/Edit modal */}
      {(showCreate||editId)&&<TrackerCreateModal sections={sections} tracker={editId?trackers.find(t=>t.id===editId):null}
        onSave={(data)=>{
          if(editId) updateTracker(editId,data);
          else addTracker(data.title,data);
          setShowCreate(false); setEditId(null);
        }}
        onClose={()=>{setShowCreate(false);setEditId(null);}}/>}
      {/* Add Task modal for tracker */}
      {showAddTask&&sel&&(
        <AddTaskModal secColor={sel.color} onClose={()=>setShowAddTask(false)}
          onAdd={(title,notesT,opts)=>{
            const secForTask=sel.sectionId||sections.filter(s=>s.id!=="overhead")[0]?.id;
            if(!secForTask) return;
            const taskId=uid();
            addTask(secForTask,title,notesT,{...opts,id:taskId});
            linkTrackerToTask(sel.id,taskId);
            setShowAddTask(false);
          }}
          initialTitle={sel.title}/>
      )}
      {/* Delete confirmation overlay */}
      {confirmDelId&&(function(){
        var trk=trackers.find(function(t){return t.id===confirmDelId;});
        if(!trk) return null;
        return <Overlay onClose={function(){setConfirmDelId(null);}}>
          <div style={{maxWidth:360}}>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,marginBottom:12}}>Delete Tracker</h3>
            <p style={{fontSize:13,color:"#6B5E4E",marginBottom:16}}>
              Delete <strong>{trk.title}</strong>? All completion history will be lost. This cannot be undone.
            </p>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={function(){setConfirmDelId(null);}} style={S.btnGhost}>Cancel</button>
              <button onClick={function(){deleteTracker(confirmDelId);setConfirmDelId(null);setSelId(null);}} style={{...S.btnDark,background:"#C43A3A"}}>Delete</button>
            </div>
          </div>
        </Overlay>;
      })()}
    </div>
  );
}

function TrackerCreateModal({sections,tracker,onSave,onClose}) {
  const [title,setTitle]=useState(tracker?.title||"");
  const [secId,setSecId]=useState(tracker?.sectionId||"");
  const [color,setColor]=useState(tracker?.color||"#0C7B7B");
  const [mode,setMode]=useState(tracker?.mode||"habit");
  const [days,setDays]=useState(tracker?.activeDays||[1,1,1,1,1,0,0]);
  const titleRef=useRef(null);
  useEffect(()=>{setTimeout(()=>titleRef.current?.focus(),60);},[]);

  function toggleDay(i){ setDays(d=>{const n=[...d];n[i]=n[i]?0:1;return n;}); }

  function handleSave(){
    if(!title.trim()) return;
    onSave({title:title.trim(),sectionId:secId||null,color,mode,activeDays:days});
  }

  return (
    <Overlay onClose={onClose} width={420}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <Dot color={color} size={11}/>
        <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700}}>{tracker?"Edit Tracker":"New Tracker"}</h2>
      </div>
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Title</label>
        <input ref={titleRef} value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") handleSave();}}
          placeholder={mode==="tally"?"e.g. Late to work, Snacking, Headaches...":"e.g. Exercise, Reading, Meditation..."}
          style={{...S.input,marginBottom:0}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Type</label>
        <div style={{display:"flex",gap:4,background:"#EBE4D8",borderRadius:8,padding:3}}>
          <button onClick={()=>setMode("habit")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"none",fontSize:11,fontWeight:600,
            background:mode==="habit"?"#FDFAF6":"transparent",color:mode==="habit"?"#1C1714":"#7A6C5E",
            boxShadow:mode==="habit"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
            Habit
          </button>
          <button onClick={()=>setMode("tally")} style={{flex:1,padding:"6px 0",borderRadius:6,border:"none",fontSize:11,fontWeight:600,
            background:mode==="tally"?"#FDFAF6":"transparent",color:mode==="tally"?"#1C1714":"#7A6C5E",
            boxShadow:mode==="tally"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
            Tally
          </button>
        </div>
        <div style={{fontSize:10,color:"#9B8E80",marginTop:4}}>
          {mode==="habit"?"Track daily habits — one check per day.":"Track occurrences — tick multiple times per day to count events."}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Section (optional)</label>
        <select value={secId} onChange={e=>setSecId(e.target.value)} style={{...S.input,marginBottom:0}}>
          <option value="">None (Independent)</option>
          {sections.filter(s=>s.id!=="overhead").map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      {mode==="habit"&&<div style={{marginBottom:12}}>
        <label style={S.lbl}>Active Days</label>
        <div style={{display:"flex",gap:4}}>
          {DAYS.map((d,i)=>(
            <button key={d} onClick={()=>toggleDay(i)}
              style={{...S.btnMicro,flex:1,padding:"6px 0",background:days[i]?color:"#EBE4D8",
                color:days[i]?"#fff":"#4A3F30",borderRadius:6,fontSize:11,fontWeight:600}}>
              {d.slice(0,2)}
            </button>
          ))}
        </div>
      </div>}
      <div style={{marginBottom:16}}>
        <ColorPicker value={color} onChange={setColor} label="Colour"/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={handleSave} style={{...S.btnDark,background:color,flex:1}}>{tracker?"Save":"Create Tracker"}</button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
      </div>
    </Overlay>
  );
}
