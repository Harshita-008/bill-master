import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ExitDialog from "./ExitDialog";

afterEach(cleanup);

function renderDialog() {
  const onYes = vi.fn();
  const onNo = vi.fn();
  const pageKey = vi.fn();
  window.addEventListener("keydown", pageKey);
  render(<ExitDialog onYes={onYes} onNo={onNo} />);
  return { onYes, onNo, pageKey, cleanupPage: () => window.removeEventListener("keydown", pageKey) };
}

describe("ExitDialog", () => {
  it("moves between No and Yes with the arrow keys and presses the focused one on Enter", async () => {
    const user = userEvent.setup();
    const { onYes, onNo, cleanupPage } = renderDialog();
    const [no, yes] = document.querySelectorAll(".exit-dialog button");

    expect(document.activeElement).toBe(no);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(yes);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(no);
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onYes).toHaveBeenCalledTimes(1);
    expect(onNo).not.toHaveBeenCalled();
    cleanupPage();
  });

  it("stops every other key from reaching the page behind it", async () => {
    const user = userEvent.setup();
    const { onYes, onNo, pageKey, cleanupPage } = renderDialog();

    await user.keyboard("a{Backspace}{Delete}1{ArrowDown}[Space]");
    expect(pageKey).not.toHaveBeenCalled();
    expect(onYes).not.toHaveBeenCalled();
    expect(onNo).not.toHaveBeenCalled();

    await user.keyboard("n");
    expect(onNo).toHaveBeenCalledTimes(1);
    cleanupPage();
  });
});
