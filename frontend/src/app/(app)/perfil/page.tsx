'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { api, handleApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { UsuarioDetalle } from '@/types/models'

export default function PerfilPage() {
  const { user, refreshUser } = useAuthStore((state) => ({
    user: state.user,
    refreshUser: state.refreshUser,
  }))

  const [profile, setProfile] = useState<UsuarioDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telefono: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmacion: '',
  })
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getProfile()
        setProfile(data)
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          email: data.email ?? '',
          telefono: data.telefono ?? '',
        })
      } catch (err) {
        const { message } = handleApiError(err)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setPasswordForm((previous) => ({ ...previous, [name]: value }))
  }

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const payload = {
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email || null,
        telefono: form.telefono || null,
      }
      const updated = await api.updateProfile(payload)
      setProfile(updated)
      setMessage('Perfil actualizado correctamente.')
      setForm({
        first_name: updated.first_name ?? '',
        last_name: updated.last_name ?? '',
        email: updated.email ?? '',
        telefono: updated.telefono ?? '',
      })
      await refreshUser()
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    setChangingPassword(true)
    setMessage(null)
    setError(null)

    if (passwordForm.password_nueva !== passwordForm.password_confirmacion) {
      setError('Las contraseñas nuevas deben coincidir.')
      setChangingPassword(false)
      return
    }

    try {
      await api.changePassword(passwordForm)
      setMessage('Contraseña actualizada.')
      setPasswordForm({ password_actual: '', password_nueva: '', password_confirmacion: '' })
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message)
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-800">Mi perfil</h1>
        <p className="text-sm text-slate-500">Actualiza tus datos personales y la contraseña de acceso.</p>
      </header>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Cargando información…
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {message && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>
            <form onSubmit={submitProfile} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Nombre</span>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Apellido</span>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Teléfono</span>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                />
              </label>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Cambiar contraseña</h2>
            <form onSubmit={submitPassword} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Contraseña actual</span>
                <input
                  name="password_actual"
                  type="password"
                  value={passwordForm.password_actual}
                  onChange={handlePasswordChange}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">Nueva contraseña</span>
                <input
                  name="password_nueva"
                  type="password"
                  value={passwordForm.password_nueva}
                  onChange={handlePasswordChange}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Confirmar contraseña</span>
                <input
                  name="password_confirmacion"
                  type="password"
                  value={passwordForm.password_confirmacion}
                  onChange={handlePasswordChange}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                />
              </label>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {changingPassword ? 'Actualizando…' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Resumen de sesión</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-400">Usuario</dt>
            <dd>{user?.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Nombre</dt>
            <dd>{user?.full_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Correo</dt>
            <dd>{user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Grupos</dt>
            <dd>{user?.groups?.length ? user.groups.join(', ') : '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

