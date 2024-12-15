# wysiwyg 

## How to run this project
### Full docker
You can run full project in docker compose by using this command:
```
docker compose up
```
Importantly, you HAVE to have over 16GB of RAM to run this project.
Building the project would take probably more than 30min, 

### For backend development
1. Run other parts:
   1. If you choose to use Jaeger, you can run both postgres and jaeger with `docker compose -f devel/docker-compose.backend.yml up`.
   2. Otherwise, run postgres in your preferable way and set a connection string in `.env` file.
2. Go to directory: `cd backend`.
3. Create and activate a virtualenv:
   1. Windows (PowerShell): `py -3.11 -m venv .venv; ./.venv/Scripts/Activate.ps1`.
   2. Linux (Bash): `python3.11 -m venv .venv && source ./.venv/bin/activate`.
4. Install dependencies from requirements.txt using `pip install -r requirements.txt`.
5. Deactivate unnecessary features:
	1. Go to backend/.env and set `AI_WORKER_ENABLED` to False (so you don't need to run AI features).
	2. Go to backend/.env and set `JAEGER_ENABLED` to False (if you don't want to run OpenTelemetry).
6. Migrate a database: `python migrate.py "<connection-string>" latest`.
7. Run the backend: `uvicorn app:app`.
8. Enjoy =)

### For frontend development
1. Go to directory: `cd frontend`.
2. Install all the packages: `npm install`.
3. Run all backend parts with `docker compose -f devel/docker-compose.frontend.yml up`.
4. Start the project with `npm run dev`.
5. Enjoy =)



Issues might be occurred with worker because it download weights for pix2tex from github. 
Ensure it successfully started, then open the app. Otherwise you'll get Error 500.

