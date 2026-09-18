export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-5 px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
        Informativa privacy
      </h1>

      <p className="text-sm text-[var(--color-muted)]">Ultimo aggiornamento: 18 settembre 2026</p>

      <div className="flex flex-col gap-4 text-[15px] text-[var(--color-ink)]">
        <p>
          Ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (&quot;GDPR&quot;), questa
          informativa descrive come Dott.ssa Francesca Perego tratta i dati personali dei clienti
          che utilizzano il portale di prenotazione online.
        </p>

        <h2 className="mt-2 font-medium">1. Titolare del trattamento</h2>
        <p>
          <strong>Francesca Perego</strong> — libero professionista individuale
          <br />
          Sede: Via G. Matteotti, 66 — 20842 Besana in Brianza (MB)
          <br />
          P.IVA / C.F.: 08834180963
          <br />
          Email di contatto: fpperego@gmail.com
          <br />
          Telefono: 349 660 8215
        </p>

        <h2 className="mt-2 font-medium">2. Quali dati raccogliamo</h2>
        <p>
          Attraverso il portale di prenotazione raccogliamo esclusivamente i dati necessari a
          gestire gli appuntamenti: nome e cognome, numero di telefono, indirizzo email, data e
          ora degli appuntamenti prenotati, il loro stato ed eventuale tipologia.
        </p>
        <p>
          <strong>Non raccogliamo dati sanitari</strong>, diagnosi, referti, piani alimentari o
          altre informazioni relative al tuo stato di salute attraverso questo sistema.
        </p>

        <h2 className="mt-2 font-medium">3. Perché trattiamo questi dati</h2>
        <p>
          Trattiamo i tuoi dati personali per eseguire il servizio che ci hai richiesto, ovvero la
          gestione della tua prenotazione e dei tuoi appuntamenti presso lo studio (art. 6, par.
          1, lett. b, GDPR). Non utilizziamo i tuoi dati per finalità di marketing né effettuiamo
          profilazione automatizzata.
        </p>

        <h2 className="mt-2 font-medium">4. Come conserviamo i tuoi dati</h2>
        <p>
          I dati sono conservati su server sicuri all&apos;interno dell&apos;infrastruttura del
          nostro fornitore tecnico (Supabase Inc., con server nell&apos;Unione Europea). Li
          conserviamo per 5 anni dall&apos;ultimo appuntamento, salvo obblighi di legge diversi.
        </p>

        <h2 className="mt-2 font-medium">5. Con chi condividiamo i tuoi dati</h2>
        <p>
          I tuoi dati non vengono venduti, ceduti o comunicati a terzi per finalità commerciali.
          Per il funzionamento tecnico del portale ci avvaliamo di Supabase Inc. (database e
          autenticazione) e Vercel Inc. (hosting del sito), entrambi responsabili del trattamento.
        </p>

        <h2 className="mt-2 font-medium">6. I tuoi diritti</h2>
        <p>
          In qualsiasi momento puoi richiedere accesso, rettifica, cancellazione, limitazione o
          portabilità dei tuoi dati, scrivendo a{" "}
          <strong>fpperego@gmail.com</strong> o telefonando al{" "}
          <strong>349 660 8215</strong>. Hai inoltre diritto a proporre reclamo al Garante per la
          protezione dei dati personali (www.garanteprivacy.it).
        </p>

        <h2 className="mt-2 font-medium">7. Modifiche a questa informativa</h2>
        <p>
          Questa informativa può essere aggiornata nel tempo. La versione più recente è sempre
          disponibile su questa pagina.
        </p>
      </div>
    </main>
  );
}
