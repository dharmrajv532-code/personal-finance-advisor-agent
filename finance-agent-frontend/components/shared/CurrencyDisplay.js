import { cn, formatINR } from '@/lib/utils';

export default function CurrencyDisplay({ amount, size = 'base', color, showSign = false }) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  
  let prefix = '';
  if (showSign) {
    if (isPositive) prefix = '+ ';
    if (isNegative) prefix = '- ';
  }

  const absoluteAmount = Math.abs(amount || 0);
  const formatted = formatINR(absoluteAmount);

  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl font-bold',
    '3xl': 'text-3xl font-bold',
    '4xl': 'text-4xl font-extrabold',
  };

  let colorClass = 'text-foreground';
  if (color === 'emerald' || (color === 'auto' && isPositive)) {
    colorClass = 'text-success';
  } else if (color === 'red' || (color === 'auto' && isNegative)) {
    colorClass = 'text-danger';
  } else if (color === 'indigo') {
    colorClass = 'text-primary';
  } else if (color === 'muted') {
    colorClass = 'text-muted-foreground';
  }

  return (
    <span className={cn('font-mono font-semibold font-tabular', sizeStyles[size] || sizeStyles.base, colorClass)}>
      {prefix}{formatted}
    </span>
  );
}