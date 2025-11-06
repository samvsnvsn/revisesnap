"use client";
import { useState } from "react";
import type { UKLevel, UKSubject } from "../../lib";
import { buildUKFromText } from "../../lib";

declare global { interface Window { pdfjsLib: any; } }

async function loadPdfJs(){
  if ((window as any).pdfjsLib) return;
  const add = (tag:string, attrs:Record<string,string>)=>new Promise<void>((res,rej)=>{
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    el.onload=()=>res(); el.onerror=()=>rej(new Error("Failed to load: "+attrs.src));
    document.head.appendChild(el);
  });
  try{
    await add("script",{ src:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js" });
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    return;
  }catch{}
  const mod="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.min.mjs";
  const worker="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs";
  const shim = `import * as lib from "${mod}"; window.pdfjsLib = lib; window.pdfjsLib.GlobalWorkerOptions.workerSrc="${worker}";`;
  const blob = new Blob([shim], {type:"text/javascript"});
  await add("script",{ type:"module", src: URL.createObjectURL(blob) });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer>{
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onload = ()=>resolve(fr.result as ArrayBuffer);
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

export default function PDFImport(){
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [thumbs, setThumbs] = useState<string[]>([]);

  async function renderPageThumb(page:any, scale=0.7){
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  }

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    setBusy(true); setText(""); setThumbs([]);
    try{
      await loadPdfJs();
      const buf = await readFileAsArrayBuffer(f);
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      let all = ""; const thumbsArr: string[] = [];
      for(let p=1; p<=pdf.numPages && p<=20; p++){
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const t = content.items.map((it:any)=>it.str).join(" ");
        all += t + "\n";
        try{ const png = await renderPageThumb(page, 0.7); thumbsArr.push(png); }catch{}
      }
      all = all.replace(/\s+/g," ").trim();
      setText(all); setThumbs(thumbsArr);
    }catch(err:any){ alert(err?.message || String(err)); }
    finally{ setBusy(false); }
  }

  function toNotes(){
    if (!text) return alert("No text yet.");
    const level: UKLevel = "GCSE";
    const subject: UKSubject = "Science";
    const { chunks } = buildUKFromText(text, level, subject);
    const materialId = Date.now().toString();
    localStorage.setItem("rs_last_chunks", JSON.stringify({ materialId, chunks }));
    location.href = "/material";
  }

  return (
    <div>
      <div className="card">
        <h1 className="h1">PDF → Notes</h1>
        <p className="p" style={{marginBottom:10}}>Upload a PDF file to extract text (up to 20 pages).</p>
        <label className="btn btn-primary" style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
          📄 Select PDF File
          <input type="file" accept="application/pdf,.pdf" onChange={onSelect} style={{display:"none"}} disabled={busy} />
        </label>
        {busy && <p className="p" style={{marginTop:8,color:"var(--primary)"}}>Processing PDF... ⏳</p>}
        {text && (
          <>
            <textarea className="input" rows={12} value={text} onChange={e=>setText(e.target.value)} style={{marginTop:12}} placeholder="Extracted text will appear here..."></textarea>
            <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn btn-primary" disabled={!text || busy} onClick={toNotes}>Make Notes →</button>
            </div>
          </>
        )}
      </div>
      {thumbs.length>0 && (
        <div className="card" style={{marginTop:12}}>
          <b>Preview</b>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,marginTop:8}}>
            {thumbs.map((t,i)=>(<img key={i} src={t} alt={"p"+i} style={{width:"100%",borderRadius:8,border:"1px solid #e5e7eb"}}/>))}
          </div>
        </div>
      )}
    </div>
  );
}
