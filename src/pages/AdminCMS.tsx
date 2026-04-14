import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Question, TaskType, Level, TestType, PlanPrice } from '../types';
import { Plus, Edit2, Trash2, X, Upload, FileText, Music, Video, Loader2, Key, Settings, Lock, ShieldCheck, Save, MessageSquare } from 'lucide-react';

export default function AdminCMS() {
  const { questions, setQuestions, prices, setPrices, generateAccessKey, accessKeys } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingPrices, setIsManagingPrices] = useState(false);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
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

  const handleOpenAdd = () => {
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
    setIsAdding(true);
    setIsManagingPrices(false);
    setIsGeneratingKeys(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdminAuth = () => {
    if (adminCode === '2026') { // Simple code for demo
      setIsAuthorized(true);
      setAdminCode('');
    } else {
      alert('Code Admin Incorrect');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate AI conversion of file to exam format
    setTimeout(() => {
      const fileName = file.name;
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      let type: TaskType = 'READING';
      if (['mp3', 'wav', 'm4a'].includes(extension || '')) type = 'LISTENING';
      if (['mp4', 'mov'].includes(extension || '')) type = 'LISTENING';

      setNewQ({
        ...newQ,
        title: `Exercice importé : ${fileName}`,
        content: `[Contenu extrait du fichier ${fileName}]\n\nConsigne : Analysez le document et répondez aux questions suivantes...`,
        type,
        sourceFile: fileName
      });
      setIsUploading(false);
      setSuccessMsg(`Fichier ${fileName} converti avec succès !`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 2000);
  };

  const handleSaveQuestion = () => {
    if (!newQ.title || !newQ.content) return;
    const question: Question = {
      id: `q_${Date.now()}`,
      testType: newQ.testType as TestType,
      type: newQ.type as TaskType,
      level: newQ.level as Level,
      title: newQ.title,
      content: newQ.content,
      isPremium: newQ.isPremium || false,
      isFullAccessOnly: newQ.isFullAccessOnly || false,
      requiredCredits: newQ.requiredCredits || 0,
      sourceFile: newQ.sourceFile
    };
    setQuestions([question, ...questions]);
    setIsAdding(false);
    setSuccessMsg("Question ajoutée !");
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setPrices(prev => prev.map(p => p.id === id ? { ...p, priceXAF: newPrice } : p));
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Zone Sécurisée</h2>
          <p className="text-slate-500 mb-8 font-medium">Veuillez entrer le code administrateur pour accéder au CMS.</p>
          <input 
            type="password" 
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            placeholder="Code d'accès"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-center font-black tracking-widest outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleAdminAuth}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            Débloquer le CMS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Alpha CMS</h1>
          <p className="text-slate-500 mt-2 text-base md:text-lg font-medium">Gestion du contenu, des prix et des clés d'accès.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button onClick={() => setIsManagingPrices(!isManagingPrices)} className="p-3 md:p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm"><Settings size={20} /></button>
          <button onClick={() => setIsGeneratingKeys(!isGeneratingKeys)} className="p-3 md:p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm"><Key size={20} /></button>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 text-sm md:text-base"><Plus size={20} /> Nouveau</button>
        </div>
      </div>

      {successMsg && (
        <div className="mx-4 md:mx-0 bg-emerald-50 text-emerald-700 p-4 md:p-6 rounded-2xl border border-emerald-100 font-black animate-in slide-in-from-top-4 flex items-center gap-3 text-sm md:text-base">
          <ShieldCheck size={24} /> {successMsg}
        </div>
      )}

      {/* Price Management */}
      {isManagingPrices && (
        <div className="mx-4 md:mx-0 bg-white p-6 md:p-8 rounded-3xl border-2 border-indigo-100 shadow-xl animate-in zoom-in-95">
          <h2 className="text-lg md:text-xl font-black mb-6 flex items-center gap-2"><Settings size={20} /> Modifier les Tarifs (FCFA)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {prices.map(p => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.testType} - {p.durationDays} Jours</p>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={p.priceXAF}
                    onChange={(e) => handleUpdatePrice(p.id, parseInt(e.target.value) || 0)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-lg font-black text-indigo-600 text-sm"
                  />
                  <span className="text-[10px] font-bold text-slate-400">FCFA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Generation */}
      {isGeneratingKeys && (
        <div className="mx-4 md:mx-0 bg-indigo-900 p-6 md:p-8 rounded-3xl text-white shadow-xl animate-in zoom-in-95">
          <h2 className="text-lg md:text-xl font-black mb-6 flex items-center gap-2"><Key size={20} /> Générateur de Clés d'Accès</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <select id="keyTest" className="p-3 md:p-4 bg-indigo-800 border border-indigo-700 rounded-2xl font-bold outline-none text-sm">
              <option value="TCF">TCF</option>
              <option value="TEF">TEF</option>
              <option value="IELTS">IELTS</option>
            </select>
            <select id="keyDays" className="p-3 md:p-4 bg-indigo-800 border border-indigo-700 rounded-2xl font-bold outline-none text-sm">
              <option value="10">10 Jours</option>
              <option value="15">15 Jours</option>
              <option value="30">30 Jours</option>
              <option value="60">60 Jours</option>
            </select>
            <select id="keyLevel" className="p-3 md:p-4 bg-indigo-800 border border-indigo-700 rounded-2xl font-bold outline-none text-sm">
              <option value="BASIC">BASIC</option>
              <option value="FULL">FULL</option>
            </select>
            <button 
              onClick={() => {
                const t = (document.getElementById('keyTest') as HTMLSelectElement).value as TestType;
                const d = parseInt((document.getElementById('keyDays') as HTMLSelectElement).value);
                const l = (document.getElementById('keyLevel') as HTMLSelectElement).value as 'BASIC' | 'FULL';
                const key = generateAccessKey(t, d, l);
                setSuccessMsg(`Clé générée : ${key}`);
              }}
              className="p-3 md:p-4 bg-white text-indigo-900 font-black rounded-2xl hover:bg-indigo-50 transition-all text-sm"
            >
              Générer
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
            {accessKeys.slice().reverse().map((k, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-indigo-800/50 rounded-xl border border-indigo-700 gap-2">
                <span className="font-mono font-black text-indigo-200 text-sm">{k.key}</span>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{k.testType} - {k.durationDays}j - {k.accessLevel}</span>
                <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full w-fit ${k.isUsed ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {k.isUsed ? 'UTILISÉE' : 'VALIDE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {isAdding && (
        <div className="mx-4 md:mx-0 bg-white p-6 md:p-10 rounded-3xl border-2 border-indigo-100 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Ajouter une Simulation</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>

          {/* File Upload Module */}
          <div className="mb-8 md:mb-10 p-6 md:p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center text-center group hover:border-indigo-300 transition-all">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.rar,.mp3,.mp4,.wav" />
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-4 group-hover:text-indigo-600 transition-colors">
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={28} />}
            </div>
            <h3 className="font-black text-slate-900 mb-1 text-sm md:text-base">Importation Intelligente IA</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">Déposez un PDF, Audio ou Vidéo. Notre IA le convertira automatiquement en exercice conforme à l'examen.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2.5 md:px-6 md:py-3 bg-white border border-slate-200 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              {isUploading ? 'Conversion en cours...' : 'Sélectionner un fichier'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test</label>
              <select value={newQ.testType} onChange={e => setNewQ({...newQ, testType: e.target.value as TestType})} className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                <option value="TCF">TCF</option><option value="TEF">TEF</option><option value="IELTS">IELTS</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
              <select value={newQ.type} onChange={e => setNewQ({...newQ, type: e.target.value as TaskType})} className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                <option value="WRITING">Writing</option><option value="READING">Reading</option><option value="LISTENING">Listening</option><option value="METHODOLOGY">Methodology</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niveau</label>
              <select value={newQ.level} onChange={e => setNewQ({...newQ, level: e.target.value as Level})} className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                <option value="B1">B1</option><option value="B2">B2</option><option value="C1">C1</option><option value="C2">C2</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6 mb-8 md:mb-10">
            <input type="text" placeholder="Titre" value={newQ.title} onChange={e => setNewQ({...newQ, title: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" />
            <textarea rows={5} placeholder="Contenu" value={newQ.content} onChange={e => setNewQ({...newQ, content: e.target.value})} className="w-full p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-3xl font-medium text-sm" />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 md:px-8 md:py-4 text-slate-500 font-black uppercase tracking-widest text-xs md:text-sm">Annuler</button>
            <button onClick={handleSaveQuestion} className="px-8 py-3 md:px-10 md:py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl text-xs md:text-sm">Enregistrer</button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="mx-4 md:mx-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="p-4 md:p-6">Test</th><th className="p-4 md:p-6">Titre</th><th className="p-4 md:p-6">Type</th><th className="p-4 md:p-6 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.map(q => (
              <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 md:p-6"><span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] md:text-[10px] font-black tracking-widest">{q.testType}</span></td>
                <td className="p-4 md:p-6 font-bold text-slate-900 text-sm">{q.title} {q.sourceFile && <span className="text-[9px] md:text-[10px] text-indigo-400 ml-2">(Fichier)</span>}</td>
                <td className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.type}</td>
                <td className="p-4 md:p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
