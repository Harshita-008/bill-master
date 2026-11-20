import { BookUser, ClipboardList, ClipboardPlus, LibraryBig, PackagePlus } from "lucide-react";

// options shown under the create bill button
export const homeTiles = [
  {
    path: "/challans/new",
    icon: ClipboardPlus,
    label: "Create challan",
    description: "Prepare and print a simple delivery challan",
    hue: "#d9822b",
  },
  {
    path: "/bills",
    icon: LibraryBig,
    label: "View bills",
    description: "Ledger-wise bill archive",
    hue: "#4f5bd5",
  },
  {
    path: "/challans",
    icon: ClipboardList,
    label: "View challans",
    description: "Open and reprint challans",
    hue: "#0f9d8a",
  },
  {
    path: "/ledgers",
    icon: BookUser,
    label: "Ledgers",
    description: "Add, search and delete saved ledger names",
    hue: "#c2417a",
  },
  {
    path: "/items",
    icon: PackagePlus,
    label: "Items",
    description: "Add items manually or import an Excel sheet",
    hue: "#3d8b4f",
  },
];
