import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, FileWarning, CalendarClock, ClipboardList, TriangleAlert, CheckCheck, BellOff } from 'lucide-react'
import { notificationService } from '../services/notifications'
import { Skeleton, SkeletonGroup } from './ui/Skeleton'
import { formatDate } from '../utils/formatters'

const QUERY_KEY = ['notifications']

const TYPE_STYLE = {
  permit_expired:   { icon: FileWarning,   bg: 'bg-red-50',    fg: 'text-red-600' },
  permit_expiring:  { icon: CalendarClock, bg: 'bg-amber-50',  fg: 'text-amber-600' },
  finding_open:     { icon: ClipboardList, bg: 'bg-orange-50', fg: 'text-orange-600' },
  buildings_review: { icon: ClipboardList, bg: 'bg-blue-50',   fg: 'text-blue-600' },
  high_risk:        { icon: TriangleAlert, bg: 'bg-red-50',    fg: 'text-red-600' },
}

function NotificationItem({ n, onOpen }) {
  const s = TYPE_STYLE[n.type] || TYPE_STYLE.buildings_review
  const Icon = s.icon
  return (
    <button
      onClick={() => onOpen(n)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${n.read ? '' : 'bg-blue-50/40'}`}
    >
      <span className={`w-8 h-8 rounded-lg ${s.bg} ${s.fg} flex items-center justify-center shrink-0`}>
        <Icon size={15} />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-text-dark font-medium'}`}>{n.title}</span>
        <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</span>
        {n.date && <span className="block text-[11px] text-gray-400 mt-1">{formatDate(n.date)}</span>}
      </span>
      {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" aria-label="Unread" />}
    </button>
  )
}

function ListSkeleton() {
  return (
    <SkeletonGroup label="Loading notifications…">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Skeleton className={`h-3.5 ${i % 2 ? 'w-2/3' : 'w-5/6'}`} />
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
}

/**
 * Bell button in the page header with an unread badge and a dropdown list.
 * Notifications come from the API (expired permits, open findings, …) and refresh every minute.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: notificationService.list,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  const items = data?.data || []
  const unread = data?.unread_count || 0

  // Optimistically flip read flags so the badge updates instantly
  const setRead = (ids) => queryClient.setQueryData(QUERY_KEY, (old) => {
    if (!old) return old
    const set = ids === 'all' ? null : new Set(ids)
    const list = old.data.map(n => (set === null || set.has(n.id)) ? { ...n, read: true } : n)
    return { ...old, data: list, unread_count: list.filter(n => !n.read).length }
  })

  const markRead = useMutation({
    mutationFn: (ids) => notificationService.markRead(ids),
    onMutate: (ids) => setRead(ids),
    onError: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: () => setRead('all'),
    onError: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const openItem = (n) => {
    if (!n.read) markRead.mutate([n.id])
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2 rounded-lg transition-colors ${open ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-4 text-center ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-1 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-semibold text-text-dark">
              Notifications
              {unread > 0 && <span className="ml-1.5 text-xs font-medium text-gray-400">{unread} unread</span>}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-blue-700"
              >
                <CheckCheck size={13} /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[min(420px,calc(100vh-140px))] overflow-y-auto divide-y divide-gray-50">
            {isLoading ? <ListSkeleton /> : isError ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Couldn't load notifications.</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-gray-400">
                <BellOff size={22} />
                <p className="text-sm">You're all caught up.</p>
              </div>
            ) : (
              items.map(n => <NotificationItem key={n.id} n={n} onOpen={openItem} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
