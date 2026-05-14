function clamp(v) { return Math.min(100, Math.max(0, v ?? 0)) }
function gradeColor(p) {
  if (p >= 80) return '#27AE60'
  if (p >= 65) return '#2980B9'
  if (p >= 50) return '#E67E22'
  return '#C0392B'
}

export function SubjectHistory({ subjectName, results }) {
  if (!results || results.length === 0) return null
  const MS_DAY = 86400000
  const now = Date.now()
  const sorted = [...results].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const last10 = sorted.slice(-10)
  const avg7d = (() => { const r = sorted.filter(r => now - new Date(r.created_at) <= 7*MS_DAY); return r.length>0?Math.round(r.reduce((a,b)=>a+clamp(b.pct),0)/r.length):null })()
  const avg4w = (() => { const r = sorted.filter(r => now - new Date(r.created_at) <= 28*MS_DAY); return r.length>0?Math.round(r.reduce((a,b)=>a+clamp(b.pct),0)/r.length):null })()
  const allAvg = Math.round(sorted.reduce((a,b)=>a+clamp(b.pct),0)/sorted.length)
  const BAR_W=6,GAP=14,H=70,BOTTOM=28,TOP=16,LEFT=24,TOTAL_H=H+BOTTOM+TOP
  const totalW = Math.max(last10.length*(BAR_W+GAP)-GAP+LEFT,120)
  return (
    <div style={sh.card}>
      <div style={sh.header}>
        <p style={sh.title}>{subjectName}</p>
        <div style={sh.statRow}>
          {avg7d!==null&&<div style={{...sh.stat,background:gradeColor(avg7d)+'15',borderColor:gradeColor(avg7d)+'40'}}><span style={{...sh.statVal,color:gradeColor(avg7d)}}>{avg7d}%</span><span style={sh.statLabel}>7-day</span></div>}
          {avg4w!==null&&<div style={{...sh.stat,background:gradeColor(avg4w)+'15',borderColor:gradeColor(avg4w)+'40'}}><span style={{...sh.statVal,color:gradeColor(avg4w)}}>{avg4w}%</span><span style={sh.statLabel}>4-week</span></div>}
          <div style={{...sh.stat,background:gradeColor(allAvg)+'15',borderColor:gradeColor(allAvg)+'40'}}><span style={{...sh.statVal,color:gradeColor(allAvg)}}>{allAvg}%</span><span style={sh.statLabel}>all time</span></div>
        </div>
      </div>
      <p style={sh.sub}>Last {last10.length} attempt{last10.length!==1?'s':''} · {sorted.length} total</p>
      <div style={{overflowX:'auto'}}>
        <svg viewBox={`0 0 ${totalW} ${TOTAL_H}`} width="100%" style={{overflow:'visible',display:'block',maxWidth:400}}>
          {[0,50,100].map(v=>{const y=TOP+H-(v/100)*H;return(<g key={v}><line x1={LEFT} y1={y} x2={totalW} y2={y} stroke={v===0?'#C8C8C8':'#EBEBEB'} strokeWidth={v===0?1:0.5}/><text x={LEFT-4} y={y+3.5} fontSize="7" fill="#A0A0A0" textAnchor="end" fontFamily="'Outfit',sans-serif">{v}</text></g>)})}
          {last10.map((d,i)=>{const pct=clamp(d.pct),x=LEFT+i*(BAR_W+GAP),barH=(pct/100)*H,y=TOP+H-barH,color=gradeColor(pct);return(<g key={i}><rect x={x} y={y} width={BAR_W} height={barH} rx={2} fill={color} opacity="0.85"/><text x={x+BAR_W/2} y={y-3} fontSize="7" fill={color} textAnchor="middle" fontWeight="700" fontFamily="'Outfit',sans-serif">{pct}%</text><text x={x+BAR_W/2} y={TOP+H+12} fontSize="6" fill="#888" textAnchor="middle" fontFamily="'Outfit',sans-serif">{new Date(d.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</text></g>)})}
        </svg>
      </div>
    </div>
  )
}

const sh = {
  card:{background:'var(--white)',borderRadius:14,border:'1px solid var(--ivory-dk)',padding:'16px 20px',marginBottom:12},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4,flexWrap:'wrap',gap:8},
  title:{fontFamily:'var(--font-display)',fontSize:'1rem',color:'var(--forest)',fontWeight:600},
  sub:{fontSize:'0.72rem',color:'#AAA',marginBottom:12},
  statRow:{display:'flex',gap:6,flexWrap:'wrap'},
  stat:{display:'flex',flexDirection:'column',alignItems:'center',border:'1px solid',borderRadius:8,padding:'4px 10px',minWidth:52},
  statVal:{fontSize:'0.88rem',fontWeight:700,lineHeight:1.2},
  statLabel:{fontSize:'0.6rem',color:'#AAA',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'},
}
