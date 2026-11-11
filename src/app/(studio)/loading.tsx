import { StudioPageSkeleton } from "@/components/shared/LoadingSkeleton";

// Mostrato subito al cambio pagina nell'area studio: la barra laterale resta,
// il contenuto arriva appena il server ha i dati.
export default function StudioLoading() {
  return <StudioPageSkeleton />;
}
