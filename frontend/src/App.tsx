import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './lib/api'
import RoomCard from './components/RoomCard'
import BookingModal from './components/BookingModal'
import Navbar from './components/Navbar'
import type { Room } from './types'
import { useTheme } from './context/ThemeContext'

const PAGE_SIZE = 12

type RoomTab = 'all' | 'A' | 'B' | 'C'

const roomTabs: { label: string; value: RoomTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Type A', value: 'A' },
  { label: 'Type B', value: 'B' },
  { label: 'Type C', value: 'C' },
]

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [activeTab, setActiveTab] = useState<RoomTab>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const mountedRef = useRef(true)
  const { theme, toggleTheme } = useTheme()

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<Room[]>('/rooms')
      if (!mountedRef.current) return
      setRooms(response.data)
      setError('')
    } catch {
      if (!mountedRef.current) return
      setError('Unable to load rooms right now.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchRooms()
    return () => {
      mountedRef.current = false
    }
  }, [fetchRooms])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const filteredRooms = useMemo(() => {
    if (activeTab === 'all') return rooms
    return rooms.filter((room) => room.type === activeTab)
  }, [activeTab, rooms])

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = filteredRooms.length
    ? (safePage - 1) * PAGE_SIZE + 1
    : 0
  const endIndex = Math.min(safePage * PAGE_SIZE, filteredRooms.length)
  const paginatedRooms = filteredRooms.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage)
  }, [currentPage, safePage])

  const handleBook = (room: Room) => {
    setSelectedRoom(room)
  }

  const handleBookingSuccess = () => {
    fetchRooms()
  }

  return (
    <>
      <div className="min-h-screen px-6 py-8 page-fade sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <Navbar
            onToggleTheme={toggleTheme}
            theme={theme}
          />

          <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span>
                {filteredRooms.length === 0
                  ? 'No rooms'
                  : `Showing ${startIndex}-${endIndex} of ${filteredRooms.length}`}
              </span>
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Room types"
            >
              {roomTabs.map((tab) => {
                const isActive = tab.value === activeTab
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 bg-white/70 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white/70 px-6 py-8 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                Loading rooms...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedRooms.map((room, index) => (
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

            {!loading && !error && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (page) => (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                        page === safePage
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                          : 'border-slate-300 bg-white/70 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safePage === totalPages}
                  className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onBooked={handleBookingSuccess}
        />
      )}
    </>
  )
}

export default App
