"use client";

import { Button } from "@/components/ui/Button";

export default function RoomFull() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <div className="text-6xl">🚫</div>
      <h2 className="text-2xl font-bold text-gray-900">Rummet er fuldt</h2>
      <p className="text-center text-gray-600">
        Der er allerede 20 deltagere i dette rum. Prøv igen senere eller opret
        et nyt rum.
      </p>
      <Button as="a" href="/" className="mt-4">
        🏠 Gå til forsiden
      </Button>
    </div>
  );
}
