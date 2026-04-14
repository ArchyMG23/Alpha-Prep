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
  addSubscription: (sub: Subscription) => void;
  generateAccessKey: (test: TestType, days: number, level: 'BASIC' | 'FULL') => string;
  useAccessKey: (key: string) => boolean;
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
      setUser(prev => ({ ...prev, correctionCredits: prev.correctionCredits - amount }));
      return true;
    }
    return false;
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

  const generateAccessKey = (test: TestType, days: number, level: 'BASIC' | 'FULL') => {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    setAccessKeys(prev => [...prev, { key, testType: test, durationDays: days, accessLevel: level, isUsed: false }]);
    return key;
  };

  const useAccessKey = (key: string) => {
    const found = accessKeys.find(k => k.key === key && !k.isUsed);
    if (found) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + found.durationDays);
      addSubscription({
        testType: found.testType,
        expiresAt: expiresAt.toISOString(),
        accessLevel: found.accessLevel
      });
      setAccessKeys(prev => prev.map(k => k.key === key ? { ...k, isUsed: true } : k));
      return true;
    }
    return false;
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
