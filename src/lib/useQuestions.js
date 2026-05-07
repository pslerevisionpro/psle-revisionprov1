import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function convertQuestion(q) {
  const letterToIndex = { A: 0, B: 1, C: 2, D: 3 }
  const options = q.options.map(o => o.text)
  const correctIndex = letterToIndex[q.correct_answer] ?? 0
  return {
    id:              q.id,
    paper_id:        q.paper_id,
    question:        q.question_text,
    options,
    correct:         correctIndex,
    explanation:     q.explanation || q.context_text || `The correct answer is ${q.correct_answer}.`,
    subject_area:    q.subject_area,
    blooms_level:    q.blooms_level,
    difficulty:      q.difficulty,
    curriculum_code: q.curriculum_code,
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useQuestions(subject, options = {}) {
  const { paperId, limit, difficulty, bloomsLevel } = options
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const SUBJECT_MAP = {
    science: [
      'Ecology','Conservation','Environment & Pollution',
      'Solutions & Mixtures','Hard & Soft Water','Weather & Climate',
      'Earth & Space','States of Matter','Elements & Compounds',
      'Energy Concepts','Heat Transfer','Light','Sound',
      'Acids & Alkalis','Forces & Friction','Levers & Machines',
      'Electric Circuits','Lightning & Static','Energy Sources',
      'Human Reproduction','Science & Technology','Science Careers',
      'Science Skills','General Science'
    ],
    maths:       [],
    english:     [],
    setswana:    [],
    agriculture: [],
    social:      [],
    rme:         [],
  }

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true)
      setError(null)

      // Return empty for subjects with no questions yet
      if (!paperId && SUBJECT_MAP[subject] && SUBJECT_MAP[subject].length === 0) {
        setQuestions([])
        setLoading(false)
        return
      }

      // ── 1. Fetch ALL questions for this subject ──────────────
      let query = supabase
        .from('questions')
        .select('id,paper_id,question_text,options,correct_answer,context_text,explanation,subject_area,blooms_level,difficulty,curriculum_code')
        .eq('standard', 6)

      if (paperId) {
        query = query.eq('paper_id', paperId)
      } else if (SUBJECT_MAP[subject]?.length > 0) {
        query = query.in('subject_area', SUBJECT_MAP[subject])
      }

      if (difficulty)  query = query.eq('difficulty', difficulty)
      if (bloomsLevel) query = query.eq('blooms_level', bloomsLevel)

      const { data, error: err } = await query
      if (err) { setError(err.message); setLoading(false); return }

      const allQuestions = (data || []).map(convertQuestion)
      if (allQuestions.length === 0) { setQuestions([]); setLoading(false); return }

      // ── 2. Get current user session ──────────────────────────
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Guest — just shuffle and slice
        setQuestions(shuffle(allQuestions).slice(0, limit || allQuestions.length))
        setLoading(false)
        return
      }

      // ── 3. Fetch questions already attempted by this student ─
      const { data: attempted } = await supabase
        .from('student_attempts')
        .select('question_id')
        .eq('student_id', session.user.id)

      const attemptedIds = new Set((attempted || []).map(a => a.question_id))

      // ── 4. Split into unseen and seen ────────────────────────
      const unseen = allQuestions.filter(q => !attemptedIds.has(q.id))
      const seen   = allQuestions.filter(q =>  attemptedIds.has(q.id))

      // ── 5. Mastery-first selection ───────────────────────────
      const target = limit || allQuestions.length

      let selected = []

      if (unseen.length >= target) {
        // Enough unseen — shuffle unseen and take limit
        selected = shuffle(unseen).slice(0, target)
      } else if (unseen.length > 0) {
        // Some unseen — use all unseen, fill remainder from shuffled seen
        const needed = target - unseen.length
        selected = [...shuffle(unseen), ...shuffle(seen).slice(0, needed)]
      } else {
        // All seen — shuffle full bank and recycle
        selected = shuffle(allQuestions).slice(0, target)
      }

      setQuestions(selected)
      setLoading(false)
    }

    fetchQuestions()
  }, [subject, paperId, limit, difficulty, bloomsLevel])

  return { questions, loading, error }
}
