export function getManualDuplexPageRanges(pageCount, side) {
  const firstIndex = side === "back" ? 1 : 0;
  const ranges = [];
  for (let pageIndex = firstIndex; pageIndex < pageCount; pageIndex += 2) {
    ranges.push({ from: pageIndex, to: pageIndex });
  }
  return ranges;
}

export function getPhysicalSheetCount(pageCount, copies, manualDuplex = false) {
  const pagesPerCopy = manualDuplex ? Math.ceil(pageCount / 2) : pageCount;
  return pagesPerCopy * copies;
}
