import { useCoupleStore } from "@/store/coupleStore";

export default function CoupleHeader() {
  const { coupleId } = useCoupleStore();

  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h1 className="text-xl font-bold">Nuestra historia ❤️</h1>
      <p className="text-sm text-gray-500">
        Couple ID: {coupleId}
      </p>
    </div>
  );
}