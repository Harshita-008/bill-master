import { useCallback, useEffect, useRef, useState } from "react";

function isFilledBox(element) {
  const isBox = element?.tagName === "INPUT" || element?.tagName === "TEXTAREA";
  return isBox && element.value !== "";
}

// first esc clears a box, esc on an empty box asks before leaving
export default function useConfirmExit() {
  const [asking, setAsking] = useState(false);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (asking) return undefined;
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      if (isFilledBox(document.activeElement)) return;
      // another dialog (like alt + c) handles its own esc
      if (document.querySelector(".modal-backdrop")) return;
      event.preventDefault();
      event.stopPropagation();
      lastFocus.current = document.activeElement;
      setAsking(true);
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [asking]);

  const stay = useCallback(() => {
    setAsking(false);
    setTimeout(() => lastFocus.current?.focus(), 0);
  }, []);

  return { asking, stay };
}
