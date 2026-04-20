import React, { useState } from 'react';
import { LayoutDashboard, PenTool, ShoppingCart, LogOut, CreditCard, Sparkles, ShieldCheck, BookOpen, Menu, X, LogIn, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (t: string) => void }) {
  const { user, isLoading } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError("Le popup a été bloqué par votre navigateur. Veuillez autoriser les popups pour ce site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need for error message usually
      } else {
        setLoginError("Une erreur est survenue lors de la connexion. Veuillez réessayer.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Chargement Alpha Prep...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-100 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[40px] border border-slate-200 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-8 shadow-xl shadow-indigo-100 italic">
            &alpha;
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Bienvenue sur Alpha Prep</h1>
          <p className="text-slate-500 mb-10 font-medium">Rejoignez la communauté et commencez votre préparation aux tests de langue Canada.</p>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-5 bg-white border-2 border-slate-200 text-slate-800 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-100 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" referrerPolicy="no-referrer" />
            )}
            {isLoggingIn ? 'Connexion en cours...' : 'Continuer avec Google'}
          </button>

          {loginError && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 text-sm font-black text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100"
            >
              {loginError}
            </motion.p>
          )}
          
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sécurisé par Firebase & Alpha Core</p>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exam', label: 'Simulations', icon: PenTool },
    { id: 'methodology', label: 'Méthodologie', icon: BookOpen },
    { id: 'store', label: 'Boutique', icon: ShoppingCart },
  ];

  const activeSubs = user.subscriptions.filter(s => new Date(s.expiresAt) > new Date());

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3">
            &alpha;
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Alpha Prep</span>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {user?.name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={`px-2 py-1 rounded-md flex items-center gap-1 ${activeSubs.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                  {activeSubs.length > 0 ? <Sparkles size={12} /> : null}
                  {activeSubs.length > 0 ? 'Premium' : 'Gratuit'}
                </span>
                <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  <CreditCard size={12} /> {user.correctionCredits}
                </span>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <LogOut size={18} className="text-slate-400" />
            Déconnexion
          </button>
          <div className="mt-4 text-[10px] text-slate-400 text-center">
            <button 
              onClick={() => handleTabChange('cms')}
              className="hover:text-slate-600 transition-colors"
            >
              © 2026 Alpha Prep. Tous droits réservés.
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-2">
            &alpha;
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">Alpha Prep</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-4 pt-[calc(1rem+env(safe-area-inset-top))] animate-in slide-in-from-top duration-200" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-base font-bold transition-colors ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pt-[calc(1rem+env(safe-area-inset-top))]">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav (Quick Access) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
