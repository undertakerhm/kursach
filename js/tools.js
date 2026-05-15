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
    ctx.lineJoin  = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  onMouseMove(ctx, previewCtx, x, y, state) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = state.brushSize * 2;
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
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

export class LineTool extends BaseTool {
  constructor() { super('line'); }

  onMouseDown(ctx, previewCtx, x, y, state) {
    this._startX = x;
    this._startY = y;
  }

  onMouseMove(ctx, previewCtx, x, y, state) {
    this._clearPreview(previewCtx);
    this._apply(previewCtx, state);
    previewCtx.beginPath();
    previewCtx.moveTo(this._startX, this._startY);
    previewCtx.lineTo(x, y);
    previewCtx.stroke();
  }

  onMouseUp(ctx, previewCtx, x, y, state) {
    this._clearPreview(previewCtx);
    this._apply(ctx, state);
    ctx.beginPath();
    ctx.moveTo(this._startX, this._startY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
  }
}

export class RectTool extends BaseTool {
  constructor() { super('rect'); }

  onMouseDown(ctx, previewCtx, x, y, state) {
    this._startX = x;
    this._startY = y;
  }

  onMouseMove(ctx, previewCtx, x, y, state) {
    this._clearPreview(previewCtx);
    this._apply(previewCtx, state);
    previewCtx.beginPath();
    previewCtx.strokeRect(this._startX, this._startY, x - this._startX, y - this._startY);
  }

  onMouseUp(ctx, previewCtx, x, y, state) {
    this._clearPreview(previewCtx);
    this._apply(ctx, state);
    ctx.beginPath();
    ctx.strokeRect(this._startX, this._startY, x - this._startX, y - this._startY);
    ctx.beginPath();
  }
}

export class EllipseTool extends BaseTool {
  constructor() { super('ellipse'); }

  onMouseDown(ctx, previewCtx, x, y, state) {
    this._startX = x;
    this._startY = y;
  }

  onMouseMove(ctx, previewCtx, x, y, state) {
    this._clearPreview(previewCtx);
    this._draw(previewCtx, x, y, state);
  }

  onMouseUp(ctx, previewCtx, x, y, state) {
    this._clearPreview(previewCtx);
    this._draw(ctx, x, y, state);
    ctx.beginPath();
  }

  _draw(ctx, x, y, state) {
    this._apply(ctx, state);
    const cx = (this._startX + x) / 2;
    const cy = (this._startY + y) / 2;
    const rx = Math.abs(x - this._startX) / 2 || 1;
    const ry = Math.abs(y - this._startY) / 2 || 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export class FillTool extends BaseTool {
  constructor() {
    super('fill');
    this._memoFill = memoize(
      (xi, yi, targetKey, fillKey, data, w, h, tR, tG, tB, tA, fR, fG, fB) => {
        this._flood(data, w, h, xi, yi, tR, tG, tB, tA, fR, fG, fB);
      },
      (xi, yi, targetKey, fillKey) => `${xi}:${yi}:${targetKey}:${fillKey}`,
      16
    );
  }

  onMouseDown(ctx, previewCtx, x, y, state) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    const { width, height } = ctx.canvas;

    if (xi < 0 || yi < 0 || xi >= width || yi >= height) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const idx = (yi * width + xi) * 4;
    const tR = data[idx], tG = data[idx+1], tB = data[idx+2], tA = data[idx+3];
    const targetKey = `${tR},${tG},${tB},${tA}`;

    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 1;
    const tCtx = tmp.getContext('2d');
    tCtx.fillStyle = state.color;
    tCtx.fillRect(0, 0, 1, 1);
    const [fR, fG, fB] = tCtx.getImageData(0, 0, 1, 1).data;
    const fillKey = `${fR},${fG},${fB},255`;

    if (targetKey === fillKey) return;

    this._memoFill(xi, yi, targetKey, fillKey, data, width, height, tR, tG, tB, tA, fR, fG, fB);
    ctx.putImageData(imageData, 0, 0);
  }

  _flood(data, w, h, sx, sy, tR, tG, tB, tA, fR, fG, fB) {
    const visited = new Uint8Array(w * h);
    const stack = [sy * w + sx];
    while (stack.length) {
      const pos = stack.pop();
      if (visited[pos]) continue;
      visited[pos] = 1;
      const i = pos * 4;
      if (data[i] !== tR || data[i+1] !== tG || data[i+2] !== tB || data[i+3] !== tA) continue;
      data[i] = fR; data[i+1] = fG; data[i+2] = fB; data[i+3] = 255;
      const x = pos % w, y = Math.floor(pos / w);
      if (x > 0)   stack.push(pos - 1);
      if (x < w-1) stack.push(pos + 1);
      if (y > 0)   stack.push(pos - w);
      if (y < h-1) stack.push(pos + w);
    }
  }
}

export const TOOLS = {
  pencil:  new PencilTool(),
  eraser:  new EraserTool(),
  line:    new LineTool(),
  rect:    new RectTool(),
  ellipse: new EllipseTool(),
  fill:    new FillTool(),
};

export const TOOL_NAMES = {
  pencil: 'Олівець', eraser: 'Гумка', line: 'Лінія',
  rect: 'Прямокутник', ellipse: 'Еліпс', fill: 'Заливка',
};
