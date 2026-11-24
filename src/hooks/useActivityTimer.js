import { useEffect } from "react";
import { markActive } from "../utils/activitySession";

// counts typing and clicking time while a bill or challan is open
export default function useActivityTimer(kind) {
  useEffect(() => {
    const onActive = () => markActive(kind);
    window.addEventListener("keydown", onActive, true);
    window.addEventListener("pointerdown", onActive, true);

    return () => {
      window.removeEventListener("keydown", onActive, true);
      window.removeEventListener("pointerdown", onActive, true);
    };
  }, [kind]);
}
