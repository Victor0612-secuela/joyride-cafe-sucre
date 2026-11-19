import nodemailer from 'nodemailer';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

export type EmailDeliveryMode = 'SMTP' | 'RESEND' | 'PREVIEW_ONLY';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export function getEmailDeliveryMode(): EmailDeliveryMode {
  if (isSmtpConfigured()) return 'SMTP';
  if (Boolean(env.RESEND_API_KEY)) return 'RESEND';
  return 'PREVIEW_ONLY';
}

async function sendOrStoreEmail(params: {
  toEmail: string;
  recipientRole: string;
  templateType: string;
  subject: string;
  htmlBody: string;
  relatedOrderId?: string;
}) {
  let status = 'STORED_PREVIEW';

  if (isSmtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: params.toEmail,
        subject: params.subject,
        html: params.htmlBody,
      });
      status = 'SENT';
    } catch (err) {
      console.warn('[EMAIL] SMTP error, falling back to STORED_PREVIEW:', err);
      status = 'SMTP_FAILED_STORED';
    }
  } else if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.SMTP_FROM || 'Joy Ride Café Sucre <onboarding@resend.dev>',
          to: [params.toEmail],
          subject: params.subject,
          html: params.htmlBody,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        status = 'SENT';
      } else {
        const text = await res.text().catch(() => '');
        console.warn('[EMAIL] Resend error:', res.status, text);
        status = 'SMTP_FAILED_STORED';
      }
    } catch (err) {
      console.warn('[EMAIL] Resend exception, falling back to STORED_PREVIEW:', err);
      status = 'SMTP_FAILED_STORED';
    }
  }

  return prisma.emailLog.create({
    data: {
      toEmail: params.toEmail,
      recipientRole: params.recipientRole,
      templateType: params.templateType,
      subject: params.subject,
      htmlBody: params.htmlBody,
      status,
      relatedOrderId: params.relatedOrderId,
    },
  });
}

function wrapJoyRideShell(badge: string, heading: string, bodyHtml: string, accent = '#00A0DF'): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#0B0D12;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#141821;border:1px solid #262C3A;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.45);">
    <tr>
      <td style="padding:26px 30px;background:linear-gradient(135deg,#0B0D12 0%,#171C28 100%);border-bottom:1px solid #262C3A;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:${accent};color:#0B0D12;font-size:11px;font-weight:800;letter-spacing:0.08em;">${escapeHtml(badge)}</span>
            </td>
            <td style="text-align:right;font-size:11px;font-weight:700;color:#94A3B8;font-family:monospace;">SUCRE · EST. 2001</td>
          </tr>
        </table>
        <h1 style="margin:14px 0 6px;font-size:24px;line-height:1.25;color:#F8FAFC;font-weight:800;">${escapeHtml(heading)}</h1>
        <p style="margin:0;font-size:13px;color:#94A3B8;">JOY RIDE CAFÉ® · Calle Nicolás Ortiz N° 14 (Frente a la Catedral)</p>
      </td>
    </tr>
    <tr>
      <td style="padding:26px 30px;font-size:15px;line-height:1.65;color:#E2E8F0;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 30px;background:#0B0D12;border-top:1px solid #262C3A;font-size:12px;color:#94A3B8;text-align:center;">
        <div style="font-weight:700;color:#00A0DF;margin-bottom:4px;">&ldquo;No solo para gringos — Probably the best bar in town&rdquo;</div>
        <div>WhatsApp +591 76116875 · <a href="${escapeHtml(env.APP_URL)}/mapa-sucre" style="color:#F20574;text-decoration:none;font-weight:700;">Ver Guía Turística de Sucre</a></div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmedEmail(params: {
  toEmail: string;
  customerName: string;
  orderId?: string;
  orderCode: string;
  paymentMethod: string;
  totalBs: number;
  totalUsd: number;
  items: Array<{ productName: string; quantity: number; subtotalBs: unknown }>;
}) {
  const rows = params.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #262C3A;"><strong>${Number(i.quantity)}×</strong> ${escapeHtml(i.productName)}</td><td style="padding:8px 0;border-bottom:1px solid #262C3A;text-align:right;font-family:monospace;">Bs. ${Number(i.subtotalBs).toFixed(2)}</td></tr>`
    )
    .join('');

  const body = `
    <p>Hola <strong>${escapeHtml(params.customerName)}</strong>, tu pago vía <strong>${escapeHtml(params.paymentMethod)}</strong> fue confirmado y tu comanda ya ingresó a Cocina &amp; Bar.</p>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;font-size:13px;">${rows}</table>
    <div style="background:#0B0D12;border:1px solid #00A0DF;border-radius:12px;padding:14px 16px;margin-top:14px;">
      <div style="font-size:12px;color:#94A3B8;">Total Confirmado</div>
      <div style="font-size:22px;font-weight:800;color:#00A0DF;font-family:monospace;">Bs. ${params.totalBs.toFixed(2)} <span style="font-size:13px;color:#94A3B8;">($ ${params.totalUsd.toFixed(2)} USD)</span></div>
    </div>
    <p style="margin-top:18px;"><a href="${escapeHtml(env.APP_URL)}/mis-pedidos" style="display:inline-block;padding:11px 20px;background:#F20574;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">Rastrear mi Pedido en Vivo</a></p>
  `;

  return sendOrStoreEmail({
    toEmail: params.toEmail,
    recipientRole: 'CLIENTE',
    templateType: 'ORDER_CONFIRMED',
    subject: `Pedido ${params.orderCode} Confirmado — Joy Ride Café® Sucre`,
    htmlBody: wrapJoyRideShell('RECIBO OFICIAL', `Pedido ${params.orderCode} en marcha`, body, '#00A0DF'),
    relatedOrderId: params.orderId,
  });
}

