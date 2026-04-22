// ═══════════════════════════════════════════════════════
//  MOTOJET — map.js  |  Leaflet map utilities
// ═══════════════════════════════════════════════════════

const MotoMap = {
  instances: {},

  // ── Maputo center ─────────────────────────────────────
  CENTER: [-25.9653, 32.5892],
  DEFAULT_ZOOM: 13,

  // ── Custom icons ──────────────────────────────────────
  icons: {
    pickup: L.divIcon({
      html: `<div style="
        width:36px;height:36px;border-radius:50% 50% 50% 4px;
        background:#2E7D32;border:3px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:16px;transform:rotate(-45deg);
        box-shadow:0 4px 12px rgba(0,0,0,0.4)">
        <span style="transform:rotate(45deg)">📍</span>
      </div>`,
      iconSize: [36, 36], iconAnchor: [18, 36], className: ''
    }),
    dropoff: L.divIcon({
      html: `<div style="
        width:36px;height:36px;border-radius:50% 50% 50% 4px;
        background:#D32F2F;border:3px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:16px;transform:rotate(-45deg);
        box-shadow:0 4px 12px rgba(0,0,0,0.4)">
        <span style="transform:rotate(45deg)">🎯</span>
      </div>`,
      iconSize: [36, 36], iconAnchor: [18, 36], className: ''
    }),
    rider: L.divIcon({
      html: `<div style="
        width:40px;height:40px;border-radius:50%;
        background:#FBC02D;border:3px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:20px;box-shadow:0 4px 16px rgba(251,192,45,0.5);
        animation:riderPulse 2s infinite">
        🏍️
      </div>`,
      iconSize: [40, 40], iconAnchor: [20, 20], className: ''
    })
  },

  // ── Create map ────────────────────────────────────────
  create(elementId, options = {}) {
    const map = L.map(elementId, {
      center: options.center || this.CENTER,
      zoom: options.zoom || this.DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    this.instances[elementId] = { map, markers: {}, route: null, riderMarker: null };
    return map;
  },

  // ── Draw route between two points ─────────────────────
  async drawRoute(mapId, from, to) {
    const inst = this.instances[mapId];
    if (!inst) return null;
    const { map } = inst;

    // Clear previous
    this.clearRoute(mapId);

    // Place markers
    inst.markers.pickup = L.marker([from.lat, from.lng], { icon: this.icons.pickup })
      .addTo(map)
      .bindPopup(`<b>📍 Recolha</b><br>${from.name || 'Ponto de recolha'}`, { className: 'moto-popup' });

    inst.markers.dropoff = L.marker([to.lat, to.lng], { icon: this.icons.dropoff })
      .addTo(map)
      .bindPopup(`<b>🎯 Entrega</b><br>${to.name || 'Ponto de entrega'}`, { className: 'moto-popup' });

    // Draw straight line (Leaflet doesn't need routing API)
    const routePoints = this._interpolateRoute(
      [from.lat, from.lng],
      [to.lat, to.lng]
    );

    inst.route = L.polyline(routePoints, {
      color: '#D32F2F',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 6',
      lineCap: 'round'
    }).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]);
    map.fitBounds(bounds, { padding: [60, 60] });

    return routePoints;
  },

  // ── Interpolate route points ──────────────────────────
  _interpolateRoute(from, to, steps = 20) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Add slight curve effect
      const midLat = (from[0] + to[0]) / 2 + (to[1] - from[1]) * 0.05;
      const midLng = (from[1] + to[1]) / 2 + (from[0] - to[0]) * 0.05;
      const lat = this._bezier(t, from[0], midLat, to[0]);
      const lng = this._bezier(t, from[1], midLng, to[1]);
      points.push([lat, lng]);
    }
    return points;
  },

  _bezier(t, p0, p1, p2) {
    return (1-t)**2 * p0 + 2*(1-t)*t * p1 + t**2 * p2;
  },

  // ── Simulate rider movement ───────────────────────────
  simulateRider(mapId, routePoints, onProgress) {
    const inst = this.instances[mapId];
    if (!inst || !routePoints || routePoints.length === 0) return;
    const { map } = inst;

    let i = 0;
    if (inst.riderMarker) inst.riderMarker.remove();

    inst.riderMarker = L.marker(routePoints[0], { icon: this.icons.rider }).addTo(map);

    const interval = setInterval(() => {
      i++;
      if (i >= routePoints.length) {
        clearInterval(interval);
        if (onProgress) onProgress(1, routePoints[routePoints.length - 1]);
        return;
      }
      inst.riderMarker.setLatLng(routePoints[i]);
      if (onProgress) onProgress(i / routePoints.length, routePoints[i]);
    }, 200);

    return interval;
  },

  // ── Clear route ───────────────────────────────────────
  clearRoute(mapId) {
    const inst = this.instances[mapId];
    if (!inst) return;
    Object.values(inst.markers).forEach(m => m && m.remove && m.remove());
    inst.markers = {};
    if (inst.route) { inst.route.remove(); inst.route = null; }
    if (inst.riderMarker) { inst.riderMarker.remove(); inst.riderMarker = null; }
  },

  // ── Add custom popup style ────────────────────────────
  injectStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .moto-popup .leaflet-popup-content-wrapper {
        background: #1E1E1E; border: 1px solid rgba(255,255,255,0.1);
        color: #F5F5F5; border-radius: 8px; font-family: 'Barlow', sans-serif;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }
      .moto-popup .leaflet-popup-tip { background: #1E1E1E; }
      .leaflet-control-attribution { background: rgba(0,0,0,0.5) !important; color: #666 !important; font-size: 10px !important; }
      @keyframes riderPulse {
        0%,100% { box-shadow: 0 4px 16px rgba(251,192,45,0.5); }
        50% { box-shadow: 0 4px 32px rgba(251,192,45,0.9); }
      }
    `;
    document.head.appendChild(style);
  },

  init() { this.injectStyle(); }
};

document.addEventListener('DOMContentLoaded', () => MotoMap.init());
