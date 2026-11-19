export type LangMode = 'es' | 'en' | 'pt' | 'de' | 'ru' | 'zh';
export type ForeignLangMode = Exclude<LangMode, 'es'>;

export interface LangMeta {
  id: LangMode;
  code: string;
  label: string;
  native: string;
}

export const SUPPORTED_LANGS: LangMeta[] = [
  { id: 'es', code: 'ES', label: 'Español', native: 'Español' },
  { id: 'en', code: 'EN', label: 'English', native: 'English' },
  { id: 'pt', code: 'PT', label: 'Português', native: 'Português' },
  { id: 'de', code: 'DE', label: 'Deutsch (CH)', native: 'Deutsch · Schweiz' },
  { id: 'ru', code: 'RU', label: 'Русский', native: 'Русский' },
  { id: 'zh', code: 'ZH', label: '中文', native: '中文' },
];

type TranslationEntry = Record<ForeignLangMode, string>;

export const UI_TRANSLATIONS: Record<string, TranslationEntry> = {
  // Navbar & Navigation
  Inicio: { en: 'Home', pt: 'Início', de: 'Startseite', ru: 'Главная', zh: '首页' },
  'Inicio · La Casona': { en: 'Home · La Casona', pt: 'Início · La Casona', de: 'Start · La Casona', ru: 'Главная · Дом', zh: '首页 · 老宅' },
  Carta: { en: 'Menu', pt: 'Cardápio', de: 'Speisekarte', ru: 'Меню', zh: '菜单' },
  'Toda la Carta Joy Ride': { en: 'Full Joy Ride Menu', pt: 'Todo o Cardápio Joy Ride', de: 'Komplette Joy-Ride-Karte', ru: 'Всё меню Joy Ride', zh: 'Joy Ride 全部菜单' },
  'Explorar Carta Completa': { en: 'Explore Full Menu', pt: 'Explorar Cardápio Completo', de: 'Ganze Karte entdecken', ru: 'Открыть всё меню', zh: '浏览完整菜单' },
  Promos: { en: 'Promos', pt: 'Promoções', de: 'Angebote', ru: 'Акции', zh: '优惠' },
  Reservas: { en: 'Book', pt: 'Reservas', de: 'Reservieren', ru: 'Бронь', zh: '预订' },
  'Mapa Sucre': { en: 'Sucre Map', pt: 'Mapa Sucre', de: 'Sucre-Karte', ru: 'Карта Сукре', zh: '苏克雷地图' },
  'Mis Pedidos': { en: 'My Orders', pt: 'Meus Pedidos', de: 'Bestellungen', ru: 'Мои заказы', zh: '我的订单' },
  'Mis Pedidos & Reservas': { en: 'My Orders & Bookings', pt: 'Meus Pedidos e Reservas', de: 'Bestellungen & Tische', ru: 'Заказы и брони', zh: '我的订单与预订' },
  'Mis Pedidos & PIN de Entrega': { en: 'My Orders & Delivery PIN', pt: 'Pedidos e PIN de Entrega', de: 'Bestellungen & Liefer-PIN', ru: 'Заказы и ПИН доставки', zh: '订单与收货PIN码' },
  Pedido: { en: 'Order', pt: 'Pedido', de: 'Warenkorb', ru: 'Заказ', zh: '购物车' },
  Ingresar: { en: 'Sign In', pt: 'Entrar', de: 'Anmelden', ru: 'Войти', zh: '登录' },
  'Cerrar Sesión': { en: 'Sign Out', pt: 'Sair', de: 'Abmelden', ru: 'Выйти', zh: '退出登录' },
  'Ir a Panel Operativo': { en: 'Open Staff Panel', pt: 'Painel Operacional', de: 'Team-Bereich', ru: 'Панель персонала', zh: '进入员工后台' },
  Claro: { en: 'Light', pt: 'Claro', de: 'Hell', ru: 'Светлая', zh: '浅色' },
  Oscuro: { en: 'Dark', pt: 'Escuro', de: 'Dunkel', ru: 'Тёмная', zh: '深色' },
  '2x1 ACTIVO': { en: '2x1 ACTIVE', pt: '2x1 ATIVO', de: '2für1 AKTIV', ru: '2x1 АКТИВНО', zh: '买一送一进行中' },
  'Reservar Zona / Clases de Salsa': { en: 'Book Area / Salsa Classes', pt: 'Reservar Área / Aulas de Salsa', de: 'Tisch / Salsa-Kurse buchen', ru: 'Столик / Уроки сальсы', zh: '预订区域 / 萨尔萨舞课' },
  'Mapa Turístico de Sucre': { en: 'Sucre Tourist Map', pt: 'Mapa Turístico de Sucre', de: 'Sucre Touristenkarte', ru: 'Туристическая карта Сукре', zh: '苏克雷旅游地图' },

  // Hero & Key Actions
  'Happy Hour 2x1 activo ahora': { en: '2x1 Happy Hour Live Now', pt: 'Happy Hour 2x1 Agora', de: '2für1 Happy Hour Jetzt', ru: 'Счастливый час 2x1 сейчас', zh: '快乐时光 买一送一 进行中' },
  'Abierto hoy hasta las 02:30': { en: 'Open Tonight Until 02:30', pt: 'Aberto hoje até 02:30', de: 'Heute offen bis 02:30', ru: 'Открыто сегодня до 02:30', zh: '今晚营业至 02:30' },
  'Reservas y pedidos programados': { en: 'Scheduled Orders & Table Bookings', pt: 'Reservas e pedidos programados', de: 'Reservierungen & Vorbestellungen', ru: 'Бронь столов и предзаказы', zh: '接受桌位与预约点餐' },
  'Desde 2001 frente a la Catedral Metropolitana de Sucre. Pique a lo Macho, Singani Chuflay, cervezas bien frías, café boliviano de altura y noches de Salsa & Bachata. Pide al instante con QR, Tarjeta o PayPal y sigue cada paso hasta tu puerta con PIN.': {
    en: 'Facing Sucre’s Metropolitan Cathedral since 2001. Pique a lo Macho, Singani Chuflay, ice-cold craft beers, high-altitude Bolivian coffee, and Salsa & Bachata nights. Order instantly with QR, Card or PayPal and track every step with your personal PIN.',
    pt: 'Desde 2001 em frente à Catedral de Sucre. Pique a lo Macho, Singani Chuflay, cervejas bem geladas, café boliviano de altitude e noites de Salsa & Bachata. Peça com QR, Cartão ou PayPal e acompanhe cada etapa com PIN.',
    de: 'Seit 2001 direkt gegenüber der Kathedrale von Sucre. Pique a lo Macho, Singani Chuflay, eiskalte Biere, bolivianischer Hochlandkaffee und Salsa- & Bachata-Abende. Per QR, Karte oder PayPal bestellen & mit PIN verfolgen.',
    ru: 'С 2001 года напротив Кафедрального собора Сукре. Pique a lo Macho, коктейли с сингани, холодное пиво, высокогорный кофе Боливии и вечера сальсы и бачаты. Оплата QR, картой или PayPal с отслеживанием по ПИН-коду.',
    zh: '自2001年起坐落于苏克雷大教堂对面。招牌美食、玻利维亚高原咖啡、特色鸡尾酒及萨尔萨舞之夜。支持QR扫码、银行卡或PayPal下单并全程PIN码追踪。',
  },
  'Explorar la Carta': { en: 'Explore Menu', pt: 'Explorar Cardápio', de: 'Speisekarte ansehen', ru: 'Открыть меню', zh: '浏览菜单' },
  'Pedir con Delivery / QR': { en: 'Order / Table / QR', pt: 'Pedir Agora / QR', de: 'Bestellen / Tisch / QR', ru: 'Заказать / Стол / QR', zh: '立即点餐 / QR支付' },
  'Reservar Zona': { en: 'Book a Table', pt: 'Reservar Mesa', de: 'Tisch reservieren', ru: 'Забронировать стол', zh: '预订桌位' },

  // Bento & Promotions
  'Ritmo Joy Ride en Sucre': { en: 'Joy Ride Rhythm in Sucre', pt: 'Ritmo Joy Ride em Sucre', de: 'Joy-Ride-Rhythmus in Sucre', ru: 'Ритм Joy Ride в Сукре', zh: 'Joy Ride 苏克雷节奏' },
  '2x1 en Barra, Cocina & Pista': { en: 'Daily 2x1 Bar & Music', pt: '2x1 no Bar, Cozinha e Pista', de: '2für1 an Bar & Küche', ru: '2x1 на баре и кухне', zh: '酒吧、厨房与舞池 买一送一' },
  'Promociones vivas desde nuestra cocina y barra, eventos nocturnos y disponibilidad al instante.': {
    en: 'Promotions straight from kitchen and bar, nightly dance events, and instant availability.',
    pt: 'Promoções direto da nossa cozinha e bar, eventos noturnos e disponibilidade instantânea.',
    de: 'Aktuelle Angebote aus Küche & Bar, Tanzabende und Echtzeit-Verfügbarkeit.',
    ru: 'Акции от нашей кухни и бара, ночные вечеринки и актуальное наличие блюд.',
    zh: '来自厨房与吧台的每日优惠、夜间活动及实时库存。',
  },
  'Mapa Turístico Sucre': { en: 'Sucre City Map', pt: 'Mapa Turístico de Sucre', de: 'Stadtplan Sucre', ru: 'Гид по Сукре', zh: '苏克雷旅游地图' },
  'Rastrear mi Pedido': { en: 'Track My Order', pt: 'Rastrear Pedido', de: 'Bestellung verfolgen', ru: 'Отследить заказ', zh: '追踪我的订单' },
  'Filtrar Veganos': { en: 'Filter Vegan', pt: 'Filtrar Veganos', de: 'Vegan filtern', ru: 'Веган меню', zh: '筛选素食' },
  'Ver Ítems 2x1 en Carta': { en: 'View 2x1 Items', pt: 'Ver Itens 2x1', de: '2für1-Artikel ansehen', ru: 'Смотреть позиции 2x1', zh: '查看买一送一餐品' },
  'Reservar Pista + Pase QR': { en: 'Book Dancefloor + QR Pass', pt: 'Reservar Pista + QR', de: 'Tanzfläche + QR buchen', ru: 'Танцпол + QR-пропуск', zh: '预订舞池与QR通行证' },
  'Opciones Veganas, Quinua Real & Postres 2x1': { en: 'Vegan Picks, Royal Quinoa & 2x1 Desserts', pt: 'Opções Veganas, Quinoa Real e Sobremesas 2x1', de: 'Vegan, Royal Quinoa & 2für1 Desserts', ru: 'Веган, киноа и десерты 2x1', zh: '纯素食、高原藜麦及甜点买一送一' },
  'Vegano & 2x1 Postres': { en: 'Vegan & 2x1 Sweets', pt: 'Vegano e 2x1 Doces', de: 'Vegan & 2für1 Süßes', ru: 'Веган и десерты 2x1', zh: '纯素与甜点优惠' },
  'Ver detalle →': { en: 'View detail →', pt: 'Ver detalhe →', de: 'Details →', ru: 'Подробнее →', zh: '查看详情 →' },
  'Ver catálogo 2x1 →': { en: 'View 2x1 list →', pt: 'Ver catálogo 2x1 →', de: '2für1 ansehen →', ru: 'Меню 2x1 →', zh: '查看买一送一 →' },

  // Venue Showcase & Heritage
  '25 años de chimenea, montaña y noches en Sucre': { en: '25 years of hearth, mountains & Sucre nights', pt: '25 anos de lareira, montanha e noites em Sucre', de: '25 Jahre Kamin, Berge & Nächte in Sucre', ru: '25 лет у камина, горных туров и ночей в Сукре', zh: '25年壁炉温暖、山地骑行与苏克雷之夜' },
  'Nacido en 2001 a media cuadra de la Plaza 25 de Mayo, Joy Ride Café® reunió en una sola casona colonial los desayunos de viajeros, descensos en mountain bike por la Cordillera de los Frailes, gastronomía boliviana y una pista multicultural.': {
    en: 'Born in 2001 half a block from Plaza 25 de Mayo, Joy Ride Café® brings together traveler breakfasts, mountain bike descents in Cordillera de los Frailes, Bolivian cuisine and a multicultural dance floor.',
    pt: 'Nascido em 2001 a meia quadra da Plaza 25 de Mayo, o Joy Ride Café® reúne em um casarão colonial cafés da manhã, mountain bike na Cordilheira dos Frailes, culinária boliviana e pista multicultural.',
    de: 'Seit 2001 einen halben Block von der Plaza 25 de Mayo vereint das Joy Ride Café® Reisenden-Frühstück, Mountainbike-Touren in den Kordilleren, bolivianische Küche und eine lebendige Tanzfläche.',
    ru: 'Основанный в 2001 году в полуквартале от площади 25 Мая, Joy Ride Café® объединяет завтраки для путешественников, велотуры по горам, боливийскую кухню и танцпол.',
    zh: '2001年创立于五月二十五日广场旁，这座殖民老宅汇聚了旅行者早餐、山地车探险、玻利维亚美食及多元文化舞池。',
  },
  'Desayunos energéticos desde las 07:00 AM y rutas a Maragua': { en: 'Early breakfasts from 07:00 AM & Maragua bike tours', pt: 'Cafés energéticos desde 07:00 e rotas a Maragua', de: 'Frühstück ab 07:00 Uhr & Maragua Bike-Touren', ru: 'Завтраки с 07:00 и веломаршруты в Марагуа', zh: '早7点起供应能量早餐及马拉瓜骑行路线' },
  'Recorrido visual por la casona': { en: 'Visual tour inside the casona', pt: 'Passeio visual pelo casarão', de: 'Einblick in das Kolonialhaus', ru: 'Визуальный тур по дому', zh: '老宅实景导览' },
  'Así se vive Joy Ride por dentro': { en: 'Life Inside Joy Ride Café®', pt: 'Por dentro do Joy Ride Café®', de: 'So fühlt sich Joy Ride von innen an', ru: 'Атмосфера внутри Joy Ride Café®', zh: '感受 Joy Ride 内部氛围' },
  'Pausar pase': { en: 'Pause reel', pt: 'Pausar', de: 'Pause', ru: 'Пауза', zh: '暂停播放' },
  Reproducir: { en: 'Play reel', pt: 'Reproduzir', de: 'Abspielen', ru: 'Воспроизвести', zh: '播放' },
  'Ver Galería Completa': { en: 'Full Gallery', pt: 'Galeria Completa', de: 'Alle Fotos', ru: 'Вся галерея', zh: '查看完整画廊' },
  'Favoritos de Cocina & Barra': { en: 'Kitchen & Bar Favorites', pt: 'Favoritos da Cozinha e Bar', de: 'Favoriten aus Küche & Bar', ru: 'Фавориты кухни и бара', zh: '厨房与吧台招牌推荐' },
  'Favoritos listos para pedir ahora': { en: 'House Picks Ready to Order', pt: 'Favoritos prontos para pedir', de: 'Beliebte Gerichte direkt bestellen', ru: 'Популярные блюда готовые к заказу', zh: '立即点单的人气招牌' },
  'Ver Carta Completa (Platos y Barra)': { en: 'Explore Full Menu', pt: 'Ver Cardápio Completo', de: 'Komplette Speisekarte', ru: 'Смотреть всё меню', zh: '查看完整菜单' },
  'Ir a la Carta Completa': { en: 'Go to Full Menu', pt: 'Ir ao Cardápio Completo', de: 'Zur gesamten Karte', ru: 'Перейти в меню', zh: '前往完整菜单' },

  // Events & Sucre Map
  'Probablemente los mejores eventos en Sucre': { en: 'Live Agenda & White City Route', pt: 'Agenda Viva e Rota Cidade Branca', de: 'Events & Sucre Stadtrundgang', ru: 'События и маршрут по Сукре', zh: '精彩活动与白色之城路线' },
  'Eventos del Local & Ruta Turística Sucre': { en: 'Venue Events & Sucre Tourist Route', pt: 'Eventos e Rota Turística de Sucre', de: 'Haus-Events & Sucre Touristenroute', ru: 'События заведения и тур по Сукре', zh: '店内活动与苏克雷观光路线' },
  'Noches en Nicolás Ortiz 14, Chocolates Para Ti, El Purgatorium, Terraza 625 y miradores coloniales conectados directo con nuestra ruta interactiva.': {
    en: 'Nights at Nicolás Ortiz 14, Chocolates Para Ti, El Purgatorium, Terraza 625 and colonial viewpoints linked directly to our interactive map.',
    pt: 'Noites na Nicolás Ortiz 14, Chocolates Para Ti, El Purgatorium, Terraza 625 e mirantes coloniais conectados no nosso mapa interativo.',
    de: 'Abende an der Nicolás Ortiz 14, Chocolates Para Ti, El Purgatorium, Terraza 625 und Aussichtspunkte auf unserer Karte.',
    ru: 'Вечера на Николас Ортис 14, Chocolates Para Ti, El Purgatorium, Terraza 625 и смотровые площадки на интерактивной карте.',
    zh: '结合尼古拉斯奥尔蒂斯14号之夜、手工巧克力博物馆、观景露台与互动导览地图。',
  },
  'Ver Info, Galería y Ruta': { en: 'See Info, Gallery & Route', pt: 'Ver Info, Galeria e Rota', de: 'Info, Galerie & Route', ru: 'Инфо, фото и маршрут', zh: '查看详情、图集与路线' },
  'Ubicar en Mapa Sucre': { en: 'Pin on Sucre Map', pt: 'Ver no Mapa', de: 'Auf Karte zeigen', ru: 'На карте Сукре', zh: '在地图中定位' },
  'Ver Ruta en Mapa Sucre': { en: 'View Route on Sucre Map', pt: 'Ver Rota no Mapa', de: 'Route auf Karte öffnen', ru: 'Маршрут на карте', zh: '在地图查看路线' },
  'Todos los puntos': { en: 'All spots', pt: 'Todos os pontos', de: 'Alle Orte', ru: 'Все места', zh: '全部地点' },
  'Bares & Terrazas': { en: 'Bars & Rooftops', pt: 'Bares e Terraços', de: 'Bars & Dachterrassen', ru: 'Бары и террасы', zh: '酒吧与露台' },
  'Chocolates & Gastro': { en: 'Chocolates & Food', pt: 'Chocolates e Gastro', de: 'Schokolade & Küche', ru: 'Шоколад и кухня', zh: '巧克力与美食' },
  'Cultura & Museos': { en: 'Culture & Museums', pt: 'Cultura e Museus', de: 'Kultur & Museen', ru: 'Культура и музеи', zh: '文化与博物馆' },
  Miradores: { en: 'Viewpoints', pt: 'Mirantes', de: 'Aussichtspunkte', ru: 'Смотровые', zh: '观景台' },
  'Aventura & Bike': { en: 'Adventure & Bike', pt: 'Aventura e Bike', de: 'Abenteuer & Bike', ru: 'Туры и байки', zh: '探险与骑行' },
  'Guía interactiva de la Ciudad Blanca: ubica nuestra casona en Nicolás Ortiz N° 14, Chocolates Para Ti, El Purgatorium, Terraza 625 y traza rutas a pie desde tu ubicación.': {
    en: 'Interactive White City guide: locate Nicolás Ortiz N° 14, Chocolates Para Ti, El Purgatorium, Terraza 625 and trace walking routes from your GPS.',
    pt: 'Guia interativo da Cidade Branca: localize nossa casa, Chocolates Para Ti, El Purgatorium, Terraza 625 e trace rotas a pé pelo GPS.',
    de: 'Interaktiver Führer durch die Weiße Stadt: finde Nicolás Ortiz 14, Chocolates Para Ti, El Purgatorium und Fußwege per GPS.',
    ru: 'Интерактивный гид по Белом городе: найдите наш бар, Chocolates Para Ti, El Purgatorium, Terraza 625 и проложите пеший маршрут.',
    zh: '白色之城互动指南：定位老宅与周边地标，从您当前位置规划步行路线。',
  },
  'Volver a Joy Ride Café®': { en: 'Back to Joy Ride Café®', pt: 'Voltar ao Joy Ride Café®', de: 'Zurück zu Joy Ride Café®', ru: 'Назад в Joy Ride Café®', zh: '返回 Joy Ride Café®' },
  'Volver al Inicio': { en: 'Back to Home', pt: 'Voltar ao Início', de: 'Zurück zur Startseite', ru: 'На главную', zh: '返回首页' },
  'Usar mi Ubicación GPS': { en: 'Use my GPS Location', pt: 'Usar minha localização GPS', de: 'Meinen GPS-Standort nutzen', ru: 'Моё местоположение GPS', zh: '使用我的GPS定位' },
  'Actualizar mi GPS': { en: 'Refresh my GPS', pt: 'Atualizar GPS', de: 'GPS aktualisieren', ru: 'Обновить GPS', zh: '刷新GPS定位' },
  'Cómo llegar a Joy Ride': { en: 'Directions to Joy Ride', pt: 'Como chegar ao Joy Ride', de: 'Wegbeschreibung Joy Ride', ru: 'Как добраться до Joy Ride', zh: '导航前往 Joy Ride' },

  // Community & Reviews
  'Voces de Sucre & Viajeros': { en: 'Sucre & Traveler Voices', pt: 'Vozes de Sucre e Viajantes', de: 'Stimmen aus Sucre & Reisenden', ru: 'Отзывы местных и гостей', zh: '苏克雷本地与旅行者声音' },
  'Noches & Reseñas en la Casona': { en: 'Nights & Reviews at the Casona', pt: 'Noites e Avaliações no Casarão', de: 'Abende & Bewertungen vor Ort', ru: 'Вечера и отзывы гостей', zh: '老宅之夜与食客评价' },
  'Experiencias de sucrenses y viajeros que pasaron por Nicolás Ortiz N° 14. Comparte tu reseña con tu cuenta Joy Ride.': {
    en: 'Stories from locals and travelers who visited Nicolás Ortiz N° 14. Share your own review with your Joy Ride account.',
    pt: 'Experiências de moradores e viajantes na Nicolás Ortiz N° 14. Compartilhe sua avaliação com sua conta Joy Ride.',
    de: 'Erlebnisse von Einheimischen und Reisenden an der Nicolás Ortiz 14. Teile deine Bewertung mit deinem Konto.',
    ru: 'Впечатления жителей Сукре и туристов на Николас Ортис 14. Оставьте свой отзыв через аккаунт Joy Ride.',
    zh: '来自苏克雷本地人与全球旅行者的真实回忆。登录 Joy Ride 账号即可分享您的评价。',
  },
  'Dejar Reseña': { en: 'Write Review', pt: 'Escrever Avaliação', de: 'Bewertung schreiben', ru: 'Оставить отзыв', zh: '写下评价' },
  'Planificar Evento o Mesa': { en: 'Plan Event or Table', pt: 'Planejar Evento ou Mesa', de: 'Event oder Tisch planen', ru: 'Событие или столик', zh: '预约活动或餐桌' },

  // Menu / Carta
  'Carta de Platos, Barra & Café': { en: 'Full Menu, Cocktails & Coffee', pt: 'Cardápio, Coquetéis e Café', de: 'Speisen, Cocktails & Kaffee', ru: 'Блюда, коктейли и кофе', zh: '美食、鸡尾酒与咖啡菜单' },
  'Calle Nicolás Ortiz N° 14 · Cocina & Barra Continua': { en: 'Nicolás Ortiz N° 14 · All-Day Kitchen & Bar', pt: 'Nicolás Ortiz N° 14 · Cozinha e Bar Contínuos', de: 'Nicolás Ortiz 14 · Durchgehend Küche & Bar', ru: 'Николас Ортис 14 · Кухня и бар', zh: '尼古拉斯奥尔蒂斯14号 · 全天候厨房与吧台' },
  'Toca cualquier tarjeta para voltearla como cartilla de bar, consultar maridaje y pedir al instante con disponibilidad verificada.': {
    en: 'Tap any card to flip open our bar booklet, explore pairings, and order with verified kitchen stock.',
    pt: 'Toque em qualquer card para abrir como cardápio, ver harmonização e pedir na hora.',
    de: 'Karte antippen zum Umblättern, Pairing entdecken und direkt bestellen.',
    ru: 'Нажмите на карточку, чтобы перевернуть её как меню бара, узнать сочетания и заказать.',
    zh: '点击任意餐品卡片即可翻页查看搭配推荐并立即下单。',
  },
  'Orden: Carta Joy Ride': { en: 'Sort: Joy Ride Sections', pt: 'Ordem: Seções do Cardápio', de: 'Sortierung: Bereiche', ru: 'Порядок: По разделам', zh: '排序：按菜单分类' },
  'Recomendados de la Casa': { en: 'House Favorites', pt: 'Destaques da Casa', de: 'Haus-Empfehlungen', ru: 'Рекомендации заведения', zh: '主厨推荐' },
  'Precio: menor a mayor': { en: 'Price: Low to High', pt: 'Preço: menor para maior', de: 'Preis: aufsteigend', ru: 'Цена: по возрастанию', zh: '价格：从低到高' },
  'Precio: mayor a menor': { en: 'Price: High to Low', pt: 'Preço: maior para menor', de: 'Preis: absteigend', ru: 'Цена: по убыванию', zh: '价格：从高到低' },
  'Preparación más rápida': { en: 'Fastest Prep', pt: 'Preparo mais rápido', de: 'Schnellste Zubereitung', ru: 'Быстрое приготовление', zh: '出餐最快' },
  'Mayor disponibilidad': { en: 'Most Available', pt: 'Maior estoque', de: 'Beste Verfügbarkeit', ru: 'В наличии больше всего', zh: '库存充足' },
  'Buscar pique, chuflay, burger…': { en: 'Search dishes, cocktails…', pt: 'Buscar pratos, drinques…', de: 'Gerichte, Drinks suchen…', ru: 'Поиск блюд и напитков…', zh: '搜索菜品或饮品…' },
  'Toda la Carta': { en: 'Full Menu', pt: 'Todo Cardápio', de: 'Alles', ru: 'Всё меню', zh: '全部菜品' },
  Vegano: { en: 'Vegan', pt: 'Vegano', de: 'Vegan', ru: 'Веган', zh: '素食' },
  Picante: { en: 'Spicy', pt: 'Picante', de: 'Scharf', ru: 'Острое', zh: '辣味' },
  'Voltear Carta': { en: 'Flip Card', pt: 'Virar Card', de: 'Karte drehen', ru: 'Перевернуть', zh: '翻转卡片' },
  Agregar: { en: 'Add', pt: 'Adicionar', de: 'Hinzufügen', ru: 'Добавить', zh: '加入' },
  Ampliar: { en: 'Details', pt: 'Detalhes', de: 'Details', ru: 'Детали', zh: '详情' },
  Agotado: { en: 'Sold out', pt: 'Esgotado', de: 'Ausverkauft', ru: 'Распродано', zh: '已售罄' },
  'Sin stock': { en: 'Out of stock', pt: 'Sem estoque', de: 'Nicht verfügbar', ru: 'Нет в наличии', zh: '暂无库存' },
  disp: { en: 'left', pt: 'disp.', de: 'frei', ru: 'ост.', zh: '份' },
  'disp.': { en: 'left', pt: 'disp.', de: 'verf.', ru: 'ост.', zh: '余' },
  'Restablecer Carta': { en: 'Reset Filters', pt: 'Limpar Filtros', de: 'Filter zurücksetzen', ru: 'Сбросить фильтры', zh: '重置筛选' },

  // Cart & Dine-in (CONSUMO_LOCAL)
  'Tu Pedido Joy Ride': { en: 'Your Joy Ride Order', pt: 'Seu Pedido Joy Ride', de: 'Deine Joy Ride Bestellung', ru: 'Ваш заказ Joy Ride', zh: '您的 Joy Ride 订单' },
  'Confirmación inmediata con cocina y barra': { en: 'Instant kitchen & bar dispatch', pt: 'Confirmação imediata na cozinha e bar', de: 'Direkt an Küche & Bar', ru: 'Мгновенная передача на кухню', zh: '直连后厨与吧台确认' },
  'Tu pedido está vacío': { en: 'Your order is empty', pt: 'Seu pedido está vazio', de: 'Dein Warenkorb ist leer', ru: 'Корзина пуста', zh: '您的购物车是空的' },
  'Modalidad de Entrega': { en: 'Order Mode', pt: 'Modalidade do Pedido', de: 'Bestellart', ru: 'Способ получения', zh: '用餐/配送方式' },
  'Delivery Sucre': { en: 'Delivery Sucre', pt: 'Delivery Sucre', de: 'Lieferung Sucre', ru: 'Доставка по Сукре', zh: '苏克雷外送' },
  'En el Local (Mesa)': { en: 'Dine-in (At Table)', pt: 'No Local (Mesa)', de: 'Vor Ort (Tisch)', ru: 'В зале (за стол)', zh: '堂食（送到餐桌）' },
  'Recoger en Local': { en: 'Pick up in Bar', pt: 'Retirar no Local', de: 'Abholen vor Ort', ru: 'Самовывоз из бара', zh: '到店自取' },
  'Tu mesa o zona en la casona': { en: 'Your table or zone inside', pt: 'Sua mesa ou área no local', de: 'Dein Tisch oder Bereich', ru: 'Ваш столик или зона в зале', zh: '您在店内的区域与桌号' },
  'N° de Mesa / Barra': { en: 'Table / Bar #', pt: 'Nº da Mesa / Balcão', de: 'Tischnummer / Bar', ru: 'Номер столика / бара', zh: '桌号 / 吧台号' },
  'Envío Sucre': { en: 'Sucre Delivery', pt: 'Entrega Sucre', de: 'Lieferung Sucre', ru: 'Доставка', zh: '外送费' },
  'Gratis (Local)': { en: 'Free (In Venue)', pt: 'Grátis (Local)', de: 'Gratis (Vor Ort)', ru: 'Бесплатно', zh: '免费（店内/自取）' },
  'Subtotal productos': { en: 'Items subtotal', pt: 'Subtotal dos itens', de: 'Zwischensumme', ru: 'Подытог', zh: '商品小计' },
  'Método de Pago': { en: 'Payment Method', pt: 'Forma de Pagamento', de: 'Zahlungsart', ru: 'Способ оплаты', zh: '支付方式' },
  Tarjeta: { en: 'Card', pt: 'Cartão', de: 'Karte', ru: 'Карта', zh: '银行卡' },
  Depósito: { en: 'Deposit', pt: 'Depósito', de: 'Überweisung', ru: 'Перевод', zh: '银行转账' },
  'Pagar con Tarjeta': { en: 'Pay with Card', pt: 'Pagar com Cartão', de: 'Mit Karte zahlen', ru: 'Оплатить картой', zh: '银行卡支付' },
  'Generar QR de Pago': { en: 'Generate Payment QR', pt: 'Gerar QR de Pagamento', de: 'QR-Code erstellen', ru: 'Создать QR оплаты', zh: '生成付款二维码' },
  'Enviar Comprobante a Caja': { en: 'Send Receipt to Cashier', pt: 'Enviar Comprovante', de: 'Beleg an Kasse senden', ru: 'Отправить чек в кассу', zh: '发送转账凭证' },
  'Dividir la cuenta entre amigos': { en: 'Split the bill with friends', pt: 'Dividir a conta com amigos', de: 'Rechnung unter Freunden teilen', ru: 'Разделить счёт на друзей', zh: '与朋友AA分摊账单' },
  'Cuota por amigo:': { en: 'Share per person:', pt: 'Por pessoa:', de: 'Pro Person:', ru: 'С каждого:', zh: '每人应付：' },
  'Zona en Sucre (para ruta en mapa)': { en: 'Sucre Zone (for delivery route)', pt: 'Bairro em Sucre', de: 'Zone in Sucre (Route)', ru: 'Район в Сукре (маршрут)', zh: '苏克雷区域（用于配送路线）' },

  // Reservations & Orders
  'RESERVA DE MESA': { en: 'TABLE BOOKING', pt: 'RESERVA DE MESA', de: 'TISCHRESERVIERUNG', ru: 'БРОНЬ СТОЛИКА', zh: '餐桌预订' },
  'PISTA SALSA & BACHATA': { en: 'SALSA & BACHATA FLOOR', pt: 'PISTA SALSA & BACHATA', de: 'SALSA & BACHATA TANZFLÄCHE', ru: 'ТАНЦПОЛ САЛЬСА И БАЧАТА', zh: '萨尔萨与巴恰塔舞池' },
  'Reservar Mesa & Clases de Salsa': { en: 'Book a Table & Salsa Classes', pt: 'Reservar Mesa e Aulas de Salsa', de: 'Tisch & Salsa-Kurse buchen', ru: 'Бронь столика и уроки сальсы', zh: '预订餐桌及萨尔萨舞课程' },
  'Confirmar Reserva y Pase QR': { en: 'Confirm Booking & QR Pass', pt: 'Confirmar Reserva e Passe QR', de: 'Reservierung & QR bestätigen', ru: 'Подтвердить бронь и QR', zh: '确认预订并获取QR通行证' },
  'Seguir Pedido': { en: 'Track Order', pt: 'Acompanhar Pedido', de: 'Bestellung ansehen', ru: 'Отследить заказ', zh: '追踪订单进度' },
  'Seguimiento paso a paso con PIN': { en: 'Step-by-step tracking with PIN', pt: 'Acompanhamento passo a passo com PIN', de: 'Schritt-für-Schritt mit PIN', ru: 'Пошаговое отслеживание с ПИН', zh: '全程PIN码实时进度追踪' },

  // Transitions & PWA
  'Cerrando sesión…': { en: 'Signing out…', pt: 'Encerrando sessão…', de: 'Abmelden…', ru: 'Выход из системы…', zh: '正在安全退出…' },
  '¡Hasta la próxima ronda en Nicolás Ortiz N° 14!': {
    en: 'See you for the next round at Nicolás Ortiz N° 14!',
    pt: 'Até a próxima rodada na Nicolás Ortiz N° 14!',
    de: 'Bis zur nächsten Runde an der Nicolás Ortiz N° 14!',
    ru: 'До следующей встречи на Николас Ортис 14!',
    zh: '期待在尼古拉斯奥尔蒂斯14号再次相聚！',
  },
  'Descargar en tu Celular (App)': { en: 'Install App on Phone', pt: 'Instalar App no Celular', de: 'Als App installieren', ru: 'Установить приложение', zh: '安装到手机桌面' },
  'Instalar App Joy Ride': { en: 'Install Joy Ride App', pt: 'Instalar App Joy Ride', de: 'Joy Ride App installieren', ru: 'Установить приложение Joy Ride', zh: '安装 Joy Ride 应用' },
};
