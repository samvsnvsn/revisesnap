"use client";
export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";

type NoteDoc = { id: string; title: string; folder?: string; tags?: string[]; drawing: string; text: string };

function uid(){ return Math.random().toString(36).slice(2,10); }
function getId(){
  if (typeof window==="undefined") return uid();
  const q = new URLSearchParams(location.search);
  return q.get("id") || uid();
}
function loadDoc(id: string): NoteDoc | null {
  if (typeof window==="undefined") return null;
  try{ return JSON.parse(localStorage.getItem("rs_note_"+id) || ""); }catch{ return null; }
}
function saveDoc(doc: NoteDoc){
  if (typeof window==="undefined") return;
  try{
    localStorage.setItem("rs_note_"+doc.id, JSON.stringify(doc));
    const idx = JSON.parse(localStorage.getItem("rs_notes_index")||"[]");
    const rest = idx.filter((x:any)=>x.id!==doc.id);
    rest.unshift({ id: doc.id, title: doc.title || "Blank note", updated: Date.now(), folder: doc.folder || "", tags: doc.tags || [] });
    localStorage.setItem("rs_notes_index", JSON.stringify(rest));
  }catch{}
}

type Mode = "type" | "draw" | "erase" | "auto" | "highlight";
type HighlightColor = "yellow" | "green" | "pink" | "blue";
type Template = "blank" | "cornell" | "grid" | "lined" | "dots";

