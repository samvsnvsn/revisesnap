"use client";
import { useEffect, useMemo, useState } from "react";
import type { Chunk } from "../lib";
import { summarize, buildUKFromText } from "../lib";

export default function MaterialPage(){
  const [chunks, setChunks] = useState<Chunk[]|null>(null);

  useEffect(()=>{
    const raw = localStorage.getItem("rs_last_chunks");
    if (raw) { try { const p = JSON.parse(raw); setChunks(p.chunks||[]); } catch {} }
  }, []);

  const summary = useMemo(()=>{
    if (!chunks) return null;
    const easy = false;
    return summarize(chunks, easy);
  }, [chunks]);

  if (!chunks) return <div className="card"><b>Waiting for content…</b></div>;

  const joined = chunks.map(c=>c.text).join(" ");
  const uk = buildUKFromText(joined, "GCSE", "Science");

  return (<div>
    <div className="grid2">
      <div className="card">
        <h1 className="h1">Summary</h1>
        <div>{summary?.oneLiner}</div>
        <ul style={{marginTop:6}}>{summary?.bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
      </div>
      <div className="card">
        <h1 className="h1">6 Exam Questions (demo)</h1>
        <ol style={{marginTop:6}}>{uk.questions.map((q,i)=>(i<6 && <li key={i}>{q}</li>))}</ol>
        <div style={{marginTop:10, display:"flex", gap:8, flexWrap:"wrap"}}>
          <a className="btn btn-primary" href="/review">Start 5‑min Review</a>
        </div>
      </div>
    </div>
  </div>);
}
