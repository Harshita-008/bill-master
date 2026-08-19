export function normalizeCompanyName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

export function newestFirst(a, b) {
  const dateDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  return dateDifference || Number(b.id) - Number(a.id);
}

export function groupBillsByCompany(bills) {
  const groups = new Map();

  [...bills].sort(newestFirst).forEach((bill) => {
    const key = normalizeCompanyName(bill.companyName);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        companyName: bill.companyName.trim(),
        bills: [],
        total: 0,
        latestAt: bill.createdAt,
      });
    }
    const group = groups.get(key);
    group.bills.push(bill);
    group.total += Number(bill.grandTotal) || 0;
  });

  return [...groups.values()].sort((a, b) => (
    a.companyName.localeCompare(b.companyName, undefined, { sensitivity: "base" })
  ));
}
