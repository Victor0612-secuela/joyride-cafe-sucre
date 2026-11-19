-- ============================================================================
-- JOY RIDE CAFÉ® SUCRE — Script SQL DDL PostgreSQL (Ingeniería Inversa / StarUML)
-- Generado desde: server/prisma/schema.prisma (17 tablas relacionales + 9 enums)
-- ============================================================================

CREATE TYPE "Role" AS ENUM ('CLIENTE', 'CAJERO', 'EMPAQUETADOR', 'REPARTIDOR', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDIENTE_PAGO', 'PAGO_EN_REVISION', 'PAGO_CONFIRMADO',
  'EN_PREPARACION', 'EMPACADO', 'EN_CAMINO', 'ENTREGADO',
  'CANCELADO', 'RECHAZADO'
);
CREATE TYPE "PaymentMethod" AS ENUM ('QR', 'DEPOSITO_BANCARIO', 'PAYPAL', 'STRIPE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'EN_REVISION', 'COMPLETADO', 'RECHAZADO', 'EXPIRADO');
CREATE TYPE "DeliveryType" AS ENUM ('DELIVERY', 'RECOGER_LOCAL', 'CONSUMO_LOCAL');
CREATE TYPE "StockMovementType" AS ENUM ('ENTRADA_INICIAL', 'RESERVA_PEDIDO', 'VENTA_CONFIRMADA', 'LIBERACION_STOCK', 'AJUSTE_ADMIN');
CREATE TYPE "ReservationZone" AS ENUM ('PATIO_COLONIAL', 'MEZZANINE_TERRAZA', 'PANTALLA_GIGANTE', 'PISTA_SALSA_BACHATA');
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMADA', 'CHECK_IN', 'CANCELADA');
CREATE TYPE "ChatChannelType" AS ENUM ('ORDER_DELIVERY', 'STAFF_OPS');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CLIENTE',
  "phone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Product" (
  "id" TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "precioBs" DECIMAL(10, 2) NOT NULL,
  "precioUsd" DECIMAL(10, 2) NOT NULL,
  "stockDisponible" INTEGER NOT NULL DEFAULT 0,
  "stockReservado" INTEGER NOT NULL DEFAULT 0,
  "stockMinimoAlerta" INTEGER NOT NULL DEFAULT 5,
  "esVegano" BOOLEAN NOT NULL DEFAULT FALSE,
  "esPicante" BOOLEAN NOT NULL DEFAULT FALSE,
  "esDestacado" BOOLEAN NOT NULL DEFAULT FALSE,
  "enHappyHour" BOOLEAN NOT NULL DEFAULT FALSE,
  "tiempoPreparacionMin" INTEGER NOT NULL DEFAULT 15,
  "imageUrl" TEXT NOT NULL,
  "maridajeSlug" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Product_categoryId_active_idx" ON "Product"("categoryId", "active");
CREATE INDEX "Product_enHappyHour_active_idx" ON "Product"("enHappyHour", "active");
CREATE INDEX "Product_esDestacado_active_idx" ON "Product"("esDestacado", "active");

CREATE TABLE "Order" (
  "id" TEXT PRIMARY KEY,
  "orderCode" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDIENTE_PAGO',
  "deliveryType" "DeliveryType" NOT NULL DEFAULT 'DELIVERY',
  "subtotalBs" DECIMAL(10, 2) NOT NULL,
  "discountBs" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "totalBs" DECIMAL(10, 2) NOT NULL,
  "totalUsd" DECIMAL(10, 2) NOT NULL,
  "deliveryAddress" TEXT,
  "deliveryReference" TEXT,
  "destLat" DOUBLE PRECISION DEFAULT -19.0442,
  "destLng" DOUBLE PRECISION DEFAULT -65.2618,
  "phoneContact" TEXT NOT NULL,
  "notes" TEXT,
  "splitCount" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

CREATE TABLE "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "productName" TEXT NOT NULL,
  "unitPriceBs" DECIMAL(10, 2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "subtotalBs" DECIMAL(10, 2) NOT NULL
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
  "amountBs" DECIMAL(10, 2) NOT NULL,
  "amountUsd" DECIMAL(10, 2) NOT NULL,
  "qrToken" TEXT UNIQUE,
  "qrSignature" TEXT,
  "bankName" TEXT,
  "referenceNumber" TEXT,
  "comprobanteUrl" TEXT,
  "paypalOrderId" TEXT UNIQUE,
  "paypalCaptureId" TEXT,
  "paypalPayerEmail" TEXT,
  "stripePaymentIntentId" TEXT UNIQUE,
  "cardBrand" TEXT,
  "cardLast4" TEXT,
  "reviewNotes" TEXT,
  "verificadoPorId" TEXT REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Payment_status_method_idx" ON "Payment"("status", "method");

CREATE TABLE "PackagingChecklist" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "empaquetadorId" TEXT REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "items" JSONB NOT NULL,
  "sealCode" TEXT,
  "allVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "notes" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3)
);

CREATE TABLE "DeliveryTracking" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "repartidorId" TEXT REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "deliveryAddress" TEXT NOT NULL,
  "deliveryReference" TEXT,
  "destLat" DOUBLE PRECISION DEFAULT -19.0442,
  "destLng" DOUBLE PRECISION DEFAULT -65.2618,
  "riderLat" DOUBLE PRECISION DEFAULT -19.04804,
  "riderLng" DOUBLE PRECISION DEFAULT -65.25973,
  "etaMinutes" INTEGER DEFAULT 14,
  "deliveryPin" TEXT NOT NULL,
  "packageLabelCode" TEXT NOT NULL,
  "pickedUpAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "receiverName" TEXT,
  "deliveryNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "DeliveryTracking_repartidorId_idx" ON "DeliveryTracking"("repartidorId");

CREATE TABLE "OrderStatusHistory" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "actorId" TEXT REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "actorName" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

CREATE TABLE "StockMovement" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "orderId" TEXT REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "actorId" TEXT REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "type" "StockMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "previousStock" INTEGER NOT NULL,
  "newStock" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");

CREATE TABLE "Reservation" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "userId" TEXT REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT NOT NULL,
  "guestPhone" TEXT NOT NULL,
  "zone" "ReservationZone" NOT NULL,
  "date" TEXT NOT NULL,
  "timeSlot" TEXT NOT NULL,
  "partySize" INTEGER NOT NULL,
  "includeSalsaClass" BOOLEAN NOT NULL DEFAULT FALSE,
  "specialNotes" TEXT,
  "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMADA',
  "qrPassToken" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Reservation_date_zone_status_idx" ON "Reservation"("date", "zone", "status");
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

CREATE TABLE "ChatMessage" (
  "id" TEXT PRIMARY KEY,
  "channelType" "ChatChannelType" NOT NULL,
  "orderId" TEXT REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "senderName" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ChatMessage_channelType_orderId_createdAt_idx" ON "ChatMessage"("channelType", "orderId", "createdAt");

CREATE TABLE "Promotion" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "subtitle" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "badgeText" TEXT NOT NULL,
  "scheduleText" TEXT NOT NULL,
  "discountPercent" INTEGER NOT NULL DEFAULT 0,
  "imageUrl" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Event" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "subtitle" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "badge" TEXT NOT NULL DEFAULT 'EVENTO JOY RIDE',
  "accent" TEXT NOT NULL DEFAULT 'magenta',
  "locationLabel" TEXT NOT NULL DEFAULT 'Calle Nicolas Ortiz N 14',
  "scheduleLabel" TEXT NOT NULL DEFAULT '18:00 - 02:30',
  "imageUrl" TEXT NOT NULL,
  "imagesJson" JSONB,
  "videoUrl" TEXT,
  "spotId" TEXT NOT NULL DEFAULT 'joyride-hq',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isFeatured" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Event_isActive_sortOrder_idx" ON "Event"("isActive", "sortOrder");

CREATE TABLE "Review" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "authorName" TEXT NOT NULL,
  "authorOrigin" TEXT NOT NULL DEFAULT 'Sucre, Bolivia',
  "verifiedVia" TEXT NOT NULL DEFAULT 'CUENTA_JOYRIDE',
  "rating" INTEGER NOT NULL DEFAULT 5,
  "comment" TEXT NOT NULL,
  "photoUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

CREATE TABLE "NewsletterSubscriber" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EmailLog" (
  "id" TEXT PRIMARY KEY,
  "toEmail" TEXT NOT NULL,
  "recipientRole" TEXT NOT NULL,
  "templateType" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "htmlBody" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'STORED_PREVIEW',
  "previewUrl" TEXT,
  "relatedOrderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
CREATE INDEX "EmailLog_templateType_idx" ON "EmailLog"("templateType");
