import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// Converts DB format → Quiz.jsx format
function convertQuestion(q) {
  const letterToIndex = { A: 0, B: 1, C: 2, D: 3 }
  const options = q.options.map(o => o.text)
  const correct = letterToIndex[q.correct_answer] ?? 0
  return {
    id:          q.id,
    question:    q.question_text,
    options,
    correct,
    explanation: q.explanation || `The correct answer is ${q.correct_answer}.`,
    subject_area:    q.subject_area,
    blooms_level:    q.blooms_level,
    difficulty:      q.difficulty,
    curriculum_code: q.curriculum_code,
  }
}

export function useQuestions(subject, options = {}) {
  const { paperId, limit, difficulty, bloomsLevel } = options
  const [questions, setQuestions]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      setError(null)

      // Map app subject slug → DB subject_area values
      const SUBJECT_MAP = {
        science:     ['Ecology','Conservation','Environment & Pollution',
                      'Solutions & Mixtures','Hard & Soft Water','Weather & Climate',
                      'Earth & Space','States of Matter','Elements & Compounds',
                      'Energy Concepts','Heat Transfer','Light','Sound',
                      'Acids & Alkalis','Forces & Friction','Levers & Machines',
                      'Electric Circuits','Lightning & Static','Energy Sources',
                      'Human Reproduction','Science & Technology','Science Careers',
                      'Science Skills','General Science'],
      }

      let query = supabase
        .from('questions')
        .select('id,question_text,options,correct_answer,context_text,explanation,subject_area,blooms_level,difficulty,curriculum_code')
        .eq('standard', 6)

      // Filter by paper or subject area
      if (paperId) {
        query = query.eq('paper_id', paperId)
      } else if (SUBJECT_MAP[subject]) {
        query = query.in('subject_area', SUBJECT_MAP[subject])
      }

      if (difficulty)   query = query.eq('difficulty', difficulty)
      if (bloomsLevel)  query = query.eq('blooms_level', bloomsLevel)
      if (limit)        query = query.limit(limit)

      const { data, error: err } = await query
      if (err) { setError(err.message); setLoading(false); return }

      setQuestions((data || []).map(convertQuestion))
      setLoading(false)
    }
    fetch()
  }, [subject, paperId, limit, difficulty, bloomsLevel])

  return { questions, loading, error }
}
