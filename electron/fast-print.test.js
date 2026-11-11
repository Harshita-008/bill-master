import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";

// fake printer side: which paper windows reports, and what gets sent to the printer
const fake = vi.hoisted(() => ({ paper: null, sent: [] }));
vi.mock("pdf-to-printer", () => ({
  default: { print: async (file, options) => { fake.sent.push({ file, options }); } },
}));
vi.mock("./printer-paper.js", async (importOriginal) => ({
  ...(await importOriginal()),
  getPrinterPaper: async () => fake.paper,
}));

const { printFast } = await import("./fast-print.js");
const { PAPER_MM } = await import("./printer-paper.js");

function fakeWebContents() {
  const pdfs = [];
  return { pdfs, printToPDF: async (options) => { pdfs.push(options); return Buffer.from("%PDF-1.4"); } };
}

const inches = (mm) => mm / 25.4;

beforeEach(() => {
  fake.paper = null;
  fake.sent = [];
});

describe("fast print paper handling", () => {
  it("A6 selected, printer on A4: A6 bill centred on an A4 page, printer keeps its own paper", async () => {
    fake.paper = PAPER_MM.A4;
    const contents = fakeWebContents();
    await printFast(contents, { deviceName: "Canon", pageSize: "A6", copies: 1 });

    expect(contents.pdfs[0].pageSize).toEqual({ width: inches(210), height: inches(297) });
    expect(fake.sent[0].options).toMatchObject({ printer: "Canon", scale: "noscale", copies: 1 });
    expect(fake.sent[0].options.paperSize).toBeUndefined();
  });

  it("A6 selected, printer on A5 or Letter: page matches that paper", async () => {
    for (const paper of [PAPER_MM.A5, PAPER_MM.Letter]) {
      fake.paper = paper;
      const contents = fakeWebContents();
      await printFast(contents, { deviceName: "Canon", pageSize: "A6", copies: 1 });
      expect(contents.pdfs[0].pageSize).toEqual({ width: inches(paper.width), height: inches(paper.height) });
    }
  });

  it("A6 selected, printer already on A6: plain A6 page", async () => {
    fake.paper = PAPER_MM.A6;
    const contents = fakeWebContents();
    await printFast(contents, { deviceName: "Canon", pageSize: "A6", copies: 1 });
    expect(contents.pdfs[0].pageSize).toBe("A6");
    expect(fake.sent[0].options.paperSize).toBeUndefined();
  });

  it("A6 selected, paper unknown: treated as A4 paper", async () => {
    const contents = fakeWebContents();
    await printFast(contents, { deviceName: "Canon", pageSize: "A6", copies: 1 });
    expect(contents.pdfs[0].pageSize).toEqual({ width: inches(210), height: inches(297) });
  });

  it("A4 selected: A4 page and the printer is told to use A4, whatever its default", async () => {
    for (const paper of [PAPER_MM.A4, PAPER_MM.A5, PAPER_MM.A6, null]) {
      fake.paper = paper;
      fake.sent = [];
      const contents = fakeWebContents();
      await printFast(contents, { deviceName: "Canon", pageSize: "A4", copies: 1 });
      expect(contents.pdfs[0].pageSize).toBe("A4");
      expect(fake.sent[0].options.paperSize).toBe("A4");
    }
  });

  it("keeps copies, no margins, and front/back page lists", async () => {
    fake.paper = PAPER_MM.A4;
    const contents = fakeWebContents();
    await printFast(contents, {
      deviceName: "Canon", pageSize: "A6", copies: 3, pageRanges: [{ from: 0, to: 0 }, { from: 2, to: 2 }],
    });
    expect(contents.pdfs[0]).toMatchObject({ pageRanges: "1,3", printBackground: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    expect(fake.sent[0].options.copies).toBe(3);
  });
});
