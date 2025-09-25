"use client";
import { useEffect, useState } from "react";

type NoteMeta = { id: string; title: string; updated: number; folder?: string };

function loadIndex(): NoteMeta[] {
  try { return JSON.parse(localStorage.getItem("rs_notes_index") || "[]"); }
  catch { return []; }
}

export default function NotesPage(){
  const [list, setList] = useState<NoteMeta[]>([]);
  const [folders, setFolders] = useState<string[]>(()=>{
    try { return JSON.parse(localStorage.getItem("rs_folders")||"[]"); } catch { return []; }
  });
  const [activeFolder, setActiveFolder] = useState<string>("");

  useEffect(()=>{ setList(loadIndex()); }, []);

  function create(){
    const id = Math.random().toString(36).slice(2,10);
    const title = "Blank note";
    const updated = Date.now();
    const idx = loadIndex();
    idx.unshift({ id, title, updated, folder: "" });
    localStorage.setItem("rs_notes_index", JSON.stringify(idx));
    localStorage.setItem("rs_note_"+id, JSON.stringify({ id, title, drawing:"", text:"", folder:"" }));
    location.href = "/notes/blank?id=" + id;
  }

  function delOne(id:string){
    const idx = loadIndex().filter(n=>n.id!==id);
    localStorage.setItem("rs_notes_index", JSON.stringify(idx));
    localStorage.removeItem("rs_note_"+id);
    setList(idx);
  }

  function addFolder(){
    const name = prompt("New folder name?")?.trim(); if(!name) return;
    const next = Array.from(new Set([...(folders||[]), name]));
    setFolders(next);
    localStorage.setItem("rs_folders", JSON.stringify(next));
  }

  function delFolder(name:string){
    if (!confirm(`Delete folder "${name}"? (notes remain, only label removed)`)) return;
    const next = (folders||[]).filter(f=>f!==name);
    setFolders(next);
    localStorage.setItem("rs_folders", JSON.stringify(next));
    try{
      const idx = loadIndex().map(n => n.folder===name ? ({...n, folder:""}) : n);
      localStorage.setItem("rs_notes_index", JSON.stringify(idx));
      setList(idx);
    }catch{}
  }

  const visible = activeFolder ? list.filter(n=>n.folder===activeFolder) : list;

  return (
    <div>
      <div className="card" style={{display:"flex",gap:8,alignItems:"center"}}>
        <h1 className="h1" style={{marginRight:"auto"}}>Notes</h1>
        <button className="btn btn-primary" onClick={create}>New Blank Note</button>
      </div>

      <div className="card">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <b>Folders</b>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button className={"btn"+(activeFolder===""?" btn-primary":"")} onClick={()=>setActiveFolder("")}>All</button>
            {(folders||[]).map(f=>(
              <span key={f} style={{display:"inline-flex",alignItems:"center",gap:6}}>
                <button className={"btn"+(activeFolder===f?" btn-primary":"")} onClick={()=>setActiveFolder(f)}>{f}</button>
                <button className="btn btn-ghost" onClick={()=>delFolder(f)} title="Delete folder">×</button>
              </span>
            ))}
            <button className="btn" onClick={addFolder}>+ New folder</button>
          </div>
        </div>
      </div>

      <div className="card">
        <b>All notes</b>
        <div style={{display:"grid", gap:10, marginTop:10}}>
          {visible.map(n=>(
            <div key={n.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontWeight:600}}>{n.title}{n.folder? ` · ${n.folder}` : ""}</div>
                <div className="p">Updated: {new Date(n.updated).toLocaleString()}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <a className="btn btn-ghost" href={"/notes/blank?id="+n.id}>Open</a>
                <button className="btn btn-ghost" onClick={()=>delOne(n.id)}>Delete</button>
              </div>
            </div>
          ))}
          {visible.length===0 && <div className="p">No notes yet.</div>}
        </div>
      </div>
    </div>
  );
}
