from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.staticfiles import StaticFiles
from starlette.requests import Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import datetime

# Для запуска
# uvicorn main:app --reload

app = FastAPI()

# Настройка для обслуживания статических файлов
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Подключение к MongoDB
client = AsyncIOMotorClient("mongodb://localhost:27017")  # Здесь указываем URI подключения
db = client['RoadDamageDB']  # Название вашей базы данных
photos_collection = db['RoadDamageCollection']  # Коллекция для хранения фотографий

# Модель для данных фото
class Photo(BaseModel):
    coordinates: list
    photo_id: str = None
    created_at: datetime.datetime = datetime.datetime.now()

@app.on_event("startup")
async def startup_db():
    """Функция для инициализации подключения к MongoDB"""
    print("Подключение к MongoDB успешно выполнено")

@app.on_event("shutdown")
async def shutdown_db():
    """Функция для закрытия подключения при завершении работы приложения"""
    client.close()
    print("Соединение с MongoDB закрыто")

@app.get("/", response_class=HTMLResponse)
async def get_map(request: Request):
    photo_data = {
        "coordinates": [34.101198, 44.952581],
        "photo_id": None
    }
    return templates.TemplateResponse("index.html", {"request": request, "photo_data": photo_data})

# Новый endpoint для вывода всех документов из коллекции
@app.get("/photos")
async def get_photos():
    photos = []
    async for photo in photos_collection.find():
        photo["_id"] = str(photo["_id"])  # Преобразуем ObjectId в строку
        photos.append(photo)
    return {"photos": photos}
