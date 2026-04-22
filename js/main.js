// ═══════════════════════════════════════════════════════
//  MOTOJET — main.js  |  Core utilities & shared state
// ═══════════════════════════════════════════════════════

const MotoJet = {
  version: '1.0.0',
  whatsappNumber: '258878023732', // Replace with real number

  // ── Pricing ──────────────────────────────────────────
  pricing: {
    base: 100,
    perKm: 25,
    surgeMultiplier: 1.0,

    calculate(distanceKm) {
      const raw = this.base + distanceKm * this.perKm;
      return Math.ceil(raw * this.surgeMultiplier / 5) * 5; // round to 5
    },

    estimateTime(distanceKm) {
      // Average moto speed in Maputo ~30 km/h + 10min base
      return Math.ceil(10 + (distanceKm / 30) * 60);
    }
  },

  // ── Storage (localStorage as mock backend) ────────────
  storage: {
    _key: 'motojet_data',

    _load() {
      try { return JSON.parse(localStorage.getItem(this._key)) || {}; }
      catch { return {}; }
    },

    _save(data) {
      localStorage.setItem(this._key, JSON.stringify(data));
    },

    get(ns) { return this._load()[ns] || []; },

    set(ns, data) {
      const all = this._load();
      all[ns] = data;
      this._save(all);
    },

    push(ns, item) {
      const arr = this.get(ns);
      arr.push(item);
      this.set(ns, arr);
      return item;
    },

    update(ns, id, patch) {
      const arr = this.get(ns);
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; this.set(ns, arr); }
      return arr[idx];
    }
  },

  // ── Orders ────────────────────────────────────────────
  orders: {
    create(data) {
      const order = {
        id: 'MJ-' + Date.now().toString(36).toUpperCase(),
        ...data,
        status: 'recebido',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rider: null,
        timeline: [
          { status: 'recebido', time: new Date().toISOString(), label: 'Pedido recebido' }
        ]
      };
      MotoJet.storage.push('orders', order);
      MotoJet.events.emit('order:created', order);
      return order;
    },

    getAll() { return MotoJet.storage.get('orders'); },

    getById(id) { return this.getAll().find(o => o.id === id); },

    updateStatus(id, status) {
      const labels = {
        recebido: 'Pedido recebido',
        atribuido: 'Motoboy atribuído',
        coleta: 'Em coleta',
        rota: 'Em rota para entrega',
        entregue: 'Entregue com sucesso!'
      };
      const order = this.getById(id);
      if (!order) return null;
      order.timeline.push({ status, time: new Date().toISOString(), label: labels[status] });
      order.status = status;
      order.updatedAt = new Date().toISOString();
      MotoJet.storage.update('orders', id, order);
      MotoJet.events.emit('order:updated', order);
      return order;
    },

    // Seed demo data if empty
    seed() {
      if (this.getAll().length > 0) return;
      const demos = [
        { name: 'Carlos Machava', phone: '84 123 4567', pickup: 'Sommerschield, Maputo', dropoff: 'Costa do Sol, Maputo', type: 'Documentos', distance: 5.2, price: 230, payment: 'mpesa' },
        { name: 'Fátima Nhantumbo', phone: '85 987 6543', pickup: 'Polana, Maputo', dropoff: 'Bairro Central, Maputo', type: 'Encomenda pequena', distance: 2.8, price: 170, payment: 'emola' },
        { name: 'José Sithole', phone: '84 555 1234', pickup: 'Julius Nyerere, Maputo', dropoff: 'Matola, Maputo', type: 'Comida', distance: 8.1, price: 303, payment: 'dinheiro' },
      ];
      const statuses = ['entregue', 'rota', 'recebido'];
      demos.forEach((d, i) => {
        const o = this.create(d);
        if (statuses[i] !== 'recebido') this.updateStatus(o.id, statuses[i]);
      });
    }
  },

  // ── Riders ────────────────────────────────────────────
  riders: {
    getAll() { return MotoJet.storage.get('riders'); },

    seed() {
      if (this.getAll().length > 0) return;
      const riders = [
        { id: 'R001', name: 'António Bila', phone: '84 111 2233', plate: 'MZ-1234-A', rating: 4.8, online: true, orders: 47 },
        { id: 'R002', name: 'Domingos Cossa', phone: '85 444 5566', plate: 'MZ-5678-B', rating: 4.6, online: false, orders: 31 },
        { id: 'R003', name: 'Hélder Mondlane', phone: '84 777 8899', plate: 'MZ-9012-C', rating: 4.9, online: true, orders: 89 },
      ];
      MotoJet.storage.set('riders', riders);
    }
  },

  // ── Event bus ─────────────────────────────────────────
  events: {
    _listeners: {},
    on(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },
    emit(event, data) {
      (this._listeners[event] || []).forEach(fn => fn(data));
    }
  },

  // ── WhatsApp ──────────────────────────────────────────
  buildWhatsAppMessage(order) {
    const msg = `🏍️ *MOTOJET — Novo Pedido*\n\n`
      + `📋 *Pedido:* ${order.id}\n`
      + `👤 *Nome:* ${order.name}\n`
      + `📞 *Telefone:* ${order.phone}\n`
      + `📦 *Tipo:* ${order.type}\n\n`
      + `📍 *Recolha:* ${order.pickup}\n`
      + `🎯 *Entrega:* ${order.dropoff}\n\n`
      + `📏 *Distância:* ${order.distance} km\n`
      + `💰 *Preço:* ${order.price} MZN\n`
      + `💳 *Pagamento:* ${order.payment.toUpperCase()}\n\n`
      + `⏱️ Tempo estimado: ~${MotoJet.pricing.estimateTime(order.distance)} min`;
    return encodeURIComponent(msg);
  },

  openWhatsApp(order) {
    const msg = this.buildWhatsAppMessage(order);
    window.open(`https://wa.me/${this.whatsappNumber}?text=${msg}`, '_blank');
  },

  // ── Notifications ─────────────────────────────────────
  notify(title, msg, type = 'success') {
    const stack = document.getElementById('notif-stack') || (() => {
      const el = document.createElement('div');
      el.id = 'notif-stack';
      el.className = 'notification-stack';
      document.body.appendChild(el);
      return el;
    })();

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.innerHTML = `
      <span class="notif-icon">${icons[type]}</span>
      <div class="notif-body">
        <div class="notif-title">${title}</div>
        <div class="notif-msg">${msg}</div>
      </div>`;
    stack.appendChild(n);
    requestAnimationFrame(() => { requestAnimationFrame(() => n.classList.add('show')); });
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 400); }, 4000);
  },

  // ── Maputo Locations (for autocomplete / simulation) ──
  maputoLocations: [
    { name: 'Sommerschield', lat: -25.9500, lng: 32.5800 },
    { name: 'Polana', lat: -25.9650, lng: 32.5870 },
    { name: 'Julius Nyerere', lat: -25.9720, lng: 32.5720 },
    { name: 'Costa do Sol', lat: -25.9150, lng: 32.6050 },
    { name: 'Bairro Central', lat: -25.9610, lng: 32.5730 },
    { name: 'Maxaquene', lat: -25.9450, lng: 32.5680 },
    { name: 'Malhangalene', lat: -25.9560, lng: 32.5810 },
    { name: 'Alto Maé', lat: -25.9490, lng: 32.5760 },
    { name: 'Catembe', lat: -26.0250, lng: 32.5550 },
    { name: 'Matola', lat: -25.9660, lng: 32.4600 },
    { name: 'Zimpeto', lat: -25.8900, lng: 32.5000 },
    { name: 'Maputo Airport', lat: -25.9208, lng: 32.5732 },
    { name: 'Mercado do Povo', lat: -25.9640, lng: 32.5600 },
    { name: 'Jardim', lat: -25.9430, lng: 32.5830 },
    { name: 'Museu', lat: -25.9540, lng: 32.5780 },
  ],

  getLocation(name) {
    const lower = name.toLowerCase();
    return this.maputoLocations.find(l => l.name.toLowerCase().includes(lower))
      || this.maputoLocations[Math.floor(Math.random() * this.maputoLocations.length)];
  },

  // ── Haversine distance ────────────────────────────────
  calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  // ── Nav scroll effect ─────────────────────────────────
  initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });
  },

  // ── Init ──────────────────────────────────────────────
  init() {
    this.orders.seed();
    this.riders.seed();
    this.initNav();
    console.log('🏍️ MotoJet v' + this.version + ' initialized');
  }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => MotoJet.init());
