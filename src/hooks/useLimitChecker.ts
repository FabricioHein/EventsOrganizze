import { useMemo } from 'react';
import { usePlanLimits } from './usePlanLimits';
import { useData } from '../contexts/DataContext';

export const useLimitChecker = () => {
  const { maxProposals, maxSuppliers, maxReports } = usePlanLimits();
  const { events, payments, clients, products, guests } = useData();

  return useMemo(() => {
    // Count current usage
    const currentProposals = 0; // You'll need to implement getProposals count
    const currentSuppliers = 0; // You'll need to implement getSuppliers count
    const currentReports = 0; // Track report generations

    const checkLimit = (featureType: 'proposals' | 'suppliers' | 'reports') => {
      const limits = {
        proposals: { current: currentProposals, max: maxProposals },
        suppliers: { current: currentSuppliers, max: maxSuppliers },
        reports: { current: currentReports, max: maxReports }
      };

      const limit = limits[featureType];
      
      // -1 means unlimited
      if (limit.max === -1) return { canUse: true, isAtLimit: false, current: limit.current, max: limit.max };
      
      return {
        canUse: limit.current < limit.max,
        isAtLimit: limit.current >= limit.max,
        current: limit.current,
        max: limit.max
      };
    };

    return {
      checkLimit,
      proposalsLimit: checkLimit('proposals'),
      suppliersLimit: checkLimit('suppliers'),
      reportsLimit: checkLimit('reports')
    };
  }, [maxProposals, maxSuppliers, maxReports, events, payments, clients, products, guests]);
};