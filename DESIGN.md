# DESIGN.md — Sistema de Diseño Oficial Joy Ride Café® Sucre

## 1. Dirección de Arte y Paleta Cromática (Regla 60-30-10)
Derivada directamente del emblema circular oficial (`/logo-joyride.png`): aro negro nocturno, semicírculo superior cian eléctrico y ola inferior magenta neón.

| Rol Cromático | Token CSS | Hex | Uso Exacto |
|---|---|---|---|
| **60% Base / Fondo** | `--bg-obsidian` | `#0B0D12` | Lienzo principal oscuro nocturno |
| **60% Superficie** | `--bg-surface` | `#141821` | Tarjetas de producto, Bento tiles, paneles laterales |
| **60% Elevación** | `--bg-elevated` | `#1B2130` | Modales, drawers, hover de superficies, tablas |
| **Borde estructural** | `--border-hairline` | `#262C3A` | Líneas divisorias `1px solid`, inputs y bordes de card |
| **Texto principal** | `--text-ink` | `#F8FAFC` | Títulos, precios principales, etiquetas activas |
| **Texto secundario** | `--text-muted` | `#94A3B8` | Descripciones, horarios, metadatos |
| **30% Primario Marca** | `--brand-cyan` | `#00A0DF` | Navegación activa, enlaces, iconos clave, estados `EN_CAMINO` / `PAGO_CONFIRMADO`, gráficos secundarios |
| **30% Primario Profundo** | `--brand-cyan-deep` | `#0082B8` | Hover sobre botones/elementos cian |
| **10% Acento Impacto** | `--brand-magenta` | `#F20574` | CTA principal ("Pedir", "Confirmar Pago QR"), badges *Happy Hour 2x1*, alertas de stock crítico |
| **Semánticos** | `--status-success` / `warn` / `danger` | `#10B981` / `#F59E0B` / `#EF4444` | Siempre acompañados de ícono + etiqueta textual (WCAG 1.4.1) |

## 2. Tipografía y Escala
- **Display (`font-display`):** `Syne` (700, 800) — exclusivo para el titular Hero, títulos de sección editoriales y números de impacto. Tracking `-0.02em`, `line-height: 1.05`.
- **UI & Cuerpo (`font-sans`):** `Plus Jakarta Sans` (400, 500, 600, 700) — navegación, tarjetas, formularios, paneles operativos (`Operate` mode). Cuerpo mínimo `1rem` (`16px`), inputs móviles mínimo `16px` (`text-base sm:text-sm`) para prevenir zoom automático en iOS.
- **Monoespaciada (`font-mono`):** `JetBrains Mono` (400, 500, 600, 700) con `font-variant-numeric: tabular-nums` obligatorio en precios (`Bs. 68.00` / `$ 9.77`), contadores regresivos, códigos `JR-XXXX`, tokens QR, PINs de entrega y timestamps.

## 3. Reglas de Superficie, Movimiento y Anti-Slop
- **Skeleton Shimmers Obligatorios:** Todo estado de carga renderiza bloques esqueleto con `@keyframes shimmer` (`background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.03) 100%)`). Cero spinners circulares en toda la aplicación.
- **Fotografías:** Todas las imágenes fotográficas aplican `outline: 1px solid rgba(255,255,255,0.1); outline-offset: -1px;` y transición suave `scale(1.03)` dentro de `overflow-hidden`.
- **Radios concéntricos:** Si una tarjeta exterior tiene `rounded-2xl` (`16px`) y `p-3` (`12px`), el marco interior de imagen o contenido usa `rounded-lg` o `rounded-xl` coherente (`outer >= inner + padding` cuando hay borde pegado, o superficies separadas si padding >= 24px).
- **Motion:** Framer Motion envuelto en `<MotionConfig reducedMotion="user">`. Springs sin rebote (`bounce: 0`, `duration: 0.32`). Presión en botones `active:scale-[0.96]`. Scroll contenido en modales y drawers con `overscroll-behavior: contain`.
- **Prohibiciones absolutas:** Sin kickers/eyebrows arriba de títulos `h2`, sin gradientes en texto, sin sombras duras `4px 4px 0`, sin barras decorativas unilaterales en cajas redondeadas, sin emojis sustituyendo íconos (`lucide-react` exclusivo).

## 4. Arquitectura de los 5 Layouts Obligatorios
1. **Hero Full Bleed (`HeroFullBleed`):** Portada `min-h-screen` con `/images/hero-joyride.webp`, overlay editorial oscuro, logo oficial `/logo-joyride.png`, estado en vivo de Sucre / Happy Hour y CTAs claros.
2. **Bento Grid (`BentoPromotions`):** Grid de 12 columnas asimétrico con celdas `col-span-6 row-span-2`, `col-span-3 row-span-2`, `col-span-3` destacando Happy Hour 2x1 con cuenta regresiva, stock vivo, clases de Salsa & Bachata, 2x1 Postres y acceso directo a Reserva/Rastreo.
3. **Editorial Asimétrico + Menú AJAX (`EditorialCultureAndMenu`):** Columna asimétrica 5/7 con fotografía de la Catedral de Sucre y música en vivo + carta interactiva con filtros AJAX en tiempo real y control de stock vivo.
4. **Masonry Layout (`MasonryCommunity`):** Mampostería multi-columna real (`columns-1 sm:columns-2 lg:columns-3`) combinando fotos de eventos, reseñas verificadas y combos agregables en 1 clic.
5. **Split Screen (`AuthSplitPage`):** 50/50 altura completa con arte oficial Joy Ride a la izquierda y login/registro + barra desplegable de acceso demo 1-clic (5 roles) a la derecha.
