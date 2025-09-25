"use client";
import { useRef, useState } from "react";
import type { UKLevel, UKSubject } from "../../lib";
import { buildUKFromText } from "../../lib";

declare global { interface Window { Tesseract: any; } }

async function loadTesseract(){
  if (window.Tesseract) return;
  await new Promise<void>((res, rej)=>{
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js";
    s.onload = ()=>res(); s.onerror = ()=>rej(new Error("Failed to load Tesseract"));
    document.head.appendChild(s);
  });
}

function dataUrlFromFile(file: File): Promise<string>{
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onload = ()=>resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function PhotoOCR(){
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    setBusy(true); setText("");
    try{
      await loadTesseract();
      const dataUrl = await dataUrlFromFile(f);
      if (imgRef.current) imgRef.current.src = dataUrl;
      const { data } = await window.Tesseract.recognize(dataUrl, "eng", { logger: ()=>{} });
      const raw = (data.text || "").replace(/\s+/g," ").trim();
      setText(raw);
    }catch(err:any){ alert(err?.message || String(err)); }
    finally{ setBusy(false); }
  }

  function toNotes(){
    if (!text) return alert("No text yet.");
    const level: UKLevel = "GCSE";
    const subject: UKSubject = "Science";
    const { chunks } = buildUKFromText(text, level, subject);
    const materialId = Date.now().toString();
    const payload = { materialId, chunks };
    localStorage.setItem("rs_last_chunks", JSON.stringify(payload));
    location.href = "/material";
  }

  return (
    <div>
      <div className="card">
        <h1 className="h1">Photo → OCR → Notes</h1>
        <input className="input" type="file" accept="image/*" onChange={onSelect} />
        <p className="p" style={{marginTop:6}}>Pick a photo of your board/notebook. Works offline (on-device).</p>
      </div>
      <div className="grid2" style={{marginTop:12}}>
        <div className="card">
          <b>Preview</b>
          <img ref={imgRef} alt="preview" style={{width:"100%",marginTop:8,borderRadius:12,border:"1px solid #e5e7eb"}} />
        </div>
        <div className="card">
          <b>Recognised text</b>
          <textarea className="input" rows={14} value={text} onChange={e=>setText(e.target.value)}></textarea>
          <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn btn-primary" disabled={!text || busy} onClick={toNotes}>Make Notes →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
