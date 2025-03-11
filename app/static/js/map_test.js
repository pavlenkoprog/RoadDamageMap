document.addEventListener("DOMContentLoaded", function() {
    var map = L.map('map', { attributionControl: false }).setView([44.952581, 34.101198], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var markers = L.markerClusterGroup();
    var roads = {};  // Словарь дорог

    var photos = [
        { lat: 44.952581, lon: 34.101198, src: "/static/img/photo1.jpg" },
        { lat: 44.953500, lon: 34.100800, src: "/static/img/photo2.jpg" },
        { lat: 44.951300, lon: 34.102500, src: "/static/img/photo3.jpg" }
    ];

    photos.forEach(photo => {
        var popupContent = `<img src="${photo.src}" width="200" /><br>
                            <button onclick="deletePhoto('${photo.src}')">Удалить</button>`;

        var marker = L.marker([photo.lat, photo.lon]);
        marker.bindPopup(popupContent);
        markers.addLayer(marker);

        highlightRoadById(photo.lat, photo.lon);

    });

    map.addLayer(markers);

    function getStreetInfo(lat, lon, callback) {
        var url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&extratags=1`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.osm_id) {
                    console.log(`📍 Найдена дорога: ${data.address.road || "Без названия"} (ID: ${data.osm_id})`);
                    callback(data.osm_id, data.address.road || "Неизвестная улица");
                } else {
                    console.warn(`⚠️ Дорога не найдена для координат: ${lat}, ${lon}`);
                }
            })
            .catch(error => console.error("Ошибка при запросе геокодинга:", error));
    }

    function getRoadGeometry(osm_id, callback) {
        var overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];way(${osm_id});out geom;`;

        fetch(overpassUrl)
            .then(response => response.json())
            .then(data => {
                if (data.elements.length > 0) {
                    var element = data.elements[0];
                    if (element.type === 'way') {
                        var roadCoords = element.geometry.map(pt => [pt.lat, pt.lon]);
                        callback(roadCoords);
                    } else {
                        console.warn(`⚠️ OSM ID: ${osm_id} не является дорогой (way). Тип: ${element.type}`);
                    }
                } else {
                    console.warn(`⚠️ Не найдена геометрия для OSM ID: ${osm_id}`);
                }
            })
            .catch(error => console.error("Ошибка запроса Overpass API:", error));
    }

    function highlightRoadById(lat, lon) {
        getStreetInfo(lat, lon, function(osm_id, roadName) {
            console.log(`🚦 Выделение дороги: ${roadName} (ID: ${osm_id})`);

            getRoadGeometry(osm_id, function(roadCoords) {
                if (!roads[osm_id]) {
                    roads[osm_id] = L.polyline(roadCoords, { color: "gray", weight: 5 }).addTo(map);
                }
                roads[osm_id].setStyle({ color: "red" });
            });
        });
    }

    window.deletePhoto = function(photoSrc) {
        alert("Удаление фото: " + photoSrc);
    };
});
