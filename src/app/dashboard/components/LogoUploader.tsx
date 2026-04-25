"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { createClient } from "@/lib/supabase/client";

type Props = {
  businessId: string;
  currentLogoUrl: string | null;
  themeInput: string;
  themeTextMuted: string;
  themeButtonPrimary: string;
  themeCard: string;
};

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas vacío"));
        else resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function LogoUploader({
  businessId,
  currentLogoUrl,
  themeInput,
  themeTextMuted,
  themeButtonPrimary,
  themeCard,
}: Props) {
  const [srcImage, setSrcImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB.");
      return;
    }

    setError(null);
    setSuccess(false);
    setCrop(undefined);
    setCompletedCrop(null);

    const reader = new FileReader();
    reader.onload = () => setSrcImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCancel() {
    setSrcImage(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setError(null);
  }

  const handleUpload = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      setError("Selecciona un área de recorte primero.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const supabase = createClient();

      const filePath = `${businessId}/logo-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("business-assets")
        .getPublicUrl(filePath);

      const newUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ logo_url: newUrl })
        .eq("id", businessId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setPreviewUrl(newUrl);
      setSuccess(true);
      setSrcImage(null);
      setCrop(undefined);
      setCompletedCrop(null);
    } catch (err) {
      setError("Error inesperado al subir la imagen.");
    } finally {
      setUploading(false);
    }
  }, [completedCrop, businessId]);

  return (
    <div className="md:col-span-2 flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Logo del negocio
        </label>

        {!srcImage && (
          <label
            className={`flex cursor-pointer items-center gap-3 w-full rounded-2xl border px-4 py-3 transition ${themeInput}`}
          >
            <span className="text-sm">Seleccionar nueva imagen</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {success && (
          <p className="mt-2 text-sm text-green-500">
            ✓ Logo actualizado correctamente.
          </p>
        )}
      </div>

      {/* Editor de recorte */}
      {srcImage && (
        <div className={`rounded-2xl border p-4 flex flex-col gap-4 ${themeCard}`}>
          <p className="text-sm font-medium">
            Selecciona el área que quieres usar como logo
          </p>

          <div className="overflow-auto max-h-[420px] flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              minWidth={50}
              minHeight={50}
            >
              <img
                ref={imgRef}
                src={srcImage}
                alt="Previsualización"
                style={{ maxWidth: "100%", maxHeight: "400px" }}
              />
            </ReactCrop>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition opacity-70 hover:opacity-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !completedCrop}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${themeButtonPrimary} ${uploading || !completedCrop ? "opacity-50 pointer-events-none" : ""}`}
            >
              {uploading ? "Subiendo..." : "Guardar logo"}
            </button>
          </div>
        </div>
      )}

      {/* Logo actual */}
      {previewUrl && !srcImage && (
        <div>
          <p className={`mb-3 text-sm ${themeTextMuted}`}>Logo actual</p>
          <img
            src={previewUrl}
            alt="Logo del negocio"
            className="h-24 w-24 rounded-2xl border object-cover"
          />
        </div>
      )}
    </div>
  );
}