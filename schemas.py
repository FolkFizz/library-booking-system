from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from models import RoomStatus, RoomType

try:
    from pydantic import ConfigDict
except ImportError:  # pragma: no cover - pydantic v1 fallback
    ConfigDict = None


class RoomBase(BaseModel):
    name: str
    type: RoomType
    capacity: int
    status: RoomStatus


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[RoomType] = None
    capacity: Optional[int] = None
    status: Optional[RoomStatus] = None


class RoomResponse(RoomBase):
    id: int

    if ConfigDict:
        model_config = ConfigDict(from_attributes=True)
    else:  # pragma: no cover - pydantic v1 fallback
        class Config:
            orm_mode = True


class BookingBase(BaseModel):
    room_id: int
    start_time: datetime
    end_time: datetime
    attendees_count: int


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


class BookingResponse(BookingBase):
    id: int
    user_id: int
    room_name: str
    status: str
    created_at: Optional[datetime] = None

    if ConfigDict:
        model_config = ConfigDict(from_attributes=True)
    else:  # pragma: no cover - pydantic v1 fallback
        class Config:
            orm_mode = True


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    if ConfigDict:
        model_config = ConfigDict(from_attributes=True)
    else:  # pragma: no cover - pydantic v1 fallback
        class Config:
            orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
