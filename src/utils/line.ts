import { TLine, TPoint } from '../types';

/**
 * Get line SVG element
 * @param params - line params
 */
export const getLine = ({
    width, color, x1, x2, y1, y2, dasharray
}: {
    width: number | string;
    color: string;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    dasharray?: string;
}) => `<line stroke-width='${width}' stroke-dasharray='${dasharray || 'none'}' stroke='${color}' fill='none' x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}'></line>`;


/**
 * Convert Catmull-Rom spline to Bezier curve
 * @param points 
 * @returns 
 */
function catmullRom2bezier(points: TPoint[]): [TPoint, TPoint, TPoint][] {
    const result: [TPoint, TPoint, TPoint][] = [];
    for (var i = 0; i < points.length - 1; i++) {
        const p = [{
            x: points[Math.max(i - 1, 0)].x,
            y: points[Math.max(i - 1, 0)].y
        }, {
            x: points[i].x,
            y: points[i].y
        }, {
            x: points[i + 1].x,
            y: points[i + 1].y
        }, {
            x: points[Math.min(i + 2, points.length - 1)].x,
            y: points[Math.min(i + 2, points.length - 1)].y
        }];
        const bp: [TPoint, TPoint, TPoint] = [{
            x: ((-p[0].x + 6 * p[1].x + p[2].x) / 6),
            y: ((-p[0].y + 6 * p[1].y + p[2].y) / 6)
        }, {
            x: ((p[1].x + 6 * p[2].x - p[3].x) / 6),
            y: ((p[1].y + 6 * p[2].y - p[3].y) / 6)
        }, {
            x: p[2].x,
            y: p[2].y
        }];
        result.push(bp);
    }
    return result;
}

/**
 * Get spline path
 * @param points - points
 */
export const getSplinePath = (points: TPoint[]) => catmullRom2bezier(points).reduce((acc, point) => {
    return acc + "C" + point[0].x + "," + point[0].y + " " + point[1].x + "," + point[1].y + " " + point[2].x + "," + point[2].y + " "
}, '');
/**
 * Get spline figure
 * @param params - params
 */
export const getSpline = ({
    points,
    path,
    color,
    width,
    dasharray
}: TLine & {
    points: TPoint[];
    path?: string;
}) => {
    const d = path || getSplinePath(points);
    return `<path class="line" d="${"M" + points[0].x + "," + points[0].y + " " + d}" fill="none" stroke="${color || 'black'}" stroke-width="${width || 0.5}" stroke-dasharray="${dasharray || 'none'}"></path>`;
};
/**
 * Get spline area figure
 * @param params - params
 */
export const getSplineArea = ({
    points,
    limPoints,
    color,
    opacity
}: {
    points: TPoint[];
    limPoints: TPoint[];
    path?: string;
    color?: string;
    opacity?: string | number;
}) => {
    const d = getSplinePath(points);
    const rev = limPoints.toReversed();
    const dLim = getSplinePath(rev);
    return `<path class="line-area" d="${`M ${points[0].x},${points[0].y} ` + d + ` L ${rev[0].x} ${rev[0].y} ` + dLim + `L ${points[0].x} ${points[0].y} Z`}" opacity="${opacity ?? 0.2}" fill="${color ?? 'black'}" stroke="none" stroke-width="0"></path>`;
}
/**
 * Get polyline figure
 * @param points - points
 */
export const getPolyline = ({
    points,
    color,
    width,
    dasharray
}: TLine & {
    points: TPoint[]
}) => `<polyline points="${points.map((point) => `${point.x},${point.y}`).join(' ')}" fill="none" stroke="${color || 'black'}" stroke-width="${width || 0.5}" stroke-dasharray="${dasharray || 'none'}" />`;
/**
 * Get polyline area figure
 * @param params - params
 */
export const getPolylineArea = ({
    points,
    limPoints,
    color,
    opacity
}: {
    points: TPoint[];
    limPoints: TPoint[];
    color?: string;
    opacity?: string | number;
}) => {
    return `<polygon points="${points.map((point) => `${point.x},${point.y}`).join(' ')} ${limPoints.toReversed().map((point) => `${point.x},${point.y}`).join(' ')}" opacity="${opacity ?? 0.2}" fill="${color ?? 'black'}" stroke="none" stroke-width="0"/>`;
}
