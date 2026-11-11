// Dati dello studio mostrati nell'interfaccia, nelle email e
// nell'informativa privacy. È l'unico punto da modificare per adattare
// il gestionale a un nuovo studio.
//
// Orari di apertura e durate delle visite non stanno qui: si gestiscono
// dalla pagina Impostazioni del gestionale e sono salvati nel database.

export const STUDIO = {
  /** Nome mostrato in intestazioni, pagine di accesso ed email. */
  name: "Studio Nutrizione",

  /** Recapiti mostrati ai clienti nel portale (per annullare o chiedere informazioni). */
  contact: {
    phone: "349 660 8215",
    email: "fpperego@gmail.com",
  },

  /** Dove arrivano gli avvisi di nuove prenotazioni e richieste di spostamento. */
  notificationsEmail: "fpperego@gmail.com",

  /** Titolare del trattamento dei dati (informativa privacy). */
  owner: {
    displayName: "Dott.ssa Francesca Perego",
    legalName: "Francesca Perego",
    legalForm: "libero professionista individuale",
    address: "Via G. Matteotti, 66 — 20842 Besana in Brianza (MB)",
    vatNumber: "08834180963",
    email: "fpperego@gmail.com",
    phone: "349 660 8215",
  },

  /** Data dell'ultima revisione dell'informativa privacy. */
  privacyUpdatedAt: "18 settembre 2026",
} as const;
