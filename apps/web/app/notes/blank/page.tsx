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
        // Touch or mouse - allow typing
        return;
      }
    } else if (mode === "type") {
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
        yellow: "rgba(255, 255, 0, 0.4)",
        green: "rgba(34, 197, 94, 0.4)",
        pink: "rgba(236, 72, 153, 0.4)",
        blue: "rgba(59, 130, 246, 0.4)"
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
  }, []);

  useEffect(()=>{ if (mode==="type" || mode==="auto") editorRef.current?.focus(); }, [mode]);

  return (
    <div className="wrap">
      <div className="card">
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input className="input" style={{flex:1, minWidth:220}} value={title} onChange={e=>{ setTitle(e.target.value); scheduleSave(); }} placeholder="Untitled note" />
          <select className="input" value={currentFolder} onChange={e=>{ setCurrentFolder(e.target.value); scheduleSave(); }}>
            <option value="">(no folder)</option>
            {(typeof window!=="undefined" ? (JSON.parse(localStorage.getItem("rs_folders")||"[]") as string[]) : []).map(f=>(<option key={f} value={f}>{f}</option>))}
          </select>
          <button className={"btn"+(mode==="auto"?" btn-primary":"")} onClick={()=>setMode("auto")} title="Auto: Pen draws, touch/mouse types">✨ Auto</button>
          <button className={"btn"+(mode==="type"?" btn-primary":"")} onClick={()=>setMode("type")} title="Type">⌨️ Type</button>
          <button className={"btn"+(mode==="draw"?" btn-primary":"")} onClick={()=>setMode("draw")} title="Draw">✏️ Draw</button>
          <button className={"btn"+(mode==="highlight"?" btn-primary":"")} onClick={()=>setMode("highlight")} title="Highlighter">🖍️ Highlight</button>
          <button className={"btn"+(mode==="erase"?" btn-primary":"")} onClick={()=>setMode("erase")} title="Erase">🧹 Erase</button>
        </div>
        {mode === "highlight" && (
          <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <b style={{fontSize:14}}>Colors:</b>
            <button
              className={"btn"+(highlightColor==="yellow"?" btn-primary":"")}
              onClick={()=>setHighlightColor("yellow")}
              style={{background:highlightColor==="yellow"?"#fef08a":"transparent",border:"2px solid #fef08a"}}
            >
              Yellow
            </button>
            <button
              className={"btn"+(highlightColor==="green"?" btn-primary":"")}
              onClick={()=>setHighlightColor("green")}
              style={{background:highlightColor==="green"?"#86efac":"transparent",border:"2px solid #86efac"}}
            >
              Green
            </button>
            <button
              className={"btn"+(highlightColor==="pink"?" btn-primary":"")}
              onClick={()=>setHighlightColor("pink")}
              style={{background:highlightColor==="pink"?"#f9a8d4":"transparent",border:"2px solid #f9a8d4"}}
            >
              Pink
            </button>
            <button
              className={"btn"+(highlightColor==="blue"?" btn-primary":"")}
              onClick={()=>setHighlightColor("blue")}
              style={{background:highlightColor==="blue"?"#93c5fd":"transparent",border:"2px solid #93c5fd"}}
            >
              Blue
            </button>
          </div>
        )}
        <div style={{marginTop:10,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <b style={{fontSize:14}}>📋 Template:</b>
          <button className={"btn btn-ghost"+(template==="blank"?" btn-primary":"")} onClick={()=>setTemplate("blank")}>Blank</button>
          <button className={"btn btn-ghost"+(template==="cornell"?" btn-primary":"")} onClick={()=>setTemplate("cornell")}>Cornell</button>
          <button className={"btn btn-ghost"+(template==="grid"?" btn-primary":"")} onClick={()=>setTemplate("grid")}>Grid</button>
          <button className={"btn btn-ghost"+(template==="lined"?" btn-primary":"")} onClick={()=>setTemplate("lined")}>Lined</button>
          <button className={"btn btn-ghost"+(template==="dots"?" btn-primary":"")} onClick={()=>setTemplate("dots")}>Dots</button>
        </div>
        <div style={{marginTop:10,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <b style={{fontSize:14}}>🏷️ Tags:</b>
          {tags.map(tag => (
            <span key={tag} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",background:"#e0f2fe",color:"#0369a1",borderRadius:8,fontSize:13}}>
              {tag}
              <button onClick={()=>removeTag(tag)} style={{border:0,background:"transparent",cursor:"pointer",padding:0,marginLeft:2,color:"#0369a1",fontWeight:"bold"}}>×</button>
            </span>
          ))}
          <input
            className="input"
            placeholder="Add tag..."
            value={newTag}
            onChange={e=>setNewTag(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addTag(); }}}
            style={{width:120,padding:"4px 10px",fontSize:13}}
          />
          <button className="btn btn-ghost" onClick={addTag} style={{padding:"4px 10px",fontSize:13}}>+ Add</button>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
          <button className="btn btn-ghost" onClick={()=>cmd("bold")} title="Bold (Ctrl+B)"><b>B</b></button>
          <button className="btn btn-ghost" onClick={()=>cmd("italic")} title="Italic (Ctrl+I)"><i>I</i></button>
          <button className="btn btn-ghost" onClick={()=>cmd("underline")} title="Underline (Ctrl+U)"><u>U</u></button>
          <button className="btn btn-ghost" onClick={()=>cmd("formatBlock","H2")}>H2</button>
          <button className="btn btn-ghost" onClick={()=>cmd("insertUnorderedList")}>• List</button>
          <button className="btn btn-ghost" onClick={()=>cmd("insertOrderedList")}>1. List</button>
          <button className="btn btn-ghost" onClick={()=>setShowMathInput(true)} title="Insert Math (Ctrl+M)">∑ Math</button>
          <label className="btn btn-ghost" style={{cursor:"pointer"}}>🖼️ Image
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ const f=e.target.files?.[0]; if(f) insertImageFile(f); (e.currentTarget as HTMLInputElement).value=""; }} />
          </label>
          <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
            <input type="color" value={pen} onChange={e=>setPen(e.target.value)} title="Pen color" />
            <input type="range" min={1} max={16} value={size} onChange={e=>setSize(Number(e.target.value))} title="Pen size" />
            <button className="btn" onClick={exportPng}>Export PNG</button>
            <button className="btn" onClick={exportPdf}>Export PDF</button>
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

      <div className={`canvas-wrap template-${template}`} style={{position:"relative", width:paperW, height:paperH, marginTop:12}}>
        <div
          ref={editorRef}
          className="note-editor"
          contentEditable
          suppressContentEditableWarning
          style={{
            position:"absolute",
            inset:0,
            padding:40,
            outline:"none",
            fontSize:16,
            lineHeight:1.6,
            overflow:"hidden",
            zIndex: 2,
            pointerEvents: mode==="draw" || mode==="erase" ? "none" : "auto"
          }}
          onInput={()=>{ scheduleSave(); }}
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
  );
}
