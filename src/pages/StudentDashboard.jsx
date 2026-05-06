import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'science',     name: 'Science',       emoji: '🔬', color: '#1B3D2F', available: true },
  { key: 'english',     name: 'English',        emoji: '✏️', color: '#2D5A45', available: true },
  { key: 'maths',       name: 'Mathematics',    emoji: '🔢', color: '#3F7A5E', available: true },
  { key: 'setswana',    name: 'Setswana',       emoji: '🗣️', color: '#1B3D2F', available: true },
  { key: 'social',      name: 'Social Studies', emoji: '🌍', color: '#2D5A45', available: true },
  { key: 'agriculture', name: 'Agriculture',    emoji: '🌱', color: '#5C7A3E', available: true },
  { key: 'rme',         name: 'RME',            emoji: '📖', color: '#3F7A5E', available: true },
]

function clamp(v) { return Math.min(100, Math.max(0, v ?? 0)) }
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

function ScoreChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'32px 0' }}>
        <p style={{ fontSize:'2rem', marginBottom:8 }}>📊</p>
        <p style={{ color:'#AAA', fontSize:'0.85rem', marginBottom:8 }}>No attempts yet</p>
        <Link to="/subjects" style={{ color:'var(--forest-lt)', fontWeight:600, fontSize:'0.85rem' }}>Take your first quiz →</Link>
      </div>
    )
  }
  const BAR_W=6, GAP=18, H=100, BOTTOM=36, TOP=20, LEFT=28
  const TOTAL_H = H+BOTTOM+TOP
  const totalW = Math.max(data.length*(BAR_W+GAP)-GAP+LEFT, 160)
  return (
    <div style={{ maxWidth:360, margin:'0 auto', overflowX:'auto' }}>
      <svg viewBox={`0 0 ${totalW} ${TOTAL_H}`} width="100%" style={{ overflow:'visible', display:'block' }}>
        {[0,25,50,75,100].map(v => {
          const y = TOP+H-(v/100)*H
          return (
            <g key={v}>
              <line x1={LEFT} y1={y} x2={totalW} y2={y} stroke={v===0?'#C8C8C8':'#EBEBEB'} strokeWidth={v===0?1:0.5}/>
              <text x={LEFT-4} y={y+3.5} fontSize="7" fill="#A0A0A0" textAnchor="end" fontFamily="'Outfit',sans-serif">{v}</text>
            </g>
          )
        })}
        {data.map((d,i) => {
          const pct=clamp(d.pct), x=LEFT+i*(BAR_W+GAP)
          const barH=(pct/100)*H, y=TOP+H-barH, color=gradeColor(pct)
          return (
            <g key={i}>
              <rect x={x} y={y} width={BAR_W} height={barH} rx={3} fill={color} opacity="0.88"/>
              <text x={x+BAR_W/2} y={y-4} fontSize="7.5" fill={color} textAnchor="middle" fontWeight="700" fontFamily="'Outfit',sans-serif">{pct}%</text>
              <text x={x+BAR_W/2} y={TOP+H+12} fontSize="7" fill="#888" textAnchor="middle" fontFamily="'Outfit',sans-serif">{d.label}</text>
              <text x={x+BAR_W/2} y={TOP+H+23} fontSize="6.5" fill="#AAAAAA" textAnchor="middle" fontFamily="'Outfit',sans-serif">{d.date}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Ring({ pct, size=60 }) {
  const safe=clamp(pct), r=(size-10)/2, circ=2*Math.PI*r
  const fill=safe>0?(safe/100)*circ:0, color=safe>0?gradeColor(safe):'#E0E0E0'
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0F0F0" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:'stroke-dasharray 0.7s ease' }}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={safe>0?'11':'13'}
        fontWeight="700" fill={safe>0?color:'#C0C0C0'} fontFamily="'Outfit',sans-serif">
        {safe>0?`${safe}%`:'—'}
      </text>
    </svg>
  )
}

function Spark({ attempts }) {
  if (!attempts||attempts.length<2) return null
  const W=100, H=28, P=3, pts=attempts.slice(-8)
  const xStep=(W-P*2)/(pts.length-1)
  const y=v=>H-P-(clamp(v)/100)*(H-P*2)
  const points=pts.map((p,i)=>`${P+i*xStep},${y(p.pct)}`).join(' ')
  return (
    <svg width={W} height={H} style={{ display:'block', marginTop:4 }}>
      <polyline points={points} fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={P+i*xStep} cy={y(p.pct)} r="2.5" fill={gradeColor(clamp(p.pct))}/>)}
    </svg>
  )
}

// ── Weak Areas Panel ──────────────────────────────────────────
function WeakAreasPanel({ weakAreas, loading }) {
  if (loading) return <div className="spinner" style={{ margin:'16px auto' }}/>

  if (!weakAreas || weakAreas.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <p style={{ fontSize:'1.5rem', marginBottom:6 }}>🎯</p>
        <p style={{ color:'#AAA', fontSize:'0.82rem' }}>
          Complete a few quizzes to see your weak areas here.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {weakAreas.map((area, i) => {
        const pct = Math.round(area.accuracy_pct ?? 0)
        const color = gradeColor(pct)
        const barWidth = `${Math.max(pct, 4)}%`
        return (
          <div key={i} style={s.weakRow}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <div>
                <span style={s.weakTopic}>{area.subject_area}</span>
                <span style={s.weakBloom}> · {area.blooms_level}</span>
              </div>
              <span style={{ ...s.weakPct, color }}>{pct}%</span>
            </div>
            <div style={s.weakBarBg}>
              <div style={{ ...s.weakBarFill, width: barWidth, background: color }}/>
            </div>
            <p style={s.weakAttempts}>{area.total_attempts} attempt{area.total_attempts !== 1 ? 's' : ''}</p>
          </div>
        )
      })}
      <p style={s.weakHint}>
        💡 Focus on these topics in your next session to improve your score.
      </p>
    </div>
  )
}

export default function StudentDashboard() {
  const { session, profile, signOut } = useAuth()
  const [allResults, setAllResults]   = useState([])
  const [weakAreas, setWeakAreas]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [weakLoading, setWeakLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { if (session) loadData() }, [session])

  async function loadData() {
    setLoading(true)
    setWeakLoading(true)

    // Load quiz results (score history)
    const { data: results } = await supabase
      .from('quiz_results').select('*')
      .eq('user_id', session.user.id)
      .lte('pct', 100)
      .order('created_at', { ascending: true })
    if (results) setAllResults(results)
    setLoading(false)

    // Load weak areas from view
    const { data: weak } = await supabase
      .from('student_weak_areas')
      .select('subject_area, blooms_level, blooms_level_num, total_attempts, accuracy_pct')
      .eq('student_id', session.user.id)
      .order('accuracy_pct', { ascending: true })
      .limit(5)
    if (weak) setWeakAreas(weak)
    setWeakLoading(false)
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student'
  const bestScores={}, attemptsBySubject={}
  allResults.forEach(r => {
    const key=r.subject?.toLowerCase()
    if (!bestScores[key]||r.pct>bestScores[key]) bestScores[key]=clamp(r.pct)
    if (!attemptsBySubject[key]) attemptsBySubject[key]=[]
    attemptsBySubject[key].push({ ...r, pct:clamp(r.pct) })
  })
  const attempted=Object.values(bestScores)
  const overallAvg=attempted.length>0?Math.round(attempted.reduce((a,b)=>a+b,0)/attempted.length):0
  const totalAttempts=allResults.length
  const bestScore=attempted.length>0?Math.max(...attempted):0
  const recentScores=[...allResults].reverse().slice(0,5)
  const chartData=[...allResults].reverse().slice(0,10).reverse().map(r=>({
    pct:clamp(r.pct),
    label:r.subject?.slice(0,3)||'Q',
    date:new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
  }))

  return (
    <div className="page-container">
      <Navbar />
      <div style={s.banner}>
        <div className="content-wrapper" style={s.bannerInner}>
          <div style={{ flex:1 }}>
            <p style={s.bannerRole}>🎒 Student Dashboard</p>
            <h1 style={s.bannerTitle}>Welcome back, {displayName.split(' ')[0]}!</h1>
            <p style={s.bannerSub}>
              {totalAttempts===0
                ? "You haven't taken any quizzes yet — start with Science below!"
                : `${totalAttempts} attempt${totalAttempts>1?'s':''} across ${attempted.length} subject${attempted.length>1?'s':''}.`}
            </p>
          </div>
          <div style={s.statRow}>
            {[
              { val:totalAttempts||'—', label:'Attempts' },
              { val:overallAvg>0?`${overallAvg}%`:'—', label:'Avg Score', color:overallAvg>0?gradeColor(overallAvg):undefined },
              { val:bestScore>0?`${bestScore}%`:'—', label:'Best Score', color:bestScore>0?gradeColor(bestScore):undefined },
              { val:overallAvg>0?gradeLetter(overallAvg):'—', label:'Grade', color:'var(--gold-lt)' },
            ].map((st,i)=>(
              <div key={i} style={s.statBox}>
                <span style={{ ...s.statNum, ...(st.color?{color:st.color}:{}) }}>{st.val}</span>
                <span style={s.statLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop:32, paddingBottom:64 }}>
        <div style={s.grid}>
          <div style={{ minWidth:0 }}>

            {/* Score history chart */}
            <div style={s.chartCard}>
              <div style={s.chartHeader}>
                <div>
                  <p style={s.chartTitle}>Score History</p>
                  <p style={s.chartSub}>Your last {chartData.length} quiz attempt{chartData.length!==1?'s':''}</p>
                </div>
                {overallAvg>0&&<div style={{ ...s.chartBadge, background:gradeColor(overallAvg)+'18', color:gradeColor(overallAvg) }}>Avg {overallAvg}%</div>}
              </div>
              {loading?<div className="spinner" style={{ margin:'24px auto' }}/>:<ScoreChart data={chartData}/>}
            </div>

            {/* Weak areas — full width panel */}
            <div style={s.weakCard}>
              <div style={s.weakCardHeader}>
                <div>
                  <p style={s.weakCardTitle}>📉 Areas to Improve</p>
                  <p style={s.weakCardSub}>Topics where your accuracy is below 70%</p>
                </div>
                {weakAreas.length > 0 && (
                  <Link to="/subjects" style={s.weakCardBtn}>Practice now →</Link>
                )}
              </div>
              <WeakAreasPanel weakAreas={weakAreas} loading={weakLoading}/>
            </div>

            {/* Subjects */}
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Subjects</h2>
              <Link to="/subjects" className="btn btn-primary btn-sm">Choose Subject →</Link>
            </div>
            {loading?<div className="spinner"/>:(
              <div style={s.subGrid}>
                {SUBJECTS.map(sub=>{
                  const key=sub.name.toLowerCase()
                  const best=bestScores[key]??bestScores[sub.key]??null
                  const attempts=attemptsBySubject[key]||attemptsBySubject[sub.key]||[]
                  return (
                    <Link key={sub.key} to="/subjects" style={s.subCard}>
                      <Ring pct={best??0} size={60}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <span style={{ ...s.subDot, background:sub.color }}>{sub.emoji}</span>
                          <span style={s.subName}>{sub.name}</span>
                        </div>
                        {best!==null?(
                          <>
                            <p style={{ fontSize:'0.72rem', fontWeight:700, color:gradeColor(best), marginBottom:2 }}>
                              Best {best}% · Grade {gradeLetter(best)} · {attempts.length} attempt{attempts.length>1?'s':''}
                            </p>
                            <Spark attempts={attempts}/>
                          </>
                        ):(
                          <p style={{ fontSize:'0.72rem', color:'#AAA', fontStyle:'italic' }}>
                            {sub.available?'Not attempted yet':'Coming soon'}
                          </p>
                        )}
                      </div>
                      {sub.available&&<span style={s.subBadge}>{best!==null?'Retry →':'Start →'}</span>}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>🚀 Start Practising</p>
<p style={s.sideCardDesc}>Choose a subject and pick how many questions — 10, 20, or full 60.</p>
<Link to="/subjects" className="btn btn-primary btn-full" style={{ marginTop:14, fontSize:'0.9rem' }}>
  Choose Subject & Mode →
</Link>
            </div>

            <div style={{ ...s.sideCard, padding:'18px 16px' }}>
              <p style={s.sideCardTitle}>🎯 Overview</p>
              <div style={s.circleGrid}>
                {SUBJECTS.map(sub=>{
                  const best=bestScores[sub.name.toLowerCase()]??bestScores[sub.key]??0
                  return (
                    <div key={sub.key} style={{ textAlign:'center' }}>
                      <Ring pct={best} size={50}/>
                      <p style={{ fontSize:'0.62rem', color:'#999', marginTop:3, fontWeight:600 }}>
                        {sub.emoji} {sub.name.split(' ')[0]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>📋 Recent Activity</p>
              {recentScores.length===0?(
                <p style={{ color:'#AAA', fontSize:'0.83rem', textAlign:'center', padding:'16px 0' }}>No attempts yet</p>
              ):recentScores.map((r,i)=>(
                <div key={i} style={s.actRow}>
                  <div>
                    <p style={s.actSubject}>{r.subject}</p>
                    <p style={s.actDate}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ ...s.actScore, color:gradeColor(clamp(r.pct)) }}>{clamp(r.pct)}%</p>
                    <p style={{ ...s.actGrade, color:gradeColor(clamp(r.pct)) }}>Grade {gradeLetter(clamp(r.pct))}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.tipCard}>
              <p style={s.tipBadge}>💡 Tip</p>
              <p style={s.tipText}>
                {totalAttempts===0?'Start with Science — it\'s available now.'
                 :weakAreas.length>0?`Focus on ${weakAreas[0]?.subject_area} — that's your weakest area right now.`
                 :overallAvg>=70?'Great scores! Consistency is key — keep going.'
                 :'Review explanations after each wrong answer.'}
              </p>
            </div>

            <button onClick={async()=>{ await signOut(); navigate('/') }} style={s.signOut}>← Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  banner:         { background:'var(--forest)', padding:'36px 0 40px' },
  bannerInner:    { display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, flexWrap:'wrap' },
  bannerRole:     { color:'var(--sage-lt)', fontSize:'0.78rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 },
  bannerTitle:    { fontFamily:'var(--font-display)', fontSize:'clamp(1.6rem,3vw,2.4rem)', color:'var(--ivory)', marginBottom:8 },
  bannerSub:      { color:'rgba(245,240,232,0.6)', fontSize:'0.9rem' },
  statRow:        { display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 },
  statBox:        { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'10px 14px', textAlign:'center', minWidth:64 },
  statNum:        { display:'block', fontFamily:'var(--font-display)', fontSize:'1.45rem', fontWeight:700, color:'var(--gold-lt)', lineHeight:1 },
  statLabel:      { display:'block', fontSize:'0.64rem', color:'var(--sage-lt)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:4 },
  grid:           { display:'grid', gridTemplateColumns:'1fr 288px', gap:24, alignItems:'start' },
  chartCard:      { background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)', padding:'20px 24px', marginBottom:24, boxShadow:'0 2px 12px rgba(27,61,47,0.07)' },
  chartHeader:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  chartTitle:     { fontFamily:'var(--font-display)', fontSize:'1.15rem', color:'var(--forest)', marginBottom:2 },
  chartSub:       { fontSize:'0.75rem', color:'#AAA' },
  chartBadge:     { fontSize:'0.78rem', fontWeight:700, padding:'4px 10px', borderRadius:100 },

  // Weak areas
  weakCard:       { background:'var(--white)', borderRadius:16, border:'1.5px solid #FFD9D9', padding:'20px 24px', marginBottom:24, boxShadow:'0 2px 12px rgba(192,57,43,0.07)' },
  weakCardHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  weakCardTitle:  { fontFamily:'var(--font-display)', fontSize:'1.15rem', color:'#C0392B', marginBottom:2 },
  weakCardSub:    { fontSize:'0.75rem', color:'#AAA' },
  weakCardBtn:    { fontSize:'0.8rem', fontWeight:700, color:'var(--forest)', textDecoration:'none', background:'var(--ivory)', padding:'6px 12px', borderRadius:20 },
  weakRow:        { background:'#FFF8F8', borderRadius:10, padding:'10px 14px', border:'1px solid #FFE8E8' },
  weakTopic:      { fontSize:'0.83rem', fontWeight:700, color:'var(--charcoal)' },
  weakBloom:      { fontSize:'0.75rem', color:'#AAA' },
  weakPct:        { fontSize:'0.88rem', fontWeight:700 },
  weakBarBg:      { height:5, background:'#F0F0F0', borderRadius:10, overflow:'hidden', marginBottom:4 },
  weakBarFill:    { height:'100%', borderRadius:10, transition:'width 0.6s ease' },
  weakAttempts:   { fontSize:'0.7rem', color:'#BBB' },
  weakHint:       { fontSize:'0.78rem', color:'#AAA', fontStyle:'italic', marginTop:4 },

  sectionHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionTitle:   { fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--forest)' },
  subGrid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 },
  subCard:        { display:'flex', alignItems:'center', gap:12, background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:14, padding:'14px 16px', textDecoration:'none', color:'inherit', transition:'box-shadow 0.2s' },
  subDot:         { width:22, height:22, borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', flexShrink:0 },
  subName:        { fontWeight:600, fontSize:'0.88rem', color:'var(--charcoal)' },
  subBadge:       { fontSize:'0.7rem', fontWeight:700, background:'#fef3cd', color:'#856404', padding:'3px 9px', borderRadius:100, flexShrink:0, alignSelf:'flex-start' },
  sideCard:       { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:14, padding:'20px', marginBottom:14, boxShadow:'0 1px 6px rgba(27,61,47,0.07)' },
  sideCardTitle:  { fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'var(--forest)', marginBottom:5 },
  sideCardDesc:   { color:'var(--charcoal-lt)', fontSize:'0.83rem', lineHeight:1.55 },
  circleGrid:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:12 },
  actRow:         { display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--ivory-dk)' },
  actSubject:     { fontSize:'0.83rem', fontWeight:600, color:'var(--charcoal)' },
  actDate:        { fontSize:'0.7rem', color:'#AAA' },
  actScore:       { fontSize:'0.88rem', fontWeight:700 },
  actGrade:       { fontSize:'0.7rem', fontWeight:600 },
  tipCard:        { background:'var(--forest)', borderRadius:14, padding:'18px', marginBottom:12 },
  tipBadge:       { fontSize:'0.75rem', fontWeight:700, color:'var(--gold)', marginBottom:6, letterSpacing:'0.04em' },
  tipText:        { fontSize:'0.83rem', color:'rgba(245,240,232,0.75)', lineHeight:1.6 },
  signOut:        { width:'100%', background:'var(--white)', border:'1.5px solid var(--ivory-dk)', color:'var(--charcoal-lt)', borderRadius:10, fontFamily:'var(--font-body)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', padding:'11px' },
}