export default function BlankNote(){
  const [id] = useState<string>(getId());
  const [title, setTitle] = useState<string>("");
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [mode, setMode] = useState<Mode>("auto");
  const [pen, setPen] = useState<string>("#0F172A");
  const [size, setSize] = useState<number>(3);
  const [highlightColor, setHighlightColor] = useState<HighlightColor>("yellow");
  const [highlightOpacity, setHighlightOpacity] = useState<number>(0.3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawData, setDrawData] = useState<string>("");
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathLatex, setMathLatex] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [template, setTemplate] = useState<Template>("blank");

  const paperW = 900, paperH = 1200;
  const editorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<boolean>(false);
  const last = useRef<{x:number;y:number}|null>(null);
  const saveTimer = useRef<any>(null);
  const isPenInput = useRef<boolean>(false);

  useEffect(()=>{
    const existing = loadDoc(id);
    if (existing){
      setTitle(existing.title||"Blank note");
      setDrawData(existing.drawing||"");
      setCurrentFolder(existing.folder||"");
      setTags(existing.tags||[]);
      setTimeout(()=>{
        if (editorRef.current) editorRef.current.innerHTML = existing.text || "";
        restoreCanvas();
      },0);
    }else{
      setTitle("Blank note");
      setTimeout(()=>{ editorRef.current?.focus(); }, 50);
    }
    // init canvas once
    const c = canvasRef.current;
    if (c){
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio||1));
      c.width = paperW*dpr; c.height = paperH*dpr;
      c.style.width = paperW+"px"; c.style.height = paperH+"px";
      const ctx = c.getContext("2d");
      if (ctx){
        ctx.setTransform(dpr,0,0,dpr,0,0);
        restoreCanvas();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function restoreCanvas(){
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0,0,paperW,paperH);
    if (drawData){
      const img = new Image();
      img.onload = ()=>{ ctx.drawImage(img, 0, 0, paperW, paperH); };
      img.src = drawData;
    }
  }

  function scheduleSave(){
    if (typeof window==="undefined") return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(()=>{
      const doc: NoteDoc = {
        id,
        title,
        folder: currentFolder || "",
        tags: tags || [],
        drawing: canvasRef.current ? canvasRef.current.toDataURL("image/png") : "",
        text: editorRef.current?.innerHTML || ""
      };
      saveDoc(doc);
    }, 350);
  }

  function addTag(){
    const trimmed = newTag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const updated = [...tags, trimmed];
    setTags(updated);
    setNewTag("");
    scheduleSave();
  }

  function removeTag(tag: string){
    setTags(tags.filter(t => t !== tag));
    scheduleSave();
  }

  function cmd(name: string, value?: any){
    if (typeof document === "undefined") return;
    try{ document.execCommand(name, false, value); }catch{}
    scheduleSave();
  }

  function insertImageFile(file: File){
    const reader = new FileReader();
    reader.onload = ()=>{
      const url = reader.result as string;
      cmd("insertImage", url);
    };
    reader.readAsDataURL(file);
  }

  function onPointerDown(e: React.PointerEvent){
    // Detect if it's a pen/stylus input
    isPenInput.current = e.pointerType === "pen";

    // Auto mode: pen = draw, touch/mouse = type
    if (mode === "auto") {
      if (isPenInput.current) {
        // Pen detected - draw mode
      } else {
        // Touch or mouse - allow typing, focus editor
        editorRef.current?.focus();
        return;
      }
    } else if (mode === "type") {
      // In type mode, focus editor on click
      editorRef.current?.focus();
      return;
    }

    e.preventDefault(); e.stopPropagation();
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    drawing.current = true;
    try{ (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }catch{};
    last.current = {x, y};
  }

  function onPointerMove(e: React.PointerEvent){
    if (!drawing.current) return;

    e.preventDefault(); e.stopPropagation();
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const ctx = c.getContext("2d"); if (!ctx) return;

    // Determine line width
    let lineWidth = size;
    if (mode === "highlight") {
      lineWidth = 20; // Wide highlighter
    } else if (isPenInput.current && e.pressure > 0) {
      lineWidth = size * (0.5 + e.pressure * 1.5); // Pressure sensitivity
    }

    // Determine stroke style
    let strokeStyle = pen;
    let globalAlpha = 1.0;

    if (mode === "highlight") {
      const highlightColors = {
        yellow: `rgba(255, 255, 0, ${highlightOpacity})`,
        green: `rgba(34, 197, 94, ${highlightOpacity})`,
        pink: `rgba(236, 72, 153, ${highlightOpacity})`,
        blue: `rgba(59, 130, 246, ${highlightOpacity})`
      };
      strokeStyle = highlightColors[highlightColor];
      globalAlpha = 1.0;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = mode==="erase" ? "rgba(0,0,0,1)" : strokeStyle;
    ctx.globalAlpha = globalAlpha;
    ctx.globalCompositeOperation = mode==="erase" ? "destination-out" : "source-over";
    ctx.beginPath();
    const p = last.current || {x,y};
    ctx.moveTo(p.x, p.y); ctx.lineTo(x, y); ctx.stroke();
    last.current = {x,y};

    // Reset alpha
    ctx.globalAlpha = 1.0;
  }

  function onPointerUp(){
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    isPenInput.current = false;
    if (canvasRef.current) setDrawData(canvasRef.current.toDataURL("image/png"));
    scheduleSave();
  }

  // Export helpers
  async function renderPaperToCanvas(): Promise<HTMLCanvasElement>{
    const out = document.createElement("canvas");
    out.width = paperW; out.height = paperH;
    const ctx = out.getContext("2d")!;
    const html = editorRef.current?.innerHTML || "";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${paperW}' height='${paperH}'>
      <foreignObject width='100%' height='100%'>
        <div xmlns='http://www.w3.org/1999/xhtml' style='width:${paperW}px;height:${paperH}px;background:#fff;color:#0f172a;font:16px ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.6;padding:40px;white-space:pre-wrap;'>${html}</div>
      </foreignObject>
    </svg>`;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await new Promise<void>((res)=>{ const img = new Image(); img.onload = ()=>{ ctx.drawImage(img,0,0); res(); }; img.src = url; });
    if (canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0, paperW, paperH);
    return out;
  }
  async function exportPng(){
    const c = await renderPaperToCanvas();
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = (title||"note")+".png"; a.click();
  }
  async function exportPdf(){
    if (!(window as any).jspdf){
      await new Promise<void>((res,rej)=>{ const s = document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"; s.onload=()=>res(); s.onerror=()=>rej(); document.head.appendChild(s); });
    }
    const { jsPDF } = (window as any).jspdf;
    const c = await renderPaperToCanvas();
    const imgData = c.toDataURL("image/jpeg", 0.92);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    const maxW = pageWidth - margin*2, maxH = pageHeight - margin*2;
    const tmp = new Image(); tmp.src = imgData; try{ await tmp.decode(); }catch{}
    let w = tmp.width, h = tmp.height;
    const ratio = Math.min(maxW/w, maxH/h);
    w = Math.min(maxW, w*ratio); h = Math.min(maxH, h*ratio);
    doc.addImage(imgData, "JPEG", margin, margin, w, h);
    doc.save((title || "note") + ".pdf");
  }

  function insertMath(){
    if (!mathLatex.trim()) return;
    // Use Unicode math symbols or wrap in a styled span
    const mathHtml = `<span class="math-inline" contenteditable="false" style="background:#f0f9ff;padding:2px 6px;border-radius:6px;font-family:serif;color:#0369a1;margin:0 2px;">$${mathLatex}$</span>&nbsp;`;
    cmd("insertHTML", mathHtml);
    setShowMathInput(false);
    setMathLatex("");
  }

  useEffect(()=>{
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to exit fullscreen
      if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'b': e.preventDefault(); cmd("bold"); break;
          case 'i': e.preventDefault(); cmd("italic"); break;
          case 'u': e.preventDefault(); cmd("underline"); break;
          case 's': e.preventDefault(); scheduleSave(); break;
          case 'm': e.preventDefault(); setShowMathInput(true); break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(()=>{ if (mode==="type" || mode==="auto") editorRef.current?.focus(); }, [mode]);

  return (
    <>
      {/* Fixed exit button in top-right corner for fullscreen */}
      {isFullscreen && (
        <button
          onClick={()=>setIsFullscreen(false)}
          title="Exit Fullscreen (ESC)"
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1001,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            color: "var(--text)"
          }}
        >
          ×
        </button>
      )}
      <div className="wrap" style={isFullscreen ? {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--bg)",
        overflow: "auto",
        padding: "16px"
      } : undefined}>
      <div className="card">
        {isFullscreen && (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:12,borderBottom:"1px solid var(--border-light)"}}>
            <span style={{fontSize:14,color:"var(--muted)",fontWeight:500}}>📝 Fullscreen Editor</span>
            <button
              className="btn btn-ghost"
              onClick={()=>setIsFullscreen(false)}
              title="Exit Fullscreen (ESC)"
              style={{fontSize:12,padding:"6px 12px"}}
            >
              ⊗ Exit Fullscreen
            </button>
          </div>
        )}
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
          <input className="input" style={{flex:1, minWidth:200, padding:"10px 12px", fontSize:15}} value={title} onChange={e=>{ setTitle(e.target.value); scheduleSave(); }} placeholder="Untitled note" />
          <select className="input" style={{padding:"10px 12px", fontSize:13, minWidth:120}} value={currentFolder} onChange={e=>{ setCurrentFolder(e.target.value); scheduleSave(); }}>
            <option value="">(no folder)</option>
            {(typeof window!=="undefined" ? (JSON.parse(localStorage.getItem("rs_folders")||"[]") as string[]) : []).map(f=>(<option key={f} value={f}>{f}</option>))}
          </select>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <button className={"btn btn-ghost"+(mode==="auto"?" btn-primary":"")} onClick={()=>setMode("auto")} title="Auto: Pen draws, touch/mouse types" style={{fontSize:12, padding:"8px 12px"}}>✨ Auto</button>
          <button className={"btn btn-ghost"+(mode==="type"?" btn-primary":"")} onClick={()=>setMode("type")} title="Type" style={{fontSize:12, padding:"8px 12px"}}>⌨️ Type</button>
          <button className={"btn btn-ghost"+(mode==="draw"?" btn-primary":"")} onClick={()=>setMode("draw")} title="Draw" style={{fontSize:12, padding:"8px 12px"}}>✏️ Draw</button>
          <button className={"btn btn-ghost"+(mode==="highlight"?" btn-primary":"")} onClick={()=>setMode("highlight")} title="Highlighter" style={{fontSize:12, padding:"8px 12px"}}>🖍️ Highlight</button>
          <button className={"btn btn-ghost"+(mode==="erase"?" btn-primary":"")} onClick={()=>setMode("erase")} title="Erase" style={{fontSize:12, padding:"8px 12px"}}>🧹 Erase</button>
        </div>
        {mode === "highlight" && (
          <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <b style={{fontSize:12,color:"var(--muted)"}}>Colors:</b>
            <button
              className={"btn btn-ghost"+(highlightColor==="yellow"?" btn-primary":"")}
              onClick={()=>setHighlightColor("yellow")}
              style={{fontSize:11,padding:"6px 10px",background:highlightColor==="yellow"?"#fef08a":"transparent",border:"1px solid #fef08a"}}
            >
              Yellow
            </button>
            <button
              className={"btn btn-ghost"+(highlightColor==="green"?" btn-primary":"")}
              onClick={()=>setHighlightColor("green")}
              style={{fontSize:11,padding:"6px 10px",background:highlightColor==="green"?"#86efac":"transparent",border:"1px solid #86efac"}}
            >
              Green
            </button>
            <button
              className={"btn btn-ghost"+(highlightColor==="pink"?" btn-primary":"")}
              onClick={()=>setHighlightColor("pink")}
              style={{fontSize:11,padding:"6px 10px",background:highlightColor==="pink"?"#f9a8d4":"transparent",border:"1px solid #f9a8d4"}}
            >
              Pink
            </button>
            <button
              className={"btn btn-ghost"+(highlightColor==="blue"?" btn-primary":"")}
              onClick={()=>setHighlightColor("blue")}
              style={{fontSize:11,padding:"6px 10px",background:highlightColor==="blue"?"#93c5fd":"transparent",border:"1px solid #93c5fd"}}
            >
              Blue
            </button>
            <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8}}>
              <label style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap"}}>Opacity:</label>
              <input
                type="range"
                min={0.1}
                max={0.6}
                step={0.05}
                value={highlightOpacity}
                onChange={e=>setHighlightOpacity(Number(e.target.value))}
                style={{width:100}}
                title={`Opacity: ${Math.round(highlightOpacity * 100)}%`}
              />
              <span style={{fontSize:11,color:"var(--muted)",minWidth:35}}>{Math.round(highlightOpacity * 100)}%</span>
            </div>
          </div>
        )}
        <div style={{marginTop:10,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <b style={{fontSize:12,color:"var(--muted)"}}>📋 Template:</b>
          <button className={"btn btn-ghost"+(template==="blank"?" btn-primary":"")} onClick={()=>setTemplate("blank")} style={{fontSize:12, padding:"6px 12px"}}>Blank</button>
          <button className={"btn btn-ghost"+(template==="cornell"?" btn-primary":"")} onClick={()=>setTemplate("cornell")} style={{fontSize:12, padding:"6px 12px"}}>Cornell</button>
          <button className={"btn btn-ghost"+(template==="grid"?" btn-primary":"")} onClick={()=>setTemplate("grid")} style={{fontSize:12, padding:"6px 12px"}}>Grid</button>
          <button className={"btn btn-ghost"+(template==="lined"?" btn-primary":"")} onClick={()=>setTemplate("lined")} style={{fontSize:12, padding:"6px 12px"}}>Lined</button>
          <button className={"btn btn-ghost"+(template==="dots"?" btn-primary":"")} onClick={()=>setTemplate("dots")} style={{fontSize:12, padding:"6px 12px"}}>Dots</button>
        </div>
        <div style={{marginTop:10,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <b style={{fontSize:12,color:"var(--muted)"}}>🏷️ Tags:</b>
          {tags.map(tag => (
            <span key={tag} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",background:"var(--bg)",border:"1px solid var(--border-light)",color:"var(--text)",borderRadius:6,fontSize:12}}>
              {tag}
              <button onClick={()=>removeTag(tag)} style={{border:0,background:"transparent",cursor:"pointer",padding:0,marginLeft:2,color:"var(--muted)",fontWeight:"bold",fontSize:14}}>×</button>
            </span>
          ))}
          <input
            className="input"
            placeholder="Add tag..."
            value={newTag}
            onChange={e=>setNewTag(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addTag(); }}}
            style={{width:120,padding:"6px 10px",fontSize:12}}
          />
          <button className="btn btn-ghost" onClick={addTag} style={{padding:"6px 10px",fontSize:12}}>+ Add</button>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
          <button className="btn btn-ghost" onClick={()=>cmd("undo")} title="Undo (Ctrl+Z)" style={{fontSize:12, padding:"6px 10px"}}>↶ Undo</button>
          <button className="btn btn-ghost" onClick={()=>cmd("redo")} title="Redo (Ctrl+Y)" style={{fontSize:12, padding:"6px 10px"}}>↷ Redo</button>
          <div style={{width:1,height:24,background:"var(--border-light)",margin:"0 4px"}}></div>
          <button className="btn btn-ghost" onClick={()=>cmd("bold")} title="Bold (Ctrl+B)" style={{fontSize:12, padding:"6px 10px"}}><b>B</b></button>
          <button className="btn btn-ghost" onClick={()=>cmd("italic")} title="Italic (Ctrl+I)" style={{fontSize:12, padding:"6px 10px"}}><i>I</i></button>
          <button className="btn btn-ghost" onClick={()=>cmd("underline")} title="Underline (Ctrl+U)" style={{fontSize:12, padding:"6px 10px"}}><u>U</u></button>
          <button className="btn btn-ghost" onClick={()=>cmd("formatBlock","H2")} style={{fontSize:12, padding:"6px 10px"}}>H2</button>
          <button className="btn btn-ghost" onClick={()=>cmd("insertUnorderedList")} style={{fontSize:12, padding:"6px 10px"}}>• List</button>
          <button className="btn btn-ghost" onClick={()=>cmd("insertOrderedList")} style={{fontSize:12, padding:"6px 10px"}}>1. List</button>
          <button className="btn btn-ghost" onClick={()=>setShowMathInput(true)} title="Insert Math (Ctrl+M)" style={{fontSize:12, padding:"6px 10px"}}>∑ Math</button>
          <label className="btn btn-ghost" style={{cursor:"pointer",fontSize:12, padding:"6px 10px"}}>🖼️ Image
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ const f=e.target.files?.[0]; if(f) insertImageFile(f); (e.currentTarget as HTMLInputElement).value=""; }} />
          </label>
          <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <input type="color" value={pen} onChange={e=>setPen(e.target.value)} title="Pen color" style={{width:32,height:32,border:"1px solid var(--border)",borderRadius:6,cursor:"pointer"}} />
            <input type="range" min={1} max={16} value={size} onChange={e=>setSize(Number(e.target.value))} title="Pen size" style={{width:80}} />
            <button className="btn btn-ghost" onClick={()=>setIsFullscreen(!isFullscreen)} title={isFullscreen?"Exit Fullscreen":"Enter Fullscreen"} style={{fontSize:12, padding:"6px 12px"}}>
              {isFullscreen ? "⊗" : "⛶"} {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
            <button className="btn btn-ghost" onClick={exportPng} style={{fontSize:12, padding:"6px 12px"}}>PNG</button>
            <button className="btn btn-ghost" onClick={exportPdf} style={{fontSize:12, padding:"6px 12px"}}>PDF</button>
          </div>
        </div>
        {showMathInput && (
          <div style={{marginTop:10,padding:12,background:"#f0f9ff",borderRadius:12,border:"1px solid #bae6fd"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <input
                className="input"
                placeholder="LaTeX: e.g. x^2 + y^2 = r^2"
                value={mathLatex}
                autoFocus
                onChange={e=>setMathLatex(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); insertMath(); } }}
                style={{flex:1,minWidth:250}}
              />
              <button className="btn btn-primary" onClick={insertMath}>Insert</button>
              <button className="btn btn-ghost" onClick={()=>{setShowMathInput(false); setMathLatex("");}}>Cancel</button>
            </div>
            <div className="p" style={{marginTop:6,fontSize:12}}>
              Quick symbols: α β γ Δ θ λ π Σ ∫ √ ∞ ≈ ≠ ≤ ≥ ± × ÷ ∂
              <button className="btn btn-ghost" style={{marginLeft:8,padding:"4px 8px"}} onClick={()=>setMathLatex(mathLatex+"∫")}>∫</button>
              <button className="btn btn-ghost" style={{padding:"4px 8px"}} onClick={()=>setMathLatex(mathLatex+"Σ")}>Σ</button>
              <button className="btn btn-ghost" style={{padding:"4px 8px"}} onClick={()=>setMathLatex(mathLatex+"√")}>√</button>
              <button className="btn btn-ghost" style={{padding:"4px 8px"}} onClick={()=>setMathLatex(mathLatex+"π")}>π</button>
              <button className="btn btn-ghost" style={{padding:"4px 8px"}} onClick={()=>setMathLatex(mathLatex+"θ")}>θ</button>
              <button className="btn btn-ghost" style={{padding:"4px 8px"}} onClick={()=>setMathLatex(mathLatex+"Δ")}>Δ</button>
            </div>
          </div>
        )}
      </div>

      <div className={`canvas-wrap template-${template}`} style={{
        position:"relative",
        width: isFullscreen ? "100%" : paperW,
        maxWidth: isFullscreen ? "1400px" : paperW,
        height: isFullscreen ? "auto" : paperH,
        minHeight: isFullscreen ? "calc(100vh - 200px)" : paperH,
        aspectRatio: isFullscreen ? "3/4" : undefined,
        marginTop:12,
        marginLeft: isFullscreen ? "auto" : 0,
        marginRight: isFullscreen ? "auto" : 0
      }}>
        <div
          ref={editorRef}
          className="note-editor"
          contentEditable
          suppressContentEditableWarning
          style={{
            position:"absolute",
            inset:0,
            padding:16,
            outline:"none",
            fontSize:16,
            lineHeight:1.6,
            overflow:"hidden",
            zIndex: 2,
            whiteSpace: "pre-wrap",
            cursor: mode==="type" || (mode==="auto" && !isPenInput.current) ? "text" : "default",
            pointerEvents: mode==="draw" || mode==="erase" || mode==="highlight" ? "none" : "auto"
          }}
          onInput={()=>{ scheduleSave(); }}
          onClick={(e)=>{
            if (mode === "type" || mode === "auto") {
              e.stopPropagation();
              editorRef.current?.focus();
            }
          }}
        ></div>
        <canvas
          ref={canvasRef}
          style={{
            position:"absolute",
            inset:0,
            pointerEvents: mode==="type" ? "none" : "auto",
            touchAction:"none",
            zIndex: mode==="auto" ? 1 : 2
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
    </>
  );
}
