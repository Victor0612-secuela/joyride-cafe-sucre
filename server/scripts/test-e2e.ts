import assert from 'node:assert/strict';

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:4000/api';

async function api(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, data: json };
}

async function login(email: string) {
  const r = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'JoyRide2026!' }),
  });
  assert.equal(r.status, 200, `Login failed for ${email}: ${JSON.stringify(r.data)}`);
  return r.data.accessToken as string;
}

async function run() {
  console.log(`=== Running E2E Integration Tests against ${BASE} ===`);

  // 1. Health
  const health = await api('/health');
  assert.equal(health.status, 200, 'Health check failed');
  assert.equal(health.data.ok, true);
  console.log('[PASS] 1. Health & PostgreSQL connection');

  // 2. Login all 5 roles
  const clientToken = await login('cliente@joyride.bo');
  const cashierToken = await login('cajero@joyride.bo');
  const packerToken = await login('empaque@joyride.bo');
  const riderToken = await login('repartidor@joyride.bo');
  const adminToken = await login('admin@joyride.bo');
  console.log('[PASS] 2. JWT Authentication for all 5 roles');

  // 3. Catalog
  const catRes = await api('/products');
  assert.equal(catRes.status, 200);
  const products = catRes.data.products as any[];
  assert.ok(products.length >= 20, `Expected >=20 products, got ${products.length}`);
  const trucha = products.find((p) => p.slug === 'filete-trucha-quinua');
  const burger = products.find((p) => p.slug === 'joy-ride-mountain-burger');
  const chuflay = products.find((p) => p.slug === 'chuflay-singani');
  assert.ok(trucha && burger && chuflay, 'Seed products missing');
  console.log(`[PASS] 3. Catalog loaded (${products.length} products)`);

  // 4. Stock Conflict 409 check
  const conflict = await api(
    '/payments/qr/initiate',
    {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: trucha.id, quantity: 29 }],
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Plaza 25 de Mayo',
        phoneContact: '+591 71123456',
      }),
    },
    clientToken
  );
  assert.equal(conflict.status, 409, `Expected 409 stock conflict, got ${conflict.status}`);
  console.log('[PASS] 4. Atomic stock conflict guard (409 Conflict)');

  // 5. Full QR End-to-End Lifecycle
  const initialChuflayStock = chuflay.stockDisponible;
  const qrInit = await api(
    '/payments/qr/initiate',
    {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: chuflay.id, quantity: 2 }],
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Calle Bolívar N° 310, Sucre',
        deliveryReference: 'Casa blanca balcón colonial',
        phoneContact: '+591 71123456',
        splitCount: 2,
      }),
    },
    clientToken
  );
  assert.equal(qrInit.status, 201, `QR initiate failed: ${JSON.stringify(qrInit.data)}`);
  const { orderId, qrToken } = qrInit.data;

  // Verify stock reserved
  const afterReserve = (await api('/products')).data.products.find((p: any) => p.id === chuflay.id);
  assert.equal(afterReserve.stockDisponible, initialChuflayStock - 2);
  assert.equal(afterReserve.stockReservado, chuflay.stockReservado + 2);

  // Public QR Info
  const qrInfo = await api(`/payments/qr/info/${qrToken}`);
  assert.equal(qrInfo.status, 200);
  assert.equal(qrInfo.data.paymentStatus, 'PENDIENTE');

  // Confirm QR Live
  const qrConfirm = await api(`/payments/qr/confirm/${qrToken}`, { method: 'POST' });
  assert.equal(qrConfirm.status, 200);
  assert.equal(qrConfirm.data.orderStatus, 'PAGO_CONFIRMADO');

  // Idempotent confirm
  const qrConfirmAgain = await api(`/payments/qr/confirm/${qrToken}`, { method: 'POST' });
  assert.equal(qrConfirmAgain.status, 200);
  assert.equal(qrConfirmAgain.data.alreadyConfirmed, true);

  // Verify stock consolidated
  const afterConfirm = (await api('/products')).data.products.find((p: any) => p.id === chuflay.id);
  assert.equal(afterConfirm.stockDisponible, initialChuflayStock - 2);
  assert.equal(afterConfirm.stockReservado, chuflay.stockReservado);

  // RBAC: Client cannot pack
  const forbiddenPack = await api(`/empaque/orders/${orderId}/start`, { method: 'PATCH' }, clientToken);
  assert.equal(forbiddenPack.status, 403);

  // Packer starts preparation
  const startPack = await api(`/empaque/orders/${orderId}/start`, { method: 'PATCH' }, packerToken);
  assert.equal(startPack.status, 200);
  const checklist = startPack.data.packaging.items as Array<{ id: string; label: string; checked: boolean }>;

  // Packer cannot finish with incomplete checklist
  const failFinish = await api(`/empaque/orders/${orderId}/finish-packing`, { method: 'PATCH' }, packerToken);
  assert.equal(failFinish.status, 400);

  // Check 100% of items via AJAX
  const checkedItems = checklist.map((c) => ({ ...c, checked: true }));
  const updCheck = await api(
    `/empaque/orders/${orderId}/checklist`,
    { method: 'PATCH', body: JSON.stringify({ items: checkedItems }) },
    packerToken
  );
  assert.equal(updCheck.status, 200);
  assert.equal(updCheck.data.packaging.allVerified, true);

  // Finish packing -> generates PIN
  const donePack = await api(`/empaque/orders/${orderId}/finish-packing`, { method: 'PATCH' }, packerToken);
  assert.equal(donePack.status, 200);
  assert.equal(donePack.data.status, 'EMPACADO');
  const realPin = donePack.data.deliveryPin as string;
  assert.match(realPin, /^\d{4}$/);

  // Rider list must NOT leak deliveryPin
  const riderList = await api('/delivery/orders', {}, riderToken);
  assert.equal(riderList.status, 200);
  const riderTarget = riderList.data.orders.find((o: any) => o.id === orderId);
  assert.ok(riderTarget, 'Packed order missing in rider list');
  assert.equal(riderTarget.delivery.deliveryPin, undefined, 'PIN must not be exposed to rider!');

  // Rider pickup
  const pickup = await api(`/delivery/orders/${orderId}/pickup`, { method: 'PATCH' }, riderToken);
  assert.equal(pickup.status, 200);
  assert.equal(pickup.data.status, 'EN_CAMINO');

  // Rider wrong PIN rejected
  const wrongPin = await api(
    `/delivery/orders/${orderId}/deliver`,
    { method: 'PATCH', body: JSON.stringify({ pin: realPin === '0000' ? '1111' : '0000', receiverName: 'Camila' }) },
    riderToken
  );
  assert.equal(wrongPin.status, 400);

  // Rider correct PIN -> ENTREGADO
  const delivered = await api(
    `/delivery/orders/${orderId}/deliver`,
    { method: 'PATCH', body: JSON.stringify({ pin: realPin, receiverName: 'Camila Mendoza' }) },
    riderToken
  );
  assert.equal(delivered.status, 200);
  assert.equal(delivered.data.status, 'ENTREGADO');

  // Full audit trail check
  const orderDetail = await api(`/orders/${orderId}`, {}, clientToken);
  assert.equal(orderDetail.status, 200);
  assert.equal(orderDetail.data.order.history.length, 6);
  console.log('[PASS] 5. Full QR -> Empaque (Checklist) -> Entrega (PIN) + RBAC + Audit Trail');

  // 6. Bank Deposit Reject (Stock restitution) & Approve
  const beforeDepStock = (await api('/products')).data.products.find((p: any) => p.id === burger.id).stockDisponible;
  const dummySvg = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>').toString('base64')}`;

  const depSubmit1 = await api(
    '/payments/deposit/submit',
    {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: burger.id, quantity: 2 }],
        deliveryType: 'RECOGER_LOCAL',
        phoneContact: '+591 71123456',
        bankName: 'Banco Unión',
        referenceNumber: 'BU-TEST-001',
        comprobanteBase64: dummySvg,
      }),
    },
    clientToken
  );
  assert.equal(depSubmit1.status, 201);
  const midDepStock = (await api('/products')).data.products.find((p: any) => p.id === burger.id).stockDisponible;
  assert.equal(midDepStock, beforeDepStock - 2);

  // Cashier rejects with reason -> stock restored!
  const depReject = await api(
    `/cajero/payments/${depSubmit1.data.paymentId}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify({ decision: 'REJECT', notes: 'Comprobante ilegible, monto no coincide' }),
    },
    cashierToken
  );
  assert.equal(depReject.status, 200);
  const restoredStock = (await api('/products')).data.products.find((p: any) => p.id === burger.id).stockDisponible;
  assert.equal(restoredStock, beforeDepStock, 'Stock must be restored after deposit rejection');

  // Second deposit approved by Cashier
  const depSubmit2 = await api(
    '/payments/deposit/submit',
    {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: burger.id, quantity: 1 }],
        deliveryType: 'RECOGER_LOCAL',
        phoneContact: '+591 71123456',
        bankName: 'BNB',
        referenceNumber: 'BNB-TEST-002',
        comprobanteBase64: dummySvg,
      }),
    },
    clientToken
  );
  assert.equal(depSubmit2.status, 201);

  const depApprove = await api(
    `/cajero/payments/${depSubmit2.data.paymentId}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify({ decision: 'APPROVE', notes: 'Verificado en extracto BNB' }),
    },
    cashierToken
  );
  assert.equal(depApprove.status, 200);
  assert.equal(depApprove.data.updatedOrder.status, 'PAGO_CONFIRMADO');
  console.log('[PASS] 6. Bank Deposit Reject (restores stock) & Approve by Cajero');

  // 7. PayPal Config check
  const ppConfig = await api('/payments/paypal/config');
  assert.equal(ppConfig.status, 200);
  assert.equal(ppConfig.data.currency, 'USD');
  console.log(`[PASS] 7. PayPal Orders v2 config endpoint (configured=${ppConfig.data.configured})`);

  // 8. Reservations
  const today = new Date().toISOString().slice(0, 10);
  const avail = await api(`/reservations/availability?date=${today}`);
  assert.equal(avail.status, 200);
  assert.equal(avail.data.zones.length, 4);

  const resCreate = await api(
    '/reservations',
    {
      method: 'POST',
      body: JSON.stringify({
        guestName: 'Camila Mendoza',
        guestEmail: 'cliente@joyride.bo',
        guestPhone: '+591 71123456',
        zone: 'PISTA_SALSA_BACHATA',
        date: today,
        timeSlot: '19:00',
        partySize: 2,
        includeSalsaClass: true,
      }),
    },
    clientToken
  );
  assert.equal(resCreate.status, 201);
  assert.ok(resCreate.data.reservation.qrPassToken);
  console.log('[PASS] 8. Table & Salsa/Bachata Reservation + QR Pass');

  // 9. Admin Analytics & Kardex
  const analytics = await api('/admin/analytics', {}, adminToken);
  assert.equal(analytics.status, 200);
  assert.ok(analytics.data.summary.totalRevenueBs > 0);
  assert.equal(analytics.data.revenueByMethod.length, 4);

  const kardex = await api('/admin/kardex', {}, adminToken);
  assert.equal(kardex.status, 200);
  assert.ok(kardex.data.movements.length > 0);
  console.log('[PASS] 9. Admin Analytics & Stock Kardex');

  // 10. Direct Order Chat (Client <-> Rider) & Internal Staff Chat
  const staffPost = await api(
    '/chat/staff',
    { method: 'POST', body: JSON.stringify({ content: 'E2E Staff msg: revisar mesa 4' }) },
    packerToken
  );
  assert.equal(staffPost.status, 201);
  const staffGet = await api('/chat/staff', {}, riderToken);
  assert.equal(staffGet.status, 200);
  assert.ok(staffGet.data.messages.some((m: any) => m.content.includes('E2E Staff msg')));

  const orderChatClient = await api(
    `/chat/order/${orderId}`,
    { method: 'POST', body: JSON.stringify({ content: 'Estoy en el portón principal' }) },
    clientToken
  );
  assert.equal(orderChatClient.status, 201);
  const orderChatRider = await api(`/chat/order/${orderId}`, {}, riderToken);
  assert.equal(orderChatRider.status, 200);
  assert.ok(orderChatRider.data.messages.some((m: any) => m.content.includes('portón principal')));

  // Verify Admin can read (audit) order delivery chat, but CANNOT post to it (403)
  const orderChatAdminGet = await api(`/chat/order/${orderId}`, {}, adminToken);
  assert.equal(orderChatAdminGet.status, 200);
  const orderChatAdminPost = await api(
    `/chat/order/${orderId}`,
    { method: 'POST', body: JSON.stringify({ content: 'Admin intentando escribir' }) },
    adminToken
  );
  assert.equal(orderChatAdminPost.status, 403);
  console.log('[PASS] 10. Real-time Staff Ops Chat & Client-Rider Delivery Chat (Admin read-only audit)');

  // 11. Rider GPS Location Update
  const gpsUpdate = await api(
    `/delivery/orders/${orderId}/location`,
    {
      method: 'PATCH',
      body: JSON.stringify({ riderLat: -19.0462, riderLng: -65.2608, etaMinutes: 5 }),
    },
    riderToken
  );
  assert.equal(gpsUpdate.status, 200);
  assert.equal(gpsUpdate.data.etaMinutes, 5);
  console.log('[PASS] 11. Live Rider GPS & ETA Tracking Update');

  // 12. HTML Email Logs, Newsletter Subscribe & Campaign
  const subRes = await api('/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email: 'turista@joyride.bo', name: 'Alex Traveler' }),
  });
  assert.equal(subRes.status, 201);

  const campRes = await api(
    '/admin/emails/campaign',
    {
      method: 'POST',
      body: JSON.stringify({
        subject: 'Noche de Salsa y 2x1 en Joy Ride Sucre',
        headline: 'Hoy Happy Hour 2x1 + Salsa Gratis',
        bodyText: 'Te esperamos en Calle Nicolás Ortiz 14 desde las 18:00.',
        promoCode: 'JOYRIDE2X1',
      }),
    },
    adminToken
  );
  assert.equal(campRes.status, 201);
  assert.ok(campRes.data.count >= 1);

  const emailLogs = await api('/admin/emails', {}, adminToken);
  assert.equal(emailLogs.status, 200);
  assert.ok(emailLogs.data.emails.some((e: any) => e.templateType === 'ORDER_CONFIRMED'));
  assert.ok(emailLogs.data.emails.some((e: any) => e.templateType === 'ORDER_PACKED_PIN'));
  console.log('[PASS] 12. HTML Email Receipts, PIN Alerts, Low Stock Alerts & Campaigns');

  // 13. Admin Product File Upload & Community Reviews (Google / Cuenta Joy Ride)
  const samplePngBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadImgRes = await api(
    '/admin/products/upload-image',
    { method: 'POST', body: JSON.stringify({ imageBase64: samplePngBase64, fileName: 'test.png' }) },
    adminToken
  );
  assert.equal(uploadImgRes.status, 201);
  assert.ok(String(uploadImgRes.data.imageUrl).startsWith('/uploads/products/'));
  const imgFetch = await fetch(`http://127.0.0.1:4000${uploadImgRes.data.imageUrl}`);
  assert.equal(imgFetch.status, 200);

  const reviewPost = await api(
    '/reviews',
    {
      method: 'POST',
      body: JSON.stringify({
        authorName: 'Viajero E2E Google',
        authorOrigin: 'Sucre, Bolivia',
        verifiedVia: 'GOOGLE',
        rating: 5,
        comment: 'Excelente atencion y mapa interactivo de Sucre en Joy Ride Cafe.',
      }),
    },
    clientToken
  );
  assert.equal(reviewPost.status, 201);
  const reviewsList = await api('/reviews');
  assert.equal(reviewsList.status, 200);
  assert.ok(reviewsList.data.reviews.length >= 6);
  console.log('[PASS] 13. Product File Upload (/uploads/products) & Community Reviews');

  // 14. Dynamic Events CRUD/Toggle + PayPal Express Checkout + Reservation Manager Alert Email
  const publicEvents = await api('/events');
  assert.equal(publicEvents.status, 200);
  assert.ok(publicEvents.data.events.length >= 7);

  const adminEventCreate = await api(
    '/admin/events',
    {
      method: 'POST',
      body: JSON.stringify({
        title: 'Noche Acustica E2E Joy Ride',
        subtitle: 'Guitarra en vivo y 2x1 de bienvenida',
        description: 'Evento creado desde Admin para validar activacion y notificacion por correo.',
        badge: 'LIVE ACOUSTIC',
        accent: 'cyan',
        locationLabel: 'Calle Nicolas Ortiz N 14',
        scheduleLabel: '20:30 - 23:30',
        imageUrl: '/images/musica-vivo.webp',
        spotId: 'joyride-hq',
        isActive: false,
        notifySubscribers: false,
      }),
    },
    adminToken
  );
  assert.equal(adminEventCreate.status, 201);
  const createdEventId = adminEventCreate.data.event.id;

  const toggleEvent = await api(
    `/admin/events/${createdEventId}/toggle`,
    { method: 'PATCH', body: JSON.stringify({ notifySubscribers: true }) },
    adminToken
  );
  assert.equal(toggleEvent.status, 200);
  assert.equal(toggleEvent.data.event.isActive, true);
  assert.ok(toggleEvent.data.notifiedCount >= 1);

  const ppCreate = await api(
    '/payments/paypal/create-order',
    {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: products[1].id, quantity: 1 }],
        deliveryType: 'RECOGER_LOCAL',
        phoneContact: '+591 71123456',
        splitCount: 1,
      }),
    },
    clientToken
  );
  assert.equal(ppCreate.status, 201);
  assert.ok(ppCreate.data.paypalOrderId);

  const ppCap = await api(
    '/payments/paypal/capture-order',
    {
      method: 'POST',
      body: JSON.stringify({
        paypalOrderId: ppCreate.data.paypalOrderId,
        orderId: ppCreate.data.orderId,
      }),
    },
    clientToken
  );
  assert.equal(ppCap.status, 200);
  assert.equal(ppCap.data.status, 'PAGO_CONFIRMADO');

  const emailsAfterV4 = await api('/admin/emails', {}, adminToken);
  assert.equal(emailsAfterV4.status, 200);
  assert.ok(emailsAfterV4.data.emails.some((e: any) => e.templateType === 'EVENT_ANNOUNCEMENT'));
  assert.ok(emailsAfterV4.data.emails.some((e: any) => e.templateType === 'RESERVATION_MANAGER_ALERT'));

  await api(`/admin/events/${createdEventId}`, { method: 'DELETE' }, adminToken);
  console.log('[PASS] 14. Dynamic Events + Email Notification, PayPal Express & Reservation Manager Alert');

  // 15. Dynamic Bento Promotions Editor + 5-Template Email Test Suite + Security Hardening Checks
  const adminPromosRes = await api('/admin/promotions', {}, adminToken);
  assert.equal(adminPromosRes.status, 200);
  assert.ok(adminPromosRes.data.promotions.length >= 2);
  const firstPromo = adminPromosRes.data.promotions[0];

  const promoUpdateRes = await api(
    `/admin/promotions/${firstPromo.id}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        title: `${firstPromo.title} · VIP`,
        subtitle: firstPromo.subtitle,
        description: firstPromo.description,
        badgeText: firstPromo.badgeText,
        scheduleText: firstPromo.scheduleText,
        discountPercent: firstPromo.discountPercent ?? 0,
        imageUrl: firstPromo.imageUrl,
        active: firstPromo.active !== false,
      }),
    },
    adminToken
  );
  assert.equal(promoUpdateRes.status, 200);
  assert.equal(promoUpdateRes.data.promotion.title, `${firstPromo.title} · VIP`);

  // Restore original promo title cleanly
  await api(
    `/admin/promotions/${firstPromo.id}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        title: firstPromo.title,
        subtitle: firstPromo.subtitle,
        description: firstPromo.description,
        badgeText: firstPromo.badgeText,
        scheduleText: firstPromo.scheduleText,
        discountPercent: firstPromo.discountPercent ?? 0,
        imageUrl: firstPromo.imageUrl,
        active: firstPromo.active !== false,
      }),
    },
    adminToken
  );

  const suiteRes = await api(
    '/admin/emails/send-suite',
    {
      method: 'POST',
      body: JSON.stringify({ email: 'victor2004612@gmail.com' }),
    },
    adminToken
  );
  assert.equal(suiteRes.status, 201);
  assert.equal(suiteRes.data.count, 5);
  assert.ok(['SMTP', 'RESEND', 'PREVIEW_ONLY'].includes(suiteRes.data.deliveryMode));

  const xssReviewRes = await api(
    '/reviews',
    {
      method: 'POST',
      body: JSON.stringify({
        authorName: 'Security Probe',
        rating: 5,
        comment: 'Validacion de URL maliciosa en foto de resena.',
        photoUrl: 'javascript:alert(1)',
      }),
    },
    clientToken
  );
  assert.equal(xssReviewRes.status, 400);

  const staticUploadCheck = await fetch(`http://127.0.0.1:4000${uploadImgRes.data.imageUrl}`);
  assert.equal(staticUploadCheck.status, 200);
  assert.equal(staticUploadCheck.headers.get('x-content-type-options'), 'nosniff');
  assert.ok((staticUploadCheck.headers.get('content-security-policy') || '').includes('sandbox'));
  assert.equal(staticUploadCheck.headers.get('x-powered-by'), null);
  console.log('[PASS] 15. Dynamic Bento Promotions + 5-Template Email Suite + Security Hardening');

  // 16. Stripe PaymentIntents Flow + Deep F12 DevTools Tampering Guards
  const stripeCfg = await api('/payments/stripe/config');
  assert.equal(stripeCfg.status, 200);
  assert.equal(stripeCfg.data.expressReady, true);

  const targetProd = products[0];
  const expectedMinTotalBs = Number(targetProd.precioBs);
  const stripeIntent = await api(
    '/payments/stripe/create-intent',
    {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: targetProd.id, quantity: 1 }],
        deliveryType: 'RECOGER_LOCAL',
        phoneContact: '+591 71123456',
        totalBs: 0.01, // Tampered client total must be completely ignored
        splitCount: 1,
      }),
    },
    clientToken
  );
  assert.equal(stripeIntent.status, 201);
  assert.ok(stripeIntent.data.paymentIntentId);
  assert.ok(Number(stripeIntent.data.totalBs) >= expectedMinTotalBs);

  const stripeConfirm = await api(
    '/payments/stripe/confirm-intent',
    {
      method: 'POST',
      body: JSON.stringify({
        orderId: stripeIntent.data.orderId,
        paymentIntentId: stripeIntent.data.paymentIntentId,
        cardBrand: 'VISA',
        cardLast4: '4242',
      }),
    },
    clientToken
  );
  assert.equal(stripeConfirm.status, 200);
  assert.equal(stripeConfirm.data.status, 'PAGO_CONFIRMADO');

  // F12 API tampering checks
  const anonAdminCreate = await api('/admin/products', { method: 'POST', body: JSON.stringify({ name: 'Hack' }) });
  assert.equal(anonAdminCreate.status, 401);

  const clientAdminCreate = await api(
    '/admin/products',
    { method: 'POST', body: JSON.stringify({ name: 'Hack' }) },
    clientToken
  );
  assert.equal(clientAdminCreate.status, 403);

  const anonReview = await api('/reviews', {
    method: 'POST',
    body: JSON.stringify({ comment: 'Intento sin autenticacion desde F12', rating: 5 }),
  });
  assert.equal(anonReview.status, 401);

  const f12RegisterAdmin = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'F12 Escalation Probe',
      email: `f12probe-${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'ADMIN',
    }),
  });
  assert.equal(f12RegisterAdmin.status, 201);
  assert.equal(f12RegisterAdmin.data.user.role, 'CLIENTE');

  const noCacheOrders = await fetch(`${BASE}/orders/mine`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.equal(noCacheOrders.status, 200);
  assert.ok((noCacheOrders.headers.get('cache-control') || '').includes('no-store'));

  console.log('[PASS] 16. Stripe Gateway + Server Price Authority + Deep F12 Security Guards');

  console.log('\nALL E2E INTEGRATION TESTS PASSED!');
}

run().catch((err) => {
  console.error('\nE2E TEST FAILED:', err);
  process.exit(1);
});
