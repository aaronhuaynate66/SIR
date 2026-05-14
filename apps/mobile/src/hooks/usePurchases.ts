import { useCallback, useEffect, useState } from 'react';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

const ENTITLEMENT_PRO = 'pro';

export interface PurchasesState {
  isPro: boolean;
  loading: boolean;
  packages: PurchasesPackage[];
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

function isPro(info: CustomerInfo): boolean {
  return !!info.entitlements.active[ENTITLEMENT_PRO];
}

export function usePurchases(): PurchasesState {
  const [loading, setLoading] = useState(true);
  const [proActive, setProActive] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    const apiKey = process.env['EXPO_PUBLIC_REVENUECAT_API_KEY'] ?? '';
    if (!apiKey) { setLoading(false); return; }

    Purchases.configure({ apiKey });

    Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings(),
    ]).then(([info, offerings]) => {
      setProActive(isPro(info));
      setPackages(offerings.current?.availablePackages ?? []);
    }).catch(() => undefined).finally(() => setLoading(false));

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setProActive(isPro(info));
    });

    return () => { listener.remove(); };
  }, []);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = isPro(customerInfo);
      setProActive(active);
      return active;
    } catch {
      return false;
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      const active = isPro(info);
      setProActive(active);
      return active;
    } catch {
      return false;
    }
  }, []);

  return { isPro: proActive, loading, packages, purchase, restore };
}
