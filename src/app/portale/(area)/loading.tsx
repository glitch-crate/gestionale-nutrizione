import { PortalePageSkeleton } from "@/components/shared/LoadingSkeleton";

// Mostrato subito al cambio pagina nel portale: intestazione e menu restano,
// il contenuto arriva appena il server ha i dati.
export default function PortaleLoading() {
  return <PortalePageSkeleton />;
}
