"use client";
export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";

type NoteDoc = { id: string; title: string; folder?: string; drawing: string; text: string };

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
    rest.unshift({ id: doc.id, title: doc.title || "Blank note", updated: Date.now(), folder: doc.folder || "" });
    localStorage.setItem("rs_notes_index", JSON.stringify(rest));
  }catch{}
}

type Mode = "type" | "draw" | "erase";

export default function BlankNote(){
  const [id] = useState<string>(getId());
  const [title, setTitle] = useState<string>("");
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [mode, setMode] = useState<Mode>("type");
  const [pen, setPen] = useState<string>("#0F172A");
  const [size, setSize] = useState<number>(3);
  const [drawData, setDrawData] = useState<string>("");

  const paperW = 900, paperH = 1200;
  const editorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<boolean>(false);
  const last = useRef<{x:number;y:number}|null>(null);
  const saveTimer = useRef<any>(null);

  useEffect(()=>{
    const existing = loadDoc(id);
    if (existing){
      setTitle(existing.title||"Blank note");
      setDrawData(existing.drawing||"");
      setCurrentFolder(existing.folder||"");
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
        drawing: canvasRef.current ? canvasRef.current.toDataURL("image/png") : "",
        text: editorRef.current?.innerHTML || ""
      };
      saveDoc(doc);
    }, 350);
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
    e.preventDefault(); e.stopPropagation();
    if (mode==="type") return;
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    drawing.current = true; try{ (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }catch{};
    last.current = {x,y};
  }
  function onPointerMove(e: React.PointerEvent){
    e.preventDefault(); e.stopPropagation();
    if (!drawing.current) return;
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = size; ctx.strokeStyle = mode==="erase" ? "rgba(0,0,0,1)" : pen;
    ctx.globalCompositeOperation = mode==="erase" ? "destination-out" : "source-over";
    ctx.beginPath();
    const p = last.current || {x,y};
    ctx.moveTo(p.x, p.y); ctx.lineTo(x, y); ctx.stroke();
    last.current = {x,y};
  }
  function onPointerUp(){
    if (!drawing.current) return;
    drawing.current = false; last.current = null;
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

  useEffect(()=>{ if (mode==="type") editorRef.current?.focus(); }, [mode]);

  return (
    <div className="wrap">
      <div className="card">
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input className="input" style={{flex:1, minWidth:220}} value={title} onChange={e=>{ setTitle(e.target.value); scheduleSave(); }} placeholder="Untitled note" />
          <select className="input" value={currentFolder} onChange={e=>{ setCurrentFolder(e.target.value); scheduleSave(); }}>
            <option value="">(no folder)</option>
            {(typeof window!=="undefined" ? (JSON.parse(localStorage.getItem("rs_folders")||"[]") as string[]) : []).map(f=>(<option key={f} value={f}>{f}</option>))}
          </select>
          <button className={"btn"+(mode==="type"?" btn-primary":"")} onClick={()=>setMode("type")} title="Type">Type</button>
          <button className={"btn"+(mode==="draw"?" btn-primary":"")} onClick={()=>setMode("draw")} title="Draw">Draw</button>
          <button className={"btn"+(mode==="erase"?" btn-primary":"")} onClick={()=>setMode("erase")} title="Erase">Erase</button>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
          <button className="btn btn-ghost" onClick={()=>cmd("bold")}><b>B</b></button>
          <button className="btn btn-ghost" onClick={()=>cmd("italic")}><i>I</i></button>
          <button className="btn btn-ghost" onClick={()=>cmd("underline")}><u>U</u></button>
          <button className="btn btn-ghost" onClick={()=>cmd("formatBlock","H2")}>H2</button>
          <button className="btn btn-ghost" onClick={()=>cmd("insertUnorderedList")}>• List</button>
          <button className="btn btn-ghost" onClick={()=>cmd("insertOrderedList")}>1. List</button>
          <label className="btn btn-ghost" style={{cursor:"pointer"}}>Insert image
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ const f=e.target.files?.[0]; if(f) insertImageFile(f); (e.currentTarget as HTMLInputElement).value=""; }} />
          </label>
          <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
            <input type="color" value={pen} onChange={e=>setPen(e.target.value)} title="Pen color" />
            <input type="range" min={1} max={16} value={size} onChange={e=>setSize(Number(e.target.value))} title="Pen size" />
            <button className="btn" onClick={exportPng}>Export PNG</button>
            <button className="btn" onClick={exportPdf}>Export PDF</button>
          </div>
        </div>
      </div>

      <div className="canvas-wrap" style={{position:"relative", width:paperW, height:paperH, marginTop:12}}>
        <div
          ref={editorRef}
          className="note-editor"
          contentEditable
          suppressContentEditableWarning
          style={{ position:"absolute", inset:0, padding:40, outline:"none", fontSize:16, lineHeight:1.6, overflow:"hidden" }}
          onInput={()=>{ scheduleSave(); }}
        ></div>
        <canvas
          ref={canvasRef}
          style={{ position:"absolute", inset:0, pointerEvents: mode==="type" ? "none" : "auto", touchAction:"none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
  );
}
