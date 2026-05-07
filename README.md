# Paint — Браузерний Графічний Редактор

Курсова робота з дисципліни «Основи програмування»

## Запуск

Відкрийте Термінал(PowerShell) та зайдіть в папку з курсовою роботою, через npx server створіть локальний сервер, скопіюйтк силку і введіть в браузері

## Структура проєкту

```
paint-app/
- index.html          
- style.css          
- README.md           
- js/
    - main.js         # Точка входу
    - canvas.js       # Логіка Canvas (CanvasManager)
    - tools.js        # Інструменти малювання (ООП)
    - generators.js   # Лаб. 1 - Генератори та ітератори
    - memo.js         # Лаб. 3 - Мемоізація (LRU-кеш)
    - history.js      # Лаб. 4 - BiDirectionalPriorityQueue (Undo/Redo)
    - async-map.js    # Лаб. 5 - asyncFilter + GalleryLoader
    - stream.js       # Лаб. 6 - ReadableStream (потоковий PNG-експорт)
    - events.js       # Лаб. 7 - EventBus + Observable
    - proxy.js        # Лаб. 8 - StorageProxy (localStorage)
    - logger.js       # Лаб. 9 - Декоратор логування
```

## Лабораторні роботи

 1 | `generators.js`  `colorCycleGenerator` (генератор), `rainbowIterator` (ітератор з таймаутом) 
 2  `README.md`, `.gitignore`  Git, структурована документація 
 3  `memo.js`  `memoize` з LRU-кешем для flood fill 
 4  `history.js`  `BiDirectionalPriorityQueue` — Undo/Redo 
 5  `async-map.js`  `asyncFilter`, `asyncMap`, `GalleryLoader` з `AbortController` 
 6  `stream.js`  `CanvasExporter` через `ReadableStream` + async iterator 
 7  `events.js`  `EventBus`, `Observable`, реактивна шина 
 8  `proxy.js`  `StorageProxy` — Proxy над localStorage 
 9  `logger.js`  `@log(level)` декоратор, JSON-лог 

## ООП-принципи

- **Інкапсуляція**: кожен модуль — клас зі своїм станом і методами
- **Наслідування**: `EraserTool extends PencilTool`
- **Поліморфізм**: усі інструменти реалізують `onMouseDown / onMouseMove / onMouseUp`


