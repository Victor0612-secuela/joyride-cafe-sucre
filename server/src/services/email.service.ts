import fs from 'node:fs';
import path from 'node:path';
import nodemailer, { type SendMailOptions } from 'nodemailer';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

export type EmailDeliveryMode = 'SMTP' | 'RESEND' | 'PREVIEW_ONLY';
export type EmailBannerKey = 'order' | 'salsa' | 'patio' | 'ops';

const BANNER_FILES: Record<EmailBannerKey, string> = {
  order: 'banner-order.jpg',
  salsa: 'banner-salsa.jpg',
  patio: 'banner-patio.jpg',
  ops: 'banner-ops.jpg',
};

const EMAIL_ASSETS_DIR =
  [
    path.resolve(__dirname, '../../assets/email'),
    path.resolve(__dirname, '../assets/email'),
    path.resolve(process.cwd(), 'assets/email'),
    path.resolve(process.cwd(), 'server/assets/email'),
  ].find((dir) => fs.existsSync(dir)) || path.resolve(process.cwd(), 'assets/email');

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

function getPublicAppUrl(): string {
  const base = (env.APP_URL || '').replace(/\/+$/, '');
  if (!base || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base)) {
    return 'https://joyride-cafe-sucre.onrender.com';
  }
  return base;
}

function encodeNonLatin1Entities(html: string): string {
  return html.replace(/[^\u0000-\u00ff]/g, (ch) => `&#${ch.codePointAt(0)};`);
}

function getPreviewBaseUrl(): string {
  return (env.APP_URL || 'http://localhost:4000').replace(/\/+$/, '');
}

async function resolveCidAttachments(params: {
  bannerKey: EmailBannerKey;
  customBannerMediaUrl?: string;
}): Promise<{
  attachments: SendMailOptions['attachments'];
  previewBannerPath: string;
}> {
  const attachments: NonNullable<SendMailOptions['attachments']> = [];
  const logoPath = path.join(EMAIL_ASSETS_DIR, 'logo-joyride.png');
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'logo-joyride.png',
      path: logoPath,
      cid: 'joyride-logo',
      contentDisposition: 'inline',
    });
  }

  const defaultBannerFile = BANNER_FILES[params.bannerKey] || BANNER_FILES.order;
  let previewBannerPath = `/email-assets/${defaultBannerFile}`;
  let attachedCustom = false;

  if (params.customBannerMediaUrl?.startsWith('/api/media/')) {
    const assetId = params.customBannerMediaUrl.replace('/api/media/', '').trim();
    const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } }).catch(() => null);
    if (asset && (asset.mimeType === 'image/jpeg' || asset.mimeType === 'image/png')) {
      const ext = asset.mimeType === 'image/png' ? 'png' : 'jpg';
      attachments.push({
        filename: `event-banner.${ext}`,
        content: Buffer.from(asset.data),
        contentType: asset.mimeType,
        cid: 'joyride-banner',
        contentDisposition: 'inline',
      });
      previewBannerPath = params.customBannerMediaUrl;
      attachedCustom = true;
    }
  }

  if (!attachedCustom) {
    const bannerPath = path.join(EMAIL_ASSETS_DIR, defaultBannerFile);
    if (fs.existsSync(bannerPath)) {
      attachments.push({
        filename: defaultBannerFile,
        path: bannerPath,
        cid: 'joyride-banner',
        contentDisposition: 'inline',
      });
    }
  }

  return { attachments, previewBannerPath };
}

async function sendOrStoreEmail(params: {
  toEmail: string;
  recipientRole: string;
  templateType: string;
  subject: string;
  cidHtmlBody: string;
  bannerKey: EmailBannerKey;
  customBannerMediaUrl?: string;
  relatedOrderId?: string;
}) {
  let status = 'STORED_PREVIEW';
  const { attachments, previewBannerPath } = await resolveCidAttachments({
    bannerKey: params.bannerKey,
    customBannerMediaUrl: params.customBannerMediaUrl,
  });

  const previewBase = getPreviewBaseUrl();
  const publicBase = getPublicAppUrl();

  const previewHtmlBody = encodeNonLatin1Entities(
    params.cidHtmlBody
      .replace(/cid:joyride-logo/g, `${previewBase}/email-assets/logo-joyride.png`)
      .replace(/cid:joyride-banner/g, `${previewBase}${previewBannerPath}`)
  );

  const publicHtmlBody = encodeNonLatin1Entities(
    params.cidHtmlBody
      .replace(/cid:joyride-logo/g, `${publicBase}/email-assets/logo-joyride.png`)
      .replace(/cid:joyride-banner/g, `${publicBase}${previewBannerPath}`)
  );

  const safeSubject = params.subject.replace(/[^\u0000-\u00ff\u2013\u2014]/g, '');

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
        html: params.cidHtmlBody,
        attachments,
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
          html: publicHtmlBody,
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
      subject: safeSubject,
      htmlBody: previewHtmlBody,
      status,
      relatedOrderId: params.relatedOrderId,
    },
  });
}

