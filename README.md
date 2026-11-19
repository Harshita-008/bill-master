# BillMaster

BillMaster is a modern offline billing and challan application for Windows. It
is built with Electron, React, Vite, and SQLite, and keeps business data on the
user's own computer.

## Features

- Create, save, edit, browse, delete, and reprint bills
- Ledger-based bill history with totals
- Item and ledger masters with keyboard-first search and editing
- Item rates, units, quantities, charges, and previous-amount adjustments
- Multi-sheet A6 and A4 bill printing with copy-count and guided front/back support
- Create, save, edit, browse, and print challans
- Import item names from every populated worksheet and column in Excel files
- Light and dark themes
- Fully offline operation after installation

## Requirements

- Windows 10 or Windows 11
- A current Node.js LTS release with npm
- Build Tools compatible with native Node modules when installing dependencies

## Install dependencies

```powershell
npm.cmd ci
```

## Run the desktop application locally

```powershell
npm.cmd start
```

Vite starts the frontend development server and Electron opens the desktop
window automatically.

## Verify the project

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Build the Windows installer

```powershell
npm.cmd run dist
```

The generated installer is written to `release/`. Build output and installers
are intentionally excluded from Git.

## Local data

BillMaster keeps its data in three separate SQLite files, so one can be deleted
without touching the others:

| File | Holds |
| --- | --- |
| `billmaster-bills.db` | Bills, their item lines and charges |
| `billmaster-challans.db` | Challans |

| `billmaster-items.db` | Items with rate and per, and ledger names |
During development the files live in the project directory. Packaged
installations keep them in the per-user `%APPDATA%\BillMaster` directory, which
is kept when BillMaster is upgraded, reinstalled, or uninstalled. To clear one
part, close BillMaster and delete that file together with its `-wal` and `-shm`
files; an empty one is created on the next start.

Database files, spreadsheet imports, and SQLite WAL/SHM files are excluded by
`.gitignore` and must not be committed.

## Excel item import

BillMaster reads every worksheet in `.xlsx`, `.xls`, and `.csv` files. A sheet
with a header row such as `Item | Rate | Per` is read column by column: new
items are added, and a changed rate or per overrides the saved value. Blank
cells never clear saved values. Sheets without rate or per headers are read as
plain name lists. Imported spreadsheet files remain local and are not included
in the repository.

## Project structure

```text
electron/   Electron main process, printing, and SQLite access
src/        React application, components, hooks, pages, styles, and tests
public/     Browser-facing static assets
build/      Application icon assets used by electron-builder
scripts/    Local database and import maintenance scripts
```
