// ─── Today View ───────────────────────────────────────────────────────────────

function TodayView({getDayBlocks,sections,byId,tasks,updateTask,completeTask,onOpenCapture,trackers,toggleTrackerDay}) {
  const dayName  = todayName();
  const blocks   = getDayBlocks(dayName);
  const dateStr  = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const todaySids= [...new Set(blocks.filter(b=>b.sectionId&&b.sectionId!=="overhead"&&byId[b.sectionId]).map(b=>b.sectionId))];
  const todayDi  = dayIndex(todayISO());
  const todayTrackers=(trackers||[]).filter(t=>!t.archived&&(t.mode==="tally"||t.activeDays[todayDi]));
  const today=todayISO();

  const DEFAULT_ORDER=["upcoming","trackers","schedule"];
  const [sectionOrder,setSectionOrder]=useState(function(){
    try{ var v=localStorage.getItem("py-today-order"); if(v) return JSON.parse(v); }catch{}
    return DEFAULT_ORDER;
  });
  const [customizing,setCustomizing]=useState(false);

  useEffect(function(){ try{ localStorage.setItem("py-today-order",JSON.stringify(sectionOrder)); }catch{} },[sectionOrder]);

  function moveSection(key,dir){
    setSectionOrder(function(prev){
      var idx=prev.indexOf(key); if(idx<0) return prev;
      var ni=idx+dir; if(ni<0||ni>=prev.length) return prev;
      var next=[].concat(prev); next[idx]=prev[ni]; next[ni]=prev[idx]; return next;
    });
  }

  function SectionHeader({label,sectionKey}){
    if(!customizing) return null;
    var idx=sectionOrder.indexOf(sectionKey);
    return (
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        <span style={{fontSize:10,fontWeight:700,color:"#9B8E80",letterSpacing:"0.5px",textTransform:"uppercase"}}>{label}</span>
        <button onClick={function(){moveSection(sectionKey,-1);}} disabled={idx===0}
          style={{width:20,height:20,borderRadius:4,border:"1px solid #D6CEC3",background:"#F8F3EC",fontSize:11,color:idx===0?"#D6CEC3":"#4A3F30",cursor:idx===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{"\u25B2"}</button>
        <button onClick={function(){moveSection(sectionKey,1);}} disabled={idx===sectionOrder.length-1}
          style={{width:20,height:20,borderRadius:4,border:"1px solid #D6CEC3",background:"#F8F3EC",fontSize:11,color:idx===sectionOrder.length-1?"#D6CEC3":"#4A3F30",cursor:idx===sectionOrder.length-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{"\u25BC"}</button>
      </div>
    );
  }

  var dashSections = {};
  dashSections["upcoming"] = (
    <div key="upcoming">
      <SectionHeader label="Upcoming" sectionKey="upcoming"/>
      <UpcomingDigest tasks={tasks} byId={byId} completeTask={completeTask} updateTask={updateTask}/>
    </div>
  );
  dashSections["trackers"] = todayTrackers.length>0 ? (
    <div key="trackers">
      <SectionHeader label="Trackers" sectionKey="trackers"/>
      <div style={{marginBottom:20,background:"#EBE4D8",borderRadius:14,padding:"16px 18px"}}>
        <Cap>Daily Trackers</Cap>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {todayTrackers.map(trk=>{
              const val=trk.completions[today];
              const done=trk.mode==="tally"?(typeof val==="number"?val:val?1:0)>0:!!val;
              const count=trk.mode==="tally"?(typeof val==="number"?val:val?1:0):0;
              const streak=trackerStreak(trk);
              return trk.mode==="tally" ? (
                <div key={trk.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:9,
                  background:done?trk.color+"12":"#F8F3EC",border:"1px solid "+(done?trk.color+"40":"#E3D9CC")}}>
                  <Dot color={trk.color} size={10}/>
                  <span style={{fontSize:13,fontWeight:500,flex:1,color:"#1C1714"}}>{trk.title}</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <button onClick={()=>toggleTrackerDay(trk.id,today,false)} style={{width:22,height:22,borderRadius:5,border:"1.5px solid #D6CEC3",background:"#F8F3EC",fontSize:13,fontWeight:700,color:"#7A6C5E",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&minus;</button>
                    <span style={{fontSize:14,fontWeight:700,color:trk.color,minWidth:24,textAlign:"center"}}>{count}</span>
                    <button onClick={()=>toggleTrackerDay(trk.id,today,true)} style={{width:22,height:22,borderRadius:5,border:"1.5px solid "+trk.color,background:trk.color,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                </div>
              ) : (
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
      </div>
  ) : null;
  dashSections["schedule"] = (
    <div key="schedule">
      <SectionHeader label="Schedule" sectionKey="schedule"/>
      {blocks.length===0 ? (
        <Empty icon={"\uD83D\uDDD3"} text="No blocks scheduled today." sub="Head to the Timetable tab to plan your day." actions={["Create time blocks in the Timetable tab", "Link tasks and notes to blocks for quick access", "Use Set Blocks to stamp recurring blocks"]}/>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20,alignItems:"start"}}>
          <div style={{background:"#EBE4D8",borderRadius:14,padding:"16px",position:"sticky",top:88}}>
            <Cap>Today's Schedule</Cap>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {blocks.map(blk=>{
                if(blk.type==="break") return (
                  <div key={blk.id} style={{background:"#F3EDE3",borderRadius:9,padding:"8px 12px",border:"1.5px dashed #C2B49E"}}>
                    <div style={{fontSize:10,color:"#9B8E80",fontWeight:700}}>{blk.start} &#x2013; {blk.end}</div>
                    <div style={{fontSize:12,color:"#C2B49E",fontStyle:"italic"}}>{blk.label||"Break / Buffer"}</div>
                  </div>
                );
                const sec=byId[blk.sectionId]; if(!sec) return null;
                return (
                  <div key={blk.id} style={{background:sec.color,color:textFor(sec.color),borderRadius:9,padding:"9px 12px",borderLeft:"3px solid rgba(255,255,255,0.3)"}}>
                    <div style={{fontSize:10,opacity:0.72,fontWeight:700,marginBottom:2}}>{blk.start} &#x2013; {blk.end}</div>
                    <div style={{fontSize:13,fontWeight:600}}>{blk.label||sec.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {todaySids.length===0&&<Empty icon={"\uD83D\uDCCB"} text="No task-linked sections today." sub="Add work blocks to your timetable to see tasks here." actions={["Add section blocks to your timetable", "Tasks from those sections appear here automatically"]}/>}
            {todaySids.map(sid=>{
              const sec=byId[sid]; if(!sec) return null;
              const active=tasks.filter(t=>t.sectionId===sid&&t.status!=="done"&&t.type!=="spacer");
              const tw=active.filter(t=>t.status==="this-week");
              const bl=active.filter(t=>t.status==="backlog");
              return (
                <div key={sid} style={{background:"#EBE4D8",borderRadius:14,padding:"16px 18px",borderTop:"3px solid "+sec.color}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <Dot color={sec.color}/><span style={{fontWeight:700,fontSize:15}}>{sec.label}</span>
                    <span style={{marginLeft:"auto",fontSize:11,color:"#9B8E80"}}>{tw.length} active &#xB7; {bl.length} backlog</span>
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

  return (
    <div>
      {/* Title row */}
      <div style={{display:"flex",alignItems:"flex-end",gap:16,marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:30,fontWeight:700,lineHeight:1}}>{dayName}</h1>
          <p style={{fontSize:13,color:"#9B8E80",marginTop:5}}>{dateStr}</p>
        </div>
        <div style={{display:"flex",gap:6,marginLeft:"auto",marginBottom:4,alignItems:"center"}}>
          <button onClick={function(){setCustomizing(function(v){return !v;});}}
            title={customizing?"Done customizing":"Customize dashboard order"}
            style={{padding:"5px 12px",borderRadius:7,border:"1.5px solid "+(customizing?"#4B3FC7":"#D6CEC3"),
              background:customizing?"#E6E3F5":"transparent",color:customizing?"#4B3FC7":"#9B8E80",
              fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {customizing?"\u2713 Done":"\u2630 Arrange"}
          </button>
          <button onClick={onOpenCapture} className="cap-btn">
            <span style={{fontSize:14}}>&#x26A1;</span><span>Quick Capture</span>
          </button>
        </div>
      </div>

      {sectionOrder.map(function(key){ return dashSections[key] || null; })}
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
    const [expanded,setExpanded]=useState(false);
    const hasDetail=!!(task.notes||(task.checklist&&task.checklist.length>0));
    return (
      <div style={{borderRadius:9,
        background:task.priority==="high"?"#F5DADA":task.priority==="low"?"#F3F1EE":"#F8F3EC",
        border:"1.5px solid "+(task.priority==="high"?"#D4908F":task.priority==="low"?"#DDD8D0":"#E3D9CC"),
        opacity:task.priority==="low"?0.7:1,transition:"background 0.12s"}}>
        <div className="upcoming-task" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"default"}}>
          {task.priority==="high"&&<span style={{fontSize:9,fontWeight:800,color:"#C43A3A",flexShrink:0}} title="High priority">&#x2191;</span>}
          <button onClick={()=>completeTask(task.id)} title="Mark done"
            style={{width:16,height:16,borderRadius:4,border:"2px solid "+sec.color,background:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:sec.color}}>&#x2713;</button>
          <span onClick={()=>navigateTo?.({type:"task",id:task.id})} style={{fontSize:12,flex:1,fontWeight:task.priority==="high"?700:500,color:task.priority==="low"?"#7A6C5E":"#1C1714",cursor:"pointer"}}>{task.title}</span>
          {hasDetail&&<button onClick={()=>setExpanded(!expanded)} title={expanded?"Collapse":"Show details"}
            style={{width:18,height:18,borderRadius:4,border:"1px solid #D6CEC3",background:expanded?"#EBE4D8":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#9B8E80",cursor:"pointer",fontWeight:700,lineHeight:1}}>{expanded?"\u2212":"+"}</button>}
          <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,fontWeight:700,background:sec.color+"20",color:sec.color,flexShrink:0}}>{sec.label}</span>
          <span style={{fontSize:10,fontWeight:700,flexShrink:0,color:due.urgent?"#C43A3A":"#7A6C5E",background:due.urgent?"#FAE8E8":"#EBE4D8",padding:"2px 7px",borderRadius:10}}>{due.label}</span>
        </div>
        {expanded&&<div style={{padding:"0 12px 10px 42px",fontSize:12,color:"#4A3F30",lineHeight:1.5}}>
          {task.notes&&<p style={{margin:"0 0 6px",color:"#6B5E4E",whiteSpace:"pre-wrap"}}>{task.notes}</p>}
          {(task.checklist||[]).length>0&&<div style={{display:"flex",flexDirection:"column",gap:3}}>
            {task.checklist.map(function(ci){return (
              <div key={ci.id} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:2,border:"1.5px solid "+(ci.done?"#1A7A43":"#C2B49E"),background:ci.done?"#1A7A43":"transparent",flexShrink:0}}/>
                <span style={{fontSize:11,color:ci.done?"#9B8E80":"#4A3F30",textDecoration:ci.done?"line-through":"none"}}>{ci.text}</span>
              </div>
            );})}
          </div>}
        </div>}
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
      {tasks.map(t=>{
        var hasDetail=!!(t.notes||(t.checklist&&t.checklist.length>0));
        return (
        <MiniColTask key={t.id} task={t} secColor={secColor} updateTask={updateTask} completeTask={completeTask} navigateTo={navigateTo} hasDetail={hasDetail}/>
      );})}
    </div>
  );
}
function MiniColTask({task,secColor,updateTask,completeTask,navigateTo,hasDetail}){
  var t=task;
  var [expanded,setExpanded]=useState(false);
  return (
    <div style={{marginBottom:7}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
            <button onClick={()=>completeTask(t.id)} style={{width:15,height:15,borderRadius:4,border:"2px solid "+secColor,background:"transparent",padding:0,marginTop:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:secColor}}>&#x2713;</button>
            <span onClick={()=>navigateTo?.({type:"task",id:t.id})} style={{fontSize:12,lineHeight:1.35,flex:1,cursor:"pointer"}}>{t.title}</span>
            {hasDetail&&<button onClick={()=>setExpanded(!expanded)} title={expanded?"Collapse":"Show details"}
              style={{width:16,height:16,borderRadius:3,border:"1px solid #D6CEC3",background:expanded?"#EBE4D8":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#9B8E80",cursor:"pointer",fontWeight:700,lineHeight:1,marginTop:1}}>{expanded?"\u2212":"+"}</button>}
            {t.status==="backlog"&&<button onClick={()=>updateTask(t.id,{status:"this-week"})} style={{fontSize:9,padding:"2px 5px",borderRadius:4,border:"none",background:"#E6E3F5",color:"#4B3FC7",flexShrink:0}}>&#x2192;W</button>}
          </div>
          {expanded&&<div style={{marginLeft:21,marginTop:4,fontSize:12,color:"#4A3F30",lineHeight:1.5}}>
            {t.notes&&<p style={{margin:"0 0 4px",color:"#6B5E4E",whiteSpace:"pre-wrap",fontSize:11}}>{t.notes}</p>}
            {(t.checklist||[]).length>0&&<div style={{display:"flex",flexDirection:"column",gap:2}}>
              {(t.checklist||[]).map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}
                  onClick={()=>updateTask(t.id,{checklist:(t.checklist||[]).map(i=>i.id===item.id?{...i,done:!i.done}:i)})}>
                  <div style={{width:9,height:9,borderRadius:2,border:"1.5px solid "+(item.done?"#1A7A43":"#C2B49E"),background:item.done?"#1A7A43":"transparent",flexShrink:0}}/>
                  <span style={{fontSize:11,color:item.done?"#9B8E80":"#6B5E4E",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                </div>
              ))}
            </div>}
          </div>}
        </div>
  );
}
