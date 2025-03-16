import io

from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.responses import StreamingResponse
from starlette.staticfiles import StaticFiles
from starlette.requests import Request
from bson import ObjectId

from motor.motor_asyncio import AsyncIOMotorClient
from gridfs import GridFS
from pymongo import MongoClient

import os
import shutil
import datetime

# Для запуска
# uvicorn main:app --reload

app = FastAPI()
UPLOAD_DIR = "app/static/uploads"

# Настройка для обслуживания статических файлов
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Подключение к MongoDB
mongo_adress = "mongodb://localhost:27017"
client = AsyncIOMotorClient(mongo_adress)
db = client['RoadDamageDB']
road_damage_collection = db['RoadDamageCollection']
fs = GridFS(MongoClient(mongo_adress)["RoadDamageDB"])


@app.get("/", response_class=HTMLResponse)
async def get_map(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# Вывода всех документов из коллекции
@app.get("/get-all-markers")
async def get_all_markers():
    markers_list = []
    async for marker in road_damage_collection.find():
        marker["_id"] = str(marker["_id"])  # Преобразуем ObjectId в строку
        markers_list.append(marker)
    return {"markers_list": markers_list}


@app.get("/get-marker/{marker_id}")
async def get_marker(marker_id: str):
    try:
        object_id = ObjectId(marker_id)# Преобразуем строковый ID в ObjectId
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid marker ID format")

    marker = await road_damage_collection.find_one({"_id": object_id})
    if not marker:
        raise HTTPException(status_code=404, detail="Marker not found")

    marker["_id"] = str(marker["_id"])# Преобразуем ObjectId обратно в строку для JSON

    return {"success": True, "data": marker}

@app.get("/get-photo/{file_id}")
async def get_photo(file_id: str):
    try:
        oid = ObjectId(file_id)
        grid_out = fs.get(oid)
        content = grid_out.read()
        content_type = grid_out.content_type if hasattr(grid_out, "content_type") else "image/jpeg"
    except Exception as e:
        raise HTTPException(status_code=404, detail="Фото не найдено")
    return StreamingResponse(io.BytesIO(content), media_type=content_type)


@app.post("/add-marker")
async def add_marker(
    lat: float = Form(...),
    lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...)
):
    # Сохранение фото
    file_data = await file.read()
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
    file_id = fs.put(file_data, filename=safe_filename, content_type=file.content_type)

    # Добавляем запись в MongoDB
    point = {
        "lat": lat,
        "lon": lon,
        "timestamp": timestamp,
        "photo_file_id": str(file_id)
    }
    await road_damage_collection.insert_one(point)
    return {"success": True}


@app.post("/delete-marker")
async def delete_marker(request: Request):
    data = await request.json()
    marker_id = data.get("id")  # Получаем _id из запроса

    if not marker_id:
        return {"success": False, "message": "Некорректный ID"}

    # Удаляем запись из MongoDB по _id
    result = await road_damage_collection.delete_one({"_id": ObjectId(marker_id)})
    if result.deleted_count > 0:
        return {"success": True, "message": "Запись удалена из базы"}
    else:
        return {"success": False, "message": "Запись не найдена в базе"}


# Метод редактирования записи
@app.post("/edit-marker")
async def edit_marker(
    marker_id: str = Form(...),        # Получаем ID маркера
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
        # Сохранение фото
        file_data = await file.read()
        file_ext = os.path.splitext(file.filename)[1]
        safe_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
        file_id = fs.put(file_data, filename=safe_filename, content_type=file.content_type)
        update_data["photo_file_id"] = str(file_id)

    # Обновляем запись в MongoDB
    result = await road_damage_collection.update_one(
        {"_id": ObjectId(marker_id)},
        {"$set": update_data}
    )

    if result.modified_count > 0:
        return {"success": True, "message": "Данные обновлены"}
    else:
        return {"success": False, "message": "Не удалось обновить данные"}
