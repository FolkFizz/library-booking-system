import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { Room } from '../types'

type RoomCardProps = {
  room: Room
  onBook: (room: Room) => void
}

type AvailabilityRange = {
  start: string
  end: string
}

const TIMELINE_START = 8 * 60
const TIMELINE_END = 20 * 60
const TIMELINE_TOTAL = TIMELINE_END - TIMELINE_START

const getTodayParam = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const RoomCard = ({ room, onBook }: RoomCardProps) => {
  const [availability, setAvailability] = useState<AvailabilityRange[]>([])

  useEffect(() => {
    let active = true

    const fetchAvailability = async () => {
      try {
        const response = await api.get<AvailabilityRange[]>(
          `/rooms/${room.id}/availability`,
          {
            params: { date: getTodayParam() },
          },
        )
        if (!active) return
        setAvailability(response.data)
      } catch {
        if (!active) return
        setAvailability([])
      }
    }

    fetchAvailability()
    return () => {
      active = false
    }
  }, [room.id])

  const segments = useMemo(() => {
    return availability
      .map((range) => {
        const startMinutes = timeToMinutes(range.start)
        const endMinutes = timeToMinutes(range.end)
        if (startMinutes === null || endMinutes === null) return null
        const clampedStart = Math.max(startMinutes, TIMELINE_START)
        const clampedEnd = Math.min(endMinutes, TIMELINE_END)
        if (clampedEnd <= clampedStart) return null
        const left = ((clampedStart - TIMELINE_START) / TIMELINE_TOTAL) * 100
        const width = ((clampedEnd - clampedStart) / TIMELINE_TOTAL) * 100
        return { left, width }
      })
      .filter((segment): segment is { left: number; width: number } => !!segment)
  }, [availability])

  const toneClass =
    room.status === 'available'
      ? 'border-emerald-500/40 bg-emerald-50/80 dark:border-emerald-400/40 dark:bg-emerald-500/10'
      : room.status === 'maintenance' || room.status === 'occupied'
        ? 'border-rose-500/40 bg-rose-50/80 dark:border-rose-400/40 dark:bg-rose-500/10'
        : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60'

  return (
    <button
      type="button"
      data-testid={`room-${room.name}`}
      onClick={() => onBook(room)}
      className={`group w-full rounded-2xl border px-5 py-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
        <span>Room</span>
        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-200">
          Type {room.type}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {room.name}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>Capacity</span>
        <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {room.capacity}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          <span>Today</span>
          <span>08:00 - 20:00</span>
        </div>
        <div className="relative mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          {segments.map((segment, index) => (
            <span
              key={`${room.id}-segment-${index}`}
              className="absolute top-0 h-2 rounded-full bg-rose-500/80 dark:bg-rose-400/90"
              style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
            />
          ))}
        </div>
      </div>
    </button>
  )
}

export default RoomCard
