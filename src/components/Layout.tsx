import React from 'react';
import { LayoutDashboard, PenTool, ShoppingCart, LogOut, CreditCard, Sparkles, ShieldCheck, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Layout({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (t: string) => void }) {
  const { user } = useAppContext();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exam', label: 'Simulations', icon: PenTool },
    { id: 'methodology', label: 'Méthodologie', icon: BookOpen },
    { id: 'store', label: 'Boutique', icon: ShoppingCart },
  ];

  const activeSubs = user.subscriptions.filter(s => new Date(s.expiresAt) > new Date());

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3">
            &alpha;
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Alpha Prep</span>
        </div>

        <div className="p-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className={`px-2 py-1 rounded-md flex items-center gap-1 ${activeSubs.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                {activeSubs.length > 0 ? <Sparkles size={12} /> : null}
                {activeSubs.length > 0 ? 'Premium' : 'Gratuit'}
              </span>
              <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                <CreditCard size={12} /> {user.correctionCredits}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-200">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <LogOut size={18} className="text-slate-400" />
            Déconnexion
          </button>
          <div className="mt-4 text-[10px] text-slate-400 text-center">
            <button 
              onClick={() => setActiveTab('cms')}
              className="hover:text-slate-600 transition-colors"
            >
              © 2026 Alpha Prep. Tous droits réservés.
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="max-w-5xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
