import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Camera, Upload, X } from "lucide-react";
import { listPhotos, uploadPhoto } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { Photo } from "@/types/domain";

export default function GalleryPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const load = useCallback(async () => {
    if (!coupleId) return;
    setPhotos(await listPhotos(coupleId));
  }, [coupleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!coupleId || !file) return;

    setLoading(true);
    setError(null);
    try {
      await uploadPhoto(coupleId, file, caption);
      setCaption("");
      setFile(null);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo subir la foto."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <a href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50">
          <ArrowLeft className="size-4" />
          Volver al Dashboard
        </a>

        <form onSubmit={handleUpload} className="space-y-3 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-rose-600" />
            <h1 className="m-0 text-2xl font-semibold text-slate-950">Fotos</h1>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-full rounded-lg border border-slate-200 p-3" />
          <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption" className="w-full rounded-lg border border-slate-200 p-3" />
          <button disabled={loading || !file} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-3 font-medium text-white disabled:opacity-60">
            <Upload className="size-4" />
            {loading ? "Subiendo..." : "Subir foto"}
          </button>
        </form>

        {photos.length === 0 ? <p className="rounded-lg bg-white p-5 text-slate-500 shadow-sm ring-1 ring-slate-200">Sin fotos todavia.</p> : null}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <button type="button" onClick={() => setSelectedPhoto(photo)} className="block w-full">
                <img src={photo.url} alt={photo.caption ?? "Foto de pareja"} className="aspect-square w-full object-cover" />
              </button>
              {photo.caption && <figcaption className="p-3 text-sm text-slate-600">{photo.caption}</figcaption>}
            </figure>
          ))}
        </section>
      </div>

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
    </main>
  );
}
