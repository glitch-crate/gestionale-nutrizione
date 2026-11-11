# Ricerca UX — Gestionale Studio Nutrizione

**Tipo di analisi:** valutazione esperta (euristica) del prodotto, ricostruita leggendo il codice
dell'interfaccia. **Non** si basa su dati di utenti reali: non esistono ancora interviste,
analytics o segnalazioni.

- Le personas qui sotto sono **proto-personas**, cioè ipotesi da verificare. Confidenza: bassa.
- I problemi di usabilità sono invece osservati direttamente nel codice, con il file di riferimento.
- Il piano di test (sezione 5) serve a confermare o smentire tutto con persone vere.

---

## 1. Proto-personas

### Persona A — Francesca, la nutrizionista titolare
| | |
|---|---|
| Ruolo | Libera professionista, studio con un solo professionista |
| Dispositivo | Computer allo studio; telefono tra una visita e l'altra |
| Competenza digitale | Media: usa email, WhatsApp, un calendario |
| Frequenza d'uso | Tutti i giorni lavorativi, molte volte al giorno, per pochi minuti |
| Obiettivo principale | Sapere chi arriva oggi e tenere l'agenda in ordine senza telefonate |
| Obiettivi secondari | Ridurre i "no-show", gestire gli spostamenti, avere i contatti a portata di mano |
| Frustrazioni probabili | Doppie prenotazioni, clienti che non si presentano, perdere tempo al telefono |
| Citazione ipotetica | "Voglio aprire il gestionale e capire in 5 secondi com'è la mia giornata." |

**Implicazioni di design**
- La dashboard deve dire la verità al primo sguardo: numeri corretti, giornata di oggi in alto.
- Le azioni frequenti (conferma, sposta, annulla) devono essere rapide, ma quelle distruttive vanno
  protette.
- Sul telefono deve funzionare almeno la consultazione della giornata.

### Persona B — Marco, il cliente del portale
| | |
|---|---|
| Ruolo | Paziente, nuovo o già seguito |
| Dispositivo | Quasi solo telefono |
| Competenza digitale | Variabile: da molto bassa a buona |
| Frequenza d'uso | Rara: una prenotazione ogni 2–6 settimane |
| Obiettivo principale | Prenotare o spostare una visita in meno di un minuto |
| Frustrazioni probabili | Password dimenticata, non capire se la prenotazione è andata a buon fine, non sapere come contattare lo studio |
| Citazione ipotetica | "Ho prenotato? Mi arriva una conferma?" |

**Implicazioni di design**
- Ogni passaggio deve dare una conferma chiara, anche via email.
- I contatti dello studio devono essere sempre visibili: annullare si può solo chiamando.
- Va pensato per chi usa il portale di rado: niente da ricordare tra una visita e l'altra.

### Persona C — chi installa il prodotto (acquirente)
Titolare dello studio o un suo consulente, che riceve la cartella e deve metterla online. Il suo
percorso è coperto da `/installa-database` e da `supabase/README.md`. Non è analizzato qui, ma va
incluso nei test (sezione 5).

---

## 2. Journey map

### 2.1 Cliente: dalla registrazione alla visita
Emozione: 1 = frustrato, 5 = soddisfatto (stima).

