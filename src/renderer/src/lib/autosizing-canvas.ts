function pxStringToNumber(pixelString: string): number {
  const regex = /[\d.]+/g;
  return Math.round(pixelString!.match(regex)!.map(Number)[0]);
}

export class AutosizingCanvas {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver;

  constructor(
    container: HTMLElement,
    private drawFn: () => void,
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    container.appendChild(this.canvas);
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to create canvas context!");
    }
    this.ctx = context;
    this.resizeObserver = new ResizeObserver(this.draw.bind(this));
    this.resizeObserver.observe(container);
    this.draw();
  }

  draw(): void {
    const computedStyle = window.getComputedStyle(this.canvas);
    const width = pxStringToNumber(computedStyle.width!);
    const height = pxStringToNumber(computedStyle.height!);
    this.canvas.width = Math.round(width * devicePixelRatio);
    this.canvas.height = Math.round(height * devicePixelRatio);
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawFn();
  }

  destroy(): void {
    this.resizeObserver.disconnect();
  }
}