export async function sendOrderPackedPinEmail(params: {
  toEmail: string;
  customerName: string;
  orderId?: string;
  orderCode: string;
  deliveryPin: string;
  packageLabelCode: string;
}) {
  const body = `
    <p>¡Buenas noticias, <strong>${escapeHtml(params.customerName)}</strong>! Tu pedido <strong>${escapeHtml(params.orderCode)}</strong> acaba de sellarse en empaque (${escapeHtml(params.packageLabelCode)}).</p>
    <div style="background:#0B0D12;border:2px solid #F20574;border-radius:14px;padding:18px;text-align:center;margin:18px 0;">
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#F9A8D4;">Tu PIN de Entrega Segura</div>
      <div style="font-size:36px;font-weight:900;letter-spacing:0.25em;color:#F20574;font-family:monospace;margin-top:6px;">${escapeHtml(params.deliveryPin)}</div>
      <div style="font-size:12px;color:#94A3B8;margin-top:6px;">Dicta este código al repartidor únicamente al recibir tu pedido.</div>
    </div>
    <p><a href="${escapeHtml(env.APP_URL)}/mis-pedidos" style="display:inline-block;padding:11px 20px;background:#00A0DF;color:#0B0D12;text-decoration:none;border-radius:10px;font-weight:800;font-size:13px;">Ver Mapa &amp; Chat con Repartidor</a></p>
  `;

  return sendOrStoreEmail({
    toEmail: params.toEmail,
    recipientRole: 'CLIENTE',
    templateType: 'ORDER_PACKED_PIN',
    subject: `Tu Pedido ${params.orderCode} está Empacado · PIN ${params.deliveryPin}`,
    htmlBody: wrapJoyRideShell('EMPAQUE SELLADO', `Tu PIN de entrega: ${params.deliveryPin}`, body, '#F20574'),
    relatedOrderId: params.orderId,
  });
}