| Fase | Azioni | Punto di contatto | Emozione | Problemi | Opportunità |
|---|---|---|---|---|---|
| Registrazione | Compila nome, telefono, email, password; accetta la privacy | `/portale/registrati` | 3 | Form lungo su telefono; deve aspettare l'email di conferma | Spiegare subito "ti arriva un'email" (già presente) |
| Conferma email | Apre l'email e clicca il link | Email di Supabase | 2 | L'email può finire nello spam; il testo è quello standard di Supabase | Personalizzare il template e il mittente |
| Primo accesso | Login, poi arriva sulla prenotazione | `/portale/login` → `/portale/prenota` | 4 | — | — |
| Prenotazione | Sceglie il giorno e l'orario, conferma con un tocco | `/portale/prenota` | 4 | Nessuna email di conferma della prenotazione | Email di conferma con data, ora e indirizzo |
| Attesa | Niente, fino al giorno prima | — | 3 | Non sa come annullare: nel portale non ci sono telefono né email dello studio | Mostrare i contatti dello studio nel portale |
| Promemoria | Riceve l'email il giorno prima | Email (cron) | 4 | Funziona solo se Resend è configurato | — |
| Spostamento | Chiede un nuovo orario, aspetta la risposta | `/portale/i-miei-appuntamenti` | 3 | Nessuna email quando lo studio approva o rifiuta: deve rientrare nel portale per saperlo | Email sull'esito della richiesta |

**Momenti critici:** la conferma email e l'attesa dopo la prenotazione. In entrambi il cliente
resta senza un riscontro chiaro.

### 2.2 Professionista: una giornata tipo
| Fase | Azioni | Punto di contatto | Emozione | Problemi | Opportunità |
|---|---|---|---|---|---|
| Inizio giornata | Apre la dashboard | `/dashboard` | 3 | "Prossimi 7 giorni" e "Clienti recenti" mostrano dati diversi da quello che dicono (vedi P1, P2) | Correggere i riepiloghi |
| Richieste | Approva o rifiuta gli spostamenti | `/richieste`, badge nel menu | 4 | — | — |
| Nuovo appuntamento | Sceglie cliente, tipo, data e orario libero | `/appuntamenti/nuovo` | 4 | Il cliente si cerca in un menu a tendina lungo | Ricerca nel menu cliente |
| Durante la giornata | Segna le visite completate, sposta o annulla | `/calendario`, `/appuntamenti` | 3 | "Annulla" cancella subito, senza chiedere conferma (P3) | Chiedere conferma |
| Prenotazioni dal portale | Le scopre solo aprendo il gestionale | Dashboard, calendario | 2 | Nessuna notifica quando un cliente prenota (P7) | Email o notifica al professionista |
| Correzioni anagrafiche | Vuole correggere il telefono di un cliente | `/clienti/[id]` | 1 | Non esiste un modo per modificare la scheda (P4) | Form di modifica |

---

## 3. Problemi di usabilità trovati

Gravità: 4 = impedisce il compito, 3 = difficoltà seria, 2 = esitazione, 1 = estetico.
Priorità = frequenza × gravità × facilità di correzione (1–5 ciascuno).

