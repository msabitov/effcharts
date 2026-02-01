import { TPoint } from "../types";

type TCircleItem = TPoint & {
    fill?: string;
    fillOpacity?: string | number;
    strokeOpacity?: string | number;
    strokeWidth?: string | number;
    stroke?: string;
    radius?: number | string;
};

export const getCircles = ({
    points,
    fill = 'light-dark(black, white)',
    stroke = 'light-dark(black, white)',
    fillOpacity = 0,
    strokeOpacity = 1,
    strokeWidth = 0.4,
    radius = 1
}: {
    points: TCircleItem[];
    stroke?: string;
    fill?: string;
    fillOpacity?: string | number;
    strokeOpacity?: string | number;
    strokeWidth?: string | number;
    radius?: string | number;
}) => {
    return points.map((point, index) => {
        return`<circle
            data-index="${index}"
            cx="${point.x}"
            cy="${point.y}"
            r="${point.radius || radius}"
            fill="${point.fill || fill}"
            fill-opacity=${point.fillOpacity || fillOpacity}
            stroke-opacity="${point.strokeOpacity || strokeOpacity}"
            stroke-width="${point.strokeWidth || strokeWidth}"
            stroke="${point.stroke || stroke}"
        ></circle>`;
    }).join('');
};
