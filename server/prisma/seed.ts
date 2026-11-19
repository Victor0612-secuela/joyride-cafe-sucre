import {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ReservationStatus,
  ReservationZone,
  Role,
  StockMovementType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const prisma = new PrismaClient();
const EXCHANGE_RATE = Number(process.env.USD_EXCHANGE_RATE || 6.96);

function toUsd(bs: number): number {
  return Number((bs / EXCHANGE_RATE).toFixed(2));
}

function makeDemoReceiptSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="320" viewBox="0 0 540 320">
  <rect width="540" height="320" rx="16" fill="#F8FAFC"/>
  <rect x="0" y="0" width="540" height="64" rx="16" fill="#004B87"/>
  <text x="24" y="40" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="20" font-weight="bold">BANCO NACIONAL DE BOLIVIA - COMPROBANTE</text>
  <text x="24" y="102" fill="#0F172A" font-family="monospace" font-size="14">NRO. OPERACION: BNB-9948271-SUCRE</text>
  <text x="24" y="130" fill="#0F172A" font-family="monospace" font-size="14">FECHA: Hoy 19:42 · CANAL: BNB MOVIL</text>
  <text x="24" y="158" fill="#0F172A" font-family="monospace" font-size="14">ORIGEN: CAMILA MENDOZA (CTA 1000-448210)</text>
  <text x="24" y="186" fill="#0F172A" font-family="monospace" font-size="14">DESTINO: JOY RIDE CAFE SUCRE SRL</text>
  <line x1="24" y1="208" x2="516" y2="208" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="24" y="246" fill="#0082B8" font-family="Arial,sans-serif" font-size="26" font-weight="bold">MONTO: Bs. 122.00</text>
  <rect x="350" y="220" width="164" height="40" rx="8" fill="#10B981"/>
  <text x="432" y="246" text-anchor="middle" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="14" font-weight="bold">TRANSFERENCIA OK</text>
  <text x="24" y="294" fill="#64748B" font-family="monospace" font-size="12">GLOSA: PEDIDO JOY RIDE CALLE NICOLAS ORTIZ 14</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function main() {
  console.log('[SEED] Seeding Joy Ride Cafe Sucre database...');

  const passwordHash = await bcrypt.hash('JoyRide2026!', 10);

  const usersSeed = [
    { name: 'Camila Mendoza', email: 'cliente@joyride.bo', role: Role.CLIENTE, phone: '+591 71123456' },
    { name: 'Diego Rojas', email: 'cajero@joyride.bo', role: Role.CAJERO, phone: '+591 72234567' },
    { name: 'Mateo Quispe', email: 'empaque@joyride.bo', role: Role.EMPAQUETADOR, phone: '+591 73345678' },
    { name: 'Luciano Vargas', email: 'repartidor@joyride.bo', role: Role.REPARTIDOR, phone: '+591 74456789' },
    { name: 'Valeria Arce', email: 'admin@joyride.bo', role: Role.ADMIN, phone: '+591 75769070' },
  ];

  const users: Record<string, { id: string; name: string; role: Role }> = {};
  for (const u of usersSeed) {
    const saved = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, phone: u.phone, active: true },
      create: { ...u, passwordHash, active: true },
    });
    users[u.email] = { id: saved.id, name: saved.name, role: saved.role };
  }

  const categoriesSeed = [
    {
      slug: 'platos-fondo',
      name: 'Platos de Fondo & Nacionales',
      description: 'Recetas tradicionales bolivianas e internacionales preparadas al momento en Sucre.',
      sortOrder: 1,
    },
    {
      slug: 'burgers-picadas',
      name: 'Burgers & Picadas de Bar',
      description: 'Hamburguesas de altura, nachos supremos, alitas y tablas para compartir entre rondas.',
      sortOrder: 2,
    },
    {
      slug: 'bar-cocteles',
      name: 'Bar, Coctelería & Cervezas',
      description: 'Singani boliviano, cocteles clásicos, jarras de sangría y cervezas bien frías.',
      sortOrder: 3,
    },
    {
      slug: 'cafeteria-postres',
      name: 'Cafetería & Postres',
      description: 'Café boliviano de altura, desayunos icónicos y brownies 2x1 para la tarde en plaza.',
      sortOrder: 4,
    },
    {
      slug: 'combos-eventos',
      name: 'Combos & Eventos Especiales',
      description: 'Paquetes pensados para noches de Salsa & Bachata, partidos y celebraciones grupales.',
      sortOrder: 5,
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesSeed) {
    const saved = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: c,
    });
    categories[c.slug] = saved.id;
  }

  const productsSeed = [
    // 1. Platos de Fondo & Nacionales
    {
      categorySlug: 'platos-fondo',
      slug: 'super-pique-macho',
      name: 'Super Pique a lo Macho',
      description: 'Clásico monumental de Joy Ride: lomo salteado, salchicha vienesa, locoto fresco, huevo duro, tomate y papas rústicas en salsa de cerveza.',
      precioBs: 78,
      stockDisponible: 18,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: true,
      esDestacado: true,
      enHappyHour: false,
      tiempoPreparacionMin: 22,
      imageUrl: '/images/dish-pique-macho.webp',
      maridajeSlug: 'pack-happy-hour-cerveza',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'picante-mixto-joyride',
      name: 'Picante Mixto Joy Ride',
      description: 'Pollo y res en ají colorado chuquisaqueño equilibrado, acompañado de papas blancas, arroz y chuño phuti al estilo Sucre.',
      precioBs: 68,
      stockDisponible: 14,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: true,
      esDestacado: true,
      enHappyHour: false,
      tiempoPreparacionMin: 20,
      imageUrl: '/images/carousel-4.webp',
      maridajeSlug: 'chuflay-singani',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'filete-trucha-quinua',
      name: 'Filete de Trucha con Quinua Real',
      description: 'Filete dorado de trucha andina sobre quinua real orgánica salteada con mantequilla de hierbas y vegetales de estación.',
      precioBs: 64,
      stockDisponible: 3,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 18,
      imageUrl: '/images/dish-trucha-quinua.webp',
      maridajeSlug: 'mojito-maracuya',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'charque-de-res',
      name: 'Charque de Res Chuquisaqueño',
      description: 'Charque deshilachado crujiente servido con mote blanco, papa cocida, queso criollo y llajwa recién molida en batán.',
      precioBs: 66,
      stockDisponible: 12,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: true,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 20,
      imageUrl: '/images/dish-charque.webp',
      maridajeSlug: 'chuflay-singani',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'plato-paceno-tradicion',
      name: 'Plato Paceño Tradicional',
      description: 'Choclo tierno, habas frescas, papa harinosa, queso dorado a la plancha y salsa criolla tradicional boliviana.',
      precioBs: 58,
      stockDisponible: 10,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 16,
      imageUrl: '/images/dish-plato-paceno.webp',
      maridajeSlug: 'pack-happy-hour-cerveza',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'bife-a-la-crema',
      name: 'Bife a la Crema & Pimienta Negra',
      description: 'Corte jugoso a la parrilla bañado en reducción cremosa de pimienta negra y champiñones con guarnición de papas.',
      precioBs: 72,
      stockDisponible: 11,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 22,
      imageUrl: '/images/dish-bife-crema.webp',
      maridajeSlug: 'negroni-clasico',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'pasta-bolognesa-casa',
      name: 'Pasta Boloñesa de la Casa',
      description: 'Tallarines al dente con ragú lento de res, tomates maduros de valle, albahaca fresca y queso parmesano rallado.',
      precioBs: 52,
      stockDisponible: 16,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 16,
      imageUrl: '/images/dish-pasta-bolognesa.webp',
      maridajeSlug: 'negroni-clasico',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'pasta-hongos-andinos',
      name: 'Pasta Cremosa con Hongos',
      description: 'Fettuccine salteado con hongos portobello, ajo rostizado, crema ligera y perejil fresco.',
      precioBs: 54,
      stockDisponible: 11,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 16,
      imageUrl: '/images/dish-pasta-hongos.webp',
      maridajeSlug: 'cafe-boliviano-altura',
    },
    {
      categorySlug: 'platos-fondo',
      slug: 'bowl-vegano-andino',
      name: 'Bowl Vegano Andino & Quinua',
      description: 'Quinua tricolor, palta fresca, garbanzos especiados, vegetales asados y aderezo cítrico de maracuyá. 100% plant-based.',
      precioBs: 48,
      stockDisponible: 15,
      stockMinimoAlerta: 4,
      esVegano: true,
      esPicante: false,
      esDestacado: true,
      enHappyHour: false,
      tiempoPreparacionMin: 14,
      imageUrl: '/images/dish-desayuno-saludable.webp',
      maridajeSlug: 'mojito-maracuya',
    },

    // 2. Burgers & Picadas de Bar
    {
      categorySlug: 'burgers-picadas',
      slug: 'joy-ride-mountain-burger',
      name: 'Joy Ride Mountain Burger',
      description: 'Doble carne smash de res, cheddar fundido, tocino ahumado crocante, cebollas caramelizadas al Singani y papas rústicas.',
      precioBs: 56,
      stockDisponible: 22,
      stockMinimoAlerta: 6,
      esVegano: false,
      esPicante: false,
      esDestacado: true,
      enHappyHour: false,
      tiempoPreparacionMin: 16,
      imageUrl: '/images/dish-burger.webp',
      maridajeSlug: 'pack-happy-hour-cerveza',
    },
    {
      categorySlug: 'burgers-picadas',
      slug: 'nachos-no-solo-gringos',
      name: 'Nachos Supremos "No Solo Para Gringos"',
      description: 'Totopos crujientes gratinados con doble queso, frijoles negros, jalapeños, guacamole fresco, pico de gallo y crema ácida.',
      precioBs: 62,
      stockDisponible: 15,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: true,
      esDestacado: true,
      enHappyHour: false,
      tiempoPreparacionMin: 12,
      imageUrl: '/images/dish-nachos.webp',
      maridajeSlug: 'jarra-sangria-casa',
    },
    {
      categorySlug: 'burgers-picadas',
      slug: 'alitas-bbq-picantes',
      name: 'Alitas BBQ & Ají Rocoto (12 u.)',
      description: 'Doce alitas glaseadas en salsa BBQ artesanal con toque de rocoto boliviano, bastones de apio y dip ranch.',
      precioBs: 64,
      stockDisponible: 20,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: true,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 18,
      imageUrl: '/images/dish-alitas-bbq.webp',
      maridajeSlug: 'pack-happy-hour-cerveza',
    },
    {
      categorySlug: 'burgers-picadas',
      slug: 'fajitas-sizzling-sucre',
      name: 'Fajitas Sizzling & Guacamole',
      description: 'Tabla caliente con carne salteada, tortillas de trigo tibias, choclo dulce, pico de gallo, frijoles y guacamole artesanal.',
      precioBs: 69,
      stockDisponible: 13,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: true,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 18,
      imageUrl: '/images/carousel-1.webp',
      maridajeSlug: 'mojito-maracuya',
    },
    {
      categorySlug: 'burgers-picadas',
      slug: 'tacos-sucre-nocturnos',
      name: 'Tacos Nocturnos Joy Ride (Veganos)',
      description: 'Tres tortillas suaves con proteína vegetal sazonada, col morada encurtida, palta y salsa taquera de locoto.',
      precioBs: 46,
      stockDisponible: 14,
      stockMinimoAlerta: 4,
      esVegano: true,
      esPicante: true,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 12,
      imageUrl: '/images/picada-tacos.webp',
      maridajeSlug: 'mojito-maracuya',
    },
    {
      categorySlug: 'burgers-picadas',
      slug: 'ensalada-joy-pollo',
      name: 'Ensalada Joy con Pollo Grillado',
      description: 'Mix de hojas orgánicas, pechuga grillada al limón, tomates cherry, palta y vinagreta de la casa.',
      precioBs: 44,
      stockDisponible: 0,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 12,
      imageUrl: '/images/dish-ensalada-joy.webp',
      maridajeSlug: 'cafe-boliviano-altura',
    },

    // 3. Bar, Coctelería & Cervezas
    {
      categorySlug: 'bar-cocteles',
      slug: 'pack-happy-hour-cerveza',
      name: 'Pack Happy Hour 2x1 Cerveza Artesanal',
      description: 'Dos pintas frías de cerveza artesanal sucrense o Huari bien helada en promoción continua de Happy Hour.',
      precioBs: 42,
      stockDisponible: 30,
      stockMinimoAlerta: 8,
      esVegano: true,
      esPicante: false,
      esDestacado: true,
      enHappyHour: true,
      tiempoPreparacionMin: 5,
      imageUrl: '/images/dish-cerveza-2x1.webp',
      maridajeSlug: 'alitas-bbq-picantes',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'chuflay-singani',
      name: 'Chuflay Especial Singani de Altura',
      description: 'Emblema boliviano preparado con Singani de uva moscatel de altura, ginger ale frío, hielo cristalino y limón verde.',
      precioBs: 34,
      stockDisponible: 28,
      stockMinimoAlerta: 6,
      esVegano: true,
      esPicante: false,
      esDestacado: true,
      enHappyHour: true,
      tiempoPreparacionMin: 5,
      imageUrl: '/images/dish-chuflay.webp',
      maridajeSlug: 'super-pique-macho',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'mojito-maracuya',
      name: 'Mojito Cubano de Maracuyá 2x1',
      description: 'Ron añejo, pulpa natural de maracuyá boliviano, hierbabuena machacada y soda helada. Promo Happy Hour.',
      precioBs: 44,
      stockDisponible: 24,
      stockMinimoAlerta: 6,
      esVegano: true,
      esPicante: false,
      esDestacado: false,
      enHappyHour: true,
      tiempoPreparacionMin: 6,
      imageUrl: '/images/dish-mojito.webp',
      maridajeSlug: 'nachos-no-solo-gringos',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'negroni-clasico',
      name: 'Negroni Clásico de la Barra',
      description: 'Partes iguales de gin botánico, Campari y vermouth rosso sobre hielo macizo con piel de naranja flameada.',
      precioBs: 46,
      stockDisponible: 16,
      stockMinimoAlerta: 4,
      esVegano: true,
      esPicante: false,
      esDestacado: false,
      enHappyHour: true,
      tiempoPreparacionMin: 5,
      imageUrl: '/images/dish-negroni.webp',
      maridajeSlug: 'pasta-bolognesa-casa',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'jarra-sangria-casa',
      name: 'Jarra de Sangría Joy Ride (1.2L)',
      description: 'Vino tinto tarijeño macerado con fruta fresca de temporada, toque de Singani y especias cítricas para compartir.',
      precioBs: 78,
      stockDisponible: 9,
      stockMinimoAlerta: 3,
      esVegano: true,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 8,
      imageUrl: '/images/dish-sangria.webp',
      maridajeSlug: 'tacos-sucre-nocturnos',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'the-hulk-cocktail',
      name: 'The Hulk (Cóctel Signature Joy Ride)',
      description: 'Nuestro trago verde insignia de barra: licor de melón, ron blanco, cítricos frescos y toque secreto de la casa.',
      precioBs: 45,
      stockDisponible: 20,
      stockMinimoAlerta: 5,
      esVegano: true,
      esPicante: false,
      esDestacado: true,
      enHappyHour: true,
      tiempoPreparacionMin: 5,
      imageUrl: '/images/dish-the-hulk.webp',
      maridajeSlug: 'nachos-no-solo-gringos',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'la-cucaracha-flameada',
      name: 'La Cucaracha Flameada (Shot & Fuego)',
      description: 'Clásico nocturno en capas de Kahlúa, tequila reposado y llama azul servida con sorbete para la ronda.',
      precioBs: 36,
      stockDisponible: 26,
      stockMinimoAlerta: 6,
      esVegano: true,
      esPicante: false,
      esDestacado: false,
      enHappyHour: true,
      tiempoPreparacionMin: 4,
      imageUrl: '/images/dish-cucaracha.webp',
      maridajeSlug: 'alitas-bbq-picantes',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'daiquiri-frozen-frutilla',
      name: 'Daiquiri Frozen de Frutilla / Arándano',
      description: 'Fruta fresca triturada con ron cubano, jugo de limón verde y escarcha helada. Refrescante y vibrante.',
      precioBs: 42,
      stockDisponible: 19,
      stockMinimoAlerta: 5,
      esVegano: true,
      esPicante: false,
      esDestacado: false,
      enHappyHour: true,
      tiempoPreparacionMin: 6,
      imageUrl: '/images/dish-daiquiri.webp',
      maridajeSlug: 'fajitas-sizzling-sucre',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'pina-colada-caribena',
      name: 'Piña Colada de la Terraza',
      description: 'Crema de coco, jugo natural de piña del Chapare y ron añejo batido con hielo hasta quedar sedoso.',
      precioBs: 44,
      stockDisponible: 18,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: true,
      tiempoPreparacionMin: 6,
      imageUrl: '/images/dish-pina-colada.webp',
      maridajeSlug: 'cheesecake-frutos-rojos',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'chorro-negro-blanco',
      name: 'Chorro Negro & Blanco Joy Ride',
      description: 'Licor de café artesanal mezclado con crema irlandesa o vodka frío; ideal para medianoche en Sucre.',
      precioBs: 40,
      stockDisponible: 16,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 5,
      imageUrl: '/images/dish-chorro.webp',
      maridajeSlug: 'brownie-volcan-2x1',
    },
    {
      categorySlug: 'bar-cocteles',
      slug: 'poncho-boliviano-pojchu',
      name: 'Poncho Boliviano (Pojchu Caliente)',
      description: 'Receta invernal sucrense con Singani especiado, canela, naranja y miel de valle para noches frías.',
      precioBs: 35,
      stockDisponible: 21,
      stockMinimoAlerta: 5,
      esVegano: true,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 6,
      imageUrl: '/images/dish-poncho.webp',
      maridajeSlug: 'charque-de-res',
    },
    {
      categorySlug: 'burgers-picadas',
      slug: 'pizza-artesanal-joyride',
      name: 'Pizza Artesanal 4 Quesos & Diávola',
      description: 'Masa crocante a la piedra con mozzarella, gorgonzola, parmesano y chorizo picante o albahaca fresca.',
      precioBs: 74,
      stockDisponible: 15,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: true,
      esDestacado: true,
      enHappyHour: false,
      tiempoPreparacionMin: 18,
      imageUrl: '/images/dish-pizza.webp',
      maridajeSlug: 'negroni-clasico',
    },

    // 4. Cafetería & Postres
    {
      categorySlug: 'cafeteria-postres',
      slug: 'cafe-boliviano-altura',
      name: 'Café Boliviano de Altura (Prensa/Cappuccino)',
      description: 'Granos yungueños de tueste medio con notas a cacao y caramelo, extraídos en espresso doble o cappuccino sedoso.',
      precioBs: 24,
      stockDisponible: 40,
      stockMinimoAlerta: 10,
      esVegano: true,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 6,
      imageUrl: '/images/dish-cafe-altura.webp',
      maridajeSlug: 'brownie-volcan-2x1',
    },
    {
      categorySlug: 'cafeteria-postres',
      slug: 'desayuno-chaki',
      name: "Desayuno de Cha'ki Sucrense",
      description: 'El favorito desde 2001 para revivir mañanas en Sucre: omelet picante con queso, jugo natural, café pasado y panes tibios.',
      precioBs: 45,
      stockDisponible: 14,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: true,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 15,
      imageUrl: '/images/dish-desayuno-chaki.webp',
      maridajeSlug: 'cafe-boliviano-altura',
    },
    {
      categorySlug: 'cafeteria-postres',
      slug: 'desayuno-frances',
      name: 'Desayuno Francés & Café con Leche',
      description: 'Tostadas doradas, mantequilla artesanal, mermelada de frutos del valle, fruta de estación y café de altura.',
      precioBs: 38,
      stockDisponible: 12,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 12,
      imageUrl: '/images/dish-desayuno-frances.webp',
      maridajeSlug: 'cafe-boliviano-altura',
    },
    {
      categorySlug: 'cafeteria-postres',
      slug: 'brownie-volcan-2x1',
      name: 'Brownie Volcán con Helado (Promo 2x1)',
      description: 'Dos brownies tibios de chocolate oscuro 70% boliviano coronados con helado de vainilla y fudge tibio.',
      precioBs: 36,
      stockDisponible: 18,
      stockMinimoAlerta: 5,
      esVegano: false,
      esPicante: false,
      esDestacado: true,
      enHappyHour: true,
      tiempoPreparacionMin: 10,
      imageUrl: '/images/dish-brownie-2x1.webp',
      maridajeSlug: 'cafe-boliviano-altura',
    },
    {
      categorySlug: 'cafeteria-postres',
      slug: 'cheesecake-frutos-rojos',
      name: 'Cheesecake de Frutos Rojos',
      description: 'Base crocante de galleta con crema horneada de queso y reducción artesanal de frutillas y moras.',
      precioBs: 34,
      stockDisponible: 10,
      stockMinimoAlerta: 3,
      esVegano: false,
      esPicante: false,
      esDestacado: false,
      enHappyHour: false,
      tiempoPreparacionMin: 6,
      imageUrl: '/images/dish-cheesecake.webp',
      maridajeSlug: 'cafe-boliviano-altura',
    },

    // 5. Combos & Eventos Especiales
    {
      categorySlug: 'combos-eventos',
      slug: 'combo-salsa-bachata',
      name: 'Combo "Noche de Salsa & Bachata"',
      description: 'Tabla de picada Joy Ride con bruschettas, aceitunas y embutidos + 2 Mojitos o Chuflays listos para después de clases.',
      precioBs: 115,
      stockDisponible: 12,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: false,
      esDestacado: true,
      enHappyHour: true,
      tiempoPreparacionMin: 15,
      imageUrl: '/images/carousel-2.webp',
      maridajeSlug: 'brownie-volcan-2x1',
    },
    {
      categorySlug: 'combos-eventos',
      slug: 'combo-partido-gigante',
      name: 'Combo "Partido en Pantalla Gigante"',
      description: 'Nachos supremos + Alitas BBQ x12 + 4 Cervezas artesanales bien heladas. Ideal para compartir en mesa grande.',
      precioBs: 148,
      stockDisponible: 2,
      stockMinimoAlerta: 4,
      esVegano: false,
      esPicante: true,
      esDestacado: true,
      enHappyHour: false,
      tiempoPreparacionMin: 20,
      imageUrl: '/images/carousel-3.webp',
      maridajeSlug: 'chuflay-singani',
    },
  ];

  const products: Record<string, { id: string; name: string; precioBs: number }> = {};
  for (const p of productsSeed) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    const saved = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        categoryId: categories[p.categorySlug],
        name: p.name,
        description: p.description,
        precioBs: p.precioBs,
        precioUsd: toUsd(p.precioBs),
        stockMinimoAlerta: p.stockMinimoAlerta,
        esVegano: p.esVegano,
        esPicante: p.esPicante,
        esDestacado: p.esDestacado,
        enHappyHour: p.enHappyHour,
        tiempoPreparacionMin: p.tiempoPreparacionMin,
        imageUrl: p.imageUrl,
        maridajeSlug: p.maridajeSlug,
      },
      create: {
        categoryId: categories[p.categorySlug],
        slug: p.slug,
        name: p.name,
        description: p.description,
        precioBs: p.precioBs,
        precioUsd: toUsd(p.precioBs),
        stockDisponible: p.stockDisponible,
        stockReservado: 0,
        stockMinimoAlerta: p.stockMinimoAlerta,
        esVegano: p.esVegano,
        esPicante: p.esPicante,
        esDestacado: p.esDestacado,
        enHappyHour: p.enHappyHour,
        tiempoPreparacionMin: p.tiempoPreparacionMin,
        imageUrl: p.imageUrl,
        maridajeSlug: p.maridajeSlug,
      },
    });
    products[p.slug] = { id: saved.id, name: saved.name, precioBs: p.precioBs };

    if (!existing && p.stockDisponible > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: saved.id,
          actorId: users['admin@joyride.bo'].id,
          type: StockMovementType.ENTRADA_INICIAL,
          quantity: p.stockDisponible,
          previousStock: 0,
          newStock: p.stockDisponible,
          reason: 'Inventario inicial de lanzamiento Joy Ride Cafe Sucre',
        },
      });
    }
  }

  const promotionsSeed = [
    {
      slug: 'happy-hour-2x1',
      title: 'Happy Hour 2x1 en Barra',
      subtitle: 'Cervezas artesanales, Chuflays, Mojitos y Negronis',
      description: 'Todos los días de 18:00 a 21:00 en Calle Nicolás Ortiz N° 14 y en nuestra tienda digital.',
      badgeText: '2x1 EN VIVO',
      scheduleText: 'Lun – Dom · 18:00 – 21:00',
      discountPercent: 50,
      imageUrl: '/images/experiencia-bar.webp',
    },
    {
      slug: 'clases-salsa-bachata',
      title: 'Clases Gratis de Salsa & Bachata',
      subtitle: 'No sabes bailar, nosotros te enseñamos y luego fiesta',
      description: 'Pista abierta en el segundo piso con instructores locales, viajeros y música latina hasta las 02:30.',
      badgeText: 'SALSA & BACHATA',
      scheduleText: 'Mar, Jue y Sáb · 18:00 – 21:00',
      discountPercent: 0,
      imageUrl: '/images/salsa-bachata.webp',
    },
    {
      slug: 'happy-postres-2x1',
      title: '2x1 en Postres de Tarde',
      subtitle: 'Brownie Volcán con Helado + Café de Altura',
      description: 'Acompaña la tarde frente a la Catedral Metropolitana con nuestra promo dulce.',
      badgeText: '2x1 POSTRES',
      scheduleText: 'Todos los días · 15:00 – 19:00',
      discountPercent: 50,
      imageUrl: '/images/dish-brownie-2x1.webp',
    },
    {
      slug: 'musica-vivo-pantalla',
      title: 'Música en Vivo & Pantalla Gigante',
      subtitle: 'Bandas sucrenses, rock acústico y fútbol internacional',
      description: 'Reserva zona de Pantalla Gigante o Mezzanine con tu combo de nachos, alitas y cervezas.',
      badgeText: 'EN VIVO',
      scheduleText: 'Vie & Sáb · Desde 21:30',
      discountPercent: 15,
      imageUrl: '/images/musica-vivo.webp',
    },
    {
      slug: 'mountain-bike-cordillera',
      title: 'Tours Mountain Bike & Aventura',
      subtitle: 'Rutas por Maragua y Cordillera de los Frailes',
      description: 'Desayuno energético en Joy Ride antes de salir a rodar por los cañones de Chuquisaca.',
      badgeText: 'OUTDOOR HUB',
      scheduleText: 'Salidas diarias · 08:00 AM',
      discountPercent: 10,
      imageUrl: '/images/evento-tours.webp',
    },
  ];

  for (const promo of promotionsSeed) {
    await prisma.promotion.upsert({
      where: { slug: promo.slug },
      update: promo,
      create: promo,
    });
  }

  // Seed sample orders only if none exist (preserves idempotency)
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const clientUser = users['cliente@joyride.bo'];
    const cashierUser = users['cajero@joyride.bo'];
    const packerUser = users['empaque@joyride.bo'];
    const riderUser = users['repartidor@joyride.bo'];

    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

    // 1. Delivered QR Order (for historical analytics & customer timeline)
    const p1 = products['super-pique-macho'];
    const p2 = products['chuflay-singani'];
    const total1 = p1.precioBs + p2.precioBs * 2;
    await prisma.order.create({
      data: {
        orderCode: 'JR-2026-001',
        userId: clientUser.id,
        status: OrderStatus.ENTREGADO,
        deliveryType: DeliveryType.DELIVERY,
        subtotalBs: total1,
        discountBs: 0,
        totalBs: total1,
        totalUsd: toUsd(total1),
        deliveryAddress: 'Calle Dalence N° 218, Zona Central, Sucre',
        deliveryReference: 'A 1 cuadra del Parque Bolívar',
        phoneContact: '+591 71123456',
        createdAt: hoursAgo(26),
        items: {
          create: [
            { productId: p1.id, productName: p1.name, unitPriceBs: p1.precioBs, quantity: 1, subtotalBs: p1.precioBs },
            { productId: p2.id, productName: p2.name, unitPriceBs: p2.precioBs, quantity: 2, subtotalBs: p2.precioBs * 2 },
          ],
        },
        payment: {
          create: {
            method: PaymentMethod.QR,
            status: PaymentStatus.COMPLETADO,
            amountBs: total1,
            amountUsd: toUsd(total1),
            qrToken: 'demo-qr-completed-001',
            qrSignature: crypto.createHash('sha256').update('demo-qr-completed-001').digest('hex'),
            bankName: 'Simple QR Bolivia / BNB',
            verifiedAt: hoursAgo(25.9),
          },
        },
        packaging: {
          create: {
            empaquetadorId: packerUser.id,
            sealCode: 'JR-SEAL-101',
            allVerified: true,
            items: [
              { id: 'item-1', label: `${p1.name} (x1) sellado térmico`, checked: true },
              { id: 'item-2', label: `${p2.name} (x2) portavasos asegurado`, checked: true },
              { id: 'item-3', label: 'Cubiertos, servilletas y llajwa extra', checked: true },
            ],
            startedAt: hoursAgo(25.8),
            completedAt: hoursAgo(25.5),
          },
        },
        delivery: {
          create: {
            repartidorId: riderUser.id,
            deliveryAddress: 'Calle Dalence N° 218, Zona Central, Sucre',
            deliveryReference: 'A 1 cuadra del Parque Bolívar',
            deliveryPin: '7314',
            packageLabelCode: 'JR-PKG-101',
            pickedUpAt: hoursAgo(25.4),
            deliveredAt: hoursAgo(25.1),
            receiverName: 'Camila Mendoza',
            deliveryNotes: 'Entregado en portería con PIN verificado.',
          },
        },
        history: {
          create: [
            { actorId: clientUser.id, actorName: clientUser.name, actorRole: 'CLIENTE', fromStatus: null, toStatus: OrderStatus.PENDIENTE_PAGO, reason: 'Pedido creado con método QR Instantáneo', createdAt: hoursAgo(26) },
            { actorId: clientUser.id, actorName: 'Pasarela QR en Vivo', actorRole: 'SISTEMA', fromStatus: OrderStatus.PENDIENTE_PAGO, toStatus: OrderStatus.PAGO_CONFIRMADO, reason: 'Pago QR confirmado automáticamente', createdAt: hoursAgo(25.9) },
            { actorId: packerUser.id, actorName: packerUser.name, actorRole: 'EMPAQUETADOR', fromStatus: OrderStatus.PAGO_CONFIRMADO, toStatus: OrderStatus.EN_PREPARACION, reason: 'Comanda tomada en cocina y barra', createdAt: hoursAgo(25.8) },
            { actorId: packerUser.id, actorName: packerUser.name, actorRole: 'EMPAQUETADOR', fromStatus: OrderStatus.EN_PREPARACION, toStatus: OrderStatus.EMPACADO, reason: 'Checklist 100% completo · Sello JR-SEAL-101', createdAt: hoursAgo(25.5) },
            { actorId: riderUser.id, actorName: riderUser.name, actorRole: 'REPARTIDOR', fromStatus: OrderStatus.EMPACADO, toStatus: OrderStatus.EN_CAMINO, reason: 'Repartidor salió hacia Zona Central', createdAt: hoursAgo(25.4) },
            { actorId: riderUser.id, actorName: riderUser.name, actorRole: 'REPARTIDOR', fromStatus: OrderStatus.EN_CAMINO, toStatus: OrderStatus.ENTREGADO, reason: 'Entrega finalizada con verificación PIN', createdAt: hoursAgo(25.1) },
          ],
        },
      },
    });

    // 2. Delivered PayPal Order (for Analytics breakdown)
    const p3 = products['combo-salsa-bachata'];
    await prisma.order.create({
      data: {
        orderCode: 'JR-2026-002',
        userId: clientUser.id,
        status: OrderStatus.ENTREGADO,
        deliveryType: DeliveryType.RECOGER_LOCAL,
        subtotalBs: p3.precioBs,
        discountBs: 0,
        totalBs: p3.precioBs,
        totalUsd: toUsd(p3.precioBs),
        deliveryAddress: 'Recojo en Local — Calle Nicolás Ortiz N° 14',
        phoneContact: '+591 71123456',
        createdAt: hoursAgo(12),
        items: {
          create: [
            { productId: p3.id, productName: p3.name, unitPriceBs: p3.precioBs, quantity: 1, subtotalBs: p3.precioBs },
          ],
        },
        payment: {
          create: {
            method: PaymentMethod.PAYPAL,
            status: PaymentStatus.COMPLETADO,
            amountBs: p3.precioBs,
            amountUsd: toUsd(p3.precioBs),
            paypalOrderId: 'DEMO-PP-ORDER-002',
            paypalCaptureId: 'DEMO-PP-CAP-002',
            paypalPayerEmail: 'camila.traveler@paypal.example',
            verifiedAt: hoursAgo(11.95),
          },
        },
        packaging: {
          create: {
            empaquetadorId: packerUser.id,
            sealCode: 'JR-SEAL-102',
            allVerified: true,
            items: [
              { id: 'item-1', label: `${p3.name} (x1) listo en barra`, checked: true },
              { id: 'item-2', label: 'Pulseras de acceso Salsa & Bachata', checked: true },
            ],
            startedAt: hoursAgo(11.8),
            completedAt: hoursAgo(11.6),
          },
        },
        delivery: {
          create: {
            repartidorId: riderUser.id,
            deliveryAddress: 'Recojo en Local — Calle Nicolás Ortiz N° 14',
            deliveryPin: '9052',
            packageLabelCode: 'JR-PKG-102',
            pickedUpAt: hoursAgo(11.5),
            deliveredAt: hoursAgo(11.4),
            receiverName: 'Camila Mendoza',
            deliveryNotes: 'Entregado en mesa Mezzanine',
          },
        },
        history: {
          create: [
            { actorId: clientUser.id, actorName: clientUser.name, actorRole: 'CLIENTE', fromStatus: null, toStatus: OrderStatus.PENDIENTE_PAGO, reason: 'Orden PayPal API v2 creada', createdAt: hoursAgo(12) },
            { actorId: clientUser.id, actorName: 'PayPal Orders v2', actorRole: 'SISTEMA', fromStatus: OrderStatus.PENDIENTE_PAGO, toStatus: OrderStatus.PAGO_CONFIRMADO, reason: 'Captura PayPal verificada (COMPLETED)', createdAt: hoursAgo(11.95) },
            { actorId: packerUser.id, actorName: packerUser.name, actorRole: 'EMPAQUETADOR', fromStatus: OrderStatus.PAGO_CONFIRMADO, toStatus: OrderStatus.EN_PREPARACION, reason: 'Preparación iniciada', createdAt: hoursAgo(11.8) },
            { actorId: packerUser.id, actorName: packerUser.name, actorRole: 'EMPAQUETADOR', fromStatus: OrderStatus.EN_PREPARACION, toStatus: OrderStatus.EMPACADO, reason: 'Empaque verificado al 100%', createdAt: hoursAgo(11.6) },
            { actorId: riderUser.id, actorName: riderUser.name, actorRole: 'REPARTIDOR', fromStatus: OrderStatus.EMPACADO, toStatus: OrderStatus.EN_CAMINO, reason: 'En traslado hacia mesa/entrega', createdAt: hoursAgo(11.5) },
            { actorId: riderUser.id, actorName: riderUser.name, actorRole: 'REPARTIDOR', fromStatus: OrderStatus.EN_CAMINO, toStatus: OrderStatus.ENTREGADO, reason: 'Entregado con PIN', createdAt: hoursAgo(11.4) },
          ],
        },
      },
    });

    // 3. Bank Deposit Pending Review (for Cashier Panel demo!)
    const p4 = products['joy-ride-mountain-burger'];
    const p5 = products['charque-de-res'];
    const total3 = p4.precioBs + p5.precioBs;
    await prisma.order.create({
      data: {
        orderCode: 'JR-2026-003',
        userId: clientUser.id,
        status: OrderStatus.PAGO_EN_REVISION,
        deliveryType: DeliveryType.DELIVERY,
        subtotalBs: total3,
        discountBs: 0,
        totalBs: total3,
        totalUsd: toUsd(total3),
        deliveryAddress: 'Av. Hernando Siles N° 640, Sucre',
        deliveryReference: 'Edificio Mirador, timbre 3B',
        phoneContact: '+591 71123456',
        notes: 'Sin cebolla cruda en la burger, mucha llajwa por favor.',
        createdAt: hoursAgo(1),
        items: {
          create: [
            { productId: p4.id, productName: p4.name, unitPriceBs: p4.precioBs, quantity: 1, subtotalBs: p4.precioBs },
            { productId: p5.id, productName: p5.name, unitPriceBs: p5.precioBs, quantity: 1, subtotalBs: p5.precioBs },
          ],
        },
        payment: {
          create: {
            method: PaymentMethod.DEPOSITO_BANCARIO,
            status: PaymentStatus.EN_REVISION,
            amountBs: total3,
            amountUsd: toUsd(total3),
            bankName: 'Banco Nacional de Bolivia (BNB)',
            referenceNumber: 'BNB-9948271',
            comprobanteUrl: makeDemoReceiptSvg(),
          },
        },
        history: {
          create: [
            { actorId: clientUser.id, actorName: clientUser.name, actorRole: 'CLIENTE', fromStatus: null, toStatus: OrderStatus.PENDIENTE_PAGO, reason: 'Pedido creado para transferencia bancaria', createdAt: hoursAgo(1) },
            { actorId: clientUser.id, actorName: clientUser.name, actorRole: 'CLIENTE', fromStatus: OrderStatus.PENDIENTE_PAGO, toStatus: OrderStatus.PAGO_EN_REVISION, reason: 'Comprobante BNB-9948271 enviado a revisión de Caja', createdAt: hoursAgo(0.95) },
          ],
        },
      },
    });

    // Reserve stock for order 3 because it's in PAGO_EN_REVISION!
    await prisma.product.update({
      where: { id: p4.id },
      data: { stockDisponible: { decrement: 1 }, stockReservado: { increment: 1 } },
    });
    await prisma.product.update({
      where: { id: p5.id },
      data: { stockDisponible: { decrement: 1 }, stockReservado: { increment: 1 } },
    });

    // 4. Paid Order Ready for Packer ("Por Preparar" Kanban column)
    const p6 = products['nachos-no-solo-gringos'];
    const p7 = products['mojito-maracuya'];
    const total4 = p6.precioBs + p7.precioBs;
    await prisma.order.create({
      data: {
        orderCode: 'JR-2026-004',
        userId: clientUser.id,
        status: OrderStatus.PAGO_CONFIRMADO,
        deliveryType: DeliveryType.DELIVERY,
        subtotalBs: total4,
        discountBs: 0,
        totalBs: total4,
        totalUsd: toUsd(total4),
        deliveryAddress: 'Calle Estudiantes N° 88, Sucre',
        deliveryReference: 'Frente a Facultad de Derecho',
        phoneContact: '+591 71123456',
        createdAt: hoursAgo(0.4),
        items: {
          create: [
            { productId: p6.id, productName: p6.name, unitPriceBs: p6.precioBs, quantity: 1, subtotalBs: p6.precioBs },
            { productId: p7.id, productName: p7.name, unitPriceBs: p7.precioBs, quantity: 1, subtotalBs: p7.precioBs },
          ],
        },
        payment: {
          create: {
            method: PaymentMethod.QR,
            status: PaymentStatus.COMPLETADO,
            amountBs: total4,
            amountUsd: toUsd(total4),
            qrToken: 'demo-qr-ready-004',
            qrSignature: crypto.createHash('sha256').update('demo-qr-ready-004').digest('hex'),
            bankName: 'Simple QR / Banco Unión',
            verifiedAt: hoursAgo(0.35),
          },
        },
        history: {
          create: [
            { actorId: clientUser.id, actorName: clientUser.name, actorRole: 'CLIENTE', fromStatus: null, toStatus: OrderStatus.PENDIENTE_PAGO, reason: 'Pedido creado', createdAt: hoursAgo(0.4) },
            { actorId: clientUser.id, actorName: 'Pasarela QR en Vivo', actorRole: 'SISTEMA', fromStatus: OrderStatus.PENDIENTE_PAGO, toStatus: OrderStatus.PAGO_CONFIRMADO, reason: 'Pago QR confirmado, enviado a Cocina/Bar', createdAt: hoursAgo(0.35) },
          ],
        },
      },
    });

    // 5. Packed Order Ready for Rider (with PIN 4829 for Delivery demo!)
    const p8 = products['alitas-bbq-picantes'];
    const p9 = products['brownie-volcan-2x1'];
    const total5 = p8.precioBs + p9.precioBs;
    await prisma.order.create({
      data: {
        orderCode: 'JR-2026-005',
        userId: clientUser.id,
        status: OrderStatus.EMPACADO,
        deliveryType: DeliveryType.DELIVERY,
        subtotalBs: total5,
        discountBs: 0,
        totalBs: total5,
        totalUsd: toUsd(total5),
        deliveryAddress: 'Calle Junín N° 412, Sucre',
        deliveryReference: 'Portón madera café junto a librería',
        phoneContact: '+591 71123456',
        createdAt: hoursAgo(0.6),
        items: {
          create: [
            { productId: p8.id, productName: p8.name, unitPriceBs: p8.precioBs, quantity: 1, subtotalBs: p8.precioBs },
            { productId: p9.id, productName: p9.name, unitPriceBs: p9.precioBs, quantity: 1, subtotalBs: p9.precioBs },
          ],
        },
        payment: {
          create: {
            method: PaymentMethod.QR,
            status: PaymentStatus.COMPLETADO,
            amountBs: total5,
            amountUsd: toUsd(total5),
            qrToken: 'demo-qr-packed-005',
            qrSignature: crypto.createHash('sha256').update('demo-qr-packed-005').digest('hex'),
            bankName: 'Simple QR / BNB',
            verifiedAt: hoursAgo(0.55),
            verificadoPorId: cashierUser.id,
          },
        },
        packaging: {
          create: {
            empaquetadorId: packerUser.id,
            sealCode: 'JR-SEAL-4829',
            allVerified: true,
            items: [
              { id: 'item-1', label: `${p8.name} (x1) caja térmica sellada`, checked: true },
              { id: 'item-2', label: `${p9.name} (x1) empaque frío separado`, checked: true },
              { id: 'item-3', label: 'Sello de seguridad Joy Ride y cubiertos', checked: true },
            ],
            startedAt: hoursAgo(0.45),
            completedAt: hoursAgo(0.25),
          },
        },
        delivery: {
          create: {
            deliveryAddress: 'Calle Junín N° 412, Sucre',
            deliveryReference: 'Portón madera café junto a librería',
            deliveryPin: '4829',
            packageLabelCode: 'JR-PKG-4829',
          },
        },
        history: {
          create: [
            { actorId: clientUser.id, actorName: clientUser.name, actorRole: 'CLIENTE', fromStatus: null, toStatus: OrderStatus.PENDIENTE_PAGO, reason: 'Pedido creado', createdAt: hoursAgo(0.6) },
            { actorId: clientUser.id, actorName: 'Pasarela QR en Vivo', actorRole: 'SISTEMA', fromStatus: OrderStatus.PENDIENTE_PAGO, toStatus: OrderStatus.PAGO_CONFIRMADO, reason: 'Pago QR confirmado', createdAt: hoursAgo(0.55) },
            { actorId: packerUser.id, actorName: packerUser.name, actorRole: 'EMPAQUETADOR', fromStatus: OrderStatus.PAGO_CONFIRMADO, toStatus: OrderStatus.EN_PREPARACION, reason: 'Preparación iniciada en cocina', createdAt: hoursAgo(0.45) },
            { actorId: packerUser.id, actorName: packerUser.name, actorRole: 'EMPAQUETADOR', fromStatus: OrderStatus.EN_PREPARACION, toStatus: OrderStatus.EMPACADO, reason: 'Checklist 100% verificado · Etiqueta JR-PKG-4829', createdAt: hoursAgo(0.25) },
          ],
        },
      },
    });

    // 2 demo reservations
    const todayStr = new Date().toISOString().slice(0, 10);
    await prisma.reservation.createMany({
      data: [
        {
          code: 'RES-2026-01',
          userId: clientUser.id,
          guestName: 'Camila Mendoza',
          guestEmail: 'cliente@joyride.bo',
          guestPhone: '+591 71123456',
          zone: ReservationZone.PISTA_SALSA_BACHATA,
          date: todayStr,
          timeSlot: '18:30',
          partySize: 4,
          includeSalsaClass: true,
          specialNotes: 'Mesa cerca de la barra para clase de Salsa y luego cócteles 2x1.',
          status: ReservationStatus.CONFIRMADA,
          qrPassToken: 'JR-PASS-SALSA-001',
        },
        {
          code: 'RES-2026-02',
          userId: clientUser.id,
          guestName: 'Camila Mendoza',
          guestEmail: 'cliente@joyride.bo',
          guestPhone: '+591 71123456',
          zone: ReservationZone.MEZZANINE_TERRAZA,
          date: todayStr,
          timeSlot: '21:00',
          partySize: 6,
          includeSalsaClass: false,
          specialNotes: 'Celebración post-exposición SIS324.',
          status: ReservationStatus.CONFIRMADA,
          qrPassToken: 'JR-PASS-TERRAZA-002',
        },
      ],
    });
  }

  // Seed initial Staff & Delivery Chat + Sample HTML Email Logs if empty
  const existingChats = await prisma.chatMessage.count();
  if (existingChats === 0) {
    const adminUser = users['admin@joyride.bo'];
    const packerUser = users['empaque@joyride.bo'];
    const riderUser = users['repartidor@joyride.bo'];
    await prisma.chatMessage.createMany({
      data: [
        {
          channelType: 'STAFF_OPS',
          senderId: adminUser.id,
          senderName: adminUser.name,
          senderRole: 'ADMIN',
          content: 'Equipo, arrancamos turno nocturno Happy Hour 2x1. Trucha con quinua tiene stock crítico (3 u.).',
        },
        {
          channelType: 'STAFF_OPS',
          senderId: packerUser.id,
          senderName: packerUser.name,
          senderRole: 'EMPAQUETADOR',
          content: 'Recibido en Cocina & Barra. El pedido JR-2026-005 ya está sellado esperando retiro.',
        },
        {
          channelType: 'STAFF_OPS',
          senderId: riderUser.id,
          senderName: riderUser.name,
          senderRole: 'REPARTIDOR',
          content: 'En camino hacia Nicolás Ortiz 14 para recoger paquetes de Zona Central.',
        },
      ],
    });
  }

  const existingEmails = await prisma.emailLog.count();
  if (existingEmails === 0) {
    await prisma.emailLog.createMany({
      data: [
        {
          toEmail: 'cliente@joyride.bo',
          recipientRole: 'CLIENTE',
          templateType: 'ORDER_CONFIRMED',
          subject: 'Confirmación de Pedido JR-2026-001 — Joy Ride Café® Sucre',
          status: 'STORED_PREVIEW',
          htmlBody: `<div style="background:#0B0D12;color:#F8FAFC;font-family:sans-serif;padding:28px;border-radius:16px;border:1px solid #262C3A;max-width:560px;margin:auto;"><h2 style="color:#00A0DF;margin:0;">JOY RIDE CAFÉ® — SUCRE</h2><p style="color:#94A3B8;font-size:13px;">Calle Nicolás Ortiz N° 14 · Recibo Oficial</p><hr style="border-color:#262C3A;margin:16px 0;"/><p>¡Gracias por tu pedido <strong>JR-2026-001</strong>!</p><p style="font-size:14px;color:#CBD5E1;">1× Super Pique a lo Macho + 2× Chuflay Especial Singani</p><p style="font-size:20px;font-weight:bold;color:#F20574;">Total pagado: Bs. 146.00 ($ 20.98 USD)</p></div>`,
        },
        {
          toEmail: 'admin@joyride.bo',
          recipientRole: 'GERENTE',
          templateType: 'LOW_STOCK_ALERT',
          subject: 'Alerta de Stock Bajo: Filete de Trucha con Quinua Real (3 u.)',
          status: 'STORED_PREVIEW',
          htmlBody: `<div style="background:#0B0D12;color:#F8FAFC;font-family:sans-serif;padding:28px;border-radius:16px;border:1px solid #F20574;max-width:560px;margin:auto;"><h2 style="color:#F20574;margin:0;">ALERTA DE INVENTARIO CRÍTICO</h2><p style="color:#CBD5E1;">El producto <strong>Filete de Trucha con Quinua Real</strong> cayó por debajo del mínimo permitido.</p><p style="font-size:18px;font-weight:bold;color:#00A0DF;">Disponible: 3 unidades (Mínimo: 5)</p></div>`,
        },
      ],
    });
  }

  const existingReviews = await prisma.review.count();
  if (existingReviews === 0) {
    await prisma.review.createMany({
      data: [
        {
          authorName: 'Mateo Salguero',
          authorOrigin: 'Sucre, Bolivia',
          verifiedVia: 'GOOGLE',
          rating: 5,
          comment:
            'Llegamos por el Super Pique a lo Macho y terminamos en la clase gratis de Salsa con viajeros de todo el mundo. El mejor ambiente nocturno de Nicolas Ortiz.',
          photoUrl: '/images/fiesta-amigos.webp',
        },
        {
          authorName: 'Hannah Van Der Berg',
          authorOrigin: 'Amsterdam, Paises Bajos',
          verifiedVia: 'GOOGLE',
          rating: 5,
          comment:
            'El Chuflay de Singani y el Desayuno de Cha ki son parada obligatoria frente a la Catedral. Pague al instante con QR y segui todo en el mapa.',
          photoUrl: '/images/venue-bar-cocktails.webp',
        },
        {
          authorName: 'Camila Mendoza',
          authorOrigin: 'Santa Cruz · Turismo Sucre',
          verifiedVia: 'CUENTA_JOYRIDE',
          rating: 5,
          comment:
            'Despues de caminar por La Recoleta y Chocolates Para Ti bajamos al 2x1 de brownies y daiquiris. La pista con bola de espejos es top.',
          photoUrl: '/images/venue-lounge-lights.webp',
        },
        {
          authorName: 'Lucas Fernandez',
          authorOrigin: 'Cordoba, Argentina',
          verifiedVia: 'GOOGLE',
          rating: 5,
          comment:
            'Desde 2001 mantiene la magia de patio colonial con buena musica en vivo, cervezas heladas y pizza a la piedra hasta las 02:30.',
          photoUrl: '/images/venue-patio-night.webp',
        },
        {
          authorName: 'Valeria Quinteros',
          authorOrigin: 'La Paz, Bolivia',
          verifiedVia: 'CUENTA_JOYRIDE',
          rating: 5,
          comment:
            'Muy util la guia de Sucre y el PIN de entrega super rapido hasta Parque Bolivar. Los cocteles The Hulk y Cucaracha estan brutales.',
          photoUrl: '/images/dish-the-hulk.webp',
        },
        {
          authorName: 'Daniela & Jonas',
          authorOrigin: 'Munich, Alemania',
          verifiedVia: 'GOOGLE',
          rating: 4,
          comment:
            'Excelente punto base antes del tour en bici al Crater de Maragua y para cerrar la noche entre Joy Ride, Purgatorium y Terraza 625.',
          photoUrl: '/images/sucre-maragua-bike.webp',
        },
      ],
    });
  }

  const existingEvents = await prisma.event.count();
  if (existingEvents === 0) {
    await prisma.event.createMany({
      data: [
        {
          slug: 'noches-salsa-bachata',
          title: 'Noches de Salsa, Bachata & Musica en Vivo',
          subtitle: 'Clases gratuitas + fiesta multicultural bajo bola de espejos',
          description:
            'Martes, jueves y sabados desde las 18:00 en Calle Nicolas Ortiz N 14. Arrancamos con Happy Hour 2x1 en barra y seguimos con pista encendida hasta las 02:30 AM.',
          badge: 'EVENTO JOY RIDE',
          accent: 'magenta',
          locationLabel: 'Calle Nicolas Ortiz N 14',
          scheduleLabel: '18:00 - 02:30 AM',
          imageUrl: '/images/venue-lounge-lights.webp',
          imagesJson: [
            '/images/venue-lounge-lights.webp',
            '/images/salsa-bachata.webp',
            '/images/joyride-friends-night.webp',
            '/images/joyride-evento-2.webp',
          ],
          spotId: 'joyride-hq',
          sortOrder: 1,
          isActive: true,
          isFeatured: true,
        },
        {
          slug: 'patio-colonial-barra',
          title: 'Patio Colonial Nocturno & Tragos Signature',
          subtitle: 'The Hulk, Cucarachas en llama, Chuflay de Singani & Daiquiris',
          description:
            'Nuestro patio colonial con faroles y mezzanine es el punto de encuentro favorito de estudiantes sucrenses y viajeros frente a la Catedral Metropolitana.',
          badge: 'COCTELERIA & PATIO',
          accent: 'cyan',
          locationLabel: 'Patio & Barra Joy Ride',
          scheduleLabel: 'Happy Hour 18:00 - 21:00',
          imageUrl: '/images/joyride-official-portada.webp',
          imagesJson: [
            '/images/joyride-official-portada.webp',
            '/images/venue-patio-night.webp',
            '/images/venue-bar-cocktails.webp',
            '/images/joyride-evento-3.webp',
          ],
          spotId: 'joyride-hq',
          sortOrder: 2,
          isActive: true,
          isFeatured: true,
        },
        {
          slug: 'chocolates-para-ti-sucre',
          title: 'Chocolates Para Ti & Museo del Chocolate',
          subtitle: 'Bombones de singani, amaranto, quinua real y cacao boliviano',
          description:
            'A solo 2 minutos caminando desde Joy Ride sobre Calle Arenales N 7 y Audiencia N 68. Sucre es la capital boliviana del chocolate artesanal.',
          badge: 'TURISMO & CHOCOLATE',
          accent: 'amber',
          locationLabel: 'Calle Arenales N 7 - Centro',
          scheduleLabel: '2 min a pie desde Joy Ride',
          imageUrl: '/images/sucre-chocolates.webp',
          imagesJson: ['/images/sucre-chocolates.webp', '/images/dish-brownie-2x1.webp'],
          spotId: 'chocolates-para-ti',
          sortOrder: 3,
          isActive: true,
          isFeatured: true,
        },
        {
          slug: 'el-purgatorium-monasterio',
          title: 'El Purgatorium del Monasterio',
          subtitle: 'Bovedas historicas y cocteleria nocturna a 4 minutos del bar',
          description:
            'Clasico dentro de la ruta nocturna del centro historico en Calle Daniel Calvo N 138, ideal para combinar tu recorrido de bares en la Ciudad Blanca.',
          badge: 'BARES & NOCHE EN SUCRE',
          accent: 'magenta',
          locationLabel: 'Calle Daniel Calvo N 138',
          scheduleLabel: '17:30 - 01:00 AM',
          imageUrl: '/images/sucre-purgatorium.webp',
          imagesJson: ['/images/sucre-purgatorium.webp', '/images/experiencia-bar.webp'],
          spotId: 'el-purgatorium',
          sortOrder: 4,
          isActive: true,
          isFeatured: true,
        },
        {
          slug: 'terraza-625-sucre',
          title: 'Terraza 625 (Parador Santa Maria La Real)',
          subtitle: 'Atardeceres panoramicos sobre los campanarios coloniales',
          description:
            'Rooftop ubicado en Calle Bolivar N 625 con vistas 360 de la arquitectura blanca sucrense antes de bajar al movimiento nocturno de Joy Ride.',
          badge: 'ROOFTOP & VISTAS',
          accent: 'cyan',
          locationLabel: 'Calle Bolivar N 625',
          scheduleLabel: '5 min a pie desde Joy Ride',
          imageUrl: '/images/sucre-rooftop-terraza.webp',
          imagesJson: ['/images/sucre-rooftop-terraza.webp', '/images/sucre-mirador-sunset.webp'],
          spotId: 'terraza-625',
          sortOrder: 5,
          isActive: true,
          isFeatured: true,
        },
        {
          slug: 'casa-libertad-recoleta',
          title: 'Casa de la Libertad, San Felipe Neri & La Recoleta',
          subtitle: 'Caminata cultural desde el Km 0 hasta los tejados de Sucre',
          description:
            'Empieza frente a Plaza 25 de Mayo, sube a las azoteas de San Felipe Neri y contempla el atardecer en el Mirador La Recoleta.',
          badge: 'PATRIMONIO UNESCO',
          accent: 'emerald',
          locationLabel: 'Centro Historico de Sucre',
          scheduleLabel: '1 a 14 min caminando',
          imageUrl: '/images/sucre-mirador-sunset.webp',
          imagesJson: ['/images/sucre-mirador-sunset.webp', '/images/sucre-colonial-museum.webp'],
          spotId: 'plaza-25',
          sortOrder: 6,
          isActive: true,
          isFeatured: true,
        },
        {
          slug: 'maragua-cal-orcko',
          title: 'Crater de Maragua & Parque Cretacico Cal Orcko',
          subtitle: 'Rutas de Mountain Bike y mas de 5.000 huellas de dinosaurios',
          description:
            'Desayuna en Joy Ride desde las 07:00 AM antes de tomar el Dino Bus en Plaza 25 de Mayo o arrancar tu descenso en bici hacia la Cordillera de los Frailes.',
          badge: 'AVENTURA & BIKE HUB',
          accent: 'cyan',
          locationLabel: 'Salida Nicolas Ortiz N 14',
          scheduleLabel: 'Desayunos desde 07:00 AM',
          imageUrl: '/images/sucre-maragua-bike.webp',
          imagesJson: ['/images/sucre-maragua-bike.webp', '/images/evento-tours.webp', '/images/evento-grupos.webp'],
          spotId: 'cal-orcko',
          sortOrder: 7,
          isActive: true,
          isFeatured: true,
        },
      ],
    });
  } else {
    // Keep Joy Ride HQ galleries enriched with authentic venue media
    await prisma.event.updateMany({
      where: { slug: 'noches-salsa-bachata' },
      data: {
        imagesJson: [
          '/images/venue-lounge-lights.webp',
          '/images/salsa-bachata.webp',
          '/images/joyride-friends-night.webp',
          '/images/joyride-evento-2.webp',
        ],
      },
    });
    await prisma.event.updateMany({
      where: { slug: 'patio-colonial-barra' },
      data: {
        imageUrl: '/images/joyride-official-portada.webp',
        imagesJson: [
          '/images/joyride-official-portada.webp',
          '/images/venue-patio-night.webp',
          '/images/venue-bar-cocktails.webp',
          '/images/joyride-evento-3.webp',
        ],
      },
    });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: 'victor2004612@gmail.com' },
    update: { active: true },
    create: { email: 'victor2004612@gmail.com', name: 'Victor Villarroel', active: true },
  });
  await prisma.newsletterSubscriber.upsert({
    where: { email: 'cliente@joyride.bo' },
    update: { active: true },
    create: { email: 'cliente@joyride.bo', name: 'Camila Mendoza', active: true },
  });

  console.log('[SEED] Joy Ride Cafe Sucre database seeded successfully!');
}

main()
  .catch((err) => {
    console.error('[SEED] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
