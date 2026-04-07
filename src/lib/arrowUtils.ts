// Smart arrow routing between two rectangles
// Determines best exit/entry edges and draws clean bezier curves

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface AnchorPoint {
  x: number;
  y: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

function getAnchors(rect: Rect): AnchorPoint[] {
  return [
    { x: rect.x + rect.w / 2, y: rect.y, side: 'top' },
    { x: rect.x + rect.w / 2, y: rect.y + rect.h, side: 'bottom' },
    { x: rect.x, y: rect.y + rect.h / 2, side: 'left' },
    { x: rect.x + rect.w, y: rect.y + rect.h / 2, side: 'right' },
  ];
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function computeArrowPath(
  fromRect: Rect,
  toRect: Rect,
): { path: string; fromPt: AnchorPoint; toPt: AnchorPoint } {
  const fromAnchors = getAnchors(fromRect);
  const toAnchors = getAnchors(toRect);

  // Find the pair of anchors with shortest distance
  let bestFrom = fromAnchors[0];
  let bestTo = toAnchors[0];
  let bestDist = Infinity;

  for (const fa of fromAnchors) {
    for (const ta of toAnchors) {
      // Penalize same-side connections (ugly U-turns)
      const sameSidePenalty = fa.side === ta.side ? 200 : 0;
      const d = distance(fa, ta) + sameSidePenalty;
      if (d < bestDist) {
        bestDist = d;
        bestFrom = fa;
        bestTo = ta;
      }
    }
  }

  // Compute bezier control points based on exit/entry direction
  const offset = Math.min(80, bestDist * 0.4);
  const cp1 = controlPoint(bestFrom, offset);
  const cp2 = controlPoint(bestTo, offset);

  const path = `M ${bestFrom.x} ${bestFrom.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${bestTo.x} ${bestTo.y}`;

  return { path, fromPt: bestFrom, toPt: bestTo };
}

function controlPoint(pt: AnchorPoint, offset: number): { x: number; y: number } {
  switch (pt.side) {
    case 'top': return { x: pt.x, y: pt.y - offset };
    case 'bottom': return { x: pt.x, y: pt.y + offset };
    case 'left': return { x: pt.x - offset, y: pt.y };
    case 'right': return { x: pt.x + offset, y: pt.y };
  }
}
