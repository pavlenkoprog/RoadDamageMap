var map = L.map('map', { attributionControl: false }).setView([44.952581, 34.101198], 13);

// Внешний вид маркеров
var customIcon = L.icon({
    iconUrl: '/static/img/brokenRoadIcon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
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

function loadMarkers() {
    fetch("/load-markers")
        .then(response => response.json())
        .then(data => {
            markers.clearLayers(); // Очищаем маркеры перед загрузкой новых

            data.photos.forEach(photo => {
                    var popupContent = `
                        <img src="${photo.photo}" width="200" /><br>
                        <button onclick="deletePhoto('${photo._id}')">Удалить</button>
                        <button onclick="editPhoto('${photo._id}')">Редактировать</button>
                    `; // Передаем _id

                var marker = L.marker([photo.lat, photo.lon], { icon: customIcon });
                marker.bindPopup(popupContent);
                markers.addLayer(marker);
            });

            map.addLayer(markers);
        })
        .catch(error => console.error("Ошибка загрузки фото:", error));
}



document.addEventListener("DOMContentLoaded", function () {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    loadMarkers();

    // Отрисовка тепловой карты
    var heatData = photoData.map(photo => [photo.lat, photo.lon, 0.5]); //  интенсивность точки
    var heatLayer = L.heatLayer(heatData, {
        radius: 100,   // Радиус размытия тепла
        blur: 40,      // Размытие
        maxZoom: 17,   // Максимальный зум, при котором виден эффект
        gradient: {    // Градиент красного цвета
            0.2: 'yellow',
            0.4: 'orange',
            0.6: 'red',
            1.0: 'darkred'
        }
    }).addTo(map);

});
