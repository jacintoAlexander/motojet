// ═══════════════════════════════════════════════════════
//  MOTOJET — app.js  |  Order flow controller
// ═══════════════════════════════════════════════════════

const App = {
  state: {
    step: 1,
    totalSteps: 3,
    orderData: {},
    currentOrder: null,
    routePoints: null,
    mapInstance: null,
    from: null,
    to: null,
    simulationInterval: null,
  },

  // ── Init ──────────────────────────────────────────────
  init() {
    this.renderStep(1);
    this.updateProgress();
    // Check if returning to track an order
    const trackId = new URLSearchParams(location.search).get('track');
    if (trackId) {
      const order = MotoJet.orders.getById(trackId);
      if (order) { this.state.currentOrder = order; this.showTracking(); }
    }
  },

  // ── Progress bar ──────────────────────────────────────
  updateProgress() {
    const pct = ((this.state.step - 1) / (this.state.totalSteps - 1)) * 100;
    const bar = document.getElementById('progress-fill');
    if (bar) bar.style.width = pct + '%';
    const label = document.getElementById('step-label');
    if (label) {
      const labels = ['', 'Seus dados', 'Endereços', 'Confirmar'];
      label.textContent = `Passo ${this.state.step}/3 — ${labels[this.state.step]}`;
    }
  },

  // ── Render steps ──────────────────────────────────────
  renderStep(step) {
    const container = document.getElementById('step-container');
    if (!container) return;
    this.state.step = step;
    this.updateProgress();

    const templates = {
      1: this.tplStep1(),
      2: this.tplStep2(),
      3: this.tplStep3(),
    };

    container.innerHTML = templates[step] || '';
    container.style.animation = 'none';
    requestAnimationFrame(() => {
      container.style.animation = 'fadeSlide 0.35s ease forwards';
    });

    this.bindStep(step);
  },

  // ── Step templates ────────────────────────────────────
  tplStep1() {
    return `
    <div class="step-content">
      <h2 style="font-family:var(--font-display);font-size:32px;font-weight:900;margin-bottom:6px">
        Seus dados 👤
      </h2>
      <p style="color:var(--gray);margin-bottom:28px;font-size:14px">Para confirmação e contacto</p>

      <div class="form-group">
        <label>Nome completo</label>
        <input class="form-control" id="inp-name" type="text" placeholder="Ex: João Machava"
          value="${this.state.orderData.name || ''}">
      </div>
      <div class="form-group">
        <label>Telefone</label>
        <input class="form-control" id="inp-phone" type="tel" placeholder="84 XXX XXXX"
          value="${this.state.orderData.phone || ''}">
      </div>
      <div class="form-group">
        <label>Tipo de encomenda</label>
        <select class="form-control" id="inp-type">
          <option value="">Selecione o tipo...</option>
          <option ${this.state.orderData.type==='Documentos'?'selected':''}>Documentos</option>
          <option ${this.state.orderData.type==='Encomenda pequena'?'selected':''}>Encomenda pequena</option>
          <option ${this.state.orderData.type==='Encomenda grande'?'selected':''}>Encomenda grande</option>
          <option ${this.state.orderData.type==='Comida'?'selected':''}>Comida</option>
          <option ${this.state.orderData.type==='Medicamentos'?'selected':''}>Medicamentos</option>
          <option ${this.state.orderData.type==='Outro'?'selected':''}>Outro</option>
        </select>
      </div>

      <button class="btn btn-primary btn-block btn-lg" id="btn-next1">
        Continuar →
      </button>
    </div>`;
  },

  tplStep2() {
    return `
    <div class="step-content">
      <h2 style="font-family:var(--font-display);font-size:32px;font-weight:900;margin-bottom:6px">
        Endereços 📍
      </h2>
      <p style="color:var(--gray);margin-bottom:28px;font-size:14px">Onde recolher e onde entregar</p>

      <div class="form-group">
        <label>Local de recolha</label>
        <input class="form-control" id="inp-pickup" type="text"
          placeholder="Ex: Sommerschield, junto ao banco"
          value="${this.state.orderData.pickup || ''}">
        <div id="pickup-suggest" class="suggest-list"></div>
      </div>
      <div class="form-group">
        <label>Local de entrega</label>
        <input class="form-control" id="inp-dropoff" type="text"
          placeholder="Ex: Costa do Sol, Av. Friedrich Engels"
          value="${this.state.orderData.dropoff || ''}">
        <div id="dropoff-suggest" class="suggest-list"></div>
      </div>
      <div class="form-group">
        <label>Notas adicionais (opcional)</label>
        <textarea class="form-control" id="inp-notes" rows="2"
          placeholder="Referências ou instruções especiais..."
          style="resize:none">${this.state.orderData.notes || ''}</textarea>
      </div>

      <!-- Mini map -->
      <div style="border-radius:12px;overflow:hidden;margin-bottom:20px;border:1px solid var(--card-border)">
        <div id="mini-map" style="height:200px"></div>
      </div>

      <div style="display:flex;gap:12px">
        <button class="btn btn-secondary" id="btn-back2">← Voltar</button>
        <button class="btn btn-primary" id="btn-next2" style="flex:1">
          Ver preço →
        </button>
      </div>
    </div>`;
  },

  tplStep3() {
    const d = this.state.orderData;
    const dist = d.distance || 0;
    const price = d.price || 0;
    const time = MotoJet.pricing.estimateTime(dist);
    return `
    <div class="step-content">
      <h2 style="font-family:var(--font-display);font-size:32px;font-weight:900;margin-bottom:6px">
        Confirmar pedido ✅
      </h2>
      <p style="color:var(--gray);margin-bottom:24px;font-size:14px">Revise os detalhes antes de confirmar</p>

      <!-- Summary card -->
      <div style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;padding:24px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);font-size:14px">
          <span style="color:var(--gray)">👤 Nome</span><strong>${d.name}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);font-size:14px">
          <span style="color:var(--gray)">📞 Telefone</span><strong>${d.phone}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);font-size:14px">
          <span style="color:var(--gray)">📦 Tipo</span><strong>${d.type}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);font-size:14px">
          <span style="color:var(--gray)">📍 Recolha</span><strong style="text-align:right;max-width:55%">${d.pickup}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);font-size:14px">
          <span style="color:var(--gray)">🎯 Entrega</span><strong style="text-align:right;max-width:55%">${d.dropoff}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);font-size:14px">
          <span style="color:var(--gray)">📏 Distância</span><strong>${dist.toFixed(1)} km</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);font-size:14px">
          <span style="color:var(--gray)">⏱️ Tempo estimado</span><strong>~${time} min</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0 4px;font-size:20px">
          <span style="font-family:var(--font-display);font-weight:900">Total</span>
          <span style="font-family:var(--font-display);font-weight:900;color:var(--yellow);font-size:28px">${price} MZN</span>
        </div>
      </div>

      <!-- Payment -->
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--gray-light);margin-bottom:10px">
          Forma de pagamento
        </label>
        <div class="payment-options">
          <div class="payment-opt ${d.payment==='mpesa'?'active':''}" data-pay="mpesa">
            <span class="pay-icon">📱</span><span class="pay-label">M-Pesa</span>
          </div>
          <div class="payment-opt ${d.payment==='emola'?'active':''}" data-pay="emola">
            <span class="pay-icon">💳</span><span class="pay-label">e-Mola</span>
          </div>
          <div class="payment-opt ${d.payment==='dinheiro'?'active':''}" data-pay="dinheiro">
            <span class="pay-icon">💵</span><span class="pay-label">Dinheiro</span>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-direction:column">
        <button class="btn btn-primary btn-block btn-lg" id="btn-confirm">
          🏍️ Confirmar Pedido
        </button>
        <button class="btn btn-green btn-block" id="btn-wpp">
          💬 Confirmar via WhatsApp
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-back3">← Voltar</button>
      </div>
    </div>`;
  },

  // ── Bind step events ──────────────────────────────────
  bindStep(step) {
    if (step === 1) {
      document.getElementById('btn-next1').onclick = () => {
        const name = document.getElementById('inp-name').value.trim();
        const phone = document.getElementById('inp-phone').value.trim();
        const type = document.getElementById('inp-type').value;
        if (!name || !phone || !type) {
          MotoJet.notify('Campos obrigatórios', 'Por favor preencha todos os campos', 'warning');
          return;
        }
        Object.assign(this.state.orderData, { name, phone, type });
        this.renderStep(2);
        setTimeout(() => this.initMiniMap(), 100);
      };
    }

    if (step === 2) {
      document.getElementById('btn-back2').onclick = () => this.renderStep(1);
      this.bindAutocomplete('inp-pickup', 'pickup-suggest', 'pickup');
      this.bindAutocomplete('inp-dropoff', 'dropoff-suggest', 'dropoff');

      document.getElementById('btn-next2').onclick = async () => {
        const pickup = document.getElementById('inp-pickup').value.trim();
        const dropoff = document.getElementById('inp-dropoff').value.trim();
        const notes = document.getElementById('inp-notes').value.trim();
        if (!pickup || !dropoff) {
          MotoJet.notify('Campos obrigatórios', 'Preencha os endereços de recolha e entrega', 'warning');
          return;
        }

        const from = MotoJet.getLocation(pickup);
        const to = MotoJet.getLocation(dropoff);
        const distance = Math.max(1.5, MotoJet.calcDistance(from.lat, from.lng, to.lat, to.lng));
        const price = MotoJet.pricing.calculate(distance);

        Object.assign(this.state.orderData, { pickup, dropoff, notes, distance: +distance.toFixed(1), price, payment: 'mpesa' });
        this.state.from = from;
        this.state.to = to;
        this.renderStep(3);
      };
    }

    if (step === 3) {
      document.getElementById('btn-back3').onclick = () => this.renderStep(2);

      // Payment selection
      document.querySelectorAll('.payment-opt').forEach(opt => {
        opt.onclick = () => {
          document.querySelectorAll('.payment-opt').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          this.state.orderData.payment = opt.dataset.pay;
        };
      });

      document.getElementById('btn-confirm').onclick = () => this.placeOrder();
      document.getElementById('btn-wpp').onclick = () => {
        const order = MotoJet.orders.create(this.state.orderData);
        this.state.currentOrder = order;
        MotoJet.openWhatsApp(order);
        this.showConfirmation(order);
      };
    }
  },

  // ── Autocomplete ──────────────────────────────────────
  bindAutocomplete(inputId, suggestId, field) {
    const input = document.getElementById(inputId);
    const suggest = document.getElementById(suggestId);
    if (!input || !suggest) return;

    // Style suggest list
    suggest.style.cssText = `
      position:absolute;z-index:50;width:100%;
      background:var(--dark2);border:1px solid var(--card-border);
      border-radius:8px;margin-top:4px;overflow:hidden;`;
    suggest.parentElement.style.position = 'relative';

    input.oninput = () => {
      const val = input.value.toLowerCase();
      if (val.length < 2) { suggest.innerHTML = ''; return; }
      const matches = MotoJet.maputoLocations.filter(l => l.name.toLowerCase().includes(val)).slice(0, 4);
      suggest.innerHTML = matches.map(l => `
        <div class="suggest-item" data-name="${l.name}"
          style="padding:10px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid var(--card-border);
          transition:background 0.2s" 
          onmouseover="this.style.background='rgba(255,255,255,0.06)'"
          onmouseout="this.style.background='transparent'"
          onclick="App.selectSuggest('${inputId}','${suggestId}','${l.name}','${field}')">
          📍 ${l.name}
        </div>`).join('');
    };
    input.onblur = () => setTimeout(() => { suggest.innerHTML = ''; }, 200);
  },

  selectSuggest(inputId, suggestId, name, field) {
    document.getElementById(inputId).value = name;
    document.getElementById(suggestId).innerHTML = '';
    this.state.orderData[field] = name;
    this.updateMiniMap();
  },

  // ── Mini map (step 2) ─────────────────────────────────
  initMiniMap() {
    if (this.state.miniMap) { this.state.miniMap.remove(); this.state.miniMap = null; }
    this.state.miniMap = MotoMap.create('mini-map', { zoom: 12 });
  },

  updateMiniMap() {
    const pickup = document.getElementById('inp-pickup')?.value;
    const dropoff = document.getElementById('inp-dropoff')?.value;
    if (!pickup || !dropoff || !this.state.miniMap) return;
    const from = MotoJet.getLocation(pickup);
    const to = MotoJet.getLocation(dropoff);
    MotoMap.drawRoute('mini-map', from, to);
  },

  // ── Place order ───────────────────────────────────────
  placeOrder() {
    const btn = document.getElementById('btn-confirm');
    btn.disabled = true;
    btn.innerHTML = '⏳ Processando...';

    setTimeout(() => {
      const order = MotoJet.orders.create(this.state.orderData);
      this.state.currentOrder = order;
      MotoJet.notify('Pedido criado! 🎉', `Código: ${order.id}`, 'success');
      this.showConfirmation(order);
    }, 1200);
  },

  // ── Confirmation screen ───────────────────────────────
  showConfirmation(order) {
    const container = document.getElementById('step-container');
    const time = MotoJet.pricing.estimateTime(order.distance || 0);
    container.innerHTML = `
    <div class="order-confirm">
      <span class="confirm-icon">🎉</span>
      <div class="confirm-code">Código do pedido</div>
      <div class="confirm-num">${order.id}</div>

      <div class="confirm-detail">
        <div class="confirm-row"><span class="confirm-key">👤 Cliente</span><span class="confirm-val">${order.name}</span></div>
        <div class="confirm-row"><span class="confirm-key">📍 De</span><span class="confirm-val">${order.pickup}</span></div>
        <div class="confirm-row"><span class="confirm-key">🎯 Para</span><span class="confirm-val">${order.dropoff}</span></div>
        <div class="confirm-row"><span class="confirm-key">💰 Preço</span><span class="confirm-val" style="color:var(--yellow)">${order.price} MZN</span></div>
        <div class="confirm-row"><span class="confirm-key">⏱️ Estimativa</span><span class="confirm-val">~${time} min</span></div>
        <div class="confirm-row"><span class="confirm-key">💳 Pagamento</span><span class="confirm-val">${order.payment.toUpperCase()}</span></div>
      </div>

      <button class="btn btn-primary btn-block btn-lg" onclick="App.showTracking()" style="margin-bottom:12px">
        🗺️ Rastrear Pedido
      </button>
      <a href="https://wa.me/${MotoJet.whatsappNumber}?text=${MotoJet.buildWhatsAppMessage(order)}"
        target="_blank" class="btn btn-green btn-block" style="margin-bottom:12px">
        💬 Falar no WhatsApp
      </a>
      <button class="btn btn-secondary btn-block btn-sm" onclick="App.newOrder()">
        + Novo pedido
      </button>
    </div>`;

    document.getElementById('progress-fill').style.width = '100%';
    document.getElementById('step-label').textContent = 'Pedido confirmado!';

    // Simulate status progression
    this.simulateStatusProgression(order.id);
  },

  // ── Tracking screen ───────────────────────────────────
  showTracking() {
    const order = this.state.currentOrder;
    if (!order) return;
    const container = document.getElementById('step-container');
    const time = MotoJet.pricing.estimateTime(order.distance || 0);

    const statuses = [
      { key: 'recebido', icon: '📋', label: 'Pedido recebido', desc: 'Aguardando confirmação' },
      { key: 'atribuido', icon: '🏍️', label: 'Motoboy atribuído', desc: 'António Bila está a caminho' },
      { key: 'coleta', icon: '📦', label: 'Em coleta', desc: 'Recolhendo a encomenda' },
      { key: 'rota', icon: '🚀', label: 'Em rota', desc: 'A caminho do destino' },
      { key: 'entregue', icon: '✅', label: 'Entregue', desc: 'Entrega concluída!' },
    ];

    const currentIdx = statuses.findIndex(s => s.key === order.status);

    container.innerHTML = `
    <div>
      <h2 style="font-family:var(--font-display);font-size:28px;font-weight:900;margin-bottom:4px">
        Rastreamento 🗺️
      </h2>
      <p style="color:var(--gray);font-size:13px;margin-bottom:20px">Pedido ${order.id}</p>

      <!-- ETA badge -->
      <div style="background:rgba(211,47,47,0.1);border:1px solid rgba(211,47,47,0.2);border-radius:12px;
        padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:12px;color:var(--gray);text-transform:uppercase;letter-spacing:1px">Tempo estimado</div>
          <div style="font-family:var(--font-display);font-size:32px;font-weight:900;color:var(--yellow)">
            ~${time} <span style="font-size:16px">min</span>
          </div>
        </div>
        <div style="font-size:40px">⏱️</div>
      </div>

      <!-- Map -->
      <div style="border-radius:12px;overflow:hidden;margin-bottom:20px;border:1px solid var(--card-border)">
        <div id="track-map" style="height:220px"></div>
      </div>

      <!-- Status timeline -->
      <div class="status-tracker show">
        <div class="tracker-title">Status do pedido</div>
        <div class="tracker-steps" id="tracker-steps">
          ${statuses.map((s, i) => `
          <div class="tracker-step ${i < currentIdx ? 'done' : i === currentIdx ? 'active' : ''}" id="ts-${s.key}">
            <div class="tracker-dot">${i < currentIdx ? '✓' : s.icon}</div>
            <div class="tracker-info">
              <div class="tracker-step-name">${s.label}</div>
              <div class="tracker-step-time">${i <= currentIdx ? s.desc : 'Aguardando...'}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>

      <button class="btn btn-secondary btn-block btn-sm" style="margin-top:16px" onclick="App.newOrder()">
        + Novo pedido
      </button>
    </div>`;

    // Init tracking map
    setTimeout(() => {
      const map = MotoMap.create('track-map', { zoom: 13 });
      const from = MotoJet.getLocation(order.pickup);
      const to = MotoJet.getLocation(order.dropoff);
      MotoMap.drawRoute('track-map', from, to).then(points => {
        if (points && order.status === 'rota') {
          MotoMap.simulateRider('track-map', points, (pct) => {
            if (pct >= 1) MotoJet.notify('Entregue! 🎉', 'A encomenda foi entregue com sucesso', 'success');
          });
        }
      });
    }, 100);
  },

  // ── Simulate status changes ───────────────────────────
  simulateStatusProgression(orderId) {
    const progression = ['atribuido', 'coleta', 'rota', 'entregue'];
    const msgs = [
      ['Motoboy atribuído! 🏍️', 'António Bila está a caminho'],
      ['Recolhendo encomenda 📦', 'O motoboy está no local de recolha'],
      ['Em rota! 🚀', 'A encomenda está a caminho do destino'],
      ['Entregue! ✅', 'A encomenda foi entregue com sucesso'],
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= progression.length) { clearInterval(interval); return; }
      MotoJet.orders.updateStatus(orderId, progression[i]);
      MotoJet.notify(msgs[i][0], msgs[i][1], i === progression.length - 1 ? 'success' : 'info');
      i++;
    }, 8000 + i * 3000);
  },

  newOrder() {
    this.state = {
      step: 1, totalSteps: 3, orderData: {},
      currentOrder: null, routePoints: null,
      mapInstance: null, from: null, to: null
    };
    this.renderStep(1);
  }
};

// CSS animation
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes fadeSlide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .suggest-list .suggest-item:last-child { border-bottom: none !important; }
`;
document.head.appendChild(styleEl);

document.addEventListener('DOMContentLoaded', () => App.init());
