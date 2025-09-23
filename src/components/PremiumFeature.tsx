import React from 'react';
import { usePremium } from '../context/PremiumHooks';
import type { PlanFeatures } from '../services/SubscriptionService';

interface PremiumFeatureProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  feature,
  children,
  fallback,
}) => {
  const { checkFeatureAccess } = usePremium();
  const [hasAccess, setHasAccess] = React.useState(false);

  React.useEffect(() => {
    const checkAccess = async () => {
      const access = await checkFeatureAccess(feature as keyof PlanFeatures);
      setHasAccess(access);
    };
    checkAccess();
  }, [feature, checkFeatureAccess]);

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="premium-feature-locked">
        <div className="premium-overlay">
          <h3>Característica Premium</h3>
          <p>Actualiza tu plan para acceder a esta función</p>
          <button
            className="upgrade-button"
            onClick={() => {
              // Navegar a la página de planes o mostrar modal
              window.location.href = '/settings?tab=membership';
            }}
          >
            Actualizar Plan
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const QuotaLimit: React.FC<{
  feature: 'aiChatsPerDay' | 'pdfUploadsPerMonth';
  children: (remaining: number) => React.ReactNode;
}> = ({ feature, children }) => {
  const { getRemainingQuota } = usePremium();
  const [remaining, setRemaining] = React.useState<number>(0);

  React.useEffect(() => {
    const checkQuota = async () => {
      const quota = await getRemainingQuota(feature);
      setRemaining(quota);
    };
    checkQuota();
  }, [feature, getRemainingQuota]);

  return <>{children(remaining)}</>;
};
