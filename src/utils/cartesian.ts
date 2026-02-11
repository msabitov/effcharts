
import { TCartesianChartParams, TCartesianExtraConfig, TLine, TTick, TViewBox } from '../types';
import { tooltipOn } from './tooltip';
import { eventsOn } from './events';
import { getLine } from './line';

// types

type TXAxis = {
    side?: 'top' | 'bottom';
    width?: number | string;
    color?: string;
}
type TYAxis = {
    side?: 'left' | 'right';
    width?: number | string;
    color?: string;
}

interface IGridParams {
    vals?: number[];
    keys?: string[];
    axis: 'x' | 'y';
    viewBox: {
        maxY: number;
        maxX: number;
    };
    xLine?: TLine | false;
    yLine?: TLine | false;
    xAxis?: TXAxis | false;
    yAxis?: TYAxis | false;
    xTick?: TTick | false;
    yTick?: TTick | false;
    zeroLevel: number;
    zero?: TLine | false;
}

// implementation

/**
 * Get zero level value
 * @param params - handler params
 */
export const getZeroLevel = ({
    maxVal,
    minVal,
    maxX,
    maxY,
    axis,
    precision = 4
}: {
    maxVal: number;
    minVal: number;
    maxX: number;
    maxY: number;
    axis?: 'x' | 'y';
    precision?: number;
}) => {
    if (axis === 'y') return +((0 - minVal) * maxX / (maxVal - minVal)).toFixed(precision)
    return +(maxY - (0 - minVal) * maxY / (maxVal - minVal)).toFixed(precision)
}

/**
 * Calculate limit value
 * @param val - source value
 */
export const calcLimit = (val: number) => {
    const sign = Math.sign(val);
    const abs = Math.abs(val);
    const [base, deg] = abs.toExponential().split('e');
    const [p = '', l = ''] = base.split('.');
    const bb = +l >= 5 * 10**(l.length - 1) ? +p + 1 : +p + 0.5
    const digits = (val + '').split('.')?.[1]?.length || 0;
    const bround = sign * +(bb * 10**(+deg)).toFixed(digits);
    return bround;
};

/**
 * Get cartesian chart extra config
 * @param params - function params
 */
