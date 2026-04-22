# 🏍️ MotoJet MZ — MVP de Delivery em Maputo

Plataforma completa de delivery por mota para Maputo, Moçambique.
Design dark, cores nacionais (vermelho, verde, amarelo), mobile-first.

---

## 📁 Estrutura do projeto

```
motojet/
├── index.html        # Landing page (funil de vendas)
├── app.html          # Interface do cliente (3 passos)
├── rider.html        # Painel do motoboy
├── admin.html        # Painel de gestão
├── vercel.json       # Config deploy Vercel
├── css/
│   └── style.css     # Estilos completos (tema MZ)
└── js/
    ├── main.js       # Core: storage, pricing, WhatsApp, notificações
    ├── map.js        # Leaflet/OpenStreetMap utilities
    └── app.js        # Lógica do fluxo de pedidos
```

---

## 🚀 Rodar localmente

### Opção 1 — VS Code Live Server (recomendado)
1. Instale a extensão **Live Server** no VS Code
2. Abra a pasta `motojet/`
3. Clique em **Go Live** (canto inferior direito)
4. Aceda a `http://localhost:5500`

### Opção 2 — Python (sem instalação)
```bash
cd motojet
python3 -m http.server 8000
# Aceda: http://localhost:8000
```

### Opção 3 — Node.js
```bash
cd motojet
npx serve .
# Aceda: http://localhost:3000
```

---

## ☁️ Deploy no Vercel

### Método 1 — Vercel CLI
```bash
npm install -g vercel
cd motojet
vercel
# Siga as instruções interativas
```

### Método 2 — GitHub + Vercel (recomendado)
1. Crie um repositório no GitHub
2. Faça upload da pasta `motojet/`
3. Aceda a [vercel.com](https://vercel.com)
4. Clique **New Project** → importe o repositório
5. Clique **Deploy** — pronto! 🎉

---

## ⚙️ Configuração

### Número de WhatsApp
Em `js/main.js`, linha 4:
```javascript
whatsappNumber: '258878023732', // Substitua pelo seu número real
```

### Preços
Em `js/main.js`:
```javascript
pricing: {
  base: 100,      // Taxa base em MZN
  perKm: 25,      // MZN por km
}
```

### Zonas de Maputo
Em `js/main.js`, array `maputoLocations` — adicione mais bairros conforme necessário.

---

## 🗺️ Páginas

| URL | Descrição |
|-----|-----------|
| `/` ou `/index.html` | Landing page — funil de vendas |
| `/app.html` | Fluxo de pedido (3 passos) |
| `/rider.html` | Painel do motoboy |
| `/admin.html` | Painel de gestão |

---

## 💾 Armazenamento (MVP)

Usa `localStorage` como backend simulado. Estrutura:
```json
{
  "orders": [...],
  "riders": [...]
}
```

### Preparação para backend real (Node.js + Express)
Substituir chamadas em `js/main.js` → `storage.*` por:
```javascript
// GET
const res = await fetch('/api/orders');
const orders = await res.json();

// POST
await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: {'Content-Type':'application/json'}
});
```

---

## 💳 Pagamentos suportados (simulados)

| Método | Estado |
|--------|--------|
| M-Pesa | Simulado (pronto para integração API) |
| e-Mola | Simulado (pronto para integração API) |
| Dinheiro | Nativo |

Para integração real de M-Pesa, consultar: https://developer.vodacom.mz/

---

## 📱 Features implementadas

- ✅ Landing page com funil de vendas
- ✅ Sistema de pedidos em 3 passos
- ✅ Cálculo de preço em tempo real (100 MZN base + 25 MZN/km)
- ✅ Mapa interativo (Leaflet + OpenStreetMap)
- ✅ Rota animada com simulação de motoboy
- ✅ Rastreamento de status em tempo real
- ✅ Integração WhatsApp (mensagem automática)
- ✅ Notificações push (simuladas)
- ✅ Painel do motoboy
- ✅ Painel admin com estatísticas
- ✅ Armazenamento local (mock backend)
- ✅ Mobile-first design
- ✅ Identidade visual moçambicana

---

## 🔮 Próximos passos (escalabilidade)

1. **Backend real**: Node.js + Express + MongoDB
2. **Auth**: JWT para clientes, motoboys e admin
3. **Pagamentos**: Integração M-Pesa API + e-Mola API
4. **Geolocalização**: GPS real via `navigator.geolocation`
5. **Matching**: Algoritmo de atribuição automática de motoboy
6. **Notificações**: Push notifications via Firebase
7. **App mobile**: React Native ou PWA
8. **Multi-cidade**: Beira, Nampula, etc.

---

## 🇲🇿 Feito com orgulho em Moçambique

**MotoJet** — Entrega rápida e confiável em Maputo.
