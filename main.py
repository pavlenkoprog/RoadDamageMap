import os
import shutil

from bson import ObjectId
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pymongo import ReturnDocument
from starlette.responses import JSONResponse
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
road_damage_collection = db['RoadDamageCollection']  # Коллекция для хранения фотографий

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
    async for marker in road_damage_collection.find():
        marker["_id"] = str(marker["_id"])  # Преобразуем ObjectId в строку
        photo_data.append(marker)

    return templates.TemplateResponse("index.html", {"request": request, "photo_data": photo_data})

# Новый endpoint для вывода всех документов из коллекции
@app.get("/load-markers")
async def get_photos():
    photo_data = []
    async for marker in road_damage_collection.find():
        marker["_id"] = str(marker["_id"])  # Преобразуем ObjectId в строку
        photo_data.append(marker)
    return {"photos": photo_data}


@app.get("/get-photo/{photo_id}")
async def get_photo(photo_id: str):
    # Преобразуем строковый ID в ObjectId
    try:
        object_id = ObjectId(photo_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid photo ID format")

    # Ищем фото в базе данных по ID
    photo = await road_damage_collection.find_one({"_id": object_id})

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Преобразуем ObjectId обратно в строку для JSON
    photo["_id"] = str(photo["_id"])

    return {"success": True, "data": photo}

UPLOAD_DIR = "app/static/uploads"
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
    # try:
    #     with open(file_path, "wb") as buffer:
    #         shutil.copyfileobj(file.file, buffer)
    # except Exception as e:
    #     return {"success": False, "message": f"Ошибка при сохранении файла: {str(e)}"}

    # Добавляем точку в MongoDB
    point = {
        "lat": lat,
        "lon": lon,
        "timestamp": timestamp,
        "photo": file_path
    }
    await road_damage_collection.insert_one(point)

    return {"success": True}


@app.post("/delete-photo")
async def delete_photo(request: Request):
    data = await request.json()
    photo_id = data.get("id")  # Получаем _id из запроса

    if not photo_id:
        return {"success": False, "message": "Некорректный ID"}

    # Удаляем запись из MongoDB по _id
    result = await road_damage_collection.delete_one({"_id": ObjectId(photo_id)})

    if result.deleted_count > 0:
        return {"success": True, "message": "Запись удалена из базы"}
    else:
        return {"success": False, "message": "Запись не найдена в базе"}


# Метод редактирования записи
@app.post("/edit-point")
async def edit_point(
    photo_id: str = Form(...),        # Получаем ID маркера
    lat: float = Form(...),
    lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(None)     # Файл может быть необязательным (не всегда заменяем фото)
):
    update_data = {
        "lat": lat,
        "lon": lon,
        "timestamp": timestamp
    }

    # Если загружено новое фото — сохраняем
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        new_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        update_data["photo"] = file_path

    # Обновляем запись в MongoDB
    result = await road_damage_collection.update_one(
        {"_id": ObjectId(photo_id)},
        {"$set": update_data}
    )

    if result.modified_count > 0:
        return {"success": True, "message": "Данные обновлены"}
    else:
        return {"success": False, "message": "Не удалось обновить данные"}
