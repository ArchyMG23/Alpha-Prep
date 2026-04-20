import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Target, TrendingUp, Award, Clock, ArrowRight, PenTool, Globe, ShieldCheck } from 'lucide-react';

export default function Dashboard({ navigateTo }: { navigateTo: (tab: string) => void }) {
  const { user, attempts } = useAppContext();

  if (!user) return null;

  const activeSubs = user.subscriptions.filter(s => new Date(s.expiresAt) > new Date());

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Bonjour, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-2 text-base md:text-lg font-medium italic">"Le succès est la somme de petits efforts répétés jour après jour."</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {activeSubs.length > 0 ? (
            activeSubs.map(sub => {
              const daysLeft = Math.ceil((new Date(sub.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={sub.testType} className="flex flex-col items-end gap-1">
                  <span className="px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 text-white rounded-full text-[9px] md:text-[10px] font-black tracking-widest uppercase shadow-lg shadow-indigo-200 flex items-center gap-2">
                    <ShieldCheck size={14} /> {sub.testType} ({sub.accessLevel})
                  </span>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                  </span>
                </div>
              );
            })
          ) : (
            <span className="px-4 py-2 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black tracking-widest uppercase">
              Aucun accès actif
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
          <div className="flex items-center gap-4 text-indigo-600 mb-4 md:mb-6">
            <div className="p-3 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform"><Target size={28} /></div>
            <h3 className="font-bold text-lg">Score CRS</h3>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{user.estimatedCRS}</span>
              <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Points</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full mt-4 md:mt-6 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${(user.estimatedCRS / 1200) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
          <div className="flex items-center gap-4 text-emerald-600 mb-4 md:mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
            <h3 className="font-bold text-lg">Niveau NCLC</h3>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{user.averageCLB.toFixed(1)}</span>
              <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Moyen</span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-4 md:mt-6 uppercase tracking-widest">Objectif : NCLC 7+</p>
          </div>
        </div>

        <div className="bg-indigo-900 p-6 md:p-8 rounded-3xl shadow-xl shadow-indigo-900/20 flex flex-col justify-between relative overflow-hidden group sm:col-span-2 md:col-span-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-800 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 text-indigo-300 mb-4 md:mb-6">
              <div className="p-3 bg-indigo-800 rounded-2xl"><Award size={28} /></div>
              <h3 className="font-bold text-lg">Crédits IA</h3>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{user.correctionCredits}</span>
              {user.creditsExpireAt && (
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-2">
                  Expire le {new Date(user.creditsExpireAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigateTo('store')}
            className="relative z-10 w-full mt-6 md:mt-8 py-3 bg-white hover:bg-indigo-50 text-indigo-900 font-black rounded-2xl transition-all text-sm uppercase tracking-widest"
          >
            Recharger
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-black text-xl text-slate-900 tracking-tight">Activité Récente</h3>
          <button onClick={() => navigateTo('exam')} className="text-indigo-600 text-sm font-black uppercase tracking-widest hover:text-indigo-700 flex items-center gap-2 group w-fit">
            S'entraîner <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {attempts.length === 0 ? (
          <div className="p-10 md:p-16 text-center text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Clock size={32} className="text-slate-200" />
            </div>
            <p className="font-bold text-slate-500">Aucune simulation enregistrée.</p>
            <p className="text-sm mt-1">Commencez votre préparation dès aujourd'hui.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.map(attempt => (
              <div key={attempt.id} className="p-4 md:p-6 md:px-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <PenTool size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 truncate">Simulation #{attempt.questionId.substring(0,4)}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(attempt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-2">
                  <span className="px-3 py-1.5 md:px-4 md:py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs md:text-sm font-black tracking-tighter shadow-sm border border-emerald-100">
                    {attempt.scoreCLB}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
