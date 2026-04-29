"use client";

import { RefObject, useEffect, useMemo, useRef, useState } from "react";

type FocusField = "email" | "password" | null;

interface InteractiveMascotProps {
  formContainerRef: RefObject<HTMLDivElement | null>;
  focusField: FocusField;
  isLookingAway: boolean;
}

interface Point {
  x: number;
  y: number;
}

const VIEWBOX = { width: 200, height: 180 };
const LEFT_EYE_CENTER: Point = { x: 72, y: 86 };
const RIGHT_EYE_CENTER: Point = { x: 128, y: 86 };
const PUPIL_MAX_OFFSET = 8;

function getPupilOffset(from: Point, to: Point, maxOffset = PUPIL_MAX_OFFSET): Point {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  return {
    x: Math.cos(angle) * maxOffset,
    y: Math.sin(angle) * maxOffset,
  };
}

export function InteractiveMascot({
  formContainerRef,
  focusField,
  isLookingAway,
}: InteractiveMascotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [leftPupilOffset, setLeftPupilOffset] = useState<Point>({ x: 0, y: 0 });
  const [rightPupilOffset, setRightPupilOffset] = useState<Point>({ x: 0, y: 0 });

  const eyeCenters = useMemo(
    () => ({
      left: LEFT_EYE_CENTER,
      right: RIGHT_EYE_CENTER,
    }),
    [],
  );

  const updatePupilsByScreenTarget = (targetX: number, targetY: number) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const scaleX = rect.width / VIEWBOX.width;
    const scaleY = rect.height / VIEWBOX.height;

    const leftEyeScreen = {
      x: rect.left + eyeCenters.left.x * scaleX,
      y: rect.top + eyeCenters.left.y * scaleY,
    };
    const rightEyeScreen = {
      x: rect.left + eyeCenters.right.x * scaleX,
      y: rect.top + eyeCenters.right.y * scaleY,
    };

    setLeftPupilOffset(getPupilOffset(leftEyeScreen, { x: targetX, y: targetY }));
    setRightPupilOffset(getPupilOffset(rightEyeScreen, { x: targetX, y: targetY }));
  };

  useEffect(() => {
    if (isLookingAway) {
      setLeftPupilOffset({ x: -PUPIL_MAX_OFFSET, y: -PUPIL_MAX_OFFSET });
      setRightPupilOffset({ x: PUPIL_MAX_OFFSET, y: -PUPIL_MAX_OFFSET });
      return;
    }

    if (focusField && formContainerRef.current) {
      const activeInput = formContainerRef.current.querySelector<HTMLInputElement>(
        `input[name="${focusField}"]`,
      );

      if (activeInput) {
        const inputRect = activeInput.getBoundingClientRect();
        const targetX = inputRect.left + inputRect.width / 2;
        const targetY = inputRect.top + inputRect.height / 2;
        updatePupilsByScreenTarget(targetX, targetY);
        return;
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      updatePupilsByScreenTarget(event.clientX, event.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [focusField, formContainerRef, isLookingAway, eyeCenters]);

  return (
    <div className="w-full max-w-[260px]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className="h-auto w-full drop-shadow-[0_12px_35px_rgba(56,189,248,0.25)]"
        role="img"
        aria-label="Friendly login mascot"
      >
        <defs>
          <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="90" r="72" fill="url(#faceGradient)" />
        <circle cx="74" cy="86" r="22" fill="#ffffff" />
        <circle cx="126" cy="86" r="22" fill="#ffffff" />

        <circle cx={LEFT_EYE_CENTER.x + leftPupilOffset.x} cy={LEFT_EYE_CENTER.y + leftPupilOffset.y} r="9" fill="#0f172a" />
        <circle cx={RIGHT_EYE_CENTER.x + rightPupilOffset.x} cy={RIGHT_EYE_CENTER.y + rightPupilOffset.y} r="9" fill="#0f172a" />

        <circle cx={LEFT_EYE_CENTER.x + leftPupilOffset.x + 3} cy={LEFT_EYE_CENTER.y + leftPupilOffset.y - 3} r="2.3" fill="#ffffff" />
        <circle cx={RIGHT_EYE_CENTER.x + rightPupilOffset.x + 3} cy={RIGHT_EYE_CENTER.y + rightPupilOffset.y - 3} r="2.3" fill="#ffffff" />

        <path
          d="M72 122C80 134 120 134 128 122"
          fill="none"
          stroke="#1e293b"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
