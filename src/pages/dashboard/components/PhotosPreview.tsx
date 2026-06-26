import type { Photo } from "@/types/dashboard";

type Props = {
  photos: Photo[];
};

export default function PhotosPreview({ photos }: Props) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h2 className="font-semibold mb-2">Galería</h2>

      <div className="grid grid-cols-3 gap-2">
        {photos.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-3">
            Sin fotos aún
          </p>
        ) : (
          photos.map((p) => (
            <img
              key={p.id}
              src={p.url}
              className="rounded-lg aspect-square object-cover"
            />
          ))
        )}
      </div>
    </div>
  );
}