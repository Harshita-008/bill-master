import { BookUser, ClipboardList, ClipboardPlus, LibraryBig, PackagePlus } from "lucide-react";

// tiles around the big create bill tile
export const homeTiles = [
  {
    path: "/challans/new",
    icon: ClipboardPlus,
    label: "Create challan",
    description: "Prepare and print a simple delivery challan",
    size: "wide",
    accent: true,
  },
  {
    path: "/bills",
    icon: LibraryBig,
    label: "View bills",
    description: "Ledger-wise bill archive",
    size: "small",
  },
  {
    path: "/challans",
    icon: ClipboardList,
    label: "View challans",
    description: "Open and reprint challans",
    size: "small",
  },
  {
    path: "/ledgers",
    icon: BookUser,
    label: "Ledgers",
    description: "Add, search and delete saved ledger names",
    size: "wide",
  },
  {
    path: "/items",
    icon: PackagePlus,
    label: "Items",
    description: "Add items manually or import an Excel sheet",
    size: "wide",
  },
];
