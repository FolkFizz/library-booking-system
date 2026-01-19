from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


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
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
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
    status = Column(String(30), nullable=False, default="active")

    user = relationship("User", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
