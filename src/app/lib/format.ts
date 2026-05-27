export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2
  }).format(value);
}

export function formatPercent(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatPair(symbol: string) {
  return symbol.endsWith('USDT') ? `${symbol.slice(0, -4)}/USDT` : symbol;
}
