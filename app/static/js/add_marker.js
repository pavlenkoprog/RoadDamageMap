document.addEventListener("DOMContentLoaded", function () {
    const formContainer = document.getElementById("add-form-container");
    const form = document.getElementById("add-marker-form"); // Получаем форму
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

    form.addEventListener("submit", function (e) {
        e.preventDefault();  // Останавливаем стандартное поведение формы

        let formData = new FormData(form);

        fetch('/add-marker', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadMarkers();
                closeForm();
            } else {
                alert("Ошибка: " + data.message);
            }
        })
        .catch(error => {
            console.error("Ошибка при отправке данных:", error);
        });
        closeForm();
//        window.location.href = "/";
        return false;
    });
});
