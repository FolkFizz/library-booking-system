import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(name, email, password)
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 page-fade sm:px-10">
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-lg gap-8 rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/80">
          <header>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Library Access
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Register to book rooms and manage your library schedule.
            </p>
          </header>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-600 dark:disabled:text-slate-300"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="text-center text-sm text-slate-600 dark:text-slate-300">
            Already have access?{' '}
            <Link
              to="/login"
              className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
