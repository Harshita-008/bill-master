export function createEmptyChallan(now = new Date()) {
  return {
    toLine1: "",
    toLine2: "",
    toLine3: "",
    dateDay: String(now.getDate()),
    dateMonth: String(now.getMonth() + 1),
    dateYear: String(now.getFullYear()),
    boxCount: "",
    deliveredBy: "",
  };
}

export function prepareChallan(draft) {
  const hasDate = draft.dateDay || draft.dateMonth || draft.dateYear;
  const challanDate = hasDate
    ? [draft.dateDay.padStart(2, "0"), draft.dateMonth.padStart(2, "0"), draft.dateYear].join("/")
    : "";
  return {
    ...draft,
    toLine1: draft.toLine1.trim(),
    toLine2: draft.toLine2.trim(),
    toLine3: draft.toLine3.trim(),
    boxCount: draft.boxCount.trim(),
    deliveredBy: draft.deliveredBy.trim(),
    challanDate,
  };
}

export function hydrateChallan(challan) {
  const [dateDay = "", dateMonth = "", dateYear = ""] = String(challan.challanDate || "").split("/");
  return {
    ...createEmptyChallan(),
    ...challan,
    dateDay,
    dateMonth,
    dateYear,
  };
}
