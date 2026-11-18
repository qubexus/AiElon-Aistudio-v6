import React from "react";
import { RobotActivityState } from "../types";

export type PeekEdgeSide = "left" | "right";

interface ElonPeekingBubbleGripProps {
  side: PeekEdgeSide;
  activityState?: RobotActivityState;
}

/**
 * Renders Elon peeking halfway out from behind the left or right edge of a bot chat bubble,
 * with his articulated metallic fingers wrapping around and clamping onto the front of the bubble edge.
 * Uses absolute positioning + high z-index while staying strictly within the bubble's edge margin/padding
 * so message text is never covered.
 */
export const ElonPeekingBubbleGrip: React.FC<ElonPeekingBubbleGripProps> = ({
  side,
  activityState = "idle",
}) => {
  const isLeft = side === "left";

  const accentGlow =
    activityState === "concerned"
      ? "#F59E0B"
      : activityState === "speaking" || activityState === "listening"
      ? "#F59E42"
      : "#52B798";

  // Eye gaze offset: look inward toward the message bubble text
  const gazeOffsetX = isLeft ? 2.2 : -2.2;

  return (
    <div
      aria-hidden="true"
      data-peek-side={side}
      data-robot-state={activityState}
      className={`pointer-events-none select-none absolute top-2.5 ${
        isLeft ? "left-0" : "right-0"
      } w-0 h-14 z-30`}
    >
      {/* LAYER 1: Half-protruding Robot Head peeking from behind the bubble edge */}
      <div
        className={`absolute top-0 ${
          isLeft
            ? "-left-[23px] sm:-left-[25px] elon-peek-head-left"
            : "-right-[23px] sm:-right-[25px] elon-peek-head-right"
        } w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] z-20 drop-shadow-[0_4px_8px_rgba(15,23,42,0.28)]`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient
              id={`peekHeadShell_${side}`}
              x1="10"
              y1="14"
              x2="54"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="65%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient
              id={`peekVisor_${side}`}
              x1="14"
              y1="22"
              x2="50"
              y2="46"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>

          {/* Clip the inner 35% of the head that tucks behind the bubble edge so Elon peeks out halfway */}
          <clipPath id={`peekHalfClip_${side}`}>
            {isLeft ? (
              <rect x="-8" y="-8" width="50" height="80" rx="4" />
            ) : (
              <rect x="22" y="-8" width="50" height="80" rx="4" />
            )}
          </clipPath>

          <g clipPath={`url(#peekHalfClip_${side})`}>
            {/* Antenna */}
            <line
              x1="32"
              y1="5"
              x2="32"
              y2="15"
              stroke="#F59E42"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="32"
              cy="4.5"
              r="3.6"
              fill={accentGlow}
              stroke="#141B23"
              strokeWidth="1.4"
            />

            {/* Outer Earpiece */}
            <rect
              x="4"
              y="26"
              width="6"
              height="16"
              rx="3"
              fill="#F59E42"
              stroke="#141B23"
              strokeWidth="1.3"
            />
            <rect
              x="54"
              y="26"
              width="6"
              height="16"
              rx="3"
              fill="#F59E42"
              stroke="#141B23"
              strokeWidth="1.3"
            />

            {/* Robot Head Shell */}
            <rect
              x="9"
              y="14"
              width="46"
              height="38"
              rx="15"
              fill={`url(#peekHeadShell_${side})`}
              stroke="#141B23"
              strokeWidth="2.2"
            />

            {/* Visor Screen */}
            <rect
              x="14"
              y="21"
              width="36"
              height="21"
              rx="8"
              fill={`url(#peekVisor_${side})`}
              stroke={accentGlow}
              strokeWidth="1.3"
            />

            {/* Peeking Eyes looking inward toward the bubble */}
            <g transform={`translate(${gazeOffsetX}, 0)`}>
              {activityState === "happy" || activityState === "success" ? (
                <>
                  <path
                    d="M19 30 C21 26.5 25 26.5 27 30"
                    stroke="#52B798"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M37 30 C39 26.5 43 26.5 45 30"
                    stroke="#52B798"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <circle cx="23.5" cy="29.5" r="3.6" fill={accentGlow} />
                  <circle cx="22.6" cy="28.4" r="1.2" fill="#FFFFFF" />
                  <circle cx="40.5" cy="29.5" r="3.6" fill={accentGlow} />
                  <circle cx="39.6" cy="28.4" r="1.2" fill="#FFFFFF" />
                </>
              )}
            </g>

            {/* Subtle ASK Visor Badge / Smile */}
            <path
              d="M26 36.8 C28.5 39 35.5 39 38 36.8"
              stroke={accentGlow}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* LAYER 2: Metallic Robot Fingers clamping ON TOP of the bubble's vertical border (highest z-index) */}
      <div
        className={`absolute top-1.5 ${
          isLeft ? "-left-[5px]" : "-right-[5px]"
        } w-[18px] h-[44px] z-30`}
      >
        <svg
          viewBox="0 0 22 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full overflow-visible ${
            isLeft ? "" : "-scale-x-100"
          }`}
        >
          <defs>
            <linearGradient
              id={`metalFingerGrad_${side}`}
              x1="0"
              y1="0"
              x2="20"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="45%" stopColor="#E2E8F0" />
              <stop offset="85%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Contact shadow cast by the fingers onto the bubble surface */}
          <rect
            x="4"
            y="3"
            width="13"
            height="44"
            rx="5"
            fill="#0F172A"
            fillOpacity="0.22"
          />

          {/* Outer Knuckle Mount wrapping around the bubble border */}
          <rect
            x="0.5"
            y="4"
            width="5.5"
            height="42"
            rx="2.75"
            fill="#1E293B"
            stroke="#0F172A"
            strokeWidth="1.2"
          />

          {/* Metallic Finger 1 (Top Index Grip) */}
          <g>
            <rect
              x="2"
              y="6"
              width="15.5"
              height="7.5"
              rx="3.75"
              fill={`url(#metalFingerGrad_${side})`}
              stroke="#0F172A"
              strokeWidth="1.35"
            />
            {/* Phalanx segment line */}
            <line x1="9.5" y1="6.8" x2="9.5" y2="12.7" stroke="#1E293B" strokeWidth="1.2" />
            {/* Glowing grip pad rivet */}
            <circle cx="14" cy="9.75" r="1.35" fill={accentGlow} />
          </g>

          {/* Metallic Finger 2 (Middle Grip) */}
          <g>
            <rect
              x="2"
              y="16.5"
              width="17"
              height="8"
              rx="4"
              fill={`url(#metalFingerGrad_${side})`}
              stroke="#0F172A"
              strokeWidth="1.35"
            />
            <line x1="10.2" y1="17.3" x2="10.2" y2="23.7" stroke="#1E293B" strokeWidth="1.2" />
            <circle cx="15.2" cy="20.5" r="1.4" fill="#F59E42" />
          </g>

          {/* Metallic Finger 3 (Ring Grip) */}
          <g>
            <rect
              x="2"
              y="27.5"
              width="16"
              height="7.5"
              rx="3.75"
              fill={`url(#metalFingerGrad_${side})`}
              stroke="#0F172A"
              strokeWidth="1.35"
            />
            <line x1="9.8" y1="28.3" x2="9.8" y2="34.2" stroke="#1E293B" strokeWidth="1.2" />
            <circle cx="14.4" cy="31.25" r="1.35" fill={accentGlow} />
          </g>

          {/* Metallic Finger 4 (Lower Little Finger Clamp) */}
          <g>
            <rect
              x="2"
              y="38"
              width="13.5"
              height="7"
              rx="3.5"
              fill={`url(#metalFingerGrad_${side})`}
              stroke="#0F172A"
              strokeWidth="1.35"
            />
            <line x1="8.5" y1="38.8" x2="8.5" y2="44.2" stroke="#1E293B" strokeWidth="1.2" />
            <circle cx="12.2" cy="41.5" r="1.2" fill={accentGlow} />
          </g>
        </svg>
      </div>
    </div>
  );
};
