import type {
    IChartAttrs, TEvents, TPolarChartParams, TPolarExtraConfig, TViewBox
} from './types';
import { getPolar } from './utils/polar';

// types

/**
 * Pie chart attributes
 */
export interface IPieChartAttrs extends IChartAttrs {};

/**
 * Pie chart event
 */
interface IPieChartEvent extends CustomEventInit {
    detail: {
        type: TEvents;
        event: MouseEvent | TouchEvent;
    };
}

/**
 * Pie chart event handler
 */
type TPieChartEventHandler = (event: IPieChartEvent) => void;

/**
 * Pie chart series
 */
type TPieChartSeries = {
    /**
     * Value field
     */
    field: string;
    /**
     * Series title
     */
    title: string;
    /**
     * Color
     */
    color: string;
    /**
     * Inner radius
     */
    inner?: number;
    /**
     * Outer radius
     */
    outer?: number;
    /**
     * Start angle
     */
    angle?: number;
}

/**
 * Pie chart config
 */
export type TPieConfig = TPolarChartParams<TPieChartSeries>;

/**
 * Use pie chart
 */
export type TUsePie = {
    (): {
        /**
         * Observe pie chart events
         * @param callback - event handler
         * @param element - HTML element
         */
        observe: (callback: TPieChartEventHandler, element?: HTMLElement) => () => void;
        /**
         * Unobserve pie chart events
         * @param callback - event handler
         * @param element - HTML element
         */
        unobserve: (callback: TPieChartEventHandler, element?: HTMLElement) => void;
        /**
         * Prepare pie chart config
         * @param config - chart config
         */
        getConfig: (data: TPieConfig) => string;
    };
};

// implementation

/**
 * Pie chart tagname
 */
const TAGNAME = 'effcharts-pie';

/**
 * Prepare pie chart SVG
 * @param params - chart params 
 */
function makePiePath({
    config,
    extra,
}: {
    axis: 'x' | 'y';
    config: TPieConfig;
    extra: TPolarExtraConfig;
    viewBox: TViewBox;
}): string {
    const  {
        data,
        series,
        precision = 4
    } = config;
    const {
        radX,
        radY,
        norm
    } = extra;
    return Object.entries(series).reduce((acc, [seriesKey, config]) => {
        const {
            inner = 0, outer = 1,
            color = 'color', angle = 90
        } = config;
        const innerRadiusX = inner * radX;
        const innerRadiusY = inner * radY;
        const outerRadiusX = outer * radX;
        const outerRadiusY = outer * radY;
        let sum = 0;
        let items: string[] = [];
        const startAngle = angle / 360;
        const targetOuterX = (radX + outerRadiusX * Math.cos(2 * Math.PI * (sum - startAngle))).toFixed(precision);
        const targetOuterY = (radY + outerRadiusY * Math.sin(2 * Math.PI * (sum - startAngle))).toFixed(precision);
        const targetInnerX = (radX + innerRadiusX * Math.cos(2 * Math.PI * (sum - startAngle))).toFixed(precision);
        const targetInnerY = (radY + innerRadiusY * Math.sin(2 * Math.PI * (sum - startAngle))).toFixed(precision);
        const coords = {
            inner: {
                x: targetInnerX,
                y: targetInnerY
            },
            outer: {
                x: targetOuterX,
                y: targetOuterY
            }
        };
        norm[seriesKey].reduce((prev, value, ind) => {
            const fill = data[ind][color] as string;
            if (value) sum += value;
            else sum = 1;
            const outer = {
                x: (radX + outerRadiusX * Math.cos(2 * Math.PI * (sum - startAngle))).toFixed(precision),
                y: (radY + outerRadiusY * Math.sin(2 * Math.PI * (sum - startAngle))).toFixed(precision)
            };
            const inner= {
                x: (radX + innerRadiusX * Math.cos(2 * Math.PI * (sum - startAngle))).toFixed(precision),
                y: (radY + innerRadiusY * Math.sin(2 * Math.PI * (sum - startAngle))).toFixed(precision)
            };
            const innerArc = `A ${innerRadiusX} ${innerRadiusY}, 0, ${value > 0.5 ? 1 : 0}, 1, ${inner.x} ${inner.y}`;
            const outerArc = `A ${outerRadiusX} ${outerRadiusY}, 0, ${value > 0.5 ? 1 : 0}, 0, ${prev.outer.x} ${prev.outer.y}`;
            items.push(`<path data-index="${ind}" d="M ${prev.inner.x} ${prev.inner.y} ${innerArc} L ${outer.x},${outer.y} ${outerArc} Z" fill="${fill}" stroke-width="0"></path>`);
            return {outer, inner};
        }, coords);
        acc += `<g data-series="${seriesKey}">${items.join('')}</g>`;
        return acc;
    }, '');
}

/**
 * Use Pie chart
 */
export const usePie: TUsePie = () => {
    const custom = globalThis.customElements;
    const doc = globalThis.document;
    if (custom && !custom?.get(TAGNAME)) {
        const Polar = getPolar();
        custom.define(TAGNAME, class Pie extends Polar<TPieChartSeries> {
            getDataSVG() {
                const extra = this.extra;
                const config = this.configVal;
                return makePiePath({
                    config,
                    extra,
                    viewBox: this.viewBox,
                    axis: this.axisVal
                });
            }
        } as unknown as CustomElementConstructor)
    }
    return {
        observe: (callback: TPieChartEventHandler, element: HTMLElement = doc?.body) => {
            element && element.addEventListener('effcharts-pie', callback as unknown as EventListenerOrEventListenerObject);
            return () => element && element.removeEventListener('effcharts-pie', callback as unknown as EventListenerOrEventListenerObject);
        },
        unobserve: (callback: TPieChartEventHandler, element: HTMLElement = doc?.body) => element.removeEventListener('effcharts-pie', callback as unknown as EventListenerOrEventListenerObject),
        getConfig: (config: TPieConfig) => encodeURIComponent(JSON.stringify(config))
    };
};