import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_IMG_DIR = path.join(ROOT, 'docs', 'diagramas', 'imagenes');
const OUT_SRC_DIR = path.join(ROOT, 'docs', 'diagramas', 'fuentes');

const FONT_SANS = 'Segoe UI, Arial, Helvetica, sans-serif';
const FONT_MONO = 'Consolas, Courier New, monospace';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapDiagram({ w, h, kind, title, subtitle, body }) {
  const badgeW = Math.max(220, kind.length * 9 + title.length * 8.5 + 36);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect x="0" y="0" width="${w}" height="${h}" fill="#FFFFFF"/>
  <rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="#FFFFFF" stroke="#475569" stroke-width="1.5"/>
  <!-- StarUML Diagram Frame Pentagon Header -->
  <polygon points="12,12 ${badgeW},12 ${badgeW},36 ${badgeW - 14},50 12,50" fill="#F8FAFC" stroke="#475569" stroke-width="1.4"/>
  <text x="24" y="35" font-family="${FONT_SANS}" font-size="14" font-weight="700" fill="#0F172A">
    <tspan font-weight="800" fill="#0369A1">${esc(kind)}</tspan>
    <tspan dx="6">${esc(title)}</tspan>
  </text>
  <text x="${w - 26}" y="35" text-anchor="end" font-family="${FONT_MONO}" font-size="11.5" fill="#475569">${esc(subtitle)}</text>
  <defs>
    <marker id="arrowOpen" viewBox="0 0 12 10" refX="11" refY="5" markerWidth="10" markerHeight="8" orient="auto-start-reverse">
      <path d="M 1 1 L 11 5 L 1 9" fill="none" stroke="#1E293B" stroke-width="1.5"/>
    </marker>
    <marker id="arrowFilled" viewBox="0 0 12 10" refX="11" refY="5" markerWidth="9" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1 L 11 5 L 0 9 z" fill="#1E293B"/>
    </marker>
    <marker id="arrowBlue" viewBox="0 0 12 10" refX="11" refY="5" markerWidth="9" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1 L 11 5 L 0 9 z" fill="#0369A1"/>
    </marker>
    <marker id="arrowPurple" viewBox="0 0 12 10" refX="11" refY="5" markerWidth="9" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1 L 11 5 L 0 9 z" fill="#9333EA"/>
    </marker>
  </defs>
  ${body}
</svg>`;
}

function drawStickActor(cx, cy, name, stereotype = '') {
  const top = cy - 28;
  return `
  <g>
    <circle cx="${cx}" cy="${top + 8}" r="8" fill="#EFF6FF" stroke="#1E293B" stroke-width="1.6"/>
    <line x1="${cx}" y1="${top + 16}" x2="${cx}" y2="${top + 38}" stroke="#1E293B" stroke-width="1.6"/>
    <line x1="${cx - 14}" y1="${top + 24}" x2="${cx + 14}" y2="${top + 24}" stroke="#1E293B" stroke-width="1.6"/>
    <line x1="${cx}" y1="${top + 38}" x2="${cx - 11}" y2="${top + 54}" stroke="#1E293B" stroke-width="1.6"/>
    <line x1="${cx}" y1="${top + 38}" x2="${cx + 11}" y2="${top + 54}" stroke="#1E293B" stroke-width="1.6"/>
    ${stereotype ? `<text x="${cx}" y="${top - 5}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10.5" fill="#475569">${esc(stereotype)}</text>` : ''}
    <text x="${cx}" y="${top + 70}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12.5" font-weight="700" fill="#0F172A">${esc(name)}</text>
  </g>`;
}

function drawPillLabel(x, y, text, color = '#475569') {
  const pw = text.length * 6.4 + 14;
  return `
  <g>
    <rect x="${x - pw / 2}" y="${y - 9}" width="${pw}" height="18" rx="3" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="0.8"/>
    <text x="${x}" y="${y + 4}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10.5" font-weight="600" fill="${color}">${esc(text)}</text>
  </g>`;
}

// ============================================================================
// 1. DIAGRAMA DE CASOS DE USO (UML 2.5)
// ============================================================================
function buildUseCaseSvg() {
  const w = 1640;
  const h = 1040;
  const actorsLeft = [
    { id: 'C', name: 'Cliente', x: 105, y: 205 },
    { id: 'CAJ', name: 'Cajero', x: 105, y: 400 },
    { id: 'EMP', name: 'Empaquetador', x: 105, y: 570 },
    { id: 'REP', name: 'Repartidor', x: 105, y: 735 },
    { id: 'ADM', name: 'Administrador', x: 105, y: 905 },
  ];

  const actorsRight = [
    { id: 'PSP', name: 'PayPal / Stripe', stereo: '«system»', x: 1510, y: 290 },
    { id: 'GEO', name: 'OSM / OSRM', stereo: '«system»', x: 1510, y: 545 },
    { id: 'SMTP', name: 'Gmail SMTP', stereo: '«system»', x: 1510, y: 800 },
  ];

  const useCases = [
    { id: 'UC01', x: 525, y: 155, rx: 160, ry: 31, lines: ['UC-01 Explorar Inicio,', 'Carta (/carta) y Mapa'] },
    { id: 'UC02', x: 525, y: 245, rx: 160, ry: 31, lines: ['UC-02 Autenticarse', '(JWT + Refresh Token)'] },
    { id: 'UC03', x: 525, y: 335, rx: 160, ry: 31, lines: ['UC-03 Armar Carrito y', 'Marcar Ubicación GPS'] },
    { id: 'UC04', x: 525, y: 425, rx: 160, ry: 31, lines: ['UC-04 Pagar Pedido', '(QR, Tarjeta, Depósito, PayPal)'] },
    { id: 'UC05', x: 525, y: 515, rx: 160, ry: 31, lines: ['UC-05 Reservar Mesa /', 'Salsa & Pase QR'] },
    { id: 'UC06', x: 525, y: 605, rx: 160, ry: 31, lines: ['UC-06 Seguir Pedido en', 'Vivo (SSE + Chat Rider)'] },
    { id: 'UC07', x: 525, y: 695, rx: 160, ry: 31, lines: ['UC-07 Publicar Reseña', 'Autenticada'] },

    { id: 'INC', x: 1060, y: 215, rx: 165, ry: 31, fill: '#EFF6FF', lines: ['Reservar Stock ACID', 'en PostgreSQL'] },
    { id: 'EXT', x: 1060, y: 315, rx: 165, ry: 31, fill: '#EFF6FF', lines: ['Emitir Alerta Email', 'HTML y Evento SSE'] },
    { id: 'UC08', x: 1060, y: 425, rx: 165, ry: 31, lines: ['UC-08 Aprobar / Rechazar', 'Depósitos en Caja'] },
    { id: 'UC09', x: 1060, y: 530, rx: 165, ry: 31, lines: ['UC-09 Checklist 100%,', 'Sello y Generar PIN'] },
    { id: 'UC10', x: 1060, y: 635, rx: 165, ry: 31, lines: ['UC-10 Retirar, Reportar', 'GPS y Validar PIN'] },
    { id: 'UC11', x: 1060, y: 745, rx: 165, ry: 31, lines: ['UC-11 CRUD Carta, Kardex,', 'Eventos, Bento y KPIs'] },
    { id: 'UC12', x: 1060, y: 855, rx: 165, ry: 31, lines: ['UC-12 Gestionar Roles,', 'Auditoría y Campañas'] },
  ];

  const ucMap = Object.fromEntries(useCases.map((u) => [u.id, u]));
  const actMap = Object.fromEntries([...actorsLeft, ...actorsRight].map((a) => [a.id, a]));

  const assocLeft = [
    ['C', 'UC01'], ['C', 'UC02'], ['C', 'UC03'], ['C', 'UC04'], ['C', 'UC05'], ['C', 'UC06'], ['C', 'UC07'],
    ['CAJ', 'UC02'], ['CAJ', 'UC08'],
    ['EMP', 'UC02'], ['EMP', 'UC09'],
    ['REP', 'UC02'], ['REP', 'UC10'],
    ['ADM', 'UC02'], ['ADM', 'UC11'], ['ADM', 'UC12'],
  ];

  const assocRight = [
    ['UC04', 'PSP'],
    ['UC01', 'GEO'],
    ['UC03', 'GEO'],
    ['UC10', 'GEO'],
    ['EXT', 'SMTP'],
    ['UC12', 'SMTP'],
  ];

  const dashedDeps = [
    { d: `M 685 425 L 780 425 L 780 215 L 895 215`, lx: 785, ly: 295, label: '«include»' },
    { d: `M 685 435 L 795 435 L 795 315 L 895 315`, lx: 800, ly: 372, label: '«include»' },
    { d: `M 685 515 L 820 515 L 820 330 L 895 330`, lx: 820, ly: 448, label: '«include»' },
    { d: `M 1060 394 L 1060 346`, lx: 990, ly: 369, label: '«extend»' },
    { d: `M 1225 530 L 1275 530 L 1275 330 L 1225 330`, lx: 1275, ly: 430, label: '«extend»' },
    { d: `M 1225 635 L 1305 635 L 1305 315 L 1225 315`, lx: 1305, ly: 495, label: '«extend»' },
  ];

  let body = `
  <!-- System Boundary -->
  <rect x="275" y="82" width="1085" height="900" rx="6" fill="#FAFAFA" stroke="#334155" stroke-width="1.6"/>
  <rect x="275" y="82" width="1085" height="34" rx="4" fill="#E2E8F0" stroke="#334155" stroke-width="1.4"/>
  <text x="817" y="104" text-anchor="middle" font-family="${FONT_SANS}" font-size="14" font-weight="800" fill="#0F172A">Sistema Web Joy Ride Café® Sucre (E-Commerce, Reservas y Logística 5 Roles)</text>
  `;

  for (const [aid, uid] of assocLeft) {
    const a = actMap[aid];
    const u = ucMap[uid];
    const startX = a.x + 28;
    const endX = u.x - u.rx;
    body += `<line x1="${startX}" y1="${a.y}" x2="${endX}" y2="${u.y}" stroke="#475569" stroke-width="1.35"/>`;
  }

  for (const [uid, aid] of assocRight) {
    const u = ucMap[uid];
    const a = actMap[aid];
    body += `<line x1="${u.x + u.rx}" y1="${u.y}" x2="${a.x - 32}" y2="${a.y}" stroke="#64748B" stroke-width="1.3"/>`;
  }

  for (const d of dashedDeps) {
    body += `<path d="${d.d}" fill="none" stroke="#0369A1" stroke-width="1.35" stroke-dasharray="6,4" marker-end="url(#arrowOpen)"/>`;
  }

  for (const u of useCases) {
    body += `
    <ellipse cx="${u.x}" cy="${u.y}" rx="${u.rx}" ry="${u.ry}" fill="${u.fill || '#FFFBEB'}" stroke="#1E293B" stroke-width="1.5"/>
    <text x="${u.x}" y="${u.y - 3}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12" font-weight="700" fill="#0F172A">${esc(u.lines[0])}</text>
    <text x="${u.x}" y="${u.y + 13}" text-anchor="middle" font-family="${FONT_SANS}" font-size="11.5" fill="#334155">${esc(u.lines[1])}</text>`;
  }

  for (const d of dashedDeps) {
    body += drawPillLabel(d.lx, d.ly, d.label, '#0369A1');
  }

  for (const a of actorsLeft) body += drawStickActor(a.x, a.y, a.name);
  for (const a of actorsRight) body += drawStickActor(a.x, a.y, a.name, a.stereo);

  return wrapDiagram({
    w,
    h,
    kind: 'uc',
    title: 'Diagrama de Casos de Uso — Joy Ride Café® Sucre',
    subtitle: 'UML 2.5 · 5 Actores Internos + 3 Sistemas Externos',
    body,
  });
}

// ============================================================================
// 2. DIAGRAMA DE CLASES DE DOMINIO (UML 2.5)
// ============================================================================
function drawClassBox(x, y, w, name, stereo, attrs, ops, bg = '#FFFBEB') {
  const headerH = stereo ? 42 : 28;
  const attrH = Math.max(24, attrs.length * 16 + 12);
  const opH = ops.length > 0 ? ops.length * 16 + 12 : 22;
  const totalH = headerH + attrH + opH;

  let svg = `
  <rect x="${x}" y="${y}" width="${w}" height="${totalH}" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5"/>
  <rect x="${x}" y="${y}" width="${w}" height="${headerH}" fill="${bg}" stroke="#1E293B" stroke-width="1.5"/>`;

  if (stereo) {
    svg += `<text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10.5" fill="#475569">${esc(stereo)}</text>`;
    svg += `<text x="${x + w / 2}" y="${y + 32}" text-anchor="middle" font-family="${FONT_SANS}" font-size="13" font-weight="800" fill="#0F172A">${esc(name)}</text>`;
  } else {
    svg += `<text x="${x + w / 2}" y="${y + 19}" text-anchor="middle" font-family="${FONT_SANS}" font-size="13" font-weight="800" fill="#0F172A">${esc(name)}</text>`;
  }

  let curY = y + headerH + 15;
  for (const a of attrs) {
    svg += `<text x="${x + 10}" y="${curY}" font-family="${FONT_MONO}" font-size="11" fill="#1E293B">${esc(a)}</text>`;
    curY += 16;
  }

  const sepY = y + headerH + attrH;
  svg += `<line x1="${x}" y1="${sepY}" x2="${x + w}" y2="${sepY}" stroke="#1E293B" stroke-width="1.2"/>`;

  let opY = sepY + 15;
  for (const o of ops) {
    svg += `<text x="${x + 10}" y="${opY}" font-family="${FONT_MONO}" font-size="11" font-weight="600" fill="#0369A1">${esc(o)}</text>`;
    opY += 16;
  }

  return { svg, cx: x + w / 2, cy: y + totalH / 2, right: x + w, bottom: y + totalH, x, y, w, h: totalH };
}

