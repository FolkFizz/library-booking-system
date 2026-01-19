import { useEffect, useState } from 'react'
import api from './lib/api'
import RoomCard from './components/RoomCard'
import type { Room } from './types'

const CHAOS_KEY = 'chaos-mode'

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [chaosEnabled] = useState(
    () => localStorage.getItem(CHAOS_KEY) === 'true',
  )

  useEffect(() => {
    let active = true

    const fetchRooms = async () => {
      setLoading(true)
      try {
        const response = await api.get<Room[]>('/rooms')
        if (!active) return
        setRooms(response.data)
        setError('')
      } catch {
        if (!active) return
        setError('Unable to load rooms right now.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchRooms()
    return () => {
      active = false
    }
  }, [])

  const toggleChaos = () => {
    const nextValue = !chaosEnabled
    localStorage.setItem(CHAOS_KEY, nextValue ? 'true' : 'false')
    window.location.reload()
  }

  const handleBook = (room: Room) => {
    setSelectedRoom(room)
  }

  return (
    <div className="min-h-screen px-6 py-10 page-fade sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Library Room Booking
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
              Library Sandbox
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              Choose a room to start a booking flow. Cards reflect live room
              status pulled from the API.
            </p>
            {selectedRoom && (
              <div className="mt-4 text-sm text-slate-600">
                Selected room:{' '}
                <span className="font-semibold text-slate-900">
                  {selectedRoom.name}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleChaos}
            className={`self-start rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:-translate-y-0.5 md:self-auto ${
              chaosEnabled
                ? 'border-amber-500/60 bg-amber-50 text-amber-800'
                : 'border-slate-300 bg-white/70 text-slate-700'
            }`}
          >
            Toggle Chaos Mode
          </button>
        </header>

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{rooms.length} rooms</span>
            <span>Updated from http://localhost:8000</span>
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-6 py-8 text-sm text-slate-600 shadow-sm">
              Loading rooms...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, index) => (
                <div
                  key={room.id}
                  className="card-reveal"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <RoomCard room={room} onBook={handleBook} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
