export const BANK_INFO_FALLBACK = {
  bankName: 'Banco Nacional de Bolivia (BNB)',
  secondaryBank: 'Banco Unión S.A.',
  accountNumber: '1000-294810-44',
  accountHolder: 'Villarroel Molina Victor Manuel',
  qrValidUntil: '26 de septiembre de 2027',
  realQrImageUrl: '/assets/brand/qr-bnb-cropped.png',
  nit: '1029481022',
};

export const JOYRIDE_LOCATION = {
  name: 'JOY RIDE CAFÉ® — Sucre, Bolivia',
  address: 'Calle Nicolás Ortiz N° 14 (Frente a la Catedral Metropolitana)',
  lat: -19.04804,
  lng: -65.25973,
  whatsappNumber: '59176116875',
  whatsappDisplay: '+591 76116875',
  localPhone: '4 6425544',
  instagramUrl: 'https://www.instagram.com/joyridecafe/',
  facebookUrl: 'https://www.facebook.com/joyridecafe',
  tiktokUrl: 'https://www.tiktok.com/@joyridecafe',
  websiteUrl: 'https://www.joyridebol.com',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-19.04804,-65.25973',
};

export interface SucreZoneOption {
  id: string;
  label: string;
  addressSample: string;
  lat: number;
  lng: number;
}

export const SUCRE_DELIVERY_ZONES: SucreZoneOption[] = [
  {
    id: 'plaza-25',
    label: 'Plaza 25 de Mayo / Centro',
    addressSample: 'Plaza 25 de Mayo · Calle España N° 50, Sucre',
    lat: -19.0478,
    lng: -65.2596,
  },
  {
    id: 'parque-bolivar',
    label: 'Parque Bolívar / Tribunal',
    addressSample: 'Calle Dalence N° 218 · Parque Bolívar, Sucre',
    lat: -19.0442,
    lng: -65.2618,
  },
  {
    id: 'estudiantes',
    label: 'Zona Estudiantes / Facultades',
    addressSample: 'Calle Estudiantes N° 88 · Frente a Derecho, Sucre',
    lat: -19.0459,
    lng: -65.2607,
  },
  {
    id: 'hernando-siles',
    label: 'Av. Hernando Siles',
    addressSample: 'Av. Hernando Siles N° 640, Sucre',
    lat: -19.0424,
    lng: -65.2571,
  },
  {
    id: 'recoleta',
    label: 'Mirador La Recoleta',
    addressSample: 'Plaza Pedro de Anzúrez N° 18 · La Recoleta, Sucre',
    lat: -19.0545,
    lng: -65.2546,
  },
  {
    id: 'garcilazo',
    label: 'Zona Estadio / Garcilazo',
    addressSample: 'Av. Venezuela N° 320 · Zona Garcilazo, Sucre',
    lat: -19.0389,
    lng: -65.2589,
  },
];

export interface SucreTouristSpot {
  id: string;
  name: string;
  category: 'JOYRIDE' | 'BARES_NOCHE' | 'CHOCOLATE_GASTRO' | 'CULTURA' | 'MIRADOR' | 'AVENTURA';
  lat: number;
  lng: number;
  address: string;
  hours: string;
  walkTimeFromJoyRide: string;
  summary: string;
  tip: string;
  highlights: string[];
  imageUrl: string;
  images: string[];
}

