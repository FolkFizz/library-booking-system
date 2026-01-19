import asyncio
import os
import random
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Booking, Room, RoomType, User
from schemas import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)

load_dotenv()

app = FastAPI(title="Library Room Booking System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _is_chaos_enabled() -> bool:
    return os.getenv("CHAOS_MODE", "False").lower() == "true"


@app.middleware("http")
async def chaos_engineering_middleware(request, call_next):
    header_enabled = request.headers.get("x-chaos-token", "").lower() == "true"
    if (header_enabled or _is_chaos_enabled()) and random.random() < 0.1:
        if random.choice([True, False]):
            await asyncio.sleep(3)
        else:
            return JSONResponse(
                status_code=500,
                content={"detail": "Chaos mode injected error."},
            )
    return await call_next(request)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _model_to_dict(model):
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_unset=True)
    return model.dict(exclude_unset=True)


def _validate_booking_times(start_time: datetime, end_time: datetime) -> None:
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time must be earlier than end_time.",
        )


def _ensure_no_overlap(
    db: Session,
    room_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: int | None = None,
) -> None:
    query = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.status != "cancelled",
        Booking.start_time < end_time,
        Booking.end_time > start_time,
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is already booked for the requested time.",
        )


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/rooms", response_model=list[RoomResponse])
def list_rooms(
    room_type: RoomType | None = Query(default=None, alias="type"),
    db: Session = Depends(get_db),
):
    query = db.query(Room)
    if room_type is not None:
        query = query.filter(Room.type == room_type)
    return query.order_by(Room.id).all()


@app.post("/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(room_in: RoomCreate, db: Session = Depends(get_db)):
    existing = db.query(Room).filter(Room.name == room_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room name already exists.",
        )
    room = Room(**room_in.dict())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@app.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, room_in: RoomUpdate, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found."
        )

    updates = _model_to_dict(room_in)
    if "name" in updates:
        conflict = (
            db.query(Room)
            .filter(Room.name == updates["name"], Room.id != room_id)
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room name already exists.",
            )

    for field, value in updates.items():
        setattr(room, field, value)

    db.commit()
    db.refresh(room)
    return room


@app.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found."
        )
    db.delete(room)
    db.commit()
    return {"detail": "Room deleted."}


@app.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db)):
    _validate_booking_times(booking_in.start_time, booking_in.end_time)

    room = db.query(Room).filter(Room.id == booking_in.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found."
        )

    user = db.query(User).filter(User.id == booking_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )

    _ensure_no_overlap(
        db, booking_in.room_id, booking_in.start_time, booking_in.end_time
    )

    booking = Booking(**booking_in.dict())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@app.get("/bookings", response_model=list[BookingResponse])
def list_bookings(db: Session = Depends(get_db)):
    return db.query(Booking).order_by(Booking.id).all()


@app.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found."
        )
    return booking


@app.get("/my-bookings/{user_id}", response_model=list[BookingResponse])
def list_user_bookings(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    return (
        db.query(Booking).filter(Booking.user_id == user_id).order_by(Booking.id).all()
    )


@app.patch("/bookings/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int, booking_in: BookingUpdate, db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found."
        )

    updates = _model_to_dict(booking_in)
    if not updates:
        return booking

    if "start_time" in updates or "end_time" in updates:
        new_start = updates.get("start_time", booking.start_time)
        new_end = updates.get("end_time", booking.end_time)
        _validate_booking_times(new_start, new_end)
        _ensure_no_overlap(db, booking.room_id, new_start, new_end, booking.id)
        booking.start_time = new_start
        booking.end_time = new_end

    if "status" in updates:
        booking.status = updates["status"]

    db.commit()
    db.refresh(booking)
    return booking


@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found."
        )
    db.delete(booking)
    db.commit()
    return {"detail": "Booking deleted."}
