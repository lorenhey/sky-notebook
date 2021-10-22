from typing import List, Optional
from pydantic import Field
from sky_notebook.schemas.base import BaseMetadata

class TargetMetadata(BaseMetadata):
    type: str = Field("target", frozen=True)
    name: str = Field(..., description="Common name of the target")
    aliases: List[str] = Field(default_factory=list, description="Other catalog names (e.g., NGC 1976)")
    object_type: Optional[str] = Field(None, description="Type of object (e.g., Galaxy, Nebula, Planet)")
    ra: Optional[str] = Field(None, description="Right Ascension (e.g., '05h35m17.3s')")
    dec: Optional[str] = Field(None, description="Declination (e.g., '-05d23m28s')")
    epoch: str = Field("J2000", description="Coordinate epoch/frame (e.g., J2000, ICRS)")
    is_moving: bool = Field(False, description="True for planets, comets, asteroids, Moon")
