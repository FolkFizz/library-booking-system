import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import api from '../lib/api'
import type { Booking } from '../types'
import { useAuth } from '../context/AuthContext'

const formatRange = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Invalid date range'
  }

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  })
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const dateLabel = dateFormatter.format(startDate)
  const startTime = timeFormatter.format(startDate)
  const endTime = timeFormatter.format(endDate)
  return `${dateLabel}, ${startTime} - ${endTime}`
}

const BookingList = () => {
  const { userId } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get<Booking[]>(`/my-bookings/${userId}`)
      setBookings(response.data)
      setError('')
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : 'Unable to load bookings right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancel = async (bookingId: number) => {
    try {
      await api.delete(`/bookings/${bookingId}`)
      await fetchBookings()
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : 'Unable to cancel booking.'
      alert(message)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>My bookings</span>
        <span>{bookings.length} total</span>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-6 py-8 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          Loading bookings...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-6 py-8 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          No bookings yet. Select a room to create your first reservation.
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {booking.room_name || `Room ${booking.room_id}`}
                </div>
                <div>{formatRange(booking.start_time, booking.end_time)}</div>
                <div>Attendees: {booking.attendees_count}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Status: {booking.status}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCancel(booking.id)}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500"
              >
                Cancel Booking
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default BookingList