function drawDiamond(x, y, dir, filled = true) {
  let pts = '';
  if (dir === 'right') pts = `${x},${y} ${x + 8},${y - 5} ${x + 16},${y} ${x + 8},${y + 5}`;
  if (dir === 'left') pts = `${x},${y} ${x - 8},${y - 5} ${x - 16},${y} ${x - 8},${y + 5}`;
  if (dir === 'down') pts = `${x},${y} ${x - 5},${y + 8} ${x},${y + 16} ${x + 5},${y + 8}`;
  if (dir === 'up') pts = `${x},${y} ${x - 5},${y - 8} ${x},${y - 16} ${x + 5},${y - 8}`;
  return `<polygon points="${pts}" fill="${filled ? '#1E293B' : '#FFFFFF'}" stroke="#1E293B" stroke-width="1.3"/>`;
}

function buildClassDiagramSvg() {
  const w = 1760;
  const h = 1190;
  let body = '';

  const enums = [
    { x: 40, y: 74, w: 320, name: 'Role', vals: ['CLIENTE', 'CAJERO', 'EMPAQUETADOR', 'REPARTIDOR', 'ADMIN'] },
    { x: 385, y: 74, w: 470, name: 'OrderStatus', vals: ['PENDIENTE_PAGO | PAGO_EN_REVISION | RECHAZADO', 'PAGO_CONFIRMADO | EN_PREPARACION | EMPACADO', 'EN_CAMINO | ENTREGADO | CANCELADO'] },
    { x: 880, y: 74, w: 370, name: 'PaymentMethod & Status', vals: ['QR | DEPOSITO_BANCARIO | PAYPAL | STRIPE', 'PENDIENTE | EN_REVISION | COMPLETADO | RECHAZADO'] },
    { x: 1275, y: 74, w: 445, name: 'ReservationZone & StockMovementType', vals: ['PATIO_COLONIAL | MEZZANINE | PANTALLA | SALSA', 'ENTRADA | RESERVA | VENTA | LIBERACION | AJUSTE'] },
  ];

  for (const en of enums) {
    const eh = 38 + en.vals.length * 15 + 10;
    body += `<rect x="${en.x}" y="${en.y}" width="${en.w}" height="${eh}" fill="#EFF6FF" stroke="#1E293B" stroke-width="1.3"/>`;
    body += `<text x="${en.x + en.w / 2}" y="${en.y + 14}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10" fill="#0369A1">«enumeration»</text>`;
    body += `<text x="${en.x + en.w / 2}" y="${en.y + 29}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12" font-weight="800" fill="#0F172A">${esc(en.name)}</text>`;
    body += `<line x1="${en.x}" y1="${en.y + 35}" x2="${en.x + en.w}" y2="${en.y + 35}" stroke="#1E293B" stroke-width="1"/>`;
    let vy = en.y + 50;
    for (const v of en.vals) {
      body += `<text x="${en.x + 10}" y="${vy}" font-family="${FONT_MONO}" font-size="10.5" fill="#1E293B">${esc(v)}</text>`;
      vy += 15;
    }
  }

  const cUser = drawClassBox(40, 275, 320, 'User', '', [
    '- id: String',
    '- name: String',
    '- email: String {unique}',
    '- passwordHash: String',
    '- role: Role',
    '- active: Boolean',
  ], [
    '+ verifyPassword(pwd): Boolean',
    '+ issueJwtPair(): TokenPair',
  ]);

  const cOrder = drawClassBox(470, 255, 380, 'Order', '', [
    '- id: String',
    '- orderCode: String {unique}',
    '- status: OrderStatus',
    '- deliveryType: DeliveryType',
    '- subtotalBs: Decimal(10,2)',
    '- totalBs: Decimal(10,2)',
    '- totalUsd: Decimal(10,2)',
    '- destLat / destLng: Float',
  ], [
    '+ computeServerTotals(dbProducts): Totals',
    '+ transitionTo(next: OrderStatus): void',
  ]);

  const cCat = drawClassBox(965, 275, 275, 'Category', '', [
    '- id: String',
    '- slug: String {unique}',
    '- name: String',
    '- sortOrder: Int',
  ], [
    '+ listActiveProducts(): Product[]',
  ]);

  const cProd = drawClassBox(1335, 255, 385, 'Product', '', [
    '- id: String',
    '- slug: String {unique}',
    '- name: String',
    '- precioBs / precioUsd: Decimal(10,2)',
    '- stockDisponible: Int',
    '- stockReservado: Int',
    '- stockMinimoAlerta: Int',
    '- esVegano / enHappyHour: Boolean',
  ], [
    '+ reserveStockTx(qty): void',
    '+ confirmSaleTx(qty): void',
    '+ releaseStockTx(qty): void',
  ]);

  const cRes = drawClassBox(40, 610, 320, 'Reservation', '', [
    '- id: String',
    '- code: String {unique}',
    '- zone: ReservationZone',
    '- date / timeSlot: String',
    '- partySize: Int',
    '- qrPassToken: String {unique}',
  ], [
    '+ checkZoneCapacity(): Int',
  ]);

  const cItem = drawClassBox(470, 610, 320, 'OrderItem', '', [
    '- id: String',
    '- productName: String',
    '- unitPriceBs: Decimal(10,2)',
    '- quantity: Int',
    '- subtotalBs: Decimal(10,2)',
  ], [
    '+ subtotalFromUnitPrice(): Decimal',
  ]);

  const cPay = drawClassBox(865, 610, 375, 'Payment', '', [
    '- id: String',
    '- method: PaymentMethod',
    '- status: PaymentStatus',
    '- amountBs / amountUsd: Decimal',
    '- qrToken / qrSignature: String',
    '- paypalOrderId: String',
    '- stripePaymentIntentId: String',
  ], [
    '+ signQrHmac(): String',
    '+ confirmGateway(txId): void',
    '+ reviewDeposit(decision): void',
  ]);

  const cStock = drawClassBox(1335, 610, 385, 'StockMovement', '', [
    '- id: String',
    '- type: StockMovementType',
    '- quantity: Int',
    '- previousStock: Int',
    '- newStock: Int',
    '- reason: String',
  ], [
    '+ appendAuditEntry(): void',
  ]);

  const cChat = drawClassBox(40, 900, 320, 'ChatMessage', '', [
    '- id: String',
    '- channelType: ChatChannelType',
    '- senderName / senderRole: String',
    '- content: String',
    '- createdAt: DateTime',
  ], [
    '+ emitSseMessage(): void',
  ]);

  const cPack = drawClassBox(470, 900, 340, 'PackagingChecklist', '', [
    '- id: String',
    '- items: Jsonb',
    '- sealCode: String',
    '- allVerified: Boolean',
  ], [
    '+ verifyAllAndFinish(seal): String',
  ]);

  const cDeliv = drawClassBox(865, 900, 375, 'DeliveryTracking', '', [
    '- id: String',
    '- riderLat / riderLng: Float',
    '- etaMinutes: Int',
    '- deliveryPin: String',
    '- packageLabelCode: String',
  ], [
    '+ validatePinAndDeliver(pin): void',
  ]);

  const cHist = drawClassBox(1335, 900, 385, 'OrderStatusHistory', '', [
    '- id: String',
    '- actorName / actorRole: String',
    '- fromStatus: OrderStatus',
    '- toStatus: OrderStatus',
    '- reason: String',
  ], [
    '+ recordStateAudit(): void',
  ]);

  // Orthogonal connectors between classes
  const conns = [
    // User -> Order
    `M ${cUser.right} 360 L ${cOrder.x} 360`,
    // Category *-- Product
    `M ${cCat.right} 360 L ${cProd.x} 360`,
    // User -> Reservation
    `M 200 ${cUser.bottom} L 200 ${cRes.y}`,
    // User -> ChatMessage
    `M 200 ${cRes.bottom} L 200 ${cChat.y}`,
    // Order *-- OrderItem
    `M 630 ${cOrder.bottom} L 630 ${cItem.y}`,
    // Order *-- Payment
    `M ${cOrder.right} 435 L 820 435 L 820 665 L ${cPay.x} 665`,
    // Product -> StockMovement
    `M ${cProd.cx} ${cProd.bottom} L ${cProd.cx} ${cStock.y}`,
    // OrderItem -> Product (via lane)
    `M ${cItem.right} 665 L 835 665 L 835 555 L 1300 555 L 1300 425 L ${cProd.x} 425`,
    // Order *-- PackagingChecklist (via left gutter of Item)
    `M 470 495 L 420 495 L 420 970 L ${cPack.x} 970`,
    // Order *-- DeliveryTracking
    `M 850 495 L 1285 495 L 1285 970 L ${cDeliv.right} 970`,
    // Order *-- OrderStatusHistory
    `M 850 520 L 1265 520 L 1265 855 L 1525 855 L 1525 ${cHist.y}`,
    // Order o-- ChatMessage
    `M 470 520 L 395 520 L 395 970 L ${cChat.right} 970`,
  ];

  for (const d of conns) {
    body += `<path d="${d}" fill="none" stroke="#475569" stroke-width="1.35"/>`;
  }

  // Diamonds & Multiplicities
  body += drawDiamond(cCat.right, 360, 'right', true);
  body += drawDiamond(630, cOrder.bottom, 'down', true);
  body += drawDiamond(cOrder.right, 435, 'right', true);
  body += drawDiamond(cOrder.x, 495, 'left', true);

  const mults = [
    [370, 353, '1', 'start'], [462, 353, '0..*', 'end'],
    [1258, 353, '1', 'start'], [1327, 353, '1..*', 'end'],
    [210, 515, '1', 'start'], [210, 598, '0..*', 'start'],
    [640, 520, '1', 'start'], [640, 598, '1..*', 'start'],
    [858, 658, '0..1', 'end'],
    [462, 962, '0..1', 'end'],
    [1250, 962, '0..1', 'start'],
    [1538, 890, '1..*', 'start'],
    [1538, 598, '0..*', 'start'],
    [368, 962, '0..*', 'start'],
  ];
  for (const [mx, my, txt, anc] of mults) {
    body += `<text x="${mx}" y="${my}" text-anchor="${anc}" font-family="${FONT_MONO}" font-size="11" font-weight="700" fill="#0F172A">${esc(txt)}</text>`;
  }

  body += cUser.svg + cOrder.svg + cCat.svg + cProd.svg + cRes.svg + cItem.svg + cPay.svg + cStock.svg + cChat.svg + cPack.svg + cDeliv.svg + cHist.svg;

  return wrapDiagram({
    w,
    h,
    kind: 'class',
    title: 'Diagrama de Clases de Dominio — Joy Ride Café® Sucre',
    subtitle: 'UML 2.5 · Atributos Tipados, Operaciones y Multiplicidades',
    body,
  });
}

