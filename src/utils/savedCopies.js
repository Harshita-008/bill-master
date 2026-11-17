// number of copies stays the same until the user changes it, bills and challans kept apart
export const BILL_COPIES_KEY = "billmaster.billCopies";
export const CHALLAN_COPIES_KEY = "billmaster.challanCopies";

function validCopies(value) {
  const copies = Number(value);
  return Number.isInteger(copies) && copies >= 1 && copies <= 99 ? copies : null;
}

export function readCopies(key, fallback) {
  try {
    const copies = validCopies(localStorage.getItem(key));
    return copies ? String(copies) : fallback;
  } catch {
    return fallback;
  }
}

export function saveCopies(key, value) {
  const copies = validCopies(value);
  if (!copies) return;
  try {
    localStorage.setItem(key, String(copies));
  } catch {
    // copies are a convenience, printing still works without saving them
  }
}
