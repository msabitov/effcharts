import type { TCartesianChartParams, ICartesianAttrs, TCartesianExtraConfig, TLine, TViewBox, TEvents } from './types';
import { getPolyline, getPolylineArea, getSpline, getSplineArea, getSplinePath } from './utils/line';
import { getCartesian } from './utils/cartesian';
import { getCircles } from './utils/circle';

// types

/**
 * Line chart attributes
 */
export interface ILineChartAttrs extends ICartesianAttrs {};

/**
 * Line chart event
 */
interface ILineChartEvent extends CustomEventInit {
    detail: {
        type: TEvents;
        event: MouseEvent | TouchEvent;
    };
}

/**
 * Line chart event handler
 */
type TLineChartEventHandler = (event: ILineChartEvent) => void;

/**
 * Line chart series
 */
type TLineChartSeries = TLine & {
    /**
     * Series title
     */
    title: string;
    /**
     * Value field
     */
    field: string;
    /**
     * Series color
     */
    color: string;
    /**
     * Is series smooth
     */
    smooth?: boolean;
    /**
     * Marker config
     */
    marker?: {
        /**
         * Marker color
         */
        color?: string;
        /**
         * Marker opacity
         */
        opacity?: number | string;
        /**
         * Marker radius
         */
        radius?: string;
    } | false;
    /**
     * Area config
     */
    area?: {
        /**
         * Fill area towards
         */
        towards?: 'zero' | 'min' | 'max';
        /**
         * Area color
         */
        color?: string;
        /**
         * Area opacity
         */
        opacity?: number | string;
    } | false;
}

/**
 * Line chart config
 */
export type TLineConfig = TCartesianChartParams<TLineChartSeries>;

/**
 * Use line chart
 */
export type TUseLine = {
    (): {
        /**
         * Observe line chart events
         * @param callback - event handler
         * @param element - HTML element
         */
        observe: (callback: TLineChartEventHandler, element?: HTMLElement) => () => void;
        /**
         * Unobserve line chart events
         * @param callback - event handler
         * @param element - HTML element
         */
        unobserve: (callback: TLineChartEventHandler, element?: HTMLElement) => void;
        /**
         * Prepare line chart config
         * @param config - chart config
         */
        getConfig: (data: TLineConfig) => string;
    };
};

// implementation

/**
 * Line chart tagname
 */
const TAGNAME = 'effcharts-line';

/**
 * Prepare line chart SVG
 * @param params - chart params 
 */
function makeLinePath({
    config,
    extra,
    viewBox,
    axis,
}: {
    axis: 'x' | 'y';
    config: TLineConfig;
    extra: TCartesianExtraConfig;
    viewBox: TViewBox;
}): string {
    const  {
        data,
        series,
    } = config;
    const {
        stacks,
        norm,
        zero
    } = extra;
    let res = stacks.reduce((acc, [stackName, stackKeys], stackInd) => {
        let prevVals = Array.from({length: data.length}, () => zero);
        const seriesSVG: string[] = [];
        stackKeys.forEach((seriesKey, seriesInd) => {
            const config = series[seriesKey];
            const {
                smooth = true,
                color,
                width,
                dasharray,
                area = {},
                marker = {}
            } = config;
            const rawPoints = norm[seriesKey];
            let items: string[] = [];
            
            let points: {
                x: number;
                y: number;
            }[] = rawPoints;
            let limPoints: {
                x: number;
                y: number;
            }[] = [];
            if (area) {
                if (axis === 'y') {
                    if (stackName) {
                        limPoints = points.map((val, ind) => ({...val, x: prevVals[ind]}));
                        points = rawPoints.map((val, ind) => {
                            const nextVal = prevVals[ind] + (val.x - zero);
                            prevVals[ind] = nextVal;
                            return {...val, x: nextVal};
                        });
                    } else if (area?.towards === 'max') limPoints = points.map((val) => ({...val, x: viewBox.maxX}));
                    else if (area?.towards === 'zero') limPoints = points.map((val) => ({...val, x: zero}));
                    else limPoints = points.map((val) => ({...val, x: 0}));
                } else {
                    if (stackName) {
                        limPoints = points.map((val, ind) => ({...val, y: prevVals[ind]}));
                        points = rawPoints.map((val, ind) => {
                            const nextVal = prevVals[ind] + (val.y - zero);
                            prevVals[ind] = nextVal;
                            return {...val, y: nextVal};
                        });
                    } else if (area?.towards === 'max') limPoints = points.map((val) => ({...val, y: 0}));
                    else if (area?.towards === 'zero') limPoints = points.map((val) => ({...val, y: zero}));
                    else limPoints = points.map((val) => ({...val, y: viewBox.maxY}));
                }
            }

            if (smooth) {
                items.push(getSpline({
                    color,
                    width,
                    dasharray,
                    points
                }));
                if (area) items.push(getSplineArea({
                    color,
                    points,
                    limPoints,
                    ...area
                }));
            } else {
                items.push(getPolyline({
                    color,
                    width,
                    dasharray,
                    points
                }));
                if (area) items.push(getPolylineArea({
                    color,
                    points,
                    limPoints,
                    ...area
                }));
            }
            if (marker) items.push(`<g data-markers>${getCircles({
                points,
                fill: color,
                ...marker
            })}</g>`);
            seriesSVG.push(`<g data-series-index="${seriesInd}" data-series="${seriesKey}">${items.join('')}</g>`)
        });
        acc.push(`<g data-stack-index="${stackInd}" data-stack="${stackName}">${seriesSVG.join('')}</g>`);
        return acc;
    }, [] as string[]);
    return res.join('');
}

/**
 * Use line chart
 */
export const useLine: TUseLine = () => {
    const custom = globalThis.customElements;
    const doc = globalThis.document;
    if (custom && !custom?.get(TAGNAME)) {
        const Cartesian = getCartesian();
        custom.define(TAGNAME, class Line extends Cartesian<TLineChartSeries> {
            getDataSVG() {
                const extra = this.extra;
                const config = this.configVal;
                return makeLinePath({
                    config,
                    extra,
                    viewBox: this.viewBox,
                    axis: this.axisVal
                });
            }

            getActiveSeries(): string {
                return '';
            }

            getDataCSS() {
                return `[data-markers] [data-index] {
                    fill-opacity: 0;
                    z-index: 3;
                }
                [data-markers] [data-index][data-active] {
                    fill-opacity: 1;
                }`;
            }
        } as unknown as CustomElementConstructor)
    }
    return {
        observe: (callback: TLineChartEventHandler, element: HTMLElement = doc?.body) => {
            element && element.addEventListener(TAGNAME, callback as unknown as EventListenerOrEventListenerObject);
            return () => element && element.removeEventListener(TAGNAME, callback as unknown as EventListenerOrEventListenerObject);
        },
        unobserve: (callback: TLineChartEventHandler, element: HTMLElement = doc?.body) => element.removeEventListener(TAGNAME, callback as unknown as EventListenerOrEventListenerObject),
        getConfig: (config: TLineConfig) => encodeURIComponent(JSON.stringify(config))
    };
};
