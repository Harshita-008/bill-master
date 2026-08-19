import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChallanForm from "./ChallanForm";

afterEach(cleanup);

describe("ChallanForm", () => {
  it("keeps To lines optional and prepares the manual date and statement fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(React.createElement(ChallanForm, { onChange }));

    expect(screen.getByLabelText("To line 1").value).toBe("");
    expect(screen.getByLabelText("To line 2").value).toBe("");
    expect(screen.getByLabelText("To line 3").value).toBe("");

    const day = screen.getByLabelText("Challan date day");
    const month = screen.getByLabelText("Challan date month");
    const year = screen.getByLabelText("Challan date year");
    await user.clear(day);
    await user.type(day, "4");
    await user.clear(month);
    await user.type(month, "8");
    await user.clear(year);
    await user.type(year, "2026");

    await user.type(
      screen.getByLabelText("To line 1"),
      "Acme{Enter}Warehouse{Enter}Mumbai{Enter}12{Enter}Ravi",
    );

    expect(document.activeElement).toBe(screen.getByLabelText("Delivered by"));

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        toLine1: "Acme",
        toLine2: "Warehouse",
        toLine3: "Mumbai",
        challanDate: "04/08/2026",
        boxCount: "12",
        deliveredBy: "Ravi",
      }),
      expect.any(Object),
    ));
  });

  it("moves to the previous challan cell when Backspace is pressed at the start", async () => {
    const user = userEvent.setup();
    render(React.createElement(ChallanForm, { onChange: vi.fn() }));
    const firstLine = screen.getByLabelText("To line 1");
    const secondLine = screen.getByLabelText("To line 2");
    const thirdLine = screen.getByLabelText("To line 3");
    const boxes = screen.getByLabelText("Number of boxes");

    await user.type(firstLine, "Acme");
    await user.click(secondLine);
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(firstLine);

    await user.click(boxes);
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(thirdLine);

    await user.type(boxes, "12");
    boxes.setSelectionRange(0, 0);
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(thirdLine);
    expect(boxes.value).toBe("12");
  });

  it("clears the active challan cell on Escape and keeps it focused", async () => {
    const user = userEvent.setup();
    render(React.createElement(ChallanForm, { onChange: vi.fn() }));

    const firstLine = screen.getByLabelText("To line 1");
    await user.type(firstLine, "Acme");
    await user.keyboard("{Escape}");
    expect(firstLine.value).toBe("");
    expect(document.activeElement).toBe(firstLine);

    const day = screen.getByLabelText("Challan date day");
    await user.click(day);
    await user.keyboard("{Escape}");
    expect(day.value).toBe("");
    expect(document.activeElement).toBe(day);

    const boxes = screen.getByLabelText("Number of boxes");
    await user.type(boxes, "12");
    await user.keyboard("{Escape}");
    expect(boxes.value).toBe("");
    expect(document.activeElement).toBe(boxes);

    const deliveredBy = screen.getByLabelText("Delivered by");
    await user.type(deliveredBy, "Ravi");
    await user.keyboard("{Escape}");
    expect(deliveredBy.value).toBe("");
    expect(document.activeElement).toBe(deliveredBy);
  });
});
