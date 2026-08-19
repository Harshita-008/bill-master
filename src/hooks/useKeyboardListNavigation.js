import { useEffect, useRef } from "react";

export default function useKeyboardListNavigation(itemCount, loading) {
  const rowRefs = useRef([]);
  const focusedInitialRow = useRef(false);

  useEffect(() => {
    if (loading || !itemCount || focusedInitialRow.current) return undefined;
    focusedInitialRow.current = true;
    const frame = requestAnimationFrame(() => rowRefs.current[0]?.focus());
    return () => cancelAnimationFrame(frame);
  }, [itemCount, loading]);

  const moveRowFocus = (event, index) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const offset = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(itemCount - 1, index + offset));
    const nextRow = rowRefs.current[nextIndex];
    nextRow?.focus();
    nextRow?.scrollIntoView?.({ block: "nearest" });
  };

  return { rowRefs, moveRowFocus };
}
