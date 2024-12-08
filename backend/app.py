from fastapi import FastAPI, File, UploadFile
import psycopg
from typing import Annotated
from pydantic import BaseModel
from fastapi import Depends
from psycopg.rows import dict_row
from fastapi.middleware.cors import CORSMiddleware
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
import ollama
import re

converter = PdfConverter(
    artifact_dict=create_model_dict(),
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Formula(BaseModel):
    name: str
    latex: str
    source: str


class FormulaInDb(Formula):
    id: int


def connection_factory():
    return psycopg.connect("postgresql://wysiwyg:randomPassword123!@localhost/wysiwyg", )


@app.get("/formulas")
def get_formulas(db: Annotated[psycopg.Connection, Depends(connection_factory)]):
    cur = db.cursor(row_factory=dict_row)
    cur.execute("SELECT id, name, latex, source FROM formulas")
    all = cur.fetchall()
    return list(map(FormulaInDb.model_validate, all))


@app.post("/formulas")
def create_formula(db: Annotated[psycopg.Connection, Depends(connection_factory)], formula: Formula):
    cur = db.cursor(row_factory=dict_row)
    cur.execute("INSERT INTO formulas(name, latex, source) VALUES (%s, %s, %s)",
                (formula.name, formula.latex, formula.source))
    db.commit()


@app.post("/parse")
def parse_pdf(db: Annotated[psycopg.Connection, Depends(connection_factory)], file: UploadFile):
    cur = db.cursor(row_factory=dict_row)
    f = open("temp.pdf", 'wb')
    f.write(file.file.read())
    f.close()
    rendered = converter("temp.pdf")
    text, _, images = text_from_rendered(rendered)
    matches_large = re.findall(r"\$\$[^\$]*\$\$", text)
    matches_small = re.findall(r"\$[^\$]*\$", text)
    for match in matches_large:
        cur.execute("INSERT INTO formulas(name, latex, source) VALUES (%s, %s, %s)", ("", match.strip('$'), "users"))
    db.commit()
    return list(map(lambda x: x.strip('$'), matches_large)), list(
        map(lambda x: x.strip('$'), filter(lambda x: x != '$$', matches_small)))
