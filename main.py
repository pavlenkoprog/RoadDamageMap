from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.staticfiles import StaticFiles
from starlette.requests import Request

#Для запуска
# uvicorn main:app --reload

app = FastAPI()

# Настройка для обслуживания статических файлов
app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

@app.get("/", response_class=HTMLResponse)
async def get_map(request: Request):
    photo_data = {
        "coordinates": [34.101198, 44.952581],
        "photo_id": None
    }
    return templates.TemplateResponse("index.html", {"request": request, "photo_data": photo_data})
