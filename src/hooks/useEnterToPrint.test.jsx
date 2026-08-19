import { useRef } from "react";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import useEnterToPrint from "./useEnterToPrint";

afterEach(cleanup);

function Harness({ onPrint }) {
  const copiesInputRef = useRef(null);
  useEnterToPrint(onPrint, copiesInputRef);
  return (
    <>
      <input aria-label="Print setting" />
      <input ref={copiesInputRef} aria-label="Number of copies" defaultValue="2" />
    </>
  );
}

describe("useEnterToPrint", () => {
  it("prints when Enter is the first page action but not while editing a control", async () => {
    const onPrint = vi.fn();
    const user = userEvent.setup();
    const { getByLabelText } = render(<Harness onPrint={onPrint} />);

    await user.keyboard("{Enter}");
    expect(onPrint).toHaveBeenCalledTimes(1);

    await user.click(getByLabelText("Print setting"));
    await user.keyboard("{Enter}");
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it("moves Backspace to the copies field and selects its value", async () => {
    const user = userEvent.setup();
    const { getByLabelText } = render(<Harness onPrint={vi.fn()} />);
    const copiesInput = getByLabelText("Number of copies");

    await user.keyboard("{Backspace}");

    expect(document.activeElement).toBe(copiesInput);
    expect(copiesInput.selectionStart).toBe(0);
    expect(copiesInput.selectionEnd).toBe(1);
  });
});
