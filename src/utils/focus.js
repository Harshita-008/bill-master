export function focusAtStart(target, { smoothScroll = false } = {}) {
  if (!target) return;
  target.focus(smoothScroll ? { preventScroll: true } : undefined);
  if (smoothScroll) {
    target.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }
  if (typeof target.setSelectionRange === "function") {
    target.setSelectionRange(0, 0);
  }
}

export function moveBackAtStart(event, previousTarget) {
  if (event.key !== "Backspace") return false;
  const { selectionStart, selectionEnd } = event.currentTarget;
  const isAtStart = selectionStart === 0 && selectionEnd === 0;
  if (!isAtStart) return false;
  event.preventDefault();
  if (previousTarget?.dataset) previousTarget.dataset.overwriteOnType = "true";
  focusAtStart(previousTarget);
  return true;
}

export function prepareOverwriteOnType(event) {
  const target = event.target;
  if (target?.dataset?.overwriteOnType !== "true") return false;

  const isPrintable = event.key.length === 1
    && !event.altKey
    && !event.ctrlKey
    && !event.metaKey;
  if (isPrintable && typeof target.select === "function") {
    target.select();
    delete target.dataset.overwriteOnType;
    return true;
  }

  if (event.key !== "Backspace" && event.key !== "Shift") {
    delete target.dataset.overwriteOnType;
  }
  return false;
}

// |350 + typing 4 -> 4 (replace), but 350| + typing keeps normal editing
export function replaceWhenAtStart(event) {
  const input = event.currentTarget;
  const isPrintable = event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;
  if (!isPrintable || !input.value) return;
  if (input.selectionStart === 0 && input.selectionEnd === 0) input.select();
}

export function clearOnEscape(event, clear) {
  if (event.key !== "Escape") return false;
  event.preventDefault();
  event.stopPropagation();
  clear();
  return true;
}
