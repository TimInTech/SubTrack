import { ServicePreset } from '../types';

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Musik',
    icon: 'spotify',
    color: '#1DB954',
    plans: [
      { name: 'Spotify Individual', amount_cents: 1099, billing_cycle: 'MONTHLY' },
      { name: 'Spotify Duo', amount_cents: 1499, billing_cycle: 'MONTHLY' },
      { name: 'Spotify Family', amount_cents: 1799, billing_cycle: 'MONTHLY' },
      { name: 'Spotify Student', amount_cents: 599, billing_cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Streaming',
    icon: 'netflix',
    color: '#E50914',
    plans: [
      { name: 'Netflix Basis', amount_cents: 799, billing_cycle: 'MONTHLY' },
      { name: 'Netflix Standard', amount_cents: 1299, billing_cycle: 'MONTHLY' },
      { name: 'Netflix Premium', amount_cents: 1799, billing_cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    category: 'Shopping',
    icon: 'amazon',
    color: '#FF9900',
    plans: [
      { name: 'Amazon Prime', amount_cents: 999, billing_cycle: 'MONTHLY' },
      { name: 'Amazon Prime', amount_cents: 8990, billing_cycle: 'YEARLY' },
    ],
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    category: 'Streaming',
    icon: 'movie-star',
    color: '#113CCF',
    plans: [
      { name: 'Disney+ Standard', amount_cents: 899, billing_cycle: 'MONTHLY' },
      { name: 'Disney+ Premium', amount_cents: 1199, billing_cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'Streaming',
    icon: 'youtube',
    color: '#FF0000',
    plans: [
      { name: 'YouTube Premium', amount_cents: 1199, billing_cycle: 'MONTHLY' },
      { name: 'YouTube Premium Family', amount_cents: 1799, billing_cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'Musik',
    icon: 'apple',
    color: '#FC3C44',
    plans: [
      { name: 'Apple Music Individual', amount_cents: 1099, billing_cycle: 'MONTHLY' },
      { name: 'Apple Music Family', amount_cents: 1699, billing_cycle: 'MONTHLY' },
      { name: 'Apple Music Student', amount_cents: 599, billing_cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'office-365',
    name: 'Microsoft 365',
    category: 'Software',
    icon: 'microsoft',
    color: '#00A4EF',
    plans: [
      { name: 'Microsoft 365 Personal', amount_cents: 700, billing_cycle: 'MONTHLY' },
      { name: 'Microsoft 365 Family', amount_cents: 1000, billing_cycle: 'MONTHLY' },
      { name: 'Microsoft 365 Personal', amount_cents: 6900, billing_cycle: 'YEARLY' },
      { name: 'Microsoft 365 Family', amount_cents: 9900, billing_cycle: 'YEARLY' },
    ],
  },
  {
    id: 'icloud',
    name: 'iCloud+',
    category: 'Cloud',
    icon: 'cloud',
    color: '#3693F3',
    plans: [
      { name: 'iCloud+ 50GB', amount_cents: 99, billing_cycle: 'MONTHLY' },
      { name: 'iCloud+ 200GB', amount_cents: 299, billing_cycle: 'MONTHLY' },
      { name: 'iCloud+ 2TB', amount_cents: 999, billing_cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'gym',
    name: 'Fitnessstudio',
    category: 'Fitness',
    icon: 'dumbbell',
    color: '#FF6B6B',
    plans: [
      { name: 'Fitnessstudio Basis', amount_cents: 1999, billing_cycle: 'MONTHLY' },
      { name: 'Fitnessstudio Premium', amount_cents: 3999, billing_cycle: 'MONTHLY' },
    ],
  },
  {
    id: 'mobile',
    name: 'Mobilfunk',
    category: 'Kommunikation',
    icon: 'cellphone',
    color: '#9B59B6',
    plans: [
      { name: 'Mobilfunk Basis', amount_cents: 999, billing_cycle: 'MONTHLY' },
      { name: 'Mobilfunk Comfort', amount_cents: 1999, billing_cycle: 'MONTHLY' },
      { name: 'Mobilfunk Premium', amount_cents: 3999, billing_cycle: 'MONTHLY' },
    ],
  },
];

export const SUBSCRIPTION_CATEGORIES = [
  'Streaming',
  'Musik',
  'Software',
  'Cloud',
  'Gaming',
  'News',
  'Fitness',
  'Shopping',
  'Kommunikation',
  'Sonstiges',
];

export const EXPENSE_CATEGORIES = [
  'Wohnen',
  'Versicherung',
  'Kommunikation',
  'Mobilität',
  'Gesundheit',
  'Bildung',
  'Sonstiges',
];