| # | Problema | Dove | Gravità | Priorità |
|---|---|---|---|---|
| P1 | La card "Prossimi 7 giorni" conta al massimo 5 appuntamenti, da domani in poi, senza limite di 7 giorni: il numero è sbagliato | `src/app/(studio)/dashboard/page.tsx` (`getUpcomingAppointments(5)` + etichetta) | 3 | 5×3×5 = **75** |
| P2 | "Clienti recenti" mostra i primi 4 in ordine alfabetico di cognome, non i più recenti | `dashboard/page.tsx` (`getClients()` ordinato per cognome) | 2 | 5×2×5 = **50** |
| P3 | "Annulla" annulla l'appuntamento subito, senza conferma. La stessa parola "Annulla" chiude anche il campo di spostamento: un clic sbagliato annulla una visita | `src/components/studio/appuntamenti/AppointmentActions.tsx` | 3 | 4×3×5 = **60** |
| P4 | Non c'è modo di modificare nome, telefono, email o note di un cliente dopo averlo creato | `src/app/(studio)/clienti/[id]/page.tsx` | 3 | 3×3×4 = **36** |
| P5 | Il portale dice "contatta lo studio" in 5 punti, ma non mostra mai telefono o email | `components/portale/*`, `i-miei-appuntamenti/page.tsx` | 3 | 4×3×5 = **60** |
| P6 | Il cliente non riceve email di conferma della prenotazione, né dell'esito di uno spostamento | (assente; c'è solo il promemoria in `lib/email/reminders.ts`) | 3 | 5×3×3 = **45** |
| P7 | La professionista non viene avvisata quando un cliente prenota dal portale | (assente) | 3 | 4×3×3 = **36** |
| P8 | Lo spostamento lato studio usa un campo data/ora libero: gli orari occupati si scoprono solo dopo aver confermato. Il nuovo appuntamento invece propone gli orari liberi | `AppointmentActions.tsx` | 2 | 3×2×4 = **24** |
| P9 | Nella vista settimana ogni appuntamento porta alla lista generale, non all'appuntamento o al cliente | `src/components/studio/calendario/WeekView.tsx` | 2 | 3×2×4 = **24** |
| P10 | Form "Nuovo cliente" e ricerca clienti senza etichette, solo testo segnaposto: meno accessibile e il suggerimento sparisce mentre si scrive | `NewClientForm.tsx`, `ClientSearchBar.tsx` | 2 | 3×2×5 = **30** |
| P11 | Nell'area studio i pulsanti delle azioni (Conferma, Sposta, Completa, Annulla) sono link piccoli e vicini tra loro: scomodi da toccare su telefono | `AppointmentActions.tsx` | 2 | 3×2×4 = **24** |
| P12 | Il saluto è sempre "Buongiorno", anche la sera | `dashboard/page.tsx` | 1 | 5×1×5 = **25** |
| P13 | Lo stato "Da confermare" esiste, ma nessun flusso lo usa (studio e portale creano appuntamenti già confermati): il pulsante "Conferma" non compare quasi mai | `lib/actions/studio/appuntamenti.ts`, `schema.sql` | 1 | 2×1×4 = **8** |

**Stato (11 novembre 2026):** risolti P1, P2, P3, P5, P6 e P7.
- **P1:** la card conta gli appuntamenti non annullati da domani a 7 giorni.
- **P2:** "Clienti recenti" mostra gli ultimi aggiunti.
- **P3:** l'annullamento chiede conferma e il pulsante dello spostamento si chiama "Chiudi".
- **P5:** il portale mostra telefono ed email dello studio in fondo a ogni pagina e nell'avviso di
  errore del login. I recapiti sono in `src/config/studio.ts`, alla voce `contact`.
- **P6:** il cliente riceve un'email di conferma quando prenota e una quando lo studio approva o
  rifiuta uno spostamento.
- **P7:** lo studio riceve un'email per ogni nuova prenotazione dal portale e per ogni richiesta di
  spostamento, all'indirizzo `notificationsEmail` di `src/config/studio.ts`.

  Tutte le email richiedono Resend configurato (`RESEND_API_KEY`).

**Punti di forza da mantenere**
- **Prenotazione dal portale:** pochi passaggi, mostra gli orari liberi raggruppati per giorno, pulsanti grandi (44 px) adatti al telefono.
- **Messaggi d'errore:** in italiano semplice e specifici, per esempio "Questo orario è stato appena prenotato da qualcun altro".
- **Blocco della doppia prenotazione:** spiegato con un avviso chiaro che rimanda allo spostamento.
- **Recupero password:** usa un codice a 6 cifre invece del link, più facile da usare dal telefono.
- **Regola delle 24 ore:** comunicata prima che il cliente provi a spostare l'appuntamento.

---

## 4. Raccomandazioni in ordine di priorità

1. **Correggere i dati della dashboard (P1, P2):** costo minimo e impatto alto, perché è la prima schermata che la professionista vede ogni giorno.
2. **Chiedere conferma prima di annullare (P3)** e rinominare il pulsante che chiude lo spostamento in "Chiudi".
3. **Contatti dello studio nel portale (P5):** telefono ed email da `src/config/studio.ts`, nell'intestazione o nei messaggi "contatta lo studio".
4. **Email transazionali (P6, P7):**
   - al cliente, conferma di prenotazione ed esito dello spostamento;
   - alla professionista, notifica di nuova prenotazione o nuova richiesta.

   L'infrastruttura Resend esiste già.
