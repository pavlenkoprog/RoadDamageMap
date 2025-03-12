document.addEventListener("DOMContentLoaded", function () {
    const formContainer = document.getElementById("form-container");
    const form = document.getElementById("add-point-form"); // Получаем форму
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

    // Открытие формы по ПКМ
    map.on("contextmenu", function (e) {
        console.log("contextmenu")
        openForm(e.latlng.lat, e.latlng.lng);
    });

    // Кнопка закрытия
    document.getElementById("close-form").addEventListener("click", closeForm);

    // Отправка формы в MongoDB без перезагрузки
    form.addEventListener("submit", function (e) {
        e.preventDefault();  // Останавливаем стандартное поведение формы

        let formData = new FormData(form);

        fetch('/add-point', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Добавляем маркер на карту
                var marker = L.marker([parseFloat(formData.get('lat')), parseFloat(formData.get('lon'))]);
                marker.bindPopup(`<img src="${data.photo_path}" width="200">`);
                markers.addLayer(marker);

                alert(data.message);
                closeForm(); // Закрываем форму после успешной отправки
            } else {
                alert("Ошибка: " + data.message);
            }
        })
        .catch(error => {
            console.error("Ошибка при отправке данных:", error);
        });
        closeForm();
        loadMarkers();
        window.location.href = "/";
        location.reload();
        return false; // ВАЖНО! Останавливает дальнейшую обработку формы
    });
});
