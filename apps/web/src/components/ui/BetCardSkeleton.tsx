const BetCardSkeleton = () => (
  <div className="w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-5 bg-gray-700 rounded w-3/4" />
      <div className="h-6 bg-gray-700 rounded-full w-20" />
    </div>
    <div className="h-4 bg-gray-700 rounded w-full mb-2" />
    <div className="h-4 bg-gray-700 rounded w-2/3 mb-6" />
    <div className="space-y-3 mb-6">
      <div className="h-14 bg-gray-700 rounded-xl" />
      <div className="h-14 bg-gray-700 rounded-xl" />
    </div>
    <div className="flex justify-between pt-4 border-t border-gray-700">
      <div className="h-4 bg-gray-700 rounded w-24" />
      <div className="h-4 bg-gray-700 rounded w-16" />
    </div>
  </div>
);

export default BetCardSkeleton;
