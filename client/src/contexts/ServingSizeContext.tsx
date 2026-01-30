import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { auth } from "@/lib/firebase";
import {
  getServingSizeOverrides,
  saveServingSizeOverride,
  deleteServingSizeOverride,
} from "@/services/db";
import type { ServingSizeOverride } from "@/types";

type ServingSizeContextType = {
  overrides: Map<string, ServingSizeOverride>;
  loading: boolean;
  getCustomServing: (foodId: string, defaultServing: string) => string;
  saveOverride: (foodId: string, foodName: string, customServingSize: string) => Promise<void>;
  deleteOverride: (foodId: string) => Promise<void>;
  hasOverride: (foodId: string) => boolean;
};

const ServingSizeContext = createContext<ServingSizeContextType | null>(null);

export function ServingSizeProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Map<string, ServingSizeOverride>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setOverrides(new Map());
      setLoading(false);
      return;
    }

    getServingSizeOverrides(user.uid)
      .then((data) => {
        setOverrides(data);
      })
      .catch((error) => {
        console.error("Failed to load serving size overrides:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getCustomServing = useCallback(
    (foodId: string, defaultServing: string): string => {
      const override = overrides.get(foodId);
      return override?.customServingSize || defaultServing;
    },
    [overrides]
  );

  const saveOverride = useCallback(
    async (foodId: string, foodName: string, customServingSize: string): Promise<void> => {
      const user = auth.currentUser;
      if (!user) return;

      await saveServingSizeOverride(user.uid, foodId, foodName, customServingSize);

      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(foodId, {
          foodId,
          foodName,
          customServingSize,
          updatedAt: new Date(),
        });
        return next;
      });
    },
    []
  );

  const deleteOverride = useCallback(async (foodId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    await deleteServingSizeOverride(user.uid, foodId);

    setOverrides((prev) => {
      const next = new Map(prev);
      next.delete(foodId);
      return next;
    });
  }, []);

  const hasOverride = useCallback(
    (foodId: string): boolean => {
      return overrides.has(foodId);
    },
    [overrides]
  );

  return (
    <ServingSizeContext.Provider
      value={{
        overrides,
        loading,
        getCustomServing,
        saveOverride,
        deleteOverride,
        hasOverride,
      }}
    >
      {children}
    </ServingSizeContext.Provider>
  );
}

export function useServingSizeOverrides() {
  const context = useContext(ServingSizeContext);
  if (!context) {
    throw new Error("useServingSizeOverrides must be used within a ServingSizeProvider");
  }
  return context;
}
