import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function ApiLogic() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Logique de l'API (Access Control)</h2>
      <p className="text-slate-600">
        Algorithme de vérification des droits d'accès lors de l'appel à <code>GET /api/simulations/:id/start</code>.
      </p>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono text-sm overflow-x-auto">
        <pre className="text-slate-700">
{`async function checkSimulationAccess(userId, simulationId) {
  // 1. Récupérer l'utilisateur, son abonnement et son portefeuille
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true, wallet: true }
  });

  // 2. Récupérer les prérequis de la simulation
  const simulation = await db.simulation.findUnique({
    where: { id: simulationId }
  });

  // 3. Vérification de l'abonnement Premium (Simulations récentes)
  if (simulation.requires_premium) {
    const isPremium = user.subscription?.status === 'ACTIVE' && 
                      user.subscription?.period_end > new Date();
    
    if (!isPremium) {
      throw new AccessDeniedError("Abonnement Premium requis.");
    }
  }

  // 4. Vérification des crédits (Pay-per-Correction / High-Precision)
  if (simulation.required_credits > 0) {
    if (user.wallet.correction_credits < simulation.required_credits) {
      throw new InsufficientCreditsError("Crédits insuffisants.");
    }
    
    // Déduire les crédits (Transaction atomique)
    await db.wallet.update({
      where: { id: user.wallet.id },
      data: { correction_credits: { decrement: simulation.required_credits } }
    });
  }

  // 5. Accès accordé, initialiser la tentative
  const attempt = await db.simulationAttempt.create({
    data: { user_id: userId, simulation_id: simulationId, status: 'IN_PROGRESS' }
  });

  return { success: true, attemptId: attempt.id };
}`}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center text-center">
          <Lock className="text-slate-400 mb-2" />
          <h4 className="font-semibold text-slate-800">1. Authentification</h4>
          <p className="text-xs text-slate-500 mt-1">Vérification du JWT et extraction du User ID.</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center text-center">
          <CheckCircle2 className="text-emerald-500 mb-2" />
          <h4 className="font-semibold text-slate-800">2. RBAC & Premium</h4>
          <p className="text-xs text-slate-500 mt-1">Validation du statut Stripe (ACTIVE) via Webhooks.</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center text-center">
          <ArrowRight className="text-indigo-500 mb-2" />
          <h4 className="font-semibold text-slate-800">3. Transaction</h4>
          <p className="text-xs text-slate-500 mt-1">Déduction des crédits et création de la session.</p>
        </div>
      </div>
    </div>
  );
}
