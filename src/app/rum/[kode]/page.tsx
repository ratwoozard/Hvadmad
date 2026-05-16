"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSessionId } from "@/lib/session";
import { getRoomByCode, getParticipants, getParticipantBySession } from "@/lib/supabase/queries";
import type { Room, Participant } from "@/types/room";
import Lobby from "./lobby";
import Stemme from "./stemme";
import Resultat from "./resultat";

export default function RumPage() {
  const params = useParams();
  const kode = (params.kode as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRoom() {
      try {
        const sessionId = getSessionId();
        const roomData = await getRoomByCode(kode);

        if (!roomData) {
          setError("Rummet findes ikke eller er udløbet.");
          setLoading(false);
          return;
        }

        const participantData = await getParticipantBySession(
          roomData.id,
          sessionId
        );

        if (!participantData) {
          setError("Du er ikke deltager i dette rum.");
          setLoading(false);
          return;
        }

        const participantsList = await getParticipants(roomData.id);

        setRoom(roomData);
        setParticipant(participantData);
        setParticipants(participantsList);
        setLoading(false);
      } catch (e: any) {
        setError("Kunne ikke indlæse rummet.");
        setLoading(false);
      }
    }

    loadRoom();
  }, [kode]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce">🍕</div>
          <p className="mt-2 text-gray-500">Indlæser rum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-center text-gray-600">{error}</p>
        <a href="/" className="btn-secondary">
          Gå til forsiden
        </a>
      </div>
    );
  }

  if (!room || !participant) return null;

  switch (room.status) {
    case "lobby":
      return (
        <Lobby
          room={room}
          participant={participant}
          participants={participants}
          onRoomUpdate={setRoom}
          onParticipantsUpdate={setParticipants}
        />
      );
    case "voting":
    case "calculating":
      return (
        <Stemme
          room={room}
          participant={participant}
          onRoomUpdate={setRoom}
        />
      );
    case "results":
      return <Resultat room={room} participant={participant} />;
    default:
      return null;
  }
}
