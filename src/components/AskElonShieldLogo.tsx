import React from "react";
import { RobotActivityState } from "../types";
import { useApp } from "../context/AppContext";

interface AskElonShieldLogoProps {
  className?: string;
  active?: boolean;
  isActive?: boolean;
  activityState?: RobotActivityState;
  variant?: "shield" | "head-only";
}

/**
 * Analyzes the sentiment of the AI's generated response (and optional user context)
 * to determine whether the robot should enter the 'happy' or 'concerned' state.
 */
export function analyzeAiResponseSentiment(
  aiText: string,
  userText: string = ""
): "happy" | "concerned" | null {
  const combined = `${aiText || ""} ${userText || ""}`.toLowerCase();
  if (!combined.trim()) return null;

  // Concerned signals: unlawful deductions, unfair dismissal, discrimination, urgent deadlines, violations, refusal
  const concernedMatches =
    combined.match(
      /\b(bezprawn\w*|naruszeni\w*|zwolni\w*|wyrzuc\w*|mobbing\w*|dyskryminac\w*|potrąc\w*|piln\w*|natychmiast\w*|termin\w*|3 miesiąc\w*|unlawful\w*|unfair\w*|dismiss\w*|breach\w*|violat\w*|harass\w*|bully\w*|discriminat\w*|deduct\w*|refus\w*|disciplinary|tribunal|warning|zagroż\w*|odmow\w*|nielegaln\w*|skarg\w*|grievance|wypad\w*|withheld|unpaid)\b/gi
    ) || [];

  // Happy / Encouraging signals: strong entitlement, prepared letter ready, resolved issue, good news, profile updated
  const happyMatches =
    combined.match(
      /\b(masz pełne prawo|przysługuje ci|dobra wiadomość|przygotowałem|gotowe pismo|sporządziłem|zabezpiecz\w*|odzysk\w*|ugod\w*|sukces\w*|rozwiązan\w*|entitled|good news|prepared|official letter|settlement|protected|resolved|completed|congrat\w*|świetnie|gratul\w*|pomogę ci|zapisano|\[english_letter_start\])\b/gi
    ) || [];

  if (concernedMatches.length > 0 && concernedMatches.length > happyMatches.length) {
    return "concerned";
  }
  if (happyMatches.length > 0) {
    return "happy";
  }
  if (concernedMatches.length > 0) {
    return "concerned";
  }
  return "happy";
}