export const SUCRE_TOURIST_SPOTS: SucreTouristSpot[] = [
  {
    id: 'joyride-hq',
    name: 'Joy Ride Café® — Tu Punto Base',
    category: 'JOYRIDE',
    lat: -19.04804,
    lng: -65.25973,
    address: 'Calle Nicolás Ortiz N° 14 (Frente a la Catedral)',
    hours: '07:00 – 02:30 todos los días · Happy Hour 18:00 – 21:00',
    walkTimeFromJoyRide: '0 min (Aquí estamos)',
    summary:
      'Clásico resto-bar desde 2001: desayunos de Cha’ki, Super Pique a lo Macho, cócteles Signature (The Hulk, Cucaracha, Chuflay), clases gratis de Salsa & Bachata y base de mountain bike.',
    tip: 'Arranca aquí con desayuno o vuelve a las 18:00 para Happy Hour 2x1 y Salsa gratis.',
    highlights: ['Happy Hour 2x1', 'Clases Salsa & Bachata', 'Mountain Bike Hub', 'Pagos QR / PayPal'],
    imageUrl: '/images/venue-patio-night.webp',
    images: [
      '/images/venue-patio-night.webp',
      '/images/venue-bar-cocktails.webp',
      '/images/venue-lounge-lights.webp',
      '/images/hero-joyride.webp',
    ],
  },
  {
    id: 'chocolates-para-ti',
    name: 'Chocolates Para Ti & Museo del Chocolate',
    category: 'CHOCOLATE_GASTRO',
    lat: -19.04712,
    lng: -65.26065,
    address: 'Calle Arenales N° 7 & Calle Audiencia N° 68',
    hours: '09:00 – 20:30 · Museo en Calle Monteagudo',
    walkTimeFromJoyRide: '2 min a pie',
    summary:
      'Chocolatería artesanal emblema de Sucre con bombones rellenos de singani, amaranto, quinua real, café boliviano y ají chuquisaqueño, además de su museo interactivo del cacao.',
    tip: 'Pasa a probar las trufas de singani y llévate recuerdos antes de volver al centro.',
    highlights: ['Bombones de Singani', 'Cacao Boliviano Amazónico', 'Degustación Artesanal'],
    imageUrl: '/images/sucre-chocolates.webp',
    images: [
      '/images/sucre-chocolates.webp',
      '/images/dish-brownie-2x1.webp',
      '/images/dish-cafe-altura.webp',
    ],
  },
  {
    id: 'el-purgatorium',
    name: 'El Purgatorium del Monasterio',
    category: 'BARES_NOCHE',
    lat: -19.04962,
    lng: -65.25842,
    address: 'Calle Daniel Calvo N° 138 (Terraza Hotel Monasterio)',
    hours: '17:30 – 01:00',
    walkTimeFromJoyRide: '4 min a pie',
    summary:
      'Bar lounge nocturno de estética monástica y bóvedas coloniales muy concurrido en Sucre para coctelería de autor y picadas antes o después de la ronda nocturna en Joy Ride.',
    tip: 'Ideal para armar ruta nocturna caminando entre Nicolás Ortiz 14 y Calle Calvo.',
    highlights: ['Bóvedas Coloniales', 'Coctelería de Autor', 'Ruta Bar Nocturna'],
    imageUrl: '/images/sucre-purgatorium.webp',
    images: [
      '/images/sucre-purgatorium.webp',
      '/images/experiencia-bar.webp',
      '/images/dish-negroni.webp',
    ],
  },
  {
    id: 'terraza-625',
    name: 'Terraza 625 (Parador Santa María La Real)',
    category: 'BARES_NOCHE',
    lat: -19.04682,
    lng: -65.25718,
    address: 'Calle Bolívar N° 625 (Centro Histórico)',
    hours: '16:00 – 00:30',
    walkTimeFromJoyRide: '5 min a pie',
    summary:
      'Rooftop bar panorámico en las alturas del centro histórico de Sucre con vista privilegiada a los campanarios coloniales, coctelería de autor y atardeceres dorados.',
    tip: 'Perfecta parada fotográfica al caer la tarde antes de bajar a nuestra fiesta de Salsa.',
    highlights: ['Rooftop Panorámico', 'Vista Ciudad Blanca', 'Atardeceres en Sucre'],
    imageUrl: '/images/sucre-rooftop-terraza.webp',
    images: [
      '/images/sucre-rooftop-terraza.webp',
      '/images/sucre-mirador-sunset.webp',
      '/images/dish-daiquiri.webp',
    ],
  },
  {
    id: 'plaza-25',
    name: 'Plaza 25 de Mayo & Casa de la Libertad',
    category: 'CULTURA',
    lat: -19.04775,
    lng: -65.25956,
    address: 'Plaza 25 de Mayo, Centro Histórico de Sucre',
    hours: 'Museo Mar–Sáb 09:00 – 18:30 · Plaza 24h',
    walkTimeFromJoyRide: '1 min a pie',
    summary:
      'Corazón histórico de la Ciudad Blanca donde se firmó el Acta de Independencia de Bolivia en 1825, rodeado de la Catedral Metropolitana, palmeras y arquitectura republicana.',
    tip: 'Está literalmente a media cuadra de Joy Ride Café®.',
    highlights: ['Acta de 1825', 'Patrimonio UNESCO', 'A 60 metros de Joy Ride'],
    imageUrl: '/images/sucre-colonial-museum.webp',
    images: [
      '/images/sucre-colonial-museum.webp',
      '/images/sucre-catedral.webp',
      '/images/hero-joyride.webp',
    ],
  },
  {
    id: 'recoleta',
    name: 'Mirador La Recoleta & Museo ASUR',
    category: 'MIRADOR',
    lat: -19.0546,
    lng: -65.2545,
    address: 'Plaza Pedro de Anzúrez (Zona La Recoleta)',
    hours: 'Mirador 24h · Museo ASUR 08:30 – 18:00',
    walkTimeFromJoyRide: '14 min subiendo',
    summary:
      'La vista panorámica más fotografiada de los tejados blancos de Sucre, arcos de piedra coloniales, café artesanal y el Museo de Arte Indígena textil Jalq’a y Tarabuco.',
    tip: 'Sube a las 17:15 para el sunset y baja directo al Happy Hour 2x1 de Joy Ride.',
    highlights: ['Tejados Blancos de Sucre', 'Arte Textil ASUR', 'Sunset Fotográfico'],
    imageUrl: '/images/sucre-mirador-sunset.webp',
    images: [
      '/images/sucre-mirador-sunset.webp',
      '/images/evento-tours.webp',
      '/images/sucre-catedral.webp',
    ],
  },
  {
    id: 'san-felipe',
    name: 'Convento de San Felipe Neri (Terrazas)',
    category: 'CULTURA',
    lat: -19.0493,
    lng: -65.2614,
    address: 'Calle Nicolás Ortiz N° 165',
    hours: 'Lun–Sáb 14:30 – 18:00',
    walkTimeFromJoyRide: '4 min a pie',
    summary:
      'Azoteas blancas caminables entre campanarios de teja roja, claustros neoclásicos y criptas sobre la misma Calle Nicolás Ortiz.',
    tip: 'Sal del convento por la tarde y baja por la misma calle directo a nuestra mesa.',
    highlights: ['Azoteas Caminables', 'Campanarios Históricos', 'Misma Calle que Joy Ride'],
    imageUrl: '/images/sucre-colonial-museum.webp',
    images: [
      '/images/sucre-colonial-museum.webp',
      '/images/sucre-mirador-sunset.webp',
    ],
  },
  {
    id: 'parque-bolivar',
    name: 'Parque Bolívar & Fuente del Bicentenario',
    category: 'MIRADOR',
    lat: -19.0428,
    lng: -65.2623,
    address: 'Av. del Maestro & Calle Dalence',
    hours: 'Abierto todos los días',
    walkTimeFromJoyRide: '8 min a pie',
    summary:
      'Alamedas arboladas estilo europeo con réplica en miniatura de la Torre Eiffel, jardines románticos, puente colgante y la Corte Suprema de Justicia.',
    tip: 'Zona favorita de estudiantes para pedir delivery con QR desde Joy Ride.',
    highlights: ['Torre Eiffel Sucrense', 'Aguas Danzantes Nocturnas', 'Zona Delivery Rápido'],
    imageUrl: '/images/hero-joyride.webp',
    images: [
      '/images/hero-joyride.webp',
      '/images/dish-cafe-altura.webp',
    ],
  },
  {
    id: 'mercado-central',
    name: 'Mercado Central de Sucre',
    category: 'CHOCOLATE_GASTRO',
    lat: -19.0454,
    lng: -65.2624,
    address: 'Calle Junín esq. Ravelo',
    hours: '06:30 – 19:00',
    walkTimeFromJoyRide: '5 min a pie',
    summary:
      'Colorido mercado patrimonial con jugos frescos de fruta de valle, ensaladas de frutas, chorizos chuquisaqueños, mondongo y quesillos locales.',
    tip: 'Recórrelo en la mañana y ven a Joy Ride para almorzar Pique a lo Macho o Trucha.',
    highlights: ['Jugos Frescos del Valle', 'Gastronomía Popular', 'Fruta & Flores'],
    imageUrl: '/images/dish-charque.webp',
    images: [
      '/images/dish-charque.webp',
      '/images/dish-plato-paceno.webp',
    ],
  },
  {
    id: 'cal-orcko',
    name: 'Parque Cretácico Cal Orck’o & Cráter de Maragua',
    category: 'AVENTURA',
    lat: -19.0131,
    lng: -65.2367,
    address: 'Zona Cal Orck’o / Punto Bike en Calle Nicolás Ortiz 14',
    hours: 'Parque Mar–Dom 09:00 – 17:00 · Bike Tours 07:30 AM',
    walkTimeFromJoyRide: '15 min en Dino Bus / Salida desde Joy Ride',
    summary:
      'Más de 5.000 huellas reales de dinosaurios sobre farallón calizo y espectaculares descensos en bicicleta de montaña por el Cráter de Maragua y Cordillera de los Frailes.',
    tip: 'El Dino Bus sale de Plaza 25 de Mayo (a media cuadra) y los tours bike parten desde Joy Ride.',
    highlights: ['Huellas de Dinosaurios', 'Mountain Bike Maragua', 'Salida Desayuno 07:00'],
    imageUrl: '/images/sucre-maragua-bike.webp',
    images: [
      '/images/sucre-maragua-bike.webp',
      '/images/evento-tours.webp',
      '/images/evento-grupos.webp',
    ],
  },
];
