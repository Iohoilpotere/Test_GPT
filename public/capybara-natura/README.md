# Capybara Club — La vita, con calma

Sito completo in italiano in HTML, CSS e JavaScript senza framework.

Sito pubblico: https://iohoilpotere.github.io/Test_GPT/capybara-natura/
Codice online: https://github.com/Iohoilpotere/Test_GPT/tree/main/public/capybara-natura

## Avvio
Aprire `index.html` in un browser moderno. Per i media esterni serve Internet.
In alternativa, nella cartella: `python -m http.server 8080` e aprire http://localhost:8080.
Non servono npm, backend, API key o account.

## File e funzionalità
- index.html: Hero fotografica, informazioni e habitat, galleria di sei foto, due video, FAQ, fonti e crediti.
- styles.css: design beige/salvia/verde bosco, griglie responsive, animazioni, modalità stampa e movimento ridotto.
- app.js: menu mobile, filtri, dialog fotografico accessibile con tastiera e swipe, video su richiesta, condivisione e preferenze temporanee sulle animazioni.
- tests/test_site.py: controlli strutturali (richiede beautifulsoup4).
- tests/browser_smoke.py: test Chromium locali (richiede playwright e Chromium); le richieste esterne sono bloccate durante questi test.

## Pubblicazione
Il progetto è aggiunto esclusivamente in `public/capybara-natura/` del repository Test_GPT.
Vite lo copia in `dist/capybara-natura/`; il workflow GitHub Pages esistente lo pubblica.
Nessun file del gioco o degli altri micrositi viene sostituito.

## Media, fonti e privacy
Le sei fotografie sono caricate da Wikimedia Commons. Nel footer e nella galleria sono indicati autori, originali e licenze individuali. Il ritaglio è responsive via CSS; le licenze fotografiche restano applicabili anche agli adattamenti. Le immagini non sono incluse nel pacchetto offline.
I caratteri sono caricati da Google Fonts con fallback di sistema. Non si distribuiscono file font.
I video YouTube sono caricati solo dopo il clic, con youtube-nocookie.com. Ogni video ha collegamenti alternativi a YouTube e Wikimedia. La disponibilità e la riproduzione dipendono dai servizi esterni, dal browser e dalla rete.
Non sono aggiunti analytics, form, account, cookie applicativi o salvataggio locale. I fornitori esterni ricevono i dati tecnici necessari per servire le risorse.
Fonti informative: San Diego Zoo Wildlife Alliance e Cleveland Metroparks, collegate nel footer.

## Verifiche
`node --check app.js`
`python -m unittest discover -s tests -v`
`python tests/browser_smoke.py`

Sette test strutturali superati. Test UI Chromium a 320, 375, 768 e 1440 px superati: niente overflow orizzontale; menu, filtri, galleria, tastiera, apertura/chiusura dei player e contenuti senza JavaScript. I test locali non certificano la riproduzione o disponibilità dei media esterni.
