// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({sections,setSections,onClose,checkForUpdate,tasks,setTasks,notes,setNotes,tt,setTt,trackers,setTrackers,onRestartTour}) {
  const [tab,        setTab]      = useState("sections");
  const [local,      setLocal]    = useState(sections.map(s=>({...s})));
  const [newLabel,   setNewLabel] = useState("");
  const [newColor,   setNewColor] = useState("#2A7A8A");
  const [appVer,     setAppVer]   = useState(null);
  const [checkState, setCheckState] = useState(null);
  const [delOverlay, setDelOverlay] = useState(null); // {secId, secLabel, secColor}
  const [backupHrs,  setBackupHrs]  = useState(DEFAULT_BACKUP_HOURS);
  const [backupSaved,setBackupSaved]= useState(false);
  var [dataConfirm, setDataConfirm] = useState(null);

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
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:22,maxHeight:320,overflowY:"auto",padding:"2px 0"}}>
          {local.map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,background:"#F3EDE3",borderRadius:10,padding:"10px 12px",flexShrink:0}}>
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
              <button onClick={function(){setDataConfirm("demo");}}
                style={{...S.btnGhost,fontSize:11,padding:"5px 14px",flexShrink:0}}>Load Demo</button>
            </div>
          </div>

          <div style={{background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC",padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#1C1714"}}>Showcase Data</div>
                <div style={{fontSize:11,color:"#6B5E4E",marginTop:2}}>Load a rich, realistic workspace with filled-out tasks, notes, trackers, and a full timetable.</div>
              </div>
              <button onClick={function(){setDataConfirm("showcase");}}
                style={{...S.btnGhost,fontSize:11,padding:"5px 14px",flexShrink:0}}>Load Showcase</button>
            </div>
          </div>

          <div style={{background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC",padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#1C1714"}}>Guided Tour</div>
                <div style={{fontSize:11,color:"#6B5E4E",marginTop:2}}>Restart the onboarding walkthrough with showcase data.</div>
              </div>
              <button onClick={function(){setDataConfirm("tour");}}
                style={{...S.btnGhost,fontSize:11,padding:"5px 14px",flexShrink:0}}>Restart Tour</button>
            </div>
          </div>

          {dataConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(28,23,20,0.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:20}}>
            <div onClick={function(e){e.stopPropagation();}} style={{background:"#FDFAF6",borderRadius:14,padding:"26px 28px",width:420,maxWidth:"100%",boxShadow:"0 28px 72px rgba(0,0,0,0.42)",border:"1px solid #E3D9CC"}}>
              <div style={{fontFamily:'"Playfair Display",serif',fontSize:17,fontWeight:700,color:"#C43A3A",marginBottom:10}}>Replace all data?</div>
              <p style={{fontSize:13,color:"#4A3F30",lineHeight:1.55,marginBottom:6}}>
                <strong style={{color:"#C43A3A"}}>This will permanently delete all your existing tasks, notes, trackers, and timetable data.</strong>
              </p>
              <p style={{fontSize:12,color:"#6B5E4E",lineHeight:1.5,marginBottom:18}}>Consider exporting a backup first using the Data button in the header.</p>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){
                  runBackupIfDue(true);
                  setDataConfirm(null);
                }} style={{...S.btnGhost,flex:1,fontSize:12,padding:"8px 0",background:"#EAF7EF",color:"#1A7A43",border:"1.5px solid #1A7A43"}}>Backup First</button>
                <button onClick={function(){
                  var mode=dataConfirm;
                  setDataConfirm(null);
                  if(mode==="demo"){
                    try{
                      var seed=buildSeedData();
                      setSections(DEFAULT_SECTIONS.map(function(s){return Object.assign({},s);}));
                      setTasks(seed.tasks);setNotes(seed.notes);setTrackers(seed.trackers);setTt(seed.tt);
                      onClose();
                    }catch(e){console.error("Seed data error:",e);}
                  }else if(mode==="showcase"){
                    try{
                      var sc=buildShowcaseData();
                      setSections(sc.sections);setTasks(sc.tasks);setNotes(sc.notes);setTrackers(sc.trackers);setTt(sc.tt);
                      onClose();
                    }catch(e){console.error("Showcase data error:",e);}
                  }else if(mode==="tour"){
                    if(onRestartTour) onRestartTour();
                  }
                }} style={{...S.btnDark,flex:1,fontSize:12,padding:"8px 0",background:"#C43A3A",border:"none"}}>Delete &amp; Replace</button>
                <button onClick={function(){setDataConfirm(null);}} style={{...S.btnGhost,flex:1,fontSize:12,padding:"8px 0"}}>Cancel</button>
              </div>
            </div>
          </div>}

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
