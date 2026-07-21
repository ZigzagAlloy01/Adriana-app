import { useState } from "react";
import { X } from "lucide-react";
import type { Photo } from "@/types/dashboard";

export default function PhotosPreview({ photos }: { photos: Photo[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <>
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="m-0 text-base font-semibold text-slate-950">Galeria</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {photos.length === 0 ? (
            <p className="col-span-full text-sm text-slate-400">Sin fotos aun.</p>
          ) : (
            photos.map((photo) => (
              <button key={photo.id} type="button" onClick={() => setSelectedPhoto(photo)} className="block">
                <img src={photo.url} alt={photo.caption ?? "Foto de pareja"} className="aspect-square rounded-lg object-cover ring-1 ring-slate-200" />
              </button>
            ))
          )}
        </div>
      </section>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white" aria-label="Cerrar">
            <X className="size-6" />
          </button>
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption ?? "Foto de pareja"}
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
