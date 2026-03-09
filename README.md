# engsoftware2
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Protótipo WebGIS</title>
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      font-family: Arial, sans-serif;
    }

    #map {
      width: 100%;
      height: 100%;
    }

    .topbar {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1000;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding: 8px;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      max-width: calc(100% - 24px);
    }

    .topbar button, .topbar select, .topbar input[type="file"] {
      border: 1px solid #ccc;
      background: #fff;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 14px;
    }

    .topbar button, .topbar select {
      cursor: pointer;
    }

    .topbar button:hover {
      background: #f3f3f3;
    }

    .objetivo {
      width: 100%;
      font-size: 12px;
      color: #444;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="objetivo"><strong>Objetivo:</strong> visualizar restaurantes por perto.</div>
    <label for="baseMap">Mapa base:</label>
    <select id="baseMap" aria-label="Selecionar mapa base">
      <option value="ruas">Ruas</option>
      <option value="satelite">Satélite</option>
    </select>
    <button id="btnGeo" type="button">Minha localização</button>
    <button id="btnRestaurantes" type="button">Restaurantes próximos</button>
    <input
      id="layerFile"
      type="file"
      accept=".geojson,.json,.kml,.zip,.shp"
      aria-label="Adicionar camada KML, SHP ou GeoJSON"
    />
  </div>
  <div id="map" aria-label="Mapa interativo"></div>

  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script src="https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>
  <script src="https://unpkg.com/shpjs@latest/dist/shp.min.js"></script>
  <script>
    // Inicializa o mapa com centro no Brasil
    const map = L.map("map", {
      center: [-14.235, -51.9253],
      zoom: 4,
      zoomControl: false
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Camadas base
    const ruas = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    });

    const satelite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri"
      }
    );

    ruas.addTo(map);

    const selectBaseMap = document.getElementById("baseMap");
    let camadaAtual = ruas;
    let marcadorUsuario = null;
    let circuloPrecisao = null;
    const camadaRestaurantes = L.featureGroup().addTo(map);
    const camadasUsuario = L.featureGroup().addTo(map);

    selectBaseMap.addEventListener("change", () => {
      map.removeLayer(camadaAtual);
      camadaAtual = selectBaseMap.value === "satelite" ? satelite : ruas;
      camadaAtual.addTo(map);
    });

    // Geolocalização do usuário
    document.getElementById("btnGeo").addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocalização não suportada neste navegador.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          if (marcadorUsuario) {
            map.removeLayer(marcadorUsuario);
          }
          if (circuloPrecisao) {
            map.removeLayer(circuloPrecisao);
          }

          marcadorUsuario = L.marker([lat, lon]).addTo(map);
          marcadorUsuario.bindPopup("Você está aqui.").openPopup();

          circuloPrecisao = L.circle([lat, lon], {
            radius: accuracy,
            color: "#136aec",
            fillColor: "#136aec",
            fillOpacity: 0.15
          }).addTo(map);

          map.setView([lat, lon], 16);
        },
        (err) => {
          alert("Não foi possível obter sua localização: " + err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    });

    // Busca restaurantes por perto usando Overpass API
    async function buscarRestaurantesProximos() {
      const center = map.getCenter();
      const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:2000,${center.lat},${center.lng});
  way["amenity"="restaurant"](around:2000,${center.lat},${center.lng});
  relation["amenity"="restaurant"](around:2000,${center.lat},${center.lng});
);
out center tags;`;

      camadaRestaurantes.clearLayers();

      try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: overpassQuery
        });
        if (!response.ok) {
          throw new Error("Falha ao consultar os restaurantes.");
        }

        const data = await response.json();
        const elementos = data.elements || [];

        if (!elementos.length) {
          alert("Nenhum restaurante encontrado em até 2 km do centro atual do mapa.");
          return;
        }

        elementos.forEach((el) => {
          const lat = el.lat || (el.center && el.center.lat);
          const lon = el.lon || (el.center && el.center.lon);
          if (lat == null || lon == null) return;

          const nome = (el.tags && el.tags.name) || "Restaurante sem nome";
          const cozinha = (el.tags && el.tags.cuisine) || "Não informado";

          L.circleMarker([lat, lon], {
            radius: 6,
            color: "#c62828",
            fillColor: "#e53935",
            fillOpacity: 0.85
          })
            .bindPopup(`<strong>${nome}</strong><br/>Culinária: ${cozinha}`)
            .addTo(camadaRestaurantes);
        });

        const bounds = camadaRestaurantes.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.15));
        }
      } catch (error) {
        alert("Erro ao buscar restaurantes: " + error.message);
      }
    }

    document.getElementById("btnRestaurantes").addEventListener("click", buscarRestaurantesProximos);

    // Adiciona camadas de arquivos (GeoJSON, KML, SHP em .zip)
    document.getElementById("layerFile").addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const nomeArquivo = file.name.toLowerCase();

      try {
        let layer;

        if (nomeArquivo.endsWith(".geojson") || nomeArquivo.endsWith(".json")) {
          const text = await file.text();
          const geojson = JSON.parse(text);
          layer = L.geoJSON(geojson);
        } else if (nomeArquivo.endsWith(".kml")) {
          const text = await file.text();
          layer = omnivore.kml.parse(text);
        } else if (nomeArquivo.endsWith(".zip")) {
          const buffer = await file.arrayBuffer();
          const geojson = await shp(buffer);
          layer = L.geoJSON(geojson);
        } else if (nomeArquivo.endsWith(".shp")) {
          alert("Para shapefile, envie um arquivo .zip contendo .shp, .shx e .dbf.");
          return;
        } else {
          alert("Formato não suportado. Use KML, GeoJSON/JSON ou Shapefile em .zip.");
          return;
        }

        layer.addTo(camadasUsuario);

        const bounds = layer.getBounds && layer.getBounds();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1));
        }
      } catch (error) {
        alert("Não foi possível carregar a camada: " + error.message);
      } finally {
        event.target.value = "";
      }
    });
  </script>
</body>
</html>