5. **Modifica della scheda cliente (P4).**
6. **Ritocchi di accessibilità (P10, P11)** e spostamento con gli orari liberi proposti (P8).

---

## 5. Piano di test di usabilità

### Domande di ricerca
1. Un nuovo cliente riesce a registrarsi e prenotare dal telefono in meno di 3 minuti, senza aiuto?
2. Un cliente riesce a spostare un appuntamento e a capire se la richiesta è stata accettata?
3. La professionista capisce, dalla sola dashboard, quante visite ha oggi e nei prossimi giorni?
4. La professionista riesce a inserire, spostare e completare un appuntamento senza errori?
5. Chi installa il prodotto riesce a metterlo online seguendo solo `/installa-database` e il README?

### Metodo
| Gruppo | Partecipanti | Metodo | Durata |
|---|---|---|---|
| Clienti | 5 (età e competenze digitali diverse, almeno 2 over 55) | Moderato, da remoto o in studio, sul **loro** telefono | 30 min |
| Professionisti | 3–5 nutrizionisti o dietisti | Moderato, sul computer | 45 min |
| Installazione | 2 persone non sviluppatrici | Osservazione mentre seguono la procedura | 60–90 min |

Ambiente: un progetto Supabase di prova con dati fittizi (10 clienti, 2 settimane di appuntamenti).

### Compiti — clienti
1. **Riscaldamento:** "Apri il link che ti abbiamo mandato. Cosa pensi di poter fare qui?"
2. **Principale:** "Sei un nuovo paziente. Prenota la prima visita per la settimana prossima, nel pomeriggio." *Successo: vede "Appuntamento confermato".*
3. **Secondario:** "Hai un imprevisto: sposta la visita a un altro giorno." *Successo: vede la richiesta in attesa.*
4. **Caso limite:** "Devi annullare la visita di domani. Come fai?" *Osserva: trova un contatto dello studio? (P5)*
5. **Caso limite:** "Hai dimenticato la password: entra di nuovo."

### Compiti — professionista
1. "Guarda la dashboard: quante visite hai oggi? E nei prossimi giorni?" *(verifica P1)*
2. "Il signor Rossi ha telefonato: inseriscigli un controllo giovedì alle 10."
3. "C'è una richiesta di spostamento: decidi cosa fare."
4. "La signora Bianchi ha cambiato numero di telefono: aggiornalo." *(verifica P4)*
5. "Hai finito la visita delle 11: segnala come completata." *(osserva errori su P3)*

### Metriche
| Metrica | Obiettivo |
|---|---|
| Compiti completati | ≥ 80% |
| Tempo per la prenotazione (cliente) | < 3 min |
| Errori per compito | < 15% dei tentativi |
| Soddisfazione dopo ogni compito (SEQ, 1–7) | ≥ 5,5 |
| SUS a fine sessione | ≥ 70 |

### Guida per il moderatore
- **All'inizio:** "Stiamo provando il sito, non te: se qualcosa non funziona è colpa nostra. Pensa ad alta voce."
- **Domande neutre:** "Cosa ti aspetti che succeda?", "Cosa stai cercando?". Evitare "Hai visto il pulsante…?".
- **Dopo ogni compito:** "Da 1 a 7, quanto è stato facile?" e "Cosa ti ha fatto esitare?".
- **Alla fine:** questionario SUS e la domanda "Cosa cambieresti per primo?".

### Dopo i test
Raccogliere i problemi con la gravità 1–4, confrontarli con la sezione 3 e aggiornare personas e
journey map con quello che è emerso. Con 20 o più clienti reali, `persona_generator.py` della skill
può generare personas basate sui dati.
