import { useState } from 'react';
import { Play, CheckCircle, XCircle } from 'lucide-react';

export default function AccessSimulator() {
  const [isPremium, setIsPremium] = useState(false);
  const [credits, setCredits] = useState(0);
  const [simType, setSimType] = useState('free'); // free, premium, premium_correction
  
  const [result, setResult] = useState<{granted: boolean, message: string} | null>(null);

  const handleSimulate = () => {
    let requiresPremium = simType === 'premium' || simType === 'premium_correction';
    let requiredCredits = simType === 'premium_correction' ? 1 : 0;

    if (requiresPremium && !isPremium) {
      setResult({ granted: false, message: "Accès refusé : Abonnement Premium requis pour cette simulation récente." });
      return;
    }

    if (requiredCredits > 0 && credits < requiredCredits) {
      setResult({ granted: false, message: "Accès refusé : Crédits de correction insuffisants (1 requis)." });
      return;
    }

    if (requiredCredits > 0) {
      setCredits(c => c - requiredCredits);
      setResult({ granted: true, message: "Accès autorisé ! 1 crédit a été déduit de votre portefeuille." });
    } else {
      setResult({ granted: true, message: "Accès autorisé ! Démarrage de la simulation." });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Simulateur d'Accès (Playground)</h2>
      <p className="text-slate-600">Testez la logique de l'API en modifiant l'état de l'utilisateur.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User State */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">État de l'Utilisateur</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Abonnement Premium (Stripe)</span>
              <button 
                onClick={() => setIsPremium(!isPremium)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isPremium ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {isPremium ? 'Actif' : 'Inactif'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Crédits de Correction (Pay-per-Correction)</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setCredits(Math.max(0, credits - 1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">-</button>
                <span className="font-mono text-lg w-4 text-center">{credits}</span>
                <button onClick={() => setCredits(credits + 1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Request */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Requête de Simulation</h3>
          
          <div className="space-y-4">
            <label className="block">
              <span className="text-slate-700 font-medium mb-2 block">Type de Simulation</span>
              <select 
                value={simType} 
                onChange={(e) => setSimType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="free">Simulation Standard (Gratuite)</option>
                <option value="premium">Simulation Récente (&lt; 3 mois) - Premium</option>
                <option value="premium_correction">Simulation avec Correction IA Haute Précision (Premium + 1 Crédit)</option>
              </select>
            </label>

            <button 
              onClick={handleSimulate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Play size={18} />
              Vérifier l'accès (API Call)
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${result.granted ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {result.granted ? <CheckCircle className="mt-0.5 shrink-0" /> : <XCircle className="mt-0.5 shrink-0" />}
          <div>
            <h4 className="font-bold">{result.granted ? '200 OK - Accès Autorisé' : '403 Forbidden - Accès Refusé'}</h4>
            <p className="text-sm mt-1 opacity-90">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
