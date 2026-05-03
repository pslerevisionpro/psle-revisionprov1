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

function Ring({ pct, size = 56 }) {
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

function ActivityChart({ results }) {
  if (!results || results.length === 0) return (
    <div style={{ textAlign:'center', padding:'24px 0', color:'#AAA', fontSize:'0.85rem' }}>
      No quiz activity yet
    </div>
  )
  const BAR_W=6, GAP=18, H=80, BOTTOM=32, TOP=18, LEFT=24
  const TOTAL_H = H+BOTTOM+TOP
  const data = [...results].slice(-10)
  const totalW = Math.max(data.length*(BAR_W+GAP)-GAP+LEFT, 160)
  return (
    <div style={{ maxWidth:320, margin:'0 auto', overflowX:'auto' }}>
      <svg viewBox={`0 0 ${totalW} ${TOTAL_H}`} width="100%" style={{ overflow:'visible', display:'block' }}>
        {[0,50,100].map(v => {
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
              <rect x={x} y={y} width={BAR_W} height={barH} rx={3} fill={color} opacity="0.85"/>
              <text x={x+BAR_W/2} y={y-3} fontSize="7" fill={color} textAnchor="middle" fontWeight="700" fontFamily="'Outfit',sans-serif">{pct}%</text>
              <text x={x+BAR_W/2} y={TOP+H+11} fontSize="6.5" fill="#888" textAnchor="middle" fontFamily="'Outfit',sans-serif">{d.subject?.slice(0,3)}</text>
              <text x={x+BAR_W/2} y={TOP+H+21} fontSize="6" fill="#AAAAAA" textAnchor="middle" fontFamily="'Outfit',sans-serif">
                {new Date(d.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function ParentDashboard() {
  const { session, profile, signOut } = useAuth()
  const [children, setChildren]           = useState([])
  const [selected, setSelected]           = useState(null)
  const [childResults, setChildResults]   = useState([])
  const [childProfile, setChildProfile]   = useState(null)
  const [linkEmail, setLinkEmail]         = useState('')
  const [linkMsg, setLinkMsg]             = useState('')
  const [linkErr, setLinkErr]             = useState('')
  const [linking, setLinking]             = useState(false)
  const [loading, setLoading]             = useState(true)
  const [nudgeSent, setNudgeSent]         = useState(false)
  const navigate = useNavigate()

  useEffect(() => { if (session) loadChildren() }, [session])
  useEffect(() => { if (selected) loadChildData(selected) }, [selected])

  async function loadChildren() {
    setLoading(true)
    const { data: links } = await supabase
      .from('parent_child_links')
      .select('child_id')
      .eq('parent_id', session.user.id)
    if (links && links.length > 0) {
      const childIds = links.map(l => l.child_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, grade, email')
        .in('id', childIds)
      if (profiles) {
        setChildren(profiles)
        if (profiles.length > 0 && !selected) setSelected(profiles[0].id)
      }
    }
    setLoading(false)
  }

  async function loadChildData(childId) {
    const [{ data: prof }, { data: results }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', childId).single(),
      supabase.from('quiz_results').select('*').eq('user_id', childId).lte('pct', 100).order('created_at', { ascending: true })
    ])
    if (prof)    setChildProfile(prof)
    if (results) setChildResults(results)
    setNudgeSent(false)
  }

  async function linkChild(e) {
    e.preventDefault()
    setLinkErr(''); setLinkMsg(''); setLinking(true)
    try {
      const { data: prof } = await supabase
        .from('profiles').select('id, full_name, role').eq('email', linkEmail.trim().toLowerCase()).single()
      if (!prof) throw new Error('No student account found with that email address.')
      if (prof.role !== 'student') throw new Error('That account is not a student account.')
      const { error } = await supabase.from('parent_child_links').insert({ parent_id: session.user.id, child_id: prof.id })
      if (error && error.code !== '23505') throw error
      setLinkMsg(`${prof.full_name} has been linked to your account.`)
      setLinkEmail('')
      loadChildren()
    } catch (err) { setLinkErr(err.message) }
    finally { setLinking(false) }
  }

  async function unlinkChild(childId) {
    await supabase.from('parent_child_links').delete().eq('parent_id', session.user.id).eq('child_id', childId)
    setChildren(c => c.filter(k => k.id !== childId))
    if (selected === childId) { setSelected(null); setChildResults([]); setChildProfile(null) }
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Parent'

  // Compute child stats
  const bestScores = {}
  childResults.forEach(r => {
    const key = r.subject?.toLowerCase()
    if (!bestScores[key] || r.pct > bestScores[key]) bestScores[key] = clamp(r.pct)
  })
  const attempted      = Object.values(bestScores)
  const overallAvg     = attempted.length > 0 ? Math.round(attempted.reduce((a,b)=>a+b,0)/attempted.length) : 0
  const totalAttempts  = childResults.length
  const recentResults  = [...childResults].reverse().slice(0, 5)
  const oneWeekAgo     = new Date(Date.now() - 7*24*60*60*1000)
  const weeklyAttempts = childResults.filter(r => new Date(r.created_at) > oneWeekAgo).length
  const lastActive     = childResults.length > 0
    ? new Date(childResults[childResults.length-1].created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
    : null

  // ROI assessment
  function getROIStatus() {
    if (totalAttempts === 0) return { label:'Not started', color:'#AAA', msg:'Your child has not taken any quizzes yet. Encourage them to start with Science today.' }
    if (weeklyAttempts === 0) return { label:'Inactive this week', color:'#E67E22', msg:'No activity in the last 7 days. A gentle nudge can help get them back on track.' }
    if (weeklyAttempts >= 3 && overallAvg >= 70) return { label:'On track', color:'#27AE60', msg:'Consistent practice with strong scores. Your investment is paying off.' }
    if (weeklyAttempts >= 1 && overallAvg >= 50) return { label:'Making progress', color:'#2980B9', msg:'Regular activity with decent scores. Encourage more frequent sessions.' }
    return { label:'Needs support', color:'#C0392B', msg:'Low scores despite attempts. Consider booking a tutor session to address weak areas.' }
  }
  const roi = getROIStatus()

  return (
    <div className="page-container">
      <Navbar />

      {/* Banner */}
      <div style={s.banner}>
        <div className="content-wrapper" style={s.bannerInner}>
          <div style={{ flex:1 }}>
            <p style={s.bannerRole}>👨‍👩‍👧 Parent Dashboard</p>
            <h1 style={s.bannerTitle}>Welcome, {displayName.split(' ')[0]}!</h1>
            <p style={s.bannerSub}>
              {children.length === 0
                ? 'Link your child\'s student account below to start monitoring their progress.'
                : `Monitoring ${children.length} child${children.length>1?'ren':''}'s PSLE preparation.`}
            </p>
          </div>
          {selected && childProfile && (
            <div style={s.statRow}>
              {[
                { val:totalAttempts||'—',                               label:'Total Attempts' },
                { val:overallAvg>0?`${overallAvg}%`:'—',               label:'Avg Score',    color:overallAvg>0?gradeColor(overallAvg):undefined },
                { val:weeklyAttempts||'—',                              label:'This Week',    color:weeklyAttempts>0?'#27AE60':undefined },
                { val:overallAvg>0?gradeLetter(overallAvg):'—',         label:'Grade',        color:'var(--gold-lt)' },
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

          {/* Left column */}
          <div style={{ minWidth:0 }}>

            {/* Child tabs */}
            {children.length > 0 && (
              <div style={s.childTabs}>
                {children.map(kid => (
                  <button key={kid.id} onClick={()=>setSelected(kid.id)}
                    style={{ ...s.childTab, ...(selected===kid.id?s.childTabActive:{}) }}>
                    🎒 {kid.full_name?.split(' ')[0] || 'Child'}
                    <span style={s.childTabGrade}>{kid.grade==='std7'?'Std 7':'Std 6'}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {children.length === 0 && !loading && (
              <div style={s.emptyState}>
                <p style={{ fontSize:'3rem', marginBottom:16 }}>👨‍👩‍👧</p>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'var(--forest)', marginBottom:10 }}>
                  No children linked yet
                </h3>
                <p style={{ color:'var(--charcoal-lt)', fontSize:'0.93rem', maxWidth:420, margin:'0 auto 20px', lineHeight:1.7 }}>
                  To monitor your child's PSLE preparation, link their student account using the form on the right.
                  Your child must have a student account first.
                </p>
                <div style={s.howItWorks}>
                  <p style={s.howStep}><strong>1.</strong> Your child signs up at the Student portal</p>
                  <p style={s.howStep}><strong>2.</strong> You enter their email in the form →</p>
                  <p style={s.howStep}><strong>3.</strong> Their progress appears here instantly</p>
                </div>
              </div>
            )}

            {/* Child monitoring view */}
            {selected && childProfile && (
              <>
                {/* Child info + ROI card */}
                <div style={s.roiCard}>
                  <div style={s.roiLeft}>
                    <div style={s.childAvatar}>
                      {childProfile.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p style={s.childName}>{childProfile.full_name}</p>
                      <p style={s.childMeta}>{childProfile.grade==='std7'?'Standard 7':'Standard 6'} · {childProfile.email}</p>
                      {lastActive && <p style={s.childMeta}>Last active: {lastActive}</p>}
                    </div>
                  </div>
                  <div style={{ ...s.roiStatus, background:roi.color+'15', borderColor:roi.color+'40' }}>
                    <p style={{ ...s.roiLabel, color:roi.color }}>{roi.label}</p>
                    <p style={s.roiMsg}>{roi.msg}</p>
                  </div>
                </div>

                {/* Summary cards */}
                <div style={s.summaryRow}>
                  <SummaryCard label="Total Attempts" val={totalAttempts||'—'} />
                  <SummaryCard label="Average Score"  val={overallAvg>0?`${overallAvg}%`:'No data'} color={overallAvg>0?gradeColor(overallAvg):undefined} />
                  <SummaryCard label="Best Score"     val={attempted.length>0?`${Math.max(...attempted)}%`:'No data'} color={attempted.length>0?gradeColor(Math.max(...attempted)):undefined} />
                  <SummaryCard label="This Week"      val={weeklyAttempts>0?`${weeklyAttempts} quiz${weeklyAttempts>1?'zes':''}`:'No activity'} color={weeklyAttempts>0?'#27AE60':'#E67E22'} />
                  <SummaryCard label="Subjects Tried" val={`${attempted.length} of 7`} />
                  <SummaryCard label="Overall Grade"  val={overallAvg>0?`Grade ${gradeLetter(overallAvg)}`:'N/A'} color={overallAvg>0?gradeColor(overallAvg):undefined} />
                </div>

                {/* Activity chart */}
                <div style={s.chartCard}>
                  <div style={s.chartHeader}>
                    <div>
                      <p style={s.chartTitle}>{childProfile.full_name?.split(' ')[0]}'s Quiz History</p>
                      <p style={s.chartSub}>Score trend across last {Math.min(childResults.length,10)} attempts</p>
                    </div>
                    {overallAvg>0&&(
                      <div style={{ ...s.chartBadge, background:gradeColor(overallAvg)+'18', color:gradeColor(overallAvg) }}>
                        Avg {overallAvg}%
                      </div>
                    )}
                  </div>
                  <ActivityChart results={childResults}/>
                </div>

                {/* Subject breakdown */}
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>Subject Performance</h2>
                  <span style={{ fontSize:'0.8rem', color:'#AAA' }}>{attempted.length} of 7 attempted</span>
                </div>
                <div style={s.subGrid}>
                  {SUBJECTS.map(sub => {
                    const key = sub.name.toLowerCase()
                    const best = bestScores[key] ?? null
                    const subAttempts = childResults.filter(r => r.subject?.toLowerCase()===key)
                    return (
                      <div key={sub.key} style={{ ...s.subCard, borderLeft:`3px solid ${best!==null?gradeColor(best):'#E0E0E0'}` }}>
                        <Ring pct={best??0} size={50}/>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                            <span>{sub.emoji}</span>
                            <span style={s.subName}>{sub.name}</span>
                          </div>
                          {best !== null ? (
                            <>
                              <p style={{ fontSize:'0.72rem', fontWeight:700, color:gradeColor(best), marginBottom:2 }}>
                                Best {best}% · Grade {gradeLetter(best)} · {subAttempts.length} attempt{subAttempts.length>1?'s':''}
                              </p>
                              <div style={{ height:4, background:'#F0F0F0', borderRadius:100, overflow:'hidden', marginTop:4 }}>
                                <div style={{ width:`${best}%`, height:'100%', background:gradeColor(best), borderRadius:100, transition:'width 0.6s ease' }}/>
                              </div>
                            </>
                          ) : (
                            <p style={{ fontSize:'0.72rem', color:'#CCC', fontStyle:'italic' }}>Not attempted yet</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Recent activity */}
                <div style={{ ...s.chartCard, marginTop:20 }}>
                  <p style={s.chartTitle}>Recent Quiz Activity</p>
                  {recentResults.length===0 ? (
                    <div style={{ textAlign:'center', padding:'20px 0' }}>
                      <p style={{ color:'#AAA', fontSize:'0.85rem', marginBottom:12 }}>No quiz attempts recorded yet.</p>
                      <p style={{ color:'var(--charcoal-lt)', fontSize:'0.82rem' }}>
                        Share the link with your child: <strong>psle-revisionprov1.mompoloki-nkhumane.workers.dev/student-auth</strong>
                      </p>
                    </div>
                  ) : recentResults.map((r,i)=>(
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

          {/* Sidebar */}
          <div>
            {/* Link child form */}
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>➕ Link a Child</p>
              <p style={s.sideCardDesc}>Enter your child's student account email to connect their progress to your dashboard.</p>
              <form onSubmit={linkChild} style={{ marginTop:14 }}>
                <div className="form-group">
                  <label>Child's Email</label>
                  <input type="email" placeholder="child@email.com" value={linkEmail} onChange={e=>setLinkEmail(e.target.value)} required/>
                </div>
                {linkErr&&<div className="alert alert-error" style={{ fontSize:'0.82rem' }}>{linkErr}</div>}
                {linkMsg&&<div className="alert alert-success" style={{ fontSize:'0.82rem' }}>{linkMsg}</div>}
                <button type="submit" className="btn btn-primary btn-full" disabled={linking}>
                  {linking?'Linking…':'Link Child →'}
                </button>
              </form>
            </div>

            {/* Linked children */}
            {children.length > 0 && (
              <div style={s.sideCard}>
                <p style={s.sideCardTitle}>👧 Linked Children</p>
                {children.map(kid=>(
                  <div key={kid.id} style={s.kidRow}>
                    <div>
                      <p style={s.kidName}>{kid.full_name}</p>
                      <p style={s.kidGrade}>{kid.grade==='std7'?'Standard 7':'Standard 6'}</p>
                    </div>
                    <button onClick={()=>unlinkChild(kid.id)} style={s.unlinkBtn}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* Nudge card */}
            {selected && childProfile && (
              <div style={s.nudgeCard}>
                <p style={s.nudgeTitle}>📣 Nudge Your Child</p>
                <p style={s.nudgeDesc}>
                  {weeklyAttempts === 0
                    ? 'No activity this week. Send a reminder to encourage revision.'
                    : weeklyAttempts < 3
                    ? 'Good start this week. Encourage one more session to build consistency.'
                    : 'Great week! Acknowledge their effort to keep motivation high.'}
                </p>
                <button
                  className="btn btn-full"
                  style={{ ...s.nudgeBtn, ...(nudgeSent?s.nudgeBtnSent:{}) }}
                  onClick={()=>setNudgeSent(true)}
                  disabled={nudgeSent}
                >
                  {nudgeSent ? '✓ Reminder noted' : weeklyAttempts===0 ? '📲 Remind to Revise' : weeklyAttempts<3 ? '📲 Encourage More Sessions' : '🌟 Send Praise'}
                </button>
                {nudgeSent && (
                  <p style={{ fontSize:'0.75rem', color:'#AAA', marginTop:8, textAlign:'center' }}>
                    Let your child know verbally or via message!
                  </p>
                )}
              </div>
            )}

            {/* Consent & data */}
            <div style={s.consentCard}>
              <p style={s.consentTitle}>🔒 Data & Consent</p>
              <p style={s.consentText}>
                You have given consent for your child's learning data to be stored and used for educational progress tracking.
                To withdraw consent or request data deletion, contact: <strong>privacy@pslerevisionpro.co.bw</strong>
              </p>
            </div>

            {/* Parent tip */}
            <div style={s.tipCard}>
              <p style={s.tipBadge}>💡 Parent Insight</p>
              <p style={s.tipText}>
                {children.length===0
                  ? 'Link your child\'s account to start monitoring their PSLE preparation progress.'
                  : totalAttempts===0
                  ? 'Sit with your child for their first quiz. It takes just 5 minutes and sets a great habit.'
                  : weeklyAttempts===0
                  ? 'No activity this week. A short daily revision habit is more effective than occasional cramming.'
                  : overallAvg>=70
                  ? 'Strong performance! Ask your child to explain what they learned — it reinforces retention.'
                  : 'Regular encouragement from parents increases student effort by up to 40% — keep it up!'}
              </p>
            </div>

            <button onClick={async()=>{ await signOut(); navigate('/') }} style={s.signOut}>← Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, val, color }) {
  return (
    <div style={{ background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:12, padding:'14px 16px' }}>
      <p style={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'#AAA', marginBottom:6 }}>{label}</p>
      <p style={{ fontSize:'0.95rem', fontWeight:700, color:color||'var(--charcoal)' }}>{val}</p>
    </div>
  )
}

const s = {
  banner:        { background:'var(--forest)', padding:'36px 0 40px' },
  bannerInner:   { display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, flexWrap:'wrap' },
  bannerRole:    { color:'var(--sage-lt)', fontSize:'0.78rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 },
  bannerTitle:   { fontFamily:'var(--font-display)', fontSize:'clamp(1.6rem,3vw,2.4rem)', color:'var(--ivory)', marginBottom:8 },
  bannerSub:     { color:'rgba(245,240,232,0.6)', fontSize:'0.9rem' },
  statRow:       { display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 },
  statBox:       { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'10px 14px', textAlign:'center', minWidth:64 },
  statNum:       { display:'block', fontFamily:'var(--font-display)', fontSize:'1.45rem', fontWeight:700, color:'var(--gold-lt)', lineHeight:1 },
  statLabel:     { display:'block', fontSize:'0.64rem', color:'var(--sage-lt)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:4 },
  grid:          { display:'grid', gridTemplateColumns:'1fr 288px', gap:24, alignItems:'start' },
  childTabs:     { display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 },
  childTab:      { display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:100, border:'1.5px solid var(--ivory-dk)', background:'var(--white)', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, color:'var(--charcoal-lt)', fontFamily:'var(--font-body)', transition:'all 0.18s' },
  childTabActive:{ background:'var(--forest)', color:'var(--gold-lt)', borderColor:'var(--forest)' },
  childTabGrade: { fontSize:'0.7rem', background:'rgba(255,255,255,0.15)', padding:'2px 6px', borderRadius:100 },
  emptyState:    { textAlign:'center', padding:'60px 24px', background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)' },
  howItWorks:    { background:'var(--ivory)', borderRadius:12, padding:'16px 20px', display:'inline-block', textAlign:'left' },
  howStep:       { fontSize:'0.85rem', color:'var(--charcoal-lt)', marginBottom:8, lineHeight:1.5 },
  roiCard:       { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:14, padding:'20px', marginBottom:20, display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' },
  roiLeft:       { display:'flex', alignItems:'center', gap:14, flex:1, minWidth:200 },
  childAvatar:   { width:48, height:48, borderRadius:'50%', background:'var(--forest)', color:'var(--gold-lt)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.2rem', flexShrink:0 },
  childName:     { fontSize:'1rem', fontWeight:700, color:'var(--charcoal)', marginBottom:3 },
  childMeta:     { fontSize:'0.75rem', color:'#AAA', marginBottom:2 },
  roiStatus:     { flex:1, minWidth:180, border:'1px solid', borderRadius:10, padding:'12px 14px' },
  roiLabel:      { fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 },
  roiMsg:        { fontSize:'0.8rem', color:'var(--charcoal-lt)', lineHeight:1.55 },
  summaryRow:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:20 },
  chartCard:     { background:'var(--white)', borderRadius:16, border:'1px solid var(--ivory-dk)', padding:'20px 24px', marginBottom:20, boxShadow:'0 2px 12px rgba(27,61,47,0.07)' },
  chartHeader:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  chartTitle:    { fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'var(--forest)', marginBottom:2 },
  chartSub:      { fontSize:'0.73rem', color:'#AAA' },
  chartBadge:    { fontSize:'0.75rem', fontWeight:700, padding:'4px 10px', borderRadius:100 },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionTitle:  { fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--forest)' },
  subGrid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 },
  subCard:       { display:'flex', alignItems:'center', gap:10, background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:12, padding:'12px 14px' },
  subName:       { fontWeight:600, fontSize:'0.85rem', color:'var(--charcoal)' },
  actRow:        { display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--ivory-dk)' },
  actSubject:    { fontSize:'0.83rem', fontWeight:600, color:'var(--charcoal)' },
  actDate:       { fontSize:'0.7rem', color:'#AAA' },
  actScore:      { fontSize:'0.88rem', fontWeight:700 },
  actGrade:      { fontSize:'0.7rem', fontWeight:600 },
  sideCard:      { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:14, padding:'20px', marginBottom:14, boxShadow:'0 1px 6px rgba(27,61,47,0.07)' },
  sideCardTitle: { fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'var(--forest)', marginBottom:5 },
  sideCardDesc:  { color:'var(--charcoal-lt)', fontSize:'0.83rem', lineHeight:1.55 },
  kidRow:        { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--ivory-dk)' },
  kidName:       { fontSize:'0.88rem', fontWeight:600, color:'var(--charcoal)' },
  kidGrade:      { fontSize:'0.72rem', color:'#AAA' },
  unlinkBtn:     { background:'#fdecea', color:'var(--error)', border:'none', borderRadius:6, padding:'4px 10px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' },
  nudgeCard:     { background:'#eef7f4', border:'1px solid #b8dece', borderRadius:14, padding:'18px', marginBottom:14 },
  nudgeTitle:    { fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'var(--forest)', marginBottom:5 },
  nudgeDesc:     { fontSize:'0.82rem', color:'var(--charcoal-lt)', lineHeight:1.55, marginBottom:12 },
  nudgeBtn:      { background:'var(--forest)', color:'var(--gold-lt)', border:'none', borderRadius:8, fontFamily:'var(--font-body)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', padding:'11px', transition:'all 0.2s' },
  nudgeBtnSent:  { background:'#27AE60', color:'white' },
  consentCard:   { background:'var(--ivory)', border:'1px solid var(--ivory-dk)', borderRadius:12, padding:'16px', marginBottom:14 },
  consentTitle:  { fontSize:'0.82rem', fontWeight:700, color:'var(--forest)', marginBottom:6 },
  consentText:   { fontSize:'0.78rem', color:'var(--charcoal-lt)', lineHeight:1.6 },
  tipCard:       { background:'var(--forest)', borderRadius:14, padding:'18px', marginBottom:12 },
  tipBadge:      { fontSize:'0.75rem', fontWeight:700, color:'var(--gold)', marginBottom:6, letterSpacing:'0.04em' },
  tipText:       { fontSize:'0.83rem', color:'rgba(245,240,232,0.75)', lineHeight:1.6 },
  signOut:       { width:'100%', background:'var(--white)', border:'1.5px solid var(--ivory-dk)', color:'var(--charcoal-lt)', borderRadius:10, fontFamily:'var(--font-body)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', padding:'11px' },
}
