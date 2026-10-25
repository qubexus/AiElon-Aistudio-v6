import React, { useId } from "react";
import { TabType } from "../context/AppContext";

interface AskElonShieldLogoProps {
  className?: string;
  isActive?: boolean;
  tabVariant?: TabType;
}

/**
 * Official "ASK Elon" Shield / Order Badge with the Cyber-Monocle Robot inside.
 * Tightly framed viewBox without any inner green border so the badge appears large and clean.
 */
export const AskElonShieldLogo: React.FC<AskElonShieldLogoProps> = ({
  className = "w-20 h-20",
  isActive = true,
  tabVariant = "chat",
}) => {
  const uid = useId().replace(/:/g, "");
  const glowId = `elon-glow-${uid}`;
  const faceClipId = `elon-face-clip-${uid}`;
  const helmetClipId = `elon-helmet-clip-${uid}`;

  const facePath =
    "M 50 40.5 C 63 40.5, 69.5 44.5, 69.5 55.5 C 69.5 68.5, 60.5 76.5, 50 81.5 C 39.5 76.5, 30.5 68.5, 30.5 55.5 C 30.5 44.5, 37 40.5, 50 40.5 Z";

  return (
    <svg
      viewBox="6 1 88 103"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Neon Golden-Amber Glow */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation={isActive ? "2.8" : "1.8"}
            floodColor="#F59E0B"
            floodOpacity={isActive ? "0.9" : "0.6"}
          />
        </filter>

        <clipPath id={faceClipId}>
          <path d={facePath} />
        </clipPath>

        <clipPath id={helmetClipId}>
          <path d="M 50 33.5 C 67 33.5, 76.5 39.5, 76.5 55.5 C 76.5 68, 69 75.5, 61 78.5 L 50 81.5 L 39 78.5 C 31 75.5, 23.5 68, 23.5 55.5 C 23.5 39.5, 33 33.5, 50 33.5 Z" />
        </clipPath>
      </defs>

      {/* Outer Glowing Golden Shield / Order Crest (no green inner border) */}
      <path
        d="M 50 5.5 C 64 5.5, 77.5 9.5, 88.5 15.5 C 90 50.5, 81.5 78.5, 50 99.5 C 18.5 78.5, 10 50.5, 11.5 15.5 C 22.5 9.5, 36 5.5, 50 5.5 Z"
        fill="#111C24"
        stroke="#F5A623"
        strokeWidth="3.2"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />

      {/* Bold "ASK" Typography in Upper Shield Arch */}
      <text
        x="50"
        y="29.5"
        textAnchor="middle"
        fill="#F5A623"
        fontSize="16.5"
        fontWeight="900"
        fontFamily="Inter, Montserrat, system-ui, sans-serif"
        letterSpacing="0.8"
      >
        ASK
      </text>

      {/* Left & Right Ear Pads */}
      <path
        d="M 21.5 47 C 17 47.5, 15.2 51, 15.2 56 C 15.2 61, 17 64.5, 21.5 65 Z"
        fill={tabVariant === "forum" ? "#F5A623" : "#316B4E"}
      />
      <path
        d="M 78.5 47 C 83 47.5, 84.8 51, 84.8 56 C 84.8 61, 83 64.5, 78.5 65 Z"
        fill={tabVariant === "forum" ? "#F5A623" : "#23503A"}
      />

      {/* Two-Tone Robot Helmet Arch */}
      <g clipPath={`url(#${helmetClipId})`}>
        <rect x="20" y="32" width="30" height="52" fill="#316B4E" />
        <rect x="50" y="32" width="30" height="52" fill="#23503A" />
      </g>

      {/* Bottom Chin / Neck Guard Piece */}
      <path
        d="M 37.5 82.5 Q 44 86.2 50 86.5 L 50 90.8 Q 41.5 89.8 37.5 82.5 Z"
        fill="#316B4E"
      />
      <path
        d="M 62.5 82.5 Q 56 86.2 50 86.5 L 50 90.8 Q 58.5 89.8 62.5 82.5 Z"
        fill="#23503A"
      />

      {/* Two-Tone Dark Face Interior */}
      <g clipPath={`url(#${faceClipId})`}>
        <rect x="28" y="38" width="22" height="46" fill="#244B3B" />
        <rect x="50" y="38" width="22" height="46" fill="#18352B" />
      </g>

      {/* Glowing Golden Face Visor Outline */}
      <path
        d={facePath}
        stroke="#F5A623"
        strokeWidth="2.8"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />

      {/* Left Eye — Cheerful Wink Arc */}
      <path
        d="M 37.5 54.5 C 39.5 50.2, 44.5 50.2, 46.5 54.5"
        stroke="#F5A623"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Right Eye — Cybernetic Monocle with 3 Circuit Lines */}
      <line
        x1="58.5"
        y1="41.2"
        x2="58.5"
        y2="47.8"
        stroke="#F5A623"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <line
        x1="58.5"
        y1="61.2"
        x2="58.5"
        y2="75.8"
        stroke="#F5A623"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <line
        x1="65.2"
        y1="54.5"
        x2="69.2"
        y2="54.5"
        stroke="#F5A623"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle
        cx="58.5"
        cy="54.5"
        r="6.6"
        fill="#18352B"
        stroke="#F5A623"
        strokeWidth="2.6"
      />
      <circle cx="58.5" cy="54.5" r="2.7" fill="#F5A623" />

      {/* Center Smile Arc */}
      <path
        d="M 44 65.5 C 47 69.2, 53 69.2, 56 65.5"
        stroke="#F5A623"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
};
