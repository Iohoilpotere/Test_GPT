# Changelog

## [0.0.5.0] - 2025-10-14
- Ridotta ulteriormente la portata e la velocità effettiva dei colpi applicando accelerazioni dedicate per ogni arma.
- Configurata la torretta del mortaio con un arco invertito (150°–180°) e limiti dinamici di elevazione rispetto alle altre armi.
- Implementate collisioni tra carro giocatore e bersaglio con hitbox aderente allo scafo e riallineamento al perimetro dell'arena.

## [0.0.4.0] - 2025-10-14
- Limitata la portata effettiva di cannone, mitragliatrice e mortaio, parametrizzando velocità, lifetime e distanza massima dei
  proiettili.
- Aggiunto un carro bersaglio controllato dal gioco che esplode alla distruzione e respawna automaticamente dopo 3 secondi.
- Introdotto un HUD contestuale con indicatori di HP e velocità del carro alleato, oltre a effetti di esplosione riutilizzabili
  per gli impatti.

## [0.0.3.1] - 2025-10-14
- Differenziate visivamente le armi dotando ogni cannone di una geometria e palette dedicate applicate tramite la factory del carro.
- Aggiunto il fuoco automatico quando la barra spaziatrice resta premuta, sincronizzato con il cooldown di ciascuna arma.
- Introdotto il controllo di elevazione della canna con le frecce su/giù, mantenendo i limiti di puntamento configurabili per preset.
- Aggiornata la documentazione per descrivere i nuovi controlli e le varianti estetiche delle armi.

## [0.0.3.0] - 2025-10-14
- Added a runtime loadout menu with Observer-driven events so players can swap tank hulls and weapons without restarting the mat
ch.
- Introduced three tank preset families (Ricognitore, Assaltatore, Juggernaut) with dedicated stats and movement tuning via the
 Abstract Factory.
- Delivered three distinct primary weapons (cannone HE, mitragliatrice pesante, mortaio) including arcing projectiles and Decor
ator-powered area effects.
- Refreshed the HUD, styling, and documentation to illustrate the new equipment system.

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
