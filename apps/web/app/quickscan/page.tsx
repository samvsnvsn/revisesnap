"use client";
import { useEffect, useState } from "react";

async function runASR(file: File, lang: string){
  const fd = new FormData(); fd.append("file", file); fd.append("lang", lang);
  const r = await fetch("/api/asr", { method:"POST", body: fd });
  if (!r.ok) throw new Error("ASR error");
  const data = await r.json(); return data.segments as any[];
}

export default function QuickScanPage(){
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState(false);

  const [recSupported, setRecSupported] = useState(false);
  const [rec, setRec] = useState<MediaRecorder|null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [recorded, setRecorded] = useState<Blob|null>(null);

  useEffect(()=>{ setRecSupported(!!(navigator.mediaDevices && (window as any).MediaRecorder)); },[]);

  async function startRec(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      setChunks([]);
      mr.ondataavailable = e => { if (e.data && e.data.size > 0) setChunks(prev=>[...prev, e.data]); };
      mr.onstop = () => { const blob = new Blob(chunks, { type: "audio/webm" }); setRecorded(blob); };
      mr.start(); setRec(mr);
    }catch(err:any){ alert(err?.message || String(err)); }
  }
  function stopRec(){
    rec?.stop(); rec?.stream.getTracks().forEach(t=>t.stop()); setRec(null);
  }

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    let file: any = (document.getElementById("file") as HTMLInputElement).files?.[0];
    if (!file && recorded) file = new File([recorded], "recording.webm", { type: recorded.type||"audio/webm" });
    if (!file) { alert("Pick audio file or record"); return; }
    setBusy(true);
    try{
      const segs = await runASR(file!, lang);
      const materialId = Date.now().toString();
      const chunks = segs.map((s:any, i:number)=>({ id: String(i+1), materialId, text: s.text }));
      localStorage.setItem("rs_last_chunks", JSON.stringify({ materialId, chunks }));
      location.href = "/material";
    } catch (e:any) { alert(e?.message || String(e)); }
    finally { setBusy(false); }
  }

  return (<div className="card">
    <h1 className="h1">QuickScan (Audio → Notes)</h1>
    <form onSubmit={onSubmit}>
      <label>Language</label>
      <input className="input" value={lang} onChange={e=>setLang(e.target.value)} style={{maxWidth:200}}/>
      <label style={{marginTop:8}}>Audio file</label>
      <input id="file" className="input" type="file" accept="audio/*" />
      <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
        {recSupported && !rec && <button type="button" className="btn btn-ghost" onClick={startRec}>🎙️ Record</button>}
        {rec && <button type="button" className="btn btn-ghost" onClick={stopRec}>⏹️ Stop</button>}
        {recorded && <span className="p">Recorded · {(recorded.size/1024/1024).toFixed(2)}MB</span>}
      </div>
      <div style={{marginTop:10}}>
        <button className="btn btn-primary" disabled={busy}>{busy? "Working..." : "Generate Notes →"}</button>
      </div>
    </form>
  </div>);
}
