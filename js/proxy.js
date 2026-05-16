const PREFIX   = 'paint_app__';
const MAX_ITEMS = 20;

export class StorageProxy {
  constructor(prefix = PREFIX, maxItems = MAX_ITEMS) {
    this.prefix   = prefix;
    this.maxItems = maxItems;

    return new Proxy(this, {
      get(target, prop) {
        return typeof target[prop] === 'function'
          ? target[prop].bind(target)
          : target[prop];
      },
      set(target, prop, value) {
        if (['prefix', 'maxItems'].includes(prop)) { target[prop] = value; return true; }
        target.set(prop, value);
        return true;
      },
    });
  }

  _key(name) { return `${this.prefix}${name}`; }

  set(name, value) {
    try {
      localStorage.setItem(this._key(name), JSON.stringify({ data: value, savedAt: Date.now() }));
      const keys = this.listKeys();
      if (keys.length > this.maxItems) {
        const oldest = keys
          .map(k => ({ k, ts: this._raw(k)?.savedAt || 0 }))
          .sort((a, b) => a.ts - b.ts)[0];
        if (oldest) localStorage.removeItem(this._key(oldest.k));
      }
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        this._evictOldest();
        try { localStorage.setItem(this._key(name), JSON.stringify({ data: value, savedAt: Date.now() })); return true; }
        catch { return false; }
      }
      return false;
    }
  }

  get(name)  { return this._raw(name)?.data ?? null; }

  _raw(name) {
    try { const r = localStorage.getItem(this._key(name)); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }

  remove(name) {
    try { localStorage.removeItem(this._key(name)); return true; }
    catch { return false; }
  }

  listKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefix)) keys.push(k.slice(this.prefix.length));
    }
    return keys;
  }

  _evictOldest() {
    const keys = this.listKeys();
    if (!keys.length) return;
    const oldest = keys
      .map(k => ({ k, ts: this._raw(k)?.savedAt || 0 }))
      .sort((a, b) => a.ts - b.ts)[0];
    if (oldest) this.remove(oldest.k);
  }
}
