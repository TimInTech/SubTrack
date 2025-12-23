/**
 * Format cents to EUR currency string
 */
export const formatCurrency = (cents: number): string => {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
};

/**
 * Format large numbers with K/M suffix
 */
export const formatCompact = (cents: number): string => {
  const euros = cents / 100;
  if (euros >= 1000000) {
    return (euros / 1000000).toFixed(1).replace('.', ',') + 'M €';
  }
  if (euros >= 1000) {
    return (euros / 1000).toFixed(1).replace('.', ',') + 'K €';
  }
  return formatCurrency(cents);
};

/**
 * Parse EUR string to cents
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
};

/**
 * Format date string to German format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Get billing cycle label
 */
export const getBillingCycleLabel = (cycle: 'MONTHLY' | 'YEARLY'): string => {
  return cycle === 'MONTHLY' ? 'monatlich' : 'jährlich';
};

/**
 * Get billing cycle short label
 */
export const getBillingCycleShort = (cycle: 'MONTHLY' | 'YEARLY'): string => {
  return cycle === 'MONTHLY' ? '/Monat' : '/Jahr';
};
