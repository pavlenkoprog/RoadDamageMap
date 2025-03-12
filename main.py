import os
import shutil

from fastapi import FastAPI, Form,  UploadFile, File
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
points_collection = db['RoadDamageCollection']  # Коллекция для хранения фотографий

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
    photo_data = []
    async for photo in points_collection.find():
        photo["_id"] = str(photo["_id"])  # Преобразуем ObjectId в строку
        photo_data.append(photo)

    return templates.TemplateResponse("index.html", {"request": request, "photo_data": photo_data})

# Новый endpoint для вывода всех документов из коллекции
@app.get("/photos")
async def get_photos():
    photo_data = []
    async for photo in points_collection.find():
        photo["_id"] = str(photo["_id"])  # Преобразуем ObjectId в строку
        photo_data.append(photo)
    return {"photos": photo_data}


UPLOAD_DIR = "/static/uploads"
# Гарантируем, что папка для загрузки существует
os.makedirs(UPLOAD_DIR, exist_ok=True)
@app.post("/add-point")
async def add_point(
    lat: float = Form(...),
    lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...)
):
    # Генерируем уникальное имя файла
    file_ext = os.path.splitext(file.filename)[1]  # Расширение файла (.jpg, .png)
    safe_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    # Сохраняем файл
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return {"success": False, "message": f"Ошибка при сохранении файла: {str(e)}"}

    # Добавляем точку в MongoDB
    point = {
        "lat": lat,
        "lon": lon,
        "timestamp": timestamp,
        "photo": file_path
    }
    await points_collection.insert_one(point)

    return {"success": True, "message": "Точка добавлена", "photo_path": file_path}