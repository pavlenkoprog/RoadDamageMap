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


function DrawHeatMap(markersData) {
    if (typeof heatLayer !== 'undefined') {
        map.removeLayer(heatLayer);
    }
    var heatData = markersData.map(marker => [marker.lat, marker.lon, 0.5]); // Интенсивность 0.5

    heatLayer = L.heatLayer(heatData, {
        radius: 100,
        blur: 40,
        maxZoom: 17,
        gradient: {
            0.2: 'yellow',
            0.4: 'orange',
            0.6: 'red',
            1.0: 'darkred'
        }
    }).addTo(map);
}


function loadMarkers() {
    fetch("/get-all-markers")
        .then(response => response.json())
        .then(data => {
            markers.clearLayers(); // Очищаем маркеры перед загрузкой новых

            data.markers_list.forEach(marker => {
            let template = document.getElementById('marker-template').innerHTML;
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = template;

            tempDiv.querySelector('.marker-photo').src = `/get-photo/${marker.photo_file_id}`;
            tempDiv.querySelector('.marker-lat').textContent = marker.lat;
            tempDiv.querySelector('.marker-lon').textContent = marker.lon;
            tempDiv.querySelector('.marker-timestamp').textContent = marker.timestamp;

            // Добавляем ID в data атрибуты
            tempDiv.querySelector('.delete-btn').setAttribute('data-id', marker._id);
            tempDiv.querySelector('.edit-btn').setAttribute('data-id', marker._id);

            var leafletMarker = L.marker([marker.lat, marker.lon], { icon: customIcon });

            // Bind popup с обработкой событий после открытия
            leafletMarker.bindPopup(tempDiv.innerHTML);

            leafletMarker.on('popupopen', function (e) {
                // Назначаем обработчики уже после открытия popup
                const popup = e.popup.getElement();

                popup.querySelector('.delete-btn').onclick = function () {
                    const id = this.getAttribute('data-id');
                    deleteMarker(id);
                };

                popup.querySelector('.edit-btn').onclick = function () {
                    const id = this.getAttribute('data-id');
                    editMarker(id);
                };
            });

            markers.addLayer(leafletMarker);
        });

            map.addLayer(markers);

            DrawHeatMap(data.markers_list);
        })
        .catch(error => console.error("Ошибка загрузки фото:", error));
}


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

loadMarkers();