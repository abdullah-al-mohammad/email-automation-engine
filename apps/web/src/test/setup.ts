class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

// Headless UI floating/anchor logic requires ResizeObserver in jsdom.
globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverMock;
