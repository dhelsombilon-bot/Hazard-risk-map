import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, UserX, UserCheck, Eye, EyeOff } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Table, Skeleton } from '../../components/ui/Table'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/users'
import { lookupService } from '../../services/lookups'
import { formatDate, initials } from '../../utils/formatters'

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Message from a Laravel error response, if any */
const apiMessage = (err) => err?.response?.data?.message

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-red-500 mt-0.5">{error}</p> : hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}

function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input className={`${inputCls} pr-9`} type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder="••••••••" autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute inset-y-0 right-0 px-2.5 text-gray-400 hover:text-gray-600" tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

/* Rendered only while open, keyed by user — so the form always starts from the right values */
function UserForm({ user, roles, isSelf, onClose }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const isEdit = !!user
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    role_id: user?.role_id ? String(user.role_id) : '',
    is_active: user?.is_active ?? true,
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? userService.update(user.user_id, data) : userService.create(data),
    onSuccess: (saved) => {
      toast({ message: isEdit ? `${saved?.first_name ?? 'User'} updated.` : `${saved?.first_name ?? 'User'} added.` })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err) => {
      if (err?.response?.status === 422 && err.response.data.errors) {
        setErrors(Object.fromEntries(Object.entries(err.response.data.errors).map(([k, v]) => [k, v[0]])))
      } else {
        toast({ message: apiMessage(err) || 'Failed to save user.', type: 'error' })
      }
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required.'
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.'
    if (!form.role_id) errs.role_id = 'Select a role.'
    if (!isEdit && !form.password) errs.password = 'Password is required.'
    else if (form.password && form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (form.password && form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      role_id: Number(form.role_id),
    }
    if (form.password) {
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }
    // Own role/status can't be changed (backend enforces this too)
    if (isEdit && isSelf) delete payload.role_id
    if (isEdit && !isSelf) payload.is_active = form.is_active
    mutation.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="First Name" required error={errors.first_name}>
          <input className={inputCls} value={form.first_name} onChange={e => set('first_name', e.target.value)} autoFocus />
        </Field>
        <Field label="Last Name" required error={errors.last_name}>
          <input className={inputCls} value={form.last_name} onChange={e => set('last_name', e.target.value)} />
        </Field>
      </div>

      <Field label="Email" required error={errors.email}>
        <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="off" />
      </Field>

      <Field label="Role" required error={errors.role_id} hint={isSelf ? 'You cannot change your own role.' : null}>
        <select className={inputCls} value={form.role_id} onChange={e => set('role_id', e.target.value)} disabled={isSelf}>
          <option value="">Select role…</option>
          {roles?.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
        </select>
      </Field>

      {isEdit && !isSelf && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
          <div>
            <div className="text-sm font-medium text-gray-700">Account active</div>
            <div className="text-[11px] text-gray-400">Inactive users cannot log in.</div>
          </div>
          <label className="relative inline-flex cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
            <span className="w-9 h-5 rounded-full bg-gray-300 peer-checked:bg-blue-600 transition-colors
              after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
          </label>
        </div>
      )}

      <div className={isEdit ? 'pt-3 border-t border-gray-100 space-y-4' : 'space-y-4'}>
        {isEdit && <p className="text-xs text-gray-500">Leave the password blank to keep the current one.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={isEdit ? 'New Password' : 'Password'} required={!isEdit} error={errors.password} hint="At least 8 characters.">
            <PasswordInput value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm Password" required={!isEdit || !!form.password} error={errors.password_confirmation}>
            <PasswordInput value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add User'}
        </Button>
      </div>
    </form>
  )
}

function StatusConfirmModal({ user, onClose, onConfirm, loading }) {
  const activating = user && !user.is_active
  return (
    <Modal open={!!user} title={activating ? 'Reactivate User' : 'Deactivate User'} onClose={loading ? () => {} : onClose} size="sm">
      <p className="text-sm text-gray-600 mb-5">
        {activating
          ? <>Reactivate <strong>{user?.first_name} {user?.last_name}</strong>? They will be able to log in again.</>
          : <>Are you sure you want to deactivate <strong>{user?.first_name} {user?.last_name}</strong>? They will no longer be able to log in.</>}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={activating ? 'primary' : 'danger'} disabled={loading} onClick={onConfirm}>
          {loading ? 'Saving…' : activating ? 'Reactivate' : 'Deactivate'}
        </Button>
      </div>
    </Modal>
  )
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user: me } = useAuth()
  const [formUser, setFormUser] = useState(undefined) // undefined = closed, null = add, object = edit
  const [statusUser, setStatusUser] = useState(null)

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => userService.list() })
  const { data: lookups } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })

  const statusMutation = useMutation({
    mutationFn: (u) => userService.update(u.user_id, { is_active: !u.is_active }),
    onSuccess: (_, u) => {
      toast({ message: u.is_active ? 'User deactivated.' : 'User reactivated.' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setStatusUser(null)
    },
    onError: (err) => toast({ message: apiMessage(err) || 'Failed to update user status.', type: 'error' }),
  })

  const formOpen = formUser !== undefined
  const isEdit = !!formUser
  const isSelf = (u) => u && me && u.user_id === me.user_id

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: r => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${r.is_active ? 'bg-navy' : 'bg-gray-400'}`}>
            {initials(`${r.first_name} ${r.last_name}`)}
          </div>
          <div>
            <div className="text-sm font-medium">
              {r.first_name} {r.last_name}
              {isSelf(r) && <span className="ml-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">You</span>}
            </div>
            <div className="text-xs text-gray-400">{r.email}</div>
          </div>
        </div>
      )
    },
    { key: 'role_name', label: 'Role' },
    {
      key: 'is_active',
      label: 'Status',
      render: r => <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
    },
    { key: 'created_at', label: 'Created', render: r => formatDate(r.created_at) },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setFormUser(r)} className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Edit user">
            <Pencil size={14} />
          </button>
          {!isSelf(r) && (
            r.is_active
              ? <button onClick={() => setStatusUser(r)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50" title="Deactivate user"><UserX size={14} /></button>
              : <button onClick={() => setStatusUser(r)} className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50" title="Reactivate user"><UserCheck size={14} /></button>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <Card title="System Users" actions={<Button onClick={() => setFormUser(null)}><Plus size={15} /> Add User</Button>}>
        {isLoading ? <Skeleton rows={5} cols={5} /> : (
          <Table columns={columns} data={users?.data || users || []} emptyMessage="No users found." />
        )}
      </Card>

      <Modal open={formOpen} title={isEdit ? 'Edit User' : 'Add User'} onClose={() => setFormUser(undefined)}>
        {formOpen && (
          <UserForm
            key={formUser?.user_id ?? 'new'}
            user={formUser}
            roles={lookups?.roles}
            isSelf={isSelf(formUser)}
            onClose={() => setFormUser(undefined)}
          />
        )}
      </Modal>

      <StatusConfirmModal
        user={statusUser}
        onClose={() => setStatusUser(null)}
        onConfirm={() => statusMutation.mutate(statusUser)}
        loading={statusMutation.isPending}
      />
    </div>
  )
}
