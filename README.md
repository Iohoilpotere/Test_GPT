# Tank Arena

Tank Arena è un sandbox 3D modulare per browser che dimostra un'architettura rispettosa dei principi SOLID e un uso consapevole
dei design pattern classici. Guida il tuo carro con **WASD**, ruota la torretta con le **frecce sinistra/destra**, regola l'elevazione della canna con le **frecce su/giù** e tieni premuta la **Barra spaziatrice** per il fuoco automatico all'interno di un'arena delimitata da mura.

## Loadout dinamico in runtime

Un **menu di equipaggiamento** (loadout) laterale permette di cambiare istantaneamente il tipo di carro armato e l'arma primaria
. Ogni opzione aggiorna in tempo reale le statistiche esposte:

- **Carri**: Ricognitore, Assaltatore, Juggernaut – con valori dedicati di salute, armatura, velocità e manovrabilità.
- **Armi**: Cannone HE, Mitragliatrice Pesante, Mortaio a Caduta – con danno, rateo di fuoco, raggio, velocità del proiettile e una canna dedicata con geometria/colore distinti.

Il cambio avviene senza interrompere la sessione grazie all'Abstract Factory che ricostruisce le componenti del carro e al facto
ry method per le armi.

## Getting Started

```bash
npm install
npm run dev
```

Apri l'URL locale indicato da Vite per giocare. Usa `npm run build` per generare il bundle di produzione.

## Architecture Highlights

- **Observer + Singleton** per l'input e gli eventi UI tramite `EventBus`, `InputManager` e `LoadoutMenu`.
- **Abstract Factory** per assemblare le componenti del carro (`StandardTankFactory`) a partire dai preset.
- **Strategy** per i comportamenti di movimento intercambiabili (`TankMovementStrategy`).
- **Decorator** per gli effetti opzionali delle armi (`ExplosiveShotDecorator`).
- **Factory Method** per istanziare le famiglie di armi tramite i preset (`WeaponPresets`).

La struttura enfatizza la modularità: sostituisci preset, strategie e decoratori per ottenere varianti di gameplay senza toccar
 e il game loop.

## GitHub Pages Deployment

Il repository include una workflow GitHub Actions (`.github/workflows/deploy.yml`) che compila automaticamente l'applicazione Vi
te e pubblica l'artefatto `dist/` su GitHub Pages. Ogni push ai branch `main`, `master` o `work` attiva la pipeline:

1. Installazione dipendenze in un ambiente Node.js 20 pulito.
2. Esecuzione di `npm run build` per produrre il bundle statico.
3. Upload e deploy dell'output verso l'ambiente GitHub Pages.

Grazie al path base dinamico in `vite.config.js`, il sito si allinea automaticamente al nome del repository durante la CI, garan
 t endo il caricamento corretto da `https://<username>.github.io/<repository>/`.

### Abilitare GitHub Pages

1. Vai su **Settings → Pages** del repository GitHub.
2. Seleziona **GitHub Actions** come sorgente e salva.
3. Esegui un push su `main`, `master` o `work` (o avvia manualmente il workflow) per pubblicare l'ultima build.
4. Copia l'URL mostrato nello step **Deploy to GitHub Pages** per condividere il gioco direttamente da browser.

## Anteprima di produzione locale

Per simulare la build GitHub Pages in locale:

```bash
npm run build
npm run preview
```

`npm run preview` espone il build ottimizzato con la stessa logica di base path usata in produzione, così da validare il caricam
ento delle risorse prima del push.