export const getCartesianExtraConfig = ({
    config, axis, viewBox
}: {
    config: TCartesianChartParams<{
        field: string;
        stack?: string;
    }>;
    axis: 'x' | 'y';
    viewBox: {
        maxX: number;
        maxY: number;
    };
}): TCartesianExtraConfig => {
    const {data, grid = {}, precision = 4, levels, stacked} = config;
    let defStack = '';
    if (stacked) defStack = 'default';
    const limits: Record<string, {max: number[]; min: number[];}> = {
        '': {
            max: Array.from({length: data.length}, () => 0),
            min: Array.from({length: data.length}, () => 0),
        }
    };
    const count = data.length;
    let keyCoords: number[];
    let step: number;
    if (axis === 'y') {
        step = viewBox.maxY / (count - 1);
        keyCoords = data.map((_: object, ind: number) => +(viewBox.maxY - step * ind).toFixed(4));
    } else {
        step = viewBox.maxX / (count - 1);
        keyCoords = data.map((_: object, ind: number) => +(step * ind).toFixed(4));
    }
    const stacks: {
        order: [string, string[]][];
        ind: Record<string, number>;
    } = {
        order: [],
        ind: {}
    };
    const values: [string, number[]][] = Object.entries(config.series).map(([seriesKey, series]) => {
        const {field = 'key', stack = defStack} = series;
        if (stack) {
            if (!limits[stack]) limits[stack] = {
                max: Array.from({length: data.length}, () => 0),
                min: Array.from({length: data.length}, () => 0),
            };
            if (stacks.ind[stack] === undefined) {
                stacks.ind[stack] = stacks.order.length;
                stacks.order.push([stack, []])
            }
            stacks.order[stacks.ind[stack]][1].push(seriesKey);
        } else stacks.order.push(['', [seriesKey]])

        const vals = data.map((ditem, index) => {
            const val = ditem[field] || 0;
            if (stack) {
                if (val >= 0) limits[stack].max[index] += val;
                else limits[stack].min[index] += val;
                return val;
            }
            if (val > limits[''].max[index]) limits[''].max[index] = val;
            else if (val < limits[''].min[index]) limits[''].min[index] = val;
            return val;
        });
        return [seriesKey, vals];
    });

    const total = Object.values(limits).reduce((acc, val) => {
        const stackMax = Math.max(...val.max);
        const stackMin = Math.min(...val.min);
        if (acc.max < stackMax) acc.max = stackMax;
        if (acc.min > stackMin) acc.min = stackMin;
        return acc;
    }, {
        max: 0,
        min: 0
    });
    let max: number;
    let min: number;
    let vals: number[];
    if (!grid) {
        vals = [];
        max = 0;
        min = 0;
    } else if (Array.isArray(levels)) {
        vals = levels;
        max = levels[levels.length - 1];
        min = levels[0];
    } else {
        const levCount = levels || 5;
        max = calcLimit(total.max);
        min = calcLimit(total.min);
        vals = levCount < 2 ? [] : Array.from({length: levCount}, (x, i) => min + i * (max - min) / (levCount - 1));
    }

    const norm: Record<string, {x: number;y: number}[]> = {}
    values.forEach(([key, raw]) => {
        if (axis === 'y') {
            norm[key] = raw.map((val, ind) => ({
                x: +((+val - min) * viewBox.maxX / (max - min)).toFixed(precision),
                y: keyCoords[ind]
            }));
        } else {
            norm[key] = raw.map((val, ind) => ({
                x: keyCoords[ind],
                y: +(viewBox.maxY - (val - min) * viewBox.maxY / (max - min)).toFixed(precision)
            }));
        }
    });
    const zero = getZeroLevel({
        maxVal: max,
        minVal: min,
        maxX: viewBox.maxX,
        maxY: viewBox.maxY,
        axis
    });
    const keys = config.data.map((item) => item[config.labels?.field || 'name']);

    return {
        max, min, zero, step,
        norm,
        stacks: stacks.order,
        keys,
        vals
    };
}

/**
 * Get highlight SVG
 * @param params - function params
 */
const getHighlightSVG = ({
    count, step, axis
}: {
    count: number;
    step: number;
    axis: 'x' | 'y';
}) => {
    const items = [];
    for (let ind = 0; ind < count; ind++) {
        const x = ind * step;
        let size = step;
        let start = x - 0.5 * step;
        if (ind === 0) start = x;
        if (ind === 0 || ind === count - 1) size = step / 2;
        if (axis === 'y') items.push(`<rect data-index="${count - ind - 1}" x="${0}" y="${start}" width="100%" height="${size}"></rect>`);
        else items.push(`<rect data-index="${ind}" x="${start}" y="${0}" height="100%" width="${size}"></rect>`);
    }
    return items.join('');
}

/**
 * Get highlight CSS
 * @param params - function params
 */
const getHighlightCSS = ({
    color, opacity
}: {
    color?: string; opacity?: number;
}) => {
    return `:scope:has([data-active]) [data-index]:not([data-active]){` +
        `fill: oklch(from ${color || 'currentColor'} l c h / ${opacity || 0.1});}`;
};

/**
 * Make Y axis path
 * @param params - function params
 */
