"use client";

import { useRef, useState, useCallback } from "react";

// A circular avatar preview that the user can click-and-drag (or
// touch-and-drag) to reposition the photo underneath - most uploaded
// photos aren't square, so object-fit: cover's default center crop
// often cuts off a face. Dragging moves the photo itself (not the
// window), which is the direction people expect from things like
// Facebook/LinkedIn cover photo repositioning.
export function AvatarPositionEditor({
  src,
  position,
  onPositionChange,
  onCommit,
  size = 96,
  fallback,
}: {
  src: string | null | undefined;
  position: string;
  onPositionChange: (position: string) => void;
  // Fires once when a drag ends, separate from onPositionChange (which
  // fires continuously while dragging) - lets a parent update local
  // preview state live but only persist to the database once per drag
  // instead of on every pixel of movement.
  onCommit?: (position: string) => void;
  size?: number;
  fallback?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(
    null,
  );
  const latestPosition = useRef(position);

  const parsePosition = (pos: string): { x: number; y: number } => {
    const parts = pos.split(" ").map((p) => parseFloat(p));
    return {
      x: Number.isFinite(parts[0]) ? parts[0] : 50,
      y: Number.isFinite(parts[1]) ? parts[1] : 50,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!src) return;
    const { x, y } = parsePosition(position);
    dragState.current = { startX: e.clientX, startY: e.clientY, posX: x, posY: y };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.current.startX;
      const deltaY = e.clientY - dragState.current.startY;
      // Dragging right should reveal more of the photo's left side, so
      // the drag direction is inverted relative to object-position.
      const newX = clamp(dragState.current.posX - (deltaX / rect.width) * 100, 0, 100);
      const newY = clamp(dragState.current.posY - (deltaY / rect.height) * 100, 0, 100);
      const next = `${Math.round(newX)}% ${Math.round(newY)}%`;
      latestPosition.current = next;
      onPositionChange(next);
    },
    [onPositionChange],
  );

  const handlePointerUp = () => {
    const wasDragging = dragState.current !== null;
    dragState.current = null;
    setDragging(false);
    if (wasDragging) onCommit?.(latestPosition.current);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden select-none ${
        src ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
      }`}
    >
      {src ? (
        <img
          src={src}
          alt="Profile"
          draggable={false}
          style={{ objectPosition: position }}
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : (
        fallback
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
