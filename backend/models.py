from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class ApiKeyCreate(BaseModel):
    name: str = Field(..., example="Customer Data Export")
    owner_name: str = Field(..., example="Vikram Patel")
    ownership_type: Literal["INTERNAL", "THIRD_PARTY"] = Field(..., example="INTERNAL")
    control_type: Literal["HUMAN_CONTROLLED", "SOFTWARE_CONTROLLED"] = Field(..., example="SOFTWARE_CONTROLLED")
    connected_system: str = Field(..., example="LedgerOne")
    approved_ips: List[str] = Field(default_factory=list, example=["192.168.10.20"])
    allowed_systems: List[str] = Field(default_factory=list, example=["LedgerOne"])
    allowed_permissions: List[str] = Field(default_factory=list, example=["READ_DATA"])
    expected_permissions: Optional[List[str]] = Field(default=None, example=["READ_DATA"])
    normal_records_threshold: int = Field(default=500, example=500)
    expiry_date: Optional[str] = Field(default=None, example="2027-01-01")
    notes: Optional[str] = Field(default="", example="Operational billing webhook")

class ApiKeyUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    ownership_type: Optional[Literal["INTERNAL", "THIRD_PARTY"]] = None
    control_type: Optional[Literal["HUMAN_CONTROLLED", "SOFTWARE_CONTROLLED"]] = None
    connected_system: Optional[str] = None
    approved_ips: Optional[List[str]] = None
    allowed_systems: Optional[List[str]] = None
    allowed_permissions: Optional[List[str]] = None
    expected_permissions: Optional[List[str]] = None
    normal_records_threshold: Optional[int] = None
    notes: Optional[str] = None

class ApiKeyRevoke(BaseModel):
    reason: str = Field(..., example="Security breach containment")
    admin_name: str = Field(default="SecOps Admin (Tensor Terminators)")

class ApiKeyRotate(BaseModel):
    reason: str = Field(..., example="Scheduled security rotation")
    admin_name: str = Field(default="SecOps Admin (Tensor Terminators)")

class ApiKeyReview(BaseModel):
    review_status: Literal["NEEDS_REVIEW", "UNDER_REVIEW", "REVIEWED"] = "REVIEWED"
    notes: Optional[str] = "Routine security access review completed."
    admin_name: str = Field(default="SecOps Admin (Tensor Terminators)")

class ActivitySubmit(BaseModel):
    key_id: str
    source_ip: str
    connected_system: str
    activity_name: str
    permission_used: str
    records_accessed: int = 1

class IncidentConfirm(BaseModel):
    title: Optional[str] = "Data Exfiltration and Unauthorized Modification Incident"
    description: Optional[str] = "Severe API compromise across LedgerOne and TallyBridge Connect systems with unapproved IP exfiltration."
    is_reportable: bool = True
    evidence_reference: Optional[str] = "E13 (Support Desk Chat logs) & E16 (Vendor Follow-up Notice)"
    notice_time: Optional[str] = None

class ChecklistUpdate(BaseModel):
    step_id: str
    completed: bool
    admin_name: str = Field(default="SecOps Admin (Tensor Terminators)")

class SettingUpdate(BaseModel):
    setting_key: str
    setting_value: str
