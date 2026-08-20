import type { FloorPlanPoint } from "../../types";

export type FloorPlanViewport = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const VIEWPORT_PADDING_RATIO = 0.08;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createFloorPlanViewport(
  points: FloorPlanPoint[],
  canvasWidth: number,
  canvasHeight: number,
): FloorPlanViewport {
  const fullViewport = {
    height: canvasHeight,
    width: canvasWidth,
    x: 0,
    y: 0,
  };

  if (points.length < 3 || canvasWidth <= 0 || canvasHeight <= 0) {
    return fullViewport;
  }

  const xValues = points.map((point) => point.x * canvasWidth);
  const yValues = points.map((point) => point.y * canvasHeight);
  const minimumX = Math.min(...xValues);
  const maximumX = Math.max(...xValues);
  const minimumY = Math.min(...yValues);
  const maximumY = Math.max(...yValues);
  const shapeWidth = Math.max(maximumX - minimumX, 1);
  const shapeHeight = Math.max(maximumY - minimumY, 1);
  const visibleRatio = 1 - VIEWPORT_PADDING_RATIO * 2;
  const canvasAspectRatio = canvasWidth / canvasHeight;
  let width = shapeWidth / visibleRatio;
  let height = shapeHeight / visibleRatio;

  if (width / height > canvasAspectRatio) {
    height = width / canvasAspectRatio;
  } else {
    width = height * canvasAspectRatio;
  }

  width = Math.min(width, canvasWidth);
  height = Math.min(height, canvasHeight);

  const shapeCenterX = (minimumX + maximumX) / 2;
  const shapeCenterY = (minimumY + maximumY) / 2;

  return {
    height,
    width,
    x: clamp(shapeCenterX - width / 2, 0, canvasWidth - width),
    y: clamp(shapeCenterY - height / 2, 0, canvasHeight - height),
  };
}
