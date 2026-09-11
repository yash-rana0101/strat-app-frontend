import { useState, useCallback, useRef } from 'react';
import { readPreferences, savePreferences } from '../lib/preferences';

interface UseSidebarDragReturn {
  /** Current sidebar width (px). */
  sidebarWidth: number;
  /** Whether the user is currently resizing the sidebar. */
  isResizingSidebar: boolean;
  /** Attach to `onMouseDown` on the resize handle. */
  startResizingSidebar: (e: React.MouseEvent) => void;
}

/**
 * Encapsulates resizable-sidebar pointer logic previously inlined in `Home`.
 *
 * Persists the user's customized sidebar width across reloads and syncs it
 * to MongoDB preferences when dragging finishes.
 */
export function useSidebarDrag(): UseSidebarDragReturn {
  // ── Resizable sidebar width ──────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    return readPreferences().sidebarWidth ?? 300;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const widthRef = useRef(sidebarWidth);
  widthRef.current = sidebarWidth;

  const startResizingSidebar = useCallback(
    (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      setIsResizingSidebar(true);

      const startWidth = widthRef.current;
      const startX = mouseDownEvent.clientX;

      const doDrag = (mouseMoveEvent: MouseEvent) => {
        const deltaX = mouseMoveEvent.clientX - startX;
        const newWidth = Math.max(200, Math.min(600, startWidth - deltaX));
        widthRef.current = newWidth;
        setSidebarWidth(newWidth);
      };

      const stopDrag = () => {
        setIsResizingSidebar(false);
        savePreferences({ sidebarWidth: widthRef.current });
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
      };

      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
    },
    []
  );

  return {
    sidebarWidth,
    isResizingSidebar,
    startResizingSidebar,
  };
}
