import { useEffect, useState } from "react";
import { useCoupleStore } from "@/store/coupleStore";
import { useDashboardStore } from "@/store/dashboardStore";
import CoupleHeader from "./components/CoupleHeader";
import DaysTogetherCard from "./components/DaysTogetherCard";
import NextDateCard from "./components/NextDateCard";
import MemoriesPreview from "./components/MemoriesPreview";
import QuickActions from "./components/QuickActions";
import PhotosPreview from "./components/PhotosPreview";
import { supabase } from "@/services/supabase";

export default function Dashboard() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const { summary, loading, error, load } = useDashboardStore();
  const [profile, setProfile] = useState<{ display_name?: string | null } | null>(null);

  useEffect(() => {
    if (coupleId) void load(coupleId);
  }, [coupleId, load]);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("No se pudo cargar el perfil:", err);
      }
    }

    void fetchUserProfile();
  }, []);

  if (!coupleId || loading) return <div className="min-h-screen bg-rose-50 p-6 text-slate-500">Cargando pareja...</div>;
  if (error) return <div className="min-h-screen bg-rose-50 p-6 text-red-600">{error}</div>;

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <CoupleHeader
          couple={summary?.couple ?? null}
          profile={profile}
          counts={summary?.counts}
          onCoupleUpdated={async () => {
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
