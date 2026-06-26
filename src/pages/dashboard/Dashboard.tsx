import { useEffect, useState } from "react";
import {
  getMyCoupleId,
  getNextEvent,
  getRecentMemories,
  getRecentPhotos,
} from "@/services/dashboard";

import CoupleHeader from "./components/CoupleHeader";
import DaysTogetherCard from "./components/DaysTogetherCard";
import NextDateCard from "./components/NextDateCard";
import MemoriesPreview from "./components/MemoriesPreview";
import QuickActions from "./components/QuickActions";
import PhotosPreview from "./components/PhotosPreview";
import type { Event, Memory, Photo } from "@/types/dashboard";

export default function Dashboard() {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  useEffect(() => {
    async function load() {
      const id = await getMyCoupleId();
      setCoupleId(id);

      const [event, mems, pics] = await Promise.all([
        getNextEvent(id),
        getRecentMemories(id),
        getRecentPhotos(id),
      ]);

      setNextEvent(event);
      setMemories(mems);
      setPhotos(pics);
    }

    load();
  }, []);

  if (!coupleId) {
    return <div className="p-6">Cargando pareja...</div>;
  }

  return (
    <div className="min-h-screen bg-pink-50 p-6 space-y-6">

      <CoupleHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DaysTogetherCard />
        <NextDateCard event={nextEvent} />
      </div>

      <MemoriesPreview memories={memories} />
      <PhotosPreview photos={photos} />

      <QuickActions />
    </div>
  );
}