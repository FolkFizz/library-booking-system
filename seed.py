from dotenv import load_dotenv
from passlib.context import CryptContext

from database import SessionLocal, engine
from models import Base, Room, RoomStatus, RoomType, User

load_dotenv()

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def _room_capacity(room_type: RoomType) -> int:
    if room_type == RoomType.A:
        return 1
    if room_type == RoomType.B:
        return 5
    return 10


def _ensure_default_user(session) -> None:
    existing = session.query(User).filter(User.email == 'admin@test.com').first()
    if existing:
        return
    session.add(
        User(
            name='Test User',
            email='admin@test.com',
            hashed_password=pwd_context.hash('password123'),
            role='member',
            credit_limit=0,
        )
    )


def seed_rooms() -> int:
    Base.metadata.create_all(bind=engine)

    rooms_to_create = []
    target_rooms = []

    for idx in range(1, 81):
        target_rooms.append((f'A{idx:02d}', RoomType.A))
    for idx in range(1, 31):
        target_rooms.append((f'B{idx:02d}', RoomType.B))
    for idx in range(1, 11):
        target_rooms.append((f'C{idx:02d}', RoomType.C))

    names = [name for name, _ in target_rooms]

    with SessionLocal() as session:
        _ensure_default_user(session)

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


if __name__ == '__main__':
    created = seed_rooms()
    print(f'Seeded {created} rooms.')
