import { useState } from 'react'
import axios from 'axios'
import api from '../lib/api'
import type { Room } from '../types'

type BookingModalProps = {
  room: Room
  onClose: () => void
  onBooked: () => void
}

const BookingModal = ({ room, onClose, onBooked }: BookingModalProps) => {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [attendeesCount, setAttendeesCount] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  const durationHours =
    startTime && endTime
      ? (new Date(endTime).getTime() - new Date(startTime).getTime()) /
        1000 /
        60 /
        60
      : 0
  const durationLabel =
    durationHours > 0 ? `${durationHours.toFixed(2)} hours` : 'Select valid times'

  const parsedAttendees = Number(attendeesCount)
  const attendeeWarning = attendeesCount === ''
    ? 'Please enter a valid attendee count.'
    : Number.isNaN(parsedAttendees)
      ? 'Please enter a valid attendee count.'
      : room.type === 'A' && parsedAttendees !== 1
        ? 'Type A rooms require exactly 1 person.'
        : room.type === 'B' && (parsedAttendees < 2 || parsedAttendees > 5)
          ? 'Type B rooms require 2-5 people.'
          : room.type === 'C' && (parsedAttendees < 6 || parsedAttendees > 10)
            ? 'Type C rooms require 6-10 people.'
            : ''

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data
      if (typeof data === 'string') return data
      if (data?.detail) {
        if (Array.isArray(data.detail)) {
          return data.detail
            .map((entry: { msg?: string }) => entry.msg || 'Invalid input.')
            .join(', ')
        }
        if (typeof data.detail === 'string') return data.detail
      }
      if (typeof data?.message === 'string') return data.message
    }
    return 'Booking failed. Please try again.'
  }

  const handleConfirm = async () => {
    if (!startTime || !endTime) {
      alert('Please select both start and end times.')
      return
    }
    if (!attendeesCount || attendeeWarning) {
      alert(attendeeWarning || 'Please enter a valid attendee count.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/bookings', {
        room_id: room.id,
        start_time: startTime,
        end_time: endTime,
        attendees_count: parsedAttendees,
      })
      onClose()
      alert('Booking Successful!')
      onBooked()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10 backdrop-blur-sm dark:bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950/95"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Booking
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {room.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            Start Time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            End Time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Duration:{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {durationLabel}
            </span>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            Number of Attendees
            <input
              type="number"
              min={1}
              value={attendeesCount}
              onChange={(event) => setAttendeesCount(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {attendeeWarning && (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {attendeeWarning}
              </span>
            )}
          </label>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-600 dark:disabled:text-slate-300"
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingModal
