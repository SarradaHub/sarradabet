import { LoadingSpinner } from "./LoadingSpinner";

const PageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
    <LoadingSpinner size="lg" text="Carregando..." />
  </div>
);

export default PageSkeleton;
