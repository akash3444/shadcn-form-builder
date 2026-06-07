const _storage: Record<string, string> = {}

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => _storage[key] ?? null,
    setItem: (key: string, value: string) => { _storage[key] = value },
    removeItem: (key: string) => { delete _storage[key] },
    clear: () => { for (const k in _storage) delete _storage[k] },
    get length() { return Object.keys(_storage).length },
    key: (index: number) => Object.keys(_storage)[index] ?? null,
  },
  writable: false,
  configurable: true,
})