function wrapJoyRideShell(params: {
  badge: string;
  heading: string;
  bodyHtml: string;
  accent?: string;
  showBanner?: boolean;
  bannerAlt?: string;
}): string {
  const accent = params.accent || '#00A0DF';
  const badgeText = accent === '#F20574' ? '#FFFFFF' : '#0B0D12';
  const publicBase = getPublicAppUrl();
  const showBanner = params.showBanner !== false;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:24px 14px;background-color:#07090D;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background-color:#111622;border:1px solid #262E40;border-radius:22px;overflow:hidden;">
    <tr>
      <td height="5" style="height:5px;line-height:5px;font-size:0;background:linear-gradient(90deg,#00A0DF 0%,#7B2CBF 52%,#F20574 100%);">&nbsp;</td>
    </tr>
    <tr>
      <td style="padding:24px 28px 20px;background:linear-gradient(145deg,#0B0E17 0%,#151B2B 100%);border-bottom:1px solid #262E40;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="width:66px;vertical-align:middle;">
              <img src="cid:joyride-logo" alt="Joy Ride Café Sucre" width="54" height="54" style="width:54px;height:54px;border-radius:50%;border:2px solid ${accent};display:block;" />
            </td>
            <td style="vertical-align:middle;padding-left:10px;">
              <div style="font-size:17px;font-weight:900;letter-spacing:0.04em;color:#F8FAFC;line-height:1.15;">JOY RIDE CAFÉ<span style="color:#00A0DF;">®</span></div>
              <div style="font-size:11px;font-weight:700;color:#94A3B8;margin-top:3px;">Probably the Best Bar in Town®</div>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:${accent};color:${badgeText};font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(params.badge)}</span>
              <div style="margin-top:6px;font-size:10px;font-weight:700;color:#64748B;font-family:monospace;">SUCRE · EST. 2001</div>
            </td>
          </tr>
        </table>
        <h1 style="margin:20px 0 6px;font-size:24px;line-height:1.25;color:#F8FAFC;font-weight:800;letter-spacing:-0.01em;">${escapeHtml(params.heading)}</h1>
        <p style="margin:0;font-size:13px;color:#94A3B8;">Calle Nicolás Ortiz N° 14 · Frente a la Catedral Metropolitana</p>
      </td>
    </tr>
    ${
      showBanner
        ? `<tr>
      <td style="padding:18px 28px 0;">
        <div style="border-radius:16px;overflow:hidden;border:1px solid #262E40;background-color:#0B0D12;">
          <img src="cid:joyride-banner" alt="${escapeHtml(params.bannerAlt || params.heading)}" width="564" style="width:100%;max-height:210px;height:auto;object-fit:cover;display:block;border:0;" />
        </div>
      </td>
    </tr>`
        : ''
    }
    <tr>
      <td style="padding:22px 28px 26px;font-size:15px;line-height:1.65;color:#E2E8F0;">
        ${params.bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;background-color:#090C12;border-top:1px solid #262E40;font-size:12px;color:#94A3B8;text-align:center;">
        <div style="font-weight:800;color:#00A0DF;margin-bottom:6px;letter-spacing:0.02em;">&ldquo;No solo para gringos — Probably the best bar in town&rdquo;</div>
        <div style="margin-bottom:10px;">Calle Nicolás Ortiz N° 14 · Sucre, Bolivia · WhatsApp +591 76116875</div>
        <div>
          <a href="${escapeHtml(publicBase)}/carta" style="color:#00A0DF;text-decoration:none;font-weight:700;margin:0 8px;">Explorar Carta</a>
          <span style="color:#334155;">·</span>
          <a href="${escapeHtml(publicBase)}/?reservar=1" style="color:#F20574;text-decoration:none;font-weight:700;margin:0 8px;">Reservar Mesa</a>
          <span style="color:#334155;">·</span>
          <a href="${escapeHtml(publicBase)}/mapa-sucre" style="color:#34D399;text-decoration:none;font-weight:700;margin:0 8px;">Mapa Turístico</a>
        </div>
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
  const publicBase = getPublicAppUrl();
  const rows = params.items
    .map(
      (i) =>
        `<tr><td style="padding:9px 0;border-bottom:1px solid #262E40;color:#F8FAFC;"><strong>${Number(i.quantity)}×</strong> ${escapeHtml(i.productName)}</td><td style="padding:9px 0;border-bottom:1px solid #262E40;text-align:right;font-family:monospace;color:#CBD5E1;">Bs. ${Number(i.subtotalBs).toFixed(2)}</td></tr>`
    )
    .join('');

  const body = `
    <p style="margin-top:0;">Hola <strong style="color:#FFFFFF;">${escapeHtml(params.customerName)}</strong>, tu pago vía <strong style="color:#00A0DF;">${escapeHtml(params.paymentMethod)}</strong> fue confirmado y tu comanda ya ingresó a Cocina &amp; Bar.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:14px 0;font-size:13px;">${rows}</table>
    <div style="background-color:#0B0E17;border:1px solid #00A0DF;border-radius:14px;padding:15px 18px;margin-top:14px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;">Total Confirmado</div>
      <div style="font-size:24px;font-weight:900;color:#00A0DF;font-family:monospace;margin-top:4px;">Bs. ${params.totalBs.toFixed(2)} <span style="font-size:13px;color:#94A3B8;font-weight:600;">($ ${params.totalUsd.toFixed(2)} USD)</span></div>
    </div>
    <p style="margin:20px 0 4px;"><a href="${escapeHtml(publicBase)}/mis-pedidos" style="display:inline-block;padding:12px 22px;background-color:#F20574;color:#FFFFFF;text-decoration:none;border-radius:12px;font-weight:800;font-size:13px;">Rastrear mi Pedido en Vivo →</a></p>
  `;

  return sendOrStoreEmail({
    toEmail: params.toEmail,
    recipientRole: 'CLIENTE',
    templateType: 'ORDER_CONFIRMED',
    subject: `Pedido ${params.orderCode} Confirmado — Joy Ride Café® Sucre`,
    cidHtmlBody: wrapJoyRideShell({
      badge: 'RECIBO OFICIAL',
      heading: `Pedido ${params.orderCode} en marcha`,
      bodyHtml: body,
      accent: '#00A0DF',
      bannerAlt: 'Barra y cocina Joy Ride Café Sucre',
    }),
    bannerKey: 'order',
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
  const publicBase = getPublicAppUrl();
  const body = `
    <p style="margin-top:0;">¡Buenas noticias, <strong style="color:#FFFFFF;">${escapeHtml(params.customerName)}</strong>! Tu pedido <strong style="color:#00A0DF;">${escapeHtml(params.orderCode)}</strong> acaba de sellarse en empaque (<span style="font-family:monospace;color:#CBD5E1;">${escapeHtml(params.packageLabelCode)}</span>).</p>
    <div style="background-color:#0B0E17;border:2px solid #F20574;border-radius:16px;padding:20px;text-align:center;margin:18px 0;">
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#F9A8D4;font-weight:800;">Tu PIN de Entrega Segura</div>
      <div style="font-size:40px;font-weight:900;letter-spacing:0.26em;color:#F20574;font-family:monospace;margin:8px 0 6px;">${escapeHtml(params.deliveryPin)}</div>
      <div style="font-size:12px;color:#94A3B8;">Dicta este código de 4 dígitos al repartidor o mesero únicamente al recibir tu pedido.</div>
    </div>
    <p style="margin:18px 0 4px;"><a href="${escapeHtml(publicBase)}/mis-pedidos" style="display:inline-block;padding:12px 22px;background-color:#00A0DF;color:#0B0D12;text-decoration:none;border-radius:12px;font-weight:800;font-size:13px;">Ver Mapa &amp; Chat en Vivo →</a></p>
  `;

  return sendOrStoreEmail({
    toEmail: params.toEmail,
    recipientRole: 'CLIENTE',
    templateType: 'ORDER_PACKED_PIN',
    subject: `Tu Pedido ${params.orderCode} está Empacado · PIN ${params.deliveryPin}`,
    cidHtmlBody: wrapJoyRideShell({
      badge: 'EMPAQUE SELLADO',
      heading: `Tu PIN de entrega: ${params.deliveryPin}`,
      bodyHtml: body,
      accent: '#F20574',
      bannerAlt: 'Pedido listo en Joy Ride Café',
    }),
    bannerKey: 'order',
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
  const publicBase = getPublicAppUrl();
  const body = `
    <p style="margin-top:0;">Hola <strong style="color:#FFFFFF;">${escapeHtml(params.guestName)}</strong>, tu mesa en <strong style="color:#00A0DF;">Joy Ride Café® Sucre</strong> está confirmada.</p>
    <div style="background-color:#0B0E17;border:1px solid #262E40;border-radius:14px;padding:18px;margin:16px 0;font-size:14px;line-height:1.8;">
      <div><strong>Código de Reserva:</strong> <span style="color:#00A0DF;font-family:monospace;font-weight:800;">${escapeHtml(params.code)}</span></div>
      <div><strong>Ambiente:</strong> ${escapeHtml(params.zone)}</div>
      <div><strong>Fecha y Hora:</strong> ${escapeHtml(params.date)} · ${escapeHtml(params.timeSlot)}</div>
      <div><strong>Personas:</strong> ${Number(params.partySize)}</div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #262E40;">
        <strong>Pase QR Puerta:</strong>
        <span style="display:inline-block;margin-left:6px;padding:3px 10px;border-radius:8px;background-color:#F20574;color:#FFFFFF;font-family:monospace;font-weight:800;">${escapeHtml(params.qrPassToken)}</span>
      </div>
      ${params.includeSalsaClass ? '<div style="margin-top:10px;color:#F9A8D4;font-weight:700;">&#10003; Incluye Clase Gratis de Salsa &amp; Bachata</div>' : ''}
    </div>
    <p style="margin:18px 0 4px;"><a href="${escapeHtml(publicBase)}/mis-pedidos" style="display:inline-block;padding:12px 22px;background-color:#00A0DF;color:#0B0D12;text-decoration:none;border-radius:12px;font-weight:800;font-size:13px;">Ver mi Pase QR &amp; Reservas →</a></p>
  `;

  return sendOrStoreEmail({
    toEmail: params.toEmail,
    recipientRole: 'CLIENTE',
    templateType: 'RESERVATION_CONFIRMED',
    subject: `Pase QR Reserva ${params.code} — Joy Ride Café® Sucre`,
    cidHtmlBody: wrapJoyRideShell({
      badge: 'PASE DE RESERVA',
      heading: `Mesa confirmada (${params.code})`,
      bodyHtml: body,
      accent: '#00A0DF',
      bannerAlt: 'Noches de Salsa y Patio Colonial Joy Ride',
    }),
    bannerKey: 'salsa',
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
    cidHtmlBody: wrapJoyRideShell({
      badge: 'GERENCIA / OPS',
      heading: params.title,
      bodyHtml: params.bodyHtml,
      accent: '#F20574',
      bannerAlt: 'Operaciones Joy Ride Café Sucre',
    }),
    bannerKey: 'ops',
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
  const publicBase = getPublicAppUrl();
  let recipients: Set<string>;
  if (params.testEmail) {
    recipients = new Set<string>([params.testEmail]);
  } else {
    const subscribers = await prisma.newsletterSubscriber.findMany({ where: { active: true } });
    recipients = new Set<string>(subscribers.map((s) => s.email));
    if (recipients.size === 0) recipients.add('cliente@joyride.bo');
  }

  const safeBody = escapeHtml(params.bodyText).replace(/\n/g, '<br/>');
  const html = wrapJoyRideShell({
    badge: 'NOVEDADES & HAPPY HOUR',
    heading: params.headline,
    bodyHtml: `<p style="margin-top:0;">${safeBody}</p>${
      params.promoCode
        ? `<div style="margin:18px 0;padding:14px;background-color:#0B0E17;border:1px dashed #F20574;border-radius:12px;text-align:center;font-family:monospace;font-size:17px;color:#F20574;font-weight:900;letter-spacing:0.12em;">CÓDIGO: ${escapeHtml(params.promoCode)}</div>`
        : ''
    }<p style="margin:18px 0 4px;"><a href="${escapeHtml(publicBase)}/carta" style="display:inline-block;padding:12px 22px;background-color:#00A0DF;color:#0B0D12;text-decoration:none;border-radius:12px;font-weight:800;font-size:13px;">Explorar Carta y Promos →</a></p>`,
    accent: '#F20574',
    bannerAlt: 'Patio Colonial Joy Ride Café Sucre',
  });

  const logs = [];
  for (const email of recipients) {
    logs.push(
      await sendOrStoreEmail({
        toEmail: email,
        recipientRole: 'SUSCRIPTOR',
        templateType: 'NEWSLETTER_PROMO',
        subject: params.subject,
        cidHtmlBody: html,
        bannerKey: 'patio',
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
    <p style="margin-top:0;">Se confirmó una nueva reserva de mesa para <strong style="color:#FFFFFF;">${escapeHtml(params.guestName)}</strong> (${escapeHtml(params.guestPhone)}).</p>
    <div style="background-color:#0B0E17;border:1px solid #262E40;border-radius:14px;padding:16px 18px;margin:14px 0;font-size:14px;line-height:1.8;">
      <div><strong>Código:</strong> <span style="color:#00A0DF;font-family:monospace;">${escapeHtml(params.code)}</span> · <strong>Zona:</strong> ${escapeHtml(params.zone)}</div>
      <div><strong>Fecha y hora:</strong> ${escapeHtml(params.date)} a las ${escapeHtml(params.timeSlot)}</div>
      <div><strong>Personas:</strong> ${Number(params.partySize)}${params.includeSalsaClass ? ' (Con clase de Salsa y Bachata)' : ''}</div>
      <div style="margin-top:8px;color:#00A0DF;font-weight:800;">Consumo estimado en barra/cocina: Bs. ${estRevenueBs.toFixed(2)} ($ ${estRevenueUsd.toFixed(2)} USD)</div>
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
}) {
  const publicBase = getPublicAppUrl();
  const body = `
    <p style="font-size:16px;font-weight:800;color:#00A0DF;margin:0 0 10px;">${escapeHtml(event.subtitle)}</p>
    <p style="margin:0 0 14px;">${escapeHtml(event.description)}</p>
    <div style="background-color:#0B0E17;border:1px solid #262E40;border-radius:14px;padding:15px 18px;margin:16px 0;font-size:13px;line-height:1.8;">
      <div><strong>Lugar:</strong> ${escapeHtml(event.locationLabel)}</div>
      <div><strong>Horario:</strong> ${escapeHtml(event.scheduleLabel)}</div>
    </div>
    <p style="margin:18px 0 4px;"><a href="${escapeHtml(publicBase)}/?reservar=1" style="display:inline-block;padding:12px 24px;background-color:#F20574;color:#FFFFFF;text-decoration:none;border-radius:12px;font-weight:800;font-size:13px;">Reservar Mesa en Joy Ride →</a></p>
  `;

  return wrapJoyRideShell({
    badge: event.badge,
    heading: event.title,
    bodyHtml: body,
    accent: '#F20574',
    bannerAlt: event.title,
  });
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
        cidHtmlBody: html,
        bannerKey: 'salsa',
        customBannerMediaUrl: event.imageUrl,
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
      cidHtmlBody: buildEventAnnouncementHtml({
        title: 'Noches de Salsa, Bachata & Musica en Vivo',
        subtitle: 'Clases gratuitas desde las 18:00 y fiesta social hasta las 02:30',
        description:
          'Baila bajo nuestra bola de espejos en Calle Nicolas Ortiz N 14 con barra 2x1 en Chuflays, Mojitos y cerveza artesanal.',
        badge: 'EVENTO JOY RIDE',
        locationLabel: 'Calle Nicolas Ortiz N 14 · Centro Historico',
        scheduleLabel: 'Mar / Jue / Sab · 18:00 - 02:30',
      }),
      bannerKey: 'salsa',
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
