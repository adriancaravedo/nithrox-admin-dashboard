import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true); setError(null)
    try {
      await login(email.trim(), password)
    } catch {
      setError('Email o contraseña incorrectos')
      toast.error('Error al ingresar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-sm">NTX</span>
        </div>
        <span className="font-bold text-lg">Nithrox</span>
      </div>
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-7 pt-7 pb-6">
          <h1 className="text-xl font-bold text-center mb-1">Bienvenido de vuelta</h1>
          <p className="text-zinc-500 text-sm text-center mb-6">Ingresa tus credenciales</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Email</label>
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder="tu@email.com" autoFocus autoComplete="email"
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 pr-16 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-[10px] font-bold uppercase tracking-widest">
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-500">⚠</span>
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-zinc-900 text-white font-bold rounded-xl text-sm hover:bg-zinc-700 disabled:opacity-50 transition-all uppercase tracking-widest">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
        <div className="px-7 py-4 border-t border-zinc-100 bg-zinc-50 text-center">
          <p className="text-[10px] text-zinc-400">
            ¿Problemas? <a href="mailto:hola@nithrox.com" className="text-zinc-600 font-bold">hola@nithrox.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}