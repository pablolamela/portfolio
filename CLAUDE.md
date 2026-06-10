# CLAUDE.md — Sass + CSS Modules + Component Conventions (Astro)

Reglas de estilo y organización de este portfolio. Stack: **Astro 5 + TypeScript** con **Dart Sass** y **CSS Modules** nativos de Vite. React se usa **solo para islas interactivas** (boot de scripts cliente). Prioriza KISS: no añadas abstracciones hasta que se justifiquen con uso real.

> Este archivo adapta el sistema portable del scaffold (`_scaffold/CLAUDE.md`, pensado para Vite+React) a **Astro**. Donde Astro difiere de Vite puro, manda lo documentado aquí.

## Estructura de carpetas

```
src/
  components/
    <category>/                   ← boot | fx | layout | project | ui (agrupadas por feature)
      <ComponentName>/
        <ComponentName>.astro | .tsx
        <componentName>.module.scss
        index.ts                  ← barrel: export { default } from './X.astro' (o './X' para .tsx)
  layouts/
    Base.astro                    ← layout raíz; importa globals.scss una sola vez
  pages/                          ← rutas .astro (componen layout + componentes)
  styles/
    _builders.scss                ← entry: importa todos los builders, en orden
    builders/
      _variables.scss             ← $spaces, $colors, $layers, $navBar-height
      _functions.scss             ← get(), use-color(), use-space(), use-layer()
      _mixins.scss                ← font-size, circle-box, hide-scrollbar, ...
      _mediaqueries.scss          ← for-screen, for-screens-above/below/between
      _typography.scss            ← body-typo, label-typo, body-small-typo
      _appearance_mixins.scss     ← masonry-cols, column-grid, section-spacing
    globals.scss                  ← @import globals/reset + globals/body + hero + lenis
    globals/_reset.scss
    globals/_body.scss
    *.module.scss                 ← estilos a nivel de página (info, project, notfound, Sections)
  scripts/                        ← lógica JS de cliente (lenis, cursor, scramble)
  data/  config/  images/  videos/
```

El builder entry **se auto-inyecta** en cada `.scss` vía `astro.config.mjs → vite.css.preprocessorOptions.scss.additionalData` (`@import "builders";` + `loadPaths: [src/styles]`). **No** importes builders manualmente desde `.module.scss`. `globals.scss` se importa una sola vez desde `Base.astro`.

## Componentes

- **Agrupadas por feature en una categoría.** Cada componente vive en `components/<categoría>/<ComponentName>/`. Categorías actuales: `boot/` (islas de arranque cliente), `fx/` (efectos/interacción), `layout/` (chrome: navbar, footer, blur), `project/` (listado y navegación de proyectos), `ui/` (primitivas: button, toast). Agrupa por feature, **no** por nivel de abstracción; añade una categoría solo cuando se justifique.
- **Una carpeta por componente.** Carpeta en `PascalCase`. Archivo `.astro` (o `.tsx` para islas React) con el mismo nombre. Archivo `.module.scss` en `camelCase` (`navbar.module.scss`).
- **`index.ts` barrel:** `export { default } from './ComponentName.astro';` (para `.tsx`, sin extensión: `from './ComponentName'`). Permite imports limpios con alias: `import Navbar from '@/components/layout/Navbar'`.
- **Default export** del componente. Props tipadas inline (`export interface Props` en `.astro`, `type Props` en `.tsx`).
- **Sub-componentes acoplados** viven en la misma carpeta. Si se reusan fuera, sácalos a su propia carpeta.

## Alias de imports

`astro.config.mjs` (vite.resolve.alias) + `tsconfig.json` (paths) definen:
- `@` → `src` — úsalo para cruzar carpetas: `import Button from '@/components/ui/Button'`, `import { links } from '@/config/site'`, `import('@/scripts/lenis')`.
- `~` → raíz del proyecto.
- Relativo (`./x.module.scss`) solo dentro de la misma carpeta.
- **Astro.glob / import.meta.glob NO admiten alias** → usa rutas relativas (`../../pages/projects/*.astro`).

## CSS Modules

- **Import por defecto:** `import style from './foo.module.scss';` → `<div class={style.Foo}>`.
  - ⚠️ **Diferencia con el scaffold:** el scaffold (Vite/React) usa `import * as style`. En **Astro** los CSS Modules se tipan con `export default` (objeto con index signature), así que el import por defecto es el **type-safe** (`astro check` limpio) y el de namespace **no** lo es. Por eso aquí usamos `import style from`.
- **Nombres de clase en PascalCase** para el bloque raíz: `.Navbar`, `.Footer`, `.ProjectGrid`.
- **Hijos con sufijo `_elemento`** (snake_case): `.Navbar_inner`, `.ProjectGrid_thumbImg`.
- **Modificadores con `___modifier`** (triple underscore): `.Button___brand`.
- Es **BEM relajado con snake_case** — NO renombres a kebab-case. Los underscores son identifiers válidos en JS y permiten `style.Navbar_inner` sin bracket notation.
- Estilos a nivel de **página** viven en `src/styles/*.module.scss` y se importan con `import s from '...'`.

