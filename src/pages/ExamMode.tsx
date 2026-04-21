import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Question, Attempt, TestType, TaskType } from '../types';
import { CheckCircle2, AlertCircle, PenTool, BookOpen, Headphones, HelpCircle, ArrowLeft, Send, Sparkles, Lock } from 'lucide-react';

export default function ExamMode() {
  const { user, questions, attempts, addAttempt, deductCredit } = useAppContext();
  const [selectedTest, setSelectedTest] = useState<TestType>('TCF');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [text, setText] = useState('');
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ scoreCLB: number; feedback: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredQuestions = questions.filter(q => q.testType === selectedTest);

  const hasSubscription = (test: TestType) => {
    const sub = user.subscriptions.find(s => s.testType === test);
    if (!sub) return false;
    return new Date(sub.expiresAt) > new Date();
  };

  const getAccessLevel = (test: TestType) => {
    return user.subscriptions.find(s => s.testType === test)?.accessLevel || null;
  };

  const startExam = (q: Question) => {
    const sub = user.subscriptions.find(s => s.testType === q.testType);
    const isSubscribed = hasSubscription(q.testType);
    const accessLevel = getAccessLevel(q.testType);

    if (q.isPremium && !isSubscribed) {
      setError(`Cette simulation nécessite un abonnement ${q.testType}.`);
      return;
    }

    if (q.isFullAccessOnly && accessLevel !== 'FULL') {
      setError("Cet exercice est réservé aux abonnements de 1 ou 2 mois (Accès Complet).");
      return;
    }

    // Check attempt limit for writing
    if (q.type === 'WRITING') {
      const previousAttempts = attempts.filter(a => a.questionId === q.id);
      if (previousAttempts.length >= 1) {
        setError("Vous avez déjà utilisé votre essai unique pour cet exercice d'expression écrite.");
        return;
      }
    }

    setError(null);
    setSelectedQuestion(q);
    setText('');
    setMcqAnswers({});
    setResult(null);
  };

  const submitExam = () => {
    if (!selectedQuestion) return;

    if (selectedQuestion.type === 'WRITING') {
      if (text.trim().length < 10) {
        setError("Veuillez écrire au moins quelques mots.");
        return;
      }

      if (selectedQuestion.requiredCredits > 0) {
        const success = deductCredit(selectedQuestion.requiredCredits);
        if (!success) {
          setError(`Crédits insuffisants. Il vous faut ${selectedQuestion.requiredCredits} crédit(s).`);
          return;
        }
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const score = Math.floor(Math.random() * 4) + 6; // Random 6-9
        const feedback = "Votre structure est bonne, mais attention à la concordance des temps et au vocabulaire spécifique.";
        
        addAttempt({
          id: `att_${Date.now()}`,
          userId: user.id,
          questionId: selectedQuestion.id,
          date: new Date().toISOString(),
          scoreCLB: score,
          feedback,
          userAnswer: text
        });

        setResult({ scoreCLB: score, feedback });
        setIsSubmitting(false);
      }, 2000);
    } else if (selectedQuestion.type === 'READING' || selectedQuestion.type === 'LISTENING') {
      // Simple MCQ scoring
      const score = 8; // Mock score
      const feedback = "Excellent travail sur cette compréhension.";
      
      addAttempt({
        id: `att_${Date.now()}`,
        userId: user.id,
        questionId: selectedQuestion.id,
        date: new Date().toISOString(),
        scoreCLB: score,
        feedback,
        mcqAnswers
      });

      setResult({ scoreCLB: score, feedback });
    }
  };

  if (selectedQuestion) {
    return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedQuestion(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Retour au catalogue
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-black tracking-widest uppercase shadow-lg shadow-indigo-200">
                {selectedQuestion.type} - {selectedQuestion.testType}
              </span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Niveau {selectedQuestion.level}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedQuestion.title}</h2>
          </div>

          <div className="p-8">
            {result ? (
              <div className="text-center py-10 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Analyse Terminée</h3>
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 mb-8 text-left max-w-lg mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Score Prédictif</span>
                    <span className="px-5 py-2 bg-indigo-600 text-white rounded-full font-black text-xl shadow-lg shadow-indigo-200">
                      {selectedQuestion.testType === 'IELTS' ? `Band ${result.scoreCLB}` : `NCLC ${result.scoreCLB}`}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium italic">"{result.feedback}"</p>
                </div>
                <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all"
                >
                  Terminer la session
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="prose prose-slate max-w-none">
                  <div className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {/* Render audio if it's a listening task and contains a URL */}
                    {selectedQuestion.type === 'LISTENING' && selectedQuestion.content.includes('http') && (
                      <div className="mb-6 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Headphones size={14} /> Contenu Audio
                        </p>
                        <audio 
                          controls 
                          className="w-full" 
                          src={selectedQuestion.content.match(/https?:\/\/[^\s]+/)?.[0]}
                        >
                          Votre navigateur ne supporte pas l'élément audio.
                        </audio>
                      </div>
                    )}
                    {/* Filter out the URL from the text if displayed in the player */}
                    {selectedQuestion.content.split('\n').map((line, i) => {
                      if (line.toLowerCase().startsWith('audio:')) return null;
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                </div>

                {selectedQuestion.type === 'WRITING' && (
                  <div className="space-y-4">
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Rédigez votre réponse ici..."
                      className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-800 shadow-inner"
                    />
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {text.trim().split(/\s+/).filter(Boolean).length} mots
                      </span>
                      <button 
                        onClick={submitExam}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Envoyer pour correction IA</>}
                      </button>
                    </div>
                  </div>
                )}

                {(selectedQuestion.type === 'READING' || selectedQuestion.type === 'LISTENING') && (
                  <div className="space-y-4">
                    {selectedQuestion.options ? (
                      selectedQuestion.options.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setMcqAnswers({ ...mcqAnswers, [selectedQuestion.id]: opt.id })}
                          className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            mcqAnswers[selectedQuestion.id] === opt.id 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-bold">{opt.text}</span>
                          {mcqAnswers[selectedQuestion.id] === opt.id && <CheckCircle2 size={20} className="text-indigo-600" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-slate-400 text-center italic py-4">Simulation en cours de développement...</p>
                    )}
                    
                    {(selectedQuestion.options || selectedQuestion.type === 'LISTENING') && (
                      <button 
                        onClick={submitExam}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl mt-8 shadow-xl shadow-indigo-200"
                      >
                        Valider mes réponses
                      </button>
                    )}
                  </div>
                )}

                {selectedQuestion.type === 'METHODOLOGY' && (
                  <div className="space-y-6">
                    <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 shadow-inner">
                      <h4 className="text-indigo-900 font-black mb-6 flex items-center gap-3 uppercase tracking-[0.2em] text-xs">
                        <Sparkles size={20} className="text-indigo-500" /> Guide Méthodologique Officiel
                      </h4>
                      <div className="text-indigo-800 leading-relaxed font-semibold italic p-4 bg-white/50 rounded-2xl border border-white/50">
                        {selectedQuestion.methodologyContent || "Contenu méthodologique à venir."}
                      </div>
                    </div>
                    
                    <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                      <h4 className="text-slate-400 font-black mb-4 uppercase tracking-widest text-[10px]">Points Clés</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm text-slate-600 font-medium"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" /> Comprendre la structure</li>
                        <li className="flex items-start gap-2 text-sm text-slate-600 font-medium"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" /> Gestion du temps</li>
                        <li className="flex items-start gap-2 text-sm text-slate-600 font-medium"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" /> Critères de notation</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Simulations d'Examen</h1>
          <p className="text-slate-500 mt-2 text-base md:text-lg font-medium">Pratiquez en conditions réelles avec correction instantanée.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
          {(['TCF', 'TEF', 'IELTS'] as TestType[]).map(test => (
            <button
              key={test}
              onClick={() => setSelectedTest(test)}
              className={`px-4 py-2 md:px-6 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${
                selectedTest === test ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {test}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 md:mx-0 bg-rose-50 text-rose-700 p-4 md:p-6 rounded-2xl flex items-center gap-4 border border-rose-100 animate-in shake duration-500">
          <AlertCircle size={24} className="shrink-0" />
          <p className="font-black text-sm md:text-base">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-4 md:px-0">
        {filteredQuestions.map(q => {
          const isSubscribed = hasSubscription(q.testType);
          const accessLevel = getAccessLevel(q.testType);
          const isLocked = (q.isPremium && !isSubscribed) || (q.isFullAccessOnly && accessLevel !== 'FULL');
          const attemptCount = attempts.filter(a => a.questionId === q.id).length;

          return (
            <div 
              key={q.id} 
              className={`bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col group relative overflow-hidden ${isLocked ? 'opacity-75' : ''}`}
            >
              {isLocked && (
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="bg-white/90 p-3 rounded-2xl shadow-xl">
                    <Lock size={24} className="text-slate-400" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className={`p-3 rounded-2xl ${
                  q.type === 'WRITING' ? 'bg-indigo-50 text-indigo-600' : 
                  q.type === 'READING' ? 'bg-emerald-50 text-emerald-600' : 
                  q.type === 'METHODOLOGY' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                }`}>
                  {q.type === 'WRITING' ? <PenTool size={24} /> : 
                   q.type === 'READING' ? <BookOpen size={24} /> : 
                   q.type === 'METHODOLOGY' ? <Sparkles size={24} /> : <HelpCircle size={24} />}
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Niveau {q.level}</span>
              </div>

              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{q.title}</h3>
              <p className="text-slate-500 text-xs md:text-sm line-clamp-2 mb-6 md:mb-8 font-medium">{q.content}</p>
              
              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {q.requiredCredits > 0 ? `${q.requiredCredits} Crédit` : 'Gratuit'}
                  </span>
                  {q.type === 'WRITING' && (
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${attemptCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {attemptCount > 0 ? 'Essai utilisé' : '1 Essai disponible'}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => startExam(q)}
                  className="px-4 py-2 md:px-6 md:py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] md:text-xs font-black rounded-xl transition-all uppercase tracking-widest"
                >
                  {q.type === 'METHODOLOGY' ? 'Consulter' : 'Démarrer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
