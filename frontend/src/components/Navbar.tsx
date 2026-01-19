import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type NavbarProps = {
  isChaosMode: boolean
  onToggleChaos: () => void
  onToggleTheme: () => void
  theme: 'light' | 'dark'
}

const Navbar = ({
  isChaosMode,
  onToggleChaos,
  onToggleTheme,
  theme,
}: NavbarProps) => {
  const { logout } = useAuth()
  const location = useLocation()
  const isRooms = location.pathname === '/'
  const isBookings = location.pathname === '/my-bookings'

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-700/80">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          LB
        </div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Library Booking
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        <Link
          to="/"
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
            isRooms
              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
              : 'border-slate-300 bg-white/70 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300'
          }`}
          aria-current={isRooms ? 'page' : undefined}
        >
          Rooms
        </Link>
        <Link
          to="/my-bookings"
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
            isBookings
              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
              : 'border-slate-300 bg-white/70 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300'
          }`}
          aria-current={isBookings ? 'page' : undefined}
        >
          My Bookings
        </Link>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200"
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          type="button"
          onClick={onToggleChaos}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
            isChaosMode
              ? 'border-amber-500/60 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'
              : 'border-slate-300 bg-white/70 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200'
          }`}
        >
          Chaos Mode
        </button>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