## Sass

- **No** uses CSS custom properties (`--var`) para tokens estáticos. Todo vía Sass maps con accessor functions:
  - Colores → `use-color('primary')`, `use-color('grey')`, `use-color('accent')`
  - Espacios → `use-space('s4')` (escala `s0`=4px … `s8`=64px)
  - Z-index → `use-layer('navbar')`, `use-layer('overlay')`
- **Excepción documentada — CSS custom properties permitidas para:**
  - **Tokens responsive** que cambian en breakpoints vía override en `:root`: `--space-120`, `--space-40`, `--space-24`, `--space-32`, `--space-10`, `--space-body-x`, `--blur-height`. (No tienen equivalente estático sin duplicar media queries en cada uso.)
  - **Valores dinámicos por JS**: `--x`/`--y` (cursor de ProjectGrid), y los puentes token→CSS var que lee JS en runtime: `--nav-h` (lenis, hero) y los colores de los fx (HeroScramble, GlyphDither).
- **Breakpoints SIEMPRE vía mixins.** Nunca `@media (min-width…)` raw para anchos:
  - `@include for-screen('xs'|'s'|'m'|'l')` — rango único
  - `@include for-screens-above('m')` / `for-screens-below('s')` / `for-screens-between('s','m')`
  - Breakpoints: `xs`:0 `s`:768 `m`:1024 `l`:1200. `@media (pointer: fine/coarse)` y breakpoints no estándar (p.ej. 640px) sí van raw.
- **Tipografía vía mixins:** `@include body-typo()` (16/1.5), `@include label-typo()` (16/1.2, w400), `@include body-small-typo()` (14/1.5). El **color** se pone en el call site (varía: primary vs grey), no en el mixin.
- **`@import` legacy** está permitido (KISS, igual que el scaffold). Dart Sass aún lo soporta.

## Tokens — referencia rápida (`builders/_variables.scss`)

```scss
$colors: (
  'background': #080808, 'background-opacity': rgba(8,8,8,.4),
  'primary': #f7f7f7, 'white': #fff, 'black': #000,
  'grey': #979797, 'accent': #ffab6c,            // ámbar — usar con restricción
);
$spaces: (s0:4px s1:8px s2:16px s3:24px s4:32px s5:40px s6:48px s7:56px s8:64px);
$layers: ('navbar':100, 'overlay':90, 'base':0);
$navBar-height: 72px;
```

Fuentes: Geist (body) y Geist Mono (labels, hero), variables vía Google Fonts. El reset global fuerza `font-weight:400` y `border-radius:0` en todo.

## Animaciones y scroll

- **GSAP:** encapsula en `gsap.context()` y limpia con `ctx.revert()`. Respeta `prefers-reduced-motion`.
- **Lenis:** instancia de scroll suave inicializada desde `src/scripts/lenis`; los estilos base de `.lenis` viven en `globals.scss`.
- **Boot cliente:** los scripts de cliente globales se cargan con islas React (`BootClient`) que hacen `import('@/scripts/...')` dinámico en `useEffect` (evita side-effects en SSR). Los efectos específicos de un componente (HeroScramble, GlyphDither, ProjectGrid) viven como `<script>` inline en su `.astro`, con re-init en `astro:page-load` y teardown en `astro:before-swap` cuando la página usa ClientRouter.

## Reglas mínimas de calidad

- **Stack único de estilos:** CSS Modules + Sass + mixins. **No** introduzcas Emotion, styled-components, Tailwind ni runtime CSS-in-JS.
- **No abstraigas** un componente hasta que se reuse ≥ 2 veces.
- **No crees archivos auxiliares** (`types.ts`, `utils.ts`) si caben en el `.tsx`/`.astro`.
- **No documentes el QUÉ.** Comenta solo el PORQUÉ no obvio.
- **No** modifiques `astro.config.mjs` o `tsconfig.json` sin explicar el porqué.

## Anti-patrones a evitar

- ❌ `style={{ color: '#fff' }}` inline (salvo valores dinámicos calculados en JS).
- ❌ `@media (min-width: 768px)` raw para anchos → usa `@include for-screens-above('s')`.
- ❌ `color: #fff;` hardcoded → `color: use-color('white');`.
- ❌ Importar builders manualmente en un `.module.scss` (ya se auto-inyectan).
- ❌ Rutas relativas largas entre carpetas (`../../components/...`) → usa el alias `@/`.
- ❌ Atomic design (atoms/molecules/organisms) — agrupa por feature, no por nivel de abstracción.

## Git

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `style:`, `chore:`, con scope: `feat(navbar): ...`.

## Cuando dudes

Lee `src/styles/builders/` para ver qué funciones/mixins ya existen antes de inventar. Reusa.
