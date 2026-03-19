// ─── Micro components ─────────────────────────────────────────────────────────

function Dot({color,size=9})     { return <div style={{width:size,height:size,borderRadius:"50%",background:color,flexShrink:0}}/>; }
function Badge({bg,fg,children}) { return <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:bg,color:fg,fontWeight:700}}>{children}</span>; }
function Cap({children})         { return <div style={{fontWeight:700,fontSize:11,color:"#7A6C5E",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:10}}>{children}</div>; }
function AutostartToggle() {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      window.__TAURI__.autostart.isEnabled()
        .then(v => { setEnabled(v); setLoading(false); })
        .catch(() => setLoading(false));
    } catch { setLoading(false); }
  }, []);

  async function toggle() {
    if (!window.__TAURI__?.autostart) return;
    if (enabled) {
      await window.__TAURI__.autostart.disable();
    } else {
      await window.__TAURI__.autostart.enable();
    }
    setEnabled(v => !v);
  }

  if (loading) return null;

  // Dev server has a port (e.g. http://localhost:1420).
  // Production is served from http://tauri.localhost with no port.
  const isDev = !!window.location.port;
  if (isDev) return (
    <div style={{padding:"10px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC",fontSize:12,color:"#9B8E80"}}>
      Launch on startup — not available in dev mode
    </div>
  );

  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#F3EDE3",borderRadius:9,border:"1px solid #E3D9CC"}}>
      <button onClick={toggle} style={{width:18,height:18,borderRadius:4,border:`2px solid ${enabled?"#1A7A43":"#C2B49E"}`,background:enabled?"#1A7A43":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>
        {enabled?"✓":""}
      </button>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:"#1C1714"}}>Launch on startup</div>
        <div style={{fontSize:11,color:"#9B8E80"}}>Start minimised to tray when you log in</div>
      </div>
    </div>
  );
}
function Pill({active,onClick,children}) {
  return <button onClick={onClick} style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,border:active?"2px solid #1C1714":"1.5px solid #D6CEC3",background:active?"#1C1714":"transparent",color:active?"#F8F3EC":"#6B5E4E"}}>{children}</button>;
}
function Empty({icon,text,sub}) {
  return (
    <div style={{background:"#EBE4D8",borderRadius:14,padding:"36px 28px",textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:600,color:"#4A3F30"}}>{text}</div>
      {sub&&<div style={{fontSize:12,color:"#9B8E80",marginTop:6}}>{sub}</div>}
    </div>
  );
}
function Overlay({onClose,children,width=420,maxHeight="88vh"}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(28,23,20,0.68)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF6",borderRadius:14,padding:"26px 28px",width,maxWidth:"100%",maxHeight,overflowY:"auto",boxShadow:"0 28px 72px rgba(0,0,0,0.42)",border:"1px solid #E3D9CC"}}>
        {children}
      </div>
    </div>
  );
}

// ─── Color Picker ─────────────────────────────────────────────────────────────
// Unified swatches + recent colors + custom input.
// Usage: <ColorPicker value={color} onChange={setColor}/>

