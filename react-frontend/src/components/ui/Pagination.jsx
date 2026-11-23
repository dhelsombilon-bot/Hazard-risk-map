import Button from './Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  const { current_page, last_page, total, per_page } = meta
  const from = (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
      <span>Showing {from}–{to} of {total} records</span>
      <div className="flex gap-1">
        <Button variant="secondary" size="sm" disabled={current_page <= 1} onClick={() => onPage(current_page - 1)}>
          <ChevronLeft size={14} /> Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={current_page >= last_page} onClick={() => onPage(current_page + 1)}>
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
