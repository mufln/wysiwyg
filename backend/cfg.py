import os

import dotenv

dotenv.load_dotenv()

DATABASE_URL = os.getenv("CONNECTION_STRING")