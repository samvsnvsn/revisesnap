"use client";
import { useEffect, useState } from "react";

type Profile = {
  name?: string;
  avatar?: string;
  weeklyGoal?: number;
  theme?: "default"|"warm"|"dark";
  customBg?: string;
  cardColor?: string;
};

const AVATARS = ["🙂","😎","😈","🧠","📚","🎯","📝","🦊","🐼","🐧","🐱","🐶","🐨","🐸","🤖","🌟","🚀"];

function loadProfile(): Profile { try{ return JSON.parse(localStorage.getItem("rs_profile")||"{}"); }catch{ return {}; } }
function saveProfile(p: Profile){ localStorage.setItem("rs_profile", JSON.stringify(p)); try{ window.dispatchEvent(new Event("rs_profile_changed")); }catch{} }

function applyPreset(name: "Sunset"|"Mint"|"Sky"){
  const presets: Record<string, any> = {
    "Sunset": { customBg:"#FFF1E6", cardColor:"#FFFFFF", theme:"default" },
    "Mint":   { customBg:"#ECFDF5", cardColor:"#FFFFFF", theme:"default" },
    "Sky":    { customBg:"#F0F9FF", cardColor:"#FFFFFF", theme:"default" },
  };
  const base = loadProfile(); const next = { ...base, ...presets[name] }; saveProfile(next);
}

export default function Me(){
  const [profile, setProfile] = useState<Profile>({});
  useEffect(()=>{ setProfile(loadProfile()); }, []);

  function setField<K extends keyof Profile>(key: K, val: Profile[K]){
    const next = { ...profile, [key]: val };
    setProfile(next); saveProfile(next);
  }
  function resetDefaults(){
    localStorage.removeItem("rs_profile");
    setProfile({}); try{ window.dispatchEvent(new Event("rs_profile_changed")); }catch{}
  }

  function exportData(){
    const data = {
      profile: JSON.parse(localStorage.getItem("rs_profile")||"{}"),
      notes_index: JSON.parse(localStorage.getItem("rs_notes_index")||"[]"),
      folders: JSON.parse(localStorage.getItem("rs_folders")||"[]"),
      review_cards: JSON.parse(localStorage.getItem("rs_review_cards")||"[]"),
      review_sessions: JSON.parse(localStorage.getItem("rs_review_sessions")||"{}"),
      last_chunks: JSON.parse(localStorage.getItem("rs_last_chunks")||"{}"),
      notes: {} as Record<string,any>
    };

    // Export all notes
    const idx = JSON.parse(localStorage.getItem("rs_notes_index")||"[]");
    idx.forEach((n:any) => {
      const note = localStorage.getItem("rs_note_"+n.id);
      if (note) data.notes[n.id] = JSON.parse(note);
    });

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revisesnap-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result as string);

        // Restore data
        if (data.profile) localStorage.setItem("rs_profile", JSON.stringify(data.profile));
        if (data.notes_index) localStorage.setItem("rs_notes_index", JSON.stringify(data.notes_index));
        if (data.folders) localStorage.setItem("rs_folders", JSON.stringify(data.folders));
        if (data.review_cards) localStorage.setItem("rs_review_cards", JSON.stringify(data.review_cards));
        if (data.review_sessions) localStorage.setItem("rs_review_sessions", JSON.stringify(data.review_sessions));
        if (data.last_chunks) localStorage.setItem("rs_last_chunks", JSON.stringify(data.last_chunks));

        // Restore notes
        if (data.notes){
          Object.entries(data.notes).forEach(([id, note])=>{
            localStorage.setItem("rs_note_"+id, JSON.stringify(note));
          });
        }

        alert("Data imported successfully! Refreshing page...");
        window.location.reload();
      }catch(err:any){
        alert("Error importing data: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="h1">Me</h1>
        <div style={{display:"grid",gap:12}}>
          <div>
            <label className="p">Display name</label>
            <input className="input" placeholder="Your name" value={profile.name||""} onChange={e=>setField("name", e.target.value)} />
          </div>
          <div>
            <label className="p">Pick an avatar</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(56px,1fr))",gap:8,marginTop:6}}>
              {AVATARS.map(a=>(
                <button key={a} className={"btn"+(profile.avatar===a?" btn-primary":"")} onClick={()=>setField("avatar", a)}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="p">Weekly goal (short sessions)</label>
            <input className="input" type="number" min={1} max={14} value={profile.weeklyGoal??4}
              onChange={e=>setField("weeklyGoal", Math.max(1, Math.min(14, Number(e.target.value)||4)))} />
          </div>
          <div>
            <label className="p">Theme</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
              <button className={"btn"+((profile.theme||"default")==="default"?" btn-primary":"")} onClick={()=>setField("theme","default")}>☀️ Default</button>
              <button className={"btn"+((profile.theme||"default")==="warm"?" btn-primary":"")} onClick={()=>setField("theme","warm")}>🧡 Warm</button>
              <button className={"btn"+((profile.theme||"default")==="dark"?" btn-primary":"")} onClick={()=>setField("theme","dark")}>🌙 Dark</button>
            </div>
          </div>
          <div>
            <label className="p">Presets</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
              <button className="btn btn-ghost" onClick={()=>applyPreset("Sunset")}>Sunset</button>
              <button className="btn btn-ghost" onClick={()=>applyPreset("Mint")}>Mint</button>
              <button className="btn btn-ghost" onClick={()=>applyPreset("Sky")}>Sky</button>
            </div>
          </div>
          <div>
            <label className="p">Custom background</label>
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6,flexWrap:"wrap"}}>
              <input className="input" type="color" value={profile.customBg || "#FBFDFE"} onChange={e=>setField("customBg", e.target.value)} />
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {["#FBFDFE","#FFF7ED","#FEF3C7","#F0F9FF","#FFFFFF"].map(c=>(
                  <div key={c} style={{display:"grid",justifyItems:"center"}}>
                    <button className="swatch" style={{background:c}} title={c} onClick={()=>setField("customBg", c)}></button>
                    <small className="p" style={{fontSize:11}}>{c}</small>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={()=>setField("customBg","")}>Reset</button>
            </div>
          </div>
          <div>
            <label className="p">Card color</label>
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6,flexWrap:"wrap"}}>
              <input className="input" type="color" value={profile.cardColor || "#FFFFFF"} onChange={e=>setField("cardColor", e.target.value)} />
              <button className="btn btn-ghost" onClick={()=>setField("cardColor","")}>Reset</button>
            </div>
          </div>
          <div>
            <label className="p">Backup & Restore</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
              <button className="btn btn-ghost" onClick={exportData}>📥 Export All Data</button>
              <label className="btn btn-ghost" style={{cursor:"pointer"}}>
                📤 Import Data
                <input type="file" accept=".json" style={{display:"none"}} onChange={importData} />
              </label>
            </div>
            <p className="p" style={{marginTop:6,fontSize:12}}>
              Export your notes, review cards, and settings as JSON. Import to restore.
            </p>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn" onClick={resetDefaults}>Reset to defaults</button>
          </div>
        </div>
      </div>
    </div>
  );
}
