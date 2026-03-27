export function formatNumber(value, options = {}) {
  const { decimals = 2, currency = false, compact = false } = options;

  if (compact && Math.abs(value) >= 1000) {
    const units = ["", "K", "M", "B", "T"];
    const order = Math.floor(Math.log10(Math.abs(value)) / 3);
    const unitname = units[order];
    const num = value / Math.pow(1000, order);

    return currency
      ? `$${num.toFixed(decimals)}${unitname}`
      : `${num.toFixed(decimals)}${unitname}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return currency ? `$${formatted}` : formatted;
}

export function formatCurrency(value, compact = false) {
  return formatNumber(value, { currency: true, decimals: 2, compact });
}

export function formatInteger(value, compact = false) {
  return formatNumber(value, { decimals: 0, compact });
}

export function formatPercentage(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCompact(value) {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}
