export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <div className="text-6xl">🤔</div>
      <h2 className="text-2xl font-bold text-gray-900">Side ikke fundet</h2>
      <p className="text-center text-gray-600">
        Den side du leder efter eksisterer ikke.
      </p>
      <a href="/" className="btn-primary mt-4">
        🏠 Gå til forsiden
      </a>
    </div>
  );
}
