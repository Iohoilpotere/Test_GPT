# Tank Arena

Tank Arena is a modular browser-based 3D tank sandbox showcasing SOLID-friendly architecture and classic design patterns. Drive your tank with **WASD**, aim with the **arrow keys**, and fire with **Space** inside a wall-bounded arena.

## Getting Started

```bash
npm install
npm run dev
```

Open the provided local URL to play. Use `npm run build` to generate a production bundle with Vite.

## Architecture Highlights

- **Observer + Singleton** for input propagation via `EventBus` and `InputManager`.
- **Abstract Factory** to build configurable tank components (`StandardTankFactory`).
- **Strategy** for interchangeable movement behaviour (`TankMovementStrategy`).
- **Decorator**-based weapon enhancements (`ExplosiveShotDecorator`).

The system emphasises modularity: swap factories, strategies, and decorators to customise tanks without touching the core game loop.

## GitHub Pages Deployment

The repository ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds the Vite application and publishes the generated `dist/` artifact to GitHub Pages. Every push to the `main`, `master`, or `work` branches triggers the pipeline:

1. Install dependencies in a clean Node.js 20 environment.
2. Run `npm run build` to emit the static bundle.
3. Upload and deploy the output to the GitHub Pages environment.

Thanks to the dynamic base path in `vite.config.js`, the bundle is automatically aligned to the repository name during CI, ensuring the site loads correctly from `https://<username>.github.io/<repository>/`.

### Enabling GitHub Pages for the repository

1. Navigate to **Settings → Pages** inside your GitHub repository.
2. Select **GitHub Actions** as the source and save.
3. Push to `main`, `master`, or `work` (or dispatch the workflow manually) to let the automation publish the latest build.
4. Copy the URL reported in the workflow’s **Deploy to GitHub Pages** step and share it so others can try the arena directly from the browser.

## Local Production Preview

To simulate the GitHub Pages build locally:

```bash
npm run build
npm run preview
```

`npm run preview` serves the optimised build with the same base path logic used in production, letting you validate asset loading
 before pushing changes.
