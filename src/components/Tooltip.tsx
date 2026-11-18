import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useId,
} from "react";
import { createPortal } from "react-dom";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Primary tooltip label shown inside the floating Chancery card */
  content: React.ReactNode;
  /** Optional muted secondary hint line (e.g. shortcut or gesture hint) */
  hint?: React.ReactNode;
  /** Preferred side relative to the trigger element; auto-flips if clipped */
  side?: TooltipSide;
  /** Hover intent delay in milliseconds (default: 150ms) */
  delayMs?: number;
  /** Suppresses tooltip display (e.g. when a dropdown or radial menu is open) */
  disabled?: boolean;
  /** Optional wrapper element mode for disabled buttons or non-element children */
  wrap?: boolean;
  /** Class applied to wrapper span when wrap=true */
  wrapperClassName?: string;
  /** Trigger element */
  children: React.ReactElement<any>;
}

const VIEWPORT_MARGIN = 10;
const TRIGGER_GAP = 9;
const TOUCH_SUPPRESS_WINDOW_MS = 850;

function isCoarseTouchEnvironment(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): (node: T | null) => void {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        try {
          (ref as React.MutableRefObject<T | null>).current = node;
        } catch {
          // ignore readonly refs
        }
      }
    }
  };
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  hint,
  side = "top",
  delayMs = 150,
  disabled = false,
  wrap = false,
  wrapperClassName = "inline-flex shrink-0",
  children,
}) => {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    actualSide: TooltipSide;
    arrowOffset: number;
  }>({
    top: -9999,
    left: -9999,
    actualSide: side,
    arrowOffset: 16,
  });

  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTimestampRef = useRef<number>(0);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const hideTooltip = useCallback(() => {
    clearShowTimer();
    setIsOpen(false);
    setIsPositioned(false);
  }, [clearShowTimer]);

  const scheduleShow = useCallback(() => {
    if (disabled || !content || isCoarseTouchEnvironment()) return;
    if (Date.now() - lastTouchTimestampRef.current < TOUCH_SUPPRESS_WINDOW_MS) {
      return;
    }
    clearShowTimer();
    showTimerRef.current = setTimeout(() => {
      showTimerRef.current = null;
      if (!disabled) {
        setIsOpen(true);
      }
    }, delayMs);
  }, [disabled, content, delayMs, clearShowTimer]);

  // Immediately dismiss if tooltip becomes disabled (e.g., dropdown/menu opens)
  useEffect(() => {
    if (disabled || !content) {
      hideTooltip();
    }
  }, [disabled, content, hideTooltip]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearShowTimer();
    };
  }, [clearShowTimer]);

  // Global dismissal on scroll, resize, or Escape while visible
  useEffect(() => {
    if (!isOpen) return;

    const handleDismiss = () => hideTooltip();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideTooltip();
      }
    };

    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, hideTooltip]);

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const tooltipEl = tooltipRef.current;
    if (!triggerEl || !tooltipEl || typeof window === "undefined") return;

    const tr = triggerEl.getBoundingClientRect();
    const tt = tooltipEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (tr.width === 0 && tr.height === 0) {
      hideTooltip();
      return;
    }

    const fitsTop = tr.top - TRIGGER_GAP - tt.height >= VIEWPORT_MARGIN;
    const fitsBottom = tr.bottom + TRIGGER_GAP + tt.height <= vh - VIEWPORT_MARGIN;
    const fitsLeft = tr.left - TRIGGER_GAP - tt.width >= VIEWPORT_MARGIN;
    const fitsRight = tr.right + TRIGGER_GAP + tt.width <= vw - VIEWPORT_MARGIN;

    let actualSide: TooltipSide = side;
    if (side === "top" && !fitsTop && fitsBottom) {
      actualSide = "bottom";
    } else if (side === "bottom" && !fitsBottom && fitsTop) {
      actualSide = "top";
    } else if (side === "left" && !fitsLeft && fitsRight) {
      actualSide = "right";
    } else if (side === "right" && !fitsRight && fitsLeft) {
      actualSide = "left";
    } else if ((side === "left" || side === "right") && !fitsLeft && !fitsRight) {
      actualSide = fitsTop ? "top" : "bottom";
    }

    let left = 0;
    let top = 0;
    let arrowOffset = 16;

    if (actualSide === "top" || actualSide === "bottom") {
      const triggerCenterX = tr.left + tr.width / 2;
      const rawLeft = triggerCenterX - tt.width / 2;
      left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(vw - tt.width - VIEWPORT_MARGIN, rawLeft)
      );
      top =
        actualSide === "top"
          ? tr.top - tt.height - TRIGGER_GAP
          : tr.bottom + TRIGGER_GAP;
      top = Math.max(
        VIEWPORT_MARGIN,
        Math.min(vh - tt.height - VIEWPORT_MARGIN, top)
      );
      arrowOffset = Math.max(
        10,
        Math.min(tt.width - 10, triggerCenterX - left)
      );
    } else {
      const triggerCenterY = tr.top + tr.height / 2;
      const rawTop = triggerCenterY - tt.height / 2;
      top = Math.max(
        VIEWPORT_MARGIN,
        Math.min(vh - tt.height - VIEWPORT_MARGIN, rawTop)
      );
      left =
        actualSide === "left"
          ? tr.left - tt.width - TRIGGER_GAP
          : tr.right + TRIGGER_GAP;
      left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(vw - tt.width - VIEWPORT_MARGIN, left)
      );
      arrowOffset = Math.max(
        10,
        Math.min(tt.height - 10, triggerCenterY - top)
      );
    }

    setCoords({ top, left, actualSide, arrowOffset });
    setIsPositioned(true);
  }, [side, hideTooltip]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, content, hint, updatePosition]);

  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || isCoarseTouchEnvironment()) {
      lastTouchTimestampRef.current = Date.now();
      hideTooltip();
      return;
    }
    scheduleShow();
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    hideTooltip();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") {
      lastTouchTimestampRef.current = Date.now();
    }
    hideTooltip();
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (Date.now() - lastTouchTimestampRef.current < TOUCH_SUPPRESS_WINDOW_MS) {
      return;
    }
    if (isCoarseTouchEnvironment()) return;
    try {
      if (e.currentTarget.matches(":focus-visible")) {
        scheduleShow();
      }
    } catch {
      scheduleShow();
    }
  };

  const handleBlur = () => {
    hideTooltip();
  };

  const childProps = (children.props || {}) as Record<string, any>;
  const isChildDisabled = Boolean(childProps.disabled);
  const useWrapper = wrap || isChildDisabled;

  const triggerElement = useWrapper ? (
    <span
      ref={(node) => {
        triggerRef.current = node;
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={wrapperClassName}
      aria-describedby={isOpen ? tooltipId : undefined}
    >
      {children}
    </span>
  ) : (
    React.cloneElement(children, {
      ref: mergeRefs<HTMLElement>(
        (node) => {
          triggerRef.current = node;
        },
        childProps.ref
      ),
      "aria-describedby":
        [childProps["aria-describedby"], isOpen ? tooltipId : undefined]
          .filter(Boolean)
          .join(" ") || undefined,
      onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
        childProps.onPointerEnter?.(e);
        handlePointerEnter(e);
      },
      onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
        childProps.onPointerLeave?.(e);
        handlePointerLeave(e);
      },
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        childProps.onPointerDown?.(e);
        handlePointerDown(e);
      },
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        childProps.onFocus?.(e);
        handleFocus(e);
      },
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        childProps.onBlur?.(e);
        handleBlur();
      },
    })
  );

  const arrowPositionStyle: React.CSSProperties =
    coords.actualSide === "top"
      ? { left: `${coords.arrowOffset}px`, bottom: "-4.5px", transform: "translateX(-50%) rotate(45deg)" }
      : coords.actualSide === "bottom"
      ? { left: `${coords.arrowOffset}px`, top: "-4.5px", transform: "translateX(-50%) rotate(45deg)" }
      : coords.actualSide === "left"
      ? { top: `${coords.arrowOffset}px`, right: "-4.5px", transform: "translateY(-50%) rotate(45deg)" }
      : { top: `${coords.arrowOffset}px`, left: "-4.5px", transform: "translateY(-50%) rotate(45deg)" };

  const arrowBorderClass =
    coords.actualSide === "top"
      ? "border-r border-b"
      : coords.actualSide === "bottom"
      ? "border-l border-t"
      : coords.actualSide === "left"
      ? "border-r border-t"
      : "border-l border-b";

  const entranceShiftClass =
    coords.actualSide === "top"
      ? isPositioned
        ? "translate-y-0"
        : "translate-y-1"
      : coords.actualSide === "bottom"
      ? isPositioned
        ? "translate-y-0"
        : "-translate-y-1"
      : coords.actualSide === "left"
      ? isPositioned
        ? "translate-x-0"
        : "translate-x-1"
      : isPositioned
      ? "translate-x-0"
      : "-translate-x-1";

  return (
    <>
      {triggerElement}
      {isOpen &&
        !disabled &&
        content &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={`z-[95] pointer-events-none select-none max-w-[250px] px-2.5 py-1.5 rounded-lg border bg-white text-slate-900 border-slate-200/95 shadow-[0_10px_28px_-6px_rgba(15,23,42,0.2),0_2px_8px_rgba(15,23,42,0.08)] dark:bg-[#101C33] dark:text-[#F8FAFC] dark:border-slate-700/90 dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.68),0_0_0_1px_rgba(56,178,139,0.16)] transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
              isPositioned ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } ${entranceShiftClass}`}
          >
            {/* Directional Chancery Card Caret */}
            <span
              aria-hidden="true"
              style={arrowPositionStyle}
              className={`absolute w-2 h-2 bg-white dark:bg-[#101C33] border-slate-200/95 dark:border-slate-700/90 ${arrowBorderClass}`}
            />

            <div className="relative z-10 text-left">
              <div className="text-[11.5px] font-semibold tracking-tight leading-snug text-slate-900 dark:text-[#F8FAFC]">
                {content}
              </div>
              {hint && (
                <div className="text-[10.5px] font-medium leading-snug text-slate-500 dark:text-slate-400 mt-0.5">
                  {hint}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
