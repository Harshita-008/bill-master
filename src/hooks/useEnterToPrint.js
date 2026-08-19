import { useEffect } from "react";

export default function useEnterToPrint(onPrint, copiesInputRef) {
  useEffect(() => {
    const handlePreviewKey = (event) => {
      if (event.defaultPrevented || event.repeat) return;
      const target = event.target;
      const isControl = target instanceof Element
        && (target.matches("button, input, select, textarea") || target.closest("[contenteditable='true']"));

      if (event.key === "Backspace" && !isControl && copiesInputRef?.current) {
        event.preventDefault();
        copiesInputRef.current.focus();
        copiesInputRef.current.select();
        return;
      }

      if (event.key !== "Enter") return;
      if (isControl) return;
      event.preventDefault();
      onPrint();
    };

    window.addEventListener("keydown", handlePreviewKey);
    return () => window.removeEventListener("keydown", handlePreviewKey);
  }, [copiesInputRef, onPrint]);
}
