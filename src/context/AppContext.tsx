import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Question, Attempt, TestType, Subscription, PlanPrice, AccessKey } from '../types';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { 
  onSnapshot, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface AppState {
  user: User | null;
  questions: Question[];
  attempts: Attempt[];
  prices: PlanPrice[];
  accessKeys: AccessKey[];
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setPrices: React.Dispatch<React.SetStateAction<PlanPrice[]>>;
  addAttempt: (attempt: Attempt) => Promise<void>;
  deductCredit: (amount: number) => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
  addSubscription: (sub: Subscription) => Promise<void>;
  saveQuestion: (question: Question) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  generateAccessKey: (params: {
    type: 'SUBSCRIPTION' | 'CREDITS';
    test?: TestType;
    days?: number;
    level?: 'BASIC' | 'FULL';
    credits?: number;
  }) => Promise<string>;
  useAccessKey: (key: string) => Promise<{ success: boolean; message: string }>;
}

const initialPrices: PlanPrice[] = [
  { id: 'p1', testType: 'TCF', durationDays: 10, priceXAF: 10000, accessLevel: 'BASIC' },
  { id: 'p2', testType: 'TCF', durationDays: 15, priceXAF: 15000, accessLevel: 'BASIC' },
  { id: 'p3', testType: 'TCF', durationDays: 30, priceXAF: 25000, accessLevel: 'FULL' },
  { id: 'p4', testType: 'TCF', durationDays: 60, priceXAF: 45000, accessLevel: 'FULL' },
  { id: 'p5', testType: 'TEF', durationDays: 30, priceXAF: 25000, accessLevel: 'FULL' },
  { id: 'p6', testType: 'IELTS', durationDays: 30, priceXAF: 30000, accessLevel: 'FULL' },
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [prices, setPrices] = useState<PlanPrice[]>(initialPrices);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Auth & User Profile Management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Sync user profile from Firestore
        const userRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          // Create initial profile
          const newUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Étudiant',
            email: fbUser.email || '',
            role: 'USER',
            subscriptions: [],
            correctionCredits: 0,
            estimatedCRS: 0,
            averageCLB: 0
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
        }

        // Check if admin
        const adminSnap = await getDoc(doc(db, 'admins', fbUser.uid));
        if (adminSnap.exists()) {
          setUser(prev => prev ? { ...prev, role: 'ADMIN' } : null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Questions Fetching
  useEffect(() => {
    if (!user) {
      setQuestions([]);
      return;
    }
    const q = query(collection(db, 'questions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qData = snapshot.docs.map(doc => doc.data() as Question);
      setQuestions(qData);
    }, (error) => {
      console.warn("Firestore Questions Listener Error:", error);
    });
    return () => unsubscribe();
  }, [user?.id]);

  // 3. Real-time Access Keys (Admins only)
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setAccessKeys([]);
      return;
    }
    const q = query(collection(db, 'accessKeys'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const kData = snapshot.docs.map(doc => doc.data() as AccessKey);
      setAccessKeys(kData);
    }, (error) => {
      console.warn("Firestore AccessKeys Listener Error:", error);
    });
    return () => unsubscribe();
  }, [user?.role, user?.id]);

  // 4. Real-time User Attempts Fetching
  useEffect(() => {
    if (!user) {
      setAttempts([]);
      return;
    }
    const q = query(collection(db, 'users', user.id, 'attempts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const aData = snapshot.docs.map(doc => doc.data() as Attempt);
      // Sort by date descending
      setAttempts(aData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      console.warn("Firestore Attempts Listener Error:", error);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const addAttempt = async (attempt: Attempt) => {
    if (!user) return;
    try {
      const attemptRef = doc(collection(db, 'users', user.id, 'attempts'), attempt.id);
      await setDoc(attemptRef, attempt);
      
      // Update global user stats locally and on server
      const userRef = doc(db, 'users', user.id);
      const newAverage = Math.min(10, user.averageCLB + 0.1);
      const newCRS = Math.min(600, user.estimatedCRS + 5);
      
      await updateDoc(userRef, {
        averageCLB: newAverage,
        estimatedCRS: newCRS
      });
      
      setAttempts(prev => [attempt, ...prev]);
    } catch (e) {
      handleFirestoreError(e, 'create', `users/${user.id}/attempts/${attempt.id}`);
    }
  };

  const deductCredit = async (amount: number) => {
    if (!user) return false;
    if (user.correctionCredits < amount) return false;
    
    // Check expiry
    if (user.creditsExpireAt && new Date(user.creditsExpireAt) < new Date()) {
      await updateDoc(doc(db, 'users', user.id), {
        correctionCredits: 0,
        creditsExpireAt: null
      });
      return false;
    }

    try {
      await updateDoc(doc(db, 'users', user.id), {
        correctionCredits: user.correctionCredits - amount
      });
      return true;
    } catch (e) {
      handleFirestoreError(e, 'update', `users/${user.id}`);
    }
  };

  const addCredits = async (amount: number) => {
    if (!user) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    try {
      await updateDoc(doc(db, 'users', user.id), {
        correctionCredits: user.correctionCredits + amount,
        creditsExpireAt: expiresAt.toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, 'update', `users/${user.id}`);
    }
  };

  const addSubscription = async (sub: Subscription) => {
    if (!user) return;
    const updatedSubs = [...user.subscriptions];
    const index = updatedSubs.findIndex(s => s.testType === sub.testType);
    
    if (index >= 0) {
      updatedSubs[index] = sub;
    } else {
      updatedSubs.push(sub);
    }

    try {
      await updateDoc(doc(db, 'users', user.id), {
        subscriptions: updatedSubs
      });
    } catch (e) {
      handleFirestoreError(e, 'update', `users/${user.id}`);
    }
  };

  const saveQuestion = async (question: Question) => {
    try {
      await setDoc(doc(db, 'questions', question.id), question);
    } catch (e) {
      handleFirestoreError(e, 'create', `questions/${question.id}`);
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await setDoc(doc(db, 'questions', id), { isDeleted: true }, { merge: true });
      // Actually delete if preferred, but soft-delete is safer.
      // await deleteDoc(doc(db, 'questions', id));
    } catch (e) {
      handleFirestoreError(e, 'delete', `questions/${id}`);
    }
  };

  const generateAccessKey = async (params: {
    type: 'SUBSCRIPTION' | 'CREDITS';
    test?: TestType;
    days?: number;
    level?: 'BASIC' | 'FULL';
    credits?: number;
  }) => {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = new Date();
    const expiresIfUnusedAt = new Date();
    expiresIfUnusedAt.setDate(now.getDate() + 7);

    const keyData: AccessKey = { 
      key, 
      type: params.type,
      testType: params.test, 
      durationDays: params.days, 
      accessLevel: params.level, 
      creditAmount: params.credits,
      isUsed: false,
      createdAt: now.toISOString(),
      expiresIfUnusedAt: expiresIfUnusedAt.toISOString()
    };

    try {
      await setDoc(doc(db, 'accessKeys', key), keyData);
      return key;
    } catch (e) {
      handleFirestoreError(e, 'create', `accessKeys/${key}`);
    }
  };

  const useAccessKey = async (key: string) => {
    if (!user) return { success: false, message: "Vous devez être connecté." };

    try {
      return await runTransaction(db, async (transaction) => {
        const keyRef = doc(db, 'accessKeys', key);
        const keySnap = await transaction.get(keyRef);

        if (!keySnap.exists()) {
          return { success: false, message: "Clé inexistante." };
        }

        const kData = keySnap.data() as AccessKey;

        if (kData.isUsed) {
          return { success: false, message: "Clé déjà utilisée." };
        }

        if (new Date(kData.expiresIfUnusedAt) < new Date()) {
          return { success: false, message: "Clé expirée." };
        }

        // Mark as used
        transaction.update(keyRef, { isUsed: true });

        // Grant benefits
        if (kData.type === 'SUBSCRIPTION' && kData.testType && kData.durationDays) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + kData.durationDays);
          const newSub: Subscription = {
            testType: kData.testType,
            expiresAt: expiresAt.toISOString(),
            accessLevel: kData.accessLevel || 'BASIC'
          };
          
          const userRef = doc(db, 'users', user.id);
          const userSnap = await transaction.get(userRef);
          const userData = userSnap.data() as User;
          
          const updatedSubs = [...userData.subscriptions];
          const index = updatedSubs.findIndex(s => s.testType === newSub.testType);
          if (index >= 0) updatedSubs[index] = newSub;
          else updatedSubs.push(newSub);

          transaction.update(userRef, { subscriptions: updatedSubs });
          return { success: true, message: `Abonnement ${kData.testType} activé pour ${kData.durationDays} jours !` };
        } else if (kData.type === 'CREDITS' && kData.creditAmount) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          
          const userRef = doc(db, 'users', user.id);
          const userSnap = await transaction.get(userRef);
          const userData = userSnap.data() as User;

          transaction.update(userRef, { 
            correctionCredits: userData.correctionCredits + kData.creditAmount,
            creditsExpireAt: expiresAt.toISOString()
          });
          return { success: true, message: `${kData.creditAmount} crédits IA ajoutés !` };
        }

        return { success: false, message: "Erreur de configuration de la clé." };
      });
    } catch (e) {
      handleFirestoreError(e, 'update', `accessKeys/${key}`);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      questions, 
      attempts, 
      prices,
      accessKeys,
      isLoading,
      setUser, 
      setQuestions, 
      setPrices,
      addAttempt, 
      deductCredit,
      addCredits,
      addSubscription,
      saveQuestion,
      deleteQuestion,
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
