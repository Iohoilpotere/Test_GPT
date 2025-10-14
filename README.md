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

## Arena di addestramento dinamica

- Un **carro bersaglio nemico** presiede l'arena: quando i suoi HP raggiungono lo zero esplode con un effetto particellare e torna operativo dopo 3 secondi per continuare l'allenamento.
- Tutti i proiettili si disintegrano **solo all'impatto** con pavimento, muri o veicoli, evitando despawn a mezz'aria; le varianti con Decorator generano esplosioni che infliggono danni d'area a tutti i bersagli nel raggio.
- Gli impatti generano **highlight dinamici** sui carri (rossi quando subiscono danni, tematici per i power-up attivi) e un **floating combat text** che riporta a schermo il danno effettivo nel punto d'impatto.
- Il **mortaio** opera su un arco elevato dedicato (60°–90°) con limiti dinamici di elevazione rispetto al cannone e alla mitragliatrice.
- Collisioni fisiche tra carro giocatore e bersaglio sfruttano una hitbox box-aligned aderente allo scafo, evitando sovrapposizioni innaturali durante gli ingaggi ravvicinati.
- Un **HUD contestuale** mostra in tempo reale i punti vita residui e la velocità corrente del carro controllato, facilitando il bilanciamento dei preset.
- Quattro **power-up temporanei** (riparazione, potenziamento danni, turbo e scudo) si materializzano agli angoli dell'arena, durano 10 secondi e possono sovrapporsi mantenendo highlight colorati indipendenti.
- Una rampa inclinata permette di testare la **fisica con gravità**: i carri si appoggiano al terreno, scalano pendii e si riallineano automaticamente grazie al `TerrainSampler` condiviso.

## Power-up e feedback visivo

- `PowerUpManager` gestisce lo spawn ciclico dei pickup e delega a `TankStatusManager` l'attivazione degli effetti temporanei.
- Ogni effetto sfrutta Decorator specifici: `DamageBoostWeaponDecorator` moltiplica i danni senza toccare l'arma base, `SpeedBoostMovementDecorator` estende la Strategy di movimento e gli scudi agiscono come modificatori runtime.
- `MeshHighlightDecorator` avvolge lo scafo del carro aggiungendo highlight emissivi sovrapponibili, mentre `FloatingCombatTextManager` converte le coordinate mondo → schermo per visualizzare i danni in overlay.

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
- **Decorator** per gli effetti opzionali delle armi (`ExplosiveShotDecorator`, `DamageBoostWeaponDecorator`), per il movimento (`SpeedBoostMovementDecorator`) e per l'evidenziazione (`MeshHighlightDecorator`).
- **Factory Method** per istanziare le famiglie di armi tramite i preset (`WeaponPresets`).
- **Manager contestuale** `TankStatusManager` orchestra i power-up attivi e convoglia modifiche a danni/rigenerazioni.
- **Utility di fisica** `TerrainSampler` calcola l'altezza del terreno/rampa via raycast, mantenendo i carri aderenti al suolo con gravità costante.

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
