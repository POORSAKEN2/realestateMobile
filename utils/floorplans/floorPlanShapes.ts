import type { FloorPlanDrawingMode, FloorPlanPoint } from "../../types";

export interface FloorPlanShapeStrategy {
  addPoint(current: FloorPlanPoint[], next: FloorPlanPoint): FloorPlanPoint[];
  canSave(points: FloorPlanPoint[]): boolean;
  displayPoints(points: FloorPlanPoint[]): FloorPlanPoint[];
  instruction: string;
}

function rectanglePoints(start: FloorPlanPoint, end: FloorPlanPoint) {
  return [start, { x: end.x, y: start.y }, end, { x: start.x, y: end.y }];
}

export const FLOOR_PLAN_SHAPE_STRATEGIES: Record<
  FloorPlanDrawingMode,
  FloorPlanShapeStrategy
> = {
  polygon: {
    addPoint: (current, next) => [...current, next],
    canSave: (points) => points.length >= 3,
    displayPoints: (points) => points,
    instruction: "Tap at least three boundary points",
  },
  rectangle: {
    addPoint: (current, next) =>
      current.length >= 2 ? [next] : [...current, next],
    canSave: (points) => points.length === 2,
    displayPoints: (points) =>
      points.length === 2 ? rectanglePoints(points[0], points[1]) : points,
    instruction: "Tap two opposite corners",
  },
};
