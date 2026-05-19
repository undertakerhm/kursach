import {
  PencilTool,
  EraserTool,
  LineTool,
  RectTool,
  EllipseTool,
  FillTool,
} from './tools.js';

export class ShapeFactory {
  static _registry = new Map();

  static register(name, creator) {
    ShapeFactory._registry.set(name, creator);
  }

  static create(name) {
    const creator = ShapeFactory._registry.get(name);
    if (!creator) throw new Error(`ShapeFactory: невідомий інструмент "${name}"`);
    return creator();
  }

  static has(name) {
    return ShapeFactory._registry.has(name);
  }

  static list() {
    return [...ShapeFactory._registry.keys()];
  }
}

ShapeFactory.register('pencil',  () => new PencilTool());
ShapeFactory.register('eraser',  () => new EraserTool());
ShapeFactory.register('line',    () => new LineTool());
ShapeFactory.register('rect',    () => new RectTool());
ShapeFactory.register('ellipse', () => new EllipseTool());
ShapeFactory.register('fill',    () => new FillTool());
