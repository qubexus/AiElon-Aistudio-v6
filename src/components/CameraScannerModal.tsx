import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Camera,
  X,
  RotateCcw,
  Check,
  Upload,
  AlertTriangle,
  ScanText,
} from "lucide-react";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureBlob: (blob: Blob, fileName: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onCaptureBlob,
}) => {
  const { locale } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCameraStream = async () => {
    setCameraError(null);
    setIsInitializing(true);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsInitializing(false);
      setCameraError(
        locale === "pl"
          ? "Przeglądarka nie obsługuje podglądu kamery na żywo. Użyj aparatu systemowego poniżej."
          : locale === "ro"
          ? "Browserul nu suportă previzualizarea live a camerei. Folosește camera sistemului mai jos."
          : "Live camera preview is unavailable in this browser. Use the native camera button below."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError(
        locale === "pl"
          ? "Brak dostępu do kamery lub nie wykryto urządzenia. Możesz zrobić zdjęcie aparatem systemowym lub wgrać skan poniżej."
          : locale === "ro"
          ? "Accesul la cameră a fost refuzat sau nu există cameră. Folosește camera sistemului mai jos."
          : "Camera permission denied or no webcam found. Use the native camera / photo upload option below."
      );
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
      setCapturedPreviewUrl(null);
      setCapturedBlob(null);
      setCameraError(null);
      return;
    }

    startCameraStream();
    return () => {
      stopCameraStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  if (!isOpen) return null;

  const handleSnapPhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedPreviewUrl(url);
        stopCameraStream();
      },
      "image/jpeg",
      0.9
    );
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    setCapturedPreviewUrl(null);
    setCapturedBlob(null);
    startCameraStream();
  };

  const handleConfirmCapture = () => {
    if (!capturedBlob) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    onCaptureBlob(capturedBlob, `Camera_Document_${stamp}.jpg`);
    onClose();
  };

  const handleNativeCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onCaptureBlob(file, file.name);
    e.target.value = "";
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-scanner-title"
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#131B2E] border-2 border-[#38B28B]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#0B2038] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#1D6852]/30 border border-[#38B28B]/50 flex items-center justify-center text-[#38B28B] shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3
                id="camera-scanner-title"
                className="text-sm font-extrabold text-white truncate"
              >
                {locale === "pl"
                  ? "Skaner Dokumentów (Kamera + Auto-Tagging)"
                  : locale === "ro"
                  ? "Scanner Documente (Cameră + Auto-Etichetare)"
                  : "Document Camera Scanner & Auto-Detection"}
              </h3>
              <p className="text-[11px] text-[#94A3B8] truncate">
                {locale === "pl"
                  ? "Zrób zdjęcie payslipa, umowy lub pisma HR — treść zostanie automatycznie otagowana"
                  : locale === "ro"
                  ? "Fotografiază un fluturaș, contract sau scrisoare HR pentru etichetare automată"
                  : "Capture a payslip, contract, or HR letter — content is analyzed and tagged automatically"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera scanner"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="p-4 bg-[#0B0F17] flex-1 min-h-0 flex flex-col items-center justify-center">
          {capturedPreviewUrl ? (
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#38B28B]/50 bg-black flex items-center justify-center max-h-[52vh]">
              <img
                src={capturedPreviewUrl}
                alt="Captured document preview"
                className="max-h-[52vh] w-auto object-contain"
              />
            </div>
          ) : cameraError ? (
            <div className="w-full rounded-2xl border border-[#D97724]/40 bg-[#131B2E] p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D97724]/20 border border-[#D97724]/40 flex items-center justify-center text-[#D97724] mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#CBD5E1] leading-relaxed max-w-md mx-auto">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D6852] hover:bg-[#258066] text-white text-xs font-extrabold transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>
                  {locale === "pl"
                    ? "Otwórz aparat systemowy / Wybierz zdjęcie"
                    : locale === "ro"
                    ? "Deschide camera sistemului / Alege poză"
                    : "Open Native Camera / Choose Photo"}
                </span>
              </button>
            </div>
          ) : (
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-black aspect-[4/3] max-h-[52vh] flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* Subtle Corner Document Framing Guides */}
              <div className="pointer-events-none absolute inset-5 border border-dashed border-[#38B28B]/60 rounded-xl" />
              {isInitializing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-xs text-white font-semibold">
                  <ScanText className="w-6 h-6 text-[#38B28B] animate-pulse" />
                  <span>
                    {locale === "pl"
                      ? "Uruchamianie kamery..."
                      : locale === "ro"
                      ? "Se pornește camera..."
                      : "Starting camera..."}
                  </span>
                </div>
              )}
            </div>
          )}

          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativeCameraFile}
            className="hidden"
          />
        </div>

        {/* Footer Controls */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#0B2038] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => nativeCameraInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#CBD5E1] hover:text-white transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#38B28B]" />
            <span>
              {locale === "pl"
                ? "Aparat systemowy"
                : locale === "ro"
                ? "Camera sistemului"
                : "Native Camera"}
            </span>
          </button>

          <div className="flex items-center gap-2">
            {capturedPreviewUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {locale === "pl"
                      ? "Powtórz"
                      : locale === "ro"
                      ? "Refă poza"
                      : "Retake"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCapture}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D6852] hover:bg-[#258066] text-xs font-extrabold text-white shadow-md transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {locale === "pl"
                      ? "Analizuj i przypisz tag"
                      : locale === "ro"
                      ? "Analizează și etichetează"
                      : "Analyze & Auto-Tag"}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={Boolean(cameraError) || isInitializing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D97724] hover:bg-[#c5691d] disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-extrabold shadow-md transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>
                  {locale === "pl"
                    ? "Zrób zdjęcie dokumentu"
                    : locale === "ro"
                    ? "Fotografiază documentul"
                    : "Capture Document"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
