// ─── Today View ───────────────────────────────────────────────────────────────

function TodayView({getDayBlocks,sections,byId,tasks,updateTask,completeTask,onOpenCapture,trackers,toggleTrackerDay}) {
  const dayName  = todayName();
  const blocks   = getDayBlocks(dayName);
  const dateStr  = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const todaySids= [...new Set(blocks.filter(b=>b.sectionId&&b.sectionId!=="overhead"&&byId[b.sectionId]).map(b=>b.sectionId))];
  const todayDi  = dayIndex(todayISO());
  const todayTrackers=(trackers||[]).filter(t=>!t.archived&&t.activeDays[todayDi]);
  const today=todayISO();

  return (
    <div>
      {/* Title row */}
      <div style={{display:"flex",alignItems:"flex-end",gap:16,marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:30,fontWeight:700,lineHeight:1}}>{dayName}</h1>
          <p style={{fontSize:13,color:"#9B8E80",marginTop:5}}>{dateStr}</p>
        </div>
        <button onClick={onOpenCapture} className="cap-btn" style={{marginLeft:"auto",marginBottom:4}}>
          <span style={{fontSize:14}}>⚡</span><span>Quick Capture</span>
        </button>
      </div>

      {/* Upcoming digest — always shown if there are dated tasks */}
      <UpcomingDigest tasks={tasks} byId={byId} completeTask={completeTask} updateTask={updateTask}/>

      {/* Daily Trackers */}
      {todayTrackers.length>0&&(
        <div style={{marginBottom:20,background:"#EBE4D8",borderRadius:14,padding:"16px 18px"}}>
          <Cap>Daily Trackers</Cap>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {todayTrackers.map(trk=>{
              const done=trk.completions[today];
              const streak=trackerStreak(trk);
              return (
                <div key={trk.id} onClick={()=>toggleTrackerDay(trk.id,today)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:9,cursor:"pointer",
                    background:done?"#D4F0E0":"#F8F3EC",border:done?"1.5px solid #1A7A43":"1px solid #E3D9CC"}}>
                  <div style={{width:20,height:20,borderRadius:5,border:"2px solid "+trk.color,
                    background:done?trk.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#fff",fontSize:12,fontWeight:700}}>{done?"\u2713":""}</div>
                  <span style={{fontSize:13,fontWeight:500,flex:1,textDecoration:done?"line-through":"none",
                    color:done?"#1A7A43":"#1C1714"}}>{trk.title}</span>
                  {streak>0&&<span style={{fontSize:10,fontWeight:600,color:trk.color,background:trk.color+"18",padding:"2px 7px",borderRadius:4}}>{streak}d streak</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule + mini boards */}
      {blocks.length===0 ? (
        <Empty icon="🗓" text="No blocks scheduled today." sub="Head to the Timetable tab to plan your day."/>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20,alignItems:"start"}}>
          <div style={{background:"#EBE4D8",borderRadius:14,padding:"16px",position:"sticky",top:88}}>
            <Cap>Today's Schedule</Cap>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {blocks.map(blk=>{
                if(blk.type==="break") return (
                  <div key={blk.id} style={{background:"#F3EDE3",borderRadius:9,padding:"8px 12px",border:"1.5px dashed #C2B49E"}}>
                    <div style={{fontSize:10,color:"#9B8E80",fontWeight:700}}>{blk.start} – {blk.end}</div>
                    <div style={{fontSize:12,color:"#C2B49E",fontStyle:"italic"}}>{blk.label||"Break / Buffer"}</div>
                  </div>
                );
                const sec=byId[blk.sectionId]; if(!sec) return null;
                return (
                  <div key={blk.id} style={{background:sec.color,color:textFor(sec.color),borderRadius:9,padding:"9px 12px",borderLeft:"3px solid rgba(255,255,255,0.3)"}}>
                    <div style={{fontSize:10,opacity:0.72,fontWeight:700,marginBottom:2}}>{blk.start} – {blk.end}</div>
                    <div style={{fontSize:13,fontWeight:600}}>{blk.label||sec.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {todaySids.length===0&&<Empty icon="📋" text="No task-linked sections today." sub="Add work blocks to your timetable to see tasks here."/>}
            {todaySids.map(sid=>{
              const sec=byId[sid]; if(!sec) return null;
              const active=tasks.filter(t=>t.sectionId===sid&&t.status!=="done"&&t.type!=="spacer");
              const tw=active.filter(t=>t.status==="this-week");
              const bl=active.filter(t=>t.status==="backlog");
              return (
                <div key={sid} style={{background:"#EBE4D8",borderRadius:14,padding:"16px 18px",borderTop:`3px solid ${sec.color}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <Dot color={sec.color}/><span style={{fontWeight:700,fontSize:15}}>{sec.label}</span>
                    <span style={{marginLeft:"auto",fontSize:11,color:"#9B8E80"}}>{tw.length} active · {bl.length} backlog</span>
                  </div>
                  {active.length===0?<p style={{fontSize:12,color:"#9B8E80",fontStyle:"italic"}}>No open tasks.</p>:(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <MiniCol label="Backlog"   labelColor="#8B7D6B" tasks={bl.slice(0,5)} secColor={sec.color} updateTask={updateTask} completeTask={completeTask}/>
                      <MiniCol label="This Week" labelColor="#4B3FC7" tasks={tw}            secColor={sec.color} updateTask={updateTask} completeTask={completeTask}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upcoming Digest ──────────────────────────────────────────────────────────

function UpcomingDigest({tasks,byId,completeTask,updateTask}) {
  const today     = todayISO();
  const endWeek   = addDays(today,7);
  const endMonth  = addDays(today,31);

  // Only undone tasks with a dueDate
  const dated = tasks.filter(t=>t.dueDate&&t.status!=="done"&&t.type!=="spacer");
  if(dated.length===0) return null;

  const overdue   = dated.filter(t=>t.dueDate<=today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const thisWeek  = dated.filter(t=>t.dueDate>today&&t.dueDate<=endWeek).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const thisMonth = dated.filter(t=>t.dueDate>endWeek&&t.dueDate<=endMonth).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));

  if(overdue.length+thisWeek.length+thisMonth.length===0) return null;

  function DueTask({task}) {
    const {navigateTo}=React.useContext(NavCtx)||{};
    const sec   = byId[task.sectionId]||{color:"#9B8E80",label:"?"};
    const due   = fmtDue(task.dueDate);
    return (
      <div className="upcoming-task" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:9,background:"#F8F3EC",border:"1px solid #E3D9CC",cursor:"default",transition:"background 0.12s"}}>
        <button onClick={()=>completeTask(task.id)} title="Mark done"
          style={{width:16,height:16,borderRadius:4,border:`2px solid ${sec.color}`,background:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:sec.color}}>✓</button>
        <span onClick={()=>navigateTo?.({type:"task",id:task.id})} style={{fontSize:12,flex:1,fontWeight:500,color:"#1C1714",cursor:"pointer"}}>{task.title}</span>
        <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,fontWeight:700,background:sec.color+"20",color:sec.color,flexShrink:0}}>{sec.label}</span>
        <span style={{fontSize:10,fontWeight:700,flexShrink:0,color:due.urgent?"#C43A3A":"#7A6C5E",background:due.urgent?"#FAE8E8":"#EBE4D8",padding:"2px 7px",borderRadius:10}}>{due.label}</span>
      </div>
    );
  }

  function Bucket({title,accentColor,tasks}) {
    if(tasks.length===0) return null;
    return (
      <div>
        <div style={{fontSize:10,fontWeight:700,color:accentColor,letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:7,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:accentColor,flexShrink:0}}/>
          {title} <span style={{fontWeight:400,color:"#9B8E80",textTransform:"none",letterSpacing:0}}>({tasks.length})</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {tasks.map(t=><DueTask key={t.id} task={t}/>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{background:"#EBE4D8",borderRadius:14,padding:"16px 18px",marginBottom:24,border:"1px solid #D6CEC3"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{fontSize:15}}>📅</span>
        <span style={{fontFamily:'"Playfair Display",serif',fontSize:15,fontWeight:700}}>Upcoming</span>
        <span style={{fontSize:11,color:"#9B8E80",marginLeft:4}}>{dated.length} time-sensitive task{dated.length!==1?"s":""}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Bucket title="Overdue & Today" accentColor="#C43A3A" tasks={overdue}/>
        <Bucket title="This Week"       accentColor="#4B3FC7" tasks={thisWeek}/>
        <Bucket title="Within a Month"  accentColor="#1A7A43" tasks={thisMonth}/>
      </div>
    </div>
  );
}

function MiniCol({label,labelColor,tasks,secColor,updateTask,completeTask}) {
  const {navigateTo}=React.useContext(NavCtx)||{};
  return (
    <div>
      <div style={{fontSize:10,fontWeight:700,color:labelColor,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{label}</div>
      {tasks.length===0&&<div style={{fontSize:11,color:"#9B8E80",fontStyle:"italic"}}>Empty</div>}
      {tasks.map(t=>(
        <div key={t.id} style={{marginBottom:7}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
            <button onClick={()=>completeTask(t.id)} style={{width:15,height:15,borderRadius:4,border:`2px solid ${secColor}`,background:"transparent",padding:0,marginTop:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:secColor}}>✓</button>
            <span onClick={()=>navigateTo?.({type:"task",id:t.id})} style={{fontSize:12,lineHeight:1.35,flex:1,cursor:"pointer"}}>{t.title}</span>
            {t.status==="backlog"&&<button onClick={()=>updateTask(t.id,{status:"this-week"})} style={{fontSize:9,padding:"2px 5px",borderRadius:4,border:"none",background:"#E6E3F5",color:"#4B3FC7",flexShrink:0}}>→W</button>}
          </div>
          {(t.checklist||[]).length>0&&(
            <div style={{marginLeft:21,marginTop:3,display:"flex",flexDirection:"column",gap:2}}>
              {(t.checklist||[]).map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}
                  onClick={()=>updateTask(t.id,{checklist:(t.checklist||[]).map(i=>i.id===item.id?{...i,done:!i.done}:i)})}>
                  <div style={{width:9,height:9,borderRadius:2,border:`1.5px solid ${item.done?"#1A7A43":"#C2B49E"}`,background:item.done?"#1A7A43":"transparent",flexShrink:0}}/>
                  <span style={{fontSize:11,color:item.done?"#9B8E80":"#6B5E4E",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Timetable View ───────────────────────────────────────────────────────────

function TimetableView({sections,byId,getDayBlocks,upsertBlock,deleteBlock,
                        templates,addTemplate,updateTemplate,deleteTemplate,applyTemplate,
                        tasks,notes,setBlocks,addSetBlock,removeSetBlock,trackers}) {
  const openCtx = React.useContext(CtxMenuCtx);
  const {navigateTo} = React.useContext(NavCtx)||{};
  const allNotes = Object.values(notes||{}).flat();
  const [modal,        setModal]        = useState(null);
  const [tmplModal,    setTmplModal]    = useState(null);
  const [showTmplDrop, setShowTmplDrop] = useState(false);
  const [palDrag,      setPalDrag]      = useState(null);
  const palDragRef = React.useRef(null);

  // ── Palette drag (set block → day column)
  function startPalDrag(e, snippet){
    e.preventDefault();
    const d={snippet,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false};
    palDragRef.current=d; setPalDrag(d);
  }
  useEffect(()=>{
    if(!palDrag) return;
    document.body.classList.add("dragging");
    function onMove(e){
      const prev=palDragRef.current; if(!prev) return;
      const dx=e.clientX-prev.startX, dy=e.clientY-prev.startY;
      const active=prev.active||(Math.abs(dx)>5||Math.abs(dy)>5);
      const next={...prev,x:e.clientX,y:e.clientY,active};
      palDragRef.current=next; setPalDrag(next);
    }
    function onUp(e){
      const prev=palDragRef.current;
      if(prev?.active){
        const els=document.elementsFromPoint(e.clientX,e.clientY);
        const col=els.find(el=>el.dataset&&el.dataset.ttday);
        if(col){
          const day=col.dataset.ttday;
          const blk={...prev.snippet,id:uid(),linkedItems:[]};
          const blockEls=[...col.querySelectorAll("[data-ttblock]")];
          let insertBefore=null;
          for(const be of blockEls){
            const r=be.getBoundingClientRect();
            if(e.clientY<r.top+r.height/2){ insertBefore=be.dataset.ttblock; break; }
          }
          upsertBlock(day,blk,insertBefore);
        }
      }
      palDragRef.current=null; setPalDrag(null);
      document.body.classList.remove("dragging");
    }
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
    return()=>{ window.removeEventListener("pointermove",onMove); window.removeEventListener("pointerup",onUp); document.body.classList.remove("dragging"); };
  },[palDrag?.snippet?.id||palDrag?.x]);

  function handleApplyTemplate(tmpl){
    setShowTmplDrop(false);
    const hasExisting=DAYS.some(d=>getDayBlocks(d).length>0);
    if(!hasExisting){ applyTemplate(tmpl,"replace"); return; }
    applyTemplate(tmpl,"confirm");
  }

  // Resolve linked item label for display on a block
  function resolveLinked(item){
    if(item.type==="task"){ const t=(tasks||[]).find(t=>t.id===item.id); return{label:t?.title||item.snapshot,live:!!t,obj:t}; }
    if(item.type==="note"){ const n=allNotes.find(n=>n.id===item.id); return{label:n?.title||item.snapshot,live:!!n,obj:n}; }
    if(item.type==="tracker"){ const t=(trackers||[]).find(t=>t.id===item.id); return{label:t?.title||item.snapshot,live:!!t,obj:t}; }
    return{label:item.snapshot,live:false,obj:null};
  }

  return (
    <div>
      {/* Legend + template toolbar */}
      <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {sections.map(s=>(
          <span key={s.id} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px 3px 7px",borderRadius:20,background:s.color+"18",border:`1px solid ${s.color}50`}}>
            <Dot color={s.color} size={7}/><span style={{fontSize:11,color:s.color,fontWeight:700}}>{s.label}</span>
          </span>
        ))}
        <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px 3px 7px",borderRadius:20,background:"#F3EDE3",border:"1px dashed #C2B49E"}}>
          <Dot color="#C2B49E" size={7}/><span style={{fontSize:11,color:"#9B8E80",fontWeight:700}}>Break / Buffer</span>
        </span>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowTmplDrop(v=>!v)} style={{...S.btnGhost,fontSize:12,display:"flex",alignItems:"center",gap:5}}>
              Templates &#x25BC;
            </button>
            {showTmplDrop&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:200,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:10,padding:8,minWidth:210,boxShadow:"0 6px 20px rgba(0,0,0,0.14)"}}>
                {(templates||[]).length===0&&<div style={{fontSize:12,color:"#9B8E80",padding:"4px 6px",fontStyle:"italic"}}>No week templates yet.</div>}
                {(templates||[]).map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:7}}
                    onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:t.color,flexShrink:0}}/>
                    <span onClick={()=>handleApplyTemplate(t)} style={{fontSize:12,fontWeight:500,flex:1,cursor:"pointer"}}>{t.name}</span>
                    <button onClick={e=>{e.stopPropagation();setShowTmplDrop(false);setTmplModal(t);}} style={{background:"none",border:"none",cursor:"pointer",color:"#9B8E80",fontSize:11,padding:"0 2px"}}>Edit</button>
                    <button onClick={e=>{e.stopPropagation();deleteTemplate(t.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:11,padding:"0 2px"}}>&#xd7;</button>
                  </div>
                ))}
                <div style={{borderTop:"1px solid #E3D9CC",marginTop:6,paddingTop:6}}>
                  <button onClick={()=>{setShowTmplDrop(false);setTmplModal("new");}} style={{...S.btnMicro,width:"100%",textAlign:"left",fontSize:11}}>+ New Week Template</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Set block palette */}
      {(setBlocks||[]).length>0&&(
        <div style={{marginBottom:14,padding:"8px 12px",background:"#EBE4D8",borderRadius:10,border:"1px solid #D6CEC3"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:7}}>Set Blocks — drag to place</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {(setBlocks||[]).map(sb=>{
              const sec=sb.sectionId?byId[sb.sectionId]:null;
              const bg=sec?sec.color:"#8B7D6B";
              return (
                <div key={sb.id} style={{display:"inline-flex",alignItems:"center",gap:4}}>
                  <div onPointerDown={e=>startPalDrag(e,sb)}
                    style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,
                      background:bg+"22",border:`1px solid ${bg}50`,cursor:"grab",userSelect:"none",fontSize:11,fontWeight:600,color:bg}}>
                    {sb.label||(sec?.label)||(sb.type==="break"?"Break":"Block")}
                    <span style={{fontSize:9,color:bg+"99"}}>&#x2022; {sb.start}&#x2013;{sb.end}</span>
                  </div>
                  <button onClick={()=>removeSetBlock(sb.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#C2B49E",fontSize:11,padding:"0 2px",lineHeight:1}} title="Remove from palette">&#xd7;</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ghost drag */}
      {palDrag?.active&&(()=>{
        const s=palDrag.snippet; const sec=s.sectionId?byId[s.sectionId]:null; const bg=sec?sec.color:"#8B7D6B";
        return <div style={{position:"fixed",left:palDrag.x+10,top:palDrag.y-14,zIndex:900,pointerEvents:"none",
          padding:"5px 12px",borderRadius:20,background:bg,color:textFor(bg),
          fontSize:11,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.22)"}}>
          {s.label||(sec?.label)||"Block"}
        </div>;
      })()}

      {/* Week grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10}}>
        {DAYS.map(day=>{
          const blocks=getDayBlocks(day);
          return (
            <div key={day} data-ttday={day}>
              <div style={{marginBottom:10,paddingBottom:8,borderBottom:"2px solid #E3D9CC"}}>
                <span style={{fontFamily:'"Playfair Display",serif',fontWeight:700,fontSize:14}}>{day}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {blocks.map(blk=>{
                  const isBreak=blk.type==="break";
                  const sec=!isBreak?(byId[blk.sectionId]||{color:"#9B8E80",label:"?"}):null;
                  const linked=(blk.linkedItems||[]).map(item=>({...item,...resolveLinked(item)}));
                  const ctxItems=[
                    {label:"Edit",         action:()=>setModal({day,block:blk})},
                    {label:"Save as set block", action:()=>addSetBlock(blk)},
                    {label:"Copy to day…", submenu:DAYS.filter(d=>d!==day).map(d=>({label:d,action:()=>upsertBlock(d,{...blk,id:uid()})}))},
                    {divider:true},
                    {label:"Clear slot",danger:true,action:()=>deleteBlock(day,blk.id)},
                  ];
                  if(isBreak) return (()=>{
                    const mins=blockMins(blk),bh=Math.min(160,Math.max(36,Math.round(mins*0.7)));
                    return (
                    <div key={blk.id} data-ttblock={blk.id} className="chip-hov"
                      onClick={()=>setModal({day,block:blk})}
                      onContextMenu={e=>{if(!openCtx)return;openCtx(e,ctxItems);}}
                      style={{background:"#F3EDE3",borderRadius:9,padding:"7px 10px",border:"1.5px dashed #C2B49E",cursor:"pointer",transition:"filter 0.15s",userSelect:"none",minHeight:bh,boxSizing:"border-box"}}>
                      <div style={{fontSize:10,color:"#9B8E80",fontWeight:700}}>{blk.start} &#x2013; {blk.end}</div>
                      <div style={{fontSize:11,color:"#C2B49E",fontStyle:"italic"}}>{blk.label||"Break / Buffer"}</div>
                    </div>
                  );})();
                  return (()=>{
                    const mins=blockMins(blk),bh=Math.min(160,Math.max(36,Math.round(mins*0.7)));
                    return (
                    <div key={blk.id} data-ttblock={blk.id} className="chip-hov"
                      onClick={()=>setModal({day,block:blk})}
                      onContextMenu={e=>{if(!openCtx)return;openCtx(e,ctxItems);}}
                      style={{background:sec.color,color:textFor(sec.color),borderRadius:9,padding:"8px 10px",cursor:"pointer",borderLeft:"3px solid rgba(255,255,255,0.3)",transition:"filter 0.15s",userSelect:"none",minHeight:bh,boxSizing:"border-box"}}>
                      <div style={{fontSize:10,opacity:0.7,fontWeight:700,marginBottom:3}}>{blk.start} &#x2013; {blk.end}</div>
                      <div style={{fontSize:12,fontWeight:600,lineHeight:1.3}}>{blk.label||sec.label}</div>
                      {linked.map((item,i)=>(
                        <div key={i} onClick={e=>{e.stopPropagation();if(item.live)navigateTo?.({type:item.type,id:item.id});}}
                          style={{fontSize:10,marginTop:3,opacity:item.live?0.9:0.55,display:"flex",alignItems:"center",gap:3,
                            cursor:item.live?"pointer":"default",textDecoration:item.live?"underline":"none"}}>
                          {item.type==="task"?"&#x1F4CC; ":"&#x1F4DD; "}{item.label}
                          {!item.live&&<span style={{fontStyle:"italic"}}> (removed)</span>}
                        </div>
                      ))}
                    </div>
                  );})();
                })}
                <button className="add-btn" onClick={()=>setModal({day,block:null})}
                  style={{padding:"8px",background:"transparent",border:"1.5px dashed #C2B49E",borderRadius:9,color:"#9B8E80",fontSize:18,lineHeight:1,transition:"all 0.15s"}}>+</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal&&<BlockModal day={modal.day} block={modal.block} sections={sections}
        tasks={tasks} allNotes={allNotes} trackers={trackers} addSetBlock={addSetBlock}
        dayBlocks={modal.day?getDayBlocks(modal.day):[]}
        onSave={(day,blk)=>{upsertBlock(day,blk);setModal(null);}}
        onDelete={(day,id)=>{deleteBlock(day,id);setModal(null);}}
        onClose={()=>setModal(null)}/>}

      {tmplModal&&<TemplateModal
        template={tmplModal==="new"?null:tmplModal}
        sections={sections} byId={byId} tasks={tasks} allNotes={allNotes} trackers={trackers}
        onSave={t=>{ if(tmplModal==="new") addTemplate(t); else updateTemplate(t); setTmplModal(null); }}
        onClose={()=>setTmplModal(null)}/>}
    </div>
  );
}

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
  const {navigateTo:navTo,getDayBlocks,upsertBlock,sections:navSections}=React.useContext(NavCtx)||{};
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
           {label:"&#x1F4C5; Schedule", action:()=>setSchedModal(true)},
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
           task.status==="done"?{label:"&#x1F4E6; Archive",action:()=>archiveTask?.(task.id)}:null,
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
      {schedModal&&<ScheduleTaskModal task={task} sections={navSections||sections||[]} byId={Object.fromEntries((navSections||sections||[]).map(s=>[s.id,s]))} getDayBlocks={getDayBlocks||(()=>[])} upsertBlock={upsertBlock||(()=>{})} onClose={()=>setSchedModal(false)}/>}
    </div>
  );
}



// ─── Notes View ───────────────────────────────────────────────────────────────

function NotesView({sections,byId,getSectionNotes,addNote,updateNoteField,deleteNote,tasks,setView,initialSecId,initialNoteId,onNoteChange}) {
  const openCtx = React.useContext(CtxMenuCtx);
  const [secId,       setSecId]       =useState(()=>{ const id=initialSecId; return sections.find(s=>s.id===id)?id:sections[0]?.id||""; });
  const [selNoteId,   setSelNoteId]   =useState(initialNoteId||null);
  const [collapsed,   setCollapsed]   =useState({});
  const [confirmDel,  setConfirmDel]  =useState(null);
  const [renameTrigger,setRenameTrigger]=useState(null);
  const [tagFilter,setTagFilter]=useState([]);
  const [tagMode,  setTagMode]  =useState("OR");
  const sec  =byId[secId]||sections[0]||{color:"#7C7166",label:""};
  const items=getSectionNotes(secId);
  const selNote=items.find(n=>n.id===selNoteId)||null;
  const allTags=[...new Set(items.flatMap(n=>n.tags||[]))].sort();
  const filteredItems=tagFilter.length===0?null:items.filter(n=>tagMode==="AND"?tagFilter.every(t=>(n.tags||[]).includes(t)):tagFilter.some(t=>(n.tags||[]).includes(t)));
  function toggleTagFilter(tag){setTagFilter(prev=>prev.includes(tag)?prev.filter(t=>t!==tag):[...prev,tag]);}
  useEffect(()=>{
    const roots=noteChildren(items,null);
    if(!selNoteId&&roots.length>0) setSelNoteId(roots[0].id);
    if(selNoteId&&!items.find(n=>n.id===selNoteId)) setSelNoteId(roots[0]?.id||null);
  },[secId,items.length]);
  const toggleCollapse=id=>setCollapsed(p=>({...p,[id]:!p[id]}));
  useEffect(()=>{ onNoteChange?.(secId,selNoteId); },[secId,selNoteId]);
  function handleDelete(id){
    const note = items.find(n=>n.id===id);
    const isEmpty = (!note||note.title==="Untitled Note")&&(!note||!note.content||note.content.replace(/<[^>]*>/g,"").trim()==="");
    if(isEmpty && noteDescendants(items,id).length===0){ deleteNote(secId,id); return; }
    setConfirmDel(id);
  }
  function renderNode(node,depth=0) {
    const children=noteChildren(items,node.id);
    const isOpen=!collapsed[node.id];
    const isActive=selNoteId===node.id;
    return (
      <div key={node.id}>
        <div className={`note-row${isActive?" active":""}`} style={{paddingLeft:8+depth*16}} onClick={()=>setSelNoteId(node.id)}
          onContextMenu={e=>{ if(!openCtx) return; openCtx(e,[
            {label:"Rename",         action:()=>{ setSelNoteId(node.id); setRenameTrigger(node.id); }},
            {label:"New child note", action:()=>addNote(secId,node.id)},
            {label:"Duplicate",      action:()=>addNote(secId,node.parentId||null,{title:node.title+" (copy)",content:node.content})},
            {divider:true},
            {label:"Delete",danger:true,action:()=>handleDelete(node.id)},
          ]); }}>
          <button onClick={e=>{e.stopPropagation();toggleCollapse(node.id);}}
            style={{width:14,height:14,border:"none",background:"transparent",color:"inherit",fontSize:9,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:children.length?1:0.2}}>
            {children.length?(isOpen?"▾":"▸"):"·"}
          </button>
          <span style={{fontSize:12,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isActive?600:400}}>{node.title||"Untitled"}</span>
          <div className="note-actions">
            <button className="note-act-btn" title="Add sub-note" onClick={e=>{e.stopPropagation();addNote(secId,node.id);}}>+</button>
            <button className="note-act-btn" title="Delete" onClick={e=>{e.stopPropagation();handleDelete(node.id);}}>✕</button>
          </div>
        </div>
        {isOpen&&children.length>0&&<div>{children.map(c=>renderNode(c,depth+1))}</div>}
      </div>
    );
  }
  const roots=noteChildren(items,null);
  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 100px)",minHeight:600,background:"#EBE4D8",borderRadius:14,overflow:"hidden",border:"1px solid #D6CEC3"}}>
      {/* Section tab bar */}
      <div style={{display:"flex",alignItems:"stretch",background:"#1C1714",flexShrink:0,overflowX:"auto",padding:"0 6px"}}>
        {sections.map(s=>{
          const active=secId===s.id;
          return (
            <button key={s.id} onClick={()=>{setSecId(s.id);setSelNoteId(null);setConfirmDel(null);}} style={{padding:"10px 16px",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",background:active?s.color:"transparent",color:active?textFor(s.color):"#7A6C5E",borderBottom:active?`3px solid ${s.color}`:"3px solid transparent",transition:"all 0.15s",flexShrink:0}}>{s.label}</button>
          );
        })}
      </div>
      {/* Body */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:"230px 1fr",minHeight:0}}>
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid #D6CEC3",background:"#EBE4D8"}}>
          {allTags.length>0&&(
            <div style={{padding:"6px 8px",borderBottom:"1px solid #D6CEC3",background:"#E8E1D4",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                {allTags.map(tag=>(
                  <button key={tag} onClick={()=>toggleTagFilter(tag)}
                    style={{padding:"2px 8px",borderRadius:20,border:"1px solid",fontSize:10,fontWeight:600,cursor:"pointer",
                      borderColor:tagFilter.includes(tag)?"#4B3FC7":"#C2B49E",
                      background:tagFilter.includes(tag)?"#4B3FC7":"transparent",
                      color:tagFilter.includes(tag)?"#fff":"#6B5E4E"}}>#{tag}</button>
                ))}
                {tagFilter.length>0&&(
                  <button onClick={()=>setTagMode(m=>m==="OR"?"AND":"OR")}
                    style={{padding:"2px 8px",borderRadius:20,border:"1px solid #C8A86B",fontSize:10,fontWeight:700,cursor:"pointer",background:"#FFF8ED",color:"#8B6A30",marginLeft:"auto"}}>{tagMode}</button>
                )}
              </div>
              {tagFilter.length>0&&<button onClick={()=>setTagFilter([])} style={{fontSize:10,color:"#9B8E80",background:"none",border:"none",cursor:"pointer",padding:"2px 2px 0"}}>clear filter</button>}
            </div>
          )}
          <div style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
            {filteredItems!==null?(
              filteredItems.length===0
                ?<div style={{fontSize:12,color:"#9B8E80",fontStyle:"italic",padding:"12px 8px"}}>No notes match this filter.</div>
                :filteredItems.map(n=>(
                  <div key={n.id} className={"note-row"+(selNoteId===n.id?" active":"")} style={{paddingLeft:8}} onClick={()=>setSelNoteId(n.id)}>
                    <span style={{fontSize:12,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:selNoteId===n.id?600:400}}>{n.title||"Untitled"}</span>
                  </div>
                ))
            ):roots.length===0?<div style={{fontSize:12,color:"#9B8E80",fontStyle:"italic",padding:"12px 8px"}}>No notes yet.</div>:roots.map(n=>renderNode(n,0))}
          </div>
          {confirmDel&&<NoteDeleteOverlay hasChildren={noteDescendants(items,confirmDel).length>0} onConfirm={()=>{deleteNote(secId,confirmDel);setConfirmDel(null);}} onClose={()=>setConfirmDel(null)}/>}
          <div style={{padding:"9px 8px",borderTop:"1px solid #D6CEC3",display:"flex",gap:5,flexShrink:0}}>
            <button onClick={()=>addNote(secId,selNote?.parentId||null)} style={{...S.btnDark,flex:1,background:sec.color,padding:"7px 0",fontSize:11}}>+ Note</button>
            <button onClick={()=>{ if(selNote) addNote(secId,selNote.id); }} style={{...S.btnGhost,padding:"7px 10px",fontSize:11,opacity:selNote?1:0.45}}>+Child</button>
          </div>
        </div>
        <div style={{background:"#FDFAF6",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {selNote
            ? <NoteEditor key={selNote.id} note={selNote} sectionColor={sec.color}
                onTitleChange={t=>updateNoteField(secId,selNote.id,{title:t})}
                onContentChange={ct=>updateNoteField(secId,selNote.id,{content:ct})}
                focusTitle={renameTrigger===selNote.id} onFocusTitleDone={()=>setRenameTrigger(null)}
                tasks={tasks} setView={setView} secId={secId} updateNoteField={updateNoteField} allTags={allTags}/>
            : <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,color:"#9B8E80"}}>
                <div style={{fontSize:28}}>📝</div>
                <div style={{fontSize:14,fontWeight:600,color:"#6B5E4E"}}>No note selected</div>
                <div style={{fontSize:12}}>Create one with + Note, or select one from the sidebar.</div>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Note Editor ──────────────────────────────────────────────────────────────

function NoteEditor({note,sectionColor,onTitleChange,onContentChange,focusTitle,onFocusTitleDone,tasks,setView,secId,updateNoteField,allTags}) {
  const {navigateTo:navTo,navigateToDate}=React.useContext(NavCtx)||{};
  const editorRef    =useRef(null);
  const titleRef     =useRef(null);
  const saveTimer    =useRef(null);
  const titleTimer   =useRef(null);
  const [saved,        setSaved]        =useState(true);
  const [titleVal,     setTitleVal]     =useState(note.title||"");
  const [selColor,     setSelColor]     =useState("#1C1714");
  const [showClr,      setShowClr]      =useState(false);
  const [fmtState,     setFmtState]     =useState({bold:false,italic:false,underline:false});
  const [tagInput,     setTagInput]     =useState("");
  const [showTagInput, setShowTagInput] =useState(false);
  const [remindAt,     setRemindAt]     =useState(note.remindAt||"");
  const [taskSearch,   setTaskSearch]   =useState("");
  const [showTaskPick, setShowTaskPick] =useState(false);
  const [showDatePick, setShowDatePick] =useState(false);
  const [datePickVal,  setDatePickVal]  =useState(todayISO());
  const tags=note.tags||[];
  const filteredTasks=(tasks||[]).filter(t=>t.type!=="spacer"&&t.status!=="done"&&
    !(note.linkedTaskIds||[]).includes(t.id)&&
    (!taskSearch||t.title.toLowerCase().includes(taskSearch.toLowerCase()))
  ).slice(0,10);

  // Load content and resolve any stored image paths via convertFileSrc
  useEffect(()=>{
    if(editorRef.current){
      editorRef.current.innerHTML=note.content||"<p><br></p>";
      editorRef.current.querySelectorAll("img[data-path]").forEach(img=>{
        try{ if(window.__TAURI__?.core?.convertFileSrc) img.src=window.__TAURI__.core.convertFileSrc(img.dataset.path); }catch(e){}
      });
    }
  },[]);
  useEffect(()=>{ if(focusTitle&&titleRef.current){ titleRef.current.focus(); titleRef.current.select(); onFocusTitleDone?.(); } },[focusTitle]);

  // Strip runtime-only state before saving: image srcs (keep data-path), revealed spoiler class
  function getCleanHTML(){
    if(!editorRef.current) return "";
    const clone=editorRef.current.cloneNode(true);
    clone.querySelectorAll("img[data-path]").forEach(img=>img.removeAttribute("src"));
    clone.querySelectorAll(".note-collapse").forEach(el=>el.removeAttribute("data-open"));
    return clone.innerHTML;
  }
  const schedSave=()=>{ setSaved(false); clearTimeout(saveTimer.current); saveTimer.current=setTimeout(()=>{ onContentChange(getCleanHTML()); setSaved(true); },500); };
  const schedTitleSave=v=>{ setSaved(false); clearTimeout(titleTimer.current); titleTimer.current=setTimeout(()=>{ onTitleChange(v); setSaved(true); },400); };
  const refreshFmt=()=>setFmtState({bold:document.queryCommandState("bold"),italic:document.queryCommandState("italic"),underline:document.queryCommandState("underline")});
  const cmd=(command,value=null)=>{ editorRef.current?.focus(); document.execCommand(command,false,value); refreshFmt(); schedSave(); };

  function insertAtCursor(html){ editorRef.current?.focus(); document.execCommand("insertHTML",false,html); schedSave(); }
  function wrapSelection(styleProp,styleVal){
    const sel=window.getSelection(); if(!sel||sel.rangeCount===0||sel.isCollapsed) return;
    const range=sel.getRangeAt(0); const span=document.createElement("span"); span.style[styleProp]=styleVal;
    try{ range.surroundContents(span); }catch{ const frag=range.extractContents(); span.appendChild(frag); range.insertNode(span); }
    sel.removeAllRanges(); schedSave();
  }
  function insertCallout(){
    const sel=window.getSelection(); const text=sel&&!sel.isCollapsed?sel.toString():"";
    if(sel&&!sel.isCollapsed) document.execCommand("delete");
    insertAtCursor('<div class="note-callout">&#x1F4A1; '+(text||"Callout text\u2026")+'</div><p><br></p>');
  }
  function insertCollapse(){
    const sel=window.getSelection(); const text=sel&&!sel.isCollapsed?sel.toString():"";
    if(sel&&!sel.isCollapsed) document.execCommand("delete");
    // Insert a paragraph break first so the block is never mid-line
    document.execCommand("insertParagraph");
    insertAtCursor('<div class="note-collapse" contenteditable="false"><div class="note-collapse-head"><span class="note-collapse-arrow">&#9658;</span><span class="note-collapse-title" contenteditable="true">Section title</span><button class="note-collapse-del" contenteditable="false" title="Remove section">&#xd7;</button></div><div class="note-collapse-body" contenteditable="true">'+(text||"Content here…")+'</div></div><p><br></p>');
  }
  function insertDateChip(date){
    const label=new Date(date+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
    insertAtCursor('<span class="note-date-chip" data-date="'+date+'" contenteditable="false">&#x1F4C5; '+label+'</span> ');
    setShowDatePick(false);
  }
  function insertTaskChip(task){
    const snapshot=task.title.replace(/"/g,"&quot;");
    insertAtCursor('<span class="note-task-chip" data-task-id="'+task.id+'" data-snapshot="'+snapshot+'" contenteditable="false">&#x1F4CC; '+task.title+'</span>\u00a0');
    updateNoteField?.(secId,note.id,{linkedTaskIds:[...(note.linkedTaskIds||[]),task.id]});
    setTaskSearch(""); setShowTaskPick(false);
  }
  async function insertImage(){
    try{
      const path=await window.__TAURI__?.dialog?.open({filters:[{name:"Images",extensions:["png","jpg","jpeg","gif","webp","svg"]}],multiple:false});
      if(!path) return;
      let src=""; try{ src=window.__TAURI__.core.convertFileSrc(path); }catch(e){}
      insertAtCursor('<img data-path="'+path+'" src="'+src+'" class="note-img" alt=""/><p><br></p>');
    }catch(e){}
  }
  function addTag(tag){
    const t=tag.trim().toLowerCase().replace(/\s+/g,"-");
    if(!t||tags.includes(t)) return;
    updateNoteField?.(secId,note.id,{tags:[...tags,t]});
    setTagInput(""); setShowTagInput(false);
  }
  function removeTag(tag){ updateNoteField?.(secId,note.id,{tags:tags.filter(t=>t!==tag)}); }

  const caretToEnd=el=>{ const r=document.createRange(); r.selectNodeContents(el); r.collapse(false); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); };
  const currentLi=()=>{ const sel=window.getSelection(); if(!sel||sel.rangeCount===0) return null; let node=sel.anchorNode; if(node.nodeType===3) node=node.parentElement; return node?.closest("li")||null; };
  const caretAtLineStart=()=>{ const sel=window.getSelection(); if(!sel||sel.rangeCount===0) return false; const range=sel.getRangeAt(0); return range.collapsed&&range.startOffset===0; };
  const handleKeyDown=e=>{
    if(e.key==="Tab"){ e.preventDefault(); const li=currentLi(); if(li){ if(e.shiftKey) cmd("outdent"); else cmd("indent"); requestAnimationFrame(()=>{ const newLi=currentLi(); if(newLi) caretToEnd(newLi); }); } return; }
    if(e.key==="Backspace"){ const li=currentLi(); if(li&&caretAtLineStart()){ const parentUl=li.parentElement; const isNested=parentUl?.parentElement?.tagName==="LI"; if(isNested){ e.preventDefault(); cmd("outdent"); return; } } }
    if(showClr) setShowClr(false);
    if(showTaskPick) setShowTaskPick(false);
  };
  const applyColor=v=>{ setSelColor(v); cmd("foreColor",v); setShowClr(false); };
  const sep=<div style={{width:1,height:18,background:"#D6CEC3",flexShrink:0,margin:"0 2px"}}/>;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Title + tags */}
      <div style={{padding:"16px 24px 0",borderBottom:"1px solid #EBE4D8",flexShrink:0}}>
        <input ref={titleRef} value={titleVal} onChange={e=>{setTitleVal(e.target.value);schedTitleSave(e.target.value);}} onKeyDown={e=>e.key==="Enter"&&e.currentTarget.blur()} placeholder="Note title\u2026"
          style={{...S.input,marginBottom:0,border:"none",background:"transparent",fontSize:17,fontWeight:700,fontFamily:'"Playfair Display",serif',padding:"0 0 8px",borderRadius:0}}/>
        <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",paddingBottom:10,minHeight:28}}>
          {tags.map(tag=>(
            <span key={tag} style={{display:"inline-flex",alignItems:"center",gap:3,background:"#EBE4D8",color:"#4A3F30",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:600}}>
              #{tag}
              <button onClick={()=>removeTag(tag)} style={{background:"none",border:"none",cursor:"pointer",padding:"0 0 0 3px",fontSize:9,color:"#9B8E80",lineHeight:1}}>&#x2715;</button>
            </span>
          ))}
          {showTagInput?(
            <div style={{position:"relative",display:"inline-block"}}>
              <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&tagInput.trim()) addTag(tagInput); if(e.key==="Escape") setShowTagInput(false); }}
                onBlur={e=>{ if(!e.relatedTarget?.classList?.contains("tag-sug-item")){ if(tagInput.trim()) addTag(tagInput); else setShowTagInput(false); } }}
                placeholder="tag-name…" autoFocus
                style={{...S.input,marginBottom:0,width:110,padding:"2px 8px",fontSize:11,display:"inline-block"}}/>
              {(allTags||[]).filter(t=>!tags.includes(t)&&(!tagInput||t.includes(tagInput.toLowerCase()))).length>0&&(
                <div style={{position:"absolute",top:"calc(100% + 3px)",left:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:8,padding:"4px",minWidth:130,boxShadow:"0 4px 14px rgba(0,0,0,0.11)"}}>
                  {(allTags||[]).filter(t=>!tags.includes(t)&&(!tagInput||t.includes(tagInput.toLowerCase()))).map(t=>(
                    <div key={t} className="tag-sug-item" tabIndex={-1}
                      onMouseDown={e=>{e.preventDefault();addTag(t);}}
                      style={{padding:"4px 8px",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,color:"#4A3F30"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      #{t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ):(
            <button onClick={()=>setShowTagInput(true)} style={{...S.btnMicro,fontSize:10,padding:"2px 7px",borderRadius:20,border:"1px dashed #C2B49E",background:"transparent",color:"#9B8E80"}}>+ tag</button>
          )}
        </div>
        {/* Reminder */}
        <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:10}}>
          <span style={{fontSize:11,fontWeight:600,color:note.remindFired?"#1A7A43":"#7A6C5E",flexShrink:0}}>{note.remindFired?"Reminded":"Remind at"}</span>
          <input type="datetime-local" value={remindAt}
            onChange={e=>{ const v=e.target.value||null; setRemindAt(v||""); updateNoteField?.(secId,note.id,{remindAt:v,remindFired:false}); }}
            style={{...S.input,marginBottom:0,flex:1,padding:"3px 8px",fontSize:11,background:note.remindFired?"#EAF7EF":""}}/>
          {remindAt&&<button onClick={()=>{ setRemindAt(""); updateNoteField?.(secId,note.id,{remindAt:null,remindFired:false}); }}
            style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:12,padding:0,flexShrink:0}}>&#xd7;</button>}
        </div>
      </div>
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:3,padding:"7px 12px",background:"#F3EDE3",borderBottom:"1px solid #E3D9CC",flexWrap:"wrap",flexShrink:0}}>
        <select className="tb-sel" defaultValue={EDITOR_FONTS[0].value} onChange={e=>wrapSelection("fontFamily",e.target.value)}>
          {EDITOR_FONTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select className="tb-sel" defaultValue={EDITOR_SIZES[1].value} onChange={e=>wrapSelection("fontSize",e.target.value)}>
          {EDITOR_SIZES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {sep}
        {[["bold","B",{fontWeight:700}],["italic","I",{fontStyle:"italic"}],["underline","U",{textDecoration:"underline"}]].map(([co,l,extra])=>(
          <button key={co} className={`tb-btn${fmtState[co]?" on":""}`} onMouseDown={e=>{e.preventDefault();cmd(co);}} style={extra}>{l}</button>
        ))}
        {sep}
        <button className="tb-btn" onMouseDown={e=>{e.preventDefault();cmd("insertUnorderedList");}} style={{fontSize:13}}>&#x2022;</button>
        {sep}
        <div style={{position:"relative"}}>
          <button className="tb-btn" onMouseDown={e=>{e.preventDefault();setShowClr(v=>!v);}} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:13,fontWeight:700,color:selColor}}>A</span>
            <span style={{display:"block",width:12,height:3,borderRadius:2,background:selColor}}/>
            <span style={{fontSize:8,color:"#9B8E80"}}>&#9662;</span>
          </button>
          {showClr&&(
            <div onMouseDown={e=>e.preventDefault()} style={{position:"absolute",top:"110%",left:0,zIndex:50,background:"#FDFAF6",borderRadius:10,padding:"10px",border:"1px solid #E3D9CC",boxShadow:"0 8px 24px rgba(0,0,0,0.14)",minWidth:220}}>
              <ColorPicker value={selColor} onChange={applyColor} label="Text Colour"/>
            </div>
          )}
        </div>
        {sep}
        <button className="tb-btn" title="Callout box" onMouseDown={e=>{e.preventDefault();insertCallout();}}>Callout</button>
        <button className="tb-btn" title="Collapsible section" onMouseDown={e=>{e.preventDefault();insertCollapse();}}>Collapse</button>
        <div style={{position:"relative"}}>
          <button className="tb-btn" title="Insert date chip" onMouseDown={e=>{e.preventDefault();setShowDatePick(v=>!v);}}>Date</button>
          {showDatePick&&(
            <div onMouseDown={e=>e.preventDefault()} style={{position:"absolute",top:"110%",left:0,zIndex:100,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:"10px",minWidth:200,boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:8}}>Insert Date</div>
              <button onMouseDown={()=>insertDateChip(todayISO())} style={{...S.btnMicro,width:"100%",marginBottom:8,textAlign:"left"}}>Today ({new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})})</button>
              <input type="date" value={datePickVal} onChange={e=>setDatePickVal(e.target.value)}
                style={{...S.input,marginBottom:8,padding:"4px 8px",fontSize:11}}/>
              <button onMouseDown={()=>insertDateChip(datePickVal)} style={{...S.btnDark,width:"100%",fontSize:12,padding:"5px 0"}}>Insert</button>
            </div>
          )}
        </div>
        {sep}
        <div style={{position:"relative"}}>
          <button className="tb-btn" title="Link a task" onMouseDown={e=>{e.preventDefault();setShowTaskPick(v=>!v);}}>Task</button>
          {showTaskPick&&(
            <div onMouseDown={e=>e.preventDefault()} style={{position:"absolute",top:"110%",left:0,zIndex:100,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:230,maxHeight:230,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
              <input value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} placeholder="Search tasks\u2026"
                style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}}/>
              {filteredTasks.length===0&&<div style={{fontSize:11,color:"#9B8E80",padding:"4px 2px"}}>No tasks found.</div>}
              {filteredTasks.map(t=>(
                <div key={t.id} onMouseDown={()=>insertTaskChip(t)}
                  style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer",color:"#1C1714",display:"flex",alignItems:"center",gap:6}}
                  onMouseEnter={e=>e.currentTarget.style.background="#EBE4D8"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:10,background:"#EBE4D8",borderRadius:4,padding:"1px 5px",color:"#6B5E4E",flexShrink:0}}>{t.status}</span>
                  <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="tb-btn" title="Insert image (file reference)" onMouseDown={e=>{e.preventDefault();insertImage();}}>Image</button>
        {sep}
        <button className="tb-btn" onMouseDown={e=>{e.preventDefault();cmd("removeFormat");}} style={{fontSize:11,color:"#9B8E80"}}>&#x2715; fmt</button>
        <div style={{marginLeft:"auto",fontSize:11,color:saved?"#1A7A43":"#9B8E80",fontWeight:500}}>{saved?"\u2713 Saved":"Saving\u2026"}</div>
      </div>
      {/* Content */}
      <div ref={editorRef} className="note-editor" contentEditable suppressContentEditableWarning
        onInput={schedSave} onKeyDown={handleKeyDown} onKeyUp={refreshFmt} onMouseUp={refreshFmt}
        onClick={e=>{
          setShowClr(false); setShowTaskPick(false); setShowDatePick(false);
          if(e.target.classList.contains("note-collapse-del")){
            const col=e.target.closest(".note-collapse"); if(col){col.remove();schedSave();} return;
          }
          const head=e.target.closest(".note-collapse-head");
          if(head){ const col=head.closest(".note-collapse"); if(col) col.toggleAttribute("data-open"); return; }
          const dateChip=e.target.closest(".note-date-chip");
          if(dateChip&&dateChip.dataset.date){ navigateToDate?.(dateChip.dataset.date); return; }
          const taskChip=e.target.closest(".note-task-chip");
          if(taskChip&&taskChip.dataset.taskId){ navTo?.({type:"task",id:taskChip.dataset.taskId}); return; }
        }}
        style={{flex:1,padding:"20px 24px",fontFamily:'"DM Sans",sans-serif',fontSize:13,color:"#1C1714",lineHeight:1.65,overflowY:"auto",outline:"none"}}/>
      <div style={{padding:"6px 24px",background:"#F8F3EC",borderTop:"1px solid #EBE4D8",fontSize:11,color:"#C2B49E",display:"flex",gap:16,flexShrink:0}}>
        <span>Tab \u2014 indent bullet</span><span>Shift+Tab \u2014 outdent</span><span>Backspace at line start \u2014 outdent nested</span>
      </div>
    </div>
  );
}

// ─── Monthly View ─────────────────────────────────────────────────────────────

function MonthlyView({tasks,sections,byId,initialMode="calendar"}) {
  const {navigateTo,navigateToDate}=React.useContext(NavCtx)||{};
  const [mode,    setMode]    = useState(initialMode);
  const nowMK     = monthKeyOf(Date.now());
  const [calMonth,setCalMonth]= useState(nowMK);
  const todayStr  = todayISO();

  function calDays(mk){
    const [y,m]=mk.split("-").map(Number);
    const first=new Date(y,m-1,1), last=new Date(y,m,0);
    const startDow=(first.getDay()+6)%7;
    const cells=[];
    for(let i=0;i<startDow;i++) cells.push(null);
    for(let d=1;d<=last.getDate();d++) cells.push(`${mk}-${String(d).padStart(2,"0")}`);
    while(cells.length%7!==0) cells.push(null);
    return cells;
  }
  function prevMk(mk){ const [y,m]=mk.split("-").map(Number); return m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,"0")}`; }
  function nextMk(mk){ const [y,m]=mk.split("-").map(Number); return m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,"0")}`; }

  const calTasks=tasks.filter(t=>t.dueDate&&t.type!=="spacer");
  const byDate={};
  calTasks.forEach(t=>{ if(!byDate[t.dueDate]) byDate[t.dueDate]=[]; byDate[t.dueDate].push(t); });

  const allMonths=[...new Set(tasks.filter(t=>t.monthCompleted).map(t=>t.monthCompleted))].sort().reverse();
  if(!allMonths.includes(nowMK)) allMonths.unshift(nowMK);
  const [logSel,setLogSel]=useState(nowMK);
  const done=tasks.filter(t=>t.status==="done"&&t.monthCompleted===logSel&&t.type!=="spacer");
  const bySec={};
  for(const t of done){if(!bySec[t.sectionId])bySec[t.sectionId]=[];bySec[t.sectionId].push(t);}

  const WDAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const cells=calDays(calMonth);

  return (
    <div>
      {mode==="calendar"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <button onClick={()=>setCalMonth(prevMk(calMonth))} style={{...S.btnGhost,padding:"5px 12px"}}>&#x2039;</button>
            <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,flex:1,textAlign:"center"}}>{fmtMonth(calMonth)}</h2>
            <button onClick={()=>setCalMonth(nextMk(calMonth))} style={{...S.btnGhost,padding:"5px 12px"}}>&#x203A;</button>
            <button onClick={()=>setCalMonth(nowMK)} style={{...S.btnGhost,fontSize:11,padding:"5px 12px"}}>Today</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
            {WDAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#9B8E80",letterSpacing:"0.5px",textTransform:"uppercase",padding:"4px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {cells.map((iso,i)=>{
              if(!iso) return <div key={i} style={{minHeight:80}}/>;
              const dayTasks=byDate[iso]||[];
              const isToday=iso===todayStr;
              const [,,d]=iso.split("-");
              const active=dayTasks.filter(t=>t.status!=="done");
              const comp=dayTasks.filter(t=>t.status==="done");
              return (
                <div key={iso} style={{minHeight:80,borderRadius:7,background:isToday?"#FFF8ED":"#EBE4D8",
                  border:isToday?"2px solid #C8A86B":"2px solid transparent",padding:"5px 6px"}}>
                  <div onClick={()=>navigateToDate?.(iso)}
                    style={{fontSize:11,fontWeight:isToday?700:500,color:isToday?"#8B6A30":"#7A6C5E",marginBottom:4,textAlign:"right",cursor:"pointer",textDecoration:"underline dotted"}}>{parseInt(d)}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    {active.map(t=>{ const sec=byId[t.sectionId]||{color:"#9B8E80"}; return (
                      <div key={t.id} onClick={e=>{e.stopPropagation();navigateTo?.({type:"task",id:t.id});}}
                        style={{fontSize:10,padding:"2px 5px",borderRadius:4,background:sec.color,color:textFor(sec.color),
                          cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>
                        {t.title}
                      </div>
                    );})}
                    {comp.map(t=>{ const sec=byId[t.sectionId]||{color:"#9B8E80"}; return (
                      <div key={t.id} onClick={e=>{e.stopPropagation();navigateTo?.({type:"task",id:t.id});}}
                        style={{fontSize:10,padding:"2px 5px",borderRadius:4,background:"#D4F0E0",color:"#1A7A43",
                          cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:"line-through",opacity:0.75}}>
                        {t.title}
                      </div>
                    );})}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:12,marginTop:14,fontSize:11,color:"#9B8E80"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:"#4B3FC7"}}/> Active</div>
            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:"#D4F0E0",border:"1px solid #1A7A43"}}/> Completed</div>
          </div>
        </div>
      )}

      {mode==="log"&&(
        <div>
          <div style={{display:"flex",gap:6,marginBottom:28,flexWrap:"wrap"}}>
            {allMonths.map(m=>(
              <button key={m} onClick={()=>setLogSel(m)} style={{padding:"6px 16px",borderRadius:20,border:"1.5px solid",fontSize:12,fontWeight:600,transition:"all 0.15s",borderColor:logSel===m?"#1C1714":"#D6CEC3",background:logSel===m?"#1C1714":"transparent",color:logSel===m?"#F8F3EC":"#6B5E4E"}}>{fmtMonth(m)}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:20,alignItems:"baseline",marginBottom:26,paddingBottom:20,borderBottom:"2px solid #E3D9CC"}}>
            <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700}}>{fmtMonth(logSel)}</h2>
            <span style={{fontSize:13,color:"#9B8E80"}}><strong style={{color:"#1C1714",fontSize:20}}>{done.length}</strong> tasks</span>
          </div>
          {done.length===0&&<Empty icon="&#x1F4C5;" text="Nothing completed yet this month." sub="Mark tasks as done in Taskboards to see them here."/>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
            {Object.entries(bySec).map(([sid,ts])=>{
              const sec=byId[sid]||{label:sid,color:"#9B8E80"};
              return (
                <div key={sid} style={{background:"#EBE4D8",borderRadius:12,padding:"14px 16px",borderTop:`3px solid ${sec.color}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{fontWeight:700,fontSize:13}}>{sec.label}</span>
                    <span style={{marginLeft:"auto",background:sec.color,color:textFor(sec.color),borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>{ts.length}</span>
                  </div>
                  <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:6}}>
                    {ts.map(t=>(
                      <li key={t.id} onClick={()=>navigateTo?.({type:"task",id:t.id})}
                        style={{display:"flex",gap:8,alignItems:"flex-start",cursor:"pointer"}}>
                        <span style={{color:sec.color,fontSize:10,marginTop:3,flexShrink:0,fontWeight:700}}>&#x2713;</span>
                        <span style={{fontSize:12,color:"#6B5E4E",textDecoration:"line-through",lineHeight:1.4}}>{t.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Trackers View ────────────────────────────────────────────────────────────

function TrackersView({trackers,addTracker,updateTracker,deleteTracker,toggleTrackerDay,archiveTracker,sections,byId,tasks,notes,addTask,addNote,linkTrackerToTask,unlinkTrackerFromTask,linkTrackerToNote,unlinkTrackerFromNote}) {
  const {navigateToFresh}=React.useContext(NavCtx)||{};
  const {openCtx}=React.useContext(CtxMenuCtx)||{};
  const [selId,setSelId]=useState(null);
  const [showCreate,setShowCreate]=useState(false);
  const [editId,setEditId]=useState(null);
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
      cells.push({day:d,iso,active:trk.activeDays[di],done:trk.completions[iso]});
    }
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
              <div key={c.iso} onClick={()=>{if(c.active) toggleTrackerDay(trk.id,c.iso);}}
                style={{width:"100%",aspectRatio:"1",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,fontWeight:isToday?700:500,cursor:c.active?"pointer":"default",
                  background:c.done?trk.color+"30":c.active?"#F8F3EC":"#EBE4D8",
                  color:c.done?trk.color:c.active?"#4A3F30":"#C8BEB0",
                  border:isToday?"2px solid "+trk.color:"1px solid transparent"}}>
                {c.day}
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
    const isActiveToday=trk.activeDays[todayDi];
    const doneToday=trk.completions[today];
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
          <div style={{fontSize:10,color:"#9B8E80"}}>{DAYS.filter((_,i)=>trk.activeDays[i]).map(d=>d.slice(0,3)).join(", ")}</div>
        </div>
        {isActiveToday&&(
          <div onClick={e=>{e.stopPropagation();toggleTrackerDay(trk.id,today);}}
            style={{width:20,height:20,borderRadius:5,border:"2px solid "+trk.color,
              background:doneToday?trk.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
              color:"#fff",fontSize:11,fontWeight:700,flexShrink:0,cursor:"pointer"}}>
            {doneToday?"\u2713":""}
          </div>
        )}
        {streak>0&&<span style={{fontSize:10,fontWeight:600,color:trk.color,flexShrink:0}}>{streak}d</span>}
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
    </div>
  );
}

function TrackerCreateModal({sections,tracker,onSave,onClose}) {
  const [title,setTitle]=useState(tracker?.title||"");
  const [secId,setSecId]=useState(tracker?.sectionId||"");
  const [color,setColor]=useState(tracker?.color||"#0C7B7B");
  const [days,setDays]=useState(tracker?.activeDays||[1,1,1,1,1,0,0]);
  const titleRef=useRef(null);
  useEffect(()=>{setTimeout(()=>titleRef.current?.focus(),60);},[]);

  function toggleDay(i){ setDays(d=>{const n=[...d];n[i]=n[i]?0:1;return n;}); }

  function handleSave(){
    if(!title.trim()) return;
    onSave({title:title.trim(),sectionId:secId||null,color,activeDays:days});
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
          placeholder="e.g. Exercise, Reading, Meditation..."
          style={{...S.input,marginBottom:0}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Section (optional)</label>
        <select value={secId} onChange={e=>setSecId(e.target.value)} style={{...S.input,marginBottom:0}}>
          <option value="">None (Independent)</option>
          {sections.filter(s=>s.id!=="overhead").map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div style={{marginBottom:12}}>
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
      </div>
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

// ─── Stats View ───────────────────────────────────────────────────────────────

function StatsView({tasks,tt,week,sections,byId,notes,trackers}) {
  const [archivedTtCount,setArchivedTtCount]=React.useState(0);
  React.useEffect(()=>{
    sget("py-tt-archive").then(arch=>{
      if(arch&&typeof arch==="object") setArchivedTtCount(Object.keys(arch).length);
    });
  },[]);
  const wBlocks=tt[week]||{};
  const secMins={};
  let totalMins=0;
  for(const day of DAYS){
    for(const blk of (wBlocks[day]||[])){
      if(blk.type==="break"||!blk.sectionId) continue;
      const m=blockMins(blk); secMins[blk.sectionId]=(secMins[blk.sectionId]||0)+m; totalMins+=m;
    }
  }
  const weekStart=new Date(week+"T00:00:00"),weekEnd=new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+7);
  const allActive  =tasks.filter(t=>t.type!=="spacer"&&t.status==="this-week");
  const completedTW=tasks.filter(t=>t.type!=="spacer"&&t.completedAt&&new Date(t.completedAt)>=weekStart&&new Date(t.completedAt)<weekEnd);
  const backlogAll =tasks.filter(t=>t.type!=="spacer"&&t.status==="backlog").length;
  const boardSecs  =sections.filter(s=>s.id!=="overhead");
  // Completion rate: tasks completed this week vs tasks created this week still active.
  // Filters out stale "this-week" tasks from older weeks that were never resolved.
  const activeCreatedThisWeek=allActive.filter(t=>t.createdAt&&new Date(t.createdAt)>=weekStart&&new Date(t.createdAt)<weekEnd);
  const compRate=completedTW.length+activeCreatedThisWeek.length>0?Math.round(completedTW.length/(completedTW.length+activeCreatedThisWeek.length)*100):null;
  return (
    <div>
      <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:24,fontWeight:700,marginBottom:4}}>Weekly Stats</h2>
      <p style={{fontSize:13,color:"#9B8E80",marginBottom:28}}>{weekLabel(week)}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[[(totalMins/60).toFixed(1)+"h","Scheduled","this week"],[allActive.length,"In Progress","this-week tasks"],[completedTW.length,"Completed","this week"],[backlogAll,"Backlog","tasks pending"]].map(([v,l,s],i)=>(
          <div key={i} style={{background:"#EBE4D8",borderRadius:12,padding:"18px 20px"}}>
            <div style={{fontSize:30,fontWeight:700,fontFamily:'"Playfair Display",serif'}}>{v}</div>
            <div style={{fontSize:13,fontWeight:600,color:"#4A3F30",marginTop:2}}>{l}</div>
            <div style={{fontSize:11,color:"#9B8E80",marginTop:2}}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{background:"#EBE4D8",borderRadius:14,padding:"20px 22px"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#4A3F30",marginBottom:18}}>⏱ Time Allocation This Week</div>
          {Object.keys(secMins).length===0?<p style={{fontSize:12,color:"#9B8E80",fontStyle:"italic"}}>No blocks scheduled yet.</p>:(
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              {Object.entries(secMins).sort((a,b)=>b[1]-a[1]).map(([sid,mins])=>{
                const sec=byId[sid]||{color:"#9B8E80",label:sid}; const pct=Math.round(mins/totalMins*100);
                return (
                  <div key={sid}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:12,fontWeight:600}}>{sec.label}</span>
                      <span style={{fontSize:11,color:"#9B8E80"}}>{(mins/60).toFixed(1)}h · {pct}%</span>
                    </div>
                    <div style={{height:9,background:"#D4C9B4",borderRadius:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:sec.color,borderRadius:5}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{background:"#EBE4D8",borderRadius:14,padding:"20px 22px"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#4A3F30",marginBottom:18}}>📋 Task Status by Section</div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {boardSecs.map(sec=>{
              const st=tasks.filter(t=>t.sectionId===sec.id&&t.type!=="spacer");
              const tw=st.filter(t=>t.status==="this-week").length;
              const bl=st.filter(t=>t.status==="backlog").length;
              const done=completedTW.filter(t=>t.sectionId===sec.id).length;
              if(bl+tw+done===0) return null;
              return (
                <div key={sec.id} style={{display:"flex",alignItems:"center",gap:10}}>
                  <Dot color={sec.color} size={9}/>
                  <span style={{fontSize:12,fontWeight:600,flex:1}}>{sec.label}</span>
                  <div style={{display:"flex",gap:4}}>
                    {tw>0  &&<Badge bg="#E6E3F5" fg="#4B3FC7">{tw} active</Badge>}
                    {done>0&&<Badge bg="#D4F0E0" fg="#1A7A43">{done} done</Badge>}
                    {bl>0  &&<Badge bg="#E8E0D4" fg="#9B8E80">{bl} backlog</Badge>}
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
          {compRate!==null&&(
            <div style={{marginTop:22,paddingTop:16,borderTop:"1px solid #D4C9B4"}}>
              <Cap>Weekly Completion Rate</Cap>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1,height:12,background:"#D4C9B4",borderRadius:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${compRate}%`,background:"linear-gradient(90deg,#1A7A43,#4B3FC7)",borderRadius:6}}/>
                </div>
                <span style={{fontSize:16,fontWeight:700,flexShrink:0}}>{compRate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ── Data Age & Overview ── */}
      {(()=>{
        const realTasks=tasks.filter(t=>t.type!=="spacer");
        const totalTasks=realTasks.length;
        const activeTCount=realTasks.filter(t=>t.status!=="done"&&!t.archived).length;
        const doneCount=realTasks.filter(t=>t.status==="done"&&!t.archived).length;
        const archivedCount=realTasks.filter(t=>t.archived).length;
        const allNotes=Object.values(notes||{}).flat();
        const totalNotes=allNotes.length;
        const ttWeeks=Object.keys(tt||{}).filter(wk=>{const w=tt[wk];return w&&DAYS.some(d=>(w[d]||[]).length>0);});
        const ttWeekCount=ttWeeks.length;
        const taskDates=realTasks.filter(t=>t.createdAt).map(t=>t.createdAt);
        const noteDates=allNotes.filter(n=>n.createdAt).map(n=>n.createdAt);
        const allDates=[...taskDates,...noteDates];
        const oldestDate=allDates.length>0?Math.min(...allDates):null;
        const newestDate=allDates.length>0?Math.max(...allDates):null;
        const fmtDate=ts=>ts?new Date(ts).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"N/A";
        const daysSince=ts=>ts?Math.floor((Date.now()-ts)/(1000*60*60*24)):0;
        const oldestTtWeek=ttWeeks.length>0?ttWeeks.sort()[0]:null;
        const newestTtWeek=ttWeeks.length>0?ttWeeks.sort().reverse()[0]:null;
        // Per-section breakdown
        const secStats=boardSecs.map(sec=>{
          const st=realTasks.filter(t=>t.sectionId===sec.id);
          const sn=(notes||{})[sec.id]||[];
          const oldest=st.filter(t=>t.createdAt).map(t=>t.createdAt);
          return{sec,tasks:st.length,notes:sn.length,oldest:oldest.length>0?Math.min(...oldest):null,
            active:st.filter(t=>t.status!=="done"&&!t.archived).length,
            archived:st.filter(t=>t.archived).length};
        }).filter(s=>s.tasks>0||s.notes>0);
        return (
          <div style={{marginTop:20,background:"#EBE4D8",borderRadius:14,padding:"20px 22px"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#4A3F30",marginBottom:18}}>&#x1F4CA; Data Overview</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
              {[[totalTasks,"Total Tasks",activeTCount+" active, "+doneCount+" done"+(archivedCount>0?", "+archivedCount+" archived":"")],
                [totalNotes,"Notes","across "+Object.keys(notes||{}).length+" sections"],
                [ttWeekCount+(archivedTtCount>0?" (+"+archivedTtCount+" archived)":""),"Timetable Weeks",oldestTtWeek&&newestTtWeek?oldestTtWeek+" to "+newestTtWeek:"no data"]
              ].map(([v,l,s],i)=>(
                <div key={i} style={{background:"#FDFAF6",borderRadius:10,padding:"14px 16px",border:"1px solid #E3D9CC"}}>
                  <div style={{fontSize:22,fontWeight:700,fontFamily:'"Playfair Display",serif'}}>{v}</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#4A3F30",marginTop:2}}>{l}</div>
                  <div style={{fontSize:10,color:"#9B8E80",marginTop:2}}>{s}</div>
                </div>
              ))}
            </div>
            {oldestDate&&(
              <div style={{display:"flex",gap:16,marginBottom:18,padding:"12px 14px",background:"#FDFAF6",borderRadius:10,border:"1px solid #E3D9CC"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:4}}>First Entry</div>
                  <div style={{fontSize:13,fontWeight:600}}>{fmtDate(oldestDate)}</div>
                  <div style={{fontSize:11,color:"#9B8E80"}}>{daysSince(oldestDate)} days ago</div>
                </div>
                <div style={{width:1,background:"#E3D9CC"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:4}}>Latest Entry</div>
                  <div style={{fontSize:13,fontWeight:600}}>{fmtDate(newestDate)}</div>
                  <div style={{fontSize:11,color:"#9B8E80"}}>{daysSince(newestDate)===0?"today":daysSince(newestDate)+" days ago"}</div>
                </div>
              </div>
            )}
            {secStats.length>0&&(
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:10}}>Per Section</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {secStats.map(s=>(
                    <div key={s.sec.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#FDFAF6",borderRadius:8,border:"1px solid #E3D9CC"}}>
                      <Dot color={s.sec.color} size={9}/>
                      <span style={{fontSize:12,fontWeight:600,flex:1}}>{s.sec.label}</span>
                      <div style={{display:"flex",gap:4}}>
                        <Badge bg="#E6E3F5" fg="#4B3FC7">{s.tasks} tasks</Badge>
                        <Badge bg="#E3F0FB" fg="#2A6FAD">{s.notes} notes</Badge>
                        {s.archived>0&&<Badge bg="#EBE4D8" fg="#9B8E80">{s.archived} archived</Badge>}
                      </div>
                      {s.oldest&&<span style={{fontSize:10,color:"#9B8E80",flexShrink:0}}>{fmtDate(s.oldest)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tracker Consistency */}
      {(()=>{
        const activeTrackers=(trackers||[]).filter(t=>!t.archived);
        if(activeTrackers.length===0) return null;
        const thisWeekDates=DAYS.map(function(_,i){ return addDays(week,i); });
        const trkStats=activeTrackers.map(function(trk){
          const expected=thisWeekDates.filter(function(_,i){ return trk.activeDays[i]; }).length;
          const completed=thisWeekDates.filter(function(d,i){ return trk.activeDays[i]&&trk.completions[d]; }).length;
          const rate=expected>0?Math.round(completed/expected*100):0;
          const streak=trackerStreak(trk);
          return{trk:trk,expected:expected,completed:completed,rate:rate,streak:streak};
        });
        return (
          <div style={{marginTop:20,background:"#EBE4D8",borderRadius:14,padding:"20px 22px"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#4A3F30",marginBottom:16}}>&#x1F4CA; Tracker Consistency</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {trkStats.map(function(s){
                return (
                  <div key={s.trk.id} style={{background:"#FDFAF6",borderRadius:10,padding:"12px 14px",border:"1px solid #E3D9CC"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{width:10,height:10,borderRadius:3,background:s.trk.color}}/>
                      <span style={{fontSize:13,fontWeight:600,flex:1}}>{s.trk.title}</span>
                      <span style={{fontSize:11,fontWeight:700,color:s.rate>=80?"#1A7A43":s.rate>=50?"#B05A12":"#C43A3A"}}>{s.rate}%</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:"#E3D9CC",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:3,background:s.trk.color,width:s.rate+"%",transition:"width 0.3s"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                      <span style={{fontSize:10,color:"#9B8E80"}}>{s.completed}/{s.expected} this week</span>
                      {s.streak>0&&<span style={{fontSize:10,fontWeight:600,color:s.trk.color}}>{s.streak}d streak</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({sections,setSections,onClose,checkForUpdate,tasks,setTasks,notes,setNotes,tt,setTt,trackers,setTrackers}) {
  const [tab,        setTab]      = useState("sections");
  const [local,      setLocal]    = useState(sections.map(s=>({...s})));
  const [newLabel,   setNewLabel] = useState("");
  const [newColor,   setNewColor] = useState("#2A7A8A");
  const [appVer,     setAppVer]   = useState(null);
  const [checkState, setCheckState] = useState(null);
  const [delOverlay, setDelOverlay] = useState(null); // {secId, secLabel, secColor}
  const [backupHrs,  setBackupHrs]  = useState(DEFAULT_BACKUP_HOURS);
  const [backupSaved,setBackupSaved]= useState(false);

  useEffect(()=>{
    try {
      window.__TAURI__.app.getVersion()
        .then(v=>setAppVer(v))
        .catch(()=>setAppVer(null));
    } catch { setAppVer(null); }
    getBackupInterval().then(v=>setBackupHrs(v));
  },[]);

  function save()       { setSections(local); onClose(); }
  function upd(id,u)    { setLocal(l=>l.map(s=>s.id===id?{...s,...u}:s)); }
  function addSection() { if(!newLabel.trim()) return; setLocal(l=>[...l,{id:uid(),label:newLabel.trim(),color:newColor}]); setNewLabel(""); setNewColor("#2A7A8A"); }

  function requestRemove(s) {
    // Count children
    const taskCount = tasks.filter(t=>t.sectionId===s.id&&t.type!=="spacer").length;
    const noteCount = (notes[s.id]||[]).length;
    let blockCount = 0;
    for (const wk of Object.values(tt)) {
      for (const dayArr of Object.values(wk)) {
        blockCount += (dayArr||[]).filter(b=>b.sectionId===s.id).length;
      }
    }
    setDelOverlay({ secId:s.id, secLabel:s.label, secColor:s.color, taskCount, noteCount, blockCount });
  }

  function executeRemoval(action, targetSecId) {
    // action: "delete" | "migrate"
    const sid = delOverlay.secId;
    if (action === "delete") {
      // Delete all child items
      setTasks(prev=>prev.filter(t=>t.sectionId!==sid));
      setNotes(prev=>{ const next={...prev}; delete next[sid]; return next; });
      setTrackers(prev=>prev.filter(t=>t.sectionId!==sid));
      setTt(prev=>{
        const next={};
        for (const [wk,week] of Object.entries(prev)) {
          next[wk]={};
          for (const [day,arr] of Object.entries(week)) {
            next[wk][day]=(arr||[]).filter(b=>b.sectionId!==sid);
          }
        }
        return next;
      });
    } else if (action === "migrate" && targetSecId) {
      // Move tasks to target section
      setTasks(prev=>prev.map(t=>t.sectionId===sid?{...t,sectionId:targetSecId}:t));
      // Move notes to target section
      setNotes(prev=>{
        const orphaned = prev[sid] || [];
        if (orphaned.length === 0) { const next={...prev}; delete next[sid]; return next; }
        const existing = prev[targetSecId] || [];
        const maxOrder = existing.length ? Math.max(...existing.map(n=>n.order||0)) + 1 : 0;
        const migrated = orphaned.map((n, i) => ({...n, order: maxOrder + i}));
        const next = {...prev, [targetSecId]: [...existing, ...migrated]};
        delete next[sid];
        return next;
      });
      // Move blocks to target section
      setTt(prev=>{
        const next={};
        for (const [wk,week] of Object.entries(prev)) {
          next[wk]={};
          for (const [day,arr] of Object.entries(week)) {
            next[wk][day]=(arr||[]).map(b=>b.sectionId===sid?{...b,sectionId:targetSecId}:b);
          }
        }
        return next;
      });
      // Move trackers to target section
      setTrackers(prev=>prev.map(t=>t.sectionId===sid?{...t,sectionId:targetSecId}:t));
    }
    // Remove from local sections list
    setLocal(l=>l.filter(s=>s.id!==sid));
    setDelOverlay(null);
  }

  async function saveBackupInterval() {
    await setBackupInterval(backupHrs);
    setBackupSaved(true);
    setTimeout(()=>setBackupSaved(false), 2000);
  }

  const TABS=[["sections","Sections"],["app","App"]];
  const INTERVAL_PRESETS = [
    {label:"1 hour",  value:1},
    {label:"6 hours", value:6},
    {label:"12 hours",value:12},
    {label:"1 day",   value:24},
    {label:"3 days",  value:72},
    {label:"7 days",  value:168},
  ];

  return (
    <Overlay onClose={onClose} width={560}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:'"Playfair Display",serif',fontSize:20,fontWeight:700}}>Settings</div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:2,background:"#EBE4D8",borderRadius:9,padding:3,marginBottom:22,width:"fit-content"}}>
        {TABS.map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{padding:"5px 18px",borderRadius:7,border:"none",fontSize:12,fontWeight:600,background:tab===key?"#FDFAF6":"transparent",color:tab===key?"#1C1714":"#7A6C5E",boxShadow:tab===key?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}}>{label}</button>
        ))}
      </div>

      {/* ── Sections tab */}
      {tab==="sections"&&(<>
        <p style={{fontSize:12,color:"#9B8E80",marginBottom:18,lineHeight:1.5}}>Add, rename, or recolour sections. Removing a section lets you choose what happens to its tasks, notes, and timetable blocks.</p>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:22}}>
          {local.map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,background:"#F3EDE3",borderRadius:10,padding:"10px 12px"}}>
              <div style={{minWidth:220}}><ColorPicker value={s.color} onChange={v=>upd(s.id,{color:v})}/></div>
              <input value={s.label} onChange={e=>upd(s.id,{label:e.target.value})} style={{...S.input,marginBottom:0,flex:1,padding:"6px 10px"}}/>
              <button onClick={()=>requestRemove(s)} style={{...S.btnMicro,background:"#FAE0E0",color:"#C43A3A",flexShrink:0}}
                disabled={local.length<=1} title={local.length<=1?"Cannot remove the last section":""}>&#x2715;</button>
            </div>
          ))}
        </div>
        <div style={{background:"#EBE4D8",borderRadius:12,padding:"16px",marginBottom:22}}>
          <Cap>Add New Section</Cap>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Section name…" style={{...S.input,marginBottom:0,flex:1}} onKeyDown={e=>e.key==="Enter"&&addSection()}/>
            <button onClick={addSection} style={{...S.btnDark,flexShrink:0}}>Add</button>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} label="Colour"/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={save} style={S.btnDark}>Save Changes</button>
          <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        </div>
      </>)}

      {/* ── App tab */}
      {tab==="app"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <AutostartToggle/>

          {/* Backup interval */}
          <div style={{background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC",padding:"12px 14px"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#1C1714",marginBottom:10}}>Automatic Backup</div>
            <p style={{fontSize:11,color:"#6B5E4E",lineHeight:1.5,marginBottom:10}}>
              Your data is automatically backed up at the chosen interval. Backups are stored locally alongside your data (10 most recent kept).
            </p>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
              {INTERVAL_PRESETS.map(p=>(
                <button key={p.value} onClick={()=>setBackupHrs(p.value)}
                  style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,
                    border:`1.5px solid ${backupHrs===p.value?"#4B3FC7":"#D6CEC3"}`,
                    background:backupHrs===p.value?"#E6E3F5":"transparent",
                    color:backupHrs===p.value?"#4B3FC7":"#6B5E4E"}}>{p.label}</button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={saveBackupInterval}
                style={{...S.btnDark,fontSize:11,padding:"5px 14px"}}>{backupSaved?"Saved ✓":"Save Interval"}</button>
              <button onClick={async()=>{ await runBackupIfDue(true); }}
                style={{...S.btnGhost,fontSize:11,padding:"5px 14px"}}>Backup Now</button>
            </div>
          </div>

          {/* Update checker */}
          <div style={{background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC",padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{fontSize:12,fontWeight:600,color:"#1C1714"}}>Software Update</div>
              <button
                onClick={async()=>{
                  setCheckState("checking");
                  await checkForUpdate(r=>setCheckState(r));
                }}
                disabled={checkState==="checking" || !checkForUpdate}
                style={{...S.btnDark,fontSize:11,padding:"5px 14px",flexShrink:0}}
              >{checkState==="checking" ? "Checking…" : "Check for Updates"}</button>
            </div>
            {checkState && checkState !== "checking" && (
              <div style={{marginTop:10,fontSize:11,lineHeight:1.5,padding:"8px 10px",borderRadius:7,
                background: checkState.status==="error"   ? "#FAE0E0"
                          : checkState.status==="available"? "#D4F0E0"
                          : "#EBE4D8",
                color:      checkState.status==="error"   ? "#C43A3A"
                          : checkState.status==="available"? "#1A7A43"
                          : "#6B5E4E"
              }}>
                {checkState.status==="latest"    && "\u2713  You're on the latest version."}
                {checkState.status==="skipped"   && "Update available but marked as skipped. Clear the skipped version to see it again."}
                {checkState.status==="available" && "\u2B06  v" + checkState.version + " is available \u2014 check for the update dialog."}
                {checkState.status==="error"     && "Error: " + checkState.message}
              </div>
            )}
          </div>

          {/* Load demo data */}
          <div style={{background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC",padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#1C1714"}}>Demo Data</div>
                <div style={{fontSize:11,color:"#6B5E4E",marginTop:2}}>Load sample tasks, notes, trackers, and timetable blocks to explore features.</div>
              </div>
              <button onClick={function(){
                try {
                  var seed = buildSeedData();
                  setSections(DEFAULT_SECTIONS.map(function(s){ return Object.assign({},s); }));
                  setTasks(seed.tasks);
                  setNotes(seed.notes);
                  setTrackers(seed.trackers);
                  setTt(seed.tt);
                  onClose();
                } catch(e) { console.error("Seed data error:", e); }
              }} style={{...S.btnGhost,fontSize:11,padding:"5px 14px",flexShrink:0}}>Load Demo</button>
            </div>
          </div>

          <div style={{textAlign:"center",color:"#C2B49E",fontSize:11}}>
            {appVer ? "Progress You  \u00B7  v" + appVer : "Progress You  \u00B7  Dev build"}
          </div>
        </div>
      )}

      {/* Section Delete Overlay */}
      {delOverlay && <SectionDeleteOverlay
        secLabel={delOverlay.secLabel} secColor={delOverlay.secColor}
        taskCount={delOverlay.taskCount} noteCount={delOverlay.noteCount} blockCount={delOverlay.blockCount}
        otherSections={local.filter(s=>s.id!==delOverlay.secId)}
        onDelete={()=>executeRemoval("delete")}
        onMigrate={(targetId)=>executeRemoval("migrate",targetId)}
        onClose={()=>setDelOverlay(null)}/>}
    </Overlay>
  );
}
