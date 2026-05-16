import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuestions } from '../lib/useQuestions'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const EXAM_DURATION = 90 * 60
const CONFIGS = {
  science:{name:'Science',emoji:'🔬'},maths:{name:'Mathematics',emoji:'🔢'},
  english:{name:'English',emoji:'✏️'},setswana:{name:'Setswana',emoji:'🗣️'},
  agriculture:{name:'Agriculture',emoji:'🌱'},social:{name:'Social Studies',emoji:'🌍'},rme:{name:'RME',emoji:'📖'},
}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}

function groupIntoBatches(questions){
  const soloGroups=[],batchMap=new Map()
  for(const q of questions){
    if(!q.context_text){soloGroups.push({questions:[q]})}
    else{if(!batchMap.has(q.context_text))batchMap.set(q.context_text,[]);batchMap.get(q.context_text).push(q)}
  }
  const SEQUENTIAL=/\b(arrange|correct order|which order|sequence|rearrange|put.*order)\b/i
  const passageLots=[...batchMap.values()].map(qs=>{
    const sorted=[...qs].sort((a,b)=>a.question_number-b.question_number)
    const isSeq=sorted.some(q=>SEQUENTIAL.test(q.question))
    return{questions:isSeq?sorted:shuffle(sorted)}
  })
  return shuffle([...soloGroups,...passageLots]).flatMap(lot=>lot.questions)
}

function pad(n){return String(n).padStart(2,'0')}
function fmt(s){const m=Math.floor(s/60);return`${pad(m)}:${pad(s%60)}`}