// ============================================================================
// 3. DIAGRAMA ERD FÍSICO CROW'S FOOT (TODAS LAS 16 TABLAS)
// ============================================================================
function drawEntity(x, y, w, title, cols) {
  const rowH = 17;
  const headerH = 26;
  const h = headerH + cols.length * rowH + 8;
  let svg = `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.45"/>
  <rect x="${x}" y="${y}" width="${w}" height="${headerH}" fill="#FEF3C7" stroke="#1E293B" stroke-width="1.45"/>
  <text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12.5" font-weight="800" fill="#0F172A">${esc(title)}</text>`;

  let cy = y + headerH + 15;
  for (const col of cols) {
    const isPk = col.startsWith('PK ');
    const isFk = col.startsWith('FK ');
    const color = isPk ? '#B45309' : isFk ? '#0369A1' : '#1E293B';
    const fw = isPk || isFk ? '700' : '400';
    svg += `<text x="${x + 8}" y="${cy}" font-family="${FONT_MONO}" font-size="10.5" font-weight="${fw}" fill="${color}">${esc(col)}</text>`;
    cy += rowH;
  }
  return { svg, x, y, w, h, right: x + w, bottom: y + h, cx: x + w / 2, cy: y + h / 2 };
}

function drawCrowsFootEnd(x, y, dir, kind) {
  // kind: 'one' (||), 'zero_many' (o|<), 'one_many' (|<), 'zero_one' (o|)
  let s = '';
  const sign = dir === 'left' ? -1 : dir === 'right' ? 1 : dir === 'up' ? -1 : 1;
  const horiz = dir === 'left' || dir === 'right';
  if (horiz) {
    if (kind === 'one') {
      s += `<line x1="${x + sign * 6}" y1="${y - 6}" x2="${x + sign * 6}" y2="${y + 6}" stroke="#1E293B" stroke-width="1.5"/>`;
      s += `<line x1="${x + sign * 11}" y1="${y - 6}" x2="${x + sign * 11}" y2="${y + 6}" stroke="#1E293B" stroke-width="1.5"/>`;
    } else if (kind === 'zero_many') {
      s += `<line x1="${x}" y1="${y}" x2="${x + sign * 10}" y2="${y - 6}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x + sign * 10}" y2="${y + 6}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<circle cx="${x + sign * 14}" cy="${y}" r="3.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.3"/>`;
    } else if (kind === 'one_many') {
      s += `<line x1="${x}" y1="${y}" x2="${x + sign * 10}" y2="${y - 6}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x + sign * 10}" y2="${y + 6}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<line x1="${x + sign * 12}" y1="${y - 6}" x2="${x + sign * 12}" y2="${y + 6}" stroke="#1E293B" stroke-width="1.5"/>`;
    } else if (kind === 'zero_one') {
      s += `<line x1="${x + sign * 7}" y1="${y - 6}" x2="${x + sign * 7}" y2="${y + 6}" stroke="#1E293B" stroke-width="1.5"/>`;
      s += `<circle cx="${x + sign * 13}" cy="${y}" r="3.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.3"/>`;
    }
  } else {
    if (kind === 'one') {
      s += `<line x1="${x - 6}" y1="${y + sign * 6}" x2="${x + 6}" y2="${y + sign * 6}" stroke="#1E293B" stroke-width="1.5"/>`;
      s += `<line x1="${x - 6}" y1="${y + sign * 11}" x2="${x + 6}" y2="${y + sign * 11}" stroke="#1E293B" stroke-width="1.5"/>`;
    } else if (kind === 'zero_many') {
      s += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + sign * 10}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x + 6}" y2="${y + sign * 10}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<circle cx="${x}" cy="${y + sign * 14}" r="3.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.3"/>`;
    } else if (kind === 'one_many') {
      s += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + sign * 10}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x + 6}" y2="${y + sign * 10}" stroke="#1E293B" stroke-width="1.4"/>`;
      s += `<line x1="${x - 6}" y1="${y + sign * 12}" x2="${x + 6}" y2="${y + sign * 12}" stroke="#1E293B" stroke-width="1.5"/>`;
    } else if (kind === 'zero_one') {
      s += `<line x1="${x - 6}" y1="${y + sign * 7}" x2="${x + 6}" y2="${y + sign * 7}" stroke="#1E293B" stroke-width="1.5"/>`;
      s += `<circle cx="${x}" cy="${y + sign * 13}" r="3.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.3"/>`;
    }
  }
  return s;
}

