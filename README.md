# Arena Battle 👑

Mini strategia in tempo reale in stile arena battaglia, sviluppata con **React + Vite + Tailwind CSS** e rendering su `<canvas>`.

## Come si gioca
- **Trascina** una carta sul campo (o selezionala e clicca sulla mappa) per schierare le unità.
- Scorciatoie da tastiera: **1–4** per selezionare le carte, **Invio** per iniziare/rigiocare.
- Partita da **3 minuti**; nell'ultimo minuto l'**elisir si rigenera al doppio**.
- Distruggi una torre nemica per guadagnare una corona ed espandere la tua zona di schieramento.
- La corona nemica ("king tower") si attiva dopo la prima torre distrutta.
- Parità allo scadere → **morte improvvisa**: la prima corona vince; se il tempo extra finisce, vince chi ha la torre più integra.

## Carte disponibili
Spadaccino, Balestriere, Branco di Lupi, Ariete d'Assedio, Piromante, Cavaliere, Guardia, Assassino, Stregone, Golem di Pietra — ognuna con costi, statistiche e ruoli diversi (tank, supporto a distanza, sciame, danno ad area).

## Sviluppo
```bash
npm install
npm run dev      # server di sviluppo
npm run build    # build di produzione in dist/
npm run lint     # oxlint
```
