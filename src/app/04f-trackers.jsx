// ─── Trackers View ────────────────────────────────────────────────────────────

function TrackersView({trackers,addTracker,updateTracker,deleteTracker,toggleTrackerDay,setTrackerDay,archiveTracker,sections,byId,tasks,notes,addTask,addNote,linkTrackerToTask,unlinkTrackerFromTask,linkTrackerToNote,unlinkTrackerFromNote}) {
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
      var cellActive=trk.mode==="tally"||trk.mode==="measure"||trk.activeDays[di];
      var cellDone=trk.mode==="tally"?(typeof rawV==="number"?rawV:rawV?1:0)>0
        :trk.mode==="rating"||trk.mode==="measure"?typeof rawV==="number"
        :trk.mode==="choice"?typeof rawV==="string"
        :!!rawV;
      var cellCount=trk.mode==="tally"?(typeof rawV==="number"?rawV:rawV?1:0):0;
      var cellVal=rawV;
      cells.push({day:d,iso:iso,active:cellActive,done:cellDone,count:cellCount,val:cellVal,di:di});
    }

    // For rating/measure intensity scaling
    var mmRange=null;
    if(trk.mode==="rating"||trk.mode==="measure") mmRange=trackerMinMax(trk);

    function handleCellClick(c){
      if(!c.active) return;
      if(trk.mode==="habit") toggleTrackerDay(trk.id,c.iso);
      else if(trk.mode==="tally") toggleTrackerDay(trk.id,c.iso,true);
      else if(trk.mode==="rating"){
        var rc=trk.config||{min:1,max:5};
        var nxt=typeof c.val==="number"?(c.val>=rc.max?null:c.val+1):rc.min;
        setTrackerDay(trk.id,c.iso,nxt);
      } else if(trk.mode==="choice"){
        var co=(trk.config?.options)||[];
        if(co.length===0) return;
        var ci=co.findIndex(function(o){return o.value===c.val;});
        var nv=ci<0?co[0].value:ci>=co.length-1?null:co[ci+1].value;
        setTrackerDay(trk.id,c.iso,nv);
      }
    }

    function cellBg(c){
      if(!c.done) return c.active?"#F8F3EC":"#EBE4D8";
      if(trk.mode==="choice"){
        var cOpt=(trk.config?.options||[]).find(function(o){return o.value===c.val;});
        return (cOpt?.color||trk.color)+"30";
      }
      if((trk.mode==="rating"||trk.mode==="measure")&&mmRange&&typeof c.val==="number"){
        var range=mmRange.max-mmRange.min||1;
        var pct=Math.max(0.15,Math.min(1,(c.val-mmRange.min)/range));
        var alpha=Math.round(pct*60).toString(16).padStart(2,"0");
        return trk.color+alpha;
      }
      if(trk.mode==="tally") return trk.color+"20";
      return trk.color+"30";
    }

    function cellColor(c){
      if(!c.done) return c.active?"#4A3F30":"#C8BEB0";
      if(trk.mode==="choice"){
        var cOpt=(trk.config?.options||[]).find(function(o){return o.value===c.val;});
        return cOpt?.color||trk.color;
      }
      return trk.color;
    }

    function cellContent(c){
      if(trk.mode==="tally"&&c.count>0) return React.createElement("span",{style:{fontSize:8,fontWeight:700,lineHeight:1}},c.count);
      if(trk.mode==="rating"&&typeof c.val==="number") return React.createElement("span",{style:{fontSize:8,fontWeight:700,lineHeight:1}},c.val);
      if(trk.mode==="measure"&&typeof c.val==="number") return React.createElement("span",{style:{fontSize:7,fontWeight:700,lineHeight:1}},c.val);
      if(trk.mode==="choice"&&typeof c.val==="string") return React.createElement("span",{style:{fontSize:10,lineHeight:1}},"\u25CF");
      return null;
    }

    function cellTitle(c){
      if(trk.mode==="tally"&&c.count>0) return c.count+" occurrence"+(c.count!==1?"s":"");
      if(trk.mode==="rating"&&typeof c.val==="number") return "Rating: "+c.val;
      if(trk.mode==="measure"&&typeof c.val==="number") return c.val+" "+(trk.config?.unit||"");
      if(trk.mode==="choice"&&typeof c.val==="string") return c.val;
      return "";
    }

    return (
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <button onClick={function(){setMonthOff(function(m){return m-1;});}} style={{...S.btnMicro,padding:"2px 8px"}}>&#x25C0;</button>
          <span style={{fontSize:12,fontWeight:600}}>{monthLabel}</span>
          <button onClick={function(){setMonthOff(function(m){return m+1;});}} style={{...S.btnMicro,padding:"2px 8px"}}>&#x25B6;</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {DAYS.map(function(d){return React.createElement("div",{key:d,style:{fontSize:9,fontWeight:700,textAlign:"center",color:"#9B8E80"}},d.slice(0,2));})}
          {cells.map(function(c,i){
            if(!c) return React.createElement("div",{key:"e"+i});
            var isToday=c.iso===today;
            return (
              <div key={c.iso}
                onClick={function(){handleCellClick(c);}}
                onContextMenu={trk.mode==="tally"?function(e){e.preventDefault();if(c.count>0) toggleTrackerDay(trk.id,c.iso,false);}
                  :trk.mode!=="habit"&&c.done?function(e){e.preventDefault();setTrackerDay(trk.id,c.iso,null);}
                  :undefined}
                title={cellTitle(c)}
                style={{width:"100%",aspectRatio:"1",borderRadius:4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  fontSize:c.done&&(trk.mode==="tally"||trk.mode==="rating"||trk.mode==="measure")?8:10,
                  fontWeight:isToday?700:500,cursor:c.active?"pointer":"default",
                  background:cellBg(c),color:cellColor(c),
                  border:isToday?"2px solid "+trk.color:"1px solid transparent"}}>
                <span>{c.day}</span>
                {cellContent(c)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function TrackerRow({trk}){
    var streak=trackerStreak(trk);
    var todayDi=dayIndex(today);
    var isActiveToday=trk.mode==="tally"||trk.mode==="measure"||trk.activeDays[todayDi];
    var rawVal=trk.completions[today];
    var tallyCount=trk.mode==="tally"?(typeof rawVal==="number"?rawVal:rawVal?1:0):0;
    var doneToday=trk.mode==="tally"?tallyCount>0
      :trk.mode==="rating"||trk.mode==="measure"?typeof rawVal==="number"
      :trk.mode==="choice"?typeof rawVal==="string"
      :!!rawVal;

    var subtitle=trk.mode==="tally"?"Tally tracker"
      :trk.mode==="rating"?"Rating "+(trk.config?trk.config.min+"\u2013"+trk.config.max:"1\u20135")
      :trk.mode==="measure"?"Measure"+(trk.config?" ("+trk.config.unit+")":"")
      :trk.mode==="choice"?"Choice tracker"
      :DAYS.filter(function(_,i){return trk.activeDays[i];}).map(function(d){return d.slice(0,3);}).join(", ");

    var inlineControl=null;
    if(trk.mode==="tally"){
      inlineControl=(
        <div style={{display:"flex",alignItems:"center",gap:3}} onClick={function(e){e.stopPropagation();}}>
          <button onClick={function(){toggleTrackerDay(trk.id,today,false);}} style={{width:18,height:18,borderRadius:4,border:"1px solid #D6CEC3",background:"#F8F3EC",fontSize:11,fontWeight:700,color:"#7A6C5E",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&minus;</button>
          <span style={{fontSize:12,fontWeight:700,color:trk.color,minWidth:18,textAlign:"center"}}>{tallyCount}</span>
          <button onClick={function(){toggleTrackerDay(trk.id,today,true);}} style={{width:18,height:18,borderRadius:4,border:"1px solid "+trk.color,background:trk.color,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>
      );
    } else if(trk.mode==="rating"){
      var cfg=trk.config||{min:1,max:5};
      var dots=[];
      for(var ri=cfg.min;ri<=cfg.max;ri++) dots.push(ri);
      inlineControl=(
        <div style={{display:"flex",alignItems:"center",gap:2}} onClick={function(e){e.stopPropagation();}}>
          {dots.map(function(v){ return (
            <div key={v} onClick={function(){setTrackerDay(trk.id,today,v);}}
              style={{width:18,height:18,borderRadius:"50%",fontSize:9,fontWeight:700,
                display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                background:rawVal===v?trk.color:"transparent",
                color:rawVal===v?"#fff":typeof rawVal==="number"&&v<=rawVal?trk.color:"#9B8E80",
                border:"1px solid "+(rawVal===v?trk.color:typeof rawVal==="number"&&v<=rawVal?trk.color+"60":"#D6CEC3")}}>
              {v}
            </div>
          ); })}
        </div>
      );
    } else if(trk.mode==="measure"){
      inlineControl=(
        <div style={{display:"flex",alignItems:"center",gap:3}} onClick={function(e){e.stopPropagation();}}>
          <input key={String(rawVal)} defaultValue={typeof rawVal==="number"?rawVal:""}
            onBlur={function(e){var v=parseFloat(e.target.value);if(!isNaN(v))setTrackerDay(trk.id,today,v);else if(!e.target.value.trim())setTrackerDay(trk.id,today,null);}}
            onKeyDown={function(e){if(e.key==="Enter")e.target.blur();}}
            placeholder={"\u2014"}
            style={{width:52,padding:"2px 6px",borderRadius:5,border:"1px solid #D6CEC3",fontSize:11,textAlign:"center",background:"#F8F3EC",color:"#1C1714"}}/>
          <span style={{fontSize:10,color:"#9B8E80"}}>{trk.config?.unit||""}</span>
        </div>
      );
    } else if(trk.mode==="choice"){
      var opts=(trk.config?.options)||[];
      inlineControl=(
        <div style={{display:"flex",alignItems:"center",gap:2,flexWrap:"wrap"}} onClick={function(e){e.stopPropagation();}}>
          {opts.map(function(o){ return (
            <div key={o.value} onClick={function(){setTrackerDay(trk.id,today,o.value);}}
              style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:10,cursor:"pointer",
                background:rawVal===o.value?(o.color||trk.color):(o.color||trk.color)+"15",
                color:rawVal===o.value?"#fff":(o.color||trk.color),
                border:"1px solid "+(rawVal===o.value?(o.color||trk.color):(o.color||trk.color)+"40")}}>
              {o.value}
            </div>
          ); })}
        </div>
      );
    } else if(isActiveToday){
      inlineControl=(
        <div onClick={function(e){e.stopPropagation();toggleTrackerDay(trk.id,today);}}
          style={{width:20,height:20,borderRadius:5,border:"2px solid "+trk.color,
            background:doneToday?trk.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
            color:"#fff",fontSize:11,fontWeight:700,flexShrink:0,cursor:"pointer"}}>
          {doneToday?"\u2713":""}
        </div>
      );
    }

    return (
      <div onClick={function(){setSelId(trk.id);}}
        onContextMenu={function(e){openCtx?.(e,[
          {label:"Edit",action:function(){setEditId(trk.id);}},
          {label:"Archive",action:function(){archiveTracker(trk.id);}},
          {label:"Delete",action:function(){deleteTracker(trk.id);},danger:true},
        ]);}}
        style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,cursor:"pointer",
          background:sel?.id===trk.id?"#EBE4D8":"transparent",border:sel?.id===trk.id?"1px solid #D5CBBC":"1px solid transparent"}}>
        <div style={{width:10,height:10,borderRadius:3,background:trk.color,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1C1714",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{trk.title}</div>
          <div style={{fontSize:10,color:"#9B8E80"}}>{subtitle}</div>
        </div>
        {inlineControl}
        {trk.mode!=="tally"&&trk.mode!=="measure"&&streak>0&&<span style={{fontSize:10,fontWeight:600,color:trk.color,flexShrink:0}}>{streak}d</span>}
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
                {DAYS.map(function(d,i){
                  var wk=mondayOf(new Date());
                  var iso=addDays(wk,i);
                  var isActive=sel.mode==="tally"||sel.mode==="measure"||sel.activeDays[i];
                  var wval=sel.completions[iso];
                  var isToday=iso===today;
                  var cellDone=false,cellDisplay="",cellColor=null;
                  if(sel.mode==="habit"){ cellDone=!!wval; cellDisplay=wval?"\u2713":isActive?"\u00B7":""; }
                  else if(sel.mode==="tally"){ var tc=typeof wval==="number"?wval:wval?1:0; cellDone=tc>0; cellDisplay=tc>0?String(tc):"\u00B7"; }
                  else if(sel.mode==="rating"){ cellDone=typeof wval==="number"; cellDisplay=typeof wval==="number"?String(wval):isActive?"\u00B7":""; }
                  else if(sel.mode==="measure"){ cellDone=typeof wval==="number"; cellDisplay=typeof wval==="number"?String(wval):isActive?"\u00B7":""; }
                  else if(sel.mode==="choice"){
                    cellDone=typeof wval==="string";
                    cellDisplay=typeof wval==="string"?"\u25CF":isActive?"\u00B7":"";
                    var cOpt=(sel.config?.options||[]).find(function(o){return o.value===wval;});
                    cellColor=cOpt?.color||null;
                  }
                  function handleWeekClick(){
                    if(!isActive) return;
                    if(sel.mode==="habit") toggleTrackerDay(sel.id,iso);
                    else if(sel.mode==="tally") toggleTrackerDay(sel.id,iso,true);
                    else if(sel.mode==="rating"){
                      var rc=sel.config||{min:1,max:5};
                      var nxt=typeof wval==="number"?(wval>=rc.max?null:wval+1):rc.min;
                      setTrackerDay(sel.id,iso,nxt);
                    } else if(sel.mode==="choice"){
                      var co=(sel.config?.options)||[];
                      if(co.length===0) return;
                      var ci=co.findIndex(function(o){return o.value===wval;});
                      var nv=ci<0?co[0].value:ci>=co.length-1?null:co[ci+1].value;
                      setTrackerDay(sel.id,iso,nv);
                    }
                  }
                  return (
                    <div key={d} onClick={handleWeekClick}
                      onContextMenu={sel.mode==="tally"?function(e){e.preventDefault();var cv=typeof wval==="number"?wval:wval?1:0;if(cv>0)toggleTrackerDay(sel.id,iso,false);}:undefined}
                      title={sel.mode==="choice"&&typeof wval==="string"?wval:sel.mode==="measure"&&typeof wval==="number"?wval+" "+(sel.config?.unit||""):""}
                      style={{padding:"8px 4px",borderRadius:8,textAlign:"center",
                        cursor:isActive&&sel.mode!=="measure"?"pointer":"default",
                        background:cellDone?(cellColor||sel.color)+"20":isActive?"#F8F3EC":"#EBE4D8",
                        border:isToday?"2px solid "+sel.color:"1.5px solid "+(isActive?"#E3D9CC":"#EBE4D8")}}>
                      <div style={{fontSize:10,fontWeight:700,color:isToday?sel.color:"#9B8E80"}}>{d.slice(0,3)}</div>
                      <div style={{fontSize:sel.mode==="measure"&&cellDone?11:18,marginTop:2,
                        color:cellDone?(cellColor||sel.color):isActive?"#C8BEB0":"#E3D9CC",fontWeight:700}}>
                        {cellDisplay}
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
  var [title,setTitle]=useState(tracker?.title||"");
  var [secId,setSecId]=useState(tracker?.sectionId||"");
  var [color,setColor]=useState(tracker?.color||"#0C7B7B");
  var [mode,setMode]=useState(tracker?.mode||"habit");
  var [days,setDays]=useState(tracker?.activeDays||[1,1,1,1,1,0,0]);
  var titleRef=useRef(null);
  useEffect(function(){setTimeout(function(){if(titleRef.current)titleRef.current.focus();},60);},[]);

  // Rating config
  var tc=tracker?.config||{};
  var [rMin,setRMin]=useState(tc.min||1);
  var [rMax,setRMax]=useState(tc.max||5);
  var [rLabels,setRLabels]=useState(tc.labels||{});
  var [showLabels,setShowLabels]=useState(false);

  // Measure config
  var [mUnit,setMUnit]=useState(tc.unit||"");
  var [mMin,setMMin]=useState(tc.min!=null?tc.min:"");
  var [mMax,setMMax]=useState(tc.max!=null?tc.max:"");

  // Choice config
  var [choiceOpts,setChoiceOpts]=useState(tc.options||[{value:"",color:""},{value:"",color:""}]);

  function toggleDay(i){ setDays(function(d){var n=[].concat(d);n[i]=n[i]?0:1;return n;}); }

  function handleSave(){
    if(!title.trim()) return;
    var config=null;
    if(mode==="rating"){
      var mn=Math.max(0,Math.min(rMin,rMax-1));
      var mx=Math.max(mn+1,rMax);
      config={min:mn,max:mx,labels:rLabels};
    } else if(mode==="measure"){
      if(!mUnit.trim()) return;
      config={unit:mUnit.trim(),min:mMin!==""?Number(mMin):null,max:mMax!==""?Number(mMax):null};
    } else if(mode==="choice"){
      var validOpts=choiceOpts.filter(function(o){return o.value.trim();}).map(function(o){return{value:o.value.trim(),color:o.color||""};});
      if(validOpts.length<2) return;
      config={options:validOpts};
    }
    onSave({title:title.trim(),sectionId:secId||null,color:color,mode:mode,activeDays:days,config:config});
  }

  var MODES=[
    {key:"habit",label:"Habit",desc:"Track daily habits \u2014 one check per day."},
    {key:"tally",label:"Tally",desc:"Track occurrences \u2014 count events per day."},
    {key:"rating",label:"Rating",desc:"Rate on a scale (e.g. mood 1\u20135, energy 1\u201310)."},
    {key:"measure",label:"Measure",desc:"Track a number with a unit (e.g. weight, calories)."},
    {key:"choice",label:"Choice",desc:"Pick from a custom list of options each day."},
  ];

  var placeholders={habit:"e.g. Exercise, Reading, Meditation...",tally:"e.g. Glasses of water, Coffees...",rating:"e.g. Mood, Energy, Sleep quality...",measure:"e.g. Weight, Calories, Water intake...",choice:"e.g. Weather, Mood label, Workout type..."};
  var showActiveDays=mode==="habit"||mode==="rating"||mode==="choice";

  return (
    <Overlay onClose={onClose} width={460}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <Dot color={color} size={11}/>
        <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700}}>{tracker?"Edit Tracker":"New Tracker"}</h2>
      </div>
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Title</label>
        <input ref={titleRef} value={title} onChange={function(e){setTitle(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") handleSave();}}
          placeholder={placeholders[mode]||""}
          style={{...S.input,marginBottom:0}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Type</label>
        <div style={{display:"flex",gap:3,background:"#EBE4D8",borderRadius:8,padding:3,flexWrap:"wrap"}}>
          {MODES.map(function(m){return (
            <button key={m.key} onClick={function(){setMode(m.key);}} style={{flex:"1 1 auto",padding:"6px 8px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,
              background:mode===m.key?"#FDFAF6":"transparent",color:mode===m.key?"#1C1714":"#7A6C5E",
              boxShadow:mode===m.key?"0 1px 4px rgba(0,0,0,0.1)":"none",cursor:"pointer",whiteSpace:"nowrap"}}>
              {m.label}
            </button>
          );})}
        </div>
        <div style={{fontSize:10,color:"#9B8E80",marginTop:4}}>
          {MODES.find(function(m){return m.key===mode;})?.desc||""}
        </div>
      </div>

      {/* Rating config */}
      {mode==="rating"&&<div style={{marginBottom:12,background:"#F3EDE3",borderRadius:9,padding:"10px 12px"}}>
        <label style={S.lbl}>Scale Range</label>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <input type="number" value={rMin} onChange={function(e){setRMin(parseInt(e.target.value)||0);}}
            style={{...S.input,marginBottom:0,width:60,textAlign:"center",padding:"5px 8px"}}/>
          <span style={{fontSize:12,color:"#9B8E80"}}>to</span>
          <input type="number" value={rMax} onChange={function(e){setRMax(parseInt(e.target.value)||1);}}
            style={{...S.input,marginBottom:0,width:60,textAlign:"center",padding:"5px 8px"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
          {(function(){var dots=[];for(var v=rMin;v<=Math.min(rMax,rMin+19);v++){dots.push(
            <div key={v} style={{width:22,height:22,borderRadius:"50%",background:v===rMin?color+"30":v===rMax?color:"#EBE4D8",
              border:"1.5px solid "+(v===rMax?color:"#D6CEC3"),display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:9,fontWeight:600,color:v===rMax?"#fff":"#4A3F30"}}>{v}</div>
          );}return dots;})()}
        </div>
        <button onClick={function(){setShowLabels(function(v){return !v;});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#4B3FC7",fontWeight:600,padding:0}}>
          {showLabels?"Hide labels":"Customise labels"}
        </button>
        {showLabels&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:4}}>
          {(function(){var rows=[];for(var v=rMin;v<=Math.min(rMax,rMin+19);v++){(function(val){
            rows.push(<div key={val} style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:10,fontWeight:700,color:"#7A6C5E",minWidth:20,textAlign:"center"}}>{val}</span>
              <input value={rLabels[val]||""} onChange={function(e){setRLabels(function(prev){var next={...prev};if(e.target.value)next[val]=e.target.value;else delete next[val];return next;});}}
                placeholder="Label (optional)" style={{...S.input,marginBottom:0,flex:1,padding:"3px 8px",fontSize:11}}/>
            </div>);
          })(v);}return rows;})()}
        </div>}
      </div>}

      {/* Measure config */}
      {mode==="measure"&&<div style={{marginBottom:12,background:"#F3EDE3",borderRadius:9,padding:"10px 12px"}}>
        <label style={S.lbl}>Unit (required)</label>
        <input value={mUnit} onChange={function(e){setMUnit(e.target.value);}} placeholder="e.g. kg, hours, calories..."
          style={{...S.input,marginBottom:8}}/>
        <label style={S.lbl}>Chart Axis Bounds (optional)</label>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="number" value={mMin} onChange={function(e){setMMin(e.target.value);}} placeholder="Min"
            style={{...S.input,marginBottom:0,flex:1,padding:"5px 8px"}}/>
          <span style={{fontSize:12,color:"#9B8E80"}}>to</span>
          <input type="number" value={mMax} onChange={function(e){setMMax(e.target.value);}} placeholder="Max"
            style={{...S.input,marginBottom:0,flex:1,padding:"5px 8px"}}/>
        </div>
      </div>}

      {/* Choice config */}
      {mode==="choice"&&<div style={{marginBottom:12,background:"#F3EDE3",borderRadius:9,padding:"10px 12px"}}>
        <label style={S.lbl}>Options (minimum 2)</label>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
          {choiceOpts.map(function(opt,idx){return (
            <div key={idx} style={{display:"flex",alignItems:"center",gap:6}}>
              <input value={opt.value} onChange={function(e){setChoiceOpts(function(prev){var next=prev.map(function(o,i){return i===idx?{...o,value:e.target.value}:o;});return next;});}}
                placeholder={"Option "+(idx+1)} style={{...S.input,marginBottom:0,flex:1,padding:"5px 8px",fontSize:12}}/>
              <div onClick={function(){
                var inp=document.createElement("input");inp.type="color";inp.value=opt.color||color;
                inp.addEventListener("input",function(e){setChoiceOpts(function(prev){return prev.map(function(o,i){return i===idx?{...o,color:e.target.value}:o;});});});
                inp.click();
              }} style={{width:22,height:22,borderRadius:4,background:opt.color||color,border:"1px solid #D6CEC3",cursor:"pointer",flexShrink:0}}/>
              {choiceOpts.length>2&&<button onClick={function(){setChoiceOpts(function(prev){return prev.filter(function(_,i){return i!==idx;});});}}
                style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:14,padding:0,flexShrink:0,fontWeight:700}}>&#xd7;</button>}
            </div>
          );})}
        </div>
        <button onClick={function(){setChoiceOpts(function(prev){return prev.concat([{value:"",color:""}]);});}}
          style={{...S.btnMicro,marginTop:6,fontSize:10}}>+ Add Option</button>
      </div>}

      <div style={{marginBottom:12}}>
        <label style={S.lbl}>Section (optional)</label>
        <select value={secId} onChange={function(e){setSecId(e.target.value);}} style={{...S.input,marginBottom:0}}>
          <option value="">None (Independent)</option>
          {sections.filter(function(s){return s.id!=="overhead";}).map(function(s){return <option key={s.id} value={s.id}>{s.label}</option>;})}
        </select>
      </div>
      {showActiveDays&&<div style={{marginBottom:12}}>
        <label style={S.lbl}>Active Days</label>
        <div style={{display:"flex",gap:4}}>
          {DAYS.map(function(d,i){return (
            <button key={d} onClick={function(){toggleDay(i);}}
              style={{...S.btnMicro,flex:1,padding:"6px 0",background:days[i]?color:"#EBE4D8",
                color:days[i]?"#fff":"#4A3F30",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>
              {d.slice(0,2)}
            </button>
          );})}
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
