if (!globalThis.crypto.randomUUID) {
  let nextId = 0;
  globalThis.crypto.randomUUID = () => `test-id-${nextId += 1}`;
}

window.scrollTo = () => {};

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  disconnect() {}
};
