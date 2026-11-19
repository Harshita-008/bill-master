import { useEffect, useRef, useState } from "react";
import { findDuplicateRow, sameItemName } from "../utils/duplicateItem";

// warns when a row gets an item that another row already has
export default function useDuplicateItem(items) {
  const itemsRef = useRef(items);
  const namesAtFocus = useRef({});
  const [duplicate, setDuplicate] = useState(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // name the row had when the cursor came in
  const remember = (key, name) => {
    namesAtFocus.current[key] = name;
  };

  // true when the dialog opens; an unchanged name is never warned again
  const check = (key) => {
    const rows = itemsRef.current;
    const index = rows.findIndex((item) => item.key === key);
    const name = rows[index]?.itemName;
    if (sameItemName(name, namesAtFocus.current[key])) return false;
    const other = findDuplicateRow(rows, key);
    if (other === -1) return false;
    setDuplicate({ key, index, other, name: name.trim() });
    return true;
  };

  return { duplicate, remember, check, close: () => setDuplicate(null) };
}
