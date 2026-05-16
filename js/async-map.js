export async function asyncFilter(arr, predicate, signal = null) {
  const results = await Promise.all(
    arr.map(async item => {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const ok = await predicate(item);
      return ok ? item : null;
    })
  );
  return results.filter(item => item !== null);
}

export async function asyncMap(arr, transform, signal = null) {
  return Promise.all(
    arr.map(async item => {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return transform(item);
    })
  );
}

export class GalleryLoader {
  constructor(storageProxy) {
    this.storage = storageProxy;
    this._abortController = null;
  }

  async loadAll() {
    this.abort();
    this._abortController = new AbortController();
    const { signal } = this._abortController;
    const keys = this.storage.listKeys();
    try {
      const validKeys = await asyncFilter(
        keys,
        async key => {
          await new Promise(r => setTimeout(r, 0));
          const item = this.storage.get(key);
          return item && typeof item.dataUrl === 'string';
        },
        signal
      );
      const entries = await asyncMap(
        validKeys,
        async key => {
          await new Promise(r => setTimeout(r, 0));
          return { key, ...this.storage.get(key) };
        },
        signal
      );
      return entries.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    } catch (err) {
      if (err.name === 'AbortError') return [];
      throw err;
    }
  }

  abort() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }
}
