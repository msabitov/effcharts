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
        series,
    } = config;
    const {
        stacks,
        norm,
        zero
    } = extra;
    let res = stacks.reduce((acc, [stackName, stackKeys], stackInd) => {
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
            const points = norm[seriesKey];
            let items: string[] = [];
            let limY = viewBox.maxY;
            let limX = viewBox.maxX;
            if (area) {
                if (axis === 'y') {
                    if (area?.towards === 'min') limX = viewBox.maxX;
                    else if (area?.towards === 'zero') limX = zero;
                    else limX = 0;
                } else {
                    if (area?.towards === 'min') limY = 0;
                    else if (area?.towards === 'zero') limY = zero;
                    else limY = viewBox.maxY;
                }
            }

            if (smooth) {
                const path = getSplinePath(points);
                items.push(getSpline({
                    color,
                    width,
                    dasharray,
                    path,
                    points
                }));
                if (area) items.push(getSplineArea({
                    color,
                    path,
                    points,
                    limY,
                    limX,
                    axis,
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
                    limY,
                    limX,
                    axis,
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
                const config = this.config;
                return makeLinePath({
                    config,
                    extra,
                    viewBox: this.viewBox,
                    axis: this.axis
                });
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
