import React from "react";
import { Locale } from "../types";

interface HandshakeOvalSvgProps {
  /**
   * "auto" = white oval (#FFFFFF) with dark-teal handshake (#01584D) in dark mode,
   *          dark-teal oval (#01584D) with white handshake (#FFFFFF) in light mode & print.
   * "teal" = always dark-teal oval (#01584D) with white handshake (#FFFFFF) (paper previews, light mode, PDF/print).
   * "white" = white oval (#FFFFFF) with dark-teal handshake (#01584D) (for dark UI backgrounds).
   */
  variant?: "auto" | "teal" | "white";
  className?: string;
}

/**
 * Crisp vector SVG of the Ask Elon handshake oval badge (~32px wide in UI, small in PDF/print).
 */
export const HandshakeOvalSvg: React.FC<HandshakeOvalSvgProps> = ({
  variant = "auto",
  className = "w-[32px] h-[22px] shrink-0",
}) => {
  const modeClass =
    variant === "teal"
      ? "handshake-badge-teal"
      : variant === "white"
      ? "handshake-badge-white"
      : "handshake-badge-auto";

  return (
    <svg
      viewBox="0 0 140 96"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ask Elon handshake emblem"
      className={`${modeClass} ${className}`}
    >
      {/* Outer horizontal oval with unclipped turquoise outline in dark mode */}
      <ellipse
        cx="70"
        cy="48"
        rx="66"
        ry="43.5"
        strokeWidth="3"
        className="handshake-oval-bg handshake-oval-border"
      />

      {/* Left sleeve cuff (angled) */}
      <g transform="translate(26.5 41) rotate(21)">
        <rect
          x="-9"
          y="-16"
          width="17.5"
          height="32"
          rx="2.6"
          className="handshake-oval-fg"
        />
      </g>

      {/* Right sleeve cuff (angled) */}
      <g transform="translate(113.5 41) rotate(-21)">
        <rect
          x="-8.5"
          y="-16"
          width="17.5"
          height="32"
          rx="2.6"
          className="handshake-oval-fg"
        />
      </g>

      {/* Left hand + palm + extended 4 fingers on bottom-right */}
      <path
        d="M 41.5 29.5 L 55 31.2 C 61 24.8 70.2 25.5 76 31.4 L 62.5 43.2 C 58.6 46.8 60.4 52.8 65.8 53.2 C 69.5 53.5 72.5 50.8 77.2 46.8 L 101.2 66.8 C 103.8 69.0 103.8 73.2 101.2 75.6 C 98.8 77.8 95.2 77.5 92.8 75.2 L 85.4 68.8 L 94.4 76.8 C 96.8 79.0 96.8 82.8 94.4 85.1 C 92.0 87.3 88.4 87.1 86.0 84.9 L 78.2 77.8 L 85.5 84.6 C 87.8 86.8 87.7 90.4 85.4 92.5 C 83.1 94.6 79.6 94.5 77.3 92.3 L 40.5 59.5 L 34.0 54.5 Z"
        className="handshake-oval-fg"
      />

      {/* Right hand arching across top with thumb grip */}
      <path
        d="M 99.5 29.2 L 89.2 31.5 C 81.8 25.0 72.2 24.6 64.8 31.2 L 54.2 40.8 C 51.4 43.4 51.6 47.6 54.5 49.8 C 57.3 51.9 61.3 51.3 63.8 48.8 L 71.2 41.6 C 73.4 39.5 76.8 39.5 79.1 41.4 L 100.8 59.4 L 106.2 54.2 Z"
        className="handshake-oval-fg handshake-oval-stroke"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Finger separation lines on bottom-right extended fingers */}
      <line
        x1="84.5"
        y1="67.5"
        x2="96.5"
        y2="78.0"
        className="handshake-oval-stroke"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <line
        x1="77.2"
        y1="75.2"
        x2="88.8"
        y2="85.8"
        className="handshake-oval-stroke"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <line
        x1="70.2"
        y1="82.5"
        x2="79.5"
        y2="91.0"
        className="handshake-oval-stroke"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* 4 curled knuckles / fingertips under left palm on bottom-left */}
      <g className="handshake-oval-fg handshake-oval-stroke" strokeWidth="2.5">
        <rect x="40.5" y="57.5" width="9.2" height="14.5" rx="4.6" transform="rotate(34 45.1 64.7)" />
        <rect x="47.2" y="63.5" width="9.2" height="14.8" rx="4.6" transform="rotate(34 51.8 70.9)" />
        <rect x="54.2" y="69.2" width="9.2" height="14.5" rx="4.6" transform="rotate(34 58.8 76.4)" />
        <rect x="61.5" y="74.6" width="8.8" height="13.6" rx="4.4" transform="rotate(34 65.9 81.4)" />
      </g>
    </svg>
  );
};

interface LegalLetterFooterProps {
  locale?: Locale;
  page?: number;
  totalPages?: number;
  variant?: "auto" | "teal" | "white";
  /** True when rendered on light cream (#FFF6EF) simulated paper background */
  paperSurface?: boolean;
  className?: string;
}

export const LegalLetterFooter: React.FC<LegalLetterFooterProps> = ({
  locale = "en",
  page = 1,
  totalPages = 1,
  variant,
  paperSurface = false,
  className = "",
}) => {
  const effectiveVariant: "auto" | "teal" | "white" =
    variant ?? (paperSurface ? "teal" : "auto");

  const line1 =
    locale === "pl"
      ? "Przygotowano w Ask Elon, Twoim związkowym kumplu w UK · askelon.uk"
      : locale === "ro"
      ? "Pregătit cu Ask Elon, colegul tău de sindicat în UK · askelon.uk"
      : "Prepared with Ask Elon, your union mate in the UK · askelon.uk";

  const line2 =
    locale === "pl"
      ? `Pismo przygotował nadawca z pomocą Ask Elon. Nie stanowi porady prawnej. Strona ${page} z ${totalPages}`
      : locale === "ro"
      ? `Această scrisoare a fost pregătită de expeditor cu ajutorul Ask Elon. Nu constituie consultanță juridică. Pagina ${page} din ${totalPages}`
      : `This letter was prepared by the sender with the help of Ask Elon. It is not legal advice. Page ${page} of ${totalPages}`;

  const containerColors = paperSurface
    ? "border-[#161B22]/15 text-[#334155]"
    : "border-slate-200 dark:border-white/15 text-slate-600 dark:text-[#94A3B8]";

  const primaryTextColors = paperSurface
    ? "text-[#161B22]"
    : "text-slate-800 dark:text-[#F1F5F9]";

  return (
    <footer
      className={`ask-elon-letter-footer mt-5 pt-3 border-t flex items-center gap-2.5 ${containerColors} ${className}`}
    >
      <HandshakeOvalSvg
        variant={effectiveVariant}
        className="w-[32px] h-[22px] shrink-0"
      />
      <div className="min-w-0 flex-1 text-[10.5px] sm:text-[11px] leading-[1.35]">
        <p className={`font-semibold ${primaryTextColors} break-words`}>
          {line1}
        </p>
        <p className="opacity-85 break-words">{line2}</p>
      </div>
    </footer>
  );
};
