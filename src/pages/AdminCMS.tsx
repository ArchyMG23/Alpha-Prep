import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Question, TaskType, Level, TestType, PlanPrice, Simulation } from '../types';
import { Plus, Edit2, Trash2, X, Upload, FileText, Music, Video, Loader2, Key, Settings, Lock, ShieldCheck, Save, MessageSquare, CheckCircle2, GraduationCap, List, ArrowRight, Sparkles } from 'lucide-react';
import { parseExamDocument } from '../services/geminiService';

export default function AdminCMS() {
  const { 
    user, questions, simulations, prices, 
    setPrices, savePrices, generateAccessKey, 
    accessKeys, saveQuestion, deleteQuestion, 
    saveSimulation, deleteSimulation 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'SIMULATIONS'>('QUESTIONS');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isManagingPrices, setIsManagingPrices] = useState(false);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [keyType, setKeyType] = useState<'SUBSCRIPTION' | 'CREDITS'>('SUBSCRIPTION');
  const [adminCode, setAdminCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [detectedQuestions, setDetectedQuestions] = useState<Partial<Question>[]>([]);
  
  const [newQ, setNewQ] = useState<Partial<Question>>({
    testType: 'TCF',
    type: 'WRITING',
    level: 'B2',
    title: '',
    content: '',
    isPremium: false,
    isFullAccessOnly: false,
    requiredCredits: 1
  });

  const [newSim, setNewSim] = useState<Partial<Simulation>>({
    testType: 'TCF',
    title: '',
    description: '',
    level: 'B2',
    isPremium: true,
    requiredCredits: 2,
    questions: []
  });

  const handleOpenAdd = () => {
    if (activeTab === 'QUESTIONS') {
      setNewQ({
        testType: 'TCF',
        type: 'WRITING',
        level: 'B2',
        title: '',
        content: '',
        isPremium: false,
        isFullAccessOnly: false,
        requiredCredits: 1
      });
    } else {
      setNewSim({
        testType: 'TCF',
        title: '',
        description: '',
        level: 'B2',
        isPremium: true,
        requiredCredits: 2,
        questions: []
      });
    }
    setIsAdding(true);
    setEditingId(null);
  };

  const handleAdminAuth = () => {
    if (adminCode === '2026' || user?.role === 'ADMIN') {
      setIsAuthorized(true);
      setAdminCode('');
    } else {
      alert('Code Admin Incorrect');
    }
  };

  const handleSaveQuestion = async () => {
    if (!newQ.title || !newQ.content) return alert('Veuillez remplir le titre et le contenu.');
    
    const question: Question = {
      id: editingId || `q_${Date.now()}`,
      testType: newQ.testType as TestType,
      type: newQ.type as TaskType,
      level: newQ.level as Level,
      title: newQ.title,
      content: newQ.content,
      options: newQ.options,
      isPremium: newQ.isPremium || false,
      isFullAccessOnly: newQ.isFullAccessOnly || false,
      requiredCredits: newQ.requiredCredits || 0,
      sourceFile: newQ.sourceFile,
      createdAt: newQ.createdAt || new Date().toISOString()
    };

    await saveQuestion(question);
    setIsAdding(false);
    setEditingId(null);
    setSuccessMsg(editingId ? 'Question mise à jour !' : 'Nouvelle question créée !');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveSimulation = async () => {
    if (!newSim.title || !newSim.description) return alert('Remplissez le titre et la description.');
    if (!newSim.questions || newSim.questions.length === 0) return alert('Ajoutez au moins une question.');

    const simulation: Simulation = {
      id: editingId || `sim_${Date.now()}`,
      testType: newSim.testType as TestType,
      title: newSim.title,
      description: newSim.description,
      level: newSim.level as Level,
      questions: newSim.questions as Question[],
      isPremium: newSim.isPremium || false,
      requiredCredits: newSim.requiredCredits || 0,
      createdAt: newSim.createdAt || new Date().toISOString()
    };

    await saveSimulation(simulation);
    setIsAdding(false);
    setEditingId(null);
    setSuccessMsg(editingId ? 'Simulation mise à jour !' : 'Simulation créée !');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEditQuestion = (q: Question) => {
    setNewQ({ ...q });
    setEditingId(q.id);
    setIsAdding(true);
    setActiveTab('QUESTIONS');
  };

  const handleEditSimulation = (sim: Simulation) => {
    setNewSim({ ...sim });
    setEditingId(sim.id);
    setIsAdding(true);
    setActiveTab('SIMULATIONS');
  };

  const toggleQuestionInSim = (q: Question) => {
    setNewSim(prev => {
      const exists = prev.questions?.some(curr => curr.id === q.id);
      if (exists) {
        return { ...prev, questions: prev.questions?.filter(curr => curr.id !== q.id) };
      } else {
        return { ...prev, questions: [...(prev.questions || []), q] };
      }
    });
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-vh-[60vh] animate-in fade-in">
        <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-2xl w-full max-w-md text-center">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Lock size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Terminal Admin</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">Veuillez déclencher l'accès sécurisé pour modifier le contenu de la plateforme.</p>
          <input 
            type="password" 
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            placeholder="Code d'accès"
            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl mb-6 text-center font-black tracking-[0.3em] outline-none focus:border-indigo-500 shadow-inner"
          />
          <button 
            onClick={handleAdminAuth}
            className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest text-xs"
          >
            S'authentifier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Alpha <span className="text-indigo-600">CMS</span></h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Contrôle centralisé du contenu et de la monétisation.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex gap-1 mr-4">
            <button 
              onClick={() => setActiveTab('QUESTIONS')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'QUESTIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Modules
            </button>
            <button 
              onClick={() => setActiveTab('SIMULATIONS')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SIMULATIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Simulations
            </button>
          </div>
          <button onClick={() => setIsManagingPrices(!isManagingPrices)} className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all shadow-sm"><Settings size={24} /></button>
          <button onClick={() => setIsGeneratingKeys(!isGeneratingKeys)} className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all shadow-sm"><Key size={24} /></button>
          <button onClick={handleOpenAdd} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs"><Plus size={18} /> Nouveau</button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-6 rounded-3xl border border-emerald-100 font-black animate-in slide-in-from-top-4 flex items-center gap-4 text-sm shadow-sm scale-110 origin-left">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500 shrink-0">
            <ShieldCheck size={24} />
          </div>
          {successMsg}
        </div>
      )}

      {/* Main Table View */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'QUESTIONS' ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Examen</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Type / Titre</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Niveau</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Crédits</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {questions.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 font-black text-slate-900 text-sm">{q.testType}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{q.type}</span>
                      <span className="font-bold text-slate-700 line-clamp-1">{q.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">{q.level}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{q.requiredCredits}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditQuestion(q)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => deleteQuestion(q.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Examen</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Titre de Simulation</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Modules</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Credits</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {simulations.map(sim => (
                <tr key={sim.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 font-black text-slate-900 text-sm">{sim.testType}</td>
                  <td className="px-8 py-6">
                    <span className="font-bold text-slate-700 line-clamp-1">{sim.title}</span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-600 uppercase tracking-widest">{sim.questions.length} Modules</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{sim.requiredCredits}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditSimulation(sim)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => deleteSimulation(sim.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[48px] border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                  {activeTab === 'QUESTIONS' ? <Plus size={28} /> : <GraduationCap size={28} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{editingId ? 'Mettre à jour le contenu' : 'Nouveau contenu'}</h2>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Édition {activeTab}</p>
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-slate-100 rounded-2xl transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {activeTab === 'QUESTIONS' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <select 
                        value={newQ.testType} 
                        onChange={(e) => setNewQ({...newQ, testType: e.target.value as any})}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                      >
                        <option value="TCF">TCF Canada</option>
                        <option value="TEF">TEF Canada</option>
                        <option value="IELTS">IELTS</option>
                      </select>
                      <select 
                        value={newQ.type} 
                        onChange={(e) => setNewQ({...newQ, type: e.target.value as any})}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                      >
                        <option value="LISTENING">Listening</option>
                        <option value="READING">Reading</option>
                        <option value="WRITING">Writing</option>
                      </select>
                    </div>
                    <input 
                      type="text" 
                      value={newQ.title} 
                      onChange={(e) => setNewQ({...newQ, title: e.target.value})}
                      placeholder="Titre de l'exercice"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-lg outline-none"
                    />
                    <textarea 
                      value={newQ.content} 
                      onChange={(e) => setNewQ({...newQ, content: e.target.value})}
                      placeholder="Corps de l'exercice / Sujet..."
                      className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl font-medium text-sm outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Premium</span>
                        <input 
                          type="checkbox" 
                          checked={newQ.isPremium} 
                          onChange={(e) => setNewQ({...newQ, isPremium: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-2 border-indigo-600 text-indigo-600"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Crédits Correction</span>
                        <input 
                          type="number" 
                          value={newQ.requiredCredits} 
                          onChange={(e) => setNewQ({...newQ, requiredCredits: parseInt(e.target.value)})}
                          className="w-16 p-2 bg-white border border-slate-300 rounded-lg text-center font-black"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveQuestion}
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                      <Save size={20} /> Valider l'exercice
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Type d'examen</label>
                      <div className="flex gap-2">
                        {['TCF', 'TEF', 'IELTS'].map(t => (
                          <button 
                            key={t}
                            onClick={() => setNewSim({ ...newSim, testType: t as any })}
                            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${newSim.testType === t ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={newSim.title} 
                      onChange={(e) => setNewSim({...newSim, title: e.target.value})}
                      placeholder="Titre de la simulation"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl font-black text-2xl outline-none shadow-inner"
                    />
                    <textarea 
                       value={newSim.description} 
                       onChange={(e) => setNewSim({...newSim, description: e.target.value})}
                       placeholder="Longue description marketing..."
                       className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-3xl font-medium text-sm outline-none resize-none"
                    />
                    <button 
                      onClick={handleSaveSimulation}
                      className="w-full py-6 bg-indigo-600 text-white font-black rounded-[32px] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                    >
                      <Save size={24} /> Publier la simulation
                    </button>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[48px] border border-slate-200 flex flex-col h-[600px] shadow-inner">
                    <h3 className="text-xl font-black text-slate-900 mb-2 mt-2 tracking-tighter">Épreuves rattachées</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">Sélectionnez les modules disponibles.</p>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                       {questions.filter(q => q.testType === newSim.testType).map(q => {
                          const isSelected = newSim.questions?.some(curr => curr.id === q.id);
                          return (
                            <button
                              key={q.id}
                              onClick={() => toggleQuestionInSim(q)}
                              className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${isSelected ? 'border-indigo-600 bg-white shadow-xl' : 'border-transparent bg-white hover:border-slate-200'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                  {q.type === 'LISTENING' ? <Headphones size={20} /> : q.type === 'WRITING' ? <PenTool size={20} /> : <BookOpen size={20} />}
                                </div>
                                <div>
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-0.5">{q.type}</span>
                                  <span className="font-bold text-sm text-slate-700">{q.title}</span>
                                </div>
                              </div>
                              {isSelected ? <CheckCircle2 className="text-indigo-600" size={20} /> : <Plus className="text-slate-200 group-hover:text-slate-400" size={20} />}
                            </button>
                          );
                       })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
