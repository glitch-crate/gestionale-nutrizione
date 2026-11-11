# Database Supabase

Tutto il database del gestionale (tabelle, regole di accesso e funzioni) è in un solo file,
`schema.sql`. Il file è **idempotente**:
- su un progetto Supabase vuoto crea tutto da zero;
- su un database già in uso lo aggiorna all'ultima versione senza cancellare dati.

## Installazione con Claude (consigliata)

1. Crea un progetto gratuito su [supabase.com](https://supabase.com) (regione EU).
2. Apri questa cartella con Claude Code e collega il connettore Supabase.
3. Scrivi: **`/installa-database`**, oppure "installa il database".

Claude applica lo schema, ti fa creare l'account del professionista, collega lo studio, compila
`.env.local` e verifica che tutto funzioni. Le password e le chiavi segrete le inserisci tu:
Claude non le chiede in chat.

## Installazione manuale

1. Supabase > **SQL Editor**: incolla tutto `schema.sql` ed esegui.
2. Supabase > **Authentication > Users > Add user > Create new user**: email e password del
   professionista, con **Auto Confirm User** spuntato.
3. Nell'SQL Editor:
   ```sql
   select private.bootstrap_studio('email@professionista.it', 'Nome Cognome', 'Nome dello studio');
   ```
4. Authentication:
   - **Confirm email** attivo;
   - password minima di 8 caratteri;
   - Site URL e Redirect URLs con il dominio del sito;
   - il template "Reset password" deve contenere `{{ .Token }}`.
5. Copia `.env.local.example` in `.env.local` e compila i valori. Project Settings > API ti dà
   URL, chiave anon/publishable e chiave service_role. Per generare `CRON_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Aggiornare un'installazione esistente
Riesegui `schema.sql`, oppure chiedi a Claude `/installa-database`. Prima fai un backup da
Database > Backups.

## Come è protetto
- **Professionista**: accede solo ai dati del proprio studio (Row Level Security).
- **Cliente del portale**: non ha accesso diretto alle tabelle. Usa solo funzioni dedicate, che
  mostrano i suoi appuntamenti e il suo profilo, e mai le note dello studio. Il suo profilo si
  modifica solo in nome, cognome e telefono. Prenotazioni e spostamenti sono controllati nel
  database: orari validi, niente sovrapposizioni, un appuntamento alla volta, spostamenti fino a
  24 ore prima.
- **"Già cliente"**: non si autodichiara. Lo decide lo studio dalla scheda cliente, oppure scatta
  da solo se il cliente ha già avuto un appuntamento. Chi si registra con l'email che lo studio
  aveva già inserito viene collegato alla propria scheda, solo dopo aver confermato l'email.
- **Visitatori non autenticati**: nessun accesso.