const makeYPath = ({
    viewBox, count, yAxis, yLine, yTick,
}: {
    count: number;
    yAxis?: TYAxis | false;
    yLine?: TLine | false;
    yTick?: TTick | false;
    viewBox: {
        maxX: number;
        maxY: number;
    };
}) => {
    const {maxX, maxY} = viewBox;
    let lines = '';
    let ticks = '';
    let axis = '';
    for (let i = 0; i <= count; i++) {
        const y = maxY / count * i;
        if (yLine) {
            lines += getLine({
                width: yLine.width || 0.1,
                color: yLine.color || 'grey',
                y1: y,
                x1: 0,
                y2: y,
                x2: maxX,
                dasharray: yLine.dasharray || '3 2'
            });
        }
        if (yTick) {
            if (yAxis && yAxis?.side === 'right') ticks += getLine({
                width: yTick.width || 0.4,
                color: yTick.color || 'grey',
                y1: y,
                x1: maxX,
                y2: y,
                x2: maxX - (yTick.size || 2)
            });
            else ticks += getLine({
                width: yTick.width || 0.4,
                color: yTick.color || 'grey',
                y1: y,
                x1: (yTick.size || 2),
                y2: y,
                x2: 0
            });
        }
    }
    if (yAxis) {
        if (yAxis.side === 'right') axis += getLine({
            width: yAxis.width || 0.4,
            color: yAxis.color || 'grey',
            y1: 0, y2: maxY, x1: maxX, x2: maxX
        });
        else axis += getLine({
            width: yAxis.width || 0.4,
            color: yAxis.color || 'grey',
            y1: 0, y2: maxY, x1: 0, x2: 0
        });
    }
    return `<g data-lines>${lines}</g><g data-ticks>${ticks}</g><g data-axis>${axis}</g>`;
};

/**
 * Make X axis path
 * @param params - function params
 */
const makeXPath = ({
    xAxis, xLine, xTick,
    viewBox,
    count
}: {
    count: number;
    xAxis?: TXAxis | false;
    xLine?: TLine | false;
    xTick?: TTick | false;
    viewBox: {
        maxX: number;
        maxY: number;
    };
}) => {
    const {maxX, maxY} = viewBox;
    let lines = '';
    let ticks = '';
    let axis = '';
    for (let i = 0; i <= count; i++) {
        const x = maxX / count * i;
        if (xLine) {
            lines += getLine({
                width: xLine.width || 0.1,
                color: xLine.color || 'grey',
                x1: x,
                y1: 0,
                x2: x,
                y2: maxY,
                dasharray: xLine.dasharray || '3 2'
            });
        }
        if (xTick) {
            if (xAxis && xAxis?.side === 'top') ticks += getLine({
                width: xTick.width || 0.4,
                color: xTick.color || 'grey',
                x1: x,
                y1: xTick.size || 2,
                x2: x,
                y2: 0
            });
            else ticks += getLine({
                width: xTick.width || 0.4,
                color: xTick.color || 'grey',
                x1: x,
                y1: maxY,
                x2: x,
                y2: maxY - (xTick.size || 2)
            });
        }
    }
    if (xAxis) {
        if (xAxis.side === 'top') axis += getLine({
            width: xAxis.width || 0.4,
            color: xAxis.color || 'grey',
            x1: 0, x2: maxX, y1: 0, y2: 0
        });
        else axis += getLine({
            width: xAxis.width || 0.4,
            color: xAxis.color || 'grey',
            x1: 0, x2: maxX, y1: maxY, y2: maxY
        });
    }
    return `<g data-lines>${lines}</g><g data-ticks>${ticks}</g><g data-axis>${axis}</g>`;
};

/**
 * Make zero path
 * @param params - function params
 */
