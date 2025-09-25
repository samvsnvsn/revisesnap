export default function ScanHub(){
  return (
    <div className="grid2">
      <div className="card">
        <h1 className="h1">Photo → Notes</h1>
        <p className="p">Take a photo of a whiteboard/notebook. OCR runs on-device.</p>
        <a className="btn btn-primary" href="/scan/photo">Open</a>
      </div>
      <div className="card">
        <h1 className="h1">PDF → Notes</h1>
        <p className="p">Upload a PDF; we extract text and build summary + 6Qs.</p>
        <a className="btn btn-primary" href="/scan/pdf">Open</a>
      </div>
      <div className="card">
        <h1 className="h1">Audio → Notes</h1>
        <p className="p">Upload or record audio (demo ASR).</p>
        <a className="btn btn-ghost" href="/quickscan">QuickScan</a>
      </div>
    </div>
  );
}
