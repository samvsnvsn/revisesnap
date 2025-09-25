export type Chunk = { id: string; materialId: string; text: string };
export type UKLevel = "KS3"|"GCSE"|"A-level";
export type UKSubject = "Science"|"Maths"|"English"|"History/Geography"|"Business/Economics";

export function summarize(chunks: Chunk[], easy=false) {
  const text = chunks.map(c => c.text).join(" ");
  const sents = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const bullets = sents.slice(0,5).map(s => easy ? simplify(s) : s);
  const one = bullets.join(" ");
  return { bullets, oneLiner: one };
}
export function simplify(s: string){
  return s.replace(/\b(utilize|utilised|subsequently|therefore|however)\b/gi, m => ({
    "utilize":"use","utilised":"used","subsequently":"then","therefore":"so","however":"but"
  }[m.toLowerCase()] || m)).replace(/,\s+/g,". ");
}
const UK_COMMAND_WORDS: Record<UKSubject,string[]> = {
  "Science":["Describe","Explain","Evaluate","Compare","Suggest","Calculate","Justify"],
  "Maths":["Calculate","Show that","Prove","Explain","Estimate","Hence","Deduce"],
  "English":["Identify","Explain","Analyse","Compare","Evaluate","Discuss","Explore","Justify"],
  "History/Geography":["Describe","Explain","Assess","Evaluate","Compare","Contrast","Discuss","To what extent"],
  "Business/Economics":["Define","Explain","Analyse","Assess","Evaluate","Justify","Recommend","Discuss"]
};
export function buildUKFromText(text: string, level: UKLevel, subject: UKSubject){
  const sents = text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  const cmds = UK_COMMAND_WORDS[subject];
  const qs = [];
  for (let i=0; i<Math.min(6, sents.length); i++){
    const stem = sents[i].split(/[.;:!?]/)[0];
    const cmd = cmds[i % cmds.length];
    const t = `${cmd}: ${stem}${/[.?!]$/.test(stem)?"":"."}`;
    qs.push(t);
  }
  const chunks = sents.slice(0,15).map((t,i)=>({ id:String(i+1), materialId: Date.now().toString(), text:t }));
  return { questions: qs, chunks };
}
