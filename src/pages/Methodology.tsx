import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TestType, TaskType } from '../types';
import { BookOpen, PenTool, Headphones, MessageSquare, Globe, ChevronRight, Lock, Sparkles } from 'lucide-react';

export default function Methodology() {
  const { user, questions } = useAppContext();
  const [selectedTest, setSelectedTest] = useState<TestType>('TCF');

  const methodologyQuestions = questions.filter(q => q.testType === selectedTest && q.type === 'METHODOLOGY');

  const categories = [
    { id: 'WRITING', label: 'Expression Écrite', icon: PenTool, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'READING', label: 'Compréhension Écrite', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'LISTENING', label: 'Compréhension Orale', icon: Headphones, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'SPEAKING', label: 'Expression Orale', icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const hasFullAccess = (test: TestType) => {
    const sub = user.subscriptions.find(s => s.testType === test);
    return sub?.accessLevel === 'FULL' && new Date(sub.expiresAt) > new Date();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Méthodologie de Travail</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Maîtrisez les stratégies gagnantes pour chaque module.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {(['TCF', 'TEF', 'IELTS'] as TestType[]).map(test => (
            <button
              key={test}
              onClick={() => setSelectedTest(test)}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                selectedTest === test ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {test}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map(cat => {
          const items = methodologyQuestions.filter(q => q.title.toLowerCase().includes(cat.label.toLowerCase()) || q.content.toLowerCase().includes(cat.label.toLowerCase()));
          const isLocked = !hasFullAccess(selectedTest);

          return (
            <div key={cat.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className={`p-6 ${cat.bg} border-b border-slate-100 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-white rounded-2xl shadow-sm ${cat.color}`}>
                    <cat.icon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{cat.label}</h3>
                </div>
                {isLocked && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
                    <Lock size={10} /> Full Access
                  </span>
                )}
              </div>

              <div className="p-6 space-y-4 flex-1">
                {items.length > 0 ? (
                  items.map(item => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className={`p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-between ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                        <div>
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">{item.content}</p>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    <p className="text-sm font-bold italic">Bientôt disponible pour {selectedTest}</p>
                  </div>
                )}
              </div>

              {isLocked && (
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Débloquez l'accès complet pour consulter ces guides
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* General Tips Section */}
      <div className="bg-indigo-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-800 rounded-full opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-3xl font-black mb-4 tracking-tight flex items-center gap-3">
              <Sparkles className="text-indigo-300" /> Conseils d'Experts
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-800 rounded-lg flex items-center justify-center shrink-0 font-black text-indigo-300">1</div>
                <p className="font-medium text-indigo-100">Pratiquez quotidiennement au moins 30 minutes sur chaque module.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-800 rounded-lg flex items-center justify-center shrink-0 font-black text-indigo-300">2</div>
                <p className="font-medium text-indigo-100">Écoutez des podcasts en français/anglais pour habituer votre oreille aux différents accents.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-800 rounded-lg flex items-center justify-center shrink-0 font-black text-indigo-300">3</div>
                <p className="font-medium text-indigo-100">Utilisez notre simulateur IA pour corriger vos fautes récurrentes.</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
            <h4 className="font-black mb-4 uppercase tracking-widest text-xs text-indigo-200">Ressources Externes</h4>
            <ul className="space-y-4">
              <li className="flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-bold">TV5 Monde TCF</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </li>
              <li className="flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-bold">RFI Savoirs</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </li>
              <li className="flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-bold">IELTS British Council</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
