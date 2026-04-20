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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4">
        {filteredPrices.map(plan => (
          <div key={plan.id} className="bg-white p-6 rounded-3xl border-2 border-slate-100 transition-all flex flex-col hover:border-indigo-200 hover:shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.durationDays} Jours</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Accès {plan.accessLevel}</p>
            <div className="text-2xl md:text-3xl font-black text-slate-900 mb-6">{plan.priceXAF.toLocaleString()} <span className="text-sm">FCFA</span></div>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-xs font-medium text-slate-600"><Check size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Accès {selectedTest}</li>
              <li className="flex items-start gap-2 text-xs font-medium text-slate-600"><Check size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {plan.accessLevel === 'FULL' ? 'Tous les exercices' : 'Exercices sélectionnés'}</li>
              <li className="flex items-start gap-2 text-xs font-medium text-slate-600"><Check size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Support WhatsApp 24/7</li>
            </ul>

            <button 
              onClick={() => handleWhatsAppOrder(`${plan.durationDays} Jours ${selectedTest}`, plan.priceXAF)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 text-sm"
            >
              <MessageSquare size={18} /> Commander
            </button>
          </div>
        ))}
      </div>

      {/* Credits Section */}
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm mx-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 md:mb-10 gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
              <Zap className="text-indigo-500" fill="currentColor" /> Crédits IA High-Precision
            </h2>
            <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Corrections chirurgicales valables 30 jours pour TOUS les tests.</p>
          </div>
          <div className="flex items-center gap-3 text-xs md:text-sm font-black text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-full border border-indigo-100 w-fit">
            <CreditCard size={18} /> Solde : {user.correctionCredits} crédits
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            { amount: 10, price: 5000, desc: "Pack Débutant" },
            { amount: 30, price: 12000, desc: "Pack Intensif" },
            { amount: 100, price: 35000, desc: "Pack Expert" },
          ].map((pack) => (
            <div key={pack.amount} className="p-6 md:p-8 rounded-3xl border-2 border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center">
              <div className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">{pack.desc}</div>
              <div className="text-4xl md:text-5xl font-black text-slate-900 mb-1 tracking-tighter">{pack.amount}</div>
              <div className="text-slate-500 text-[10px] font-black mb-6 md:mb-8 uppercase tracking-widest">Crédits</div>
              <div className="text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8">{pack.price.toLocaleString()} FCFA</div>
              
              <button 
                onClick={() => handleWhatsAppOrder(`Pack ${pack.amount} Crédits`, pack.price)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare size={18} /> Commander
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
