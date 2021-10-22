from typing import Optional, Dict, Any
from pydantic import Field
from sky_notebook.schemas.base import BaseMetadata

class RigSnapshotMetadata(BaseMetadata):
    type: str = Field("rig_snapshot", frozen=True)
    name: str = Field(..., description="Human readable name for this rig state")
    manifest: Dict[str, Any] = Field(default_factory=dict, description="Detailed components (telescope, camera, filters)")
    active_from: str = Field(..., description="ISO 8601 UTC")
    active_until: Optional[str] = Field(None, description="ISO 8601 UTC")
