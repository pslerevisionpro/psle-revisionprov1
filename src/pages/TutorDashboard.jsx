import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'science',     name: 'Science',       emoji: '🔬' },
  { key: 'english',     name: 'English',        emoji: '✏️' },
  { key: 'maths',       name: 'Mathematics',    emoji: '🔢' },
  { key: 'setswana',    name: 'Setswana',       emoji: '🗣️' },
  { key: 'social',      name: 'Social Studies', emoji: '🌍' },
  { key: 'agriculture', name: 'Agriculture',    emoji: '🌱' },
  { key: 'rme',         name: 'RME',            emoji: '📖' },
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

function Ring({ pct, size = 52 }) {
  const safe = clamp(pct), r = (size-10)/2, circ = 2*Math.PI*r
  const fill = safe > 0 ? (safe/100)*circ : 0
  const color = safe > 0 ? gradeColor(safe) : '#E0E0E0'
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0F0F0" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:'stroke-dasharray 0.7s ease' }}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={safe>0?'10':'12'}
        fontWeight="700" fill={safe>0?color:'#C0C0C0'} fontFamily="'Outfit',sans-serif">
        {safe > 0 ? `${safe}%` : '—'}
      </text>
    </svg>
  )
}

function MiniChart({ results }) {
  if (!results || results.length === 0) return (
    <p style={{ color:'#CCC', fontSize:'0.75rem', textAlign:'center', padding:'8px 0' }}>No data</p>
  )
  const BAR_W=5, GAP=6, H=40
  const data = results.slice(-8)
  const totalW = data.length*(BAR_W+GAP)-GAP
  return (
    <svg viewBox={`0 0 ${totalW} ${H}`} width="100%" height={H} style={{ display:'block', overflow:'visible' }}>
      {data.map((d,i) => {
        const pct=clamp(d.pct), x=i*(BAR_W+GAP)
        const barH=(pct/100)*H, y=H-barH
        return <rect key={i} x={x} y={y} width={BAR_W} height={barH} rx={2} fill={gradeColor(pct)} opacity="0.8"/>
      })}
    </svg>
  )
}

