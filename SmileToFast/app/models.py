from typing import Optional
from pydantic import BaseModel


class SmileRow(BaseModel):
    pst: bool = False
    folio: Optional[str] = None
    voucher: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    room: Optional[str] = None
    amount: Optional[float] = None
    ref_no: Optional[str] = None
    comment: Optional[str] = None
    bill_no: Optional[str] = None


class SmileScanResponse(BaseModel):
    rows: list[SmileRow]