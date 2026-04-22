import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Question, Attempt, TestType, TaskType, Simulation } from '../types';
import { CheckCircle2, AlertCircle, PenTool, BookOpen, Headphones, HelpCircle, ArrowLeft, Send, Sparkles, Lock, X, Play, ChevronRight, GraduationCap, ShieldCheck, Loader2 } from 'lucide-react';

export default function ExamMode() {
  const { user, questions, simulations, attempts, addAttempt, deductCredit } = useAppContext();
  const [selectedTest, setSelectedTest] = useState<TestType>('TCF');
  const [mode, setMode] = useState<'INDIVIDUAL' | 'SIMULATION'>('SIMULATION');
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [currentSimQuestionIdx, setCurrentSimQuestionIdx] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [text, setText] = useState('');
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ scoreCLB: number; feedback: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredQuestions = questions.filter(q => q.testType === selectedTest);
  const filteredSimulations = simulations.filter(s => s.testType === selectedTest);

  const hasSubscription = (test: TestType) => {
    if (!user) return false;
    const sub = user.subscriptions.find(s => s.testType === test);
    if (!sub) return false;
    return new Date(sub.expiresAt) > new Date();
  };

  const getAccessLevel = (test: TestType) => {
    if (!user) return null;
    return user.subscriptions.find(s => s.testType === test)?.accessLevel || null;
  };

  const startQuestion = (q: Question) => {
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
    if (q.type === 'WRITING' && !selectedSimulation) {
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

  const startSimulation = (sim: Simulation) => {
    const isSubscribed = hasSubscription(sim.testType);
    if (sim.isPremium && !isSubscribed) {
      setError(`Cette simulation complète nécessite un abonnement ${sim.testType}.`);
      return;
    }

    if (sim.requiredCredits > 0) {
      if (user && user.role !== 'ADMIN') {
        const success = deductCredit(sim.requiredCredits);
        if (!success) {
          setError(`Crédits insuffisants. Il vous faut ${sim.requiredCredits} crédits pour démarrer cette simulation complète.`);
          return;
        }
      }
    }

    setError(null);
    setSelectedSimulation(sim);
    setCurrentSimQuestionIdx(0);
    startQuestion(sim.questions[0]);
  };

  const submitExam = () => {
    if (!selectedQuestion || !user) return;

    if (selectedQuestion.type === 'WRITING') {
      if (text.trim().length < 10) {
        setError("Veuillez écrire au moins quelques mots.");
        return;
      }

      if (!selectedSimulation && selectedQuestion.requiredCredits > 0) {
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
      let correctCount = 0;
      const totalQuestions = 1; 
      
      const selectedOptId = mcqAnswers[selectedQuestion.id];
      const correctOpt = selectedQuestion.options?.find(o => o.isCorrect);
      
      if (selectedOptId === correctOpt?.id) {
        correctCount = 1;
      }

      const score = correctCount === totalQuestions ? 9 : 3;
      const feedback = correctCount === totalQuestions 
        ? "Excellent ! Vous avez parfaitement compris les nuances du support." 
        : `Analyse : La réponse correcte était "${correctOpt?.text}". Réexaminez les indices dans le texte pour progresser.`;
      
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

  const nextSimulationStep = () => {
    if (!selectedSimulation) return;
    const nextIdx = currentSimQuestionIdx + 1;
    if (nextIdx < selectedSimulation.questions.length) {
      setCurrentSimQuestionIdx(nextIdx);
      startQuestion(selectedSimulation.questions[nextIdx]);
    } else {
      setSelectedSimulation(null);
      setSelectedQuestion(null);
      setResult(null);
    }
  };

  if (selectedQuestion) {
    return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => { setSelectedQuestion(null); setSelectedSimulation(null); }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
          >
            <ArrowLeft size={20} /> Quitter
          </button>
          {selectedSimulation && (
            <div className="px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Module {currentSimQuestionIdx + 1} sur {selectedSimulation.questions.length}
              </span>
            </div>
          )}
        </div>

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
                <h3 className="text-3xl font-black text-slate-900 mb-2">Correction terminée</h3>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> Session enregistrée dans votre historique
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 text-left">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ma Zone de Travail</h4>
                    <div className="text-slate-700 italic text-sm line-clamp-6">
                      {selectedQuestion.type === 'WRITING' ? (
                        <p>{text}</p>
                      ) : (
                        <p>Sélection : {selectedQuestion.options?.find(o => o.id === mcqAnswers[selectedQuestion.id])?.text || "Aucune réponse"}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Ma Zone de Correction</h4>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">Niveau estimé</span>
                      <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full font-black text-lg shadow-lg shadow-indigo-200">
                        {selectedQuestion.testType === 'IELTS' ? `Band ${result.scoreCLB}` : `NCLC ${result.scoreCLB}`}
                      </span>
                    </div>
                    <p className="text-indigo-900 leading-relaxed font-bold text-sm">
                      {result.feedback}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button 
                    onClick={selectedSimulation ? nextSimulationStep : () => setSelectedQuestion(null)}
                    className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                  >
                    {selectedSimulation && currentSimQuestionIdx < selectedSimulation.questions.length - 1 ? (
                      <>Module suivant <ChevronRight size={20} /></>
                    ) : (
                      "Terminer la simulation"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="prose prose-slate max-w-none">
                  <div className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedQuestion.type === 'LISTENING' && selectedQuestion.content.includes('http') && (
                      <div className="mb-6 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Headphones size={14} /> Contenu de l'écoute
                        </p>
                        <audio controls className="w-full" src={selectedQuestion.content.match(/https?:\/\/[^\s]+/)?.[0]}>
                          Navigateur non compatible audio.
                        </audio>
                      </div>
                    )}
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
                      placeholder="Tapez votre réponse ici..."
                      className="w-full h-80 p-8 bg-slate-50 border border-slate-200 rounded-[32px] outline-none focus:border-indigo-500 transition-all font-medium text-slate-800 shadow-inner resize-none"
                    />
                    <div className="flex justify-between items-center px-4">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {text.trim().split(/\s+/).filter(Boolean).length} mots rédigés
                      </span>
                      <button 
                        onClick={submitExam}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Valider ce module</>}
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
                          disabled={result !== null}
                          onClick={() => setMcqAnswers({ ...mcqAnswers, [selectedQuestion.id]: opt.id })}
                          className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            result 
                              ? opt.isCorrect 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                                : mcqAnswers[selectedQuestion.id] === opt.id 
                                  ? 'border-rose-500 bg-rose-50 text-rose-900' 
                                  : 'border-slate-100 opacity-50'
                              : mcqAnswers[selectedQuestion.id] === opt.id 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                                : 'border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black">
                              {opt.id.toUpperCase()}
                            </span>
                            <span className="font-bold">{opt.text}</span>
                          </div>
                          {result && opt.isCorrect && <CheckCircle2 size={20} className="text-emerald-600" />}
                          {result && !opt.isCorrect && mcqAnswers[selectedQuestion.id] === opt.id && <X size={20} className="text-rose-600" />}
                          {!result && mcqAnswers[selectedQuestion.id] === opt.id && <CheckCircle2 size={20} className="text-indigo-600" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-slate-400 text-center italic py-4 font-mono">Module en cours de configuration...</p>
                    )}
                    
                    {!result && (selectedQuestion.options || selectedQuestion.type === 'LISTENING') && (
                      <button 
                        onClick={submitExam}
                        className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl mt-8 shadow-xl shadow-indigo-200 uppercase tracking-widest text-sm"
                      >
                        Valider mes choix
                      </button>
                    )}
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Entraînement Alpha <span className="text-indigo-600">Premium</span></h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Accédez aux sessions d'examens complets et aux exercices spécifiques.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner h-fit">
          {(['TCF', 'TEF', 'IELTS'] as TestType[]).map(test => (
            <button
              key={test}
              onClick={() => setSelectedTest(test)}
              className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${
                selectedTest === test ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {test}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-slate-50 p-2 rounded-[28px] flex gap-2 border border-slate-200">
          <button 
            onClick={() => setMode('SIMULATION')}
            className={`px-10 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${mode === 'SIMULATION' ? 'bg-white text-slate-900 shadow-xl border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles size={16} className={mode === 'SIMULATION' ? "text-amber-400" : ""} /> Examens Blancs
          </button>
          <button 
            onClick={() => setMode('INDIVIDUAL')}
            className={`px-10 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${mode === 'INDIVIDUAL' ? 'bg-white text-slate-900 shadow-xl border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen size={16} className={mode === 'INDIVIDUAL' ? "text-indigo-400" : ""} /> Exercices Libres
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-6 rounded-[32px] flex items-center gap-4 border border-rose-100 animate-in shake">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100 text-rose-500">
            <AlertCircle size={24} />
          </div>
          <p className="font-black text-sm">{error}</p>
        </div>
      )}

      {mode === 'SIMULATION' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {filteredSimulations.length > 0 ? filteredSimulations.map(sim => (
            <div key={sim.id} className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[30px] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <GraduationCap size={40} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Niveau {sim.level}</span>
                  <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    Officiel • {sim.questions.length} Modules
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter leading-none">{sim.title}</h3>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">{sim.description}</p>
              
              <div className="mt-auto pt-10 border-t border-slate-100 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Préparation</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Disponible</span>
                  </div>
                </div>
                <button 
                  onClick={() => startSimulation(sim)}
                  className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest text-xs"
                >
                  <Play size={20} fill="currentColor" /> Lancer l'examen
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-32 bg-slate-50 rounded-[60px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center text-slate-300">
                <HelpCircle size={40} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Contenu en cours de déploiement</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredQuestions.map(q => {
            const isSubscribed = hasSubscription(q.testType);
            const accessLevel = getAccessLevel(q.testType);
            const isLocked = (q.isPremium && !isSubscribed) || (q.isFullAccessOnly && accessLevel !== 'FULL');
            const attemptCount = attempts.filter(a => a.questionId === q.id).length;

            return (
              <div 
                key={q.id} 
                className={`bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col group relative overflow-hidden ${isLocked ? 'opacity-75' : ''}`}
              >
                {isLocked && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-10 text-center">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl text-slate-900 mb-4 scale-110">
                      <Lock size={32} />
                    </div>
                    <p className="font-black text-slate-900 text-xs uppercase tracking-[0.2em] leading-relaxed">Inclus dans le Pass<br/><span className="text-indigo-600 underline">Alpha Pro</span></p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    q.type === 'WRITING' ? 'bg-indigo-50 text-indigo-600' : 
                    q.type === 'READING' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {q.type === 'WRITING' ? <PenTool size={28} /> : q.type === 'LISTENING' ? <Headphones size={28} /> : <BookOpen size={28} />}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Module {q.type}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tighter group-hover:text-indigo-600 transition-colors line-clamp-1">{q.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 md:h-12 font-medium leading-relaxed">{q.content}</p>
                
                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'accès</span>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                      {q.requiredCredits > 0 ? <><Sparkles size={10} /> {q.requiredCredits} Crédit</> : '✓ Accès Libre'}
                    </span>
                  </div>
                  <button 
                    onClick={() => startQuestion(q)} 
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-[18px] transition-all uppercase tracking-widest shadow-xl shadow-slate-100"
                  >
                    Pratiquer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
