// ─── Timetable View ───────────────────────────────────────────────────────────

function TimetableView({sections,byId,getDayBlocks,upsertBlock,deleteBlock,
                        templates,addTemplate,updateTemplate,deleteTemplate,applyTemplate,
                        tasks,notes,setBlocks,addSetBlock,removeSetBlock,reorderSetBlock,trackers,week}) {
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
                    <button onClick={function(e){e.stopPropagation();if(confirm("Delete template \""+t.name+"\"? This cannot be undone."))deleteTemplate(t.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:11,padding:"0 2px"}}>&#xd7;</button>
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
          <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:7}}>Set Blocks <span style={{fontWeight:400,textTransform:"none",color:"#9B8E80"}}>{"\u2014"} drag to place, right-click to reorder</span></div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {(setBlocks||[]).map(function(sb,idx){
              var sec=sb.sectionId?byId[sb.sectionId]:null;
              var bg=sec?sec.color:"#8B7D6B";
              return (
                <div key={sb.id} style={{display:"inline-flex",alignItems:"center",gap:3}}>
                  <div onPointerDown={function(e){startPalDrag(e,sb);}}
                    onContextMenu={function(e){if(!openCtx)return;openCtx(e,[
                      {label:"Add to\u2026",submenu:DAYS.map(function(d){return{label:d,action:function(){upsertBlock(d,{...sb,id:uid(),linkedItems:[]});}};})},
                      idx>0?{label:"\u2190 Move left",action:function(){reorderSetBlock(sb.id,(setBlocks||[])[idx-1].id);}}:null,
                      idx<(setBlocks||[]).length-1?{label:"\u2192 Move right",action:function(){reorderSetBlock(sb.id,(setBlocks||[])[idx+1].id);}}:null,
                      {divider:true},
                      {label:"Remove",danger:true,action:function(){removeSetBlock(sb.id);}},
                    ].filter(Boolean));}}
                    style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,
                      background:bg+"22",border:"1px solid "+bg+"50",
                      cursor:"grab",userSelect:"none",fontSize:11,fontWeight:600,color:bg}}>
                    {sb.label||(sec?.label)||(sb.type==="break"?"Break":"Block")}
                    <span style={{fontSize:9,color:bg+"99"}}>{"\u2022"} {sb.start}{"\u2013"}{sb.end}</span>
                  </div>
                  <button onClick={function(){removeSetBlock(sb.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:12,padding:"0 2px",lineHeight:1,fontWeight:700}} title="Remove from palette">&#xd7;</button>
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
        {DAYS.map(function(day,di){
          const blocks=getDayBlocks(day);
          var dayDate=week?new Date(week+"T12:00:00"):null;
          if(dayDate){dayDate.setDate(dayDate.getDate()+di);}
          var dateLabel=dayDate?dayDate.toLocaleDateString("en-GB",{day:"numeric",month:"short"}):"";
          var isToday=dayDate&&dayDate.toISOString().slice(0,10)===todayISO();
          return (
            <div key={day} data-ttday={day}>
              <div style={{marginBottom:10,paddingBottom:8,borderBottom:"2px solid "+(isToday?"#C8A86B":"#E3D9CC")}}>
                <span style={{fontFamily:'"Playfair Display",serif',fontWeight:700,fontSize:14,color:isToday?"#C8A86B":"inherit"}}>{day}</span>
                {dateLabel&&<span style={{fontSize:10,color:isToday?"#C8A86B":"#9B8E80",marginLeft:6,fontWeight:isToday?700:400}}>{dateLabel}</span>}
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
                      {linked.map(function(item,i){return (
                        <div key={i} onClick={function(e){e.stopPropagation();if(item.live&&navigateTo)navigateTo({type:item.type,id:item.id});}}
                          style={{fontSize:10,marginTop:3,opacity:item.live?0.8:0.5,display:"flex",alignItems:"center",gap:3,
                            cursor:item.live?"pointer":"default",textDecoration:item.live?"underline":"none",color:"#7A6C5E"}}>
                          {item.type==="task"?"\uD83D\uDCCC ":"\uD83D\uDCDD "}{item.label}
                          {!item.live&&<span style={{fontStyle:"italic"}}> (removed)</span>}
                        </div>
                      );})}
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
                          {item.type==="task"?"\uD83D\uDCCC ":"\uD83D\uDCDD "}{item.label}
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
