import { useEffect } from "react";
import { updateCouple } from "@/services/dashboard";
import { useCoupleStore } from "@/store/coupleStore";
import { useDashboardStore } from "@/store/dashboardStore";
import CoupleHeader from "./components/CoupleHeader";
import DaysTogetherCard from "./components/DaysTogetherCard";
import NextDateCard from "./components/NextDateCard";
import MemoriesPreview from "./components/MemoriesPreview";
import QuickActions from "./components/QuickActions";
import PhotosPreview from "./components/PhotosPreview";

export default function Dashboard() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const { summary, loading, error, load } = useDashboardStore();

  useEffect(() => {
    if (coupleId) void load(coupleId);
  }, [coupleId, load]);

  if (!coupleId || loading) return <div className="min-h-screen bg-rose-50 p-6 text-slate-500">Cargando pareja...</div>;
  if (error) return <div className="min-h-screen bg-rose-50 p-6 text-red-600">{error}</div>;

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <CoupleHeader
          couple={summary?.couple ?? null}
          counts={summary?.counts}
          onAnniversarySave={async (date) => {
            await updateCouple(coupleId, { anniversary_date: date });
            await load(coupleId);
          }}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DaysTogetherCard startDate={summary?.couple?.anniversary_date ?? summary?.couple?.created_at ?? null} />
          <NextDateCard event={summary?.nextEvent ?? null} />
        </div>
        <QuickActions />
        <MemoriesPreview memories={summary?.recentMemories ?? []} />
        <PhotosPreview photos={summary?.recentPhotos ?? []} />
      </div>
    </main>
  );
}
