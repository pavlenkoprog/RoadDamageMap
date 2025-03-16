function deletePhoto(photoId) {
    fetch("/delete-photo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: photoId }),  // Отправляем _id вместо photoSrc
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadMarkers();  // Обновляем маркеры
        } else {
            alert("Ошибка: " + data.message);
        }
    })
    .catch(error => console.error("Ошибка удаления фото:", error));
}
