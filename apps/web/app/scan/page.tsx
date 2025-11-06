import Link from "next/link";

export default function ScanHub(){
  return (
    <div className="grid2">
      <div className="card">
        <h1 className="h1">📷 Photo → Notes</h1>
        <p className="p">Take a photo of a whiteboard/notebook. OCR runs on-device.</p>
        <Link className="btn btn-primary" href="/scan/photo" style={{display:"inline-block",marginTop:8}}>Open Photo Scan</Link>
      </div>
      <div className="card">
        <h1 className="h1">📄 PDF → Notes</h1>
        <p className="p">Upload a PDF; we extract text and build summary + questions.</p>
        <Link className="btn btn-primary" href="/scan/pdf" style={{display:"inline-block",marginTop:8}}>Open PDF Scan</Link>
      </div>
      <div className="card">
        <h1 className="h1">🎤 Audio → Notes</h1>
        <p className="p">Upload or record audio for transcription.</p>
        <Link className="btn btn-ghost" href="/quickscan" style={{display:"inline-block",marginTop:8}}>Open Audio Scan</Link>
      </div>
    </div>
  );
}
