export type RoomType = 'A' | 'B' | 'C'
export type RoomStatus = 'available' | 'maintenance' | 'occupied'

export interface Room {
  id: number
  name: string
  type: RoomType
  capacity: number
  status: RoomStatus
}

export interface Booking {
  id: number
  room_id: number
  user_id: number
  start_time: string
  end_time: string
  attendees_count: number
  room_name: string
  status: string
  created_at?: string | null
}
