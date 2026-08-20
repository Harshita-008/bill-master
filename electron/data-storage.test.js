import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  DATABASE_FILE_NAME,
  getPersistentUserDataPath,
  migrateLegacyDatabase,
} from "./data-storage.js";

const temporaryDirectories = [];

function makeTemporaryDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "billmaster-storage-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("persistent application data", () => {
  it("uses the same BillMaster directory regardless of the installed version", () => {
    const appDataPath = path.join("Users", "Example", "AppData", "Roaming");
    expect(getPersistentUserDataPath(appDataPath))
      .toBe(path.join(appDataPath, "BillMaster"));
  });

  it("copies a legacy database and its SQLite sidecars without deleting the source", () => {
    const root = makeTemporaryDirectory();
    const source = path.join(root, "bill-master", DATABASE_FILE_NAME);
    const target = path.join(root, "BillMaster", DATABASE_FILE_NAME);
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.writeFileSync(source, "database");
    fs.writeFileSync(`${source}-wal`, "wal");
    fs.writeFileSync(`${source}-shm`, "shm");

    expect(migrateLegacyDatabase(target, [source])).toBe(source);
    expect(fs.readFileSync(target, "utf8")).toBe("database");
    expect(fs.readFileSync(`${target}-wal`, "utf8")).toBe("wal");
    expect(fs.readFileSync(`${target}-shm`, "utf8")).toBe("shm");
    expect(fs.existsSync(source)).toBe(true);
  });

  it("never overwrites a database already stored in the permanent location", () => {
    const root = makeTemporaryDirectory();
    const source = path.join(root, "legacy", DATABASE_FILE_NAME);
    const target = path.join(root, "BillMaster", DATABASE_FILE_NAME);
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(source, "old data");
    fs.writeFileSync(target, "current data");

    expect(migrateLegacyDatabase(target, [source])).toBeNull();
    expect(fs.readFileSync(target, "utf8")).toBe("current data");
  });
});
