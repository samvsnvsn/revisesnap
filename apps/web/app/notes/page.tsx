"use client";
import { useEffect, useState } from "react";

type NoteMeta = { id: string; title: string; updated: number; folder?: string; tags?: string[]; starred?: boolean; priority?: "high"|"medium"|"low" };

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
  const [showStarredOnly, setShowStarredOnly] = useState(false);

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

  function toggleStar(id: string){
    const idx = loadIndex();
    const updated = idx.map(n => n.id === id ? {...n, starred: !n.starred} : n);
    localStorage.setItem("rs_notes_index", JSON.stringify(updated));
    setList(updated);
  }

  function setPriority(id: string, priority: "high"|"medium"|"low"|undefined){
    const idx = loadIndex();
    const updated = idx.map(n => n.id === id ? {...n, priority} : n);
    localStorage.setItem("rs_notes_index", JSON.stringify(updated));
    setList(updated);
  }

  // Filter notes
  let visible = activeFolder ? list.filter(n=>n.folder===activeFolder) : list;
  if (searchQuery) {
    visible = visible.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (filterTag) {
    visible = visible.filter(n => n.tags?.includes(filterTag));
  }
  if (showStarredOnly) {
    visible = visible.filter(n => n.starred);
  }

  // Sort: starred first, then by priority, then by updated
  visible.sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPri = priorityOrder[a.priority || "medium"];
    const bPri = priorityOrder[b.priority || "medium"];
    if (aPri !== bPri) return aPri - bPri;
    return b.updated - a.updated;
  });

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
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
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
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button className={"btn"+(showStarredOnly?" btn-primary":"")} onClick={()=>setShowStarredOnly(!showStarredOnly)}>
            ⭐ Starred Only
          </button>
        </div>
      </div>

      <div className="card">
        <b>All notes ({visible.length})</b>
        <div style={{display:"grid", gap:10, marginTop:10}}>
          {visible.map(n=>(
            <div key={n.id} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,padding:10,background:"#fafafa",borderRadius:8,border:n.priority==="high"?"2px solid #ef4444":n.priority==="low"?"1px solid #94a3b8":"1px solid #e5e7eb"}}>
              <button
                onClick={()=>toggleStar(n.id)}
                style={{border:0,background:"transparent",cursor:"pointer",fontSize:20,padding:0,marginTop:2}}
                title={n.starred?"Unstar":"Star"}
              >
                {n.starred ? "⭐" : "☆"}
              </button>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span>{n.title}</span>
                  {n.folder && <span style={{fontSize:13,color:"#64748b"}}>📁{n.folder}</span>}
                  {n.priority && (
                    <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:n.priority==="high"?"#fee2e2":n.priority==="low"?"#f1f5f9":"#fef3c7",color:n.priority==="high"?"#991b1b":n.priority==="low"?"#475569":"#92400e"}}>
                      {n.priority.toUpperCase()}
                    </span>
                  )}
                </div>
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
                <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
                  <button className="btn btn-ghost" onClick={()=>setPriority(n.id, n.priority==="high"?undefined:"high")} style={{padding:"4px 8px",fontSize:11}}>
                    {n.priority==="high"?"✓":""}High
                  </button>
                  <button className="btn btn-ghost" onClick={()=>setPriority(n.id, n.priority==="medium"?undefined:"medium")} style={{padding:"4px 8px",fontSize:11}}>
                    {n.priority==="medium"?"✓":""}Medium
                  </button>
                  <button className="btn btn-ghost" onClick={()=>setPriority(n.id, n.priority==="low"?undefined:"low")} style={{padding:"4px 8px",fontSize:11}}>
                    {n.priority==="low"?"✓":""}Low
                  </button>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,flexDirection:"column"}}>
                <a className="btn btn-ghost" href={"/notes/blank?id="+n.id} style={{fontSize:13}}>Open</a>
                <button className="btn btn-ghost" onClick={()=>delOne(n.id)} style={{fontSize:13}}>Delete</button>
              </div>
            </div>
          ))}
          {visible.length===0 && <div className="p">No notes yet.</div>}
        </div>
      </div>
    </div>
  );
}