function buildErdSvg() {
  const w = 1860;
  const h = 1280;
  let body = '';

  const tUser = drawEntity(45, 78, 310, 'User', [
    'PK id : text',
    'UK email : text',
    '   name : text',
    '   passwordHash : text',
    '   role : Role',
    '   phone : text?',
    '   active : boolean',
  ]);

  const tRes = drawEntity(45, 360, 310, 'Reservation', [
    'PK id : text',
    'UK code : text',
    'FK userId : text?',
    '   guestName / guestEmail',
    '   zone : ReservationZone',
    '   date / timeSlot : text',
    '   partySize : int',
    'UK qrPassToken : text',
  ]);

  const tChat = drawEntity(45, 650, 310, 'ChatMessage', [
    'PK id : text',
    'FK orderId : text?',
    'FK senderId : text',
    '   channelType : ChatChannelType',
    '   senderName / Role : text',
    '   content : text',
  ]);

  const tOrder = drawEntity(455, 78, 340, 'Order', [
    'PK id : text',
    'UK orderCode : text',
    'FK userId : text',
    '   status : OrderStatus',
    '   deliveryType : DeliveryType',
    '   subtotalBs / totalBs : decimal',
    '   totalUsd : decimal(10,2)',
    '   destLat / destLng : float',
    '   splitCount : int',
  ]);

  const tOrderItem = drawEntity(455, 405, 340, 'OrderItem', [
    'PK id : text',
    'FK orderId : text',
    'FK productId : text',
    '   productName : text',
    '   unitPriceBs : decimal(10,2)',
    '   quantity : int',
    '   subtotalBs : decimal(10,2)',
  ]);

  const tHist = drawEntity(455, 680, 340, 'OrderStatusHistory', [
    'PK id : text',
    'FK orderId : text',
    'FK actorId : text?',
    '   actorName / actorRole : text',
    '   fromStatus : OrderStatus?',
    '   toStatus : OrderStatus',
    '   reason : text',
  ]);

  const tPay = drawEntity(900, 78, 370, 'Payment', [
    'PK id : text',
    'FK orderId : text [UK]',
    'FK verificadoPorId : text?',
    '   method : PaymentMethod',
    '   status : PaymentStatus',
    '   amountBs / amountUsd : decimal',
    'UK qrToken : text?',
    'UK paypalOrderId : text?',
    'UK stripePaymentIntentId : text?',
    '   cardBrand / cardLast4 : text?',
  ]);

  const tPack = drawEntity(900, 415, 370, 'PackagingChecklist', [
    'PK id : text',
    'FK orderId : text [UK]',
    'FK empaquetadorId : text?',
    '   items : jsonb',
    '   sealCode : text?',
    '   allVerified : boolean',
    '   completedAt : timestamp?',
  ]);

  const tDeliv = drawEntity(900, 680, 370, 'DeliveryTracking', [
    'PK id : text',
    'FK orderId : text [UK]',
    'FK repartidorId : text?',
    '   deliveryAddress : text',
    '   riderLat / riderLng : float',
    '   etaMinutes : int?',
    '   deliveryPin : text',
    '   packageLabelCode : text',
  ]);

  const tCat = drawEntity(1395, 78, 395, 'Category', [
    'PK id : text',
    'UK slug : text',
    '   name : text',
    '   description : text',
    '   sortOrder : int',
  ]);

  const tProd = drawEntity(1395, 295, 395, 'Product', [
    'PK id : text',
    'FK categoryId : text',
    'UK slug : text',
    '   name : text',
    '   precioBs / precioUsd : decimal',
    '   stockDisponible / Reservado : int',
    '   stockMinimoAlerta : int',
    '   esVegano / enHappyHour : boolean',
    '   active : boolean',
  ]);

  const tStock = drawEntity(1395, 620, 395, 'StockMovement', [
    'PK id : text',
    'FK productId : text',
    'FK orderId : text?',
    'FK actorId : text?',
    '   type : StockMovementType',
    '   quantity : int',
    '   previousStock / newStock : int',
    '   reason : text',
  ]);

  // Bottom Row: Standalone Content & Communication Models (Total 16 Tables)
  body += `<line x1="45" y1="955" x2="1790" y2="955" stroke="#94A3B8" stroke-width="1.2" stroke-dasharray="6,4"/>`;
  body += `<text x="920" y="978" text-anchor="middle" font-family="${FONT_MONO}" font-size="11.5" font-weight="700" fill="#475569">MÓDULOS DE CONTENIDO DINÁMICO Y CORREOS HTML (SIN LLAVES FORÁNEAS RESTRICTIVAS)</text>`;

  const tPromo = drawEntity(45, 995, 320, 'Promotion', [
    'PK id : text',
    'UK slug : text',
    '   title / badgeText : text',
    '   discountPercent : int',
    '   active : boolean',
  ]);
  const tEvent = drawEntity(395, 995, 330, 'Event', [
    'PK id : text',
    'UK slug : text',
    '   title / badge : text',
    '   imagesJson : jsonb',
    '   spotId : text',
    '   isActive : boolean',
  ]);
  const tRev = drawEntity(755, 995, 330, 'Review', [
    'PK id : text',
    '   userId : text?',
    '   authorName / verifiedVia',
    '   rating : int (1..5)',
    '   comment / photoUrl',
  ]);
  const tNews = drawEntity(1115, 995, 315, 'NewsletterSubscriber', [
    'PK id : text',
    'UK email : text',
    '   name : text?',
    '   active : boolean',
  ]);
  const tMail = drawEntity(1460, 995, 330, 'EmailLog', [
    'PK id : text',
    '   toEmail / recipientRole',
    '   templateType : text',
    '   status : text',
    '   relatedOrderId : text?',
  ]);

  // Orthogonal ERD Relationships + Crow's Foot glyphs
  const paths = [
    // User (1) -- o{ Order
    { d: `M ${tUser.right} 145 L ${tOrder.x} 145`, s: [tUser.right, 145, 'right', 'one'], e: [tOrder.x, 145, 'left', 'zero_many'] },
    // User (1) -- o{ Reservation
    { d: `M 200 ${tUser.bottom} L 200 ${tRes.y}`, s: [200, tUser.bottom, 'down', 'one'], e: [200, tRes.y, 'up', 'zero_many'] },
    // User (1) -- o{ ChatMessage
    { d: `M 85 ${tUser.bottom} L 85 335 L 28 335 L 28 730 L 45 730`, s: [85, tUser.bottom, 'down', 'one'], e: [45, 730, 'left', 'zero_many'] },
    // Order (1) -- |{ OrderItem
    { d: `M 625 ${tOrder.bottom} L 625 ${tOrderItem.y}`, s: [625, tOrder.bottom, 'down', 'one'], e: [625, tOrderItem.y, 'up', 'one_many'] },
    // Order (1) -- |{ OrderStatusHistory
    { d: `M 455 245 L 415 245 L 415 745 L ${tHist.x} 745`, s: [455, 245, 'left', 'one'], e: [tHist.x, 745, 'left', 'one_many'] },
    // Order (1) -- || Payment
    { d: `M ${tOrder.right} 145 L ${tPay.x} 145`, s: [tOrder.right, 145, 'right', 'one'], e: [tPay.x, 145, 'left', 'zero_one'] },
    // Order (1) -- o| PackagingChecklist
    { d: `M ${tOrder.right} 200 L 845 200 L 845 480 L ${tPack.x} 480`, s: [tOrder.right, 200, 'right', 'one'], e: [tPack.x, 480, 'left', 'zero_one'] },
    // Order (1) -- o| DeliveryTracking
    { d: `M ${tOrder.right} 230 L 825 230 L 825 745 L ${tDeliv.x} 745`, s: [tOrder.right, 230, 'right', 'one'], e: [tDeliv.x, 745, 'left', 'zero_one'] },
    // Category (1) -- |{ Product
    { d: `M 1590 ${tCat.bottom} L 1590 ${tProd.y}`, s: [1590, tCat.bottom, 'down', 'one'], e: [1590, tProd.y, 'up', 'one_many'] },
    // Product (1) -- o{ StockMovement
    { d: `M 1590 ${tProd.bottom} L 1590 ${tStock.y}`, s: [1590, tProd.bottom, 'down', 'one'], e: [1590, tStock.y, 'up', 'zero_many'] },
    // Product (1) -- o{ OrderItem
    { d: `M 1395 365 L 1325 365 L 1325 605 L 808 605 L 808 490 L ${tOrderItem.right} 490`, s: [1395, 365, 'left', 'one'], e: [tOrderItem.right, 490, 'right', 'zero_many'] },
    // Order (1) -- o{ ChatMessage
    { d: `M 455 280 L 385 280 L 385 730 L ${tChat.right} 730`, s: [455, 280, 'left', 'one'], e: [tChat.right, 730, 'right', 'zero_many'] },
    // Order (1) -- o{ StockMovement (via middle horizontal lane y=355)
    { d: `M 795 260 L 868 260 L 868 355 L 1350 355 L 1350 675 L ${tStock.x} 675`, s: [795, 260, 'right', 'one'], e: [tStock.x, 675, 'left', 'zero_many'] },
  ];

  for (const p of paths) {
    body += `<path d="${p.d}" fill="none" stroke="#475569" stroke-width="1.35"/>`;
    body += drawCrowsFootEnd(...p.s);
    body += drawCrowsFootEnd(...p.e);
  }

  body += tUser.svg + tRes.svg + tChat.svg + tOrder.svg + tOrderItem.svg + tHist.svg + tPay.svg + tPack.svg + tDeliv.svg + tCat.svg + tProd.svg + tStock.svg + tPromo.svg + tEvent.svg + tRev.svg + tNews.svg + tMail.svg;

  return wrapDiagram({
    w,
    h,
    kind: 'erd',
    title: 'Diagrama Entidad-Relación Físico (Crow’s Foot) — 17 Tablas PostgreSQL',
    subtitle: 'Prisma Schema · Claves PK / FK / UK e Integridad Referencial',
    body,
  });
}

