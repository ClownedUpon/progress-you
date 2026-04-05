// ─── Notes View ───────────────────────────────────────────────────────────────

function NotesView({sections,byId,getSectionNotes,addNote,updateNoteField,deleteNote,tasks,setView,initialSecId,initialNoteId,onNoteChange}) {
  const openCtx = React.useContext(CtxMenuCtx);
  const [secId,       setSecId]       =useState(()=>{ const id=initialSecId; return sections.find(s=>s.id===id)?id:sections[0]?.id||""; });
  const [selNoteId,   setSelNoteId]   =useState(initialNoteId||null);
  useEffect(function(){if(initialSecId&&sections.find(function(s){return s.id===initialSecId;})){setSecId(initialSecId);}if(initialNoteId){setSelNoteId(initialNoteId);}},[initialSecId,initialNoteId]);
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
            {label:"New child note", action:()=>{var nid=addNote(secId,node.id);if(nid)setSelNoteId(nid);}},
            {label:"Duplicate",      action:()=>{var nid=addNote(secId,node.parentId||null,{title:node.title+" (copy)",content:node.content});if(nid)setSelNoteId(nid);}},
            {divider:true},
            {label:"Delete",danger:true,action:()=>handleDelete(node.id)},
          ]); }}>
          <button onClick={e=>{e.stopPropagation();toggleCollapse(node.id);}}
            style={{width:14,height:14,border:"none",background:"transparent",color:"inherit",fontSize:9,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:children.length?1:0.2}}>
            {children.length?(isOpen?"▾":"▸"):"·"}
          </button>
          <span style={{fontSize:12,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isActive?600:400}}>{node.title||"Untitled"}</span>
          <div className="note-actions">
            <button className="note-act-btn" title="Add sub-note" onClick={e=>{e.stopPropagation();var nid=addNote(secId,node.id);if(nid)setSelNoteId(nid);}}>+</button>
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
      <div style={{display:"flex",alignItems:"stretch",background:"#1C1714",flexShrink:0,flexWrap:"wrap",padding:"0 6px"}}>
        {sections.map(s=>{
          const active=secId===s.id;
          return (
            <button key={s.id} onClick={()=>{setSecId(s.id);setSelNoteId(null);setConfirmDel(null);}} style={{padding:"10px 16px",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",background:active?s.color:"transparent",color:active?textFor(s.color):"#7A6C5E",borderBottom:active?"3px solid "+s.color:"3px solid transparent",transition:"all 0.15s"}}>{s.label}</button>
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
            <button onClick={()=>{var nid=addNote(secId,selNote?selNote.parentId:null);if(nid)setSelNoteId(nid);}} style={{...S.btnDark,flex:1,background:sec.color,padding:"7px 0",fontSize:11}}>+ Note</button>
            <button onClick={()=>{ if(selNote){var nid=addNote(secId,selNote.id);if(nid)setSelNoteId(nid);} }} style={{...S.btnGhost,padding:"7px 10px",fontSize:11,opacity:selNote?1:0.45}}>+Child</button>
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
  var openCtx=React.useContext(CtxMenuCtx);
  var navCtx=React.useContext(NavCtx)||{};
  var navTo=navCtx.navigateTo;
  var navigateToDate=navCtx.navigateToDate;
  var titleRef     =useRef(null);
  var saveTimer    =useRef(null);
  var titleTimer   =useRef(null);
  var [saved,        setSaved]        =useState(true);
  var [titleVal,     setTitleVal]     =useState(note.title||"");
  var [selColor,     setSelColor]     =useState("#1C1714");
  var [showClr,      setShowClr]      =useState(false);
  var [fmtState,     setFmtState]     =useState({bold:false,italic:false,underline:false,heading:0,bulletList:false,orderedList:false,subscript:false,superscript:false,highlight:false,taskList:false,codeBlock:false,textAlign:"left",inTable:false,fontSize:null});
  var [tagInput,     setTagInput]     =useState("");
  var [showTagInput, setShowTagInput] =useState(false);
  var [remindAt,     setRemindAt]     =useState(note.remindAt||"");
  var [taskSearch,   setTaskSearch]   =useState("");
  var [showTaskPick, setShowTaskPick] =useState(false);
  var [showDatePick, setShowDatePick] =useState(false);
  var [datePickVal,  setDatePickVal]  =useState(todayISO());
  var [slashOpen,    setSlashOpen]    =useState(false);
  var [slashPos,     setSlashPos]     =useState(null);
  var [slashQuery,   setSlashQuery]   =useState("");
  var [slashIdx,     setSlashIdx]     =useState(0);
  var slashRange     =useRef(null);
  var [showCustomize,setShowCustomize]=useState(false);
  var [toolbarPref,  setToolbarPref]  =useState(null);
  var editorWrapRef  =useRef(null);
  var tags=note.tags||[];
  var filteredTasks=(tasks||[]).filter(function(t){ return t.type!=="spacer"&&t.status!=="done"&&
    !(note.linkedTaskIds||[]).includes(t.id)&&
    (!taskSearch||t.title.toLowerCase().includes(taskSearch.toLowerCase()));
  }).slice(0,10);

  var editorExtensions = useMemo(function() {
    if (!TiptapPlaceholder) return [];
    return TIPTAP_BASE_EXTENSIONS.concat([
      TiptapPlaceholder.configure({ placeholder: "Start writing, or type / for commands\u2026" }),
    ]);
  }, []);

  function handlePasteImage(view, event) {
    var items = event.clipboardData && event.clipboardData.items;
    if (!items) return false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) {
        event.preventDefault();
        var blob = items[i].getAsFile();
        if (!blob) return true;
        var reader = new FileReader();
        reader.onload = function(e) {
          var dataUri = e.target.result;
          if (editor && dataUri) {
            editor.chain().focus().insertContent({
              type: "noteImage",
              attrs: {path: dataUri}
            }).run();
          }
        };
        reader.readAsDataURL(blob);
        return true;
      }
    }
    return false;
  }

  var editor = useEditor({
    extensions: editorExtensions,
    content: note.content || "<p></p>",
    editorProps: {
      handlePaste: handlePasteImage,
    },
    onUpdate: function(ctx) {
      setSaved(false);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(function() {
        onContentChange(ctx.editor.getHTML());
        setSaved(true);
      }, 500);
    },
    onSelectionUpdate: function(ctx) {
      var ed = ctx.editor;
      var fsAttr = ed.getAttributes("fontSize");
      setFmtState({
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        heading: ed.isActive("heading", {level:1}) ? 1 : ed.isActive("heading", {level:2}) ? 2 : ed.isActive("heading", {level:3}) ? 3 : 0,
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        subscript: ed.isActive("subscript"),
        superscript: ed.isActive("superscript"),
        highlight: ed.isActive("highlight"),
        taskList: ed.isActive("taskList"),
        codeBlock: ed.isActive("codeBlock"),
        textAlign: ed.getAttributes("paragraph").textAlign || ed.getAttributes("heading").textAlign || "left",
        inTable: ed.isActive("table"),
        fontSize: (fsAttr && fsAttr.size) ? fsAttr.size : null,
      });
    },
    editorProps: {
      attributes: { class: "note-editor", style: "padding:20px 24px;font-family:\"DM Sans\",sans-serif;font-size:13px;color:#1C1714;line-height:1.65;outline:none;flex:1;overflow-y:auto;" },
      handleContextMenu: function(view, pos, event) {
        if (!editor) return false;
        event.preventDefault();
        var sel = view.state.selection;
        var hasSelection = !sel.empty;
        var ctxItems = [];
        if (hasSelection) {
          ctxItems.push({label:"Cut", action:function(){ document.execCommand("cut"); }});
          ctxItems.push({label:"Copy", action:function(){ document.execCommand("copy"); }});
        }
        ctxItems.push({label:"Paste", action:function(){ navigator.clipboard.readText().then(function(txt){ if(txt && editor) editor.chain().focus().insertContent(txt).run(); }); }});
        ctxItems.push({divider:true});
        ctxItems.push({label:"Select All", action:function(){ editor.chain().focus().selectAll().run(); }});
        if (hasSelection) {
          ctxItems.push({divider:true});
          ctxItems.push({label:"Bold", action:function(){ editor.chain().focus().toggleBold().run(); }});
          ctxItems.push({label:"Italic", action:function(){ editor.chain().focus().toggleItalic().run(); }});
          ctxItems.push({label:"Underline", action:function(){ editor.chain().focus().toggleUnderline().run(); }});
          ctxItems.push({label:"Highlight", action:function(){ editor.chain().focus().toggleHighlight().run(); }});
          ctxItems.push({divider:true});
          ctxItems.push({label:"Clear Formatting", action:function(){ editor.chain().focus().unsetAllMarks().clearNodes().run(); }});
        }
        if (openCtx) openCtx(event, ctxItems);
        return true;
      },
      handleClick: function(view, pos, event) {
        setShowClr(false); setShowTaskPick(false); setShowDatePick(false);
        var dateChip = event.target.closest(".note-date-chip");
        if (dateChip && dateChip.dataset.date) { if (navigateToDate) navigateToDate(dateChip.dataset.date); return true; }
        var taskChip = event.target.closest(".note-task-chip");
        if (taskChip && taskChip.dataset.taskId) { if (navTo) navTo({type:"task",id:taskChip.dataset.taskId}); return true; }
        var delBtn = event.target.closest(".note-collapse-del");
        if (delBtn) {
          var colNode = event.target.closest(".note-collapse");
          if (colNode) {
            var domPos = view.posAtDOM(colNode, 0);
            var resolved = view.state.doc.resolve(domPos);
            var nodePos = resolved.before(resolved.depth);
            view.dispatch(view.state.tr.delete(nodePos, nodePos + view.state.doc.nodeAt(nodePos).nodeSize));
          }
          return true;
        }
        var head = event.target.closest(".note-collapse-head");
        if (head) {
          var col = head.closest(".note-collapse");
          if (col) {
            var cDomPos = view.posAtDOM(col, 0);
            var foundPos = null;
            var foundNode = null;
            view.state.doc.descendants(function(node, npos) {
              if (foundPos !== null) return false;
              if (node.type.name === "collapsible" && npos <= cDomPos && npos + node.nodeSize > cDomPos) {
                foundPos = npos;
                foundNode = node;
                return false;
              }
            });
            if (foundNode) {
              view.dispatch(view.state.tr.setNodeMarkup(foundPos, null, Object.assign({}, foundNode.attrs, {open: !foundNode.attrs.open})));
            }
          }
          return true;
        }
        return false;
      },
      handleKeyDown: function(view, event) {
        // Slash command handling
        if (slashOpen) {
          if (event.key === "Escape") { setSlashOpen(false); slashRange.current = null; return true; }
          if (event.key === "ArrowDown") { event.preventDefault(); setSlashIdx(function(i) { return (i + 1) % slashFiltered.length; }); return true; }
          if (event.key === "ArrowUp") { event.preventDefault(); setSlashIdx(function(i) { return (i - 1 + slashFiltered.length) % slashFiltered.length; }); return true; }
          if (event.key === "Enter" || event.key === "Tab") { event.preventDefault(); executeSlashCommand(slashFiltered[slashIdx]); return true; }
          if (event.key === "Backspace") {
            if (slashQuery.length === 0) { setSlashOpen(false); slashRange.current = null; }
          }
        }
        if (event.key === "/" && !slashOpen) {
          var sel = view.state.selection;
          var textBefore = view.state.doc.textBetween(Math.max(0, sel.from - 1), sel.from, " ");
          if (sel.from === 1 || textBefore === " " || textBefore === "\n" || textBefore === "") {
            setTimeout(function() {
              setSlashOpen(true);
              setSlashQuery("");
              setSlashIdx(0);
              slashRange.current = { from: sel.from, to: sel.from };
              var coords = view.coordsAtPos(sel.from);
              setSlashPos({ top: coords.bottom + 4, left: coords.left });
            }, 0);
          }
        }
        // Backspace at start of empty paragraph after task list: just delete the paragraph
        if (event.key === "Backspace" && !slashOpen) {
          var bSel = view.state.selection;
          var bPos = bSel.$from;
          if (bSel.empty && bPos.parentOffset === 0 && bPos.parent.type.name === "paragraph" && bPos.parent.content.size === 0) {
            var bBefore = bPos.before(bPos.depth);
            if (bBefore > 0) {
              var nodeBefore = view.state.doc.resolve(bBefore).nodeBefore;
              if (nodeBefore && nodeBefore.type.name === "taskList") {
                view.dispatch(view.state.tr.delete(bBefore, bBefore + bPos.parent.nodeSize));
                return true;
              }
            }
          }
        }
        return false;
      },
      handleTextInput: function(view, from, to, text) {
        if (slashOpen) {
          setTimeout(function() {
            var sr = slashRange.current;
            if (!sr) return;
            var newText = view.state.doc.textBetween(sr.from, view.state.selection.from, "");
            setSlashQuery(newText);
            setSlashIdx(0);
          }, 0);
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  // Restore image srcs after editor mounts
  useEffect(function() {
    if (!editor) return;
    var timer = setTimeout(function() {
      restoreNoteImages(editor.view.dom);
    }, 50);
    return function() { clearTimeout(timer); };
  }, [editor]);

  useEffect(function() { if(focusTitle&&titleRef.current){ titleRef.current.focus(); titleRef.current.select(); if (onFocusTitleDone) onFocusTitleDone(); } },[focusTitle]);

  // Load toolbar customization preference
  useEffect(function() {
    sget("py-editor-toolbar").then(function(v) { if (v) setToolbarPref(v); }).catch(function(){});
  }, []);

  // Slash command items
  var SLASH_ITEMS = [
    { id:"h1", label:"Heading 1", icon:"\u0048\u2081", run: function(ed) { ed.chain().focus().toggleHeading({level:1}).run(); } },
    { id:"h2", label:"Heading 2", icon:"\u0048\u2082", run: function(ed) { ed.chain().focus().toggleHeading({level:2}).run(); } },
    { id:"h3", label:"Heading 3", icon:"\u0048\u2083", run: function(ed) { ed.chain().focus().toggleHeading({level:3}).run(); } },
    { id:"bullet", label:"Bullet List", icon:"\u2022", run: function(ed) { ed.chain().focus().toggleBulletList().run(); } },
    { id:"ordered", label:"Numbered List", icon:"1.", run: function(ed) { ed.chain().focus().toggleOrderedList().run(); } },
    { id:"callout", label:"Callout", icon:"\uD83D\uDCA1", run: function(ed) { ed.chain().focus().insertContent({type:"callout",content:[{type:"text",text:"Callout text\u2026"}]}).run(); } },
    { id:"collapse", label:"Collapsible", icon:"\u25B6", run: function(ed) { ed.chain().focus().insertContent({type:"collapsible",content:[{type:"collapsibleTitle",content:[{type:"text",text:"Section title"}]},{type:"collapsibleBody",content:[{type:"paragraph",content:[{type:"text",text:"Content here\u2026"}]}]}]}).run(); } },
    { id:"date", label:"Date", icon:"\uD83D\uDCC5", run: "date" },
    { id:"task", label:"Task Link", icon:"\uD83D\uDCCC", run: "task" },
    { id:"image", label:"Image", icon:"\uD83D\uDDBC", run: "image" },
    { id:"tasklist", label:"Task List", icon:"\u2611", run: function(ed) { ed.chain().focus().toggleTaskList().run(); } },
    { id:"codeblock", label:"Code Block", icon:"</>", run: function(ed) { ed.chain().focus().toggleCodeBlock().run(); } },
    { id:"hr", label:"Horizontal Rule", icon:"\u2015", run: function(ed) { ed.chain().focus().setHorizontalRule().run(); } },
    { id:"table", label:"Table (3x3)", icon:"\u25A6", run: function(ed) { ed.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run(); } },
    { id:"highlight", label:"Highlight", icon:"\uD83D\uDD8D", run: function(ed) { ed.chain().focus().toggleHighlight().run(); } },
    { id:"sub", label:"Subscript", icon:"X\u2082", run: function(ed) { ed.chain().focus().toggleSubscript().run(); } },
    { id:"super", label:"Superscript", icon:"X\u00B2", run: function(ed) { ed.chain().focus().toggleSuperscript().run(); } },
  ];
  var slashFiltered = SLASH_ITEMS.filter(function(item) {
    return !slashQuery || item.label.toLowerCase().includes(slashQuery.toLowerCase());
  });

  function executeSlashCommand(item) {
    if (!item || !editor) return;
    // Delete the slash and query text
    var sr = slashRange.current;
    if (sr) {
      editor.chain().focus().deleteRange({ from: sr.from, to: editor.state.selection.from }).run();
    }
    setSlashOpen(false);
    slashRange.current = null;

    if (typeof item.run === "function") {
      item.run(editor);
    } else if (item.run === "date") {
      setShowDatePick(true);
    } else if (item.run === "task") {
      setShowTaskPick(true);
    } else if (item.run === "image") {
      doInsertImage();
    }
  }

  var schedTitleSave = function(v) { setSaved(false); clearTimeout(titleTimer.current); titleTimer.current=setTimeout(function(){ onTitleChange(v); setSaved(true); },400); };

  function insertDateChip(date) {
    if (!editor) return;
    editor.chain().focus().insertContent({ type: "dateChip", attrs: { date: date } }).run();
    setShowDatePick(false);
  }
  function insertTaskChip(task) {
    if (!editor) return;
    editor.chain().focus().insertContent({ type: "taskChip", attrs: { taskId: task.id, snapshot: task.title } }).run();
    if (updateNoteField) updateNoteField(secId, note.id, {linkedTaskIds: (note.linkedTaskIds||[]).concat([task.id])});
    setTaskSearch(""); setShowTaskPick(false);
  }
  function doInsertImage() {
    if (!window.__TAURI__ || !window.__TAURI__.dialog) return;
    window.__TAURI__.dialog.open({filters:[{name:"Images",extensions:["png","jpg","jpeg","gif","webp","svg"]}],multiple:false}).then(function(path) {
      if (!path || !editor) return;
      editor.chain().focus().insertContent({ type: "noteImage", attrs: { path: path } }).run();
      // Restore the image src after insert
      setTimeout(function() { restoreNoteImages(editor.view.dom); }, 50);
    }).catch(function() {});
  }
  function addTag(tag) {
    var t = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t)) return;
    if (updateNoteField) updateNoteField(secId, note.id, {tags: tags.concat([t])});
    setTagInput(""); setShowTagInput(false);
  }
  function removeTag(tag) { if (updateNoteField) updateNoteField(secId, note.id, {tags: tags.filter(function(t){return t!==tag;})}); }

  var applyColor = function(v) { setSelColor(v); if (editor) editor.chain().focus().setColor(v).run(); setShowClr(false); };
  var sep = <div style={{width:1,height:18,background:"#D6CEC3",flexShrink:0,margin:"0 2px"}}/>;

  // Toolbar visibility helper
  var visibleSet = toolbarPref && toolbarPref.visible ? toolbarPref.visible : null;
  var isVis = function(id) { return !visibleSet || visibleSet.indexOf(id) !== -1; };

  // Compute the unified format dropdown value
  var fmtDropVal = fmtState.heading ? "h" + fmtState.heading : fmtState.fontSize === "11px" ? "small" : fmtState.fontSize === "16px" ? "large" : "p";

  // Save toolbar pref
  var saveToolbarPref = function(newPref) { setToolbarPref(newPref); sset("py-editor-toolbar", newPref); };

  // Character count
  var charCount = editor && editor.storage && editor.storage.characterCount ? editor.storage.characterCount.characters() : 0;
  var wordCount = editor && editor.storage && editor.storage.characterCount ? editor.storage.characterCount.words() : 0;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Title + tags */}
      <div style={{padding:"16px 24px 0",borderBottom:"1px solid #EBE4D8",flexShrink:0}}>
        <input ref={titleRef} value={titleVal} onChange={function(e){setTitleVal(e.target.value);schedTitleSave(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") e.currentTarget.blur();}} placeholder="Note title\u2026"
          style={{...S.input,marginBottom:0,border:"none",background:"transparent",fontSize:17,fontWeight:700,fontFamily:'"Playfair Display",serif',padding:"0 0 8px",borderRadius:0}}/>
        <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",paddingBottom:10,minHeight:28}}>
          {tags.map(function(tag){return (
            <span key={tag} style={{display:"inline-flex",alignItems:"center",gap:3,background:"#EBE4D8",color:"#4A3F30",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:600}}>
              #{tag}
              <button onClick={function(){removeTag(tag);}} style={{background:"none",border:"none",cursor:"pointer",padding:"0 0 0 3px",fontSize:9,color:"#9B8E80",lineHeight:1}}>&#x2715;</button>
            </span>
          );})}
          {showTagInput?(
            <div style={{position:"relative",display:"inline-block"}}>
              <input value={tagInput} onChange={function(e){setTagInput(e.target.value);}}
                onKeyDown={function(e){ if(e.key==="Enter"&&tagInput.trim()) addTag(tagInput); if(e.key==="Escape") setShowTagInput(false); }}
                onBlur={function(e){ if(!e.relatedTarget||!e.relatedTarget.classList||!e.relatedTarget.classList.contains("tag-sug-item")){ if(tagInput.trim()) addTag(tagInput); else setShowTagInput(false); } }}
                placeholder="tag-name\u2026" autoFocus
                style={{...S.input,marginBottom:0,width:110,padding:"2px 8px",fontSize:11,display:"inline-block"}}/>
              {(allTags||[]).filter(function(t){return !tags.includes(t)&&(!tagInput||t.includes(tagInput.toLowerCase()));}).length>0&&(
                <div style={{position:"absolute",top:"calc(100% + 3px)",left:0,zIndex:300,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:8,padding:"4px",minWidth:130,boxShadow:"0 4px 14px rgba(0,0,0,0.11)"}}>
                  {(allTags||[]).filter(function(t){return !tags.includes(t)&&(!tagInput||t.includes(tagInput.toLowerCase()));}).map(function(t){return (
                    <div key={t} className="tag-sug-item" tabIndex={-1}
                      onMouseDown={function(e){e.preventDefault();addTag(t);}}
                      style={{padding:"4px 8px",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,color:"#4A3F30"}}
                      onMouseEnter={function(e){e.currentTarget.style.background="#EBE4D8";}}
                      onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
                      #{t}
                    </div>
                  );})}
                </div>
              )}
            </div>
          ):(
            <button onClick={function(){setShowTagInput(true);}} style={{...S.btnMicro,fontSize:10,padding:"2px 7px",borderRadius:20,border:"1px dashed #C2B49E",background:"transparent",color:"#9B8E80"}}>+ tag</button>
          )}
        </div>
        {/* Reminder */}
        <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:10}}>
          <span style={{fontSize:11,fontWeight:600,color:note.remindFired?"#1A7A43":"#7A6C5E",flexShrink:0}}>{note.remindFired?"Reminded":"Remind at"}</span>
          <input type="datetime-local" value={remindAt}
            onChange={function(e){ var v=e.target.value||null; setRemindAt(v||""); if(updateNoteField) updateNoteField(secId,note.id,{remindAt:v,remindFired:false}); }}
            style={{...S.input,marginBottom:0,flex:1,padding:"3px 8px",fontSize:11,background:note.remindFired?"#EAF7EF":""}}/>
          {remindAt&&<button onClick={function(){ setRemindAt(""); if(updateNoteField) updateNoteField(secId,note.id,{remindAt:null,remindFired:false}); }}
            style={{background:"none",border:"none",cursor:"pointer",color:"#C43A3A",fontSize:12,padding:0,flexShrink:0}}>&#xd7;</button>}
        </div>
      </div>
      {/* Toolbar */}
      <div style={{borderBottom:"1px solid #E3D9CC",flexShrink:0}}>
        {/* Row 1: Text formatting */}
        <div style={{display:"flex",alignItems:"center",gap:3,padding:"5px 12px",background:"#F3EDE3",flexWrap:"wrap"}}>
          {isVis("font")&&<select className="tb-sel" defaultValue={EDITOR_FONTS[0].value} onChange={function(e){ if(editor) editor.chain().focus().setFontFamily(e.target.value).run(); }}>
            {EDITOR_FONTS.map(function(f){return <option key={f.value} value={f.value}>{f.label}</option>;})}
          </select>}
          {isVis("format")&&<select className="tb-sel" value={fmtDropVal} onChange={function(e){ if(!editor) return; var v=e.target.value; if(v==="p"){editor.chain().focus().setParagraph().unsetMark("fontSize").run();} else if(v==="small"){editor.chain().focus().setParagraph().setMark("fontSize",{size:"11px"}).run();} else if(v==="large"){editor.chain().focus().setParagraph().setMark("fontSize",{size:"16px"}).run();} else {var lv=parseInt(v.replace("h","")); editor.chain().focus().toggleHeading({level:lv}).run();} }}>
            <optgroup label="Text">
              <option value="small">Small</option>
              <option value="p">Body</option>
              <option value="large">Large</option>
            </optgroup>
            <optgroup label="Heading">
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </optgroup>
          </select>}
          {(isVis("font")||isVis("format"))&&sep}
          {isVis("bold")&&<button className={"tb-btn"+(fmtState.bold?" on":"")} data-tip="Bold (Ctrl+B)" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleBold().run();}} style={{fontWeight:700}}>B</button>}
          {isVis("italic")&&<button className={"tb-btn"+(fmtState.italic?" on":"")} data-tip="Italic (Ctrl+I)" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleItalic().run();}} style={{fontStyle:"italic"}}>I</button>}
          {isVis("underline")&&<button className={"tb-btn"+(fmtState.underline?" on":"")} data-tip="Underline (Ctrl+U)" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleUnderline().run();}} style={{textDecoration:"underline"}}>U</button>}
          {isVis("sub")&&<button className={"tb-btn"+(fmtState.subscript?" on":"")} data-tip="Subscript" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleSubscript().run();}} style={{fontSize:11}}>X<sub>2</sub></button>}
          {isVis("super")&&<button className={"tb-btn"+(fmtState.superscript?" on":"")} data-tip="Superscript" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleSuperscript().run();}} style={{fontSize:11}}>X<sup>2</sup></button>}
          {sep}
          {isVis("highlight")&&<button className={"tb-btn"+(fmtState.highlight?" on":"")} data-tip="Highlight" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleHighlight().run();}} style={{fontSize:13,background:fmtState.highlight?"#FFF3C4":"transparent",borderColor:fmtState.highlight?"#E8D87A":"transparent"}}>
            <span style={{background:"#FFF3C4",padding:"0 3px",borderRadius:2}}>H</span>
          </button>}
          {isVis("color")&&<div style={{position:"relative"}}>
            <button className="tb-btn" data-tip="Text Colour" onMouseDown={function(e){e.preventDefault();setShowClr(function(v){return !v;});}} style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:13,fontWeight:700,color:selColor}}>A</span>
              <span style={{display:"block",width:12,height:3,borderRadius:2,background:selColor}}/>
              <span style={{fontSize:8,color:"#9B8E80"}}>&#9662;</span>
            </button>
            {showClr&&(
              <div onMouseDown={function(e){e.preventDefault();}} style={{position:"absolute",top:"110%",left:0,zIndex:50,background:"#FDFAF6",borderRadius:10,padding:"10px",border:"1px solid #E3D9CC",boxShadow:"0 8px 24px rgba(0,0,0,0.14)",minWidth:220}}>
                <ColorPicker value={selColor} onChange={applyColor} label="Text Colour"/>
              </div>
            )}
          </div>}
          {sep}
          {isVis("alignL")&&<button className={"tb-btn"+(fmtState.textAlign==="left"?" on":"")} data-tip="Align Left" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().setTextAlign("left").run();}}><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="0.5"/><rect x="1" y="6" width="10" height="2" rx="0.5"/><rect x="1" y="10" width="14" height="2" rx="0.5"/></svg></button>}
          {isVis("alignC")&&<button className={"tb-btn"+(fmtState.textAlign==="center"?" on":"")} data-tip="Align Centre" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().setTextAlign("center").run();}}><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="0.5"/><rect x="3" y="6" width="10" height="2" rx="0.5"/><rect x="1" y="10" width="14" height="2" rx="0.5"/></svg></button>}
          {isVis("alignR")&&<button className={"tb-btn"+(fmtState.textAlign==="right"?" on":"")} data-tip="Align Right" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().setTextAlign("right").run();}}><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="0.5"/><rect x="5" y="6" width="10" height="2" rx="0.5"/><rect x="1" y="10" width="14" height="2" rx="0.5"/></svg></button>}
          {isVis("alignJ")&&<button className={"tb-btn"+(fmtState.textAlign==="justify"?" on":"")} data-tip="Justify" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().setTextAlign("justify").run();}}><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="0.5"/><rect x="1" y="6" width="14" height="2" rx="0.5"/><rect x="1" y="10" width="14" height="2" rx="0.5"/></svg></button>}
          {sep}
          {isVis("clearFmt")&&<button className="tb-btn" data-tip="Clear Formatting" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().unsetAllMarks().clearNodes().run();}} style={{fontSize:11,color:"#9B8E80"}}>&#x2715; fmt</button>}
          <div style={{marginLeft:"auto",fontSize:11,color:saved?"#1A7A43":"#9B8E80",fontWeight:500}}>{saved?"\u2713 Saved":"Saving\u2026"}</div>
        </div>
        {/* Row 2: Blocks & inserts */}
        <div style={{display:"flex",alignItems:"center",gap:3,padding:"5px 12px",background:"#F3EDE3",borderTop:"1px solid #EBE4D8",flexWrap:"wrap"}}>
          {isVis("bullet")&&<button className={"tb-btn"+(fmtState.bulletList?" on":"")} data-tip="Bullet List" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleBulletList().run();}} style={{fontSize:13}}>&#x2022;</button>}
          {isVis("ordered")&&<button className={"tb-btn"+(fmtState.orderedList?" on":"")} data-tip="Numbered List" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleOrderedList().run();}} style={{fontSize:11}}>1.</button>}
          {isVis("taskList")&&<button className={"tb-btn"+(fmtState.taskList?" on":"")} data-tip="Task List" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleTaskList().run();}} style={{fontSize:13}}>&#x2611;</button>}
          {sep}
          {isVis("callout")&&<button className="tb-btn" data-tip="Callout Box" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().insertContent({type:"callout",content:[{type:"text",text:"Callout text\u2026"}]}).run();}}>Callout</button>}
          {isVis("collapse")&&<button className="tb-btn" data-tip="Collapsible Section" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().insertContent({type:"collapsible",content:[{type:"collapsibleTitle",content:[{type:"text",text:"Section title"}]},{type:"collapsibleBody",content:[{type:"paragraph",content:[{type:"text",text:"Content here\u2026"}]}]}]}).run();}}>Collapse</button>}
          {isVis("codeBlock")&&<button className={"tb-btn"+(fmtState.codeBlock?" on":"")} data-tip="Code Block" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().toggleCodeBlock().run();}} style={{fontFamily:"monospace",fontSize:11}}>&lt;/&gt;</button>}
          {isVis("hr")&&<button className="tb-btn" data-tip="Horizontal Rule" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().setHorizontalRule().run();}} style={{fontSize:11,letterSpacing:2}}>---</button>}
          {isVis("table")&&<button className="tb-btn" data-tip="Insert Table (3x3)" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run();}} style={{fontSize:12}}>&#x25A6;</button>}
          {sep}
          {isVis("dateChip")&&<div style={{position:"relative"}}>
            <button className="tb-btn" data-tip="Insert Date Chip" onMouseDown={function(e){e.preventDefault();setShowDatePick(function(v){return !v;});}}>Date</button>
            {showDatePick&&(
              <div onMouseDown={function(e){e.preventDefault();}} style={{position:"absolute",top:"110%",left:0,zIndex:100,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:"10px",minWidth:200,boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:8}}>Insert Date</div>
                <button onMouseDown={function(){insertDateChip(todayISO());}} style={{...S.btnMicro,width:"100%",marginBottom:8,textAlign:"left"}}>Today ({new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})})</button>
                <input type="date" value={datePickVal} onChange={function(e){setDatePickVal(e.target.value);}}
                  style={{...S.input,marginBottom:8,padding:"4px 8px",fontSize:11}}/>
                <button onMouseDown={function(){insertDateChip(datePickVal);}} style={{...S.btnDark,width:"100%",fontSize:12,padding:"5px 0"}}>Insert</button>
              </div>
            )}
          </div>}
          {isVis("taskChip")&&<div style={{position:"relative"}}>
            <button className="tb-btn" data-tip="Link a Task" onMouseDown={function(e){e.preventDefault();setShowTaskPick(function(v){return !v;});}}>Task</button>
            {showTaskPick&&(
              <div onMouseDown={function(e){e.preventDefault();}} style={{position:"absolute",top:"110%",left:0,zIndex:100,background:"#FDFAF6",border:"1.5px solid #E3D9CC",borderRadius:9,padding:8,minWidth:230,maxHeight:230,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.13)"}}>
                <input value={taskSearch} onChange={function(e){setTaskSearch(e.target.value);}} placeholder="Search tasks\u2026"
                  style={{...S.input,marginBottom:6,padding:"5px 8px",fontSize:11}}/>
                {filteredTasks.length===0&&<div style={{fontSize:11,color:"#9B8E80",padding:"4px 2px"}}>No tasks found.</div>}
                {filteredTasks.map(function(t){return (
                  <div key={t.id} onMouseDown={function(){insertTaskChip(t);}}
                    style={{fontSize:12,padding:"5px 8px",borderRadius:6,cursor:"pointer",color:"#1C1714",display:"flex",alignItems:"center",gap:6}}
                    onMouseEnter={function(e){e.currentTarget.style.background="#EBE4D8";}}
                    onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
                    <span style={{fontSize:10,background:"#EBE4D8",borderRadius:4,padding:"1px 5px",color:"#6B5E4E",flexShrink:0}}>{t.status}</span>
                    <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                  </div>
                );})}
              </div>
            )}
          </div>}
          {isVis("image")&&<button className="tb-btn" data-tip="Insert Image" onMouseDown={function(e){e.preventDefault();doInsertImage();}}>Image</button>}
          {sep}
          {isVis("undo")&&<button className="tb-btn" data-tip="Undo (Ctrl+Z)" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().undo().run();}} style={{fontSize:12}}>&#x21A9;</button>}
          {isVis("redo")&&<button className="tb-btn" data-tip="Redo (Ctrl+Shift+Z)" onMouseDown={function(e){e.preventDefault(); if(editor) editor.chain().focus().redo().run();}} style={{fontSize:12}}>&#x21AA;</button>}
          {sep}
          {/* Customize toolbar gear */}
          <div style={{position:"relative"}}>
            <button className="tb-btn" data-tip="Customize Toolbar" onMouseDown={function(e){e.preventDefault();setShowCustomize(function(v){return !v;});}} style={{fontSize:12}}>&#x2699;</button>
            {showCustomize&&(
              <div className="tb-customize" onMouseDown={function(e){e.preventDefault();}}>
                <div style={{fontSize:10,fontWeight:700,color:"#7A6C5E",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:8}}>Customize Toolbar</div>
                <div style={{fontSize:9,color:"#9B8E80",marginBottom:8}}>Hidden items stay available via / commands</div>
                {TOOLBAR_ITEMS.filter(function(ti){return ti.type!=="display";}).map(function(ti) {
                  var checked = isVis(ti.id);
                  return <label key={ti.id}>
                    <input type="checkbox" checked={checked} onChange={function() {
                      var current = visibleSet || TOOLBAR_ITEMS.map(function(t){return t.id;});
                      var next = checked ? current.filter(function(x){return x!==ti.id;}) : current.concat([ti.id]);
                      saveToolbarPref({visible: next});
                    }}/>
                    {ti.label}
                  </label>;
                })}
                <div style={{marginTop:8,borderTop:"1px solid #E3D9CC",paddingTop:8}}>
                  <button onMouseDown={function(e){e.preventDefault();saveToolbarPref(null);setShowCustomize(false);}}
                    style={{...S.btnMicro,width:"100%",fontSize:10,textAlign:"center"}}>Reset to Default</button>
                </div>
              </div>
            )}
          </div>
          {isVis("charCount")&&<div style={{marginLeft:"auto",fontSize:10,color:"#9B8E80"}} data-tip={wordCount+" words"}>{charCount} chars</div>}
        </div>
      </div>
      {/* Content */}
      <div ref={editorWrapRef} style={{flex:1,overflowY:"auto",position:"relative"}}>
        {editor ? <EditorContent editor={editor}/> : <div style={{padding:"20px 24px",color:"#C2B49E",fontSize:13}}>Loading editor\u2026</div>}
        {/* Table bubble menu */}
        {fmtState.inTable && editor && (function() {
          var tblEl = null;
          try {
            var domInfo = editor.view.domAtPos(editor.state.selection.from);
            var n = domInfo.node;
            while (n && n.tagName !== "TABLE") n = n.parentElement;
            tblEl = n;
          } catch(e) {}
          if (!tblEl || !editorWrapRef.current) return null;
          var wrapRect = editorWrapRef.current.getBoundingClientRect();
          var tblRect = tblEl.getBoundingClientRect();
          var top = tblRect.top - wrapRect.top + editorWrapRef.current.scrollTop - 36;
          var left = tblRect.left - wrapRect.left;
          return <div className="table-bubble" style={{top:top,left:left}}>
            <button data-tip="Add row above" onMouseDown={function(e){e.preventDefault();editor.chain().focus().addRowBefore().run();}}>+ Row &#x2191;</button>
            <button data-tip="Add row below" onMouseDown={function(e){e.preventDefault();editor.chain().focus().addRowAfter().run();}}>+ Row &#x2193;</button>
            <button data-tip="Add column left" onMouseDown={function(e){e.preventDefault();editor.chain().focus().addColumnBefore().run();}}>+ Col &#x2190;</button>
            <button data-tip="Add column right" onMouseDown={function(e){e.preventDefault();editor.chain().focus().addColumnAfter().run();}}>+ Col &#x2192;</button>
            <button className="del" data-tip="Delete row" onMouseDown={function(e){e.preventDefault();editor.chain().focus().deleteRow().run();}}>&#x2715; Row</button>
            <button className="del" data-tip="Delete column" onMouseDown={function(e){e.preventDefault();editor.chain().focus().deleteColumn().run();}}>&#x2715; Col</button>
            <button className="del" data-tip="Delete table" onMouseDown={function(e){e.preventDefault();editor.chain().focus().deleteTable().run();}}>&#x2715; Table</button>
          </div>;
        })()}
        {slashOpen && slashPos && slashFiltered.length > 0 && (
          <div className="slash-menu" style={{position:"fixed",top:slashPos.top,left:slashPos.left}}>
            {slashFiltered.map(function(item, i) {
              return <button key={item.id} className={i===slashIdx?"active":""} onMouseDown={function(e){e.preventDefault();executeSlashCommand(item);}}
                style={i===slashIdx?{background:"#EBE4D8"}:{}}>
                <span style={{width:20,textAlign:"center",flexShrink:0}}>{item.icon}</span> {item.label}
              </button>;
            })}
          </div>
        )}
      </div>
      <div style={{padding:"6px 24px",background:"#F8F3EC",borderTop:"1px solid #EBE4D8",fontSize:11,color:"#C2B49E",display:"flex",gap:16,flexShrink:0}}>
        <span>Type / for commands</span><span>**bold** *italic*</span><span># heading</span><span>- list</span><span>Ctrl+Z undo</span>
      </div>
    </div>
  );
}
