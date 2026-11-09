export const emptyItem = () => ({
  key: crypto.randomUUID(),
  itemName: "",
  rate: "",
  quantity: "",
  per: "",
  amount: 0,
});

export const emptyCharge = () => ({
  key: crypto.randomUUID(),
  name: "",
  amount: "",
});

export function createEmptyBill() {
  return {
    companyName: "",
    items: [emptyItem()],
    charges: [emptyCharge()],
    previousAmount: "",
  };
}

export function prepareBill(bill) {
  const items = bill.items
    .filter((item) => item.itemName.trim())
    .map((item) => ({
      ...item,
      rate: Number(item.rate) || 0,
      quantity: Math.trunc(Number(item.quantity) || 0),
      per: String(item.per ?? "").trim(),
      amount: (Number(item.rate) || 0) * Math.trunc(Number(item.quantity) || 0),
    }));
  const charges = bill.charges
    .filter((charge) => charge.name.trim() || Number(charge.amount))
    .map((charge) => ({ ...charge, amount: Number(charge.amount) || 0 }));
  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const chargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const previousAmount = Number(bill.previousAmount) || 0;
  return {
    ...bill,
    items,
    charges,
    previousAmount,
    itemsTotal,
    chargesTotal,
    grandTotal: itemsTotal + chargesTotal + previousAmount,
  };
}

export function hydrateBill(bill) {
  return {
    ...bill,
    previousAmount: bill.previousAmount || "",
    items: bill.items.map((item) => ({
      ...item,
      quantity: item.quantity || "",
      rate: item.rate || "",
      key: crypto.randomUUID(),
    })),
    charges: bill.charges.length
      ? bill.charges.map((charge) => ({ ...charge, key: crypto.randomUUID() }))
      : [emptyCharge()],
  };
}
