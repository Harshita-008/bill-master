import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("desktop application icon", () => {
  it("uses the BillMaster icon for Windows packaging and the app window", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const mainSource = readFileSync("electron/main.js", "utf8");

    expect(packageJson.build.win.icon).toBe("build/icon.ico");
    expect(packageJson.build.win.signAndEditExecutable).not.toBe(false);
    expect(packageJson.build.files).toContain("build/icon.ico");
    expect(mainSource).toContain('icon: path.join(__dirname, "../build/icon.ico")');
    expect(existsSync("build/icon.ico")).toBe(true);
    expect(existsSync("public/billmaster-icon.png")).toBe(true);
  });
});
