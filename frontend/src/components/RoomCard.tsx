import type { Room } from '../types';

type RoomCardProps = {
  room: Room
  onBook: (room: Room) => void
}

const RoomCard = ({ room, onBook }: RoomCardProps) => {
  const toneClass =
    room.status === 'available'
      ? 'border-emerald-500/40 bg-emerald-50/80'
      : room.status === 'maintenance' || room.status === 'occupied'
        ? 'border-rose-500/40 bg-rose-50/80'
        : 'border-slate-200 bg-slate-100'

  return (
    <button
      type="button"
      data-testid={`room-${room.name}`}
      onClick={() => onBook(room)}
      className={`group w-full rounded-2xl border px-5 py-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
        <span>Room</span>
        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          Type {room.type}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{room.name}</div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>Capacity</span>
        <span className="text-base font-semibold text-slate-900">
          {room.capacity}
        </span>
      </div>
    </button>
  )
}

export default RoomCard
