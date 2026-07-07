import { cn } from '@/lib/utils';
import CurrencyDisplay from './CurrencyDisplay';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'indigo',
  trend,
  trendValue,
  isCurrency = true,
}) {
  const iconColorStyles = {
    indigo: 'bg-primary/10 text-primary',
    emerald: 'bg-success/10 text-success',
    red: 'bg-danger/10 text-danger',
    amber: 'bg-warning/10 text-warning',
    blue: 'bg-info/10 text-info',
    purple: 'bg-secondary/10 text-secondary',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 select-none">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div className={cn('p-2 rounded-lg shrink-0', iconColorStyles[iconColor] || iconColorStyles.indigo)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        {isCurrency ? (
          <CurrencyDisplay amount={value} size="3xl" />
        ) : (
          <span className="text-3xl font-bold font-mono font-tabular text-foreground">{value}</span>
        )}
      </div>

      {(trend || trendValue || subtitle) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={cn(
                'font-semibold',
                trend === 'up' ? 'text-success' : 'text-danger'
              )}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
          {!trend && trendValue && <span className="text-muted-foreground">{trendValue}</span>}
          {subtitle && (
            <span className="text-muted-foreground truncate">
              {trend || trendValue ? ' ' + subtitle : subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}