function ColorPicker({value, onChange, label}) {
  const inputRef = React.useRef(null);

  // Persist last-used colors in sessionStorage
  function getRecent(){ try{ return JSON.parse(sessionStorage.getItem("py-recent-colors")||"[]"); }catch{ return []; } }
  function addRecent(c){
    const prev=getRecent().filter(x=>x!==c);
    const next=[c,...prev].slice(0,6);
    try{ sessionStorage.setItem("py-recent-colors",JSON.stringify(next)); }catch{}
  }
  const [recent, setRecent] = useState(()=>getRecent());

  function pick(c){ onChange(c); addRecent(c); setRecent(getRecent()); }

  const Swatch=({c,size=18,selected})=>(
    <div onClick={()=>pick(c)} title={c}
      style={{width:size,height:size,borderRadius:4,background:c,cursor:"pointer",flexShrink:0,
        border:selected?"2px solid #1C1714":"2px solid transparent",
        boxShadow:selected?"0 0 0 1px #fff inset":"none"}}>
    </div>
  );

  return (
    <div>
      {label&&<span style={S.lbl}>{label}</span>}
      {/* Preset swatches */}
      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
        {PRESET_COLORS.map(c=><Swatch key={c} c={c} selected={c===value}/>)}
      </div>
      {/* Recent */}
      {recent.length>0&&(
        <div style={{display:"flex",gap:4,marginBottom:6,alignItems:"center"}}>
          <span style={{fontSize:9,color:"#9B8E80",textTransform:"uppercase",letterSpacing:"0.4px",flexShrink:0}}>Recent</span>
          {recent.map(c=><Swatch key={c} c={c} size={14} selected={c===value}/>)}
        </div>
      )}
      {/* Custom */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:6,background:value,border:"2px solid rgba(0,0,0,0.15)",cursor:"pointer",flexShrink:0}}
          onClick={()=>inputRef.current?.click()}/>
        <input ref={inputRef} type="color" value={value} onChange={e=>pick(e.target.value)}
          style={{opacity:0,position:"absolute",pointerEvents:"none",width:1,height:1}}/>
        <input value={value} onChange={e=>{ if(/^#[0-9a-fA-F]{6}$/.test(e.target.value)) pick(e.target.value); }}
          placeholder="#000000" maxLength={7}
          style={{...S.input,marginBottom:0,flex:1,padding:"5px 10px",fontSize:12,fontFamily:"monospace"}}/>
      </div>
    </div>
  );
}

// ─── Time Picker ─────────────────────────────────────────────────────────────

function TimePicker({value, onChange, label}) {
  const [phase, setPhase] = useState("hour");
  const [open,  setOpen]  = useState(false);
  const [use12, setUse12] = useState(()=>{ try{ return sessionStorage.getItem("py-time-12h")==="1"; }catch{ return false; } });
  const [dropPos, setDropPos] = useState({top:0,left:0});
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);
  const dropRef = React.useRef(null);

  const [hStr, mStr] = (value||"09:00").split(":");
  const curH = parseInt(hStr)||0;
  const curM = parseInt(mStr)||0;

  // Listen for 12h/24h changes from other TimePicker instances
  useEffect(()=>{
    function onStorage(e){ if(e.key==="py-time-12h") setUse12(e.newValue==="1"); }
    window.addEventListener("storage",onStorage);
    // Also listen for custom event (same-window sync)
    function onCustom(e){ setUse12(e.detail); }
    window.addEventListener("py-time-toggle",onCustom);
    return()=>{ window.removeEventListener("storage",onStorage); window.removeEventListener("py-time-toggle",onCustom); };
  },[]);

  function toggle12(){
    const v=!use12; setUse12(v);
    try{ sessionStorage.setItem("py-time-12h",v?"1":"0"); }catch{}
    window.dispatchEvent(new CustomEvent("py-time-toggle",{detail:v}));
  }

  useEffect(()=>{
    if(!open) return;
    function handler(e){
      const inRef = ref.current && ref.current.contains(e.target);
      const inDrop = dropRef.current && dropRef.current.contains(e.target);
      if(!inRef && !inDrop){ setOpen(false); setPhase("hour"); }
    }
    window.addEventListener("mousedown",handler);
    return()=>window.removeEventListener("mousedown",handler);
  },[open]);

  function pickHour(h24){ onChange(`${String(h24).padStart(2,"0")}:${String(curM).padStart(2,"0")}`); setPhase("minute"); }
  // Switch AM/PM without changing phase
  function setAmPm(wantPm){
    const h12=curH%12;
    const newH=wantPm?h12+12:h12;
    if(newH!==curH) onChange(`${String(newH).padStart(2,"0")}:${String(curM).padStart(2,"0")}`);
  }
  function pickMinute(m){ onChange(`${String(curH).padStart(2,"0")}:${String(m).padStart(2,"0")}`); setOpen(false); setPhase("hour"); }

  function displayVal(){
    if(!use12) return value||"00:00";
    const h=curH%12||12, ampm=curH<12?"AM":"PM";
    return `${h}:${String(curM).padStart(2,"0")} ${ampm}`;
  }

  function HourDial(){
    const SIZE=200, CX=100, CY=100;
    const OUTER_R=80, INNER_R=52;
    const hours=[];
    if(use12){
      // 12h: single ring of 1-12, AM/PM handled by separate buttons
      for(let h=1;h<=12;h++){
        const a=(h/12)*2*Math.PI-Math.PI/2;
        // In AM: 12=0, 1-11=1-11. In PM: 12=12, 1-11=13-23
        const isPm=curH>=12;
        const h24=h===12?(isPm?12:0):(isPm?h+12:h);
        hours.push({h24,label:String(h),x:CX+OUTER_R*Math.cos(a),y:CY+OUTER_R*Math.sin(a),ring:"outer"});
      }
    } else {
      // 24h: outer ring 1-12, inner ring 13-0 aligned (13 under 1, 14 under 2, etc.)
      for(let h=1;h<=12;h++){
        const a=(h/12)*2*Math.PI-Math.PI/2;
        hours.push({h24:h,label:String(h),x:CX+OUTER_R*Math.cos(a),y:CY+OUTER_R*Math.sin(a),ring:"outer"});
      }
      for(let h=1;h<=12;h++){
        const a=(h/12)*2*Math.PI-Math.PI/2;
        const h24=h===12?0:h+12; // 13 under 1, 14 under 2, ..., 0 under 12
        hours.push({h24,label:String(h24),x:CX+INNER_R*Math.cos(a),y:CY+INNER_R*Math.sin(a),ring:"inner"});
      }
    }
    const centerLabel=use12?`${curH%12||12}:${String(curM).padStart(2,"0")} ${curH<12?"AM":"PM"}`:`${String(curH).padStart(2,"0")}:${String(curM).padStart(2,"0")}`;
    return (
      <svg width={SIZE} height={SIZE} style={{display:"block",margin:"0 auto",cursor:"pointer"}}>
        <circle cx={CX} cy={CY} r={92} fill="#F3EDE3" stroke="#E3D9CC" strokeWidth={1}/>
        {hours.map(({h24,label,x,y,ring})=>{
          const sel=h24===curH;
          return (
            <g key={h24+"-"+ring} onClick={()=>pickHour(h24)}>
              <circle cx={x} cy={y} r={ring==="outer"?18:15} fill={sel?"#1C1714":"transparent"} stroke="none"/>
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fontSize={ring==="outer"?13:11} fontWeight={sel?700:500}
                fill={sel?"#F8F3EC":"#4A3F30"} fontFamily='"DM Sans",sans-serif'>{label}</text>
            </g>
          );
        })}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
          fontSize={use12?11:10} fill="#9B8E80" fontFamily='"DM Sans",sans-serif'>{centerLabel}</text>
      </svg>
    );
  }

  function MinuteDial(){
    const SIZE=200, CX=100, CY=100, R=78;
    const mins=[0,5,10,15,20,25,30,35,40,45,50,55];
    return (
      <svg width={SIZE} height={SIZE} style={{display:"block",margin:"0 auto",cursor:"pointer"}}>
        <circle cx={CX} cy={CY} r={92} fill="#F3EDE3" stroke="#E3D9CC" strokeWidth={1}/>
        {mins.map((m,i)=>{
          const a=(i/12)*2*Math.PI-Math.PI/2;
          const x=CX+R*Math.cos(a), y=CY+R*Math.sin(a), sel=m===curM;
          return (
            <g key={m} onClick={()=>pickMinute(m)}>
              <circle cx={x} cy={y} r={18} fill={sel?"#1C1714":"transparent"} stroke="none"/>
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fontSize={12} fontWeight={sel?700:500}
                fill={sel?"#F8F3EC":"#4A3F30"} fontFamily='"DM Sans",sans-serif'>
                :{String(m).padStart(2,"0")}
              </text>
            </g>
          );
        })}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
          fontSize={10} fill="#9B8E80" fontFamily='"DM Sans",sans-serif'>
          {String(curH).padStart(2,"0")}:{String(curM).padStart(2,"0")}
        </text>
      </svg>
    );
  }

  return (
    <div ref={ref} style={{position:"relative",flex:1}}>
      {label&&<span style={S.lbl}>{label}</span>}
      <button ref={btnRef} onClick={()=>{
          if(!open && btnRef.current){
            const r=btnRef.current.getBoundingClientRect();
            const spaceBelow=window.innerHeight-r.bottom-8;
            const dropH=290;
            if(spaceBelow>=dropH) setDropPos({top:r.bottom+4,left:r.left});
            else setDropPos({top:r.top-dropH-4,left:r.left});
          }
          setOpen(function(v){return !v;}); setPhase("hour");
        }}
        style={{...S.input,marginBottom:0,display:"flex",alignItems:"center",justifyContent:"space-between",
          cursor:"pointer",fontWeight:600,fontSize:14,color:"#1C1714",width:"100%",textAlign:"left",padding:"8px 12px"}}>
        <span>{displayVal()}</span>
        <span style={{fontSize:10,color:"#9B8E80"}}>{open?"▲":"▼"}</span>
      </button>
      {open&&ReactDOM.createPortal(
        <div ref={dropRef} style={{position:"fixed",top:dropPos.top,left:dropPos.left,zIndex:9999,background:"#FDFAF6",
          borderRadius:12,border:"1.5px solid #E3D9CC",boxShadow:"0 8px 28px rgba(0,0,0,0.18)",
          padding:"10px",width:220}}>
          {/* Controls row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>setPhase("hour")}
                style={{...S.btnMicro,background:phase==="hour"?"#1C1714":"#EBE4D8",color:phase==="hour"?"#F8F3EC":"#4A3F30",padding:"3px 10px",fontSize:11}}>Hr</button>
              <button onClick={()=>setPhase("minute")}
                style={{...S.btnMicro,background:phase==="minute"?"#1C1714":"#EBE4D8",color:phase==="minute"?"#F8F3EC":"#4A3F30",padding:"3px 10px",fontSize:11}}>Min</button>
            </div>
            <button onClick={toggle12}
              style={{...S.btnMicro,background:"#EBE4D8",color:"#4A3F30",padding:"3px 10px",fontSize:11}}>
              {use12?"12h":"24h"}
            </button>
          </div>
          {use12&&phase==="hour"&&(
            <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:6}}>
              <button onClick={()=>setAmPm(false)}
                style={{...S.btnMicro,background:curH<12?"#1C1714":"#EBE4D8",color:curH<12?"#F8F3EC":"#4A3F30",flex:1,padding:"4px 0"}}>AM</button>
              <button onClick={()=>setAmPm(true)}
                style={{...S.btnMicro,background:curH>=12?"#1C1714":"#EBE4D8",color:curH>=12?"#F8F3EC":"#4A3F30",flex:1,padding:"4px 0"}}>PM</button>
            </div>
          )}
          {phase==="hour"?<HourDial/>:<MinuteDial/>}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenu({x, y, items, onClose}) {
  const menuRef  = useRef();
  const [subIdx, setSubIdx]     = useState(null);
  const [subAnchor, setSubAnchor] = useState(null);
  const [adj, setAdj] = useState({left:x, top:y, opacity:0});
  const MENU_W = 204;

  useEffect(()=>{
    const onKey  = e => { if(e.key==="Escape") onClose(); };
    const onDown = e => { if(menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return ()=>{ window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  },[]);

  useEffect(()=>{
    if(!menuRef.current) return;
    const {width,height} = menuRef.current.getBoundingClientRect();
    const vw=window.innerWidth, vh=window.innerHeight;
    setAdj({ left: x+width  > vw-8 ? Math.max(8, x-width)  : x,
             top:  y+height > vh-8 ? Math.max(8, y-height) : y,
             opacity: 1 });
  },[]);

  return (
    <div ref={menuRef} style={{position:"fixed",left:adj.left,top:adj.top,opacity:adj.opacity,
      zIndex:500,background:"#FDFAF6",borderRadius:10,border:"1px solid #E3D9CC",
      boxShadow:"0 8px 32px rgba(0,0,0,0.22)",minWidth:MENU_W,padding:"4px 0",
      fontFamily:'"DM Sans",sans-serif',userSelect:"none",transition:"opacity 0.08s"}}>
      {items.map((item,i)=>{
        if(item.divider) return <div key={i} style={{height:1,background:"#E3D9CC",margin:"3px 0"}}/>;
        const isHov = subIdx===i;
        return (
          <div key={i}
            onMouseEnter={e=>{ setSubIdx(i); if(item.submenu) setSubAnchor(e.currentTarget.getBoundingClientRect()); }}
            onMouseLeave={()=>{ if(!item.submenu) setSubIdx(null); }}
            onClick={()=>{ if(!item.submenu && item.action){ item.action(); onClose(); } }}
            className="ctx-item"
            style={{padding:"7px 14px 7px 12px",fontSize:12,fontWeight:500,
              color:item.danger?"#C43A3A":"#1C1714",
              cursor:item.submenu?"default":"pointer",
              display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,
              background:isHov?(item.danger?"#FAE0E0":"#F3EDE3"):"transparent",
              borderRadius:6,margin:"0 4px",transition:"background 0.1s"}}>
            <span>{item.label}</span>
            {item.submenu&&<span style={{fontSize:9,opacity:0.4}}>▸</span>}
          </div>
        );
      })}
      {subIdx!==null && items[subIdx]?.submenu && subAnchor && (
        <div onMouseEnter={()=>setSubIdx(subIdx)} onMouseLeave={()=>setSubIdx(null)}
          style={{position:"fixed",left:adj.left+MENU_W-2,top:subAnchor.top,
            zIndex:501,background:"#FDFAF6",borderRadius:10,border:"1px solid #E3D9CC",
            boxShadow:"0 8px 32px rgba(0,0,0,0.22)",minWidth:160,padding:"4px 0",
            fontFamily:'"DM Sans",sans-serif',userSelect:"none"}}>
          {items[subIdx].submenu.map((sub,j)=>(
            <div key={j} onClick={()=>{ sub.action(); onClose(); }}
              className="ctx-sub-item"
              style={{padding:"7px 14px 7px 12px",fontSize:12,fontWeight:500,
                color:"#1C1714",cursor:"pointer",borderRadius:6,margin:"0 4px",
                transition:"background 0.1s"}}>{sub.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── App Dialog (replaces window.alert / window.confirm) ─────────────────────

function AppDialog({dialog,onClose}) {
  if(!dialog) return null;
  const isConfirm=!!dialog.onConfirm;
  return (
    <div onClick={isConfirm?null:onClose} style={{position:"fixed",inset:0,background:"rgba(28,23,20,0.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF6",borderRadius:14,padding:"26px 28px",width:400,maxWidth:"100%",boxShadow:"0 28px 72px rgba(0,0,0,0.42)",border:"1px solid #E3D9CC"}}>
        <div style={{fontFamily:'"Playfair Display",serif',fontSize:17,fontWeight:700,marginBottom:dialog.detail?8:18,color:"#1C1714"}}>{dialog.message}</div>
        {dialog.detail&&<p style={{fontSize:13,color:"#6B5E4E",lineHeight:1.55,marginBottom:20}}>{dialog.detail}</p>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {isConfirm&&<button onClick={dialog.onConfirm} style={{...S.btnDark,flex:1}}>{dialog.confirmLabel||"Confirm"}</button>}
          {dialog.onExtra&&<button onClick={dialog.onExtra} style={{...S.btnDark,flex:1,background:"#4B3FC7"}}>{dialog.extraLabel||"Other"}</button>}
          <button onClick={onClose} style={{...S.btnGhost,flex:isConfirm?0:1}}>{isConfirm?"Cancel":"OK"}</button>
        </div>
      </div>
    </div>
  );
}
