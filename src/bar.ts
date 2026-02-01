import type { TCartesianChartParams, ICartesianAttrs, TCartesianExtraConfig, TEvents } from './types';
import { getCartesian } from './utils/cartesian';

// types

/**
 * Bar chart attributes
 */
export interface IBarChartAttrs extends ICartesianAttrs {};

/**
 * Bar chart event
 */
interface IBarChartEvent extends CustomEventInit {
    detail: {
        type: TEvents;
        event: MouseEvent | TouchEvent;
    };
}

/**
 * Bar chart event handler
 */
type TBarChartEventHandler = (event: IBarChartEvent) => void;

/**
 * Bar chart series
 */
type TBarChartSeries = {
    /**
     * Value field
     */
    field: string;
    /**
     * Series title
     */
    title: string;
    /**
     * Bar stack
     */
    stack?: string;
    /**
     * Base color
     */
    color?: string;
    /**
     * Base opacity
     */
    opacity?: number | string;
}

/**
 * Bar chart config
 */
export type TBarConfig = TCartesianChartParams<TBarChartSeries>;

/**
 * Use bar chart
 */
export type TUseBar = {
    (): {
        /**
         * Observe bar chart events
         * @param callback - event handler
         * @param element - HTML element
         */
        observe: (callback: TBarChartEventHandler, element?: HTMLElement) => () => void;
        /**
         * Unobserve bar chart events
         * @param callback - event handler
         * @param element - HTML element
         */
        unobserve: (callback: TBarChartEventHandler, element?: HTMLElement) => void;
        /**
         * Prepare bar chart config
         * @param config - chart config
         */
        getConfig: (data: TBarConfig) => string;
    };
};

// implementation

/**
 * Bar chart tagname
 */
const TAGNAME = 'effcharts-bar';

/**
 * Prepare bar chart SVG
 * @param params - chart params 
 */
const makeBarPath = (params: {
    axis: 'x' | 'y';
    config: TBarConfig;
    extra: TCartesianExtraConfig;
}): string => {
    const {
        axis,
        config,
        extra
    } = params;
    const {
        data,
        series,
    } = config;
    const {
        stacks,
        norm,
        step,
        zero,
    } = extra;
    const stackCount = stacks.length;
    let res = stacks.reduce((acc, [stackName, stackKeys], stackInd) => {
        const prevUp = Array.from({length: data.length}, () => zero);
        const prevDown = Array.from({length: data.length}, () => zero);
        const seriesSVG: string[] = [];
        const sz = 0.5 * step / (3 * stackCount);
        const offset = -0.25 * step + stackInd * 3 * sz;
        stackKeys.forEach((seriesKey, seriesInd) => {
            const config = series[seriesKey];
            const points = norm[seriesKey];
            seriesSVG.push(`<g data-series-index="${seriesInd}" data-series="${seriesKey}">${points.map((i, index) => {
                let result = '';
                if (axis === 'x') {
                    if (i.y <= zero) {
                        const real = (zero - i.y);
                        result = `<rect x="${i.x + offset}" y="${prevUp[index] - real}" width="${2 * sz}" height="${real}" fill="${config.color || 'grey'}"/>`;
                        prevUp[index] -= real;
                    } else {
                        const real = (i.y - zero);
                        result = `<rect x="${i.x + offset}" y="${prevDown[index]}" width="${2 * sz}" height="${real}" fill="${config.color || 'grey'}"/>`;
                        prevDown[index] += real;
                    }
                } else {
                    if (i.x <= zero) {
                        const real = (zero - i.x);
                        result = `<rect y="${i.y + offset}" x="${prevUp[index] - real}" height="${2 * sz}" width="${real}" fill="${config.color || 'grey'}"/>`;
                        prevUp[index] -= real;
                    } else {
                        const real = (i.x - zero);
                        result = `<rect y="${i.y + offset}" x="${prevDown[index]}" height="${2 * sz}" width="${real}" fill="${config.color || 'grey'}"/>`;
                        prevDown[index] += real;
                    }
                }
                return result;
            }).join('')}</g>`);
        });
        acc.push(`<g data-stack-index="${stackInd}" data-stack="${stackName}">${seriesSVG.join('')}</g>`);
        return acc;
    }, [] as string[]);
    return res.join('');
};

/**
 * Use Bar chart
 */
export const useBar: TUseBar = () => {
    const custom = globalThis.customElements;
    const doc = globalThis.document;
    if (custom && !custom?.get(TAGNAME)) {
        const Cartesian = getCartesian();
        custom.define(TAGNAME, class Bar extends Cartesian<TBarChartSeries> {
            getDataSVG() {
                const axis = this.axis;
                const config = this.config;
                const extra = this.extra;
                return makeBarPath({
                    config,
                    extra,
                    axis
                });
            }

            formatData(data: object[]) {
                return [{}, ...data, {}];
            }
        } as unknown as CustomElementConstructor)
    }
    return {
        observe: (callback: TBarChartEventHandler, element: HTMLElement = doc?.body) => {
            element && element.addEventListener(TAGNAME, callback as unknown as EventListenerOrEventListenerObject);
            return () => element && element.removeEventListener(TAGNAME, callback as unknown as EventListenerOrEventListenerObject);
        },
        unobserve: (callback: TBarChartEventHandler, element: HTMLElement = doc?.body) => element.removeEventListener(TAGNAME, callback as unknown as EventListenerOrEventListenerObject),
        getConfig: (config: TBarConfig) => encodeURIComponent(JSON.stringify(config))
    };
};
