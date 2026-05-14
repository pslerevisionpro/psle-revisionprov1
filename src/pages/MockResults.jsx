import { useLocation, Link } from 'react-router-dom'

function gradeColor(p) {
  if (p >= 80) return '#27AE60'
  if (p >= 65) return '#2980B9'
  if (p >= 50) return '#E67E22'
  return '#C0392B'
}
function gradeLetter(p) {
  if (p >= 80) return 'A'
  if (p >= 65) return 'B'
  if (p >= 50) return 'C'
  return 'D'
}

export default function MockResults() {
  const { state } = useLocation()
  if (!state) return <div style={{textAlign:'center',padding:80}}><Link to="/subjects" className="btn btn-primary">Back</Link></div>
  const { score, total, pct, subject, answers, questions, autoSubmit } = state
  const color = gradeColor(pct)
  const topicMap = {}
  answers.forEach((a, i) => {
    const topic = questions[i]?.subject_area || 'General'
    if (!topicMap[topic]) topicMap[topic] = { correct:0, total:0 }
    topicMap[topic].total++
    if (a.correct) topicMap[topic].correct++
  })
  const topics = Object.entries(topicMap)
    .map(([name, d]) => ({ name, pct: Math.round((d.correct/d.total)*100), correct:d.correct, total:d.total }))
    .sort((a,b) => a.pct - b.pct)
  const unanswered = answers.filter(a => a.selected === null || a.selected === undefined).length

  return (
    <div style={{minHeight:'100vh',background:'#F0F2F5'}}>
      <div style={{background:'var(--forest)',padding:'40px 24px'}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>
          {autoSubmit && <div style={{background:'rgba(230,126,34,0.25)',border:'1px solid rgba(230,126,34,0.4)',borderRadius:8,padding:'10px 16px',fontSize:'0.85rem',color:'#FFE082',marginBottom:16}}>⏱ Time expired — submitted automatically.</div>}
          <p style={{color:'rgba(245,240,232,0.6)',fontSize:'0.8rem',fontWeight:600,textTransform:'uppercase',marginBottom:6}}>📝 Mock Examination Results</p>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',color:'var(--ivory)'}}>{subject}</h1>
        </div>
      </div>
      <div style={{maxWidth:760,margin:'0 auto',padding:'32px 24px 64px'}}>
        <div style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 20px rgba(27,61,47,0.1)',padding:'32px 28px',marginBottom:20,display:'flex',gap:28,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative',width:140,height:140,flexShrink:0}}>
            <svg width={140} height={140}>
              <circle cx={70} cy={70} r={60} fill="none" stroke="#F0F0F0" strokeWidth={10}/>
              <circle cx={70} cy={70} r={60} fill="none" stroke={color} strokeWidth={10}
                strokeDasharray={`${(pct/100)*376.8} 376.8`} strokeLinecap="round"
                transform="rotate(-90 70 70)"/>
            </svg>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',fontWeight:700,color}}>{pct}%</span>
              <span style={{fontSize:'0.75rem',color:'#AAA'}}>{score}/{total}</span>
            </div>
          </div>
          <div style={{flex:1,minWidth:200}}>
            <div style={{background:color,color:'#fff',fontFamily:'var(--font-display)',fontSize:'1.4rem',fontWeight:700,width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>{gradeLetter(pct)}</div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.4rem',color:'var(--forest)',marginBottom:6}}>{pct>=80?'Excellent!':pct>=65?'Well done!':pct>=50?'Satisfactory':'Needs improvement'}</h2>
            <p style={{fontSize:'0.88rem',color:'var(--charcoal-lt)',lineHeight:1.6,marginBottom:16}}>{score} correct out of {total}. {unanswered>0?`${unanswered} questions not answered.`:''}</p>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {[{label:'Correct',val:score,color:'#27AE60'},{label:'Wrong',val:total-score-unanswered,color:'#C0392B'},{label:'Skipped',val:unanswered,color:'#888'},{label:'Grade',val:gradeLetter(pct),color}].map((st,i)=>(
                <div key={i} style={{background:'var(--ivory)',borderRadius:10,padding:'8px 14px',textAlign:'center',minWidth:56}}>
                  <span style={{display:'block',fontFamily:'var(--font-display)',fontSize:'1.2rem',fontWeight:700,color:st.color}}>{st.val}</span>
                  <span style={{display:'block',fontSize:'0.65rem',color:'#AAA',fontWeight:600,textTransform:'uppercase'}}>{st.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:16,border:'1px solid var(--ivory-dk)',padding:'24px 28px',marginBottom:20}}>
          <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',color:'var(--forest)',marginBottom:4}}>📊 Performance by Topic</h3>
          <p style={{fontSize:'0.78rem',color:'#AAA',marginBottom:16}}>Sorted weakest to strongest</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {topics.map((t,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:160,flexShrink:0}}>
                  <p style={{fontSize:'0.83rem',fontWeight:600,color:'var(--charcoal)',margin:0}}>{t.name}</p>
                  <p style={{fontSize:'0.7rem',color:'#AAA',margin:0}}>{t.correct}/{t.total}</p>
                </div>
                <div style={{flex:1,height:8,background:'#F0F0F0',borderRadius:50,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:50,background:gradeColor(t.pct),width:`${t.pct}%`}}/>
                </div>
                <span style={{fontSize:'0.82rem',fontWeight:700,color:gradeColor(t.pct),width:36,textAlign:'right'}}>{t.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:16,border:'1px solid var(--ivory-dk)',padding:'24px 28px',marginBottom:20}}>
          <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',color:'var(--forest)',marginBottom:4}}>📋 Question Review</h3>
          <p style={{fontSize:'0.78rem',color:'#AAA',marginBottom:16}}>Every question with the correct answer and explanation</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {questions.map((q,i)=>{
              const a=answers[i]; const correct=a?.correct; const skipped=a?.selected===null||a?.selected===undefined
              return (
                <div key={i} style={{background:'#FAFBFC',borderRadius:10,padding:'12px 14px',borderLeft:`4px solid ${correct?'#27AE60':skipped?'#888':'#C0392B'}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:6}}>
                    <span style={{flexShrink:0,width:24,height:24,borderRadius:6,background:correct?'#27AE60':skipped?'#888':'#C0392B',color:'#fff',fontSize:'0.72rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{i+1}</span>
                    <p style={{fontSize:'0.85rem',fontWeight:600,color:'var(--charcoal)',lineHeight:1.5,margin:0}}>{q.question}</p>
                  </div>
                  <div style={{paddingLeft:34,display:'flex',flexDirection:'column',gap:3}}>
                    {!skipped&&a.selected!==q.correct&&<span style={{fontSize:'0.78rem',color:'#C0392B'}}>Your answer: <strong>{String.fromCharCode(65+a.selected)}) {q.options[a.selected]}</strong></span>}
                    <span style={{fontSize:'0.78rem',color:'#27AE60'}}>Correct: <strong>{String.fromCharCode(65+q.correct)}) {q.options[q.correct]}</strong></span>
                    {skipped&&<span style={{fontSize:'0.78rem',color:'#AAA'}}>Not answered</span>}
                    {q.explanation&&<p style={{fontSize:'0.78rem',color:'var(--charcoal-lt)',lineHeight:1.5,marginTop:6,borderTop:'1px solid var(--ivory-dk)',paddingTop:6}}>💡 {q.explanation}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
          <Link to={`/mock/${subject.toLowerCase().replace(/ /g,'')}`} className="btn btn-primary">Retake Mock Exam</Link>
          <Link to="/subjects" style={{fontSize:'0.88rem',fontWeight:600,color:'var(--forest)',textDecoration:'none'}}>Practice by topic →</Link>
          <Link to="/dashboard" style={{fontSize:'0.88rem',fontWeight:600,color:'var(--forest)',textDecoration:'none'}}>Dashboard →</Link>
        </div>
      </div>
    </div>
  )
}