const makeZeroPath = ({
    zeroLevel,
    color, width, dasharray,
    viewBox,
    axis
}: {
    zeroLevel: number;
    color?: string;
    width?: string | number;
    dasharray?: string;
    axis?: 'x' | 'y';
    viewBox: TViewBox;
}) => {
    let x1;
    let x2;
    let y1;
    let y2;
    if (axis === 'y') {
        x1 = zeroLevel;
        x2 = zeroLevel;
        y1 = 0;
        y2 = viewBox.maxY;
    } else {
        x1 = 0;
        x2 = viewBox.maxX;
        y1 = zeroLevel;
        y2 = zeroLevel;
    }
    return `<line stroke-width="${width ?? '0.4'}" stroke="${color ?? 'grey'}" stroke-dasharray="${dasharray ?? 'none'}" fill="none" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
};

/**
 * Get cartesian grid SVG
 * @param params- function params 
 */
export const getGridSVG = ({
    vals = [], keys = [], axis, viewBox,
    zero = {},
    xAxis = {}, yAxis = {},
    xLine = {}, yLine = {},
    xTick = {}, yTick = {},
    zeroLevel
}: IGridParams) => {
    let yCount = 5;
    let xCount = 5;
    if (axis === 'y') {
        yCount = keys.length - 1;
        xCount = vals.length - 1;
    } else {
        yCount = vals.length - 1;
        xCount = keys.length - 1;
    }
    const yLines = makeYPath({
        viewBox,
        count: yCount,
        yAxis,
        yLine,
        yTick
    });
    const xLines = makeXPath({
        viewBox,
        count: xCount,
        xAxis,
        xLine,
        xTick
    });
    const zeroLine = zero ? makeZeroPath({
        ...zero,
        zeroLevel,
        viewBox,
        axis
    }) : '';
    return `<g data-y>${yLines}</g><g data-x>${xLines}</g><g data-zero>${zeroLine}</g>`;
};


const STATIC_CSS = `
    :host {display:block;position:relative;contain:inline-size;}
    #wrapper {position: relative;}
    #chart {overflow: visible;}
    .grid {z-index: -1;pointer-events:none;display: block;position: absolute;top: 0;left: 0;}
    [data-series]{transition:all 200ms ease-in;}
    :host:has([data-series]:hover) [data-series]:not(:hover) > rect {fill: currentColor;opacity:0.5;}
    [data-series] rect{transition:all 200ms ease-in;}
    :host:has([data-stack-part] rect:hover) [data-stack-part]:not(:hover) rect{fill-opacity:0.2;}
    .c {display: grid;align-content: center;justify-items: center;position: relative;}
    .l {z-index: 2;min-width:var(--effchart-l-min-sz, 4rem);display: grid;align-items: center;}
    .r {z-index: 2;min-width:var(--effchart-r-min-sz, 4rem);display: grid;align-items: center;}
    .l > div, .r > div {display: flex;flex-direction: column-reverse;}
    .l .label {flex-grow:1;flex-shrink: 1;display: grid;align-items: center;justify-content: end;padding: 0 1rem;}
    .r .label {flex-grow:1;flex-shrink: 1;display: grid;align-items: center;justify-content: start;padding: 0 1rem;}
    .b {z-index: 2;min-height:var(--effchart-b-min-sz, 4rem);display: grid;justify-content: center;container-type: inline-size;}
    .t {z-index: 2;min-height:var(--effchart-t-min-sz, 4rem);display: grid;justify-content: center;container-type: inline-size;}
    .t .label, .b .label {flex-grow: 1;flex-shrink: 1;display: grid;justify-items: center;align-items: center;}
    .label {flex-grow: 1;flex-shrink: 1;overflow: hidden;text-align: center;padding: 0 0.25rem;text-overflow: ellipsis;}
    ::slotted(){position:absolute;width:100%;height:100%;}
`;

const OBSERVED_ATTRS: string[] = [
    'config', 'axis', 'ratio'
];

const DEF_CONFIG = {
    grid: {},
    highlight: {},
    tooltip: {},
    labels: {},
    series: {}
};

export const getCartesian = (): any => {
    if (!globalThis.customElements) return class {};
    return class Cartesian<TSeries> extends HTMLElement {
        static observedAttributes = OBSERVED_ATTRS;

        protected _config: TCartesianChartParams<TSeries>;

        protected _extra: TCartesianExtraConfig;

        protected _activeValueIndex: number = -1;
        protected _activeSeriesKey: string = '';

        viewBox = {
            maxX: 100,
            maxY: 100
        };

        get root() {
            return this.shadowRoot?.children[0] as HTMLDivElement;
        }

        get svg() {
            return this.root?.querySelector('#chart') as SVGElement;
        }

        get svgGrid() {
            return this.root?.querySelector('#grid') as SVGElement;
        }

        get svgData() {
            return this.root?.querySelector('#data') as SVGElement;
        }

        get svgHighlight() {
            return this.root?.querySelector('#highlight') as SVGElement;
        }

        get tooltip(): HTMLDialogElement {
            return this.root.querySelector('#tooltip') as HTMLDialogElement;
        }

        get axisVal() {
            if (this.getAttribute('axis') === 'y') return 'y';
            return 'x';
        }

        get areas() {
            const left = this.shadowRoot?.querySelector('.l') as HTMLDivElement;
            const right = this.shadowRoot?.querySelector('.r') as HTMLDivElement;
            const bottom = this.shadowRoot?.querySelector('.b') as HTMLDivElement;
            const top = this.shadowRoot?.querySelector('.t') as HTMLDivElement;
            if (this.axisVal === 'y') return {
                vals: bottom,
                vals_: top,
                keys: left,
                keys_: right
            };
            return {
                vals: left,
                vals_: right,
                keys: bottom,
                keys_: top
            };
        };

        /**
         * Get chart config
         */
        get configVal(): TCartesianChartParams<TSeries> {
            return this._config;
        }

        get extra(): TCartesianExtraConfig {
            return this._extra;
        }

        /**
         * Set chart config
         */
        set configVal(value: TCartesianChartParams<TSeries>) {
            if (!this.isConnected) return;
            this._config = {
                ...DEF_CONFIG,
                ...value,
                data: this.formatData(value.data)
            };
            const axis = this.axisVal;
            const viewBox = this.viewBox;
            this._extra = getCartesianExtraConfig({
                config: this._config,
                viewBox,
                axis
            });
            this.render();
        }

        /**
         * Get default tooltip template
         * @param params - tooltip params
         */
        getDefaultTooltip({
            value, activeSeries
        }: {
            value: Record<string, any>;
            activeSeries: string;
        }): string {
            const { series } = this.configVal;
            const keys = activeSeries ? [activeSeries] : Object.keys(series);
            return `<div style="padding: 0.5rem;display:flex;flex-direction:column;gap: 0.5rem;">${keys.reduce((
                acc, seriesKey
            ) => {
                const seriesConfig = series[seriesKey] as unknown as {color:string;field:string;title: string;};
                return acc + (`<div style="display:flex;gap:0.25rem;align-items:center;justify-content:space-between;">` +
                    `<div style="display:flex;gap:0.25rem;align-items:center;"><div style="background:${seriesConfig.color};width:0.75rem;height:0.75rem;border-radius:0.15rem;"></div><span>${seriesConfig.title}</span></div><span>${value[seriesConfig.field]}</span></div>`)
                }, '')
            }</div>`;
        }

        /**
         * Get active series
         */
        getActiveSeries(): string {
            const series = this.svg.querySelector('[data-series]:hover');
            return series ? (series as HTMLElement).dataset.series || '' : '';
        }

        /**
         * Get area index by point
         * @param point - point params
         */
        getActiveValue({x, y}: {
            x: number;
            y: number;
        }): number {
            const rect = this.svg.getBoundingClientRect();
            const count = this.configVal.data.length - 1;
            let index = -1;
            if (count >= 0) {
                if (this.axisVal === 'y') {
                    const step = rect.height / count;
                    const ind = (y - rect.top + 0.5 * step) / step;
                    index = count - Math.floor(ind);
                } else {
                    const step = rect.width / count;
                    const ind = (x - rect.left + 0.5 * step) / step;
                    index = Math.floor(ind);
                }
            }
            return index;
        }

        setLayout() {
            if (!this.shadowRoot) return;
            const aspectRatio = this.getAttribute('ratio') || '1';
            const [aspectRatioW = '1', aspectRatioH = '1'] = aspectRatio.split('/');
            const aspectRatioNum = Number(aspectRatioW) / Number(aspectRatioH);
            let maxX: number = 100;
            let maxY: number = 100;
            if (aspectRatioNum > 1) maxX = +(100 * aspectRatioNum).toFixed();
            else if (aspectRatioNum < 1) maxY = +(100 / aspectRatioNum).toFixed();
            this.viewBox = {
                ...this.viewBox,
                maxX,
                maxY
            };
            this.shadowRoot.innerHTML = `
                <div id='root'>
                    <div class='tl'></div><div class='t'></div><div class='tr'></div>
                    <div class='l'></div>
                    <div class='c'>
                        <svg id='chart' viewBox='0 0 ${this.viewBox.maxX} ${this.viewBox.maxY}' xmlns='http://www.w3.org/2000/svg'>
                            <g id='highlight'></g>
                            <g id='grid'></g>
                            <g id='data'></g>
                        </svg>
                        <dialog id='tooltip'></dialog>
                    </div>
                    <div class='r'></div>
                    <div class='bl'></div><div class='b'></div><div class='br'></div>
                </div>
            `;
        }

        getLabelsSVG() {
            const {
                keys, vals
            } = this.extra;
            const labels = this.configVal.labels;
            if (!labels) {
                return {
                    keys: '',
                    vals: ''
                };
            }
            const axis = this.axisVal;
            let keysHTML = '';
            let valsHTML = '';
            if (axis === 'y') {
                if (vals) valsHTML = `<div style='width:calc(100cqw * ${(1 + 1 / (vals.length - 1)).toFixed(4)});grid-template-columns: repeat(${vals.length}, 1fr);display: grid;'>${vals.map((i) => `<div class='label'>${i ?? ''}</div>`).join('')}</div>`;
                if (keys) keysHTML =  `<div style='height:calc(100% * ${(1 + 1 / (keys.length - 1)).toFixed(4)});display: grid;grid-template-rows: repeat(${keys.length}, 1fr);'>${keys.toReversed().map((i) => `<div class='label'>${i ?? ''}</div>`).join('')}</div>`;
            } else {
                if (keys) keysHTML = `<div style='width:calc(100cqw * ${(1 + 1 / (keys.length - 1)).toFixed(4)});grid-template-columns: repeat(${keys.length}, 1fr);display: grid;'>${keys.map((i) => `<div class='label'>${i ?? ''}</div>`).join('')}</div>`;
                if (vals) valsHTML = `<div style='height:calc(100% * ${(1 + 1 / (vals.length - 1)).toFixed(4)});display: grid;grid-template-rows: repeat(${vals.length}, 1fr);'>${vals.toReversed().map((i) => `<div class='label'>${i ?? ''}</div>`).join('')}</div>`;
            }
            return {
                keys: keysHTML,
                vals: valsHTML
            }
        }

        getGridSVG() {
            const prep = this.extra;
            const grid = this.configVal.grid;
            const axis = this.axisVal;
            if (!grid) return '';
            return getGridSVG({
                keys: prep.keys, vals: prep.vals,
                axis,
                viewBox: this.viewBox,
                zeroLevel: prep.zero,
                ...grid
            });
        }

        getDataSVG() {
            return '';
        }

        formatData(data: object[]) {
            return data;
        }

        setActive(index: number | null, series: string) {
            if (series !== this._activeSeriesKey) {
                this._activeSeriesKey = series;
            }
            if (index !== this._activeValueIndex) {
                this._activeValueIndex = index === null ? -1 : index;
                [...this.svg.querySelectorAll<HTMLElement>('[data-active]')].forEach((i) => delete i.dataset.active);
                if (this._activeValueIndex !== -1) {
                    [...this.svg.querySelectorAll<HTMLElement>(`[data-index='${index}']`)].forEach((i) => i.dataset.active = '');
                }
            }
        }

        getDataCSS() {
            return '';
        }

        setCSS(styles: {
            tooltip: string;
            highlight: string;
            minSize: {l?: string;r?:string;t?:string;b?:string}
        }): void {
            if (this.shadowRoot) {
                const staticCSS = new CSSStyleSheet();
                staticCSS.replaceSync(STATIC_CSS);
                const dynamicCSS = new CSSStyleSheet();
                dynamicCSS.replaceSync(
                    `@scope (#tooltip) {:scope{transition-property:transform;transition-duration:200ms;transition-timing-function:linear;transition-delay:0ms;` +
                    `pointer-events:none;position: absolute;box-shadow: 0 0 0.5rem currentColor;` +
                    `width:max-content;margin:0;padding:0;border:0px;border-radius: 0.5rem;color: currentColor;` +
                    `background:oklch(from light-dark(white, #161618) l c h / 0.9);}&:focus,&:focus-visible {border:none;outline:none;}` +
                    styles.tooltip +
                    `}` +
                    `@scope (#highlight) {[data-index] {fill: transparent;stroke: none;z-index: 100;}` +
                    `:scope:has([data-active]) [data-index]:not([data-active]){fill: oklch(from currentColor l c h / 0.1);}` +
                    styles.highlight +
                    `}` + this.getDataCSS() +
                    `#root{display: grid;grid-template-rows: auto 1fr auto;grid-template-columns: auto 1fr auto;padding: 0.5rem;` +
                    Object.entries(styles.minSize).map(([key, val]) => `--effchart-${key}-min-sz: ${val};`).join('') + '}'
                );
                this.shadowRoot.adoptedStyleSheets = [staticCSS, dynamicCSS];
            }
        }

        render() {
            if (!this.isConnected || !this.svg) return;
            const axis = this.axisVal;
            const config = this.configVal;
            const extra = this.extra;
            const styles = {
                highlight: '',
                tooltip: '',
                minSize: config.minSize || {}
            };
            if (config.highlight) {
                this.svgHighlight.innerHTML = getHighlightSVG({
                    axis,
                    count: extra.keys.length,
                    step: extra.step,
                });
                styles.highlight = getHighlightCSS(config.highlight);
            }
            if (config.tooltip) {
                const tooltipCSS = config.tooltip.css;
                if (tooltipCSS) styles.tooltip = tooltipCSS;
            }
            this.setCSS(styles);
            const labelsSVG = this.getLabelsSVG();
            if (config.grid && config.grid?.xAxis && config.grid?.xAxis?.side === 'top') {
                this.areas.keys_.innerHTML = labelsSVG.keys;
                this.areas.keys.innerHTML = '';
            } else {
                this.areas.keys_.innerHTML = '';
                this.areas.keys.innerHTML = labelsSVG.keys;
            }
            // set vals
            if (config.grid && config.grid?.yAxis && config.grid?.yAxis?.side === 'right') {
                this.areas.vals_.innerHTML = labelsSVG.vals;
                this.areas.vals.innerHTML = '';
            } else {
                this.areas.vals_.innerHTML = '';
                this.areas.vals.innerHTML = labelsSVG.vals;
            }
            this.svgGrid.innerHTML = this.getGridSVG();
            this.svgData.innerHTML = this.getDataSVG();
        }

        disconnectedCallback: () => void;

        connectedCallback() {
            this.attachShadow({ mode: 'open' });
            const attr = this.getAttribute('config');
            const configVal = attr ? JSON.parse(decodeURIComponent(attr)) : {};
            this.setLayout();
            this.configVal = configVal;
            this.render();
            
            const tooltipOff = tooltipOn(this)
            const eventsOff = eventsOn(this);
            this.disconnectedCallback = () => {
                tooltipOff();
                eventsOff();
            }
        }

        attributeChangedCallback(
            name: string,
        ) {
            switch(name) {
                case 'axis':
                case 'ratio':
                    this.setLayout();
                    this.render();
                case 'config':
                    const attr = this.getAttribute('config');
                    const configVal = attr ? JSON.parse(decodeURIComponent(attr)) : {};
                    this.configVal = configVal;
                    this.render();
                    break;
            }
        }
    };
};

