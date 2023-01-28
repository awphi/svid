export function clipText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, suffix = "...") {
  var metrics = ctx.measureText(text);
  var suffixMetrics = ctx.measureText(suffix);
  var textClipped = text;
  var clipped = false;
  while (metrics.width > maxWidth && metrics.width > suffixMetrics.width) {
    textClipped = textClipped.slice(0, -1);
    metrics = ctx.measureText(textClipped + suffix);
    clipped = true;
  }

  if (clipped) {
    textClipped += suffix;
  }

  return textClipped;
}

function pxStringToNumber(pixelString: string): number {
  const regex = /[\d.]+/g;
  return Math.round(pixelString!.match(regex)!.map(Number)[0]);
}

export function setCanvasSize(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
  const computedStyle = window.getComputedStyle(canvas);

  const width = pxStringToNumber(computedStyle.width!);
  const height = pxStringToNumber(computedStyle.height!);
  canvas.width = Math.round(width * devicePixelRatio);
  canvas.height = Math.round(height * devicePixelRatio);
  context.scale(devicePixelRatio, devicePixelRatio);
}
