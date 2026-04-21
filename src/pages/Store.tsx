import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TestType } from '../types';
import { Check, CreditCard, ShieldCheck, Lock, Globe, MessageSquare, Key, ArrowRight, Zap } from 'lucide-react';

export default function Store() {
  const { user, prices, useAccessKey } = useAppContext();
  const [selectedTest, setSelectedTest] = useState<TestType>('TCF');
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  if (!user) return null;

  const filteredPrices = prices.filter(p => p.testType === selectedTest);

  const handleActivateKey = async () => {
    const result = await useAccessKey(accessKeyInput.trim().toUpperCase());
    if (result.success) {
      setKeyStatus({ type: 'success', msg: result.message });
      setAccessKeyInput('');
    } else {
      setKeyStatus({ type: 'error', msg: result.message });
    }
    setTimeout(() => setKeyStatus(null), 5000);
  };

  const handleWhatsAppOrder = (planName: string, price: number) => {
    const message = `Bonjour Alpha Prep, je souhaite acheter le pack : ${planName} (${price} FCFA) pour le test ${selectedTest}.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/237654491319?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in relative pb-20">
      <div className="text-center max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Boutique Officielle</h1>
        <p className="text-slate-500 mt-4 text-lg md:text-xl font-medium">Achetez vos accès via WhatsApp et recevez votre clé d'activation instantanément.</p>
      </div>

      {/* Access Key Activation */}
      <div className="max-w-2xl mx-auto bg-indigo-900 p-6 md:p-8 rounded-3xl shadow-xl shadow-indigo-200 text-white mx-4 md:mx-auto">
        <h2 className="text-xl font-black mb-4 flex items-center gap-3">
          <Key className="text-indigo-300" /> Activer une clé d'accès
        </h2>
        <p className="text-indigo-300 text-xs mb-4 font-medium italic">Note : Les clés générées sont valables 7 jours avant activation.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            value={accessKeyInput}
            onChange={(e) => setAccessKeyInput(e.target.value)}
            placeholder="ENTREZ VOTRE CLÉ ICI"
            className="flex-1 px-6 py-4 bg-indigo-800 border border-indigo-700 rounded-2xl outline-none focus:border-white transition-all font-mono font-bold placeholder:text-indigo-400 text-sm"
          />
          <button 
            onClick={handleActivateKey}
            className="px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-lg text-sm"
          >
            Activer
          </button>
        </div>
        {keyStatus && (
          <p className={`mt-4 font-bold text-sm flex items-center gap-2 ${keyStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {keyStatus.type === 'success' ? <ShieldCheck size={16} /> : <Lock size={16} />}
            {keyStatus.msg}
          </p>
        )}
      </div>

      {/* Test Selection */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-4">
        {(['TCF', 'TEF', 'IELTS'] as TestType[]).map(test => (
          <button
            key={test}
            onClick={() => setSelectedTest(test)}
            className={`px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black transition-all text-sm md:text-base ${
              selectedTest === test 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' 
                : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            {test}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4">
        {filteredPrices.map(plan => (
          <div key={plan.id} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 transition-all flex flex-col hover:border-indigo-200 hover:shadow-2xl relative group overflow-hidden">
            {plan.durationDays > 0 && (
              <div className="absolute top-0 right-0 p-6">
                <span className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black italic shadow-sm group-hover:scale-110 transition-transform">
                  &alpha;
                </span>
              </div>
            )}
            
            <h3 className="text-2xl font-black text-slate-900 mb-1">{plan.durationDays > 0 ? `${plan.durationDays} Jours` : "Pack Recharge"}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-6">Accès {plan.accessLevel}</p>
            
            <div className="mb-8">
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{plan.priceXAF.toLocaleString()} <span className="text-base font-bold ml-1">FCFA</span></div>
            </div>
            
            <div className="space-y-4 mb-10 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <Check size={18} />
                </div>
                <span className="text-sm font-bold text-slate-600">{plan.durationDays > 0 ? `Pass ${selectedTest} Complet` : "Usage Libre"}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                  <Zap size={18} fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-black text-indigo-700">+{plan.creditAmount} Crédits IA</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">Correction High-Precision</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                  <Globe size={18} />
                </div>
                <span className="text-sm font-bold text-slate-500">Support WhatsApp</span>
              </div>
            </div>

            <button 
              onClick={() => handleWhatsAppOrder(`${plan.durationDays > 0 ? plan.durationDays + ' Jours' : 'Pack Recharge'} ${selectedTest}`, plan.priceXAF)}
              className="w-full py-5 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group/btn text-base"
            >
              <MessageSquare size={20} className="group-hover/btn:scale-110 transition-transform" /> Commander via WhatsApp
            </button>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-200 shadow-sm mx-4 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Besoin d'un accompagnement personnalisé ?</h2>
        <p className="text-slate-500 font-medium mb-10 max-w-2xl mx-auto">Nos experts sont disponibles pour vous guider dans votre préparation et répondre à toutes vos questions sur les tests TCF, TEF et IELTS.</p>
        <button 
          onClick={() => window.open('https://wa.me/237654491319', '_blank')}
          className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 mx-auto"
        >
          Contacter un expert <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
