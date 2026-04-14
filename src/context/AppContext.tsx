import React, { createContext, useContext, useState } from 'react';
import { User, Question, Attempt, TestType, Subscription, PlanPrice, AccessKey } from '../types';

interface AppState {
  user: User;
  questions: Question[];
  attempts: Attempt[];
  prices: PlanPrice[];
  accessKeys: AccessKey[];
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setPrices: React.Dispatch<React.SetStateAction<PlanPrice[]>>;
  addAttempt: (attempt: Attempt) => void;
  deductCredit: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  addSubscription: (sub: Subscription) => void;
  generateAccessKey: (params: {
    type: 'SUBSCRIPTION' | 'CREDITS';
    test?: TestType;
    days?: number;
    level?: 'BASIC' | 'FULL';
    credits?: number;
  }) => string;
  useAccessKey: (key: string) => { success: boolean; message: string };
}

const initialPrices: PlanPrice[] = [
  { id: 'p1', testType: 'TCF', durationDays: 10, priceXAF: 10000, accessLevel: 'BASIC' },
  { id: 'p2', testType: 'TCF', durationDays: 15, priceXAF: 15000, accessLevel: 'BASIC' },
  { id: 'p3', testType: 'TCF', durationDays: 30, priceXAF: 25000, accessLevel: 'FULL' },
  { id: 'p4', testType: 'TCF', durationDays: 60, priceXAF: 45000, accessLevel: 'FULL' },
  { id: 'p5', testType: 'TEF', durationDays: 30, priceXAF: 25000, accessLevel: 'FULL' },
  { id: 'p6', testType: 'IELTS', durationDays: 30, priceXAF: 30000, accessLevel: 'FULL' },
];

const initialUser: User = {
  id: 'u1',
  name: 'Alexandre Dupont',
  email: 'alex@example.com',
  role: 'ADMIN',
  subscriptions: [],
  correctionCredits: 0,
  estimatedCRS: 420,
  averageCLB: 6.5,
};

