var map;

document.addEventListener("DOMContentLoaded", function () {
    map = L.map('map', { attributionControl: false }).setView([44.952581, 34.101198], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

        var customIcon = L.icon({
        iconUrl: '/static/custom-marker.png', // путь к изображению маркера
        iconSize: [32, 32],  // размер иконки
        iconAnchor: [16, 32], // точка привязки к координатам
        popupAnchor: [0, -32] // точка появления всплывающего окна
    });

    var markers = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
            var count = cluster.getChildCount(); // Сколько маркеров в кластере
            var size = count < 10 ? "small" : count < 50 ? "medium" : "large";

            return L.divIcon({
                html: `<div class="cluster-${size}">${count}</div>`, // Количество маркеров в кластере
                className: 'custom-cluster',
                iconSize: L.point(40, 40)
            });
        }
    });


    // Выводим переданные данные в консоль
    console.log(photoData);
    // Преобразуем в нужный формат
    // Преобразуем список строк JSON в объекты и затем формируем нужный формат
     const photos = photoData.map(photo => {
        console.log(photo.photo)
        return {
            lat: photo.lat,
            lon: photo.lon,
            src: photo.photo
        };
    });
    console.log(photos);


//    var photos = [
//        { lat: 44.952581, lon: 34.101198, src: "/static/img/photo1.png" },
//        { lat: 44.953500, lon: 34.100800, src: "/static/img/photo2.png" },
//        { lat: 44.951300, lon: 34.102500, src: "/static/img/photo3.png" }
//    ];

    // Добавляем маркеры с попапами
    var customIcon = L.icon({
        iconUrl: '/static/img/brokenRoadIcon.png', // Путь к твоему изображению маркера
        iconSize: [32, 32],  // Размер иконки
        iconAnchor: [16, 32], // Точка привязки к координатам
        popupAnchor: [0, -32] // Точка появления всплывающего окна
    });

    function loadMarkers() {
        markers.clearLayers();
        photos.forEach(photo => {
            var popupContent = `<img src="${photo.src}" width="200" /><br>
                                <button onclick="deletePhoto('${photo.src}')">Удалить</button>`;

            var marker = L.marker([photo.lat, photo.lon], { icon: customIcon });
            marker.bindPopup(popupContent);
            markers.addLayer(marker);
        });

        map.addLayer(markers);
    }
    loadMarkers();

    function loadPhotos() {
        fetch("/photos")
            .then(response => response.json())
            .then(data => {
                markers.clearLayers(); // Очищаем маркеры перед загрузкой новых

                data.photos.forEach(photo => {
                    var popupContent = `<img src="${photo.photo}" width="200" /><br>
                                        <button onclick="deletePhoto('${photo.photo}')">Удалить</button>`;

                    var marker = L.marker([photo.lat, photo.lon]);
                    marker.bindPopup(popupContent);
                    markers.addLayer(marker);
                });

                map.addLayer(markers);
            })
            .catch(error => console.error("Ошибка загрузки фото:", error));
    }

    // Добавляем тепловую карту (Heatmap)
    var heatData = photos.map(photo => [photo.lat, photo.lon, 0.5]); // 1.0 - интенсивность точки

    var heatLayer = L.heatLayer(heatData, {
        radius: 100,    // Радиус размытия тепла
        blur: 40,      // Размытие
        maxZoom: 17,   // Максимальный зум, при котором виден эффект
        gradient: {    // Градиент красного цвета
            0.2: 'yellow',
            0.4: 'orange',
            0.6: 'red',
            1.0: 'darkred'
        }
    }).addTo(map);

    window.deletePhoto = function (photoSrc) {
        deletePhoto(photoSrc)
//        alert("Удаление фото: " + photoSrc);
    };
});
