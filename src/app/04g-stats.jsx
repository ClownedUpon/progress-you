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
      {(function(){
        var activeTrackers=(trackers||[]).filter(function(t){return !t.archived;});
        if(activeTrackers.length===0) return null;
        var thisWeekDates=DAYS.map(function(_,i){ return addDays(week,i); });
        var priorWeekDates=DAYS.map(function(_,i){ return addDays(week,i-7); });

        function weekValues(trk,dates){
          var vals=[];
          for(var i=0;i<dates.length;i++){
            var v=trk.completions[dates[i]];
            if(typeof v==="number") vals.push(v);
          }
          return vals;
        }

        return (
          <div style={{marginTop:20,background:"#EBE4D8",borderRadius:14,padding:"20px 22px"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#4A3F30",marginBottom:16}}>&#x1F4CA; Tracker Consistency</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {activeTrackers.map(function(trk){
                var streak=trackerStreak(trk);

                // Habit / Tally — rate-based
                if(trk.mode==="habit"||trk.mode==="tally"){
                  var expected=trk.mode==="tally"?7:thisWeekDates.filter(function(_,i){return trk.activeDays[i];}).length;
                  var completed=thisWeekDates.filter(function(d,i){
                    if(trk.mode==="tally"){var v=trk.completions[d];return(typeof v==="number"?v:v?1:0)>0;}
                    return trk.activeDays[i]&&trk.completions[d];
                  }).length;
                  var rate=expected>0?Math.round(completed/expected*100):0;
                  var monthCount=0;
                  for(var mi=0;mi<30;mi++){
                    var md=new Date(todayISO()+"T12:00:00");md.setDate(md.getDate()-mi);
                    var miso=md.toISOString().slice(0,10);
                    if(trk.completions[miso]) monthCount++;
                  }
                  return (
                    <div key={trk.id} style={{background:"#FDFAF6",borderRadius:10,padding:"12px 14px",border:"1px solid #E3D9CC"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{width:10,height:10,borderRadius:3,background:trk.color}}/>
                        <span style={{fontSize:13,fontWeight:600,flex:1}}>{trk.title}</span>
                        <span style={{fontSize:11,fontWeight:700,color:rate>=80?"#1A7A43":rate>=50?"#B05A12":"#C43A3A"}}>{rate}%</span>
                      </div>
                      <div style={{height:6,borderRadius:3,background:"#E3D9CC",overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:3,background:trk.color,width:rate+"%",transition:"width 0.3s"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                        <span style={{fontSize:10,color:"#9B8E80"}}>{completed}/{expected} this week · {monthCount}d this month</span>
                        {streak>0&&<span style={{fontSize:10,fontWeight:600,color:trk.color}}>{streak}d streak</span>}
                      </div>
                    </div>
                  );
                }

                // Rating — weekly average + trend
                if(trk.mode==="rating"){
                  var rMax=trk.config?.max||5;
                  var thisVals=weekValues(trk,thisWeekDates);
                  var priorVals=weekValues(trk,priorWeekDates);
                  var thisAvg=thisVals.length>0?thisVals.reduce(function(a,b){return a+b;},0)/thisVals.length:null;
                  var priorAvg=priorVals.length>0?priorVals.reduce(function(a,b){return a+b;},0)/priorVals.length:null;
                  var trend=thisAvg!==null&&priorAvg!==null?(thisAvg>priorAvg?"\u2191":thisAvg<priorAvg?"\u2193":"\u2192"):null;
                  var trendColor=trend==="\u2191"?"#1A7A43":trend==="\u2193"?"#C43A3A":"#9B8E80";
                  return (
                    <div key={trk.id} style={{background:"#FDFAF6",borderRadius:10,padding:"12px 14px",border:"1px solid #E3D9CC"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{width:10,height:10,borderRadius:3,background:trk.color}}/>
                        <span style={{fontSize:13,fontWeight:600,flex:1}}>{trk.title}</span>
                        {thisAvg!==null&&<span style={{fontSize:14,fontWeight:700,color:trk.color}}>{thisAvg.toFixed(1)}/{rMax}</span>}
                        {trend&&<span style={{fontSize:13,fontWeight:700,color:trendColor}}>{trend}</span>}
                      </div>
                      <div style={{fontSize:10,color:"#9B8E80"}}>{thisVals.length} rating{thisVals.length!==1?"s":""} this week{streak>0?" · "+streak+"d streak":""}</div>
                    </div>
                  );
                }

                // Measure — weekly average + unit + min/max + trend
                if(trk.mode==="measure"){
                  var unit=trk.config?.unit||"";
                  var mThisVals=weekValues(trk,thisWeekDates);
                  var mPriorVals=weekValues(trk,priorWeekDates);
                  var mThisAvg=mThisVals.length>0?mThisVals.reduce(function(a,b){return a+b;},0)/mThisVals.length:null;
                  var mPriorAvg=mPriorVals.length>0?mPriorVals.reduce(function(a,b){return a+b;},0)/mPriorVals.length:null;
                  var mTrend=mThisAvg!==null&&mPriorAvg!==null?(mThisAvg>mPriorAvg?"\u2191":mThisAvg<mPriorAvg?"\u2193":"\u2192"):null;
                  var mTrendColor=mTrend==="\u2191"?"#1A7A43":mTrend==="\u2193"?"#C43A3A":"#9B8E80";
                  var mMin=mThisVals.length>0?Math.min.apply(null,mThisVals):null;
                  var mMax=mThisVals.length>0?Math.max.apply(null,mThisVals):null;
                  return (
                    <div key={trk.id} style={{background:"#FDFAF6",borderRadius:10,padding:"12px 14px",border:"1px solid #E3D9CC"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{width:10,height:10,borderRadius:3,background:trk.color}}/>
                        <span style={{fontSize:13,fontWeight:600,flex:1}}>{trk.title}</span>
                        {mThisAvg!==null&&<span style={{fontSize:14,fontWeight:700,color:trk.color}}>{mThisAvg.toFixed(1)} {unit}</span>}
                        {mTrend&&<span style={{fontSize:13,fontWeight:700,color:mTrendColor}}>{mTrend}</span>}
                      </div>
                      <div style={{fontSize:10,color:"#9B8E80"}}>
                        {mThisVals.length} entr{mThisVals.length!==1?"ies":"y"} this week
                        {mMin!==null&&mMax!==null&&mMin!==mMax?" · range "+mMin+"\u2013"+mMax+" "+unit:""}
                      </div>
                    </div>
                  );
                }

                // Choice — most frequent this week
                if(trk.mode==="choice"){
                  var cDist={};
                  for(var ci=0;ci<thisWeekDates.length;ci++){
                    var cv=trk.completions[thisWeekDates[ci]];
                    if(typeof cv==="string") cDist[cv]=(cDist[cv]||0)+1;
                  }
                  var cEntries=Object.keys(cDist).map(function(k){return{value:k,count:cDist[k]};});
                  cEntries.sort(function(a,b){return b.count-a.count;});
                  var topChoice=cEntries[0]||null;
                  var cOpts=(trk.config?.options)||[];
                  var topOpt=topChoice?cOpts.find(function(o){return o.value===topChoice.value;}):null;
                  var topColor=topOpt?.color||trk.color;
                  return (
                    <div key={trk.id} style={{background:"#FDFAF6",borderRadius:10,padding:"12px 14px",border:"1px solid #E3D9CC"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{width:10,height:10,borderRadius:3,background:trk.color}}/>
                        <span style={{fontSize:13,fontWeight:600,flex:1}}>{trk.title}</span>
                        {topChoice&&<span style={{fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:10,background:topColor,color:"#fff"}}>{topChoice.value} ({topChoice.count})</span>}
                      </div>
                      <div style={{fontSize:10,color:"#9B8E80"}}>{cEntries.reduce(function(s,e){return s+e.count;},0)} choice{cEntries.reduce(function(s,e){return s+e.count;},0)!==1?"s":""} this week{streak>0?" · "+streak+"d streak":""}</div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
