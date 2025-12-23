// ===== API Types =====
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amount_cents: number;
  billing_cycle: BillingCycle;
  start_date: string;
  notes?: string;
  cancel_url?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount_cents: number;
  billing_cycle: BillingCycle;
  notes?: string;
  created_at?: string;
}

export interface DashboardData {
  monthly_subscriptions: number;
  monthly_expenses: number;
  total_monthly: number;
  yearly_total: number;
  subscription_count: number;
  expense_count: number;
}

// ===== Preset Types =====
export interface ServicePreset {
  id: string;
  name: string;
  category: string;
  plans: PlanOption[];
  icon: string;
  color: string;
}

export interface PlanOption {
  name: string;
  amount_cents: number;
  billing_cycle: BillingCycle;
}

// ===== Form Types =====
export interface SubscriptionFormData {
  name: string;
  category: string;
  amount: string;
  billing_cycle: BillingCycle;
  start_date: string;
  notes: string;
  cancel_url: string;
}

export interface ExpenseFormData {
  name: string;
  category: string;
  amount: string;
  billing_cycle: BillingCycle;
  notes: string;
}

// ===== Chart Types =====
export interface PieChartItem {
  value: number;
  color: string;
  text: string;
  label: string;
}
