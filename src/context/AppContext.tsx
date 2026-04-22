import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Question, Attempt, TestType, Subscription, PlanPrice, AccessKey, Simulation } from '../types';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { 
  onSnapshot, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface AppState {
  user: User | null;
  questions: Question[];
  simulations: Simulation[];
  attempts: Attempt[];
  prices: PlanPrice[];
  accessKeys: AccessKey[];
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setPrices: React.Dispatch<React.SetStateAction<PlanPrice[]>>;
  savePrices: (newPrices: PlanPrice[]) => Promise<void>;
  addAttempt: (attempt: Attempt) => Promise<void>;
  deductCredit: (amount: number) => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
  addSubscription: (sub: Subscription) => Promise<void>;
  saveQuestion: (question: Question) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  saveSimulation: (simulation: Simulation) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;
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
  { id: 'tcf_full', testType: 'TCF', durationDays: 30, priceXAF: 15000, accessLevel: 'FULL', creditAmount: 10 },
  { id: 'tef_full', testType: 'TEF', durationDays: 30, priceXAF: 15000, accessLevel: 'FULL', creditAmount: 10 },
  { id: 'ielts_full', testType: 'IELTS', durationDays: 30, priceXAF: 20000, accessLevel: 'FULL', creditAmount: 10 },
  { id: 'full_all', testType: 'TCF', durationDays: 30, priceXAF: 35000, accessLevel: 'FULL', creditAmount: 30 }, // Special full pass
  { id: 'credits_pack', testType: 'TCF', durationDays: 0, priceXAF: 5000, accessLevel: 'BASIC', creditAmount: 20 }
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [prices, setPrices] = useState<PlanPrice[]>(initialPrices);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to seed sample data
  const seedData = async () => {
    const nowStr = new Date().toISOString();
    
    // Helper to create a TCF Canada Complete Simulation
    const tcfSim: Simulation = {
      id: 'sim_tcf_full_1',
      testType: 'TCF',
      title: 'Simulation Complète TCF Canada - Session 1',
      description: 'Épreuve complète incluant Compréhension Orale, Écrite et Expression Écrite.',
      level: 'B2',
      isPremium: true,
      requiredCredits: 2,
      createdAt: nowStr,
      questions: [
        {
          id: 'q_tcf_oral_sim1_1',
          testType: 'TCF',
          type: 'LISTENING',
          level: 'B2',
          title: 'Partie 1: Compréhension Orale',
          content: 'Écoutez l\'audio et répondez à la question.\nAudio: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3\nQuestion: Où se passe cette conversation ?',
          options: [
            { id: 'a', text: 'Dans une banque', isCorrect: true },
            { id: 'b', text: 'Au marché', isCorrect: false },
            { id: 'c', text: 'À l\'école', isCorrect: false }
          ],
          isPremium: true,
          isFullAccessOnly: false,
          requiredCredits: 0,
          createdAt: nowStr
        },
        {
          id: 'q_tcf_read_sim1_1',
          testType: 'TCF',
          type: 'READING',
          level: 'B2',
          title: 'Partie 2: Compréhension Écrite',
          content: 'Lisez le texte sur l\'immigration au Canada.\n"Le Canada cherche à attirer 500,000 nouveaux résidents d\'ici 2025."\nQuestion: Quel est l\'objectif cité ?',
          options: [
            { id: 'a', text: 'Réduire l\'immigration', isCorrect: false },
            { id: 'b', text: 'Augmenter le nombre de résidents', isCorrect: true },
            { id: 'c', text: 'Fermer les frontières', isCorrect: false }
          ],
          isPremium: true,
          isFullAccessOnly: false,
          requiredCredits: 0,
          createdAt: nowStr
        },
        {
          id: 'q_tcf_write_sim1_1',
          testType: 'TCF',
          type: 'WRITING',
          level: 'B2',
          title: 'Partie 3: Expression Écrite',
          content: 'Sujet 1: Vous écrivez à un ami pour lui raconter vos vacances au Québec. (60-120 mots)',
          isPremium: true,
          isFullAccessOnly: false,
          requiredCredits: 0,
          createdAt: nowStr
        }
      ]
    };

    // Helper to create a TEF Canada Complete Simulation
    const tefSim: Simulation = {
      id: 'sim_tef_full_1',
      testType: 'TEF',
      title: 'Simulation Complète TEF Canada - Session 1',
      description: 'Session intensive du TEF Canada. Tous les modules inclus.',
      level: 'B2',
      isPremium: true,
      requiredCredits: 2,
      createdAt: nowStr,
      questions: [
        {
          id: 'q_tef_oral_sim1_1',
          testType: 'TEF',
          type: 'LISTENING',
          level: 'B2',
          title: 'Section A: Compréhension Orale',
          content: 'Audio: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3\nQuestion: Quelle est l\'intention du locuteur ?',
          options: [
            { id: 'a', text: 'Informer', isCorrect: true },
            { id: 'b', text: 'Se plaindre', isCorrect: false },
            { id: 'c', text: 'Vendre un produit', isCorrect: false }
          ],
          isPremium: true,
          isFullAccessOnly: false,
          requiredCredits: 0,
          createdAt: nowStr
        },
        {
          id: 'q_tef_write_sim1_1',
          testType: 'TEF',
          type: 'WRITING',
          level: 'B2',
          title: 'Section B: Expression Écrite',
          content: 'Fait divers: Une baleine a été aperçue dans la Seine. Racontez la suite. (80-120 mots)',
          isPremium: true,
          isFullAccessOnly: false,
          requiredCredits: 0,
          createdAt: nowStr
        }
      ]
    };

    // Helper to create an IELTS Complete Simulation
    const ieltsSim: Simulation = {
      id: 'sim_ielts_full_1',
      testType: 'IELTS',
      title: 'IELTS Real-Condition Mock Test - Session 1',
      description: 'A full IELTS academic mock test covering Listening, Reading, and Writing tasks.',
      level: 'C1',
      isPremium: true,
      requiredCredits: 2,
      createdAt: nowStr,
      questions: [
        {
          id: 'q_ielts_oral_sim1_1',
          testType: 'IELTS',
          type: 'LISTENING',
          level: 'C1',
          title: 'Listening Section 1',
          content: 'Audio: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3\nQuestion: What is the speaker\'s primary concern?',
          options: [
            { id: 'a', text: 'Global warming', isCorrect: true },
            { id: 'b', text: 'Economic crisis', isCorrect: false },
            { id: 'c', text: 'Space exploration', isCorrect: false }
          ],
          isPremium: true,
          isFullAccessOnly: false,
          requiredCredits: 0,
          createdAt: nowStr
        },
        {
          id: 'q_ielts_write_sim1_1',
          testType: 'IELTS',
          type: 'WRITING',
          level: 'C1',
          title: 'Writing Task 2',
          content: 'Topic: Should technology be used in classrooms? Discuss. (250 words minimum)',
          isPremium: true,
          isFullAccessOnly: false,
          requiredCredits: 0,
          createdAt: nowStr
        }
      ]
    };

    // Save simulations
    const sims = [tcfSim, tefSim, ieltsSim];
    for (const sim of sims) {
      await setDoc(doc(db, 'simulations', sim.id), sim);
    }

    const samples: Question[] = [
      // === TCF CANADA (4 Subjects) ===
      {
        id: 'sample_tcf_oral_1',
        testType: 'TCF',
        type: 'LISTENING',
        level: 'B2',
        title: 'TCF Canada - Compréhension Orale - Tâche 1',
        content: 'Écoutez l\'audio et répondez à la question.\n\nAudio: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3\n\nQuestion: Quel est le sujet principal de la conversation ?',
        options: [
          { id: 'a', text: 'Un voyage d\'affaires', isCorrect: false },
          { id: 'b', text: 'Une visite familiale', isCorrect: true },
          { id: 'c', text: 'Un déménagement', isCorrect: false },
          { id: 'd', text: 'Une recherche d\'emploi', isCorrect: false }
        ],
        isPremium: true,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },
      {
        id: 'sample_tcf_writing_1',
        testType: 'TCF',
        type: 'WRITING',
        level: 'B2',
        title: 'TCF Canada - Expression Écrite - Tâche 1',
        content: 'Vous voulez inviter un ami à une fête d\'anniversaire. \nÉcrivez-lui un message (60 à 120 mots) pour lui proposer de venir, en précisant la date, le lieu et le programme.',
        isPremium: true,
        isFullAccessOnly: false,
        requiredCredits: 1,
        createdAt: nowStr
      },
      {
        id: 'sample_tcf_reading_1',
        testType: 'TCF',
        type: 'READING',
        level: 'B2',
        title: 'TCF Canada - Compréhension Écrite',
        content: 'Lisez le texte suivant :\n"L\'éducation à distance a connu une croissance exponentielle ces dernières années. Bien que pratique, elle pose des défis en termes d\'interaction sociale."',
        options: [
          { id: 'a', text: 'Le manque de matériel informatique', isCorrect: false },
          { id: 'b', text: 'L\'interaction sociale limitée', isCorrect: true },
          { id: 'c', text: 'Le coût trop élevé', isCorrect: false },
          { id: 'd', text: 'La difficulté des examens', isCorrect: false }
        ],
        isPremium: false,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },
      {
        id: 'meth_tcf_writing',
        testType: 'TCF',
        type: 'METHODOLOGY',
        level: 'B2',
        title: 'TCF Canada - Méthodologie Expression Écrite',
        content: 'La Tâche 1 consiste à rédiger un message court. \nConseils:\n- Respectez le nombre de mots (60-120).\n- Utilisez des connecteurs logiques (Et, De plus, Enfin).\n- Soignez votre orthographe.',
        methodologyContent: 'Points clés :\n1. Salutation appropriée.\n2. Corps de texte structuré.\n3. Formule de politesse.',
        isPremium: false,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },

      // === TEF CANADA (4 Subjects) ===
      {
        id: 'sample_tef_writing_1',
        testType: 'TEF',
        type: 'WRITING',
        level: 'B2',
        title: 'TEF Canada - Expression Écrite - Fait Divers',
        content: 'Sujet: Vous avez lu cette annonce dans un journal. Écrivez un article pour raconter la suite de l\'histoire.\n\n"Un homme a trouvé un trésor dans son jardin hier matin..." (Minimum 80 mots)',
        isPremium: true,
        isFullAccessOnly: false,
        requiredCredits: 1,
        createdAt: nowStr
      },
      {
        id: 'sample_tef_listening_1',
        testType: 'TEF',
        type: 'LISTENING',
        level: 'B1',
        title: 'TEF Canada - Compréhension Orale - Section A',
        content: 'Écoutez attentivement ces messages courts.\n\nAudio: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        options: [
          { id: 'a', text: 'Dans une gare', isCorrect: true },
          { id: 'b', text: 'Dans un aéroport', isCorrect: false },
          { id: 'c', text: 'Dans un restaurant', isCorrect: false },
          { id: 'd', text: 'Dans une bibliothèque', isCorrect: false }
        ],
        isPremium: true,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },
      {
        id: 'sample_tef_reading_1',
        testType: 'TEF',
        type: 'READING',
        level: 'B2',
        title: 'TEF Canada - Compréhension Écrite - Section B',
        content: 'Sujet : Analyse d\'un article de presse sur l\'environnement.\nLe texte traite des nouvelles régulations sur le plastique en France.',
        options: [
          { id: 'a', text: 'L\'interdiction totale du plastique', isCorrect: false },
          { id: 'b', text: 'Une taxe sur les bouteilles', isCorrect: false },
          { id: 'c', text: 'La fin des emballages jetables pour fruits et légumes', isCorrect: true },
          { id: 'd', text: 'La fermeture des usines de plastique', isCorrect: false }
        ],
        isPremium: false,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },
      {
        id: 'meth_tef_writing',
        testType: 'TEF',
        type: 'METHODOLOGY',
        level: 'B2',
        title: 'TEF Canada - Méthodologie Fait Divers',
        content: 'La Section A demande de raconter la suite d\'un fait divers.\n- Utilisez le passé composé et l\'imparfait.\n- Structurez votre récit (début, péripéties, conclusion).\n- Soyez créatif mais cohérent.',
        methodologyContent: 'Conseils pratiques :\n- Variez le vocabulaire (synonymes de "dire", "faire").\n- Vérifiez les accords grammaticaux.',
        isPremium: false,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },

      // === IELTS (4 Subjects) ===
      {
        id: 'sample_ielts_writing_1',
        testType: 'IELTS',
        type: 'WRITING',
        level: 'C1',
        title: 'IELTS Academic Writing - Task 2',
        content: 'Topic: Some people believe that competitive sports are beneficial for children, while others think they can be harmful. Discuss both views and give your opinion.\n(Write at least 250 words)',
        isPremium: true,
        isFullAccessOnly: true,
        requiredCredits: 1,
        createdAt: nowStr
      },
      {
        id: 'sample_ielts_listening_1',
        testType: 'IELTS',
        type: 'LISTENING',
        level: 'B2',
        title: 'IELTS Listening - Section 1',
        content: 'A conversation between a customer and a travel insurance agent.\n\nAudio: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        options: [
          { id: 'a', text: 'AB12345', isCorrect: false },
          { id: 'b', text: 'XY98765', isCorrect: true },
          { id: 'c', text: 'ZZ00001', isCorrect: false },
          { id: 'd', text: 'KL55667', isCorrect: false }
        ],
        isPremium: true,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },
      {
        id: 'sample_ielts_reading_1',
        testType: 'IELTS',
        type: 'READING',
        level: 'C1',
        title: 'IELTS Reading - Passage 1',
        content: 'Topic: The History of the Bicycle.\nScientific analysis of the evolution of transportation in the 19th century.',
        options: [
          { id: 'a', text: 'Karl von Drais', isCorrect: true },
          { id: 'b', text: 'James Starley', isCorrect: false },
          { id: 'c', text: 'Pierre Michaux', isCorrect: false },
          { id: 'd', text: 'John Kemp Starley', isCorrect: false }
        ],
        isPremium: false,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      },
      {
        id: 'meth_ielts_writing',
        testType: 'IELTS',
        type: 'METHODOLOGY',
        level: 'C1',
        title: 'IELTS Writing Task 2 - Essay Methodology',
        content: 'Structure recommendations:\n1. Introduction: Hook + Thesis statement.\n2. Body Paragraphs: One idea per paragraph with examples.\n3. Conclusion: Reiterate point without new info.',
        methodologyContent: 'Rubric Criteria:\n- Task Response\n- Coherence and Cohesion\n- Lexical Resource\n- Grammatical Range and Accuracy',
        isPremium: false,
        isFullAccessOnly: false,
        requiredCredits: 0,
        createdAt: nowStr
      }
    ] as any;

    for (const s of samples) {
      await setDoc(doc(db, 'questions', s.id), s);
    }
  };

  // 1. Local Device Identity & Profile Management
  useEffect(() => {
    const initApp = async () => {
      let localId = localStorage.getItem('alpha_prep_user_id');
      if (!localId) {
        localId = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('alpha_prep_user_id', localId);
      }

      const userRef = doc(db, 'users', localId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUser(userSnap.data() as User);
      } else {
        // Create initial profile linked to this device
        const newUser: User = {
          id: localId,
          name: 'Étudiant ' + localId.substring(5, 9).toUpperCase(),
          email: 'anonymous@device.local',
          role: 'USER',
          subscriptions: [],
          correctionCredits: 0,
          estimatedCRS: 0,
          averageCLB: 0
        };
        await setDoc(userRef, newUser);
        setUser(newUser);
      }

      // Check if this specific device ID is granted admin status
      const adminSnap = await getDoc(doc(db, 'admins', localId));
      if (adminSnap.exists()) {
        setUser(prev => prev ? { ...prev, role: 'ADMIN' } : null);
      }

      // Load prices
      const pricesSnap = await getDoc(doc(db, 'settings', 'prices'));
      if (pricesSnap.exists()) {
        setPrices((pricesSnap.data() as { list: PlanPrice[] }).list);
      }
      
      // Ensure sample data exists
      await seedData();
      
      setIsLoading(false);
    };

    initApp();
  }, []);

  const savePrices = async (newPrices: PlanPrice[]) => {
    try {
      await setDoc(doc(db, 'settings', 'prices'), { list: newPrices });
      setPrices(newPrices);
    } catch (e) {
      handleFirestoreError(e, 'update', 'settings/prices');
    }
  };

  // 2. Real-time Questions Fetching (Always available)
  useEffect(() => {
    const q = query(collection(db, 'questions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filter out soft-deleted items
      const qData = snapshot.docs
        .map(doc => doc.data() as Question)
        .filter(q => (q as any).isDeleted !== true);
      setQuestions(qData);
    }, (error) => {
      console.warn("Firestore Questions Listener Error:", error);
    });
    return () => unsubscribe();
  }, []);

  // 2.5 Real-time Simulations Fetching
  useEffect(() => {
    const q = query(collection(db, 'simulations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sData = snapshot.docs
        .map(doc => doc.data() as Simulation)
        .filter(s => (s as any).isDeleted !== true);
      setSimulations(sData);
    }, (error) => {
      console.warn("Firestore Simulations Listener Error:", error);
    });
    return () => unsubscribe();
  }, []);

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
      
      // Calculate new average from last 20 attempts
      const allAttempts = [attempt, ...attempts];
      const recentAttempts = allAttempts.slice(0, 20);
      const totalScore = recentAttempts.reduce((sum, a) => sum + a.scoreCLB, 0);
      const newAverage = totalScore / recentAttempts.length;
      
      // Update global user stats locally and on server
      const userRef = doc(db, 'users', user.id);
      // CRS formula approximation: 400 + (CLB-7)*40
      const newCRS = Math.max(0, Math.min(600, 400 + (newAverage - 7) * 50));
      
      await updateDoc(userRef, {
        averageCLB: parseFloat(newAverage.toFixed(1)),
        estimatedCRS: Math.round(newCRS)
      });
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

  const saveSimulation = async (simulation: Simulation) => {
    try {
      await setDoc(doc(db, 'simulations', simulation.id), simulation);
    } catch (e) {
      handleFirestoreError(e, 'create', `simulations/${simulation.id}`);
    }
  };

  const deleteSimulation = async (id: string) => {
    try {
      await setDoc(doc(db, 'simulations', id), { isDeleted: true }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'delete', `simulations/${id}`);
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

        const userRef = doc(db, 'users', user.id);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return { success: false, message: "Utilisateur introuvable." };
        const userData = userSnap.data() as User;

        const updates: any = {};
        let successDetail = "";

        // Grant Subscription Duration
        if (kData.testType && kData.durationDays) {
          const updatedSubs = [...(userData.subscriptions || [])];
          const subIdx = updatedSubs.findIndex(s => s.testType === kData.testType);
          
          let expiryDate = new Date();
          const existingSub = updatedSubs[subIdx];
          if (existingSub && new Date(existingSub.expiresAt) > new Date()) {
            expiryDate = new Date(existingSub.expiresAt);
          }
          expiryDate.setDate(expiryDate.getDate() + kData.durationDays);

          const newSub: Subscription = {
            testType: kData.testType,
            expiresAt: expiryDate.toISOString(),
            accessLevel: kData.accessLevel || 'FULL'
          };

          if (subIdx >= 0) updatedSubs[subIdx] = newSub;
          else updatedSubs.push(newSub);
          
          updates.subscriptions = updatedSubs;
          successDetail += `Pass ${kData.testType} (${kData.durationDays}j)`;
        }

        // Grant AI Credits
        if (kData.creditAmount) {
          updates.correctionCredits = (userData.correctionCredits || 0) + kData.creditAmount;
          const creditsExpiry = new Date();
          creditsExpiry.setDate(creditsExpiry.getDate() + 90); 
          updates.creditsExpireAt = creditsExpiry.toISOString();
          successDetail += (successDetail ? " + " : "") + `${kData.creditAmount} crédits IA`;
        }

        if (Object.keys(updates).length === 0) {
          return { success: false, message: "Données de clé invalides." };
        }

        transaction.update(keyRef, { 
          isUsed: true, 
          usedBy: user.id, 
          usedAt: new Date().toISOString() 
        });
        transaction.update(userRef, updates);

        return { success: true, message: `Activé : ${successDetail}` };
      });
    } catch (e) {
      handleFirestoreError(e, 'update', `accessKeys/${key}`);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      questions, 
      simulations,
      attempts, 
      prices,
      accessKeys,
      isLoading,
      setUser, 
      setQuestions, 
      setPrices,
      savePrices,
      addAttempt, 
      deductCredit,
      addCredits,
      addSubscription,
      saveQuestion,
      deleteQuestion,
      saveSimulation,
      deleteSimulation,
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
