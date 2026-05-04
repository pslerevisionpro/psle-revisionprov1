import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
function gradeLabel(p) {
  if (p >= 80) return 'Excellent'
  if (p >= 65) return 'Good'
  if (p >= 50) return 'Satisfactory'
  return 'Needs Work'
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

function MiniBar({ results }) {
  if (!results || results.length === 0) return (
    <p style={{ color:'#CCC', fontSize:'0.72rem', fontStyle:'italic' }}>No attempts</p>
  )
  const BAR_W=5, GAP=4, H=32
  const data = [...results].slice(-10)
  const totalW = data.length*(BAR_W+GAP)-GAP
  return (
    <svg viewBox={`0 0 ${totalW} ${H}`} width={totalW} height={H} style={{ display:'block', overflow:'visible' }}>
      {data.map((d,i) => {
        const pct=clamp(d.pct), x=i*(BAR_W+GAP)
        const barH=Math.max(2,(pct/100)*H), y=H-barH
        return <rect key={i} x={x} y={y} width={BAR_W} height={barH} rx={2} fill={gradeColor(pct)} opacity="0.85"/>
      })}
    </svg>
  )
}

function ScoreChart({ results, name }) {
  if (!results || results.length === 0) return (
    <div style={{ textAlign:'center', padding:'24px 0', color:'#AAA', fontSize:'0.85rem' }}>
      No quiz attempts yet
    </div>
  )
  const BAR_W=6, GAP=18, H=90, BOTTOM=36, TOP=20, LEFT=26
  const TOTAL_H = H+BOTTOM+TOP
  const data = [...results].slice(-12)
  const totalW = Math.max(data.length*(BAR_W+GAP)-GAP+LEFT, 180)
  return (
    <div style={{ overflowX:'auto' }}>
      <svg viewBox={`0 0 ${totalW} ${TOTAL_H}`} width="100%" style={{ overflow:'visible', display:'block', maxWidth:400, margin:'0 auto' }}>
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
              <text x={x+BAR_W/2} y={y-4} fontSize="7" fill={color} textAnchor="middle" fontWeight="700" fontFamily="'Outfit',sans-serif">{pct}%</text>
              <text x={x+BAR_W/2} y={TOP+H+12} fontSize="6.5" fill="#888" textAnchor="middle" fontFamily="'Outfit',sans-serif">{d.subject?.slice(0,3)||'?'}</text>
              <text x={x+BAR_W/2} y={TOP+H+22} fontSize="6" fill="#AAAAAA" textAnchor="middle" fontFamily="'Outfit',sans-serif">
                {new Date(d.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function TutorDashboard() {
  const { session, profile, signOut } = useAuth()
  const [students, setStudents]               = useState([])
  const [selected, setSelected]               = useState(null)
  const [studentResults, setStudentResults]   = useState([])
  const [studentProfile, setStudentProfile]   = useState(null)
  const [studentPreviews, setStudentPreviews] = useState({})
  const [parentInfo, setParentInfo]           = useState(null)
  const [linkEmail, setLinkEmail]             = useState('')
  const [linkMsg, setLinkMsg]                 = useState('')
  const [linkErr, setLinkErr]                 = useState('')
  const [linking, setLinking]                 = useState(false)
  const [loading, setLoading]                 = useState(true)
  const [activeTab, setActiveTab]             = useState('overview')
  const navigate = useNavigate()

  useEffect(() => { if (session) loadStudents() }, [session])
  useEffect(() => { if (selected) { loadStudentData(selected); setActiveTab('overview') } }, [selected])

  async function loadStudents() {
    setLoading(true)
    const { data: links } = await supabase
      .from('tutor_student_links')
      .select('student_id')
      .eq('tutor_id', session.user.id)
    if (links && links.length > 0) {
      const ids = links.map(l => l.student_id)
      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name, grade, email').in('id', ids)
      if (profiles) {
        setStudents(profiles)
        if (profiles.length > 0 && !selected) setSelected(profiles[0].id)
        // Load preview results for each student
        profiles.forEach(async st => {
          const { data: res } = await supabase
            .from('quiz_results').select('pct, subject, created_at')
            .eq('user_id', st.id)
            .order('created_at', { ascending: false }).limit(10)
          if (res) setStudentPreviews(p => ({ ...p, [st.id]: res }))
        })
      }
    }
    setLoading(false)
  }

  async function loadStudentData(studentId) {
    const [{ data: prof }, { data: results }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', studentId).single(),
      supabase.from('quiz_results').select('*').eq('user_id', studentId).order('created_at', { ascending: true })
    ])
    if (prof)    setStudentProfile(prof)
    if (results) setStudentResults(results)

    // Try to find linked parent
    const { data: parentLink } = await supabase
      .from('parent_child_links')
      .select('parent_id, profiles:parent_id(full_name, email)')
      .eq('child_id', studentId)
      .single()
    setParentInfo(parentLink?.profiles || null)
  }

  async function linkStudent(e) {
    e.preventDefault()
    setLinkErr(''); setLinkMsg(''); setLinking(true)
    try {
      const { data: prof } = await supabase
        .from('profiles').select('id, full_name, role').eq('email', linkEmail.trim().toLowerCase()).single()
      if (!prof) throw new Error('No student account found with that email.')
      if (prof.role !== 'student') throw new Error('That account is not a student account.')
      const { error } = await supabase.from('tutor_student_links').insert({ tutor_id: session.user.id, student_id: prof.id })
      if (error && error.code !== '23505') throw error
      setLinkMsg(`${prof.full_name} added to your roster.`)
      setLinkEmail('')
      loadStudents()
    } catch (err) { setLinkErr(err.message) }
    finally { setLinking(false) }
  }

  async function removeStudent(studentId) {
    await supabase.from('tutor_student_links').delete().eq('tutor_id', session.user.id).eq('student_id', studentId)
    setStudents(s => s.filter(st => st.id !== studentId))
    if (selected === studentId) { setSelected(null); setStudentResults([]); setStudentProfile(null); setParentInfo(null) }
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Tutor'
  const org = profile?.school || null

  // Compute stats for selected student
  const bestScores = {}
  const attemptsBySubject = {}
  studentResults.forEach(r => {
    const key = r.subject?.toLowerCase()
    if (!bestScores[key] || r.pct > bestScores[key]) bestScores[key] = clamp(r.pct)
    if (!attemptsBySubject[key]) attemptsBySubject[key] = []
    attemptsBySubject[key].push({ ...r, pct: clamp(r.pct) })
  })
  const attempted      = Object.values(bestScores)
  const overallAvg     = attempted.length > 0 ? Math.round(attempted.reduce((a,b)=>a+b,0)/attempted.length) : 0
  const totalAttempts  = studentResults.length
  const recentResults  = [...studentResults].reverse().slice(0, 6)
  const oneWeekAgo     = new Date(Date.now() - 7*24*60*60*1000)
  const weeklyAttempts = studentResults.filter(r => new Date(r.created_at) > oneWeekAgo).length
  const lastActive     = studentResults.length > 0
    ? new Date(studentResults[studentResults.length-1].created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
    : null

  const weakSubjects   = SUBJECTS.filter(sub => { const b = bestScores[sub.name.toLowerCase()]; return b !== undefined && b < 65 })
  const strongSubjects = SUBJECTS.filter(sub => { const b = bestScores[sub.name.toLowerCase()]; return b !== undefined && b >= 75 })
  const notAttempted   = SUBJECTS.filter(sub => bestScores[sub.name.toLowerCase()] === undefined)

  // Trend: is latest score better or worse than previous?
  function getTrend() {
    if (studentResults.length < 2) return null
    const last = clamp(studentResults[studentResults.length-1].pct)
    const prev = clamp(studentResults[studentResults.length-2].pct)
    if (last > prev) return { dir:'↑', color:'#27AE60', label:`Up ${last-prev}% from last attempt` }
    if (last < prev) return { dir:'↓', color:'#C0392B', label:`Down ${prev-last}% from last attempt` }
    return { dir:'→', color:'#888', label:'Same as last attempt' }
  }
  const trend = getTrend()

  // Session plan generator
  function getSessionPlan() {
    if (totalAttempts === 0) return ['Start with a Science quiz together to establish a baseline.', 'Discuss what topics the student finds most challenging.', 'Set a goal of at least 3 quiz attempts before next session.']
    const plan = []
    if (weakSubjects.length > 0) plan.push(`Open with ${weakSubjects[0].name} — lowest score, needs most attention.`)
    if (weakSubjects.length > 1) plan.push(`Follow up with ${weakSubjects[1].name} if time allows.`)
    if (weeklyAttempts < 2) plan.push('Encourage daily 10-minute revision between sessions.')
    if (strongSubjects.length > 0) plan.push(`Use ${strongSubjects[0].name} as a confidence booster — student is strong here.`)
    if (notAttempted.filter(s => s.key !== 'english' && s.key !== 'maths').length > 0)
      plan.push(`${notAttempted[0]?.name} hasn't been attempted yet — assign it as homework.`)
    return plan.slice(0, 4)
  }
  const sessionPlan = getSessionPlan()

  // Class overview for sidebar
  const classAvg = students.length > 0
    ? Math.round(students.reduce((sum, st) => {
        const preview = studentPreviews[st.id] || []
        const avg = preview.length > 0 ? preview.reduce((a,r)=>a+clamp(r.pct),0)/preview.length : 0
        return sum + avg
      }, 0) / students.length)
    : 0

  return (
    <div className="page-container">
      <Navbar />

      {/* Banner */}
      <div style={s.banner}>
        <div className="content-wrapper" style={s.bannerInner}>
          <div style={{ flex:1 }}>
            <p style={s.bannerRole}>🎓 Tutor Dashboard</p>
            <h1 style={s.bannerTitle}>
              {displayName.split(' ')[0]}{org ? ` · ${org}` : ''}
            </h1>
            <p style={s.bannerSub}>
              {students.length === 0
                ? 'Add your first student to start tracking performance.'
                : `${students.length} student${students.length>1?'s':''} on your roster${classAvg>0?` · Class avg: ${classAvg}%`:''}.`}
            </p>
          </div>
          <div style={s.statRow}>
            {[
              { val:students.length||'—',                        label:'Students' },
              { val:classAvg>0?`${classAvg}%`:'—',              label:'Class Avg',   color:classAvg>0?gradeColor(classAvg):undefined },
              { val:weakSubjects.length>0?weakSubjects.length:'—', label:'Focus Areas', color:weakSubjects.length>0?'#E67E22':undefined },
              { val:weeklyAttempts||'—',                         label:'This Week',   color:weeklyAttempts>0?'#27AE60':undefined },
            ].map((st,i)=>(
              <div key={i} style={s.statBox}>
                <span style={{ ...s.statNum, ...(st.color?{color:st.color}:{}) }}>{st.val}</span>
                <span style={s.statLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop:28, paddingBottom:64 }}>
        <div style={s.grid}>

          {/* Left column */}
          <div style={{ minWidth:0 }}>

            {/* Student roster cards */}
            {students.length > 0 && (
              <>
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>Student Roster</h2>
                  <span style={{ fontSize:'0.78rem', color:'#AAA' }}>{students.length} student{students.length>1?'s':''}</span>
                </div>
                <div style={s.rosterGrid}>
                  {students.map(st => {
                    const preview  = studentPreviews[st.id] || []
                    const revPrev  = [...preview].reverse()
                    const bestPct  = preview.length > 0 ? Math.max(...preview.map(r=>clamp(r.pct))) : null
                    const avgPct   = preview.length > 0 ? Math.round(preview.reduce((a,r)=>a+clamp(r.pct),0)/preview.length) : null
                    const isActive = preview.length > 0 && new Date(preview[0].created_at) > oneWeekAgo
                    return (
                      <button key={st.id} onClick={()=>setSelected(st.id)}
                        style={{ ...s.rosterCard, ...(selected===st.id?s.rosterCardActive:{}) }}>
                        <div style={s.rosterTop}>
                          <div style={{ ...s.avatar, background: selected===st.id?'var(--gold-dk)':'var(--forest)' }}>
                            {st.full_name?.charAt(0)?.toUpperCase()||'?'}
                          </div>
                          <div style={{ flex:1, textAlign:'left', minWidth:0 }}>
                            <p style={s.rosterName}>{st.full_name}</p>
                            <p style={s.rosterMeta}>{st.grade==='std7'?'Std 7':'Std 6'} · {preview.length} attempt{preview.length!==1?'s':''}</p>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            {avgPct !== null && (
                              <span style={{ ...s.rosterGrade, background:gradeColor(avgPct)+'18', color:gradeColor(avgPct) }}>
                                {gradeLetter(avgPct)}
                              </span>
                            )}
                            <p style={{ fontSize:'0.65rem', color:isActive?'#27AE60':'#CCC', marginTop:3, fontWeight:600 }}>
                              {isActive ? '● Active' : '○ Inactive'}
                            </p>
                          </div>
                        </div>
                        <div style={{ marginTop:10, display:'flex', alignItems:'flex-end', gap:12 }}>
                          <MiniBar results={revPrev}/>
                          {avgPct !== null && (
                            <span style={{ fontSize:'0.72rem', color:gradeColor(avgPct), fontWeight:700, flexShrink:0 }}>
                              avg {avgPct}%
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Empty state */}
            {students.length === 0 && !loading && (
              <div style={s.emptyState}>
                <p style={{ fontSize:'2.5rem', marginBottom:12 }}>🎓</p>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'var(--forest)', marginBottom:8 }}>No students yet</h3>
                <p style={{ color:'var(--charcoal-lt)', fontSize:'0.9rem' }}>Add your first student using the form on the right.</p>
              </div>
            )}

            {/* Selected student detail */}
            {selected && studentProfile && (
              <>
                {/* Student header */}
                <div style={s.studentHeader}>
                  <div style={s.studentHeaderLeft}>
                    <div style={s.avatarLg}>{studentProfile.full_name?.charAt(0)?.toUpperCase()||'?'}</div>
                    <div>
                      <h2 style={s.studentName}>{studentProfile.full_name}</h2>
                      <p style={s.studentMeta}>
                        {studentProfile.grade==='std7'?'Standard 7':'Standard 6'}
                        {lastActive && ` · Last active: ${lastActive}`}
                      </p>
                      {parentInfo && (
                        <p style={s.parentLink}>
                          👨‍👩‍👧 Parent: <strong>{parentInfo.full_name}</strong> · {parentInfo.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {trend && (
                    <div style={{ ...s.trendBadge, background:trend.color+'15', borderColor:trend.color+'40', color:trend.color }}>
                      <span style={{ fontSize:'1.1rem' }}>{trend.dir}</span>
                      <span style={{ fontSize:'0.75rem', fontWeight:600 }}>{trend.label}</span>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div style={s.tabs}>
                  {['overview','subjects','history','session'].map(tab => (
                    <button key={tab} onClick={()=>setActiveTab(tab)}
                      style={{ ...s.tab, ...(activeTab===tab?s.tabActive:{}) }}>
                      {tab==='overview'?'📊 Overview'
                       :tab==='subjects'?'📚 Subjects'
                       :tab==='history'?'📋 History'
                       :'🗓 Session Plan'}
                    </button>
                  ))}
                </div>

                {/* Overview tab */}
                {activeTab==='overview' && (
                  <>
                    <div style={s.summaryRow}>
                      {[
                        { label:'Total Attempts',  val:totalAttempts||'—' },
                        { label:'Average Score',   val:overallAvg>0?`${overallAvg}%`:'—',     color:overallAvg>0?gradeColor(overallAvg):undefined },
                        { label:'Best Score',      val:attempted.length>0?`${Math.max(...attempted)}%`:'—', color:attempted.length>0?gradeColor(Math.max(...attempted)):undefined },
                        { label:'This Week',       val:weeklyAttempts||'—',                   color:weeklyAttempts>0?'#27AE60':undefined },
                        { label:'Overall Grade',   val:overallAvg>0?`Grade ${gradeLetter(overallAvg)}`:'N/A', color:overallAvg>0?gradeColor(overallAvg):undefined },
                        { label:'Performance',     val:overallAvg>0?gradeLabel(overallAvg):'No data' },
                      ].map((st,i)=>(
                        <div key={i} style={s.summaryCard}>
                          <p style={s.summaryLabel}>{st.label}</p>
                          <p style={{ ...s.summaryVal, ...(st.color?{color:st.color}:{}) }}>{st.val}</p>
                        </div>
                      ))}
                    </div>

                    <div style={s.chartCard}>
                      <div style={s.chartHeader}>
                        <div>
                          <p style={s.chartTitle}>Score Trend</p>
                          <p style={s.chartSub}>Last {Math.min(studentResults.length,12)} attempts</p>
                        </div>
                        {overallAvg>0&&<div style={{ ...s.chartBadge, background:gradeColor(overallAvg)+'18', color:gradeColor(overallAvg) }}>Avg {overallAvg}%</div>}
                      </div>
                      <ScoreChart results={studentResults} name={studentProfile.full_name}/>
                    </div>

                    {/* Weak / strong */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:4 }}>
                      <div style={s.focusCard}>
                        <p style={s.focusTitle}>🎯 Needs Attention</p>
                        {weakSubjects.length===0
                          ? <p style={{ fontSize:'0.8rem', color:'#AAA', fontStyle:'italic' }}>No weak areas identified yet</p>
                          : weakSubjects.map(sub=>(
                            <div key={sub.key} style={s.focusRow}>
                              <span>{sub.emoji} {sub.name}</span>
                              <span style={{ color:gradeColor(bestScores[sub.name.toLowerCase()]), fontWeight:700, fontSize:'0.78rem' }}>
                                {bestScores[sub.name.toLowerCase()]}% · {gradeLetter(bestScores[sub.name.toLowerCase()])}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div style={{ ...s.focusCard, background:'#eafaf1', borderColor:'#a9e4be' }}>
                        <p style={{ ...s.focusTitle, color:'#27AE60' }}>⭐ Strengths</p>
                        {strongSubjects.length===0
                          ? <p style={{ fontSize:'0.8rem', color:'#AAA', fontStyle:'italic' }}>No strong areas yet</p>
                          : strongSubjects.map(sub=>(
                            <div key={sub.key} style={s.focusRow}>
                              <span>{sub.emoji} {sub.name}</span>
                              <span style={{ color:gradeColor(bestScores[sub.name.toLowerCase()]), fontWeight:700, fontSize:'0.78rem' }}>
                                {bestScores[sub.name.toLowerCase()]}% · {gradeLetter(bestScores[sub.name.toLowerCase()])}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Subjects tab */}
                {activeTab==='subjects' && (
                  <div style={s.subGrid}>
                    {SUBJECTS.map(sub => {
                      const key        = sub.name.toLowerCase()
                      const best       = bestScores[key] ?? null
                      const subResults = attemptsBySubject[key] || []
                      const subAvg     = subResults.length>0 ? Math.round(subResults.reduce((a,r)=>a+r.pct,0)/subResults.length) : null
                      const latest     = subResults.length>0 ? subResults[subResults.length-1].pct : null
                      return (
                        <div key={sub.key} style={{ ...s.subCard, borderLeft:`3px solid ${best!==null?gradeColor(best):'#E8E8E8'}` }}>
                          <Ring pct={best??0} size={56}/>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                              <span style={{ fontSize:'1rem' }}>{sub.emoji}</span>
                              <span style={s.subName}>{sub.name}</span>
                            </div>
                            {best !== null ? (
                              <>
                                <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:4 }}>
                                  <span style={{ fontSize:'0.72rem', color:'#888' }}>Best: <strong style={{ color:gradeColor(best) }}>{best}%</strong></span>
                                  {subAvg!==null&&<span style={{ fontSize:'0.72rem', color:'#888' }}>Avg: <strong style={{ color:gradeColor(subAvg) }}>{subAvg}%</strong></span>}
                                  {latest!==null&&<span style={{ fontSize:'0.72rem', color:'#888' }}>Latest: <strong style={{ color:gradeColor(latest) }}>{latest}%</strong></span>}
                                </div>
                                <p style={{ fontSize:'0.7rem', color:'#AAA' }}>{subResults.length} attempt{subResults.length>1?'s':''} · Grade {gradeLetter(best)}</p>
                                <div style={{ height:4, background:'#F0F0F0', borderRadius:100, overflow:'hidden', marginTop:6 }}>
                                  <div style={{ width:`${best}%`, height:'100%', background:gradeColor(best), borderRadius:100, transition:'width 0.6s ease' }}/>
                                </div>
                              </>
                            ) : (
                              <p style={{ fontSize:'0.75rem', color:'#CCC', fontStyle:'italic' }}>Not attempted — assign as homework</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* History tab */}
                {activeTab==='history' && (
                  <div style={s.historyCard}>
                    <p style={s.chartTitle}>Full Quiz History</p>
                    {[...studentResults].reverse().length===0 ? (
                      <p style={{ color:'#AAA', fontSize:'0.85rem', padding:'16px 0' }}>No attempts yet.</p>
                    ) : [...studentResults].reverse().map((r,i)=>(
                      <div key={i} style={s.histRow}>
                        <div style={s.histLeft}>
                          <div style={{ ...s.histDot, background:gradeColor(clamp(r.pct)) }}/>
                          <div>
                            <p style={s.histSubject}>{r.subject}</p>
                            <p style={s.histDate}>{new Date(r.created_at).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</p>
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ ...s.histScore, color:gradeColor(clamp(r.pct)) }}>{clamp(r.pct)}%</p>
                          <p style={s.histDetail}>{r.score}/{r.total} · Grade {gradeLetter(clamp(r.pct))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Session Plan tab */}
                {activeTab==='session' && (
                  <div>
                    <div style={s.sessionCard}>
                      <div style={s.sessionHeader}>
                        <div>
                          <p style={s.chartTitle}>🗓 Recommended Session Plan</p>
                          <p style={s.chartSub}>Based on {studentProfile.full_name?.split(' ')[0]}'s current performance data</p>
                        </div>
                        <div style={{ ...s.chartBadge, background:'var(--forest)', color:'var(--gold-lt)' }}>
                          {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                        </div>
                      </div>
                      <div style={s.planList}>
                        {sessionPlan.map((step,i)=>(
                          <div key={i} style={s.planStep}>
                            <div style={s.planNum}>{i+1}</div>
                            <p style={s.planText}>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Parent contact */}
                    {parentInfo && (
                      <div style={s.parentCard}>
                        <p style={s.chartTitle}>👨‍👩‍👧 Parent / Guardian</p>
                        <div style={s.parentRow}>
                          <div style={s.parentAvatar}>{parentInfo.full_name?.charAt(0)||'P'}</div>
                          <div>
                            <p style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--charcoal)' }}>{parentInfo.full_name}</p>
                            <p style={{ fontSize:'0.78rem', color:'#AAA' }}>{parentInfo.email}</p>
                          </div>
                        </div>
                        <div style={s.parentNote}>
                          <p style={{ fontSize:'0.8rem', color:'var(--charcoal-lt)', lineHeight:1.6 }}>
                            <strong>Suggested message to parent:</strong><br/>
                            {overallAvg===0
                              ? `Hi, I'm ${displayName.split(' ')[0]}, ${studentProfile.full_name?.split(' ')[0]}'s tutor. We're getting started on PSLE revision — please encourage ${studentProfile.full_name?.split(' ')[0]} to complete a few practice quizzes before our next session.`
                              : overallAvg>=70
                              ? `${studentProfile.full_name?.split(' ')[0]} is performing well with an average of ${overallAvg}%. Keep encouraging regular revision at home to maintain this standard.`
                              : `${studentProfile.full_name?.split(' ')[0]} is making progress (avg ${overallAvg}%) but needs more practice, especially in ${weakSubjects[0]?.name||'key subjects'}. Please encourage daily revision.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {!parentInfo && (
                      <div style={{ ...s.parentCard, background:'var(--ivory)', borderColor:'var(--ivory-dk)' }}>
                        <p style={{ fontSize:'0.85rem', color:'var(--charcoal-lt)' }}>
                          ℹ️ No parent account linked to this student yet. Encourage them to ask their parent to sign up and link their account.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Add student */}
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>➕ Add Student</p>
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

            {/* Class overview */}
            {students.length > 0 && (
              <div style={s.sideCard}>
                <p style={s.sideCardTitle}>📊 Class Overview</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12 }}>
                  {students.map(st => {
                    const preview = studentPreviews[st.id] || []
                    const avg = preview.length>0 ? Math.round(preview.reduce((a,r)=>a+clamp(r.pct),0)/preview.length) : null
                    const isActive = preview.length>0 && new Date(preview[0].created_at) > oneWeekAgo
                    return (
                      <div key={st.id} style={{ ...s.classRow, ...(selected===st.id?s.classRowActive:{}) }}
                        onClick={()=>setSelected(st.id)}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                          <div style={{ ...s.avatarSm, background:isActive?'var(--forest)':'#CCC' }}>
                            {st.full_name?.charAt(0)||'?'}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--charcoal)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {st.full_name?.split(' ')[0]}
                            </p>
                            <p style={{ fontSize:'0.65rem', color:isActive?'#27AE60':'#CCC', fontWeight:600 }}>
                              {isActive?'Active':'Inactive'}
                            </p>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                          <div style={{ width:48, height:5, background:'#F0F0F0', borderRadius:100, overflow:'hidden' }}>
                            <div style={{ width:`${avg??0}%`, height:'100%', background:avg?gradeColor(avg):'#E0E0E0', borderRadius:100, transition:'width 0.5s' }}/>
                          </div>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, color:avg?gradeColor(avg):'#CCC', minWidth:28 }}>
                            {avg!==null?`${avg}%`:'—'}
                          </span>
                          <button onClick={e=>{e.stopPropagation();removeStudent(st.id)}} style={s.removeBtn}>✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {classAvg>0&&(
                  <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--ivory-dk)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.78rem', color:'#AAA', fontWeight:600 }}>Class Average</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:700, color:gradeColor(classAvg) }}>{classAvg}% · Grade {gradeLetter(classAvg)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tutor tip */}
            <div style={s.tipCard}>
              <p style={s.tipBadge}>💡 Tutor Insight</p>
              <p style={s.tipText}>
                {students.length===0
                  ? 'Add students to start tracking their PSLE preparation and planning targeted sessions.'
                  : !selected||totalAttempts===0
                  ? 'Assign a Science quiz before the next session to establish a baseline for each student.'
                  : weeklyAttempts===0
                  ? `${studentProfile?.full_name?.split(' ')[0]} hasn't practiced this week — check in before the session.`
                  : weakSubjects.length>0
                  ? `Prioritise ${weakSubjects[0]?.name} in your next session — it has the lowest score.`
                  : 'Strong performance across the board. Introduce timed practice to build exam confidence.'}
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
  banner:          { background:'var(--forest)', padding:'36px 0 40px' },
  bannerInner:     { display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, flexWrap:'wrap' },
  bannerRole:      { color:'var(--sage-lt)', fontSize:'0.78rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 },
  bannerTitle:     { fontFamily:'var(--font-display)', fontSize:'clamp(1.6rem,3vw,2.4rem)', color:'var(--ivory)', marginBottom:8 },
  bannerSub:       { color:'rgba(245,240,232,0.6)', fontSize:'0.9rem' },
  statRow:         { display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 },
  statBox:         { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'10px 14px', textAlign:'center', minWidth:64 },
  statNum:         { display:'block', fontFamily:'var(--font-display)', fontSize:'1.45rem', fontWeight:700, color:'var(--gold-lt)', lineHeight:1 },
  statLabel:       { display:'block', fontSize:'0.64rem', color:'var(--sage-lt)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:4 },
  grid:            { display:'grid', gridTemplateColumns:'1fr 288px', gap:24, alignItems:'start' },
  sectionHeader:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionTitle:    { fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--forest)' },
  emptyState:      { textAlign:'center', padding:'60px 24px', background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)' },
  rosterGrid:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:28 },
  rosterCard:      { background:'var(--white)', border:'1.5px solid var(--ivory-dk)', borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left', fontFamily:'var(--font-body)', transition:'all 0.18s' },
  rosterCardActive:{ border:'1.5px solid var(--forest)', boxShadow:'0 0 0 3px rgba(27,61,47,0.08)', background:'var(--ivory)' },
  rosterTop:       { display:'flex', alignItems:'center', gap:10 },
  rosterName:      { fontSize:'0.88rem', fontWeight:700, color:'var(--charcoal)', marginBottom:2 },
  rosterMeta:      { fontSize:'0.7rem', color:'#AAA' },
  rosterGrade:     { fontSize:'0.85rem', fontWeight:800, padding:'3px 8px', borderRadius:8, display:'block' },
  avatar:          { width:36, height:36, borderRadius:'50%', color:'var(--gold-lt)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0 },
  avatarLg:        { width:52, height:52, borderRadius:'50%', background:'var(--forest)', color:'var(--gold-lt)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.3rem', flexShrink:0 },
  avatarSm:        { width:26, height:26, borderRadius:'50%', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.75rem', flexShrink:0 },
  studentHeader:   { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:14, padding:'18px 20px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' },
  studentHeaderLeft:{ display:'flex', alignItems:'center', gap:14 },
  studentName:     { fontFamily:'var(--font-display)', fontSize:'1.3rem', color:'var(--forest)', marginBottom:4 },
  studentMeta:     { fontSize:'0.78rem', color:'#AAA', marginBottom:3 },
  parentLink:      { fontSize:'0.78rem', color:'var(--forest-lt)', fontWeight:500 },
  trendBadge:      { display:'flex', flexDirection:'column', alignItems:'center', gap:3, border:'1px solid', borderRadius:10, padding:'10px 14px', minWidth:120, textAlign:'center' },
  tabs:            { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  tab:             { padding:'8px 14px', borderRadius:8, border:'1.5px solid var(--ivory-dk)', background:'var(--white)', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, color:'var(--charcoal-lt)', fontFamily:'var(--font-body)', transition:'all 0.15s' },
  tabActive:       { background:'var(--forest)', color:'var(--gold-lt)', borderColor:'var(--forest)' },
  summaryRow:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:16 },
  summaryCard:     { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:12, padding:'14px' },
  summaryLabel:    { fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'#AAA', marginBottom:5 },
  summaryVal:      { fontSize:'0.92rem', fontWeight:700, color:'var(--charcoal)' },
  chartCard:       { background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)', padding:'18px 22px', marginBottom:16, boxShadow:'0 2px 12px rgba(27,61,47,0.07)' },
  chartHeader:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  chartTitle:      { fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'var(--forest)', marginBottom:2 },
  chartSub:        { fontSize:'0.73rem', color:'#AAA' },
  chartBadge:      { fontSize:'0.75rem', fontWeight:700, padding:'4px 10px', borderRadius:100 },
  focusCard:       { background:'#fff8f0', border:'1px solid #f5d5a8', borderRadius:12, padding:'14px 16px' },
  focusTitle:      { fontSize:'0.82rem', fontWeight:700, color:'#E67E22', marginBottom:10 },
  focusRow:        { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f5e8d0', fontSize:'0.82rem', color:'var(--charcoal)' },
  subGrid:         { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 },
  subCard:         { display:'flex', alignItems:'center', gap:12, background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:12, padding:'14px 16px' },
  subName:         { fontWeight:600, fontSize:'0.85rem', color:'var(--charcoal)' },
  historyCard:     { background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)', padding:'18px 22px' },
  histRow:         { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--ivory-dk)' },
  histLeft:        { display:'flex', alignItems:'center', gap:10 },
  histDot:         { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  histSubject:     { fontSize:'0.85rem', fontWeight:600, color:'var(--charcoal)', marginBottom:2 },
  histDate:        { fontSize:'0.7rem', color:'#AAA' },
  histScore:       { fontSize:'0.9rem', fontWeight:700 },
  histDetail:      { fontSize:'0.7rem', color:'#AAA' },
  sessionCard:     { background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)', padding:'20px 24px', marginBottom:14, boxShadow:'0 2px 12px rgba(27,61,47,0.07)' },
  sessionHeader:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 },
  planList:        { display:'flex', flexDirection:'column', gap:12 },
  planStep:        { display:'flex', alignItems:'flex-start', gap:12 },
  planNum:         { width:26, height:26, borderRadius:'50%', background:'var(--forest)', color:'var(--gold-lt)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', fontWeight:700, flexShrink:0, marginTop:1 },
  planText:        { fontSize:'0.88rem', color:'var(--charcoal)', lineHeight:1.6, flex:1 },
  parentCard:      { background:'var(--white)', borderRadius:14, border:'1px solid var(--ivory-dk)', padding:'18px 20px', marginBottom:14 },
  parentRow:       { display:'flex', alignItems:'center', gap:12, marginBottom:14 },
  parentAvatar:    { width:36, height:36, borderRadius:'50%', background:'var(--gold-dk)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0 },
  parentNote:      { background:'var(--ivory)', borderRadius:8, padding:'12px 14px', borderLeft:'3px solid var(--sage)' },
  sideCard:        { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:14, padding:'20px', marginBottom:14, boxShadow:'0 1px 6px rgba(27,61,47,0.07)' },
  sideCardTitle:   { fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'var(--forest)', marginBottom:5 },
  sideCardDesc:    { color:'var(--charcoal-lt)', fontSize:'0.83rem', lineHeight:1.55 },
  classRow:        { display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:10, cursor:'pointer', transition:'background 0.15s' },
  classRowActive:  { background:'var(--ivory)' },
  removeBtn:       { background:'#fdecea', color:'var(--error)', border:'none', borderRadius:6, padding:'3px 7px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' },
  tipCard:         { background:'var(--forest)', borderRadius:14, padding:'18px', marginBottom:12 },
  tipBadge:        { fontSize:'0.75rem', fontWeight:700, color:'var(--gold)', marginBottom:6, letterSpacing:'0.04em' },
  tipText:         { fontSize:'0.83rem', color:'rgba(245,240,232,0.75)', lineHeight:1.6 },
  signOut:         { width:'100%', background:'var(--white)', border:'1.5px solid var(--ivory-dk)', color:'var(--charcoal-lt)', borderRadius:10, fontFamily:'var(--font-body)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', padding:'11px' },
}
