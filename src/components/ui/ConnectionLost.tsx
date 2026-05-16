"use client";

import { useState, useEffect } from "react";

interface ConnectionLostProps {
  onRetry: () => void;
}

export default function ConnectionLost({ onRetry }: ConnectionLostProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setTimeout(() => setRetrying(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 card text-center animate-bounce-in">
        <div className="text-4xl mb-3">📡</div>
        <h2 className="text-xl font-bold text-gray-900">
          Forbindelse mistet
        </h2>
        <p className="mt-2 text-gray-600">
          Vi prøver at genoprette forbindelsen...
        </p>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="btn-primary mt-4 w-full disabled:opacity-50"
        >
          {retrying ? "Forbinder..." : "🔄 Prøv igen"}
        </button>
      </div>
    </div>
  );
}
