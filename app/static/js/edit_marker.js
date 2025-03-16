document.addEventListener("DOMContentLoaded", function () {
    const editFormContainer = document.getElementById("edit-form-container");
    const editForm = document.getElementById("edit-marker-form");

    // Функция открытия формы редактирования и заполнения данными
    window.editMarker = function (markerId) {
        fetch(`/get-marker/${markerId}`)
            .then(response => response.json())
            .then(marker => {
                if (!marker.success) {
                    alert("Ошибка: " + marker.message);
                    return;
                }

                // Заполняем поля формы
                document.getElementById("edit-lat").value = marker.data.lat;
                document.getElementById("edit-lon").value = marker.data.lon;
                document.getElementById("edit-timestamp").value = marker.data.timestamp;
                document.getElementById("edit-id").value = markerId; // Скрытое поле для id

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

        fetch('/edit-marker', {
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
