class PQNode {
  constructor(data, priority) {
    this.data = data;
    this.priority = priority;
  }
}

export class BiDirectionalPriorityQueue {
  constructor() {
    this._items = [];
  }

  enqueue(data, priority = 0) {
    const node = new PQNode(data, priority);
    let added = false;
    for (let i = 0; i < this._items.length; i++) {
      if (node.priority > this._items[i].priority) {
        this._items.splice(i, 0, node);
        added = true;
        break;
      }
    }
    if (!added) this._items.push(node);
  }

  dequeue(side = 'newest') {
    if (this.isEmpty()) return null;
    return (side === 'newest' || side === 'highest')
      ? this._items.shift().data
      : this._items.pop().data;
  }

  peek(side = 'newest') {
    if (this.isEmpty()) return null;
    return (side === 'newest' || side === 'highest')
      ? this._items[0].data
      : this._items[this._items.length - 1].data;
  }

  get size() { return this._items.length; }
  isEmpty() { return this._items.length === 0; }
  clear() { this._items = []; }
}

export class HistoryManager {
  constructor(maxSize = 50) {
    this.maxSize    = maxSize;
    this._undoQueue = new BiDirectionalPriorityQueue();
    this._redoQueue = new BiDirectionalPriorityQueue();
    this._priority  = 0;
  }

  push(imageData) {
    this._undoQueue.enqueue(imageData, this._priority++);
    this._redoQueue.clear();
    while (this._undoQueue.size > this.maxSize) {
      this._undoQueue.dequeue('oldest');
    }
  }

  undo() {
    if (this._undoQueue.isEmpty()) return null;
    const current = this._undoQueue.dequeue('newest');
    this._redoQueue.enqueue(current, this._priority++);
    return this._undoQueue.peek('newest') ?? null;
  }

  redo() {
    if (this._redoQueue.isEmpty()) return null;
    const state = this._redoQueue.dequeue('newest');
    this._undoQueue.enqueue(state, this._priority++);
    return state;
  }

  get undoSize() { return this._undoQueue.size; }
  get redoSize()  { return this._redoQueue.size; }
  canUndo() { return this._undoQueue.size > 1; }
  canRedo() { return !this._redoQueue.isEmpty(); }
}
