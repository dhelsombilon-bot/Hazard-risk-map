import { TableSkeleton } from './Skeleton'

export function Table({ columns, data, loading, emptyMessage = 'No records found.' }) {
  if (loading) return <TableSkeleton rows={5} cols={columns.length} />
  if (!data?.length) return <EmptyState message={emptyMessage} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Kept as `Skeleton` so existing `import { Skeleton } from '…/Table'` keeps working
export { TableSkeleton as Skeleton } from './Skeleton'

export function EmptyState({ message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-4xl mb-2">🗂️</div>
      <p className="text-sm">{message}</p>
    </div>
  )
}