// ============================================================================
// 4. DIAGRAMA DE SECUENCIA UML 2.5
// ============================================================================
function buildSequenceSvg() {
  const w = 1680;
  const h = 1140;
  let body = '';

  const parts = [
    { x: 100, label: 'Cliente', sub: '«actor»', fill: '#EFF6FF' },
    { x: 310, label: 'React SPA', sub: 'CartCheckoutDrawer', fill: '#FFFBEB' },
    { x: 540, label: 'API Express + Zod', sub: '/api/payments/*', fill: '#FFFBEB' },
    { x: 775, label: 'PostgreSQL 16', sub: 'Prisma ACID Tx', fill: '#FEF3C7' },
    { x: 995, label: 'PayPal / Stripe', sub: 'API Externa', fill: '#F1F5F9' },
    { x: 1190, label: 'Broker SSE', sub: '/api/events/stream', fill: '#FFFBEB' },
    { x: 1380, label: 'Staff Cocina/Caja', sub: 'Cajero · Empaque', fill: '#EFF6FF' },
    { x: 1565, label: 'Repartidor + SMTP', sub: 'Entrega PIN + Email', fill: '#EFF6FF' },
  ];

  const topY = 76;
  const botY = 1090;

  for (const p of parts) {
    body += `
    <rect x="${p.x - 74}" y="${topY}" width="148" height="46" rx="4" fill="${p.fill}" stroke="#1E293B" stroke-width="1.4"/>
    <text x="${p.x}" y="${topY + 19}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12" font-weight="800" fill="#0F172A">${esc(p.label)}</text>
    <text x="${p.x}" y="${topY + 35}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10" fill="#475569">${esc(p.sub)}</text>
    <line x1="${p.x}" y1="${topY + 46}" x2="${p.x}" y2="${botY}" stroke="#64748B" stroke-width="1.2" stroke-dasharray="6,4"/>`;
  }

  // Activation bars
  const acts = [
    [310, 155, 65], [540, 180, 390], [775, 215, 290], [995, 365, 65], [1190, 505, 535], [1380, 440, 295], [1565, 765, 300],
  ];
  for (const [ax, ay, ah] of acts) {
    body += `<rect x="${ax - 6}" y="${ay}" width="12" height="${ah}" fill="#E2E8F0" stroke="#1E293B" stroke-width="1.1"/>`;
  }

  // Combined Alt Frames
  body += `
  <rect x="245" y="255" width="1210" height="325" fill="none" stroke="#334155" stroke-width="1.4"/>
  <polygon points="245,255 315,255 315,273 305,281 245,281" fill="#F1F5F9" stroke="#334155" stroke-width="1.3"/>
  <text x="278" y="272" text-anchor="middle" font-family="${FONT_MONO}" font-size="11" font-weight="800" fill="#0F172A">alt</text>
  <text x="330" y="272" font-family="${FONT_MONO}" font-size="10.5" font-weight="700" fill="#B91C1C">[stockDisponible &lt; quantity -> 409 Conflict]</text>
  <line x1="245" y1="322" x2="1455" y2="322" stroke="#64748B" stroke-width="1.1" stroke-dasharray="5,4"/>
  <text x="260" y="340" font-family="${FONT_MONO}" font-size="10.5" font-weight="700" fill="#0369A1">[Stock Reservado OK · Cálculo totalBs exclusivo en Servidor]</text>`;

  function msg(idx, x1, x2, y, label, dashed = false) {
    const right = x2 >= x1;
    const tx = right ? x1 + 12 : x2 + 12;
    const sx = right ? x1 + 6 : x1 - 6;
    const ex = right ? x2 - 6 : x2 + 6;
    const strokeDash = dashed ? ' stroke-dasharray="5,4"' : '';
    return `
    <line x1="${sx}" y1="${y}" x2="${ex}" y2="${y}" stroke="#1E293B" stroke-width="1.35"${strokeDash} marker-end="url(#${dashed ? 'arrowOpen' : 'arrowFilled'})"/>
    <rect x="${tx}" y="${y - 19}" width="${label.length * 6.5 + 26}" height="17" fill="#FFFFFF" opacity="0.92"/>
    <text x="${tx + 2}" y="${y - 6}" font-family="${FONT_MONO}" font-size="10.8" font-weight="600" fill="#0F172A">${idx}. ${esc(label)}</text>`;
  }

  body += msg(1, 100, 310, 155, 'Elige platos + ubicación GPS');
  body += msg(2, 310, 540, 185, 'POST /payments/{qr|stripe|paypal|deposit} (sin precios)');
  body += msg(3, 540, 775, 222, '$transaction: lee Product.precioBs & reserveStockTx()');
  body += msg(4, 775, 310, 298, '409 Conflict: Stock agotado simultáneamente', true);
  body += msg(5, 540, 995, 378, 'Stripe PaymentIntent / PayPal Orders v2 (o HMAC QR)');
  body += msg(6, 995, 540, 412, '200 OK Intent / Order aprobado', true);
  body += msg(7, 540, 1380, 448, 'Si es Depósito -> Cajero PATCH /cajero/payments/:id (APPROVE)');
  body += msg(8, 540, 775, 488, 'UPDATE Order -> PAGO_CONFIRMADO + StockMovement(VENTA)');
  body += msg(9, 540, 1190, 524, 'emitOrderUpdate(PAGO_CONFIRMADO) + Recibo HTML SMTP');
  body += msg(10, 1190, 310, 560, 'SSE Live: PAGO_CONFIRMADO (Muestra tracking al Cliente)', true);
  body += msg(11, 1380, 540, 635, 'Empaquetador: start -> checklist 100% -> finish-packing (PIN)');
  body += msg(12, 540, 1190, 680, 'SSE -> EMPACADO (Genera SealCode + DeliveryTracking PIN 4 dig.)');
  body += msg(13, 1565, 540, 775, 'Repartidor: PATCH /delivery/.../pickup -> EN_CAMINO');
  body += msg(14, 540, 1565, 835, 'Email SMTP al Cliente con Código PIN de entrega (oculto al Rider)', true);
  body += msg(15, 1565, 1190, 905, 'PATCH /delivery/.../location (Lat/Lng + ETA en vivo)');
  body += msg(16, 1565, 775, 975, 'PATCH /deliver (PIN) -> Valida PIN === BD -> ENTREGADO + Email Final');
  body += msg(17, 1190, 100, 1040, 'SSE Notifica ENTREGADO al Cliente en tiempo real', true);

  return wrapDiagram({
    w,
    h,
    kind: 'sd',
    title: 'Diagrama de Secuencia — Checkout 4 Pasarelas, Empaque y Entrega PIN',
    subtitle: 'UML 2.5 · Flujo Transaccional E2E en Tiempo Real',
    body,
  });
}

