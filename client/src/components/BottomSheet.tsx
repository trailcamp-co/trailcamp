import { useRef, useCallback, useEffect, useState } from 'react';
import { hapticLight } from '../utils/haptics';

export type SnapPoint = 'peek' | 'half' | 'full';

const SNAP_FRACTIONS: Record<SnapPoint, number> = {
  peek: 0.15,
  half: 0.50,
  full: 0.90,
};

interface BottomSheetProps {
  open: boolean;
  snapPoint: SnapPoint;
  onSnapChange: (snap: SnapPoint) => void;
  onDismiss: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ open, snapPoint, onSnapChange, onDismiss, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null);
  const contentDragReady = useRef(false);
  const contentDragStartY = useRef(0);
  const [currentHeight, setCurrentHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate the bottom offset for the tab bar
  const bottomOffset = 'calc(56px + env(safe-area-inset-bottom, 0px))';

  // Get available height (viewport minus bottom tabs)
  const getAvailableHeight = useCallback(() => {
    // Approximate: window height minus tab bar height (56px)
    return window.innerHeight - 56;
  }, []);

  const getSnapHeight = useCallback((snap: SnapPoint) => {
    return getAvailableHeight() * SNAP_FRACTIONS[snap];
  }, [getAvailableHeight]);

  // Update height when snap point changes (not during drag)
  useEffect(() => {
    if (!isDragging && open) {
      setCurrentHeight(getSnapHeight(snapPoint));
    }
  }, [snapPoint, open, isDragging, getSnapHeight]);

  // Find nearest snap point for a given height
  const findNearestSnap = useCallback((height: number): SnapPoint | 'dismiss' => {
    const available = getAvailableHeight();
    const fraction = height / available;

    // If below half of peek, dismiss
    if (fraction < SNAP_FRACTIONS.peek * 0.5) return 'dismiss';

    // Find nearest snap
    const snaps: SnapPoint[] = ['peek', 'half', 'full'];
    let nearest: SnapPoint = 'peek';
    let minDist = Infinity;
    for (const s of snaps) {
      const dist = Math.abs(fraction - SNAP_FRACTIONS[s]);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }, [getAvailableHeight]);

  // Touch handlers for drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragState.current = {
      startY: touch.clientY,
      startHeight: currentHeight ?? getSnapHeight(snapPoint),
    };
    setIsDragging(true);
  }, [currentHeight, snapPoint, getSnapHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const delta = dragState.current.startY - touch.clientY;
    const newHeight = Math.max(0, Math.min(getAvailableHeight() * 0.95, dragState.current.startHeight + delta));
    setCurrentHeight(newHeight);
  }, [getAvailableHeight]);

  const handleTouchEnd = useCallback(() => {
    if (!dragState.current || currentHeight === null) {
      setIsDragging(false);
      return;
    }
    const nearest = findNearestSnap(currentHeight);
    setIsDragging(false);
    dragState.current = null;
    if (nearest === 'dismiss') {
      onDismiss();
    } else {
      hapticLight();
      onSnapChange(nearest);
      setCurrentHeight(getSnapHeight(nearest));
    }
  }, [currentHeight, findNearestSnap, onDismiss, onSnapChange, getSnapHeight]);

  // Handle click on peek area to expand
  const handlePeekTap = useCallback(() => {
    if (snapPoint === 'peek') {
      onSnapChange('half');
    }
  }, [snapPoint, onSnapChange]);

  if (!open) return null;

  const height = currentHeight ?? getSnapHeight(snapPoint);
  const isScrollable = (snapPoint === 'full' || snapPoint === 'half') && !isDragging;

  return (
    <div
      ref={sheetRef}
      className="fixed left-0 right-0 z-30 lg:hidden flex flex-col bg-dark-900 rounded-t-2xl shadow-2xl border-t border-dark-700/50 overscroll-none touch-none"
      style={{
        bottom: bottomOffset,
        height: `${height}px`,
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: 'height',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handlePeekTap}
      >
        <div className="w-10 h-1 rounded-full bg-gray-600" />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className={`flex-1 min-h-0 ${isScrollable ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
        onTouchStart={(e) => {
          if (!isScrollable) {
            handleTouchStart(e);
          } else {
            // At half snap, allow drag-to-expand when scrolled to top
            const el = contentRef.current;
            if (el && el.scrollTop <= 0 && snapPoint === 'half') {
              contentDragReady.current = true;
              contentDragStartY.current = e.touches[0].clientY;
            }
          }
        }}
        onTouchMove={(e) => {
          if (!isScrollable) {
            handleTouchMove(e);
          } else if (contentDragReady.current && snapPoint === 'half') {
            const delta = contentDragStartY.current - e.touches[0].clientY;
            // User is dragging up while at scroll top → expand sheet
            if (delta > 10) {
              contentDragReady.current = false;
              onSnapChange('full');
            }
          }
        }}
        onTouchEnd={() => {
          if (!isScrollable) {
            handleTouchEnd();
          }
          contentDragReady.current = false;
        }}
      >
        {children}
      </div>
    </div>
  );
}
