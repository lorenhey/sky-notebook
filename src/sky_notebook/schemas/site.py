from typing import Optional
from pydantic import Field
from sky_notebook.schemas.base import BaseMetadata

class SiteMetadata(BaseMetadata):
    type: str = Field("site", frozen=True)
    name: str = Field(...)
    latitude: Optional[float] = Field(None, description="Decimal degrees")
    longitude: Optional[float] = Field(None, description="Decimal degrees")
    altitude: Optional[float] = Field(None, description="Meters")
    timezone: Optional[str] = Field(None)
    location_privacy: str = Field("precise", description="precise, approximate, private")
