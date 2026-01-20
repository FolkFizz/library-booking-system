import BookingList from '../components/BookingList'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'

const MyBookingsPage = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen px-6 py-8 page-fade sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Navbar
          onToggleTheme={toggleTheme}
          theme={theme}
        />

        <section className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              My Bookings
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Review and cancel your current reservations.
            </p>
          </div>
          <BookingList />
        </section>
      </div>
    </div>
  )
}

export default MyBookingsPage
