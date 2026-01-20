from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from models import RoomStatus, RoomType, as_thai_time

try:
    from pydantic import ConfigDict, field_validator
except ImportError:  # pragma: no cover - pydantic v1 fallback
    ConfigDict = None
    field_validator = None
    from pydantic import validator


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

    if field_validator:
        @field_validator('created_at', mode='after')
        @classmethod
        def _localize_created_at(cls, value: Optional[datetime]) -> Optional[datetime]:
            if value is None:
                return value
            return as_thai_time(value)
    else:  # pragma: no cover - pydantic v1 fallback
        @validator('created_at', pre=False, always=True)
        def _localize_created_at(cls, value: Optional[datetime]) -> Optional[datetime]:
            if value is None:
                return value
            return as_thai_time(value)


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