export async function sendReservationEmail(params: {
  toEmail: string;
  guestName: string;
  code: string;
  zone: string;
  date: string;
  timeSlot: string;
  partySize: number;
  includeSalsaClass: boolean;
  qrPassToken: string;
}) {
  const body = `
    <p>Hola <strong>${escapeHtml(params.guestName)}</strong>, tu mesa en <strong>Joy Ride Café® Sucre</strong> está reservada.</p>
    <div style="background:#0B0D12;border:1px solid #262C3A;border-radius:12px;padding:16px;margin:16px 0;">
      <div><strong>Código:</strong> <span style="color:#00A0DF;font-family:monospace;">${escapeHtml(params.code)}</span></div>
      <div><strong>Ambiente:</strong> ${escapeHtml(params.zone)}</div>
      <div><strong>Fecha y Hora:</strong> ${escapeHtml(params.date)} · ${escapeHtml(params.timeSlot)}</div>
      <div><strong>Personas:</strong> ${Number(params.partySize)}</div>
      <div><strong>Pase QR Puerta:</strong> <span style="font-family:monospace;color:#F20574;">${escapeHtml(params.qrPassToken)}</span></div>
      ${params.includeSalsaClass ? '<div style="margin-top:8px;color:#F9A8D4;font-weight:700;">&#10003; Incluye Clase Gratis de Salsa &amp; Bachata</div>' : ''}
    </div>
  `;

  return sendOrStoreEmail({
    toEmail: params.toEmail,
    recipientRole: 'CLIENTE',
    templateType: 'RESERVATION_CONFIRMED',
    subject: `Pase QR Reserva ${params.code} — Joy Ride Café® Sucre`,
    htmlBody: wrapJoyRideShell('PASE DE RESERVA', `Mesa confirmada (${params.code})`, body, '#00A0DF'),
  });
}

export async function sendManagerAlertEmail(params: {
  templateType:
    | 'MANAGER_NEW_ORDER'
    | 'LOW_STOCK_ALERT'
    | 'DEPOSIT_PENDING_ALERT'
    | 'RESERVATION_MANAGER_ALERT';
  subject: string;
  title: string;
  bodyHtml: string;
  relatedOrderId?: string;
  overrideEmail?: string;
}) {
  const managers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'CAJERO'] }, active: true },
    select: { email: true, role: true },
  });
  const target = managers.find((m) => m.role === 'ADMIN') || managers[0];
  const toEmail = params.overrideEmail || env.MANAGER_EMAIL || target?.email || 'victor2004612@gmail.com';

  return sendOrStoreEmail({
    toEmail,
    recipientRole: 'GERENTE',
    templateType: params.templateType,
    subject: params.subject,
    htmlBody: wrapJoyRideShell('GERENCIA / OPS', params.title, params.bodyHtml, '#F20574'),
    relatedOrderId: params.relatedOrderId,
  });
}

export async function sendNewsletterCampaign(params: {
  subject: string;
  headline: string;
  bodyText: string;
  promoCode?: string;
  testEmail?: string;
}) {
  let recipients: Set<string>;
  if (params.testEmail) {
    recipients = new Set<string>([params.testEmail]);
  } else {
    const subscribers = await prisma.newsletterSubscriber.findMany({ where: { active: true } });
    recipients = new Set<string>(subscribers.map((s) => s.email));
    if (recipients.size === 0) recipients.add('cliente@joyride.bo');
  }

  const safeBody = escapeHtml(params.bodyText).replace(/\n/g, '<br/>');
  const html = wrapJoyRideShell(
    'NOVEDADES & HAPPY HOUR',
    params.headline,
    `<p>${safeBody}</p>${
      params.promoCode
        ? `<div style="margin:16px 0;padding:12px;border:1px dashed #F20574;border-radius:10px;text-align:center;font-family:monospace;font-size:16px;color:#F20574;font-weight:800;">CÓDIGO: ${escapeHtml(params.promoCode)}</div>`
        : ''
    }<p><a href="${escapeHtml(env.APP_URL)}" style="display:inline-block;padding:11px 20px;background:#00A0DF;color:#0B0D12;text-decoration:none;border-radius:10px;font-weight:800;font-size:13px;">Explorar Carta y Promos</a></p>`,
    '#F20574'
  );

  const logs = [];
  for (const email of recipients) {
    logs.push(
      await sendOrStoreEmail({
        toEmail: email,
        recipientRole: 'SUSCRIPTOR',
        templateType: 'NEWSLETTER_PROMO',
        subject: params.subject,
        htmlBody: html,
      })
    );
  }
  return { count: logs.length, sentCount: logs.length, logs };
}

