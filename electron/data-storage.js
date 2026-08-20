import fs from "node:fs";
import path from "node:path";

export const APP_DATA_DIRECTORY = "BillMaster";
export const DATABASE_FILE_NAME = "billmaster.db";

export function getPersistentUserDataPath(appDataPath) {
  return path.join(appDataPath, APP_DATA_DIRECTORY);
}

export function migrateLegacyDatabase(targetDatabasePath, legacyDatabasePaths = []) {
  fs.mkdirSync(path.dirname(targetDatabasePath), { recursive: true });
  if (fs.existsSync(targetDatabasePath)) return null;

  const resolvedTarget = path.resolve(targetDatabasePath);
  const sourceDatabasePath = legacyDatabasePaths.find((candidate) => (
    candidate
    && path.resolve(candidate) !== resolvedTarget
    && fs.existsSync(candidate)
  ));
  if (!sourceDatabasePath) return null;

  // Copy the main database last so it acts as the completed-migration marker.
  for (const suffix of ["-wal", "-shm", ""]) {
    const sourcePath = `${sourceDatabasePath}${suffix}`;
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, `${targetDatabasePath}${suffix}`);
    }
  }
  return sourceDatabasePath;
}
