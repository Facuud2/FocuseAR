import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type PlanType = 'free' | 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionPlan {
  type: PlanType;
  startDate: Date;
  endDate?: Date;
  active: boolean;
  features: string[];
}

export interface PlanFeatures {
  aiChatsPerDay: number;
  pdfUploadsPerMonth: number;
  customStudyPlans: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  teamCollaboration: boolean;
  customIntegrations: boolean;
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    aiChatsPerDay: 5,
    pdfUploadsPerMonth: 3,
    customStudyPlans: false,
    prioritySupport: false,
    advancedAnalytics: false,
    teamCollaboration: false,
    customIntegrations: false,
  },
  monthly: {
    aiChatsPerDay: 50,
    pdfUploadsPerMonth: 100,
    customStudyPlans: true,
    prioritySupport: false,
    advancedAnalytics: true,
    teamCollaboration: false,
    customIntegrations: false,
  },
  annual: {
    aiChatsPerDay: 100,
    pdfUploadsPerMonth: 500,
    customStudyPlans: true,
    prioritySupport: true,
    advancedAnalytics: true,
    teamCollaboration: true,
    customIntegrations: false,
  },
  lifetime: {
    aiChatsPerDay: -1,
    pdfUploadsPerMonth: -1,
    customStudyPlans: true,
    prioritySupport: true,
    advancedAnalytics: true,
    teamCollaboration: true,
    customIntegrations: true,
  },
};

export class SubscriptionService {
  readonly PLAN_FEATURES = PLAN_FEATURES;

  async getCurrentPlan(): Promise<SubscriptionPlan | null> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return (
      userDoc.data()?.subscription || {
        type: 'free' as PlanType,
        active: true,
        startDate: new Date(),
        features: [],
      }
    );
  }

  async activateTemporaryPremium(): Promise<boolean> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return false;

    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // Premium por 1 año

      const subscription: SubscriptionPlan = {
        type: 'lifetime',
        startDate,
        endDate,
        active: true,
        features: Object.keys(PLAN_FEATURES.lifetime) as Array<
          keyof PlanFeatures
        >,
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { subscription }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error activating temporary premium:', error);
      return false;
    }
  }

  async upgradePlan(planType: PlanType): Promise<boolean> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return false;

    try {
      const startDate = new Date();
      let endDate: Date | undefined;

      if (planType === 'monthly') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'annual') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription: SubscriptionPlan = {
        type: planType,
        startDate,
        endDate,
        active: true,
        features: Object.entries(this.PLAN_FEATURES[planType])
          .filter(
            ([, value]) =>
              value === true || (typeof value === 'number' && value > 0),
          )
          .map(([key]) => key),
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { subscription });

      return true;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return false;
    }
  }

  async checkFeatureAccess(feature: keyof PlanFeatures): Promise<boolean> {
    const currentPlan = await this.getCurrentPlan();
    if (!currentPlan || !currentPlan.active) return false;

    return currentPlan.features.includes(feature);
  }

  async getRemainingQuota(
    feature: 'aiChatsPerDay' | 'pdfUploadsPerMonth',
  ): Promise<number> {
    const currentPlan = await this.getCurrentPlan();
    if (!currentPlan || !currentPlan.active) return 0;

    const quota = this.PLAN_FEATURES[currentPlan.type][feature];
    if (quota === -1) return Infinity;

    return quota;
  }
}

export const subscriptionService = new SubscriptionService();
