export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  emit(event, data) {
    this._listeners.get(event)?.forEach(h => {
      try { h(data); } catch (err) { console.error(`EventBus [${event}]:`, err); }
    });
  }

  once(event, handler) {
    const wrapper = data => { handler(data); this.off(event, wrapper); };
    return this.on(event, wrapper);
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  TOOL_CHANGE:      'tool:change',
  COLOR_CHANGE:     'color:change',
  BG_COLOR_CHANGE:  'bg_color:change',
  BRUSH_SIZE_CHANGE:'brush:size',
  CANVAS_CLEAR:     'canvas:clear',
};
