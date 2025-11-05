"use client";
import { useEffect, useState } from "react";

type NoteMeta = { id: string; title: string; updated: number; folder?: string; tags?: string[] };

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("");

  useEffect(()=>{ setList(loadIndex()); }, []);

  function create(){
    const id = Math.random().toString(36).slice(2,10);
    const title = "Blank note";
    const updated = Date.now();
    const idx = loadIndex();
    idx.unshift({ id, title, updated, folder: "", tags: [] });
    localStorage.setItem("rs_notes_index", JSON.stringify(idx));
    localStorage.setItem("rs_note_"+id, JSON.stringify({ id, title, drawing:"", text:"", folder:"", tags:[] }));
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

  // Get all unique tags from all notes
  const allTags = Array.from(new Set(list.flatMap(n => n.tags || [])));

  // Filter notes
  let visible = activeFolder ? list.filter(n=>n.folder===activeFolder) : list;
  if (searchQuery) {
    visible = visible.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (filterTag) {
    visible = visible.filter(n => n.tags?.includes(filterTag));
  }

  return (
    <div>
      <div className="card">
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <h1 className="h1" style={{marginRight:"auto"}}>Notes</h1>
          <button className="btn btn-primary" onClick={create}>+ New Note</button>
        </div>
        <div style={{marginTop:10}}>
          <input
            className="input"
            placeholder="🔍 Search notes..."
            value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
            style={{maxWidth:350}}
          />
        </div>
      </div>

      <div className="card">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
          <b>📁 Folders</b>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button className={"btn"+(activeFolder===""?" btn-primary":"")} onClick={()=>setActiveFolder("")}>All</button>
            {(folders||[]).map(f=>(
              <span key={f} style={{display:"inline-flex",alignItems:"center",gap:6}}>
                <button className={"btn"+(activeFolder===f?" btn-primary":"")} onClick={()=>setActiveFolder(f)}>{f}</button>
                <button className="btn btn-ghost" onClick={()=>delFolder(f)} title="Delete folder">×</button>
              </span>
            ))}
            <button className="btn" onClick={addFolder}>+ Folder</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <b>🏷️ Tags</b>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button className={"btn"+(filterTag===""?" btn-primary":"")} onClick={()=>setFilterTag("")}>All</button>
            {allTags.map(tag=>(
              <button key={tag} className={"btn"+(filterTag===tag?" btn-primary":"")} onClick={()=>setFilterTag(tag)}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <b>All notes ({visible.length})</b>
        <div style={{display:"grid", gap:10, marginTop:10}}>
          {visible.map(n=>(
            <div key={n.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:10,background:"#fafafa",borderRadius:8}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{n.title}{n.folder? ` · 📁${n.folder}` : ""}</div>
                <div className="p" style={{fontSize:13}}>Updated: {new Date(n.updated).toLocaleString()}</div>
                {n.tags && n.tags.length > 0 && (
                  <div style={{marginTop:4,display:"flex",gap:4,flexWrap:"wrap"}}>
                    {n.tags.map(tag => (
                      <span key={tag} style={{fontSize:11,padding:"2px 8px",background:"#e0f2fe",color:"#0369a1",borderRadius:6}}>
                        🏷️ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
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
