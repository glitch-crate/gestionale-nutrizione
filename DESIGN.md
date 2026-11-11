# Sistema di design — Studio Nutrizione

Questo documento è il riferimento per ogni scelta visiva del gestionale: font, colori, spazi,
componenti, movimento e tono. Prima di modificare l'interfaccia, leggilo. Se una scelta qui non
basta, aggiorna il documento insieme al codice.

## Contesto del prodotto
- **Cos'è:** il gestionale di uno studio di nutrizione, con due aree nello stesso progetto.
- **Per chi:**
  - **Studio** (`src/app/(studio)`): il professionista gestisce agenda, clienti, richieste di
    spostamento e impostazioni. Lavora soprattutto da computer.
  - **Portale** (`src/app/portale`): i clienti, dai 20 ai 75 anni, si registrano, prenotano e
    spostano gli appuntamenti. Lo usano soprattutto dal telefono.
- **Settore:** prenotazioni sanitarie e gestionali per studi (Doctolib, Jane, Healthie, Calendly).
  Sono tutti blu notte o viola e parlano di efficienza. Noi parliamo di cura.
- **Cosa deve ricordare un cliente la prima volta:** *cura e calma* — "qui sono in buone mani".

## Direzione estetica
- **Direzione:** *un quaderno, non un gestionale.* Carta calda, inchiostro, un solo segno di matita
  terracotta. L'app ricorda l'agenda di carta dello studio, non un software ospedaliero.
- **Decorazione:** intenzionale e minima. La tipografia fa quasi tutto il lavoro. L'unico
  ornamento ammesso è il bordo tratteggiato del biglietto di conferma.
- **Umore:** accogliente, ordinato, mai frettoloso. Nessun allarme, nessuna urgenza artificiale.
- **Riferimenti studiati:** doctolib.it, calendly.com, gethealthie.com, cal.com.

## Tipografia
Due famiglie, entrambe servite dal sito stesso con `next/font/google`: i file si scaricano durante
la build e il browser del cliente non contatta mai Google, quindi nessun problema di GDPR.

| Ruolo | Font | Uso |
|---|---|---|
| Titoli e domande | **Fraunces** corsivo, `SOFT 100` | Titoli di pagina, domande al cliente ("Quando ti fa comodo?"), gruppi ("Mattina"), data del biglietto. |
| Orari e numeri grandi | **Fraunces** dritto, `tabular-nums lining-nums` | Orari (pulsanti degli orari, agenda, calendario, biglietto), giorni del mese, numeri delle card. Le cifre hanno tutte la stessa larghezza, così gli orari restano in colonna. |
| Testo e interfaccia | **Atkinson Hyperlegible Next** | Testo, etichette, pulsanti, campi, tabelle, messaggi. Distingue bene lettere simili ("Il", "0/O"), anche su un telefono al sole. |

- **Perché non Atkinson per gli orari:** il suo zero è barrato. In un orario come "09:00" sembra un
  appuntamento cancellato e dà un'aria da terminale.
- **Mai:** Fraunces per etichette, pulsanti, campi o testo lungo. Mai una terza famiglia.
- **Pesi:** Atkinson 400 (testo), 600 (etichette, pulsanti), 700 (enfasi). Fraunces 400 (titoli),
  700 (orario del biglietto).

**Scala** (dimensione/interlinea in px):

| Livello | Valore | Font |
|---|---|---|
| Display | 40/44 (portale su telefono: 34/38) | Fraunces corsivo |
| Titolo | 28/34 | Fraunces corsivo |
| Sezione | 20/28 | Fraunces corsivo |
| Testo | 16/25 (portale: 17/26) | Atkinson |
| Etichetta | 14/20, peso 600 | Atkinson |
| Nota | 13/18 | Atkinson |
| Orario nei pulsanti | 17 | Fraunces dritto |
| Orario del biglietto | 44, peso 700 | Fraunces dritto |

## Colore
**Approccio sobrio:** un solo accento, il resto è carta e inchiostro. Il terracotta compare solo
sull'azione principale di ogni schermata. Se ne vedi due, uno è di troppo.

