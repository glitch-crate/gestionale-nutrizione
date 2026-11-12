import { STUDIO } from "@/config/studio";

const linkClass = "font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]";

/** Telefono ed email dello studio, cliccabili (chiamata / email dal telefono). */
export function StudioContactLinks() {
  const { phone, email } = STUDIO.contact;
  return (
    <>
      <a href={`tel:${phone.replace(/\s+/g, "")}`} className={linkClass}>
        {phone}
      </a>{" "}
      ·{" "}
      <a href={`mailto:${email}`} className={linkClass}>
        {email}
      </a>
    </>
  );
}

/** Piè di pagina del portale: dove contattare lo studio per annullare o per informazioni. */
export function PortaleFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] px-[22px] py-4 text-center text-sm text-[var(--color-muted)] sm:px-6">
      Per annullare un appuntamento o per qualsiasi informazione contatta lo studio:{" "}
      <span className="whitespace-nowrap">
        <StudioContactLinks />
      </span>
    </footer>
  );
}
