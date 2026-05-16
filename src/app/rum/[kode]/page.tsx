"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { getSessionId } from "@/lib/session";
import {
  getParticipants,
  getParticipantBySession,
} from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
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
  const roomRef = useRef<Room | null>(null);

  const refreshRoom = useCallback(async () => {
    const { data: rooms } = await supabase
      .from("rooms")
      .select()
      .eq("code", kode)
      .order("created_at", { ascending: false })
      .limit(1);

    const roomData = rooms && rooms.length > 0 ? rooms[0] : null;
    if (roomData) {
      setRoom(roomData);
      roomRef.current = roomData;
    }
    return roomData;
  }, [kode]);

  const refreshParticipants = useCallback(async (roomId: string) => {
    const list = await getParticipants(roomId);
    setParticipants(list);
  }, []);

  // Initial load
  useEffect(() => {
    async function loadRoom() {
      try {
        const sessionId = getSessionId();

        const roomData = await refreshRoom();

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
          setError("Du er ikke deltager i dette rum. Prøv at joine igen.");
          setLoading(false);
          return;
        }

        await refreshParticipants(roomData.id);

        setParticipant(participantData);
        setLoading(false);
      } catch (e: any) {
        setError(`Kunne ikke indlæse rummet: ${e.message}`);
        setLoading(false);
      }
    }

    loadRoom();
  }, [kode, refreshRoom, refreshParticipants]);

  // Poll for changes every 2 seconds (reliable fallback for realtime)
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      const currentRoom = roomRef.current;
      if (!currentRoom) return;

      // Refresh participants
      await refreshParticipants(currentRoom.id);

      // Refresh room status
      const { data: rooms } = await supabase
        .from("rooms")
        .select()
        .eq("id", currentRoom.id)
        .limit(1);

      if (rooms && rooms.length > 0) {
        const updatedRoom = rooms[0];
        if (updatedRoom.status !== currentRoom.status) {
          setRoom(updatedRoom);
          roomRef.current = updatedRoom;
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room, refreshParticipants]);

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
        <a
          href="/"
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-xl border-2 border-brand-500 bg-white px-6 py-3 font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
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
          onRoomUpdate={(r) => {
            setRoom(r);
            roomRef.current = r;
          }}
        />
      );
    case "voting":
    case "calculating":
      return (
        <Stemme
          room={room}
          participant={participant}
          participants={participants}
          onRoomUpdate={(r) => {
            setRoom(r);
            roomRef.current = r;
          }}
        />
      );
    case "results":
      return <Resultat room={room} participant={participant} />;
    default:
      return null;
  }
}
