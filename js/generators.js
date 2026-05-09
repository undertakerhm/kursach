export class ColorGenerator {
  static *colorCycleGenerator(step = 5) {
    let hue = 0;
    while (true) {
      yield `hsl(${hue}, 90%, 50%)`;
      hue = (hue + step) % 360;
    }
  }

  static createRainbowIterator(delay = 80) {
    const gen = ColorGenerator.colorCycleGenerator(7);
    let lastTime = 0;
    let currentColor = gen.next().value;
    return {
      tick(now) {
        if (now - lastTime >= delay) {
          currentColor = gen.next().value;
          lastTime = now;
        }
        return currentColor;
      },
      next() {
        currentColor = gen.next().value;
        return currentColor;
      },
      get color() { return currentColor; },
    };
  }
}