I nomi delle variabili sono quelli di `src/app/globals.css`.

| Nome | Variabile | Valore | Uso |
|---|---|---|---|
| Avorio | `--color-canvas` | `#f6f4ee` | Sfondo della pagina |
| Carta | `--color-surface` | `#ffffff` | Card, campi, pannelli |
| Inchiostro | `--color-ink` | `#20261f` | Testo principale (14,06:1 sull'avorio) |
| Grafite | `--color-muted` | `#646a5d` | Testo secondario (5,08:1). **Era `#6f7568`, 4,32:1: sotto il minimo.** |
| Filo | `--color-line` | `#e4e0d3` | Bordi sottili |
| Pino | `--color-pine` | `#16261e` | Barra laterale dello studio |
| Pino chiaro | `--color-pine-light` | `#24382d` | Voce attiva o al passaggio del mouse |
| Testo su pino | `--color-pine-text` / `--color-pine-text-muted` | `#e9ece5` / `#9fab9c` | Testo nella barra (6,60:1 il secondario) |
| Terracotta | `--color-accent` | `#ad5330` | Azione principale; testo bianco sopra (5,18:1) |
| Terracotta scuro | `--color-accent-hover` | `#8f4326` | Passaggio del mouse; testo sull'argilla |
| Salvia | `--color-salvia` (nuovo) | `#dfe6da` | Fascia di intestazione del portale |
| Argilla | `--color-argilla` (nuovo) | `#f1dfd3` | Orario scelto; testo in `#8f4326` (5,41:1). Mai terracotta normale sopra (4,00:1). |

**Stati dell'appuntamento** (testo su sfondo, tutti almeno AA):

| Stato | Testo | Sfondo | Contrasto |
|---|---|---|---|
| Da confermare | `#8a5f14` | `#f6ecd8` | 4,80:1. **Era `#b8862c`, 2,76:1: illeggibile.** |
| Confermato | `#2f6b4f` | `#e4efe7` | 5,33:1 |
| Completato | `#5b6258` | `#ecebe5` | 5,28:1 |
| Annullato / errore | `#a04a3a` | `#f3e4df` | 4,80:1 |

- Gli avvisi di successo usano i colori di "Confermato", quelli di errore i colori di "Annullato".
- Ogni nuovo colore di testo va verificato: almeno 4,5:1 per il testo normale (livello AA).
- **Tema scuro:** non previsto per ora. Se servirà, si ridisegnano le superfici sul pino
  (sfondo `#121a15`, carta `#1a241e`) e si schiariscono gli accenti, senza invertire i colori.

## Spaziatura
- **Unità di base:** 4px. Scala: 4, 8, 12, 16, 20, 24, 32, 48, 64.
- **Densità:** *comoda* nello studio (righe di tabella 12px sopra e sotto, card con 16–20px di
  margine interno), *ariosa* nel portale (24px tra i blocchi, 22px di margine laterale su
  telefono).
- I pulsanti degli orari e quelli principali sono alti almeno 44px, per il tocco col dito.

## Layout
- **Studio:** barra laterale pino fissa e contenuto su griglia. Su schermi stretti la barra si
  chiude.
- **Portale:** una sola colonna, larghezza massima 480px. Su telefono l'azione principale sta in
  basso, a portata di pollice.
- **Allineamento:** a sinistra. Niente pagine tutte centrate.
- **Angoli:**
  - 8px per pulsanti, campi e pulsanti degli orari (`rounded-lg`);
  - 12px per card e pannelli (`rounded-xl`);
  - 20px solo in alto per il pannello che sale dal basso;
  - a pillola solo per i badge di stato.

## Componenti chiave
- **Pulsanti:**
  - primario terracotta, uno per schermata;
  - secondario bianco con bordo;
  - "fantasma", cioè solo testo sottolineato, per le azioni minori;
  - le azioni distruttive chiedono conferma in linea ("Annullare l'appuntamento?" → "Sì,
    annulla" / "No").
- **Link di testo:** terracotta, più scuro al passaggio del mouse. Non contano come azione
  principale. Le azioni secondarie nelle righe di una lista (per esempio "Sposta") restano in
  inchiostro.
- **Campi:** etichetta sopra, a 14px. Al focus il bordo diventa terracotta con un alone leggero.
  L'errore compare sotto il campo, in colore errore, e dice cosa fare ("manca il dominio, per
  esempio @gmail.com").
- **Badge di stato:** a pillola, con un pallino del colore del testo, peso 600.
- **Scelta dell'orario (portale):** vedi la regola "Solo orari liberi" qui sotto.
- **Biglietto di conferma (portale):** carta bianca, data in Fraunces corsivo, orario grande in
  Fraunces dritto terracotta, linea tratteggiata con due mezzelune ai lati e, sotto, studio,
  promemoria e regola delle 24 ore. Ricorda il cartoncino che gli studi danno al cliente.

## Regole del portale
1. **Solo orari liberi.**
   - Il cliente vede soltanto gli orari disponibili, divisi in *Mattina* e *Pomeriggio*, sotto la
     domanda *"Quando ti fa comodo?"*.
   - Ogni gruppo mostra circa 4 orari, gli altri sono dietro "Altri orari".
   - Mai griglie di orari occupati in grigio, mai "ultimi posti", mai conti alla rovescia: la
     scarsità crea ansia.
2. **Conferma come frase.** Toccato un orario, sale un pannello che dice la prenotazione per esteso
   ("Martedì 17 alle 10:40 · Primo incontro, 45 minuti") con un solo pulsante: "Conferma".
3. **Il biglietto chiude il percorso.** Dopo la prenotazione compare il biglietto con "Ti
   aspettiamo." sopra.

## Movimento
- **Approccio:** minimo e calmo. Niente rimbalzi, lampeggi o ingrandimenti.
- **Curve:** in entrata `cubic-bezier(.2,.7,.2,1)`, in uscita `ease-in`.
- **Durate:**
  - 150ms per i passaggi del mouse e la selezione di un orario (cambio di colore);
  - 240ms per il pannello di conferma che sale dal basso;
  - 400ms per il biglietto che si posa (sale di 8px e compare).
- Con `prefers-reduced-motion` (l'impostazione del dispositivo che chiede meno animazioni) il
  movimento è disattivato: gli elementi compaiono direttamente.

## Tono dei testi
- Si dà del tu al cliente, con frasi brevi e voce umana: "Ti aspettiamo.", "Quando ti fa comodo?".
- I messaggi d'errore dicono cosa fare, non cosa è andato storto internamente.
- Date e orari si scrivono solo con i formattatori di `src/lib/format.ts`.

## Anteprima
L'anteprima interattiva del sistema (font, colori, componenti, schermate di prenotazione, biglietto
e dashboard) è stata generata durante la definizione del sistema e non fa parte del progetto.

## Registro delle decisioni
| Data | Decisione | Motivo |
|---|---|---|
| 11/11/2026 | Sistema di design definito: si evolve la base esistente (avorio, pino, terracotta) | È già coerente e si distingue dal settore, tutto blu e viola. |
| 11/11/2026 | Fraunces per i titoli, Atkinson Hyperlegible Next per il testo, serviti con `next/font` | Prima i font di sistema cambiavano da un dispositivo all'altro (Georgia su Windows). Clienti di ogni età leggono dal telefono. |
| 11/11/2026 | Orari e numeri in Fraunces dritto con cifre allineate | Lo zero barrato di Atkinson fa sembrare "09:00" un orario cancellato. |
| 11/11/2026 | Grafite `#646a5d` e "Da confermare" `#8a5f14` | I valori precedenti erano sotto il contrasto minimo AA (4,32:1 e 2,76:1). |
| 11/11/2026 | Nuovi colori Salvia e Argilla | Fascia del portale e orario scelto, senza aggiungere un secondo accento. |
| 11/11/2026 | Portale: solo orari liberi e biglietto di conferma | Calma invece di scarsità; il biglietto è il momento in cui il cliente si sente in buone mani. |
| 11/11/2026 | Scartata la dashboard raccontata in una frase | Il professionista preferisce le card con i numeri in vista. |
