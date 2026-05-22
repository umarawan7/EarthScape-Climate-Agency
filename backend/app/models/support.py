from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class TicketCategory(str, Enum):
    bug = "bug"
    feature = "feature"
    data = "data"
    other = "other"


class TicketStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"


class SupportTicketCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=4000)
    category: TicketCategory


class SupportTicketUpdate(BaseModel):
    status: TicketStatus | None = None
    admin_response: str | None = Field(default=None, max_length=2000)


class SupportTicketPublic(BaseModel):
    id: str
    user_id: str
    subject: str
    description: str
    category: TicketCategory
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    admin_response: str | None = None
