import React, { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

const POINTS = { S:10, A:9, B:8, C:7, D:6, E:5, F:0, N:0 };
const CREDITS = ["1","1.5","2","3","4","5","20"];
const readTheme = () => { try { const v=localStorage.getItem("vit-theme"); return ["system","dark","light"].includes(v)?v:"system"; } catch { return "system"; } };

function Header() {
  const [theme,setTheme] = useState(readTheme);
  useEffect(()=>{ document.documentElement.dataset.theme=theme; try{localStorage.setItem("vit-theme",theme)}catch{} },[theme]);
  return <header className="header">
    <Link to="/" className="brand"><span className="mark">V</span><span><b>VIT GRADEBOOK</b><small>A clearer view of your semester.</small></span></Link>
    <label className="theme"><span>APPEARANCE</span><select value={theme} onChange={e=>setTheme(e.target.value)} aria-label="Appearance"><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
  </header>;
}
function Tabs(){return <nav className="tabs" aria-label="Calculator pages">
  <NavLink to="/gpa" className={({isActive})=>isActive?"tab active":"tab"}>GPA calculator</NavLink>
  <NavLink to="/quick-cgpa" className={({isActive})=>isActive?"tab active":"tab"}>Quick CGPA</NavLink>
  <NavLink to="/any-sem-cgpa" className={({isActive})=>isActive?"tab active":"tab"}>Any-sem CGPA</NavLink>
</nav>}
function Page({title,description,count,children}){return <><div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div></div>{children}</>}
function Result({label,value,caption,badge}){return <div className="result" aria-live="polite"><div><div className="result-label">{label}</div><div className="result-number" key={value}>{value}</div><div className="result-caption">{caption}</div></div><span className="badge">{badge}</span></div>}
function CalculatorLayout({children}){return <main className="calculator"><Tabs/><section className="panel">{children}</section></main>}

function Gpa(){
 const [rows,setRows]=useState(()=>Array.from({length:10},()=>({grade:"",credits:""})));
 const [result,setResult]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 function update(i,key,value){setRows(old=>{const next=old.map((r,j)=>j===i?{...r,[key]:value}:r);if(value&&i===old.length-1&&old.length<100)next.push({grade:"",credits:""});return next});setError("");}
 function calculate(){
  let weighted=0,credits=0,count=0;setError("");
  for(let i=1;i<rows.length;i++){const {grade,credits:c}=rows[i];if(!grade&&!c)continue;if(!grade||!c){setError(`Course ${i+1} is incomplete. Choose both a grade and credits, or leave both blank.`);return;}
   weighted+=POINTS[grade]*Number(c);credits+=Number(c);count++;}
  if(!count||!credits){setError("Choose a grade and credits for at least one course. NGCR does not count toward GPA.");return;}
  setBusy(true);setTimeout(()=>{const g=weighted/credits;setResult({value:g.toFixed(2),caption:`${count} graded course${count===1?"":"s"} · ${credits.toFixed(2)} GPA credits`,badge:g>=9?"Excellent":g>=8?"Strong semester":g>=6?"Keep building":"Room to grow"});setBusy(false)},350);
 }
 function reset(){setRows(Array.from({length:10},()=>({grade:"",credits:""})));setResult(null);setError("");}
 return <Page title="Semester GPA" description="" count={`${rows.length} rows`}>
  <div className="table-head course-grid"><span>Course</span><span>Grade</span><span>Credits</span></div>
  {rows.map((r,i)=>{const ngcr=i===0;return <div className="course-row course-grid" key={i}>
   <div className="course-name"><span className="course-index">{String(i+1).padStart(2,"0")}</span>{ngcr?"NGCR":"Course"}</div>
   <select aria-label={`${ngcr?"NGCR":`Course ${i+1}`} grade`} value={r.grade} onChange={e=>update(i,"grade",e.target.value)}><option value="">Grade</option>{(ngcr?["P","F"]:Object.keys(POINTS)).map(g=><option key={g}>{g}</option>)}</select>
   <select aria-label={`${ngcr?"NGCR":`Course ${i+1}`} credits`} value={r.credits} onChange={e=>update(i,"credits",e.target.value)}><option value="">Credits</option>{(ngcr?["1","2"]:CREDITS).map(c=><option key={c}>{c}</option>)}</select>
  </div>})}
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="actions"><button className="button secondary" onClick={reset}>Reset courses</button><button className="button primary" onClick={calculate} disabled={busy}>{busy?"Calculating…":"Calculate GPA ↗"}</button></div>
  {result&&<Result {...result} label="Your semester GPA"/>}
  <p className="footnote">Grade points: S = 10 · A = 9 · B = 8 · C = 7 · D = 6 · E = 5 · F/N = 0. NGCR is pass/fail and excluded. Use the credits assigned to each course in your VIT record.</p>
 </Page>;
}

function Field({id,label,hint,placeholder,suffix,value,onChange,max,step="any"}){
 const invalid=value!==""&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>max);
 return <div className="field"><label htmlFor={id}>{label}<small>{hint}</small></label><div className={`input-wrap ${invalid?"invalid":""}`}><input id={id} type="number" min="0" max={max} step={step} inputMode="decimal" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/><span>{suffix}</span></div></div>;
}
function Quick(){
 const [v,setV]=useState({pc:"",pg:"",cc:"",cg:""}),[result,setResult]=useState(null),[error,setError]=useState("");
 const update=(k,x)=>{setV(o=>({...o,[k]:x}));setError("")};
 function calculate(){
  const specs=[["pc","previous credits",250],["pg","previous CGPA",10],["cc","this-semester credits",39],["cg","this-semester GPA",10]],n={};
  for(const [k,label,max] of specs){if(v[k].trim()===""){setError(`Enter ${label}.`);document.getElementById(k).focus();return;}n[k]=Number(v[k]);if(!Number.isFinite(n[k])||n[k]<0||n[k]>max){setError(`${label} must be between 0 and ${max}.`);return;}}
  if((n.pc===0)!==(n.pg===0)){setError("Previous credits and CGPA should both be 0 for a first semester, or both be filled.");return;}
  if(n.cc<=0){setError("This-semester credits must be greater than 0.");return;}
  const total=n.pc+n.cc,g=(n.pg*n.pc+n.cg*n.cc)/total;setResult({value:g.toFixed(2),caption:`${total.toFixed(2)} total credits · ${n.cc} added this semester`,badge:"CGPA"});
 }
 return <Page title="Quick CGPA calculator" description="" count="4 inputs">
  <div className="field-grid">
   <Field id="pc" label="Credits till last semester" hint="Total completed credits before this semester" placeholder="e.g. 82" suffix="MAX 250" max={250} value={v.pc} onChange={x=>update("pc",x)}/>
   <Field id="pg" label="CGPA till last semester" hint="Your previous cumulative GPA" placeholder="e.g. 8.24" suffix="MAX 10" max={10} step=".01" value={v.pg} onChange={x=>update("pg",x)}/>
   <Field id="cc" label="Credits in this semester" hint="Credits that count toward GPA" placeholder="e.g. 22" suffix="MAX 39" max={39} value={v.cc} onChange={x=>update("cc",x)}/>
   <Field id="cg" label="GPA this semester" hint="Your calculated semester GPA" placeholder="e.g. 8.70" suffix="MAX 10" max={10} step=".01" value={v.cg} onChange={x=>update("cg",x)}/>
  </div>
  {error&&<p className="error" role="alert">{error}</p>}<button className="button primary full" onClick={calculate}>Calculate new CGPA ↗</button>
  {result&&<Result {...result} label="Updated cumulative GPA"/>}
  <p className="footnote">Formula: (previous CGPA × previous credits + this-semester GPA × this-semester credits) ÷ total credits. Enter 0 for both previous values if this is your first semester.</p>
 </Page>;
}
function ordinal(n){const suffix=n%100>=11&&n%100<=13?"th":({1:"st",2:"nd",3:"rd"}[n%10]||"th");return `${n}${suffix} Sem`;}
function AnySem(){
 const [rows,setRows]=useState(()=>Array.from({length:8},()=>({gpa:"",credits:""}))),[result,setResult]=useState(null),[error,setError]=useState("");
 const update=(i,k,v)=>{setRows(old=>old.map((r,j)=>i===j?{...r,[k]:v}:r));setError("")};
 function calculate(){let weighted=0,credits=0,count=0;
  for(let i=0;i<rows.length;i++){const r=rows[i];if(r.gpa.trim()===""||r.credits.trim()===""||Number(r.credits)===0)continue;
   const g=Number(r.gpa),c=Number(r.credits);if(!Number.isFinite(g)||!Number.isFinite(c)||g<0||g>10||c<0||c>250){setError(`${ordinal(i+1)}: GPA must be 0–10 and credits 0–250.`);return;}if(c<=0)continue;weighted+=g*c;credits+=c;count++;}
  if(!count||!credits){setError("Enter a valid GPA and positive credit count for at least one semester.");return;}
  setError("");setResult({value:(weighted/credits).toFixed(2),caption:`${count} semester${count===1?"":"s"} counted · ${credits.toFixed(2)} total credits`,badge:`${count} counted`});
 }
 function add(){if(rows.length>=30){setError("Maximum of 30 semesters reached.");return;}setRows(old=>[...old,{gpa:"",credits:""}]);}
 return <Page title="CGPA across semesters" description="" count={`${rows.length} semesters`}>
  <div className="table-head sem-grid"><span>Semester</span><span>GPA</span><span>Credits</span></div>
  {rows.map((r,i)=><div className="semester-row sem-grid" key={i}><label htmlFor={`g${i}`}>{ordinal(i+1)}</label><input id={`g${i}`} type="number" min="0" max="10" step=".01" placeholder="GPA" value={r.gpa} onChange={e=>update(i,"gpa",e.target.value)} aria-label={`${ordinal(i+1)} GPA`}/><input type="number" min="0" max="250" step="1" placeholder="Credits" value={r.credits} onChange={e=>update(i,"credits",e.target.value)} aria-label={`${ordinal(i+1)} credits`}/></div>)}
  {error&&<p className="error" role="alert">{error}</p>}<div className="actions"><button className="button secondary" onClick={add} disabled={rows.length>=30}>＋ Add semester</button><button className="button primary" onClick={calculate}>Calculate CGPA ↗</button></div>
  {result&&<Result {...result} label="Cumulative GPA"/>}<p className="footnote">Each semester is weighted by its credit count: sum(GPA × credits) ÷ sum(credits). A semester with either field missing, or credits set to 0, is skipped.</p>
 </Page>;
}
function Home(){
 const navigate=useNavigate();
 return <main className="landing"><div className="hero-copy"><div className="kicker"><span/>YOUR SEMESTER, IN FOCUS</div><h1>Make every credit<br/>count.</h1><p>Three straightforward tools to calculate your semester GPA, estimate your next CGPA, or work through any number of semesters.</p><button className="button primary get-started" onClick={()=>navigate("/gpa")}>Get started <b>↗</b></button></div>
  <div className="art" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="grade-card"><small>SEMESTER SNAPSHOT</small><div className="grade">8.74<span>/10</span></div><div className="progress"><i/></div><div className="grade-footer"><span>Weighted GPA</span><b>● ON TRACK</b></div></div><div className="float top"><b>↗</b><span><strong>Credits count</strong><small>Weighted, not averaged</small></span></div><div className="float bottom"><b className="float-no">03</b><span><strong>Simple tools</strong><small>One clear result</small></span></div></div>
 </main>;
}
export default function App(){
 const location=useLocation();useEffect(()=>{window.scrollTo({top:0,behavior:"auto"})},[location.pathname]);
 return <div className="app"><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/gpa" element={<CalculatorLayout><Gpa/></CalculatorLayout>}/><Route path="/quick-cgpa" element={<CalculatorLayout><Quick/></CalculatorLayout>}/><Route path="/any-sem-cgpa" element={<CalculatorLayout><AnySem/></CalculatorLayout>}/><Route path="*" element={<Home/>}/></Routes></div>;
}
