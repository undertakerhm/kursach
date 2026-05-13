import { memoize } from './memo.js';

export class BaseTool {
  constructor(name) {
    this.name = name;
    this._startX = 0;
    this._startY = 0;
  }

  onMouseDown(ctx, previewCtx, x, y, state) {}
  onMouseMove(ctx, previewCtx, x, y, state) {}
  onMouseUp(ctx, previewCtx, x, y, state) {}

  _apply(ctx, state) {
    ctx.strokeStyle = state.color;
    ctx.fillStyle   = state.color;
    ctx.lineWidth   = state.brushSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }

  _clearPreview(previewCtx) {
    previewCtx.clearRect(0, 0, previewCtx.canvas.width, previewCtx.canvas.height);
  }
}

export class PencilTool extends BaseTool {
  constructor() { super('pencil'); }

  onMouseDown(ctx, previewCtx, x, y, state) {
    this._apply(ctx, state);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    state._lastX = x;
    state._lastY = y;
  }

  onMouseMove(ctx, previewCtx, x, y, state) {
    this._apply(ctx, state);
    ctx.beginPath();
    ctx.moveTo(state._lastX ?? x, state._lastY ?? y);
    ctx.lineTo(x, y);
    ctx.stroke();
    state._lastX = x;
    state._lastY = y;
  }

  onMouseUp(ctx, previewCtx, x, y, state) {
    ctx.beginPath();
    state._lastX = null;
    state._lastY = null;
  }
}

export class EraserTool extends BaseTool {
  constructor() { super('eraser'); }

  onMouseDown(ctx, previewCtx, x, y, state) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = state.brushSize * 2;
    ctx.lineCap   = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x, y);
    state._lastX = x;
    state._lastY = y;
  }

  onMouseMove(ctx, previewCtx, x, y, state) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = state.brushSize * 2;
    ctx.lineCap   = 'round';
    ctx.beginPath();
    ctx.moveTo(state._lastX ?? x, state._lastY ?? y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    state._lastX = x;
    state._lastY = y;
  }

  onMouseUp(ctx, previewCtx, x, y, state) {
    ctx.beginPath();
    state._lastX = null;
    state._lastY = null;
  }
}

export const TOOLS = {
  pencil: new PencilTool(),
  eraser: new EraserTool(),
};

export const TOOL_NAMES = {
  pencil: 'Олівець', eraser: 'Гумка',
};
