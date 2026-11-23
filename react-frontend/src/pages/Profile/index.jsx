import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/formatters'

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

export default function ProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [infoForm, setInfoForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '' })
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [pwErrors, setPwErrors] = useState({})

  const infoMutation = useMutation({
    mutationFn: async (data) => { await new Promise(r => setTimeout(r, 600)); return data },
    onSuccess: () => toast({ message: 'Profile updated.' }),
    onError: () => toast({ message: 'Failed to update profile.', type: 'error' }),
  })

  const pwMutation = useMutation({
    mutationFn: async (data) => { await new Promise(r => setTimeout(r, 600)); return data },
    onSuccess: () => { toast({ message: 'Password changed.' }); setPwForm({ current_password: '', password: '', password_confirmation: '' }) },
    onError: () => toast({ message: 'Failed to change password.', type: 'error' }),
  })

  const handlePwSubmit = (e) => {
    e.preventDefault()
    setPwErrors({})
    const errs = {}
    if (!pwForm.current_password) errs.current_password = 'Required.'
    if (!pwForm.password) errs.password = 'Required.'
    if (pwForm.password && pwForm.password.length < 8) errs.password = 'At least 8 characters.'
    if (pwForm.password !== pwForm.password_confirmation) errs.password_confirmation = 'Passwords do not match.'
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    pwMutation.mutate(pwForm)
  }

  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#14254A] text-white text-xl font-bold flex items-center justify-center">{initials(name)}</div>
          <div>
            <div className="text-lg font-bold text-[#0F1E3D]">{name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.role_name}</div>
          </div>
        </div>
      </Card>

      <Card title="Account Information">
        <form onSubmit={(e) => { e.preventDefault(); infoMutation.mutate(infoForm) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
              <input className={inputCls} value={infoForm.first_name} onChange={e => setInfoForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
              <input className={inputCls} value={infoForm.last_name} onChange={e => setInfoForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input className={inputCls} type="email" value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <Button type="submit" disabled={infoMutation.isPending}>{infoMutation.isPending ? 'Saving…' : 'Save Changes'}</Button>
        </form>
      </Card>

      <Card title="Change Password">
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
            <input className={inputCls} type="password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} placeholder="••••••••" />
            {pwErrors.current_password && <p className="text-xs text-red-500 mt-0.5">{pwErrors.current_password}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
            <input className={inputCls} type="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            {pwErrors.password && <p className="text-xs text-red-500 mt-0.5">{pwErrors.password}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input className={inputCls} type="password" value={pwForm.password_confirmation} onChange={e => setPwForm(f => ({ ...f, password_confirmation: e.target.value }))} placeholder="••••••••" />
            {pwErrors.password_confirmation && <p className="text-xs text-red-500 mt-0.5">{pwErrors.password_confirmation}</p>}
          </div>
          <Button type="submit" disabled={pwMutation.isPending}>{pwMutation.isPending ? 'Changing…' : 'Change Password'}</Button>
        </form>
      </Card>
    </div>
  )
}
