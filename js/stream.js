export class CanvasExporter {
  constructor(canvas) {
    this.canvas = canvas;
  }

  createExportStream(mimeType = 'image/png', quality = 1) {
    const canvas = this.canvas;
    return new ReadableStream({
      async start(controller) {
        try {
          const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), mimeType, quality);
          });
          const reader = blob.stream().getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  static async *chunks(canvas, mimeType = 'image/png') {
    const exporter = new CanvasExporter(canvas);
    const stream = exporter.createExportStream(mimeType);
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async saveAsPNG(filename = 'drawing.png') {
    const chunks = [];
    for await (const chunk of CanvasExporter.chunks(this.canvas)) {
      chunks.push(chunk);
    }
    const blob = new Blob(chunks, { type: 'image/png' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
