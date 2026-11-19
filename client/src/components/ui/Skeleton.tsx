import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface p-3 shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="mt-3.5 space-y-2.5 px-1">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function BentoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="rounded-2xl border border-hairline bg-surface p-6 lg:col-span-6 lg:row-span-2">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="mt-4 h-9 w-3/4" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-6 h-44 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-hairline bg-surface p-5 lg:col-span-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-6 w-3/4" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-hairline bg-surface p-5 lg:col-span-3 lg:row-span-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-7 w-4/5" />
        <Skeleton className="mt-4 h-52 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-hairline bg-surface p-5 lg:col-span-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-6 w-2/3" />
        <Skeleton className="mt-3 h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function OrderTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between gap-3 rounded-xl border border-hairline bg-surface p-4 sm:flex-row sm:items-center"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4 max-w-md" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModalDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function StatsKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-hairline bg-surface p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-36" />
          <Skeleton className="mt-2 h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}
