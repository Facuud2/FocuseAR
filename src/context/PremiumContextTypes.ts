import { createContext } from 'react';
import type { PlanType, PlanFeatures } from '../services/SubscriptionService';
import type { User } from 'firebase/auth';

export interface AuthContextType {
  user: User | null;
}

export interface PremiumContextType {
  isPremium: boolean;
  currentPlan: PlanType;
  features: PlanFeatures;
  checkFeatureAccess: (feature: keyof PlanFeatures) => Promise<boolean>;
  getRemainingQuota: (
    feature: 'aiChatsPerDay' | 'pdfUploadsPerMonth',
  ) => Promise<number>;
  upgradePlan: (plan: PlanType) => Promise<boolean>;
}

export const PremiumContext = createContext<PremiumContextType | undefined>(
  undefined,
);
