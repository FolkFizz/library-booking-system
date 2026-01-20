import asyncio
import os
import random
from datetime import date, datetime, time, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal, engine
import models
import schemas

load_dotenv()

app = FastAPI(title='Library Room Booking System')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv('SECRET_KEY', 'change_me')
ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')


def _is_chaos_enabled() -> bool:
    return os.getenv('CHAOS_MODE', 'False').lower() == 'true'


@app.middleware('http')
async def chaos_engineering_middleware(request, call_next):
    header_enabled = request.headers.get('x-chaos-token', '').lower() == 'true'
    if (header_enabled or _is_chaos_enabled()) and random.random() < 0.1:
        if random.choice([True, False]):
            await asyncio.sleep(3)
        else:
            return JSONResponse(
                status_code=500,
                content={'detail': 'Chaos mode injected error.'},
            )
    return await call_next(request)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _model_to_dict(model):
    if hasattr(model, 'model_dump'):
        return model.model_dump(exclude_unset=True)
    return model.dict(exclude_unset=True)


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _validate_booking_times(start_time: datetime, end_time: datetime) -> None:
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='start_time must be earlier than end_time.',
        )


def _validate_booking_duration(start_time: datetime, end_time: datetime) -> None:
    if end_time - start_time > timedelta(hours=4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Booking duration cannot exceed 4 hours.',
        )


def _validate_attendees(room: models.Room, attendees_count: int) -> None:
    if attendees_count <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='attendees_count must be greater than 0.',
        )
    if room.type == models.RoomType.A and attendees_count != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Type A rooms require exactly 1 person.',
        )
    if room.type == models.RoomType.B and not 2 <= attendees_count <= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Type B rooms require 2-5 people.',
        )
    if room.type == models.RoomType.C and not 6 <= attendees_count <= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Type C rooms require 6-10 people.',
        )


def _localize_booking_response(
    response: schemas.BookingResponse,
) -> schemas.BookingResponse:
    response.start_time = models.as_thai_time(response.start_time)
    response.end_time = models.as_thai_time(response.end_time)
    return response


def _ensure_no_overlap(
    db: Session,
    room_id: int,
    start_time: datetime,
    end_time: datetime,
    status_code: int = status.HTTP_409_CONFLICT,
) -> None:
    overlap = (
        db.query(models.Booking)
        .filter(
            models.Booking.room_id == room_id,
            models.Booking.status != 'cancelled',
            models.Booking.start_time < end_time,
            models.Booking.end_time > start_time,
        )
        .first()
    )
    if overlap:
        raise HTTPException(
            status_code=status_code,
            detail='Room is already booked for the requested time.',
        )


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials.',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub')
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except (JWTError, ValueError) as exc:
        raise credentials_exception from exc

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def _ensure_default_user(db: Session) -> None:
    existing = db.query(models.User).filter(models.User.email == 'admin@test.com').first()
    if existing:
        return
    db.add(
        models.User(
            name='Admin User',
            email='admin@test.com',
            hashed_password=_get_password_hash('password123'),
            role='member',
            credit_limit=0,
        )
    )
    db.commit()


@app.on_event('startup')
def startup() -> None:
    models.Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        _ensure_default_user(db)


@app.get('/')
def root():
    return {'status': 'ok'}


@app.post('/register', response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email already registered.',
        )
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=_get_password_hash(user_in.password),
        role='member',
        credit_limit=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post('/token', response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not _verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Incorrect email or password.',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = _create_access_token(
        data={'sub': str(user.id)},
        expires_delta=access_token_expires,
    )
    return {'access_token': access_token, 'token_type': 'bearer'}


@app.get('/rooms', response_model=list[schemas.RoomResponse])
def list_rooms(
    room_type: models.RoomType | None = Query(default=None, alias='type'),
    db: Session = Depends(get_db),
):
    query = db.query(models.Room)
    if room_type is not None:
        query = query.filter(models.Room.type == room_type)
    return query.order_by(models.Room.id).all()


@app.get('/rooms/{room_id}/availability')
def room_availability(
    room_id: int,
    date: date = Query(...),
    db: Session = Depends(get_db),
):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Room not found.'
        )

    day_start = datetime.combine(date, time.min).replace(tzinfo=models.THAI_TZ)
    day_end = datetime.combine(date, time.max).replace(tzinfo=models.THAI_TZ)

    bookings = (
        db.query(models.Booking)
        .filter(
            models.Booking.room_id == room_id,
            models.Booking.status != 'cancelled',
            models.Booking.start_time < day_end,
            models.Booking.end_time > day_start,
        )
        .order_by(models.Booking.start_time)
        .all()
    )

    ranges = []
    for booking in bookings:
        start_time = models.as_thai_time(booking.start_time)
        end_time = models.as_thai_time(booking.end_time)
        start_time = max(start_time, day_start)
        end_time = min(end_time, day_end)
        ranges.append(
            {
                'start': start_time.strftime('%H:%M'),
                'end': end_time.strftime('%H:%M'),
            }
        )

    return ranges


