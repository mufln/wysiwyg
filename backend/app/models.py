from typing import Literal
import datetime
from pydantic import BaseModel


class Formula(BaseModel):
    name: str
    latex: str
    source: str


class FormulaInDb(Formula):
    id: int


class JobStatus(BaseModel):
    id: int
    status: Literal["pnd", "prc", "suc", "err", "arc"]
    datetime: datetime.datetime
