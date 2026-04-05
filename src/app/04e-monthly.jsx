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
          {done.length===0&&<Empty icon={"\uD83D\uDCC5"} text="Nothing completed yet this month." sub="Mark tasks as done in Taskboards to see them here." actions={["Move tasks to the Done column in Taskboards", "Completed tasks are grouped by section and month"]}/>}
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
