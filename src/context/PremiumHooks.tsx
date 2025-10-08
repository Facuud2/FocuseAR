import { useContext } from 'react';
import { PremiumContext } from './PremiumContextTypes';

export const usePremium = () => {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return ctx;
};

export default usePremium;