// ============================================================================
// 5. MÁQUINA DE ESTADOS DEL PEDIDO (OrderStatus)
// ============================================================================
function buildStateMachineSvg() {
  const w = 1600;
  const h = 920;
  let body = '';

  function stateBox(x, y, bw, bh, title, desc, bg = '#FFFBEB') {
    return `
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${bg}" stroke="#1E293B" stroke-width="1.6"/>
    <text x="${x + bw / 2}" y="${y + 22}" text-anchor="middle" font-family="${FONT_MONO}" font-size="12.5" font-weight="800" fill="#0F172A">${esc(title)}</text>
    <line x1="${x}" y1="${y + 30}" x2="${x + bw}" y2="${y + 30}" stroke="#1E293B" stroke-width="1.1"/>
    <text x="${x + bw / 2}" y="${y + 49}" text-anchor="middle" font-family="${FONT_SANS}" font-size="11.5" fill="#334155">${esc(desc)}</text>`;
  }

  // Initial Pseudostate
  body += `<circle cx="62" cy="435" r="12" fill="#0F172A"/>`;
  body += `<line x1="74" y1="435" x2="180" y2="435" stroke="#1E293B" stroke-width="1.6" marker-end="url(#arrowFilled)"/>`;
  body += drawPillLabel(122, 410, 'POST checkout', '#0369A1');

  // States
  body += stateBox(182, 398, 220, 74, 'PENDIENTE_PAGO', 'Stock reservado temporalmente');
  body += stateBox(182, 145, 240, 74, 'PAGO_EN_REVISION', 'Depósito esperando a Caja', '#EFF6FF');
  body += stateBox(605, 145, 220, 74, 'RECHAZADO', 'Stock devuelto al catálogo', '#FEE2E2');
  body += stateBox(580, 398, 235, 74, 'PAGO_CONFIRMADO', 'Venta confirmada · Cola Empaque', '#DCFCE7');
  body += stateBox(580, 680, 235, 74, 'CANCELADO', 'Libera stockReservado', '#FEE2E2');
  body += stateBox(945, 398, 225, 74, 'EN_PREPARACION', 'Empaquetador arma checklist', '#FFFBEB');
  body += stateBox(945, 680, 225, 74, 'EMPACADO', 'Sello + PIN 4 dígitos creado', '#FFFBEB');
  body += stateBox(1300, 680, 245, 74, 'EN_CAMINO', 'Repartidor GPS activo + Email PIN', '#EFF6FF');
  body += stateBox(1300, 398, 245, 74, 'ENTREGADO', 'PIN verificado · Cierre definitivo', '#DCFCE7');

  // Final Pseudostates (Double rings)
  const finals = [[925, 182], [900, 717], [1422, 270]];
  for (const [fx, fy] of finals) {
    body += `<circle cx="${fx}" cy="${fy}" r="13" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6"/>`;
    body += `<circle cx="${fx}" cy="${fy}" r="7.5" fill="#0F172A"/>`;
  }

  // Transitions
  const edges = [
    `M 292 398 L 292 219`,
    `M 422 182 L 605 182`,
    `M 825 182 L 911 182`,
    `M 365 219 L 365 315 L 640 315 L 640 398`,
    `M 402 435 L 580 435`,
    `M 292 472 L 292 717 L 580 717`,
    `M 697 472 L 697 680`,
    `M 815 717 L 886 717`,
    `M 815 435 L 945 435`,
    `M 1057 472 L 1057 680`,
    `M 1170 717 L 1300 717`,
    `M 1422 680 L 1422 472`,
    `M 1422 398 L 1422 284`,
  ];

  for (const d of edges) {
    body += `<path d="${d}" fill="none" stroke="#1E293B" stroke-width="1.5" marker-end="url(#arrowFilled)"/>`;
  }

  body += drawPillLabel(292, 305, 'submitDeposit()', '#0369A1');
  body += drawPillLabel(513, 162, 'review(REJECT) [CAJERO]', '#B91C1C');
  body += drawPillLabel(510, 315, 'review(APPROVE) [CAJERO]', '#047857');
  body += drawPillLabel(491, 412, 'confirmQr / Stripe / PayPal', '#047857');
  body += drawPillLabel(435, 700, 'cancelOrder()', '#B91C1C');
  body += drawPillLabel(697, 575, 'cancelOrder()', '#B91C1C');
  body += drawPillLabel(880, 412, 'startPacking() [EMPAQ]', '#0369A1');
  body += drawPillLabel(1057, 575, 'finishPacking() [Checklist 100%]', '#0369A1');
  body += drawPillLabel(1235, 700, 'pickup() [RIDER]', '#0369A1');
  body += drawPillLabel(1422, 575, 'deliver(pin) [PIN == BD]', '#047857');

  return wrapDiagram({
    w,
    h,
    kind: 'stm',
    title: 'Máquina de Estados OrderStatus — Joy Ride Café® Sucre',
    subtitle: 'order-state.service.ts · ALLOWED_TRANSITIONS Estricto (409 si salta)',
    body,
  });
}

// ============================================================================
// 6. COMPONENTES Y DESPLIEGUE UML 2.5
// ============================================================================
function drawNode3D(x, y, w, h, stereo, title, fill = '#F8FAFC') {
  return `
  <g>
    <polygon points="${x},${y} ${x + 14},${y - 12} ${x + w + 14},${y - 12} ${x + w},${y}" fill="#E2E8F0" stroke="#1E293B" stroke-width="1.4"/>
    <polygon points="${x + w},${y} ${x + w + 14},${y - 12} ${x + w + 14},${y + h - 12} ${x + w},${y + h}" fill="#CBD5E1" stroke="#1E293B" stroke-width="1.4"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#1E293B" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + 20}" text-anchor="middle" font-family="${FONT_MONO}" font-size="11" fill="#475569">${esc(stereo)}</text>
    <text x="${x + w / 2}" y="${y + 38}" text-anchor="middle" font-family="${FONT_SANS}" font-size="13.5" font-weight="800" fill="#0F172A">${esc(title)}</text>
    <line x1="${x}" y1="${y + 48}" x2="${x + w}" y2="${y + 48}" stroke="#94A3B8" stroke-width="1"/>
  </g>`;
}

