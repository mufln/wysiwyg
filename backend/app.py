from fastapi import FastAPI, File, UploadFile
import psycopg
from typing import Annotated

from ollama import ChatResponse, Client
from pydantic import BaseModel
from fastapi import Depends
from psycopg.rows import dict_row
from fastapi.middleware.cors import CORSMiddleware
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
import ollama
import re
import compare_functions

from cfg import DATABASE_URL

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
    return psycopg.connect(DATABASE_URL,)


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


@app.post("/parse_pdf")
def parse_pdf(db: Annotated[psycopg.Connection, Depends(connection_factory)], file: UploadFile):
    cur = db.cursor(row_factory=dict_row)
    f = open("temp.pdf", 'wb')
    f.write(file.file.read())
    f.close()
    rendered = converter("temp.pdf")
    text, _, images = text_from_rendered(rendered)
    results = []
    for match in  re.finditer(r"\$\$[^\$]*\$\$", text):
        formula = match.group()
        formula = formula.strip("$")
        context_span = max(0, match.span()[0]-1000), min(len(text), match.span()[1]+1000)
        context = text[context_span[0]:context_span[1]]
        response: ChatResponse = ollama.chat(model='llama3.2', messages=[
            {
                'role': 'user',
                'content': f'Describe all variables in formula "{formula}". For reference use the following context: "{context}". Do not include any other text. Write only descriptions of variables, separated by new line.',
            },
        ])
        name: ChatResponse = ollama.chat(model='llama3.2', messages=[
            {
                'role': 'user',
                'content': f'Give a name for formula "{formula}". For reference use the following context: "{context}". Do not include any other text. Write only name.',
            },
        ])
        cur.execute("INSERT INTO formulas(name, latex, source, description) VALUES (%s, %s, %s, %s)", (name.message.content, formula, "", str(response.message.content)))
        db.commit()
    return results


@app.post("/compare")
def compare(db: Annotated[psycopg.Connection, Depends(connection_factory)], formula: Formula):
    cur = db.cursor()
    cur.execute("SELECT latex FROM formulas")
    all = [row[0] for row in cur.fetchall()]
    result = [
        {"formula": db_formula, "percent": compare_functions.percent(formula.latex, db_formula)}
        for db_formula in all
    ]
    return result