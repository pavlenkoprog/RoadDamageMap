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
                    var popupContent = `
                        <img src="${marker.photo}" width="200" /><br>
                        <button onclick="deleteMarker('${marker._id}')">Удалить</button>
                        <button onclick="editMarker('${marker._id}')">Редактировать</button>
                    `; // Передаем _id

                var marker = L.marker([marker.lat, marker.lon], { icon: customIcon });
                marker.bindPopup(popupContent);
                markers.addLayer(marker);
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