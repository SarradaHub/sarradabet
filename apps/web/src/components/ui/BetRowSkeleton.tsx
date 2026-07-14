const BetRowSkeleton = () => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b sb-border animate-pulse">
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-sportsbook-raised rounded w-16" />
      <div className="h-4 bg-sportsbook-raised rounded w-3/4" />
      <div className="h-3 bg-sportsbook-raised rounded w-24" />
    </div>
    <div className="flex gap-2">
      <div className="h-14 w-[4.5rem] bg-sportsbook-raised rounded" />
      <div className="h-14 w-[4.5rem] bg-sportsbook-raised rounded" />
      <div className="h-14 w-[4.5rem] bg-sportsbook-raised rounded" />
    </div>
  </div>
);

export default BetRowSkeleton;