const initialQuestions: Question[] = [
  // TCF Canada
  {
    id: 'tcf-w1',
    testType: 'TCF',
    type: 'WRITING',
    level: 'B2',
    title: 'Expression Écrite - Tâche 1',
    content: 'Vous avez assisté à un événement culturel original. Rédigez un court article pour un journal local pour raconter cet événement et donner vos impressions. (80 à 120 mots)',
    isPremium: false,
    isFullAccessOnly: false,
    requiredCredits: 1,
  },
  {
    id: 'tcf-m1',
    testType: 'TCF',
    type: 'METHODOLOGY',
    level: 'B2',
    title: 'Méthodologie - Expression Écrite',
    content: 'Apprenez à structurer votre texte pour la tâche 1 du TCF.',
    isPremium: true,
    isFullAccessOnly: true,
    requiredCredits: 0,
    methodologyContent: 'La structure idéale : 1. Introduction, 2. Développement, 3. Conclusion...',
  },
  {
    id: 'tcf-m2',
    testType: 'TCF',
    type: 'METHODOLOGY',
    level: 'B2',
    title: 'Méthodologie - Compréhension Écrite',
    content: 'Stratégies pour le repérage d\'informations clés.',
    isPremium: true,
    isFullAccessOnly: true,
    requiredCredits: 0,
    methodologyContent: 'Lisez d\'abord les questions avant le texte pour savoir quoi chercher...',
  },
  {
    id: 'tcf-m3',
    testType: 'TCF',
    type: 'METHODOLOGY',
    level: 'B2',
    title: 'Méthodologie - Compréhension Orale',
    content: 'Comment gérer le temps et les distractions sonores.',
    isPremium: true,
    isFullAccessOnly: true,
    requiredCredits: 0,
    methodologyContent: 'Concentrez-vous sur les mots-clés et les connecteurs logiques...',
  },
  {
    id: 'tcf-m4',
    testType: 'TCF',
    type: 'METHODOLOGY',
    level: 'B2',
    title: 'Méthodologie - Expression Orale',
    content: 'Techniques pour parler avec fluidité et assurance.',
    isPremium: true,
    isFullAccessOnly: true,
    requiredCredits: 0,
    methodologyContent: 'Utilisez des expressions de transition pour gagner du temps de réflexion...',
  }
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(initialUser);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [prices, setPrices] = useState<PlanPrice[]>(initialPrices);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);

  const addAttempt = (attempt: Attempt) => {
    setAttempts(prev => [attempt, ...prev]);
    setUser(prev => ({
      ...prev,
      averageCLB: Math.min(10, prev.averageCLB + 0.1),
      estimatedCRS: Math.min(600, prev.estimatedCRS + 5)
    }));
  };

  const deductCredit = (amount: number) => {
    if (user.correctionCredits >= amount) {
      // Check if credits are expired
      if (user.creditsExpireAt && new Date(user.creditsExpireAt) < new Date()) {
        setUser(prev => ({ ...prev, correctionCredits: 0, creditsExpireAt: undefined }));
        return false;
      }
      setUser(prev => ({ ...prev, correctionCredits: prev.correctionCredits - amount }));
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    setUser(prev => {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(now.getDate() + 30); // Credits expire in 30 days
      
      return {
        ...prev,
        correctionCredits: prev.correctionCredits + amount,
        creditsExpireAt: expiresAt.toISOString()
      };
    });
  };

  const addSubscription = (sub: Subscription) => {
    setUser(prev => {
      const existing = prev.subscriptions.find(s => s.testType === sub.testType);
      if (existing) {
        return {
          ...prev,
          subscriptions: prev.subscriptions.map(s => s.testType === sub.testType ? sub : s)
        };
      }
      return {
        ...prev,
        subscriptions: [...prev.subscriptions, sub]
      };
    });
  };

  const generateAccessKey = (params: {
    type: 'SUBSCRIPTION' | 'CREDITS';
    test?: TestType;
    days?: number;
    level?: 'BASIC' | 'FULL';
    credits?: number;
  }) => {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = new Date();
    const expiresIfUnusedAt = new Date();
    expiresIfUnusedAt.setDate(now.getDate() + 7); // Key expires in 7 days if not used

    setAccessKeys(prev => [...prev, { 
      key, 
      type: params.type,
      testType: params.test, 
      durationDays: params.days, 
      accessLevel: params.level, 
      creditAmount: params.credits,
      isUsed: false,
      createdAt: now.toISOString(),
      expiresIfUnusedAt: expiresIfUnusedAt.toISOString()
    }]);
    return key;
  };

  const useAccessKey = (key: string) => {
    const found = accessKeys.find(k => 
      k.key === key && 
      !k.isUsed && 
      new Date(k.expiresIfUnusedAt) > new Date()
    );

    if (found) {
      if (found.type === 'SUBSCRIPTION' && found.testType && found.durationDays && found.accessLevel) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + found.durationDays);
        addSubscription({
          testType: found.testType,
          expiresAt: expiresAt.toISOString(),
          accessLevel: found.accessLevel
        });
        setAccessKeys(prev => prev.map(k => k.key === key ? { ...k, isUsed: true } : k));
        return { success: true, message: `Abonnement ${found.testType} activé pour ${found.durationDays} jours !` };
      } else if (found.type === 'CREDITS' && found.creditAmount) {
        addCredits(found.creditAmount);
        setAccessKeys(prev => prev.map(k => k.key === key ? { ...k, isUsed: true } : k));
        return { success: true, message: `${found.creditAmount} crédits IA ajoutés à votre compte !` };
      }
    }
    return { success: false, message: "Clé invalide, déjà utilisée ou expirée." };
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      questions, 
      attempts, 
      prices,
      accessKeys,
      setUser, 
      setQuestions, 
      setPrices,
      addAttempt, 
      deductCredit,
      addCredits,
      addSubscription,
      generateAccessKey,
      useAccessKey
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
