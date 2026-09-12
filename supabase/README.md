# Supabase — come collegare un progetto reale

Questo progetto non è ancora collegato a un progetto Supabase reale:
per ora gira con dati mock e senza login funzionante.

## Passi

1. Crea un account su [supabase.com](https://supabase.com) (piano Free) e
   crea un nuovo progetto.
2. In **Project Settings > API** copia:
   - `Project URL`
   - `anon public key`
3. Copia `.env.local.example` in `.env.local` (nella root del progetto) e
   incolla i due valori.
4. Apri **SQL Editor** nel progetto Supabase, incolla il contenuto di
   `schema.sql` ed esegui.
5. In **Authentication > Users**, crea manualmente il primo utente
   (email + password) — sarà l'account del professionista.
6. Esegui il blocco SQL finale in `schema.sql` (commentato), sostituendo
   l'UUID con quello dell'utente appena creato, per collegarlo allo studio.
7. Riavvia il server locale (`npm run dev`): a questo punto il login in
   `/login` sarà realmente funzionante.

## Perché questa struttura

Anche se oggi esiste un solo studio, ogni tabella ha uno `studio_id`.
Questo evita di dover riscrivere lo schema se in futuro il gestionale
dovesse supportare più studi: basterà aggiungere righe in `studios`,
non cambiare la forma delle tabelle esistenti.
