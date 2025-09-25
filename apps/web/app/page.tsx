export default function Page(){
  return (
    <div>
      <div className="card">
        <h1 className="h1">Ready for 5 minutes?</h1>
        <p className="p">Quickly scan your material and start a short session.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
          <a className="btn btn-primary" href="/scan">Scan</a>
          <a className="btn btn-ghost" href="/material">Recent notes</a>
          <a className="btn btn-ghost" href="/notes">Blank page</a>
        </div>
      </div>
      <div className="grid2" style={{marginTop:12}}>
        <div className="card">
          <b>Recent materials</b>
          <p className="p" style={{marginTop:6}}>Your latest scans and imports.</p>
        </div>
        <div className="card">
          <b>Weekly goal</b>
          <p className="p" style={{marginTop:6}}>Do 4 short sessions · progress 0/4</p>
        </div>
      </div>
    </div>
  );
}
