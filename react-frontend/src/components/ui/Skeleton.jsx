/*
 * Skeleton screens — gray placeholder shapes with a subtle shimmer
 * (see `.skeleton` in index.css). Each preset mirrors the layout of the
 * real component it stands in for, so nothing jumps when data arrives.
 */

/** Base block. Size/shape it with Tailwind classes, e.g. "h-4 w-32 rounded-full". */
export function Skeleton({ className = '', style }) {
  return <div className={`skeleton rounded-md ${className}`} style={style} aria-hidden="true" />
}

/** Wrapper that tells assistive tech the region is loading. */
export function SkeletonGroup({ label = 'Loading…', className = '', children }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

// Varied widths make placeholder text look natural instead of a solid block
const WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-2/5', 'w-3/5']
const w = (i) => WIDTHS[i % WIDTHS.length]

/** Lines of text. */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-2/5' : w(i)}`} />
      ))}
    </div>
  )
}

/** Matches <Table>: header row + body rows with the same cell padding. */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <SkeletonGroup label="Loading table…" className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {Array.from({ length: cols }).map((_, j) => (
              <th key={j} className="px-4 py-3 text-left">
                <Skeleton className="h-2.5 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-50">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  {/* First column usually holds the primary label → a bit wider */}
                  <Skeleton className={`h-3.5 ${j === 0 ? 'w-40 max-w-full' : w(i + j)}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </SkeletonGroup>
  )
}

/** Matches <StatCard>. */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4" aria-hidden="true">
      <Skeleton className="w-11 h-11 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-2 pt-0.5">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-3.5 w-32 max-w-full" />
        <Skeleton className="h-2.5 w-24 max-w-full" />
      </div>
    </div>
  )
}

/** Card shell with an optional title bar, matching <Card>. */
export function CardSkeleton({ title = true, className = '', children }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Skeleton className="h-3.5 w-40" />
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

/** Label/value pairs, matching the <dl> grids on detail pages. */
export function FieldsSkeleton({ count = 12, className = 'grid grid-cols-2 sm:grid-cols-3 gap-5' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className={`h-4 ${w(i)}`} />
        </div>
      ))}
    </div>
  )
}

/** Rows like the gray list items used in detail tabs (permits, hazards, …). */
export function ListSkeleton({ rows = 3, badge = true }) {
  return (
    <SkeletonGroup className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 space-y-2">
            <Skeleton className={`h-3.5 ${w(i)}`} />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          {badge && <Skeleton className="h-5 w-16 rounded-full" />}
        </div>
      ))}
    </SkeletonGroup>
  )
}

/**
 * Detail page: header card (code, title, badges), tab bar, and a field grid.
 * Matches BuildingDetail / PermitDetail.
 */
export function DetailSkeleton({ tabs = 4, fields = 12, action = true }) {
  return (
    <SkeletonGroup label="Loading details…" className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-64 max-w-full" />
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {action && <Skeleton className="h-8 w-16 rounded-lg" />}
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1.5 overflow-hidden">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={i} className={`h-8 rounded-lg shrink-0 ${i === 0 ? 'w-24' : 'w-28'}`} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <FieldsSkeleton count={fields} />
      </div>
    </SkeletonGroup>
  )
}

/** One form field: label + input-height bar. */
function FieldSkeleton({ tall = false }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className={`${tall ? 'h-20' : 'h-[38px]'} w-full rounded-lg`} />
    </div>
  )
}

/**
 * Form page made of titled cards with field grids.
 * sections: [{ fields: 4, cols: 2, map: false, textarea: false }]
 */
export function FormSkeleton({ sections = [{ fields: 4 }], className = 'space-y-4 max-w-3xl' }) {
  return (
    <SkeletonGroup label="Loading form…" className={className}>
      {sections.map((s, i) => (
        <CardSkeleton key={i}>
          <div className={`grid grid-cols-1 ${s.cols === 1 ? '' : 'sm:grid-cols-2'} gap-4`}>
            {Array.from({ length: s.fields ?? 4 }).map((_, j) => <FieldSkeleton key={j} />)}
            {s.textarea && <div className="sm:col-span-2"><FieldSkeleton tall /></div>}
          </div>
          {s.map && <Skeleton className="mt-4 h-[260px] w-full rounded-lg" />}
        </CardSkeleton>
      ))}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </SkeletonGroup>
  )
}

/** Bar-chart placeholder: baseline + bars of varying height. */
export function ChartSkeleton({ height = 220, bars = 6 }) {
  const heights = ['55%', '80%', '40%', '70%', '30%', '62%', '48%', '75%']
  return (
    <div className="flex items-end gap-3 px-2 border-b border-gray-200" style={{ height }} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: heights[i % heights.length] }} />
      ))}
    </div>
  )
}

/** Horizontal progress bars (e.g. Permit Compliance on the Overview). */
export function BarsSkeleton({ rows = 4 }) {
  return (
    <SkeletonGroup className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-28 h-3 shrink-0" />
          <Skeleton className="flex-1 h-2 rounded-full" />
          <Skeleton className="w-6 h-3" />
        </div>
      ))}
    </SkeletonGroup>
  )
}