export default function TutorDashboard() {
  const { session, profile, signOut } = useAuth()
  const [students, setStudents]             = useState([])
  const [selected, setSelected]             = useState(null)
  const [studentResults, setStudentResults] = useState([])
  const [studentProfile, setStudentProfile] = useState(null)
  const [studentPreviews, setStudentPreviews] = useState({})
  const [linkEmail, setLinkEmail]           = useState('')
  const [linkMsg, setLinkMsg]               = useState('')
  const [linkErr, setLinkErr]               = useState('')
  const [linking, setLinking]               = useState(false)
  const [loading, setLoading]               = useState(true)
  const navigate = useNavigate()

  useEffect(() => { if (session) loadStudents() }, [session])
  useEffect(() => { if (selected) loadStudentData(selected) }, [selected])

  async function loadStudents() {
    setLoading(true)
    const { data } = await supabase
      .from('tutor_student_links')
      .select('student_id, profiles:student_id(id, full_name, grade, email)')
      .eq('tutor_id', session.user.id)
    if (data) {
      const studs = data.map(d => d.profiles).filter(Boolean)
      setStudents(studs)
      if (studs.length > 0 && !selected) setSelected(studs[0].id)
      studs.forEach(async st => {
        const { data: res } = await supabase
          .from('quiz_results').select('pct, subject, created_at')
          .eq('user_id', st.id).lte('pct', 100)
          .order('created_at', { ascending: false }).limit(8)
        if (res) setStudentPreviews(p => ({ ...p, [st.id]: res }))
      })
    }
    setLoading(false)
  }

  async function loadStudentData(studentId) {
    const [{ data: prof }, { data: results }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', studentId).single(),
      supabase.from('quiz_results').select('*').eq('user_id', studentId).lte('pct', 100).order('created_at', { ascending: true })
    ])
    if (prof)    setStudentProfile(prof)
    if (results) setStudentResults(results)
  }

  async function linkStudent(e) {
    e.preventDefault()
    setLinkErr(''); setLinkMsg(''); setLinking(true)
    try {
      const { data: prof } = await supabase
        .from('profiles').select('id, full_name, role').eq('email', linkEmail.trim().toLowerCase()).single()
      if (!prof) throw new Error('No student account found with that email address.')
      if (prof.role !== 'student') throw new Error('That account is not a student account.')
      const { error } = await supabase.from('tutor_student_links').insert({ tutor_id: session.user.id, student_id: prof.id })
      if (error && error.code !== '23505') throw error
      setLinkMsg(`${prof.full_name} has been added to your student list.`)
      setLinkEmail('')
      loadStudents()
    } catch (err) {
      setLinkErr(err.message)
    } finally {
      setLinking(false)
    }
  }

  async function removeStudent(studentId) {
    await supabase.from('tutor_student_links').delete().eq('tutor_id', session.user.id).eq('student_id', studentId)
    setStudents(s => s.filter(st => st.id !== studentId))
    if (selected === studentId) { setSelected(null); setStudentResults([]); setStudentProfile(null) }
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Tutor'

  const bestScores = {}
  studentResults.forEach(r => {
    const key = r.subject?.toLowerCase()
    if (!bestScores[key] || r.pct > bestScores[key]) bestScores[key] = clamp(r.pct)
  })
  const attempted     = Object.values(bestScores)
  const overallAvg    = attempted.length > 0 ? Math.round(attempted.reduce((a,b)=>a+b,0)/attempted.length) : 0
  const totalAttempts = studentResults.length
  const recentResults = [...studentResults].reverse().slice(0, 6)
  const weakSubjects  = SUBJECTS.filter(sub => { const b = bestScores[sub.name.toLowerCase()]; return b !== undefined && b < 65 })
  const strongSubjects= SUBJECTS.filter(sub => { const b = bestScores[sub.name.toLowerCase()]; return b !== undefined && b >= 75 })
  const oneWeekAgo    = new Date(Date.now() - 7*24*60*60*1000)
  const weeklyAttempts= studentResults.filter(r => new Date(r.created_at) > oneWeekAgo).length

  return (
    <div className="page-container">
      <Navbar />
      <div style={s.banner}>
        <div className="content-wrapper" style={s.bannerInner}>
          <div style={{ flex:1 }}>
            <p style={s.bannerRole}>🎓 Tutor Dashboard</p>
            <h1 style={s.bannerTitle}>Welcome, {displayName.split(' ')[0]}!</h1>
            <p style={s.bannerSub}>
              {students.length === 0
                ? 'Add your first student below to start tracking their performance.'
                : `Managing ${students.length} student${students.length>1?'s':''}.`}
            </p>
          </div>
          {selected && studentProfile && (
            <div style={s.statRow}>
              {[
                { val:students.length,                                  label:'My Students' },
                { val:totalAttempts||'—',                               label:'Attempts' },
                { val:overallAvg>0?`${overallAvg}%`:'—',               label:'Avg Score',   color:overallAvg>0?gradeColor(overallAvg):undefined },
                { val:weakSubjects.length||'—',                         label:'Needs Focus', color:weakSubjects.length>0?'#E67E22':undefined },
              ].map((st,i)=>(
                <div key={i} style={s.statBox}>
                  <span style={{ ...s.statNum, ...(st.color?{color:st.color}:{}) }}>{st.val}</span>
                  <span style={s.statLabel}>{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop:32, paddingBottom:64 }}>
        <div style={s.grid}>
          <div style={{ minWidth:0 }}>

            {students.length > 0 && (
              <>
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>My Students</h2>
                  <span style={{ fontSize:'0.8rem', color:'#AAA' }}>{students.length} total</span>
                </div>
                <div style={s.studentGrid}>
                  {students.map(st => {
                    const preview  = studentPreviews[st.id] || []
                    const bestPct  = preview.length > 0 ? Math.max(...preview.map(r => clamp(r.pct))) : null
                    const recentPct= preview.length > 0 ? clamp(preview[0].pct) : null
                    return (
                      <button key={st.id} onClick={()=>setSelected(st.id)}
                        style={{ ...s.studentCard, ...(selected===st.id?s.studentCardActive:{}) }}>
                        <div style={s.studentCardTop}>
                          <div style={s.studentAvatar}>{st.full_name?.charAt(0)?.toUpperCase()||'?'}</div>
                          <div style={{ flex:1, textAlign:'left' }}>
                            <p style={s.studentName}>{st.full_name}</p>
                            <p style={s.studentGrade}>{st.grade==='std7'?'Standard 7':'Standard 6'}</p>
                          </div>
                          {bestPct!==null&&(
                            <div style={{ ...s.studentBadge, background:gradeColor(bestPct)+'18', color:gradeColor(bestPct) }}>
                              {gradeLetter(bestPct)}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop:8 }}><MiniChart results={[...preview].reverse()}/></div>
                        <div style={s.studentFooter}>
                          <span>{preview.length} attempt{preview.length!==1?'s':''}</span>
                          {recentPct!==null&&<span style={{ color:gradeColor(recentPct), fontWeight:700 }}>Latest: {recentPct}%</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {students.length===0&&!loading&&(
              <div style={s.emptyState}>
                <p style={{ fontSize:'2.5rem', marginBottom:12 }}>🎓</p>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'var(--forest)', marginBottom:8 }}>No students added yet</h3>
                <p style={{ color:'var(--charcoal-lt)', fontSize:'0.9rem' }}>Use the form on the right to add your first student.</p>
              </div>
            )}

            {selected&&studentProfile&&(
              <>
                <div style={{ ...s.sectionHeader, marginTop:32 }}>
                  <h2 style={s.sectionTitle}>{studentProfile.full_name}'s Performance</h2>
                  <span style={{ fontSize:'0.8rem', color:'#AAA' }}>{studentProfile.grade==='std7'?'Standard 7':'Standard 6'}</span>
                </div>

                <div style={s.summaryRow}>
                  {[
                    { label:'Total Attempts', val:totalAttempts||'—' },
                    { label:'Average Score',  val:overallAvg>0?`${overallAvg}%`:'—', color:overallAvg>0?gradeColor(overallAvg):undefined },
                    { label:'This Week',      val:weeklyAttempts||'—', color:weeklyAttempts>0?'#27AE60':undefined },
                    { label:'Overall Grade',  val:overallAvg>0?`Grade ${gradeLetter(overallAvg)}`:'—', color:overallAvg>0?gradeColor(overallAvg):undefined },
                  ].map((st,i)=>(
                    <div key={i} style={s.summaryCard}>
                      <p style={s.summaryLabel}>{st.label}</p>
                      <p style={{ ...s.summaryVal, ...(st.color?{color:st.color}:{}) }}>{st.val}</p>
                    </div>
                  ))}
                </div>

                {weakSubjects.length>0&&(
                  <div style={s.focusCard}>
                    <p style={s.focusTitle}>🎯 Focus Areas for Next Session</p>
                    <p style={s.focusDesc}>These subjects need attention in your tutoring sessions:</p>
                    <div style={s.focusList}>
                      {weakSubjects.map(sub=>{
                        const best=bestScores[sub.name.toLowerCase()]
                        return (
                          <div key={sub.key} style={s.focusItem}>
                            <span style={s.focusEmoji}>{sub.emoji}</span>
                            <div style={{ flex:1 }}>
                              <p style={s.focusSubject}>{sub.name}</p>
                              <p style={{ fontSize:'0.72rem', color:gradeColor(best) }}>Best: {best}% · Grade {gradeLetter(best)}</p>
                            </div>
                            <span style={{ ...s.focusBadge, background:gradeColor(best)+'18', color:gradeColor(best) }}>Needs work</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {strongSubjects.length>0&&(
                  <div style={{ ...s.focusCard, background:'#eafaf1', borderColor:'#a9e4be' }}>
                    <p style={{ ...s.focusTitle, color:'#27AE60' }}>⭐ Strong Subjects</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                      {strongSubjects.map(sub=>(
                        <span key={sub.key} style={{ background:'#d4edda', color:'#155724', padding:'4px 12px', borderRadius:100, fontSize:'0.78rem', fontWeight:600 }}>
                          {sub.emoji} {sub.name} · {bestScores[sub.name.toLowerCase()]}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ ...s.sectionHeader, marginTop:24 }}>
                  <h2 style={s.sectionTitle}>Subject Breakdown</h2>
                </div>
                <div style={s.subGrid}>
                  {SUBJECTS.map(sub=>{
                    const key=sub.name.toLowerCase()
                    const best=bestScores[key]??null
                    const subAttempts=studentResults.filter(r=>r.subject?.toLowerCase()===key)
                    return (
                      <div key={sub.key} style={s.subCard}>
                        <Ring pct={best??0} size={50}/>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                            <span>{sub.emoji}</span>
                            <span style={s.subName}>{sub.name}</span>
                          </div>
                          {best!==null
                            ? <p style={{ fontSize:'0.7rem', fontWeight:700, color:gradeColor(best) }}>{best}% · Gr {gradeLetter(best)} · {subAttempts.length} attempt{subAttempts.length>1?'s':''}</p>
                            : <p style={{ fontSize:'0.7rem', color:'#CCC', fontStyle:'italic' }}>Not attempted</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ ...s.detailCard, marginTop:20 }}>
                  <p style={s.chartTitle}>Recent Quiz Attempts</p>
                  {recentResults.length===0
                    ? <p style={{ color:'#AAA', fontSize:'0.85rem', padding:'12px 0' }}>No attempts yet.</p>
                    : recentResults.map((r,i)=>(
                      <div key={i} style={s.actRow}>
                        <div>
                          <p style={s.actSubject}>{r.subject}</p>
                          <p style={s.actDate}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ ...s.actScore, color:gradeColor(clamp(r.pct)) }}>{clamp(r.pct)}%</p>
                          <p style={{ ...s.actGrade, color:gradeColor(clamp(r.pct)) }}>{r.score}/{r.total} · Grade {gradeLetter(clamp(r.pct))}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          <div>
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>➕ Add a Student</p>
              <p style={s.sideCardDesc}>Enter the student's account email to add them to your roster.</p>
              <form onSubmit={linkStudent} style={{ marginTop:14 }}>
                <div className="form-group">
                  <label>Student's Email</label>
                  <input type="email" placeholder="student@email.com" value={linkEmail} onChange={e=>setLinkEmail(e.target.value)} required/>
                </div>
                {linkErr&&<div className="alert alert-error" style={{ fontSize:'0.82rem' }}>{linkErr}</div>}
                {linkMsg&&<div className="alert alert-success" style={{ fontSize:'0.82rem' }}>{linkMsg}</div>}
                <button type="submit" className="btn btn-primary btn-full" disabled={linking}>
                  {linking?'Adding…':'Add Student →'}
                </button>
              </form>
            </div>

            {students.length>0&&(
              <div style={s.sideCard}>
                <p style={s.sideCardTitle}>📋 Student Roster</p>
                {students.map(st=>(
                  <div key={st.id} style={s.kidRow}>
                    <div>
                      <p style={s.kidName}>{st.full_name}</p>
                      <p style={s.kidGrade}>{st.grade==='std7'?'Standard 7':'Standard 6'}</p>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button onClick={()=>setSelected(st.id)} style={{ ...s.viewBtn, ...(selected===st.id?s.viewBtnActive:{}) }}>View</button>
                      <button onClick={()=>removeStudent(st.id)} style={s.removeBtn}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {students.length>1&&(
              <div style={s.sideCard}>
                <p style={s.sideCardTitle}>📊 Class Overview</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                  {students.map(st=>{
                    const preview=studentPreviews[st.id]||[]
                    const avg=preview.length>0?Math.round(preview.reduce((a,r)=>a+clamp(r.pct),0)/preview.length):null
                    return (
                      <div key={st.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--charcoal)' }}>{st.full_name?.split(' ')[0]}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:60, height:6, background:'#F0F0F0', borderRadius:100, overflow:'hidden' }}>
                            <div style={{ width:`${avg??0}%`, height:'100%', background:avg?gradeColor(avg):'#E0E0E0', borderRadius:100, transition:'width 0.5s ease' }}/>
                          </div>
                          <span style={{ fontSize:'0.75rem', fontWeight:700, color:avg?gradeColor(avg):'#CCC', minWidth:28 }}>
                            {avg!==null?`${avg}%`:'—'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={s.tipCard}>
              <p style={s.tipBadge}>💡 Tutor Insight</p>
              <p style={s.tipText}>
                {students.length===0?'Add your first student to start tracking performance.'
                 :weakSubjects.length>0?`Focus your next session on ${weakSubjects[0]?.name} — it needs the most attention.`
                 :totalAttempts===0?'Encourage your student to take their first quiz before the next session.'
                 :'Your student is performing well. Consider introducing timed practice to build exam confidence.'}
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
  sectionHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionTitle:   { fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--forest)' },
  emptyState:     { textAlign:'center', padding:'60px 24px', background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)' },
  studentGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:8 },
  studentCard:    { background:'var(--white)', border:'1.5px solid var(--ivory-dk)', borderRadius:14, padding:'14px', cursor:'pointer', textAlign:'left', fontFamily:'var(--font-body)', transition:'all 0.18s ease' },
  studentCardActive:{ border:'1.5px solid var(--forest)', boxShadow:'0 0 0 3px rgba(27,61,47,0.08)' },
  studentCardTop: { display:'flex', alignItems:'center', gap:10 },
  studentAvatar:  { width:36, height:36, borderRadius:'50%', background:'var(--forest)', color:'var(--gold-lt)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0 },
  studentName:    { fontSize:'0.88rem', fontWeight:700, color:'var(--charcoal)', marginBottom:2 },
  studentGrade:   { fontSize:'0.7rem', color:'#AAA' },
  studentBadge:   { fontSize:'0.82rem', fontWeight:800, padding:'4px 8px', borderRadius:8, flexShrink:0 },
  studentFooter:  { display:'flex', justifyContent:'space-between', marginTop:6, fontSize:'0.7rem', color:'#AAA' },
  summaryRow:     { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:20 },
  summaryCard:    { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:12, padding:'14px' },
  summaryLabel:   { fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'#AAA', marginBottom:5 },
  summaryVal:     { fontSize:'0.92rem', fontWeight:700, color:'var(--charcoal)' },
  focusCard:      { background:'#fff8f0', border:'1px solid #f5d5a8', borderRadius:14, padding:'16px 18px', marginBottom:16 },
  focusTitle:     { fontSize:'0.9rem', fontWeight:700, color:'#E67E22', marginBottom:4 },
  focusDesc:      { fontSize:'0.78rem', color:'var(--charcoal-lt)', marginBottom:12 },
  focusList:      { display:'flex', flexDirection:'column', gap:10 },
  focusItem:      { display:'flex', alignItems:'center', gap:10, background:'var(--white)', borderRadius:10, padding:'10px 12px', border:'1px solid #f5d5a8' },
  focusEmoji:     { fontSize:'1.1rem' },
  focusSubject:   { fontSize:'0.85rem', fontWeight:600, color:'var(--charcoal)', marginBottom:2 },
  focusBadge:     { fontSize:'0.7rem', fontWeight:700, padding:'3px 8px', borderRadius:100, flexShrink:0 },
  subGrid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 },
  subCard:        { display:'flex', alignItems:'center', gap:10, background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:12, padding:'12px 14px' },
  subName:        { fontWeight:600, fontSize:'0.82rem', color:'var(--charcoal)' },
  detailCard:     { background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)', padding:'18px 22px', boxShadow:'0 2px 12px rgba(27,61,47,0.07)' },
  chartTitle:     { fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'var(--forest)', marginBottom:12 },
  actRow:         { display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--ivory-dk)' },
  actSubject:     { fontSize:'0.83rem', fontWeight:600, color:'var(--charcoal)' },
  actDate:        { fontSize:'0.7rem', color:'#AAA' },
  actScore:       { fontSize:'0.88rem', fontWeight:700 },
  actGrade:       { fontSize:'0.7rem', fontWeight:600 },
  sideCard:       { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:14, padding:'20px', marginBottom:14, boxShadow:'0 1px 6px rgba(27,61,47,0.07)' },
  sideCardTitle:  { fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'var(--forest)', marginBottom:5 },
  sideCardDesc:   { color:'var(--charcoal-lt)', fontSize:'0.83rem', lineHeight:1.55 },
  kidRow:         { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--ivory-dk)' },
  kidName:        { fontSize:'0.88rem', fontWeight:600, color:'var(--charcoal)' },
  kidGrade:       { fontSize:'0.72rem', color:'#AAA' },
  viewBtn:        { background:'var(--ivory)', border:'1px solid var(--ivory-dk)', color:'var(--charcoal-lt)', borderRadius:6, padding:'4px 10px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' },
  viewBtnActive:  { background:'var(--forest)', color:'var(--gold-lt)', borderColor:'var(--forest)' },
  removeBtn:      { background:'#fdecea', color:'var(--error)', border:'none', borderRadius:6, padding:'4px 8px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' },
  tipCard:        { background:'var(--forest)', borderRadius:14, padding:'18px', marginBottom:12 },
  tipBadge:       { fontSize:'0.75rem', fontWeight:700, color:'var(--gold)', marginBottom:6, letterSpacing:'0.04em' },
  tipText:        { fontSize:'0.83rem', color:'rgba(245,240,232,0.75)', lineHeight:1.6 },
  signOut:        { width:'100%', background:'var(--white)', border:'1.5px solid var(--ivory-dk)', color:'var(--charcoal-lt)', borderRadius:10, fontFamily:'var(--font-body)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', padding:'11px' },
}
