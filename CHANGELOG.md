# Changelog

## [0.0.2.3] - 2025-10-14
- Align turret model orientation with the hull so the cannon sits level on the chassis.
- Ensure projectiles follow the turret's world rotation, keeping shots consistent with the cannon direction.

## [0.0.2.2] - 2025-10-14
- Prevent GitHub Pages workflow failures by removing the npm cache configuration that required a lock file.
- Clarify deployment reliability improvements tied to the workflow change.

## [0.0.2.1] - 2025-10-14
- Fix GitHub Pages deployment pipeline by configuring Pages in CI and deploying from the `work` branch as well as `main`/`master`.
- Document updated branch support for automated deployments.

## [0.0.2.0] - 2025-10-14
- Added GitHub Actions workflow to build and deploy the Vite bundle to GitHub Pages.
- Configured dynamic Vite base path for repository-aware GitHub Pages hosting.
- Documented automated deployment steps and local production preview workflow.

## [0.0.1.0] - 2024-05-14
- Initial playable 3D tank arena with modular architecture and design-pattern-driven components.
- Added Abstract Factory-based tank creation and Decorator-enhanced weapon system.
- Implemented Observer-driven input handling and extensible movement strategies.
