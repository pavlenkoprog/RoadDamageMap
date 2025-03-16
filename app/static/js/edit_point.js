document.addEventListener("DOMContentLoaded", function () {
    const editFormContainer = document.getElementById("edit-form-container");
    const editForm = document.getElementById("edit-point-form");

    // Функция открытия формы редактирования и заполнения данными
    window.editPhoto = function (photoId) {
        fetch(`/get-photo/${photoId}`)
            .then(response => response.json())
            .then(photo => {
                if (!photo.success) {
                    alert("Ошибка: " + photo.message);
                    return;
                }

                // Заполняем поля формы
                document.getElementById("edit-lat").value = photo.data.lat;
                document.getElementById("edit-lon").value = photo.data.lon;
                document.getElementById("edit-timestamp").value = photo.data.timestamp;
                document.getElementById("edit-id").value = photoId; // Скрытое поле для id

                // Открываем форму
                editFormContainer.style.display = "block";
            })
            .catch(error => console.error("Ошибка загрузки данных для редактирования:", error));
    };

    // Закрытие формы
    document.getElementById("close-edit-form").addEventListener("click", function () {
        editFormContainer.style.display = "none";
    });

    // Отправка формы редактирования
    editForm.addEventListener("submit", function (e) {
        e.preventDefault();  // Останавливаем стандартное поведение формы

        let formData = new FormData(editForm);

        fetch('/edit-point', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadMarkers(); // Перезагрузка маркеров
                editFormContainer.style.display = "none";
            } else {
                alert("Ошибка: " + data.message);
            }
        })
        .catch(error => {
            console.error("Ошибка при редактировании данных:", error);
        });

        return false;
    });
});
