from datetime import datetime
from zoneinfo import ZoneInfo
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base

THAI_TZ = ZoneInfo("Asia/Bangkok")


def as_thai_time(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=THAI_TZ)
    return value.astimezone(THAI_TZ)


def now_thai_time() -> datetime:
    return datetime.now(THAI_TZ)


class RoomType(PyEnum):
    A = "A"
    B = "B"
    C = "C"


class RoomStatus(PyEnum):
    AVAILABLE = "available"
    MAINTENANCE = "maintenance"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="member")
    credit_limit = Column(Integer, nullable=False, default=0)

    bookings = relationship("Booking", back_populates="user")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)
    type = Column(Enum(RoomType, name="room_type"), nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(
        Enum(RoomStatus, name="room_status"),
        nullable=False,
        default=RoomStatus.AVAILABLE,
    )

    bookings = relationship("Booking", back_populates="room")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    attendees_count = Column(Integer, nullable=False, default=1)
    status = Column(String(30), nullable=False, default="active")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=now_thai_time,
    )

    user = relationship("User", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")

    @property
    def room_name(self) -> str:
        if self.room:
            return self.room.name
        return ""
