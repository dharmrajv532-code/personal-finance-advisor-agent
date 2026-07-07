import { cn } from '@/lib/utils';

export function CardSkeleton({ className }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-6 h-32 animate-shimmer", className)} />
  );
}

export function StatsRowSkeleton({ count = 3, className }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-6 h-80 flex flex-col justify-between animate-shimmer", className)}>
      <div className="h-6 bg-background-secondary rounded w-1/4" />
      <div className="flex-1 flex items-end gap-4 mt-6">
        <div className="h-[20%] bg-background-secondary rounded w-full" />
        <div className="h-[60%] bg-background-secondary rounded w-full" />
        <div className="h-[40%] bg-background-secondary rounded w-full" />
        <div className="h-[80%] bg-background-secondary rounded w-full" />
        <div className="h-[55%] bg-background-secondary rounded w-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden p-6 space-y-4", className)}>
      <div className="h-6 bg-background-secondary rounded w-1/5 animate-shimmer" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-10 bg-background-secondary rounded w-full animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}