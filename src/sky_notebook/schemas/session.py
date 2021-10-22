from typing import List, Optional, Dict, Any
from pydantic import Field, BaseModel
from sky_notebook.schemas.base import BaseMetadata

class Event(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    event_type: str = Field(..., description="e.g., human_note, filter_change, focus, meridian_flip")
    content: str = Field(..., description="Description or note")
    provenance: str = Field("manual", description="manual, imported, derived")
    
class FileReference(BaseModel):
    path: str = Field(..., description="Relative path or storage root path")
    type: str = Field(..., description="FITS, XISF, PNG, etc.")
    hash: Optional[str] = Field(None, description="SHA-256 hash")
    size_bytes: Optional[int] = Field(None)
    timestamp: Optional[str] = Field(None)

class Task(BaseModel):
    id: str = Field(...)
    content: str = Field(...)
    status: str = Field("open", description="open, done, cancelled")

class Measurement(BaseModel):
    quantity: str = Field(...)
    value: float = Field(...)
    unit: str = Field(...)
    uncertainty: Optional[float] = Field(None)
    method: Optional[str] = Field(None)

class SessionMetadata(BaseMetadata):
    type: str = Field("session", frozen=True)
    observing_night: str = Field(..., description="Logical night ID (e.g., 2026-09-11)")
    start_time: str = Field(..., description="ISO 8601 UTC")
    end_time: Optional[str] = Field(None, description="ISO 8601 UTC")
    timezone: str = Field(..., description="Local timezone (e.g., UTC-03:00)")
    
    project: Optional[str] = Field(None, description="Project ID")
    targets: List[str] = Field(default_factory=list, description="Target IDs observed")
    site: Optional[str] = Field(None, description="Site ID")
    rig: Optional[str] = Field(None, description="Rig Snapshot ID")
    
    outcome: Optional[str] = Field(None, description="successful, partial, failed, experimental")
    
    events: List[Event] = Field(default_factory=list)
    files: List[FileReference] = Field(default_factory=list)
    tasks: List[Task] = Field(default_factory=list)
    measurements: List[Measurement] = Field(default_factory=list)
    
    # Sky Context snapshot
    sky_context: Dict[str, Any] = Field(default_factory=dict, description="Derived context like Moon phase")
