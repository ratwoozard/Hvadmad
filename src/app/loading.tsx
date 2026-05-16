export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-bounce">🍕</div>
        <p className="mt-2 text-gray-500">Indlæser...</p>
      </div>
    </div>
  );
}
