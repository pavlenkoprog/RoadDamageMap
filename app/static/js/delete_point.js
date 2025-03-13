function deletePhoto(photoSrc) {
    console.log("function deletePhoto(photoSrc) {")
    if (!confirm("Вы уверены, что хотите удалить фото?")) return;

    fetch("/delete-photo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ photo: photoSrc }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Фото удалено!");
            // Перезагружаем метки на карте
            loadPhotos();
        } else {
            alert("Ошибка: " + data.message);
        }
    })
    .catch(error => console.error("Ошибка удаления фото:", error));
}