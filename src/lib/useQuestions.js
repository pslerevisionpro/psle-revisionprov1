import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const SUBJECT_CONFIG = {
  science: {
    name: 'Science', standard: 6, filterBy: 'subject_area', optionsFormat: 'array',
    subjectAreas: ['Ecology','Conservation','Environment & Pollution','Solutions & Mixtures','Hard & Soft Water','Weather & Climate','Earth & Space','States of Matter','Elements & Compounds','Energy Concepts','Heat Transfer','Light','Sound','Acids & Alkalis','Forces & Friction','Levers & Machines','Electric Circuits','Lightning & Static','Energy Sources','Human Reproduction','Science & Technology','Science Careers','Science Skills','General Science'],
  },
  maths:       { name: 'Mathematics',    standard: 6, filterBy: 'subject', optionsFormat: 'columns' },
  english:     { name: 'English',        standard: 7, filterBy: 'subject', optionsFormat: 'columns' },
  setswana:    { name: 'Setswana',       standard: 7, filterBy: 'subject', optionsFormat: 'columns' },
  agriculture: { name: 'Agriculture',    standard: 7, filterBy: 'subject', optionsFormat: 'columns' },
  social:      { name: 'Social Studies', standard: 7, filterBy: 'subject', optionsFormat: 'columns' },
  rme:         { name: 'RME',            standard: 7, filterBy: 'subject', optionsFormat: 'columns' },
}

function convertQuestion(q, optionsFormat) {
  const letterToIndex = { A: 0, B: 1, C: 2, D: 3 }
  const options = optionsFormat === 'columns'
    ? [q.option_a, q.option_b, q.option_c, q.option_d]
    : (q.options || []).map(o => (typeof o === 'string' ? o : o.text))
  return {
    id: q.id, paper_id: q.paper_id, question: q.question_text, options,
    correct: letterToIndex[q.correct_answer] ?? 0,
    explanation: q.explanation || q.context_text || `The correct answer is ${q.correct_answer}.`,
    subject_area: q.subject_area, blooms_level: q.blooms_level,
    difficulty: q.difficulty, curriculum_code: q.curriculum_code,
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

export function useQuestions(subject, options = {}) {
  const { paperId, limit, difficulty, bloomsLevel } = options
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true); setError(null)
      const cfg = SUBJECT_CONFIG[subject]
      if (!cfg) { setQuestions([]); setLoading(false); return }

      let query = supabase
        .from('questions')
        .select('id,paper_id,question_text,options,option_a,option_b,option_c,option_d,correct_answer,context_text,explanation,subject_area,blooms_level,difficulty,curriculum_code')
        .eq('standard', cfg.standard)

      if (paperId) { query = query.eq('paper_id', paperId) }
      else if (cfg.filterBy === 'subject_area') { query = query.in('subject_area', cfg.subjectAreas) }
      else if (cfg.filterBy === 'subject')      { query = query.eq('subject', cfg.name) }

      if (difficulty)  query = query.eq('difficulty', difficulty)
      if (bloomsLevel) query = query.eq('blooms_level', bloomsLevel)

      const { data, error: err } = await query
      console.log('useQuestions debug:', subject, cfg.standard, cfg.name, 'rows:', data?.length, 'err:', err?.message)
      if (err) { setError(err.message); setLoading(false); return }
      console.log('MATHS DEBUG:', subject, cfg.standard, data?.length, err)

      const allQuestions = (data || []).map(q => convertQuestion(q, cfg.optionsFormat))
      if (allQuestions.length === 0) { setQuestions([]); setLoading(false); return }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setQuestions(shuffle(allQuestions).slice(0, limit || allQuestions.length)); setLoading(false); return }

      const { data: attempted } = await supabase.from('student_attempts').select('question_id').eq('student_id', session.user.id)
      const attemptedIds = new Set((attempted || []).map(a => a.question_id))
      const unseen = allQuestions.filter(q => !attemptedIds.has(q.id))
      const seen   = allQuestions.filter(q =>  attemptedIds.has(q.id))
      const target = limit || allQuestions.length

      let selected = []
      if (unseen.length >= target)      { selected = shuffle(unseen).slice(0, target) }
      else if (unseen.length > 0)       { selected = [...shuffle(unseen), ...shuffle(seen).slice(0, target - unseen.length)] }
      else                              { selected = shuffle(allQuestions).slice(0, target) }

      setQuestions(selected); setLoading(false)
    }
    fetchQuestions()
  }, [subject, paperId, limit, difficulty, bloomsLevel])

  return { questions, loading, error }
}
