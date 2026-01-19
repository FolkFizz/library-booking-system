from dotenv import load_dotenv

from database import SessionLocal, engine
from models import Base, Room, RoomStatus, RoomType

load_dotenv()


def _room_capacity(room_type: RoomType) -> int:
    if room_type == RoomType.A:
        return 1   # สูงสุด 1 คน
    if room_type == RoomType.B:
        return 5   # สูงสุด 5 คน (ส่วนขั้นต่ำ 2 คน เราไปเขียน Logic เช็คทีหลัง)
    return 10      # Type C สูงสุด 10 คน


def seed_rooms() -> int:
    Base.metadata.create_all(bind=engine)

    rooms_to_create = []
    target_rooms = []

    for idx in range(1, 81):
        target_rooms.append((f"A{idx:02d}", RoomType.A))
    for idx in range(1, 31):
        target_rooms.append((f"B{idx:02d}", RoomType.B))
    for idx in range(1, 11):
        target_rooms.append((f"C{idx:02d}", RoomType.C))

    names = [name for name, _ in target_rooms]

    with SessionLocal() as session:
        existing = {
            row[0]
            for row in session.query(Room.name)
            .filter(Room.name.in_(names))
            .all()
        }

        for name, room_type in target_rooms:
            if name in existing:
                continue
            rooms_to_create.append(
                Room(
                    name=name,
                    type=room_type,
                    capacity=_room_capacity(room_type),
                    status=RoomStatus.AVAILABLE,
                )
            )

        if rooms_to_create:
            session.add_all(rooms_to_create)
            session.commit()

    return len(rooms_to_create)


if __name__ == "__main__":
    created = seed_rooms()
    print(f"Seeded {created} rooms.")
