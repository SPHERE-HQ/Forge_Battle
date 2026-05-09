import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from "react";
import {
  STORAGE_KEY_CURRENCY,
  VRX_PER_BATTLE_BASE,
  VRX_PER_KILL,
  VRX_PER_ASSIST,
} from "../constants/game";

export interface CurrencyState {
  vrx:  number;
  aths: number;
}

interface CurrencyCtx {
  currency:        CurrencyState;
  addVrxBattle:    (kills: number, assists: number) => void;
  addAths:         (amount: number) => void;
  spendAths:       (amount: number) => boolean;
  spendVrx:        (amount: number) => boolean;
  buyVrxWithAths:  (vrxAmount: number, athsCost: number) => boolean;
}

const DEFAULT_CURRENCY: CurrencyState = { vrx: 0, aths: 0 };

function loadCurrency(): CurrencyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (raw) return { ...DEFAULT_CURRENCY, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CURRENCY;
}

function persist(next: CurrencyState) {
  localStorage.setItem(STORAGE_KEY_CURRENCY, JSON.stringify(next));
}

const CurrencyContext = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyState>(loadCurrency);

  const addVrxBattle = useCallback((kills: number, assists: number) => {
    setCurrency(s => {
      const earned = VRX_PER_BATTLE_BASE + kills * VRX_PER_KILL + assists * VRX_PER_ASSIST;
      const next   = { ...s, vrx: s.vrx + earned };
      persist(next);
      return next;
    });
  }, []);

  const addAths = useCallback((amount: number) => {
    setCurrency(s => {
      const next = { ...s, aths: s.aths + amount };
      persist(next);
      return next;
    });
  }, []);

  const spendAths = useCallback((amount: number): boolean => {
    let ok = false;
    setCurrency(s => {
      if (s.aths < amount) return s;
      ok   = true;
      const next = { ...s, aths: s.aths - amount };
      persist(next);
      return next;
    });
    return ok;
  }, []);

  const spendVrx = useCallback((amount: number): boolean => {
    let ok = false;
    setCurrency(s => {
      if (s.vrx < amount) return s;
      ok   = true;
      const next = { ...s, vrx: s.vrx - amount };
      persist(next);
      return next;
    });
    return ok;
  }, []);

  const buyVrxWithAths = useCallback((vrxAmount: number, athsCost: number): boolean => {
    let ok = false;
    setCurrency(s => {
      if (s.aths < athsCost) return s;
      ok   = true;
      const next = { ...s, aths: s.aths - athsCost, vrx: s.vrx + vrxAmount };
      persist(next);
      return next;
    });
    return ok;
  }, []);

  return (
    <CurrencyContext.Provider
      value={{ currency, addVrxBattle, addAths, spendAths, spendVrx, buyVrxWithAths }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be inside CurrencyProvider");
  return ctx;
}
