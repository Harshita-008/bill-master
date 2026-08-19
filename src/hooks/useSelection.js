import { useMemo, useState } from "react";

export default function useSelection(visibleIds) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const allVisibleSelected = useMemo(() => (
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  ), [selectedIds, visibleIds]);

  const toggle = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (visibleIds.every((id) => next.has(id))) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clear = () => setSelectedIds(new Set());

  return { selectedIds, allVisibleSelected, toggle, toggleAllVisible, clear };
}
