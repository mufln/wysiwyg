from io import BytesIO

import pika
import os
import tempfile
import ollama
import psycopg
import re
from psycopg.rows import dict_row
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from PIL import Image
from pix2tex.cli import LatexOCR

print("Please, wait! Models are now loading (it will load models from hf.co on the first startup, next loadings will be much faster since they will be loaded from disk.")
converter = PdfConverter(
    artifact_dict=create_model_dict(),
)
model = LatexOCR()
print("Done loading models!")

AMQP_DSN = os.getenv("AMQP_DSN")
AI_PDF_QUEUE = os.getenv("AI_PDF_QUEUE")
AI_LATEX_OCR_QUEUE = os.getenv("AI_LATEX_OCR_QUEUE")
POSTGRES_DSN = os.getenv("POSTGRES_DSN")
OLLAMA_URL = os.getenv("OLLAMA_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")


client = ollama.Client(OLLAMA_URL)

def connect_to_rabbitmq():
    connection = pika.BlockingConnection(pika.URLParameters(AMQP_DSN))
    channel = connection.channel()
    channel.queue_declare(queue=AI_PDF_QUEUE)
    return connection, channel

def connect_to_database() -> psycopg.Connection:
    return psycopg.connect(POSTGRES_DSN)

def process_pdf(_ch, _method, properties, body):
    db = connect_to_database()
    ids = []
    db.execute("UPDATE jobs SET status='prc' WHERE id=%s", (int(properties.correlation_id),))
    db.commit()
    # Save PDF content to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_pdf:
        temp_pdf.write(body)
        temp_pdf_path = temp_pdf.name

    try:
        rendered = converter(temp_pdf_path)
        text, _, _ = text_from_rendered(rendered)
        for match in re.finditer(r"\$\$[^\$]*\$\$", text):
            cur = db.cursor(row_factory=dict_row)
            formula = match.group()
            formula = formula.strip("$")
            context_span = max(0, match.span()[0]-1000), min(len(text), match.span()[1]+1000)
            context = text[context_span[0]:context_span[1]]
            response: ollama.ChatResponse = ollama.chat(model='llama3.2', messages=[
                {
                    'role': 'user',
                    'content': f'Describe all variables in formula "{formula}". For reference use the following context: "{context}". Do not include any other text. Write only descriptions of variables, separated by new line.',
                },
            ])
            name: ollama.ChatResponse = ollama.chat(model='llama3.2', messages=[
                {
                    'role': 'user',
                    'content': f'Give a name for formula "{formula}". For reference use the following context: "{context}". Do not include any other text. Write only name.',
                },
            ])
            cur.execute("INSERT INTO formulas(name, latex, source, description) VALUES (%s, %s, %s, %s) RETURNING id", (name.message.content, formula, "", str(response.message.content)))
            ids.append(cur.fetchone()["id"])
            db.commit()
        cur = db.cursor(row_factory=dict_row)
        cur.execute("INSERT INTO import_results(job_id) VALUES (%s) RETURNING id", (int(properties.correlation_id),))
        results_id = cur.fetchone()["id"]
        for idx in ids:
            cur.execute("INSERT INTO import_results_entries(result_id, formula_id) VALUES (%s, %s)", (int(results_id), idx))
        db.execute("UPDATE jobs SET status='suc' WHERE id=%s", (int(properties.correlation_id),))
        db.commit()
    except Exception as e:
        db.execute("UPDATE jobs SET status='err' WHERE id=%s", (int(properties.correlation_id),))
        db.commit()
        print(f"Error processing PDF: {str(e)}")
    finally:
        db.close()
        os.unlink(temp_pdf_path)


def process_image(ch: pika.adapters.blocking_connection.BlockingChannel, _method, properties, body):
    img = Image.open(BytesIO(body))
    latex = model(img)
    ch.basic_publish(exchange='', routing_key=properties.reply_to, body=latex.encode("utf-8"))

def main():
    client.pull(OLLAMA_MODEL)
    print('Worker is waiting for messages. To exit press CTRL+C')
    connection, channel = connect_to_rabbitmq()
    channel.queue_declare(queue=AI_PDF_QUEUE)
    channel.queue_declare(queue=AI_LATEX_OCR_QUEUE)
    channel.basic_consume(queue=AI_PDF_QUEUE, on_message_callback=process_pdf, auto_ack=True)
    channel.basic_consume(queue=AI_LATEX_OCR_QUEUE, on_message_callback=process_image, auto_ack=True)
    channel.start_consuming()

if __name__ == '__main__':
    main()