function buildManagerReservationBodyHtml(params: {
  code: string;
  guestName: string;
  guestPhone: string;
  zone: string;
  date: string;
  timeSlot: string;
  partySize: number;
  includeSalsaClass: boolean;
}) {
  const estRevenueBs = params.partySize * 55;
  const estRevenueUsd = Number((estRevenueBs / 6.96).toFixed(2));
  return `
    <p>Se confirmó una nueva reserva de mesa para <strong>${escapeHtml(params.guestName)}</strong> (${escapeHtml(params.guestPhone)}).</p>
    <div style="background:#0B0D12;border:1px solid #262C3A;border-radius:12px;padding:14px 16px;margin:12px 0;">
      <div><strong>Código:</strong> ${escapeHtml(params.code)} · <strong>Zona:</strong> ${escapeHtml(params.zone)}</div>
      <div><strong>Fecha y hora:</strong> ${escapeHtml(params.date)} a las ${escapeHtml(params.timeSlot)}</div>
      <div><strong>Personas:</strong> ${Number(params.partySize)}${params.includeSalsaClass ? ' (Con clase de Salsa y Bachata)' : ''}</div>
      <div style="margin-top:8px;color:#00A0DF;font-weight:800;">Ingreso estimado en barra/cocina: Bs. ${estRevenueBs.toFixed(2)} ($ ${estRevenueUsd.toFixed(2)} USD)</div>
    </div>
  `;
}

export async function sendManagerReservationAlertEmail(params: {
  code: string;
  guestName: string;
  guestPhone: string;
  zone: string;
  date: string;
  timeSlot: string;
  partySize: number;
  includeSalsaClass: boolean;
}) {
  return sendManagerAlertEmail({
    templateType: 'RESERVATION_MANAGER_ALERT',
    subject: `Nueva Reserva ${params.code} (${params.partySize} pers.) — ${params.zone}`,
    title: `Ingreso Programado: Reserva ${params.code}`,
    bodyHtml: buildManagerReservationBodyHtml(params),
  });
}

function buildEventAnnouncementHtml(event: {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  locationLabel: string;
  scheduleLabel: string;
  imageUrl: string;
}) {
  const bannerSrc = event.imageUrl.startsWith('http')
    ? event.imageUrl
    : `${env.APP_URL}${event.imageUrl}`;

  const body = `
    <div style="border-radius:14px;overflow:hidden;border:1px solid #262C3A;margin-bottom:16px;background:#0B0D12;">
      <img src="${escapeHtml(bannerSrc)}" alt="${escapeHtml(event.title)}" style="width:100%;max-height:220px;object-fit:cover;display:block;" />
    </div>
    <p style="font-size:16px;font-weight:700;color:#00A0DF;margin:0 0 8px;">${escapeHtml(event.subtitle)}</p>
    <p>${escapeHtml(event.description)}</p>
    <div style="background:#0B0D12;border:1px solid #262C3A;border-radius:12px;padding:14px 16px;margin:16px 0;font-size:13px;">
      <div><strong>Lugar:</strong> ${escapeHtml(event.locationLabel)}</div>
      <div><strong>Horario:</strong> ${escapeHtml(event.scheduleLabel)}</div>
    </div>
    <p><a href="${escapeHtml(env.APP_URL)}/?reservar=1" style="display:inline-block;padding:12px 22px;background:#F20574;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:800;font-size:13px;">Reservar Mesa en Joy Ride</a></p>
  `;

  return wrapJoyRideShell(event.badge, event.title, body, '#F20574');
}

