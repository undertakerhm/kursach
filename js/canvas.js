import { TOOLS, TOOL_NAMES } from './tools.js';
import { ShapeFactory } from './shape-factory.js';
import { HistoryManager } from './history.js';
import { ColorGenerator } from './generators.js';
import { CanvasExporter } from './stream.js';
import { eventBus, EVENTS } from './events.js';
import { logMethod } from './logger.js';

export class CanvasManager {
  constructor(mainCanvas, previewCanvas) {
    this.canvas   = mainCanvas;
    this.preview  = previewCanvas;
    this.ctx      = mainCanvas.getContext('2d');
    this.pCtx     = previewCanvas.getContext('2d');
    this.history  = new HistoryManager(60);
    this.exporter = new CanvasExporter(this.canvas);

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
    this._activeTool = ShapeFactory.create('pencil');

    this._initSize();
    this._fillBackground();
    this._bindEvents();
    this._saveSnapshot();

    logMethod(this, 'drawLine', 'INFO', null);
    logMethod(this, 'fillArea', 'INFO', null);
    logMethod(this, 'saveAsPNG', 'INFO', null);

    eventBus.on(EVENTS.TOOL_CHANGE, d => {
      this.state.tool = d.tool;
      if (ShapeFactory.has(d.tool)) {
        this._activeTool = ShapeFactory.create(d.tool);
      }
    });
    eventBus.on(EVENTS.COLOR_CHANGE,      d => { this.state.color = d.color; });
    eventBus.on(EVENTS.BG_COLOR_CHANGE,   d => { this.state.bgColor = d.color; this._fillBackground(); });
    eventBus.on(EVENTS.BRUSH_SIZE_CHANGE, d => { this.state.brushSize = d.size; });
    eventBus.on(EVENTS.RAINBOW_TOGGLE,    d => { this.state.rainbowMode = d.on; });
    eventBus.on(EVENTS.CANVAS_CLEAR,      () => this.clear());
  }

  _initSize() {
    const area = this.canvas.parentElement;
    const W = Math.max(100, area.clientWidth  - 40);
    const H = Math.max(100, area.clientHeight - 40);

    const hadContent = this.canvas.width > 0 && this.canvas.height > 0;
    let saved = null;
    if (hadContent) {
      try { saved = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); } catch {}
    }

    this.canvas.width  = this.preview.width  = W;
    this.canvas.height = this.preview.height = H;

    this._fillBackground();
    if (saved) this.ctx.putImageData(saved, 0, 0);
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
    c.addEventListener('mousemove',  e => { this._onMove(e); this._updateStatus(e); });
    c.addEventListener('mouseup',    e => this._onUp(e));
    c.addEventListener('mouseleave', e => { if (this.state.isDrawing) this._onUp(e); });

    c.addEventListener('touchstart', e => { e.preventDefault(); this._onDown(this._toMouse(e)); }, { passive: false });
    c.addEventListener('touchmove',  e => { e.preventDefault(); this._onMove(this._toMouse(e)); }, { passive: false });
    c.addEventListener('touchend',   e => { e.preventDefault(); this._onUp(this._toMouse(e));  }, { passive: false });

    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(); }
    });

    window.addEventListener('resize', () => this._initSize());
  }

  _toMouse(e) {
    const t = e.touches[0] || e.changedTouches[0];
    return { clientX: t.clientX, clientY: t.clientY };
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

    if (this.state.rainbowMode) {
      this.state.color = this._rainbowIter.next();
    }

    const tool = this._activeTool;
    tool.onMouseDown(this.ctx, this.pCtx, x, y, this.state);

    if (this.state.tool === 'fill') {
      this._saveSnapshot();
    }
  }

  _onMove(e) {
    if (!this.state.isDrawing) return;
    const { x, y } = this._coords(e);

    if (this.state.rainbowMode && (this.state.tool === 'pencil' || this.state.tool === 'eraser')) {
      if (!this._rafId) {
        this._rafId = requestAnimationFrame(now => {
          this._rafId = null;
          this.state.color = this._rainbowIter.tick(now);
        });
      }
    }

    this._activeTool.onMouseMove(this.ctx, this.pCtx, x, y, this.state);
  }

  _onUp(e) {
    if (!this.state.isDrawing) return;
    const { x, y } = this._coords(e);
    this.state.isDrawing = false;

    this._activeTool.onMouseUp(this.ctx, this.pCtx, x, y, this.state);

    if (this.state.tool !== 'fill') {
      this._saveSnapshot();
    }
  }

  _saveSnapshot() {
    const snap = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.history.push(snap);
    eventBus.emit(EVENTS.HISTORY_CHANGE, {
      undoSize: this.history.undoSize,
      redoSize: this.history.redoSize,
    });
  }

  _updateStatus(e) {
    const { x, y } = this._coords(e);
    const xi = Math.floor(x), yi = Math.floor(y);
    eventBus.emit('status:coords', { x: xi, y: yi });
    if (xi >= 0 && yi >= 0 && xi < this.canvas.width && yi < this.canvas.height) {
      const px = this.ctx.getImageData(xi, yi, 1, 1).data;
      const hex = '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('');
      eventBus.emit('status:pixelcolor', { hex });
    }
  }

  drawLine(x1, y1, x2, y2) {
    this.ctx.save();
    this.ctx.strokeStyle = this.state.color;
    this.ctx.lineWidth   = this.state.brushSize;
    this.ctx.lineCap     = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.restore();
    this._saveSnapshot();
  }

  fillArea(x, y) {
    const prev = this.state.tool;
    this.state.tool = 'fill';
    const fillTool = ShapeFactory.create('fill');
    fillTool.onMouseDown(this.ctx, this.pCtx, x, y, this.state);
    this.state.tool = prev;
    this._saveSnapshot();
  }

  undo() {
    if (!this.history.canUndo()) return;
    const snap = this.history.undo();
    if (snap) {
      this.ctx.putImageData(snap, 0, 0);
      eventBus.emit(EVENTS.HISTORY_CHANGE, {
        undoSize: this.history.undoSize,
        redoSize: this.history.redoSize,
      });
    }
  }

  redo() {
    if (!this.history.canRedo()) return;
    const snap = this.history.redo();
    if (snap) {
      this.ctx.putImageData(snap, 0, 0);
      eventBus.emit(EVENTS.HISTORY_CHANGE, {
        undoSize: this.history.undoSize,
        redoSize: this.history.redoSize,
      });
    }
  }

  clear() {
    this._fillBackground();
    this._saveSnapshot();
  }

  async saveAsPNG() {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    await this.exporter.saveAsPNG(`drawing-${ts}.png`);
  }

  getDataURL() {
    return this.canvas.toDataURL('image/png');
  }
}