function drawCompBox(x, y, w, h, title, desc, fill = '#FFFBEB') {
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="#1E293B" stroke-width="1.4"/>
    <!-- UML Component Icon top-right -->
    <rect x="${x + w - 26}" y="${y + 8}" width="16" height="18" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.1"/>
    <rect x="${x + w - 31}" y="${y + 11}" width="8" height="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.1"/>
    <rect x="${x + w - 31}" y="${y + 18}" width="8" height="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.1"/>
    <text x="${x + 12}" y="${y + 21}" font-family="${FONT_SANS}" font-size="12" font-weight="800" fill="#0F172A">${esc(title)}</text>
    <text x="${x + 12}" y="${y + 40}" font-family="${FONT_MONO}" font-size="10.5" fill="#334155">${esc(desc)}</text>
  </g>`;
}

function buildDeploySvg() {
  const w = 1660;
  const h = 980;
  let body = '';

  // Client Node
  body += drawNode3D(45, 110, 385, 480, '«device»', 'Cliente / Staff Browser & PWA');
  body += drawCompBox(70, 185, 335, 68, 'React 18 + Vite SPA', 'Tailwind, Framer Motion, React Query, Recharts');
  body += drawCompBox(70, 280, 335, 68, 'Estado & Almacenamiento Local', 'CartContext (localStorage) + Cookies Tema/Audio');
  body += drawCompBox(70, 375, 335, 68, 'Service Worker PWA', 'sw.js + manifest.webmanifest (Instalación Móvil)');
  body += drawCompBox(70, 470, 335, 68, 'Mapa & Audio Web', 'Leaflet + Esri Topo + Web Audio API (sound.ts)');

  // Server Node
  body += drawNode3D(550, 110, 560, 790, '«executionEnvironment»', 'Render Web Service / Node.js 22 LTS (:4000)');
  body += drawCompBox(580, 185, 500, 70, 'Middleware de Seguridad & Validación', 'Helmet, CORS estricto, RateLimit 429, Zod, Cache no-store', '#EFF6FF');
  body += drawCompBox(580, 285, 500, 74, 'Controladores API RESTful (11 Módulos)', '/auth, /catalog, /payments, /orders, /empaque, /delivery, /admin');
  body += drawCompBox(580, 390, 500, 78, 'Servicios Transaccionales & Pagos', 'Inventory ACID, QR HMAC, Stripe, PayPal, OrderState');
  body += drawCompBox(580, 500, 500, 70, 'Broker Server-Sent Events (SSE)', 'Emit scoped por role Staff u orderId (/api/events/stream)', '#EFF6FF');
  body += drawCompBox(580, 600, 500, 70, 'Servicio de Notificación HTML', 'Nodemailer SMTP TLS + Resend + EmailLog Auditoría');
  body += drawCompBox(580, 700, 500, 70, 'Static SPA Host & /uploads Sandbox', 'Sirve client/dist + /uploads con CSP Sandbox & nosniff');
  body += drawCompBox(580, 800, 500, 70, 'Prisma ORM Client v6', 'Pool PostgreSQL & $transaction Serializada');

  // PostgreSQL Node
  body += drawNode3D(1215, 580, 395, 320, '«databaseServer»', 'PostgreSQL 16 (Local :5433 / Render DB)');
  body += drawCompBox(1240, 660, 345, 78, 'Base de Datos JoyRide DB', '17 Tablas Relacionales + 9 Enums PostgreSQL', '#FEF3C7');
  body += drawCompBox(1240, 765, 345, 78, 'Control Concurrencia ACID', 'Row Locks en stockDisponible y Kardex', '#FEF3C7');

  // External Cloud Node
  body += drawNode3D(1215, 110, 395, 410, '«externalCloud»', 'APIs y Proveedores Externos');
  body += drawCompBox(1240, 185, 345, 62, 'PayPal Orders API v2', 'Checkout USD Sandbox / Live (capture-order)', '#F1F5F9');
  body += drawCompBox(1240, 270, 345, 62, 'Stripe PaymentIntents', 'Cobro Tarjetas Visa/Mastercard / Test 4242', '#F1F5F9');
  body += drawCompBox(1240, 355, 345, 62, 'Gmail SMTP :587', 'villarroelmolina2004612 -> victor2004612', '#F1F5F9');
  body += drawCompBox(1240, 440, 345, 62, 'Esri Topo · OSM Nominatim · OSRM', 'Mapas en relieve y georutas sin costo API', '#F1F5F9');

  // Links
  const links = [
    { d: 'M 405 220 L 580 220', lbl: [492, 206, 'HTTPS JSON + JWT'] },
    { d: 'M 580 535 L 495 535 L 495 250 L 405 250', lbl: [495, 395, 'SSE Real-Time'] },
    { d: 'M 405 504 L 465 504 L 465 935 L 1630 935 L 1630 470 L 1585 470', lbl: [980, 922, 'Leaflet Tiles + OSRM Route (Directo sin API Key)'] },
    { d: 'M 1080 835 L 1240 805', lbl: [1160, 792, 'TCP Prisma SSL'] },
    { d: 'M 1080 405 L 1140 405 L 1140 215 L 1240 215', lbl: [1190, 198, 'HTTPS OAuth2'] },
    { d: 'M 1080 428 L 1152 428 L 1152 300 L 1240 300', lbl: [1196, 282, 'REST Secret Key'] },
    { d: 'M 1080 635 L 1164 635 L 1164 385 L 1240 385', lbl: [1202, 368, 'STARTTLS :587'] },
  ];

  for (const lk of links) {
    body += `<path d="${lk.d}" fill="none" stroke="#0369A1" stroke-width="1.5" marker-end="url(#arrowBlue)"/>`;
    body += drawPillLabel(lk.lbl[0], lk.lbl[1], lk.lbl[2], '#0369A1');
  }

  return wrapDiagram({
    w,
    h,
    kind: 'cmp / deploy',
    title: 'Diagrama de Componentes y Despliegue — Joy Ride Café® Sucre',
    subtitle: 'UML 2.5 · Render Cloud, PostgreSQL 16, SSE y Servicios Externos',
    body,
  });
}

// ============================================================================
// STARUML PROJECT (.mdj) GENERATOR — Opens directly in StarUML 5 / 6
// ============================================================================
function buildStarUmlProjectJson() {
  let seq = 1;
  const nid = (p = 'JR') => `${p}_${String(seq++).padStart(4, '0')}`;
  const projId = nid('PROJ');
  const umlModelId = nid('UML');
  const erdModelId = nid('ERD');

  const actors = ['Cliente', 'Cajero', 'Empaquetador', 'Repartidor', 'Administrador'].map((name) => ({
    _type: 'UMLActor',
    _id: nid('ACT'),
    _parent: { $ref: umlModelId },
    name,
  }));

  const useCases = [
    'UC-01 Explorar Inicio, Carta (/carta) y Mapa',
    'UC-02 Autenticarse (JWT + Refresh Token)',
    'UC-03 Armar Carrito y Ubicación GPS',
    'UC-04 Pagar Pedido (QR / Tarjeta / PayPal / Depósito)',
    'UC-05 Reservar Zona / Salsa & Pase QR',
    'UC-06 Seguir Pedido en Vivo (SSE + Chat)',
    'UC-07 Publicar Reseña Autenticada',
    'UC-08 Aprobar / Rechazar Depósitos',
    'UC-09 Checklist 100%, Sello y PIN',
    'UC-10 Retirar, GPS y Validar PIN',
    'UC-11 Gestionar Catálogo, Kardex, Eventos y KPIs',
    'UC-12 Gestionar Roles, Auditoría y Campañas HTML',
  ].map((name) => ({
    _type: 'UMLUseCase',
    _id: nid('UC'),
    _parent: { $ref: umlModelId },
    name,
  }));

  const umlClasses = [
    ['User', ['id: String', 'name: String', 'email: String', 'role: Role', 'active: Boolean'], ['verifyPassword()', 'issueTokenPair()']],
    ['Category', ['id: String', 'slug: String', 'name: String', 'sortOrder: Int'], ['listProducts()']],
    ['Product', ['id: String', 'slug: String', 'name: String', 'precioBs: Decimal', 'stockDisponible: Int', 'stockReservado: Int'], ['reserve()', 'confirmSale()', 'release()']],
    ['Order', ['id: String', 'orderCode: String', 'status: OrderStatus', 'totalBs: Decimal', 'totalUsd: Decimal'], ['computeTotalsFromDb()', 'transitionTo()']],
    ['OrderItem', ['id: String', 'productName: String', 'unitPriceBs: Decimal', 'quantity: Int', 'subtotalBs: Decimal'], []],
    ['Payment', ['id: String', 'method: PaymentMethod', 'status: PaymentStatus', 'amountBs: Decimal', 'qrToken: String', 'stripePaymentIntentId: String', 'paypalOrderId: String'], ['signQrHmac()', 'confirmGateway()']],
    ['PackagingChecklist', ['id: String', 'items: Jsonb', 'sealCode: String', 'allVerified: Boolean'], ['finishPacking()']],
    ['DeliveryTracking', ['id: String', 'riderLat: Float', 'riderLng: Float', 'etaMinutes: Int', 'deliveryPin: String'], ['validatePinAndDeliver()']],
    ['OrderStatusHistory', ['id: String', 'fromStatus: OrderStatus', 'toStatus: OrderStatus', 'reason: String'], []],
    ['StockMovement', ['id: String', 'type: StockMovementType', 'quantity: Int', 'previousStock: Int', 'newStock: Int'], []],
    ['Reservation', ['id: String', 'code: String', 'zone: ReservationZone', 'date: String', 'partySize: Int', 'qrPassToken: String'], ['checkAvailability()']],
    ['ChatMessage', ['id: String', 'channelType: ChatChannelType', 'content: String'], []],
  ].map(([name, attrs, ops]) => {
    const cid = nid('CLS');
    return {
      _type: 'UMLClass',
      _id: cid,
      _parent: { $ref: umlModelId },
      name,
      attributes: attrs.map((a) => {
        const [aname, atype] = a.split(':').map((x) => x.trim());
        return { _type: 'UMLAttribute', _id: nid('ATT'), _parent: { $ref: cid }, name: aname, type: atype || 'String' };
      }),
      operations: ops.map((oname) => ({
        _type: 'UMLOperation',
        _id: nid('OP'),
        _parent: { $ref: cid },
        name: oname.replace('()', ''),
      })),
    };
  });

  const erdSpecs = [
    ['User', [['id', 'TEXT', true, false], ['email', 'TEXT', false, false], ['name', 'TEXT', false, false], ['passwordHash', 'TEXT', false, false], ['role', 'Role', false, false], ['active', 'BOOLEAN', false, false]]],
    ['Category', [['id', 'TEXT', true, false], ['slug', 'TEXT', false, false], ['name', 'TEXT', false, false], ['sortOrder', 'INTEGER', false, false]]],
    ['Product', [['id', 'TEXT', true, false], ['categoryId', 'TEXT', false, true], ['slug', 'TEXT', false, false], ['name', 'TEXT', false, false], ['precioBs', 'DECIMAL(10,2)', false, false], ['stockDisponible', 'INTEGER', false, false], ['stockReservado', 'INTEGER', false, false]]],
    ['Order', [['id', 'TEXT', true, false], ['orderCode', 'TEXT', false, false], ['userId', 'TEXT', false, true], ['status', 'OrderStatus', false, false], ['deliveryType', 'DeliveryType', false, false], ['totalBs', 'DECIMAL(10,2)', false, false], ['totalUsd', 'DECIMAL(10,2)', false, false]]],
    ['OrderItem', [['id', 'TEXT', true, false], ['orderId', 'TEXT', false, true], ['productId', 'TEXT', false, true], ['quantity', 'INTEGER', false, false], ['subtotalBs', 'DECIMAL(10,2)', false, false]]],
    ['Payment', [['id', 'TEXT', true, false], ['orderId', 'TEXT', false, true], ['verificadoPorId', 'TEXT', false, true], ['method', 'PaymentMethod', false, false], ['status', 'PaymentStatus', false, false], ['amountBs', 'DECIMAL(10,2)', false, false], ['stripePaymentIntentId', 'TEXT', false, false]]],
    ['PackagingChecklist', [['id', 'TEXT', true, false], ['orderId', 'TEXT', false, true], ['empaquetadorId', 'TEXT', false, true], ['items', 'JSONB', false, false], ['sealCode', 'TEXT', false, false], ['allVerified', 'BOOLEAN', false, false]]],
    ['DeliveryTracking', [['id', 'TEXT', true, false], ['orderId', 'TEXT', false, true], ['repartidorId', 'TEXT', false, true], ['deliveryPin', 'TEXT', false, false], ['riderLat', 'FLOAT', false, false], ['riderLng', 'FLOAT', false, false]]],
    ['OrderStatusHistory', [['id', 'TEXT', true, false], ['orderId', 'TEXT', false, true], ['actorId', 'TEXT', false, true], ['fromStatus', 'OrderStatus', false, false], ['toStatus', 'OrderStatus', false, false], ['reason', 'TEXT', false, false]]],
    ['StockMovement', [['id', 'TEXT', true, false], ['productId', 'TEXT', false, true], ['orderId', 'TEXT', false, true], ['actorId', 'TEXT', false, true], ['type', 'StockMovementType', false, false], ['quantity', 'INTEGER', false, false]]],
    ['Reservation', [['id', 'TEXT', true, false], ['code', 'TEXT', false, false], ['userId', 'TEXT', false, true], ['zone', 'ReservationZone', false, false], ['date', 'TEXT', false, false], ['partySize', 'INTEGER', false, false], ['qrPassToken', 'TEXT', false, false]]],
    ['ChatMessage', [['id', 'TEXT', true, false], ['orderId', 'TEXT', false, true], ['senderId', 'TEXT', false, true], ['channelType', 'ChatChannelType', false, false], ['content', 'TEXT', false, false]]],
    ['Promotion', [['id', 'TEXT', true, false], ['slug', 'TEXT', false, false], ['title', 'TEXT', false, false], ['discountPercent', 'INTEGER', false, false]]],
    ['Event', [['id', 'TEXT', true, false], ['slug', 'TEXT', false, false], ['title', 'TEXT', false, false], ['spotId', 'TEXT', false, false]]],
    ['Review', [['id', 'TEXT', true, false], ['userId', 'TEXT', false, false], ['authorName', 'TEXT', false, false], ['rating', 'INTEGER', false, false]]],
    ['NewsletterSubscriber', [['id', 'TEXT', true, false], ['email', 'TEXT', false, false], ['active', 'BOOLEAN', false, false]]],
    ['EmailLog', [['id', 'TEXT', true, false], ['toEmail', 'TEXT', false, false], ['templateType', 'TEXT', false, false], ['status', 'TEXT', false, false]]],
  ];
  // Wait: schema.prisma has 16 tables total (Promotion, Event, Review, NewsletterSubscriber, EmailLog + 12 = 17? Let's count carefully!).
  // Schema count check: 1 User, 2 Category, 3 Product, 4 StockMovement, 5 Promotion, 6 Order, 7 OrderItem, 8 Payment,
  // 9 PackagingChecklist, 10 DeliveryTracking, 11 OrderStatusHistory, 12 Reservation, 13 ChatMessage, 14 EmailLog, 15 NewsletterSubscriber, 16 Review, 17 Event!
  // Let's keep all 17 exact Prisma models accurately represented (count=17 models + 9 enums)!

  const erdEntities = {};
  const entityNodes = erdSpecs.map(([name, cols]) => {
    const eid = nid('ENT');
    const ent = {
      _type: 'ERDEntity',
      _id: eid,
      _parent: { $ref: erdModelId },
      name,
      columns: cols.map(([cname, ctype, pk, fk]) => ({
        _type: 'ERDColumn',
        _id: nid('COL'),
        _parent: { $ref: eid },
        name: cname,
        type: ctype,
        primaryKey: pk,
        foreignKey: fk,
        nullable: cname.includes('?') || (!pk && !fk),
      })),
    };
    erdEntities[name] = ent;
    return ent;
  });

  const erdRels = [
    ['User', 'Order', '1', '0..*'],
    ['User', 'Reservation', '1', '0..*'],
    ['User', 'ChatMessage', '1', '0..*'],
    ['Category', 'Product', '1', '1..*'],
    ['Product', 'OrderItem', '1', '0..*'],
    ['Product', 'StockMovement', '1', '0..*'],
    ['Order', 'OrderItem', '1', '1..*'],
    ['Order', 'Payment', '1', '0..1'],
    ['Order', 'PackagingChecklist', '1', '0..1'],
    ['Order', 'DeliveryTracking', '1', '0..1'],
    ['Order', 'OrderStatusHistory', '1', '1..*'],
    ['Order', 'ChatMessage', '1', '0..*'],
    ['Order', 'StockMovement', '1', '0..*'],
  ].map(([from, to, card1, card2]) => {
    const rid = nid('REL');
    return {
      _type: 'ERDRelationship',
      _id: rid,
      _parent: { $ref: erdEntities[from]._id },
      end1: { _type: 'ERDRelationshipEnd', _id: nid('END'), _parent: { $ref: rid }, reference: { $ref: erdEntities[from]._id }, cardinality: card1 },
      end2: { _type: 'ERDRelationshipEnd', _id: nid('END'), _parent: { $ref: rid }, reference: { $ref: erdEntities[to]._id }, cardinality: card2 },
    };
  });
  for (const rel of erdRels) {
    const owner = entityNodes.find((e) => e._id === rel._parent.$ref);
    owner.ownedElements = owner.ownedElements || [];
    owner.ownedElements.push(rel);
  }

  return {
    _type: 'Project',
    _id: projId,
    name: 'JoyRideCafeSucre',
    ownedElements: [
      {
        _type: 'UMLModel',
        _id: umlModelId,
        _parent: { $ref: projId },
        name: 'Modelo UML 2.5 - Joy Ride Café Sucre',
        ownedElements: [...actors, ...useCases, ...umlClasses],
      },
      {
        _type: 'ERDDataModel',
        _id: erdModelId,
        _parent: { $ref: projId },
        name: 'Modelo Físico PostgreSQL (Prisma Schema)',
        ownedElements: entityNodes,
      },
    ],
  };
}

async function main() {
  await fs.mkdir(OUT_IMG_DIR, { recursive: true });
  await fs.mkdir(OUT_SRC_DIR, { recursive: true });

  const plates = [
    { file: '01-casos-de-uso', svg: buildUseCaseSvg() },
    { file: '02-clases-dominio', svg: buildClassDiagramSvg() },
    { file: '03-erd-base-datos', svg: buildErdSvg() },
    { file: '04-secuencia-pedido-pago', svg: buildSequenceSvg() },
    { file: '05-maquina-estados-pedido', svg: buildStateMachineSvg() },
    { file: '06-componentes-despliegue', svg: buildDeploySvg() },
  ];

  for (const plate of plates) {
    const svgPath = path.join(OUT_IMG_DIR, `${plate.file}.svg`);
    const pngPath = path.join(OUT_IMG_DIR, `${plate.file}.png`);
    await fs.writeFile(svgPath, plate.svg, 'utf8');
    const pngBuf = await sharp(Buffer.from(plate.svg, 'utf8'), { density: 160 }).png().toBuffer();
    await fs.writeFile(pngPath, pngBuf);
    const meta = await sharp(pngBuf).metadata();
    console.log(`[DIAGRAM] ${plate.file}.svg + .png (${meta.width}x${meta.height}, ${pngBuf.length} bytes)`);
  }

  const mdjPath = path.join(OUT_SRC_DIR, 'joyride-staruml.mdj');
  await fs.writeFile(mdjPath, JSON.stringify(buildStarUmlProjectJson(), null, 2), 'utf8');
  console.log(`[STARUML] Project exported -> ${mdjPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
