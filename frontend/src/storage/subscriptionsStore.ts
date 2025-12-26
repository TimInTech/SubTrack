import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subscription, BillingCycle } from '../types';

const STORAGE_KEY = 'subtrack.subscriptions.v1';

type CreatePayload = Omit<Subscription, 'id' | 'created_at'>;

const withExisting = async (): Promise<Subscription[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Subscription[];
  } catch {
    return [];
  }
};

const saveAll = async (items: Subscription[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const buildSubscription = (data: CreatePayload): Subscription => ({
  ...data,
  id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  created_at: new Date().toISOString(),
});

export const loadAll = async (): Promise<Subscription[]> => {
  return withExisting();
};

export const findOne = async (id: string): Promise<Subscription | null> => {
  const list = await withExisting();
  return list.find((item) => item.id === id) || null;
};

export const createLocal = async (data: CreatePayload): Promise<Subscription[]> => {
  const list = await withExisting();
  const next = buildSubscription(data);
  const updated = [next, ...list];
  await saveAll(updated);
  return updated;
};

export const updateLocal = async (
  id: string,
  data: Partial<Subscription>
): Promise<Subscription[]> => {
  const list = await withExisting();
  const updated = list.map((item) => (item.id === id ? { ...item, ...data } : item));
  await saveAll(updated);
  return updated;
};

export const removeLocal = async (id: string): Promise<Subscription[]> => {
  const list = await withExisting();
  const updated = list.filter((item) => item.id !== id);
  await saveAll(updated);
  return updated;
};

export const seedFromPresets = async (
  presets: { name: string; category: string; amount_cents: number; billing_cycle: BillingCycle }[]
) => {
  const existing = await withExisting();
  if (existing.length > 0) return;
  const seeded = presets.map((preset) =>
    buildSubscription({
      ...preset,
      start_date: new Date().toISOString().split('T')[0],
    })
  );
  await saveAll(seeded);
};
