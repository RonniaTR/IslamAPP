import React, { useState, useEffect } from 'react';
import { Award, Play, CheckCircle, XCircle, ArrowRight, RotateCw, Trophy } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function QuizPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/quiz/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const startQuiz = async (category) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/quiz/solo/start?user_id=${user?.user_id || 'guest'}&category=${category}&question_count=10`);
      setSession(data);
      setCurrentQ(0);
      setScore(0);
      setCorrectCount(0);
      setFinished(false);
      setSelectedAnswer(null);
      setResult(null);
    } catch { } finally { setLoading(false); }
  };

  const submitAnswer = async (answerIdx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIdx);
    try {
      const { data } = await api.post(`/quiz/solo/${session.session_id}/answer?question_index=${currentQ}&answer=${answerIdx}&time_taken=10`);
      setResult(data);
      setScore(prev => prev + data.points_earned);
      if (data.correct) setCorrectCount(prev => prev + 1);
    } catch { }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= session.questions.length) {
      api.post(`/quiz/solo/${session.session_id}/finish`).catch(() => {});
      setFinished(true);
      return;
    }
    setCurrentQ(prev => prev + 1);
    setSelectedAnswer(null);
    setResult(null);
  };

  const resetQuiz = () => {
    setSession(null);
    setFinished(false);
    setScore(0);
    setCorrectCount(0);
    setCurrentQ(0);
  };

  // Finished screen
  if (finished) {
    return (
      <div className="animate-fade-in px-5 pt-16 text-center" data-testid="quiz-result">
        <Trophy size={48} className="text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Tamamland\u0131!</h2>
        <p className="text-gray-400 mb-6">{session.questions.length} sorudan {correctCount} do\u011fru</p>
        <div className="glass rounded-2xl p-6 mb-6 mx-auto max-w-xs">
          <p className="text-4xl font-bold text-emerald-400">{score}</p>
          <p className="text-sm text-gray-500 mt-1">Toplam Puan</p>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(correctCount / session.questions.length) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">%{Math.round((correctCount / session.questions.length) * 100)} Ba\u015far\u0131</p>
        </div>
        <button onClick={resetQuiz} data-testid="quiz-restart-btn"
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium flex items-center gap-2 mx-auto">
          <RotateCw size={16} /> Yeni Quiz
        </button>
      </div>
    );
  }

  // Quiz game
  if (session) {
    const q = session.questions[currentQ];
    return (
      <div className="animate-fade-in px-4 pt-10" data-testid="quiz-game">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500">Soru {currentQ + 1}/{session.questions.length}</span>
          <span className="text-sm font-bold text-emerald-400">{score} puan</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / session.questions.length) * 100}%` }} />
        </div>
        <div className="glass rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-white leading-relaxed" data-testid="quiz-question">{q.question}</p>
        </div>
        <div className="space-y-2 mb-4">
          {q.options.map((opt, i) => {
            let style = 'bg-white/5 border-white/10 text-gray-300';
            if (selectedAnswer !== null) {
              if (i === result?.correct_answer) style = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
              else if (i === selectedAnswer && !result?.correct) style = 'bg-red-500/20 border-red-500/50 text-red-300';
            }
            return (
              <button key={i} onClick={() => submitAnswer(i)} disabled={selectedAnswer !== null}
                data-testid={`quiz-option-${i}`}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${style}`}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            );
          })}
        </div>
        {result && (
          <div className={`rounded-xl p-3 mb-4 text-sm ${result.correct ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`} data-testid="quiz-feedback">
            <div className="flex items-center gap-2 mb-1">
              {result.correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span className="font-semibold">{result.correct ? 'Do\u011fru!' : 'Yanl\u0131\u015f!'}</span>
              {result.points_earned > 0 && <span className="ml-auto text-xs">+{result.points_earned} puan</span>}
            </div>
            {result.explanation && <p className="text-xs text-gray-400 mt-1">{result.explanation}</p>}
          </div>
        )}
        {selectedAnswer !== null && (
          <button onClick={nextQuestion} data-testid="quiz-next-btn"
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium flex items-center justify-center gap-2">
            {currentQ + 1 >= session.questions.length ? 'Sonuçları Gör' : 'Sonraki Soru'}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    );
  }

  // Category selection
  return (
    <div className="animate-fade-in" data-testid="quiz-categories">
      <div className="bg-gradient-to-b from-rose-900/30 to-transparent px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Award size={24} className="text-rose-400" />
          <h1 className="text-xl font-bold text-white">\u0130slam Quiz</h1>
        </div>
        <p className="text-sm text-gray-400">Bilgini test et ve \u00f6\u011fren</p>
      </div>
      <div className="px-4 space-y-3 pb-6">
        {categories.map(c => (
          <button key={c.id} onClick={() => startQuiz(c.id)} disabled={loading}
            data-testid={`quiz-category-${c.id}`}
            className="w-full text-left glass rounded-xl p-4 transition-all hover:border-rose-500/20 active:scale-[0.98]">
            <p className="text-sm font-semibold text-white">{c.name}</p>
            <p className="text-xs text-gray-500 mt-1">{c.description}</p>
            <p className="text-xs text-gray-600 mt-1">{c.question_count} soru</p>
          </button>
        ))}
      </div>
    </div>
  );
}
