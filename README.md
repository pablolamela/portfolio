# pablolamela.com

Personal portfolio of Pablo Lamela — live at **[pablolamela.com](https://pablolamela.com)**.

Built with Astro for fast static delivery, with React reserved for interactive
islands and client-side script boot. Motion is handled by GSAP and Lenis
smooth scroll.

## Tech stack

- **[Astro 5](https://astro.build)** + **TypeScript** — static site, file-based routing
- **Dart Sass** + native **CSS Modules** (Vite) — design tokens via Sass maps, BEM-ish naming
- **React 19** — interactive islands only (client-side script boot)
- **[GSAP](https://gsap.com)** — animations · **[Lenis](https://lenis.darkroom.engineering)** — smooth scroll · **split-type** — variable-weight hero effect
- **Prettier** — formatting

## Project structure

```text
src/
├── components/   # grouped by feature (boot/ fx/ layout/ project/ ui/); one folder per component (+ .module.scss + index.ts barrel)
├── layouts/      # Base.astro — root layout, imports globals.scss once
├── pages/        # .astro routes
├── styles/       # Sass builders (tokens, mixins, functions), globals, page-level *.module.scss
├── scripts/      # client JS (lenis, gsap gravity, hover)
└── data/ config/ images/ videos/
```

Path aliases: `@` → `src`, `~` → project root.

## Commands

| Command            | Action                                       |
| :----------------- | :------------------------------------------- |
| `npm install`      | Install dependencies                         |
| `npm run dev`      | Start dev server at `localhost:4321`         |
| `npm run build`    | Build production site to `./dist/`           |
| `npm run preview`  | Preview the production build locally         |
| `npm run format`   | Format the codebase with Prettier            |
| `npm run astro ...`| Run Astro CLI commands (`astro add`, `check`)|

## Conventions

Styling and component conventions (Sass tokens, CSS Modules naming, breakpoint
mixins, animation rules) are documented in [`CLAUDE.md`](./CLAUDE.md).

## Deployment

Deployed to **[pablolamela.com](https://pablolamela.com)** via GitHub Pages.
The workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml)
builds and deploys on every push to `main`.
