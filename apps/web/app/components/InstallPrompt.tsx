"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt(){
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(()=>{
    const handler = (e: any)=>{
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    (window as any).addEventListener("beforeinstallprompt", handler);
    return ()=> (window as any).removeEventListener("beforeinstallprompt", handler);
  },[]);

  if (!visible) return null;

  async function onInstall(){
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  return (
    <div style={{position:"fixed",bottom:86,left:0,right:0,display:"flex",justifyContent:"center",zIndex:50}}>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,boxShadow:"0 6px 22px rgba(15,23,42,.08)",
                   padding:12,display:"flex",gap:10,alignItems:"center",maxWidth:420,width:"calc(100% - 24px)"}}>
        <span>Install ReviseSnap?</span>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <button className="btn btn-ghost" onClick={()=>setVisible(false)}>Later</button>
          <button className="btn btn-primary" onClick={onInstall}>Install</button>
        </div>
      </div>
    </div>
  );
}
