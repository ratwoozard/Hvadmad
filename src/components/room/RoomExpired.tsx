"use client";

import { Button } from "@/components/ui/Button";

export default function RoomExpired() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <div className="text-6xl">⏰</div>
      <h2 className="text-2xl font-bold text-gray-900">Rummet er udløbet</h2>
      <p className="text-center text-gray-600">
        Dette rum har været inaktivt for længe og er blevet lukket.
      </p>
      <Button as="a" href="/" className="mt-4">
        🏠 Opret et nyt rum
      </Button>
    </div>
  );
}
