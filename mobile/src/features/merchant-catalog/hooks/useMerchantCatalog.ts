import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchActiveProducts,
  fetchMerchantBranches,
  resolveMerchantBranch,
} from '../services/merchantCatalogService';
import type { ActiveProduct, MerchantBranch } from '../types/catalog';
import { setBasketMerchantContext } from '../../basket/store/basketStore';

type MerchantCatalogState = {
  loading: boolean;
  errorKey: string | null;
  branch: MerchantBranch | null;
  products: ActiveProduct[];
};

export function useMerchantCatalog(params: {
  merchantId?: string;
  merchantName?: string;
}) {
  const { merchantId, merchantName } = params;
  const [state, setState] = useState<MerchantCatalogState>({
    loading: true,
    errorKey: null,
    branch: null,
    products: [],
  });

  const loadCatalog = useCallback(async () => {
    if (!merchantId) {
      setState({
        loading: false,
        errorKey: 'merchant_unavailable',
        branch: null,
        products: [],
      });
      return;
    }

    setState((current) => ({ ...current, loading: true, errorKey: null }));
    try {
      const branches = await fetchMerchantBranches(merchantId);
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          coords = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
        }
      } catch {
        coords = undefined;
      }

      const branch = resolveMerchantBranch(branches, coords);
      if (!branch) {
        setState({
          loading: false,
          errorKey: 'merchant_branch_unavailable',
          branch: null,
          products: [],
        });
        return;
      }

      const products = await fetchActiveProducts(merchantId, branch.branchId);
      setBasketMerchantContext({
        merchantId,
        merchantName: merchantName ?? 'Merchant',
        branchId: branch.branchId,
        branchName: branch.name,
      });
      setState({
        loading: false,
        errorKey: null,
        branch,
        products,
      });
    } catch {
      setState({
        loading: false,
        errorKey: 'merchant_catalog_load_failed',
        branch: null,
        products: [],
      });
    }
  }, [merchantId, merchantName]);

  useFocusEffect(useCallback(() => {
    void loadCatalog();
  }, [loadCatalog]));

  return {
    loading: state.loading,
    errorKey: state.errorKey,
    branch: state.branch,
    products: state.products,
    retry: loadCatalog,
  };
}