export const AskElonShieldLogo: React.FC<AskElonShieldLogoProps> = ({
  className = "w-10 h-10",
  active = false,
  isActive = false,
  activityState,
  variant = "shield",
}) => {
  // Connect to global app context so every logo instance reacts to user activity & AI sentiment automatically
  let contextRobotState: RobotActivityState = "idle";
  try {
    const app = useApp();
    contextRobotState = app.robotState;
  } catch {
    // Fallback if rendered outside provider
  }

  const currentActivity: RobotActivityState = activityState || contextRobotState || "idle";
  const isHighlighted = active || isActive || currentActivity !== "idle";

  // Distinct CSS animation classes for the robot SVG head
  const headAnimClass =
    currentActivity === "happy"
      ? "robot-svg-head-happy"
      : currentActivity === "concerned"
      ? "robot-svg-head-concerned"
      : currentActivity === "speaking"
      ? "robot-svg-head-speaking"
      : currentActivity === "listening"
      ? "robot-svg-head-listening"
      : currentActivity === "thinking"
      ? "robot-svg-head-thinking"
      : currentActivity === "typing"
      ? "robot-svg-head-typing"
      : currentActivity === "success"
      ? "robot-svg-head-success"
      : "robot-svg-head-idle";

  const eyesAnimClass =
    currentActivity === "typing"
      ? "robot-svg-eyes-typing"
      : currentActivity === "idle"
      ? "robot-svg-eyes-idle"
      : "";

  const earAnimClass =
    currentActivity === "listening" ||
    currentActivity === "speaking" ||
    currentActivity === "happy" ||
    currentActivity === "concerned"
      ? "robot-svg-ear-active"
      : "";

  const antennaColor =
    currentActivity === "concerned"
      ? "#F59E0B"
      : currentActivity === "listening" || currentActivity === "speaking"
      ? "#D97724"
      : currentActivity === "thinking"
      ? "#F59E0B"
      : "#38B28B";

  const isHeadOnly = variant === "head-only";

  return (
    <svg
      viewBox={isHeadOnly ? "20 4 80 72" : "0 0 120 128"}
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-robot-state={currentActivity}
      aria-label={`ask Elon Logo - ${currentActivity}`}
    >
      <defs>
        <linearGradient id="shieldBorderGrad" x1="12" y1="6" x2="108" y2="122" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38B28B" />
          <stop offset="50%" stopColor="#1D6852" />
          <stop offset="100%" stopColor="#D97724" />
        </linearGradient>

        <linearGradient id="shieldBodyGrad" x1="60" y1="10" x2="60" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#162238" />
          <stop offset="55%" stopColor="#11192B" />
          <stop offset="100%" stopColor="#0B0F17" />
        </linearGradient>

        <linearGradient id="visorDarkGrad" x1="36" y1="31" x2="84" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#09111E" />
          <stop offset="100%" stopColor="#13233A" />
        </linearGradient>

        <linearGradient id="robotShellGrad" x1="36" y1="22" x2="84" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="70%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>

      {!isHeadOnly && (
        <>
          {/* Outer Shield Frame */}
          <path
            d="M60 5L14 23V59C14 89.5 33.8 114.6 60 123C86.2 114.6 106 89.5 106 59V23L60 5Z"
            fill="url(#shieldBodyGrad)"
            stroke="url(#shieldBorderGrad)"
            strokeWidth={isHighlighted ? "4.2" : "3"}
          />

          {/* Subtle Inner Shield Trim */}
          <path
            d="M60 11L20 26.8V58.5C20 85.2 37.1 107.6 60 115.4C82.9 107.6 100 85.2 100 58.5V26.8L60 11Z"
            stroke={
              currentActivity === "concerned" ||
              currentActivity === "speaking" ||
              currentActivity === "listening"
                ? "#D97724"
                : "#38B28B"
            }
            strokeOpacity={isHighlighted ? "0.48" : "0.24"}
            strokeWidth="1.3"
          />
        </>
      )}

      {/* Robot Collar / Neck Base */}
      <path
        d="M45 66H75L79 74H41L45 66Z"
        fill="#1D6852"
        stroke="#38B28B"
        strokeOpacity="0.45"
        strokeWidth="1"
      />

      {/* ACTIVE MOVING & HEAD-STRETCHING ROBOT HEAD GROUP */}
      <g className={headAnimClass}>
        {/* Antenna Signal Waves when Listening / Thinking / Speaking / Happy / Concerned */}
        {(currentActivity === "listening" ||
          currentActivity === "thinking" ||
          currentActivity === "speaking" ||
          currentActivity === "happy" ||
          currentActivity === "concerned") && (
          <>
            <circle
              cx="60"
              cy="13"
              r="7.5"
              stroke={antennaColor}
              strokeOpacity="0.6"
              strokeWidth="1.4"
              strokeDasharray="3 2"
            />
            <circle
              cx="60"
              cy="13"
              r="11"
              stroke={antennaColor}
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          </>
        )}

        {/* Robot Antenna */}
        <line x1="60" y1="14" x2="60" y2="23" stroke="#D97724" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="13" r="3.8" fill={antennaColor} stroke="#0B0F17" strokeWidth="1.2" />

        {/* Soundwave / Reaction Arcs next to Headphones */}
        {(currentActivity === "listening" ||
          currentActivity === "speaking" ||
          currentActivity === "happy") && (
          <g
            stroke={currentActivity === "happy" ? "#38B28B" : "#D97724"}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          >
            <path d="M23 39C20.5 42.5 20.5 47.5 23 51" />
            <path d="M97 39C99.5 42.5 99.5 47.5 97 51" />
          </g>
        )}

        {/* Robot Ear / Headphones (Warm Ochre) */}
        <g className={earAnimClass}>
          <rect x="26.5" y="36.5" width="6.5" height="17" rx="3.2" fill="#D97724" />
          <rect x="87" y="36.5" width="6.5" height="17" rx="3.2" fill="#D97724" />
        </g>

        {/* Robot Head Shell */}
        <rect
          x="32"
          y="22.5"
          width="56"
          height="44"
          rx="18"
          fill="url(#robotShellGrad)"
          stroke="#0B0F17"
          strokeWidth="2.2"
        />

        {/* Visor Screen */}
        <rect
          x="37.5"
          y="30"
          width="45"
          height="23.5"
          rx="9.5"
          fill="url(#visorDarkGrad)"
          stroke={
            currentActivity === "concerned"
              ? "#F59E0B"
              : currentActivity === "speaking" || currentActivity === "listening"
              ? "#D97724"
              : "#38B28B"
          }
          strokeOpacity="0.65"
          strokeWidth="1.3"
        />

        {/* Thinking Visor Scanner Beam */}
        {currentActivity === "thinking" && (
          <rect
            x="53"
            y="32"
            width="14"
            height="19.5"
            rx="4"
            fill="#D97724"
            fillOpacity="0.28"
            className="robot-svg-visor-beam"
          />
        )}

        {/* DYNAMIC EYES BY ACTIVITY & SENTIMENT STATE */}
        <g className={eyesAnimClass}>
          {currentActivity === "happy" || currentActivity === "success" ? (
            /* Happy Stretched Smiling ^ ^ Eyes + Warm Cheek Glow */
            <>
              <path
                d="M44.5 41.5C46.5 37.5 51.5 37.5 53.5 41.5"
                stroke="#38B28B"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M66.5 41.5C68.5 37.5 73.5 37.5 75.5 41.5"
                stroke="#38B28B"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle cx="43.5" cy="44.5" r="2" fill="#D97724" fillOpacity="0.55" />
              <circle cx="76.5" cy="44.5" r="2" fill="#D97724" fillOpacity="0.55" />
            </>
          ) : currentActivity === "concerned" ? (
            /* Concerned Empathetic Eyes with Furrowed Eyebrows */
            <>
              <line
                x1="44"
                y1="36.8"
                x2="53.5"
                y2="34.2"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="66.5"
                y1="34.2"
                x2="76"
                y2="36.8"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="49.5" cy="41.5" r="4.1" fill="#F59E0B" />
              <circle cx="48.5" cy="40.3" r="1.4" fill="#FFFFFF" />
              <circle cx="70.5" cy="41.5" r="4.1" fill="#F59E0B" />
              <circle cx="69.5" cy="40.3" r="1.4" fill="#FFFFFF" />
            </>
          ) : currentActivity === "thinking" ? (
            /* Analytical Focused Ring Eyes when Thinking */
            <>
              <circle cx="49.5" cy="40.5" r="4.2" stroke="#D97724" strokeWidth="2.2" fill="#09111E" />
              <circle cx="49.5" cy="40.5" r="1.6" fill="#38B28B" />
              <circle cx="70.5" cy="40.5" r="4.2" stroke="#D97724" strokeWidth="2.2" fill="#09111E" />
              <circle cx="70.5" cy="40.5" r="1.6" fill="#38B28B" />
            </>
          ) : currentActivity === "listening" ? (
            /* Wide Attentive Eyes when Listening to Microphone */
            <>
              <circle cx="49.5" cy="40.5" r="4.8" fill="#38B28B" />
              <circle cx="49.5" cy="40.5" r="2" fill="#FFFFFF" />
              <circle cx="70.5" cy="40.5" r="4.8" fill="#38B28B" />
              <circle cx="70.5" cy="40.5" r="2" fill="#FFFFFF" />
            </>
          ) : (
            /* Standard / Typing / Speaking Expressive Glowing Eyes */
            <>
              <circle cx="49.5" cy="40.5" r="4.2" fill="#38B28B" />
              <circle cx="48.2" cy="39.2" r="1.4" fill="#FFFFFF" />
              <circle cx="70.5" cy="40.5" r="4.2" fill="#38B28B" />
              <circle cx="69.2" cy="39.2" r="1.4" fill="#FFFFFF" />
            </>
          )}

          {/* Subtle Eyebrow Indicator when Typing / Reacting to User Info */}
          {currentActivity === "typing" && (
            <>
              <line x1="45" y1="34.2" x2="53.5" y2="35" stroke="#38B28B" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="66.5" y1="35" x2="75" y2="34.2" stroke="#38B28B" strokeWidth="1.6" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* DYNAMIC MOUTH / VOICE GRILL BY ACTIVITY & SENTIMENT STATE */}
        {currentActivity === "speaking" ? (
          /* Animated Talking Mouth / Equalizer when Elon Speaks */
          <g className="robot-svg-mouth-speaking">
            <rect x="51" y="45.5" width="2.6" height="5" rx="1.3" fill="#D97724" />
            <rect x="55" y="44.2" width="2.8" height="7.5" rx="1.4" fill="#38B28B" />
            <rect x="59" y="43.8" width="2.8" height="8.2" rx="1.4" fill="#FFFFFF" />
            <rect x="63" y="44.2" width="2.8" height="7.5" rx="1.4" fill="#38B28B" />
            <rect x="67" y="45.5" width="2.6" height="5" rx="1.3" fill="#D97724" />
          </g>
        ) : currentActivity === "happy" || currentActivity === "success" ? (
          /* Wide Stretched Joyful Smile */
          <path
            d="M51.5 46.2C54.5 51.5 65.5 51.5 68.5 46.2"
            stroke="#38B28B"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        ) : currentActivity === "concerned" ? (
          /* Concerned Empathetic Curve */
          <path
            d="M54 49.5C56.5 46.8 63.5 46.8 66 49.5"
            stroke="#F59E0B"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        ) : currentActivity === "listening" ? (
          /* Attentive Open Receiver Mouth when User Dictates */
          <rect
            x="53.5"
            y="45.8"
            width="13"
            height="4.4"
            rx="2.2"
            fill="#D97724"
            stroke="#FFFFFF"
            strokeWidth="0.8"
          />
        ) : currentActivity === "thinking" ? (
          /* Thoughtful Processing Dots */
          <g fill="#D97724">
            <circle cx="55" cy="48" r="1.5" />
            <circle cx="60" cy="48" r="1.5" fill="#38B28B" />
            <circle cx="65" cy="48" r="1.5" />
          </g>
        ) : currentActivity === "typing" ? (
          /* Curious Reading Smile when Reacting to User Information */
          <path
            d="M53.5 47.2C56 50.2 64 50.2 66.5 47.2"
            stroke="#38B28B"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : (
          /* Friendly Confident Smile (Idle) */
          <path
            d="M53.5 47.2C56 50.2 64 50.2 66.5 47.2"
            stroke="#38B28B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        )}
      </g>

      {!isHeadOnly && (
        <>
          {/* "ask" Ribbon Pill */}
          <rect
            x="43"
            y="59.5"
            width="34"
            height="13"
            rx="6.5"
            fill="#D97724"
            stroke="#0B0F17"
            strokeWidth="1.5"
          />
          <text
            x="60"
            y="68.8"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9.5"
            fontWeight="900"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            letterSpacing="0.6"
          >
            ask
          </text>

          {/* "ELON" Typography */}
          <text
            x="60"
            y="93.5"
            textAnchor="middle"
            fill="#F1F5F9"
            fontSize="20"
            fontWeight="900"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            letterSpacing="1.2"
          >
            ELON
          </text>

          {/* Bottom Status Dot */}
          <circle
            cx="60"
            cy="105.5"
            r="2.6"
            fill={
              currentActivity === "concerned"
                ? "#F59E0B"
                : currentActivity === "speaking" || currentActivity === "listening"
                ? "#D97724"
                : "#38B28B"
            }
          />
        </>
      )}
    </svg>
  );
};