export async function sendEventActivatedCampaign(event: {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  locationLabel: string;
  scheduleLabel: string;
  imageUrl: string;
}) {
  const subscribers = await prisma.newsletterSubscriber.findMany({ where: { active: true } });
  const recipients = new Set<string>(subscribers.map((s) => s.email));
  if (recipients.size === 0) recipients.add(env.MANAGER_EMAIL || 'victor2004612@gmail.com');

  const html = buildEventAnnouncementHtml(event);
  const logs = [];
  for (const email of recipients) {
    logs.push(
      await sendOrStoreEmail({
        toEmail: email,
        recipientRole: 'SUSCRIPTOR',
        templateType: 'EVENT_ANNOUNCEMENT',
        subject: `Nuevo Evento Joy Ride: ${event.title}`,
        htmlBody: html,
      })
    );
  }
  return { count: logs.length, logs };
}

export async function sendFullEmailTestSuite(targetEmail: string) {
  const email = targetEmail.toLowerCase().trim();
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { active: true },
    create: { email, name: 'Victor Villarroel', active: true },
  });

  const logs = [];
  logs.push(
    await sendOrderConfirmedEmail({
      toEmail: email,
      customerName: 'Victor Villarroel',
      orderCode: 'JR-SUITE-001',
      paymentMethod: 'Simple QR BNB',
      totalBs: 146,
      totalUsd: Number((146 / env.USD_EXCHANGE_RATE).toFixed(2)),
      items: [
        { productName: 'Super Pique a lo Macho', quantity: 1, subtotalBs: 78 },
        { productName: 'Chuflay Especial Singani (2x1)', quantity: 2, subtotalBs: 68 },
      ],
    })
  );

  logs.push(
    await sendOrderPackedPinEmail({
      toEmail: email,
      customerName: 'Victor Villarroel',
      orderCode: 'JR-SUITE-001',
      deliveryPin: '4829',
      packageLabelCode: 'JR-PKG-SUITE',
    })
  );

  logs.push(
    await sendReservationEmail({
      toEmail: email,
      guestName: 'Victor Villarroel',
      code: 'RES-SUITE-01',
      zone: 'PISTA_SALSA_BACHATA',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '20:30',
      partySize: 4,
      includeSalsaClass: true,
      qrPassToken: 'JR-PASS-SUITE-01',
    })
  );

  logs.push(
    await sendManagerAlertEmail({
      templateType: 'RESERVATION_MANAGER_ALERT',
      subject: 'Nueva Reserva RES-SUITE-01 (4 pers.) — PISTA_SALSA_BACHATA',
      title: 'Ingreso Programado: Reserva RES-SUITE-01',
      bodyHtml: buildManagerReservationBodyHtml({
        code: 'RES-SUITE-01',
        guestName: 'Victor Villarroel',
        guestPhone: '+591 76116875',
        zone: 'PISTA_SALSA_BACHATA',
        date: new Date().toISOString().slice(0, 10),
        timeSlot: '20:30',
        partySize: 4,
        includeSalsaClass: true,
      }),
      overrideEmail: email,
    })
  );

  logs.push(
    await sendOrStoreEmail({
      toEmail: email,
      recipientRole: 'SUSCRIPTOR',
      templateType: 'EVENT_ANNOUNCEMENT',
      subject: 'Nuevo Evento Joy Ride: Noches de Salsa, Bachata & Musica en Vivo',
      htmlBody: buildEventAnnouncementHtml({
        title: 'Noches de Salsa, Bachata & Musica en Vivo',
        subtitle: 'Clases gratuitas desde las 18:00 y fiesta social hasta las 02:30',
        description:
          'Baila bajo nuestra bola de espejos en Calle Nicolas Ortiz N 14 con barra 2x1 en Chuflays, Mojitos y cerveza artesanal.',
        badge: 'EVENTO JOY RIDE',
        locationLabel: 'Calle Nicolas Ortiz N 14 · Centro Historico',
        scheduleLabel: 'Mar / Jue / Sab · 18:00 - 02:30',
        imageUrl: '/images/evento-salsa.webp',
      }),
    })
  );

  const sentReal = logs.filter((l) => l.status === 'SENT').length;
  const storedPreview = logs.length - sentReal;

  return {
    count: logs.length,
    sentReal,
    storedPreview,
    deliveryMode: getEmailDeliveryMode(),
    logs,
  };
}
