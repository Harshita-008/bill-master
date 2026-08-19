import { useMemo, useState } from "react";
import { createEmptyBill, emptyCharge, emptyItem, prepareBill } from "../utils/bill";

export default function useBillForm(initialBill) {
  const [bill, setBill] = useState(initialBill || createEmptyBill);

  const updateItem = (key, field, value) => {
    setBill((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.key !== key) return item;
        const next = { ...item, [field]: value };
        next.amount = (Number(next.rate) || 0) * (Number(next.quantity) || 0);
        return next;
      }),
    }));
  };

  const updateCharge = (key, field, value) => {
    setBill((current) => ({
      ...current,
      charges: current.charges.map((charge) => (
        charge.key === key ? { ...charge, [field]: value } : charge
      )),
    }));
  };

  const totals = useMemo(() => prepareBill(bill), [bill]);

  return {
    bill,
    preparedBill: totals,
    setCompanyName: (companyName) => setBill((current) => ({ ...current, companyName })),
    setPreviousAmount: (previousAmount) => setBill((current) => ({ ...current, previousAmount })),
    updateItem,
    addItem: () => setBill((current) => ({ ...current, items: [...current.items, emptyItem()] })),
    removeItem: (key) => setBill((current) => ({
      ...current,
      items: current.items.length > 1
        ? current.items.filter((item) => item.key !== key)
        : [emptyItem()],
    })),
    updateCharge,
    addCharge: () => setBill((current) => ({ ...current, charges: [...current.charges, emptyCharge()] })),
    removeCharge: (key) => setBill((current) => ({
      ...current,
      charges: current.charges.length > 1
        ? current.charges.filter((charge) => charge.key !== key)
        : [emptyCharge()],
    })),
  };
}
