import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Target, TrendingUp, Award, Clock, ArrowRight, PenTool, Globe, ShieldCheck, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard({ navigateTo }: { navigateTo: (tab: string) => void }) {
  const { user, attempts } = useAppContext();

  const chartData = useMemo(() => {
    if (!attempts || attempts.length === 0) return [];
    
    // Process last 10 attempts for the chart, sorted chronologically
    return [...attempts]
      .reverse()
      .slice(-10)
      .map((a, index) => ({
        name: new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        score: a.scoreCLB,
        attemptIndex: index + 1
      }));
  }, [attempts]);

  if (!user) return null;

  const activeSubs = user.subscriptions.filter(s => new Date(s.expiresAt) > new Date());

  const getLevelLabel = (score: number) => {
    if (score >= 9) return 'Avancé Supérieur';
    if (score >= 7) return 'Intermédiaire Avancé';
    if (score >= 5) return 'Intermédiaire';
    return 'Débutant';
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Tableau de <span className="text-indigo-600">Bord</span></h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Suivez votre progression vers le Canada.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {activeSubs.length > 0 ? (
            activeSubs.map(sub => {
              const daysLeft = Math.ceil((new Date(sub.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={sub.testType} className="flex flex-col items-end gap-1">
                  <span className="px-5 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl shadow-indigo-200 flex items-center gap-2 border border-indigo-400/20">
                    <ShieldCheck size={14} /> {sub.testType} • {sub.accessLevel}
                  </span>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    {daysLeft} jours restants
                  </span>
                </div>
              );
            })
          ) : (
            <button 
              onClick={() => navigateTo('store')}
              className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-slate-200 transition-colors border border-slate-200"
            >
              Abonnement Inactif
            </button>
          )}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
          <div className="flex items-center gap-4 text-indigo-600 mb-8 relative z-10">
            <div className="p-4 bg-indigo-50 rounded-2xl shadow-inner"><Target size={32} /></div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-1">Potentiel CRS</h3>
              <p className="font-black text-slate-900">Score Estimé</p>
            </div>
          </div>
          <div className="mt-auto relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{user.estimatedCRS}</span>
              <span className="text-sm text-slate-400 font-black uppercase tracking-widest">pts</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-6 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ width: `${(user.estimatedCRS / 1200) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
          <div className="flex items-center gap-4 text-emerald-600 mb-8 relative z-10">
            <div className="p-4 bg-emerald-50 rounded-2xl shadow-inner"><TrendingUp size={32} /></div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-1">Niveau Actuel</h3>
              <p className="font-black text-slate-900">{getLevelLabel(user.averageCLB)}</p>
            </div>
          </div>
          <div className="mt-auto relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{user.averageCLB.toFixed(1)}</span>
              <span className="text-sm text-slate-400 font-black uppercase tracking-widest">NCLC</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-6 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Objectif recommandé : 7.0+
            </p>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-slate-900/20 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-2xl group-hover:bg-indigo-600/30 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 text-indigo-400 mb-8">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm shadow-inner"><Award size={32} /></div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest text-white/50 mb-1">Correction IA</h3>
                <p className="font-black text-white">Crédits Alpha</p>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-6xl font-black text-white tracking-tighter">{user.correctionCredits}</span>
              {user.creditsExpireAt && (
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] mt-3">
                  Expire bientôt
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigateTo('store')}
            className="relative z-10 w-full mt-10 py-5 bg-white hover:bg-slate-50 text-slate-900 font-black rounded-3xl transition-all shadow-xl uppercase tracking-widest text-xs"
          >
            Acheter des crédits
          </button>
        </div>
      </div>

      {/* Progression Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[48px] border border-slate-200 shadow-sm p-10 group overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                <LineChartIcon className="text-indigo-600" /> Courbe de Progression
              </h3>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Évolution de vos performances CLB/Band</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-indigo-600 rounded-full" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernières sessions</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    ticks={[2, 4, 6, 8, 10]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      padding: '12px 16px'
                    }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <BarChart3 size={48} className="opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest italic">Données insuffisantes pour tracer la courbe</p>
                <button onClick={() => navigateTo('exam')} className="text-indigo-600 text-xs font-black underline">Passer un test maintenant</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0">
             <h3 className="text-xl font-black text-slate-900 tracking-tighter">Sessions</h3>
             <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{attempts.length} Total</span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {attempts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                <Clock size={40} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Aucun historique</p>
              </div>
            ) : (
              attempts.map((attempt, idx) => (
                <div 
                  key={attempt.id} 
                  className="p-5 rounded-[30px] bg-slate-50/50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group flex items-center justify-between"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:text-indigo-600 group-hover:scale-110 transition-all shrink-0">
                      <PenTool size={22} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight capitalize">Session #{attempt.questionId.substring(0,4)}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {new Date(attempt.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100">
                      {attempt.scoreCLB}
                    </span>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">NCLC</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-8 border-t border-slate-50 bg-slate-50/30">
            <button 
              onClick={() => navigateTo('exam')}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-xl"
            >
              C'est parti <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Next Step */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-[48px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-bottom-8">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
            <Award size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-indigo-900 tracking-tighter">Continuez sur votre lancée !</h3>
            <p className="text-indigo-600 font-bold max-w-md">Chaque simulation vous rapproche de vos objectifs. L'entraînement d'aujourd'hui définit le succès de demain.</p>
          </div>
        </div>
        <button 
          onClick={() => navigateTo('exam')}
          className="px-10 py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 uppercase tracking-widest text-xs flex items-center gap-3"
        >
          Lancer une Simulation <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
