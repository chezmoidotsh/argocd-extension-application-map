require('@testing-library/jest-dom');
global.console.error = jest.fn();
global.console.warn = jest.fn();
global.console.debug = jest.fn();
global.console.log = jest.fn();

// jsdom does not expose structuredClone (needed by @dagrejs/dagre >= 3)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
