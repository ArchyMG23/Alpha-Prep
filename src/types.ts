export type TestType = 'TCF' | 'TEF' | 'IELTS';
export type TaskType = 'WRITING' | 'READING' | 'LISTENING' | 'SPEAKING' | 'METHODOLOGY';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type UserRole = 'USER' | 'ADMIN';

export interface PlanPrice {
  id: string;
  testType: TestType;
  durationDays: number;
  priceXAF: number;
  accessLevel: 'BASIC' | 'FULL';
  creditAmount: number; // Integrated credits
}

export interface AccessKey {
  key: string;
  type: 'SUBSCRIPTION' | 'CREDITS';
  testType?: TestType;
  durationDays?: number;
  accessLevel?: 'BASIC' | 'FULL';
  creditAmount?: number;
  isUsed: boolean;
  createdAt: string;
  expiresIfUnusedAt: string;
}

export interface Subscription {
  testType: TestType;
  expiresAt: string;
  accessLevel: 'BASIC' | 'FULL';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptions: Subscription[];
  correctionCredits: number;
  creditsExpireAt?: string;
  estimatedCRS: number;
  averageCLB: number;
}

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  testType: TestType;
  type: TaskType;
  level: Level;
  title: string;
  content: string;
  isPremium: boolean;
  isFullAccessOnly: boolean;
  requiredCredits: number;
  options?: MCQOption[];
  correctAnswer?: string;
  methodologyContent?: string;
  sourceFile?: string; // Track original file name
}

export interface Attempt {
  id: string;
  userId: string;
  questionId: string;
  date: string;
  scoreCLB: number;
  feedback: string;
  userAnswer?: string;
  mcqAnswers?: Record<string, string>;
}
