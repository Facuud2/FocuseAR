import React, { useContext, useState, useEffect } from 'react';
import { subscriptionService } from '../services/SubscriptionService';
import type { PlanType, PlanFeatures } from '../services/SubscriptionService';
import type { User } from 'firebase/auth';
import { PremiumContext } from './PremiumContextTypes';

interface AuthContextType {
  user: User | null;
}

const AuthContext = React.createContext<AuthContextType>({ user: null });
const useAuth = () => useContext(AuthContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [features, setFeatures] = useState<PlanFeatures>({
    aiChatsPerDay: 5,
    pdfUploadsPerMonth: 3,
    customStudyPlans: false,
    prioritySupport: false,
    advancedAnalytics: false,
    teamCollaboration: false,
    customIntegrations: false,
  });

  useEffect(() => {
    const loadSubscription = async () => {
      if (user) {
        const plan = await subscriptionService.getCurrentPlan();
        if (plan) {
          setCurrentPlan(plan.type);
          setIsPremium(plan.type !== 'free' && plan.active);
          // Actualizar características según el plan
          const planFeatures = subscriptionService.PLAN_FEATURES[plan.type];
          setFeatures(planFeatures);
        }
      }
    };

    loadSubscription();
  }, [user]);

  const checkFeatureAccess = async (feature: keyof PlanFeatures) => {
    return subscriptionService.checkFeatureAccess(feature);
  };

  const getRemainingQuota = async (
    feature: 'aiChatsPerDay' | 'pdfUploadsPerMonth',
  ) => {
    return subscriptionService.getRemainingQuota(feature);
  };

  const upgradePlan = async (plan: PlanType) => {
    const success = await subscriptionService.upgradePlan(plan);
    if (success) {
      setCurrentPlan(plan);
      setIsPremium(plan !== 'free');
      setFeatures(subscriptionService.PLAN_FEATURES[plan]);
    }
    return success;
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        currentPlan,
        features,
        checkFeatureAccess,
        getRemainingQuota,
        upgradePlan,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};
