import { TOOLS } from './tools.js';
import { eventBus, EVENTS } from './events.js';
import { ColorGenerator } from './generators.js';

export class CanvasManager {
  constructor(mainCanvas, previewCanvas) {
    this.canvas  = mainCanvas;
    this.preview = previewCanvas;
    this.ctx     = mainCanvas.getContext('2d');
    this.pCtx    = previewCanvas.getContext('2d');

    this.state = {
      tool: 'pencil',
      color: '#000000',
      bgColor: '#ffffff',
      brushSize: 4,
      isDrawing: false,
      rainbowMode: false,
    };

    this._rainbowIter = ColorGenerator.createRainbowIterator(80);
    this._rafId = null;

    this._initSize();
    this._fillBackground();
    this._bindEvents();

    eventBus.on(EVENTS.TOOL_CHANGE,       d => { this.state.tool = d.tool; });
    eventBus.on(EVENTS.COLOR_CHANGE,      d => { this.state.color = d.color; });
    eventBus.on(EVENTS.BG_COLOR_CHANGE,   d => { this.state.bgColor = d.color; this._fillBackground(); });
    eventBus.on(EVENTS.BRUSH_SIZE_CHANGE, d => { this.state.brushSize = d.size; });
    eventBus.on(EVENTS.CANVAS_CLEAR,      () => this.clear());
  }

  _initSize() {
    const area = this.canvas.parentElement;
    this.canvas.width  = this.preview.width  = Math.max(100, area.clientWidth  - 40);
    this.canvas.height = this.preview.height = Math.max(100, area.clientHeight - 40);
  }

  _fillBackground() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.state.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousedown',  e => this._onDown(e));
    c.addEventListener('mousemove',  e => this._onMove(e));
    c.addEventListener('mouseup',    e => this._onUp(e));
    c.addEventListener('mouseleave', e => { if (this.state.isDrawing) this._onUp(e); });
  }

  _coords(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (this.canvas.width  / r.width),
      y: (e.clientY - r.top)  * (this.canvas.height / r.height),
    };
  }

  _onDown(e) {
    const { x, y } = this._coords(e);
    this.state.isDrawing = true;
    if (this.state.rainbowMode) this.state.color = this._rainbowIter.next();
    TOOLS[this.state.tool]?.onMouseDown(this.ctx, this.pCtx, x, y, this.state);
  }

  _onMove(e) {
    if (!this.state.isDrawing) return;
    const { x, y } = this._coords(e);
    TOOLS[this.state.tool]?.onMouseMove(this.ctx, this.pCtx, x, y, this.state);
  }

  _onUp(e) {
    if (!this.state.isDrawing) return;
    const { x, y } = this._coords(e);
    this.state.isDrawing = false;
    TOOLS[this.state.tool]?.onMouseUp(this.ctx, this.pCtx, x, y, this.state);
  }

  clear() {
    this._fillBackground();
  }

  getDataURL() {
    return this.canvas.toDataURL('image/png');
  }
}
