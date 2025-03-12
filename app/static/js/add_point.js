document.addEventListener("DOMContentLoaded", function () {
    const formContainer = document.getElementById("form-container");
    let formOpen = false; // Флаг состояния формы

    function openForm(lat, lon) {
        document.getElementById("lat").value = lat.toFixed(6);
        document.getElementById("lon").value = lon.toFixed(6);
        document.getElementById("timestamp").value = new Date().toISOString();
        formContainer.style.display = "block";
        formOpen = true;
    }

    function closeForm() {
        formContainer.style.display = "none";
        formOpen = false;
    }

    // Открытие формы по ЛКМ
    map.on("contextmenu", function (e) {
        console.log("contextmenu")
        openForm(e.latlng.lat, e.latlng.lng);
    });

    // Кнопка закрытия
    document.getElementById("close-form").addEventListener("click", closeForm);

    // Отправка формы в MongoDB
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        let formData = new FormData(form);

        fetch("/add-point", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Точка успешно добавлена!");
                closeForm();
                location.reload(); // Перезагрузка страницы для обновления карты
            } else {
                alert("Ошибка при добавлении точки!");
            }
        })
        .catch(error => console.error("Ошибка:", error));
    });
});