@app.post('/bookings', response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        # 1. Validate: Time Logic
        start_time = models.as_thai_time(booking_in.start_time)
        end_time = models.as_thai_time(booking_in.end_time)
        start_clock = start_time.timetz().replace(tzinfo=None)
        end_clock = end_time.timetz().replace(tzinfo=None)
        opening_time = time(8, 0)
        closing_time = time(20, 0)
        if start_clock < opening_time or end_clock > closing_time:
            raise HTTPException(
                status_code=400,
                detail="Bookings are only allowed between 08:00 and 20:00.",
            )
        if start_time >= end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
        
        # Check 4-hour limit
        duration = (end_time - start_time).total_seconds() / 3600
        if duration > 4:
            raise HTTPException(status_code=400, detail="Booking cannot exceed 4 hours")

        if booking_in.attendees_count <= 0:
             raise HTTPException(status_code=400, detail="attendees_count must be greater than 0")

        # 2. Validate: Room & Capacity
        room = db.query(models.Room).filter(models.Room.id == booking_in.room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Capacity Logic
        if room.type == "A" and booking_in.attendees_count != 1:
            raise HTTPException(status_code=400, detail="Room Type A allows exactly 1 person")
        if room.type == "B" and not (2 <= booking_in.attendees_count <= 5):
            raise HTTPException(status_code=400, detail="Room Type B allows 2-5 people")
        if room.type == "C" and not (6 <= booking_in.attendees_count <= 10):
            raise HTTPException(status_code=400, detail="Room Type C allows 6-10 people")

        # 3. Check Overlap (Simple Check without Lock to prevent 500 Error)
        overlap = db.query(models.Booking).filter(
            models.Booking.room_id == booking_in.room_id,
            models.Booking.status == "active",
            models.Booking.end_time > start_time,
            models.Booking.start_time < end_time
        ).first()

        if overlap:
            raise HTTPException(status_code=409, detail="Room is already booked for this time")

        # 4. Create Booking
        booking = models.Booking(
            room_id=booking_in.room_id,
            user_id=current_user.id,
            start_time=start_time,
            end_time=end_time,
            attendees_count=booking_in.attendees_count,
            status="active",
            created_at=models.now_thai_time()
        )
        
        db.add(booking)
        db.commit()             # <--- Commit ทีเดียวจบ
        db.refresh(booking)     # <--- ดึงข้อมูลล่าสุด (ID, created_at) กลับมา
        
        # 5. Prepare Response
        # ใส่ room_name กลับไปให้ Frontend (ถ้า Schema รองรับ)
        response = schemas.BookingResponse.model_validate(booking)
        response = _localize_booking_response(response)
        if hasattr(response, 'room_name'):
            response.room_name = room.name
            
        return response

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        db.rollback() # ถ้าพัง ให้ย้อนกลับ
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/my-bookings', response_model=list[schemas.BookingResponse])
def list_my_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # ดึงข้อมูลการจองของ "ฉัน" (คนที่ถือ Token) โดยไม่ต้องส่ง user_id มา
    bookings = (
        db.query(models.Booking)
        .options(joinedload(models.Booking.room)) # Join ตาราง Room มาด้วย
        .filter(models.Booking.user_id == current_user.id)
        .order_by(models.Booking.start_time.desc())
        .all()
    )

    # แปลงข้อมูลเพื่อเติม room_name ให้ Frontend
    results = []
    for b in bookings:
        # ใช้ model_validate (สำหรับ Pydantic v2) หรือ from_orm (v1)
        b_resp = schemas.BookingResponse.model_validate(b)
        b_resp = _localize_booking_response(b_resp)
        
        # ดึงชื่อห้องจาก Relation ที่ Join มา
        if b.room:
            b_resp.room_name = b.room.name
        else:
            b_resp.room_name = "Unknown"
            
        results.append(b_resp)

    return results


@app.delete('/bookings/{booking_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Booking not found.'
        )
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Not authorized to delete this booking.',
        )
    db.delete(booking)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
