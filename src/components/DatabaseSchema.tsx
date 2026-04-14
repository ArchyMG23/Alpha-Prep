import { Database, Key, CreditCard, FileText, Activity, ShieldCheck } from 'lucide-react';

export default function DatabaseSchema() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Modèle de Données (Database Schema)</h2>
      <p className="text-slate-600">
        Structure relationnelle liant les utilisateurs, les abonnements Stripe, et la banque de questions (CMS).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User & Auth */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-indigo-600">
            <ShieldCheck size={20} />
            <h3 className="font-semibold text-lg">User</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 font-mono">
            <li><span className="text-indigo-500 font-bold">id</span>: UUID (PK)</li>
            <li>email: String</li>
            <li>role: ENUM(STUDENT, ADMIN, CREATOR)</li>
            <li>stripe_customer_id: String</li>
            <li>created_at: DateTime</li>
          </ul>
        </div>

        {/* Subscription */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-600">
            <CreditCard size={20} />
            <h3 className="font-semibold text-lg">Subscription</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 font-mono">
            <li><span className="text-emerald-500 font-bold">id</span>: UUID (PK)</li>
            <li>user_id: UUID (FK)</li>
            <li>stripe_sub_id: String</li>
            <li>plan: ENUM(FREE, PRO_MONTHLY)</li>
            <li>status: ENUM(ACTIVE, CANCELED)</li>
            <li>period_end: DateTime</li>
          </ul>
        </div>

        {/* Wallet / Credits */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-600">
            <Database size={20} />
            <h3 className="font-semibold text-lg">Wallet (Credits)</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 font-mono">
            <li><span className="text-amber-500 font-bold">id</span>: UUID (PK)</li>
            <li>user_id: UUID (FK)</li>
            <li>correction_credits: Int</li>
            <li>coaching_credits: Int</li>
            <li>last_updated: DateTime</li>
          </ul>
        </div>

        {/* Question Bank (CMS) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <FileText size={20} />
            <h3 className="font-semibold text-lg">QuestionBank (Item)</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 font-mono">
            <li><span className="text-blue-500 font-bold">id</span>: UUID (PK)</li>
            <li>type: ENUM(READING, WRITING...)</li>
            <li>level: ENUM(A1, A2, B1, B2, C1, C2)</li>
            <li>content: JSONB</li>
            <li>is_premium_only: Boolean</li>
            <li>version: Int</li>
          </ul>
        </div>

        {/* Simulation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-rose-600">
            <Activity size={20} />
            <h3 className="font-semibold text-lg">Simulation</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 font-mono">
            <li><span className="text-rose-500 font-bold">id</span>: UUID (PK)</li>
            <li>title: String</li>
            <li>requires_premium: Boolean</li>
            <li>required_credits: Int (Default 0)</li>
            <li>created_at: DateTime</li>
          </ul>
        </div>

        {/* User Attempt */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-purple-600">
            <Key size={20} />
            <h3 className="font-semibold text-lg">SimulationAttempt</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 font-mono">
            <li><span className="text-purple-500 font-bold">id</span>: UUID (PK)</li>
            <li>user_id: UUID (FK)</li>
            <li>simulation_id: UUID (FK)</li>
            <li>score_clb: Float</li>
            <li>crs_prediction: Int</li>
            <li>status: ENUM(IN_PROGRESS, DONE)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