export default function MockExam() {
  const {subject}=useParams(); const navigate=useNavigate(); const {session}=useAuth()
  const config=CONFIGS[subject]
  const {questions:rawQ,loading,error}=useQuestions(subject,{limit:60})
  const [phase,setPhase]=useState('setup')
  const [questions,setQuestions]=useState([])
  const [answers,setAnswers]=useState({})
  const [flagged,setFlagged]=useState(new Set())
  const [current,setCurrent]=useState(0)
  const [timeLeft,setTimeLeft]=useState(EXAM_DURATION)
  const [navOpen,setNavOpen]=useState(false)
  const timerRef=useRef(null)

  useEffect(()=>{
    if(rawQ.length>0&&questions.length===0){
      setQuestions(groupIntoBatches([...rawQ]).slice(0,60))
    }
  },[rawQ])

  const handleSubmit=useCallback(async(auto=false)=>{
    clearInterval(timerRef.current)
    const final=questions.map((q,i)=>({questionId:q.id,selected:answers[i]??null,correct:answers[i]===q.correct}))
    const score=final.filter(a=>a.correct).length,total=questions.length,pct=Math.round(score/total*100)
    if(session){
      try{
        await supabase.from('quiz_results').insert({user_id:session.user.id,subject:config.name,score,total,pct})
        for(const a of final){
          if(a.selected===null)continue
          await supabase.from('student_attempts').insert({student_id:session.user.id,question_id:a.questionId,paper_id:questions.find(q=>q.id===a.questionId)?.paper_id??null,selected_answer:String.fromCharCode(65+a.selected),is_correct:a.correct})
        }
      }catch(e){console.error(e)}
    }
    navigate('/mock-results',{state:{score,total,pct,subject:config.name,answers:final,questions,autoSubmit:auto}})
  },[answers,questions,session,config,navigate])

  useEffect(()=>{
    if(phase!=='exam')return
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);handleSubmit(true);return 0}return t-1})
    },1000)
    return()=>clearInterval(timerRef.current)
  },[phase,handleSubmit])

  if(!config)return(<div className="page-container"><Navbar/><div style={{textAlign:'center',padding:80}}><Link to="/subjects" className="btn btn-primary">Back</Link></div></div>)
  if(loading||(rawQ.length>0&&questions.length===0))return(<div className="page-container"><Navbar/><div style={{textAlign:'center',padding:80}}><div style={{fontSize:'2.5rem',marginBottom:16}}>{config?.emoji}</div><h2 style={{fontFamily:'var(--font-display)',color:'var(--forest)'}}>Preparing examination…</h2><p style={{color:'var(--charcoal-lt)'}}>Loading 60 questions</p></div></div>)
  if(error)return(<div className="page-container"><Navbar/><div style={{textAlign:'center',padding:80}}><h2 style={{color:'var(--error)'}}>Could not load questions</h2><p>{error}</p><Link to="/subjects" className="btn btn-primary" style={{marginTop:20}}>Back</Link></div></div>)

  if(phase==='setup')return(
    <div className="page-container"><Navbar/>
      <div style={{minHeight:'calc(100vh - 64px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'#F0F2F5'}}>
        <div style={{background:'#fff',borderRadius:20,boxShadow:'0 4px 32px rgba(27,61,47,0.12)',padding:'48px 40px',maxWidth:520,width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'3rem',marginBottom:12}}>{config.emoji}</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',color:'var(--forest)',marginBottom:4}}>{config.name}</h1>
          <p style={{color:'var(--charcoal-lt)',marginBottom:28}}>Mock Examination — Paper 1</p>
          <div style={{background:'var(--ivory)',borderRadius:12,padding:'16px 20px',marginBottom:20,textAlign:'left'}}>
            {[['❓','Questions','60'],['⏱','Time allowed','90 minutes'],['✏️','Answer type','Multiple choice (A–D)'],['📋','Instructions','Answer ALL questions']].map(([icon,label,val],i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<3?'1px solid var(--ivory-dk)':'none'}}>
                <span style={{width:24,textAlign:'center'}}>{icon}</span>
                <span style={{flex:1,fontSize:'0.85rem',color:'var(--charcoal-lt)',fontWeight:500}}>{label}</span>
                <span style={{fontSize:'0.85rem',fontWeight:700,color:'var(--forest)'}}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{background:'#FFF8E7',border:'1px solid #FFE082',borderRadius:10,padding:'12px 16px',fontSize:'0.82rem',color:'#856404',marginBottom:24,textAlign:'left'}}>
            ⚠️ Once started, the timer cannot be paused. Exam submits automatically when time runs out.
          </div>
          <button style={{background:'var(--forest)',color:'var(--gold-lt)',border:'none',borderRadius:10,padding:'14px 32px',fontFamily:'var(--font-body)',fontSize:'1rem',fontWeight:700,cursor:'pointer',width:'100%',marginBottom:12}} onClick={()=>setPhase('exam')}>
            Start Examination →
          </button>
          <Link to="/subjects" style={{fontSize:'0.85rem',color:'var(--charcoal-lt)',textDecoration:'none'}}>← Back to subjects</Link>
        </div>
      </div>
    </div>
  )

  const q=questions[current],answered=Object.keys(answers).length
  const isWarn=timeLeft<=300,isCrit=timeLeft<=60

  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'#F0F2F5'}}>
      <header style={{background:'var(--forest)',padding:'0 24px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          <span style={{fontFamily:'var(--font-display)',color:'var(--ivory)',fontSize:'0.95rem',fontWeight:600}}>{config.emoji} {config.name} — Mock Exam</span>
          <span style={{fontSize:'0.72rem',color:'rgba(245,240,232,0.6)'}}>{answered}/{questions.length} answered</span>
        </div>
        <div style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'1.3rem',padding:'6px 16px',borderRadius:8,minWidth:100,textAlign:'center',color:isCrit?'#FF6B6B':isWarn?'#FFD700':'var(--gold-lt)',background:isCrit?'rgba(255,107,107,0.2)':isWarn?'rgba(255,215,0,0.15)':'rgba(255,255,255,0.1)'}}>
          ⏱ {fmt(timeLeft)}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={{background:'rgba(255,255,255,0.1)',color:'var(--ivory)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.82rem',fontWeight:600}} onClick={()=>setNavOpen(o=>!o)}>📋 Navigator</button>
          <button style={{background:'var(--gold)',color:'var(--forest)',border:'none',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.82rem',fontWeight:700}} onClick={()=>{if(window.confirm(`Submit? ${answered}/${questions.length} answered.`))handleSubmit(false)}}>Submit →</button>
        </div>
      </header>

      {navOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',justifyContent:'flex-end'}} onClick={()=>setNavOpen(false)}>
          <div style={{background:'#fff',width:320,height:'100vh',overflowY:'auto',padding:20,display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <p style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',color:'var(--forest)',fontWeight:600,margin:0}}>Navigator</p>
              <button style={{background:'none',border:'none',fontSize:'1.2rem',cursor:'pointer'}} onClick={()=>setNavOpen(false)}>✕</button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:16,fontSize:'0.72rem',color:'var(--charcoal-lt)'}}>
              <span>🟢 Answered</span><span>🟠 Flagged</span><span>⬜ Unanswered</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,marginBottom:20}}>
              {questions.map((_,i)=>{
                const isAns=answers[i]!==undefined,isFlag=flagged.has(i),isCur=i===current
                return(
                  <button key={i} style={{padding:'6px 4px',border:`1.5px solid ${isCur?'var(--forest)':isAns?'var(--forest)':isFlag?'#E67E22':'#E0E0E0'}`,borderRadius:6,background:isCur?'var(--forest)':isAns?'rgba(27,61,47,0.08)':isFlag?'rgba(230,126,34,0.08)':'#F5F5F5',cursor:'pointer',fontSize:'0.72rem',fontWeight:600,color:isCur?'#fff':isAns?'var(--forest)':isFlag?'#E67E22':'#888',fontFamily:'var(--font-body)'}} onClick={()=>{setCurrent(i);setNavOpen(false)}}>{i+1}{isFlag?'🚩':''}</button>
                )
              })}
            </div>
            <button style={{background:'var(--forest)',color:'var(--gold-lt)',border:'none',borderRadius:8,padding:12,fontFamily:'var(--font-body)',fontSize:'0.9rem',fontWeight:700,cursor:'pointer',marginTop:'auto'}} onClick={()=>{setNavOpen(false);if(window.confirm(`Submit? ${answered}/${questions.length} answered.`))handleSubmit(false)}}>Submit Examination →</button>
          </div>
        </div>
      )}

      <div style={{flex:1,maxWidth:760,margin:'0 auto',width:'100%',padding:'24px 20px'}}>
        <div style={{background:'#E0E0E0',borderRadius:50,height:6,marginBottom:20,overflow:'hidden'}}>
          <div style={{height:'100%',background:'var(--forest)',borderRadius:50,transition:'width 0.3s ease',width:`${((current+1)/questions.length)*100}%`}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
          <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.9rem',color:'var(--charcoal-lt)'}}>Question {current+1} of {questions.length}</span>
          <div style={{display:'flex',gap:8}}>
            {q.subject_area&&<span style={{fontSize:'0.78rem',fontWeight:600,color:'var(--forest)',background:'rgba(27,61,47,0.08)',padding:'4px 12px',borderRadius:50}}>{q.subject_area}</span>}
            <button style={{fontSize:'0.78rem',fontWeight:600,color:flagged.has(current)?'#E67E22':'#888',background:flagged.has(current)?'rgba(230,126,34,0.08)':'#F5F5F5',border:`1.5px solid ${flagged.has(current)?'#E67E22':'#E0E0E0'}`,borderRadius:50,padding:'4px 12px',cursor:'pointer',fontFamily:'var(--font-body)'}} onClick={()=>setFlagged(prev=>{const n=new Set(prev);n.has(current)?n.delete(current):n.add(current);return n})}>🚩 {flagged.has(current)?'Flagged':'Flag'}</button>
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 16px rgba(27,61,47,0.08)',padding:'32px 28px',marginBottom:16}}>
          {q.context_text&&(
            <div style={{background:'#f0f7ff',border:'1px solid #c7d9f5',borderLeft:'4px solid var(--forest)',borderRadius:'0 8px 8px 0',padding:'16px 18px',marginBottom:20}}>
              <div style={{fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--forest)',marginBottom:8}}>📖 Read the following, then answer the question</div>
              <div style={{fontSize:'0.91rem',color:'var(--charcoal)',lineHeight:1.75,whiteSpace:'pre-line',maxHeight:260,overflowY:'auto'}}>{q.context_text}</div>
            </div>
          )}
          <p style={{fontSize:'1.1rem',fontWeight:600,color:'var(--navy)',lineHeight:1.65,marginBottom:24,fontFamily:'var(--font-display)'}}>{q.question}</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {q.options.map((opt,i)=>{
              const sel=answers[current]===i
              return(
                <button key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',border:`2px solid ${sel?'var(--forest)':'#E8EBF0'}`,borderRadius:12,background:sel?'rgba(27,61,47,0.06)':'#FAFBFC',cursor:'pointer',textAlign:'left',width:'100%',fontFamily:'var(--font-body)',fontSize:'0.95rem',color:'var(--charcoal)',fontWeight:500,transition:'all 0.15s'}} onClick={()=>setAnswers(prev=>({...prev,[current]:i}))}>
                  <span style={{width:32,height:32,borderRadius:8,background:sel?'var(--forest)':'#E8EBF0',color:sel?'#fff':'#888',fontWeight:700,fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:'var(--font-display)'}}>{String.fromCharCode(65+i)}</span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button style={{background:'#fff',color:'var(--charcoal-lt)',border:'1.5px solid #E0E0E0',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.88rem',fontWeight:600}} onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0}>← Previous</button>
          <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--charcoal-lt)'}}>{answers[current]!==undefined?`✓ ${String.fromCharCode(65+answers[current])}`:' Not answered'}</span>
          {current<questions.length-1
            ?<button style={{background:'var(--forest)',color:'var(--ivory)',border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.88rem',fontWeight:700}} onClick={()=>setCurrent(c=>c+1)}>Next →</button>
            :<button style={{background:'var(--gold)',color:'var(--forest)',border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.88rem',fontWeight:700}} onClick={()=>{if(window.confirm(`Submit? ${answered}/${questions.length} answered.`))handleSubmit(false)}}>Submit ✓</button>
          }
        </div>
      </div>
    </div>
  )
}
