export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-4 px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
        Informativa privacy
      </h1>

      <div className="rounded-lg border border-[var(--color-status-pending)]/30 bg-[var(--color-status-pending-bg)] p-4">
        <p className="text-[15px] text-[var(--color-ink)]">
          <strong>Testo provvisorio.</strong> Questa pagina va sostituita con l&apos;informativa
          privacy definitiva dello studio prima di usare il gestionale con clienti reali.
        </p>
      </div>

      <div className="flex flex-col gap-4 text-[15px] text-[var(--color-ink)]">
        <p>
          Lo Studio Nutrizione raccoglie i dati personali strettamente necessari alla gestione
          degli appuntamenti: nome, cognome, telefono, email e lo storico degli appuntamenti
          prenotati. Non vengono raccolti dati sanitari, diagnosi o referti.
        </p>
        <p>
          I dati vengono trattati per la finalità di gestire la prenotazione e l&apos;erogazione
          degli appuntamenti richiesti (base giuridica: esecuzione di un servizio richiesto
          dall&apos;interessato).
        </p>
        <p>
          Per esercitare i tuoi diritti (accesso, rettifica, cancellazione dei dati) puoi
          contattare direttamente lo studio.
        </p>
      </div>
    </main>
  );
}
