import { TPolarChartParams, TPolarExtraConfig } from "../types";
import { eventsOn } from "./events";
import { tooltipOn } from "./tooltip";

/**
 * Get polar chart extra config
 * @param params - function params
 */
const getPolarExtraConfig = ({
    config, viewBox
}: {
    config: TPolarChartParams<{
        field: string;
        stack?: string;
    }>;
    viewBox: {
        maxX: number;
        maxY: number;
    };
}): TPolarExtraConfig => {
    const { series, data, precision } = config;
    const radX = viewBox.maxX / 2;
    const radY = viewBox.maxY / 2;
    const norm = Object.entries(series).reduce((acc, [key, config]) => {
        const {
            field = 'value',
        } = config;
        const valSum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
        acc[key] = data.map((item) => {
            const value = ((+item[field] || 0) / valSum).toString(precision);
            return +value;
        });
        return acc;
    }, {} as Record<string, number[]>);
    return {
        radX,
        radY,
        norm
    };
}

const OBSERVED_ATTRS: string[] = [
    'config', 'ratio'
];

const DEF_CONFIG = {
    grid: {},
    tooltip: {},
    series: {}
};

const STATIC_CSS = `
    :host {display:block;position:relative;}
    [data-series] [data-index]{transition:all 200ms ease-in;}
    :host:has([data-series] [data-index]:hover) [data-series] > [data-index]:not(:hover){filter: grayscale(90%);opacity:0.2;}
`;

export const getPolar = (): any => {
    if (!globalThis.customElements) return class {};
    return class Polar<TSeries> extends HTMLElement {
        static observedAttributes = OBSERVED_ATTRS;

        protected _config: TPolarChartParams<TSeries>;

        protected _extra: TPolarExtraConfig;

        protected _active: number = -1;

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

        get tooltip(): HTMLDialogElement {
            return this.root.querySelector('#tooltip') as HTMLDialogElement;
        }

        get axis() {
            if (this.getAttribute('axis') === 'y') return 'y';
            return 'x';
        }

        get areas() {
            const left = this.shadowRoot?.querySelector('.l') as HTMLDivElement;
            const right = this.shadowRoot?.querySelector('.r') as HTMLDivElement;
            const bottom = this.shadowRoot?.querySelector('.b') as HTMLDivElement;
            const top = this.shadowRoot?.querySelector('.t') as HTMLDivElement;
            if (this.axis === 'y') return {
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
        get config(): TPolarChartParams<TSeries> {
            return this._config;
        }

        get extra(): TPolarExtraConfig {
            return this._extra;
        }

        /**
         * Set chart config
         */
        set config(value: TPolarChartParams<TSeries>) {
            this._config = {
                ...DEF_CONFIG,
                ...value,
                data: this.formatData(value.data)
            };
            const viewBox = this.viewBox;
            this._extra = getPolarExtraConfig({
                config: this._config,
                viewBox
            });
            this.render();
        }

        getDefaultTooltip({
            value, activeSeries
        }: {
            value: Record<string, any>;
            activeSeries: string;
        }): string {
            const { series } = this.config;
            const keys = activeSeries ? [activeSeries] : Object.keys(series);
            return `<div style="padding: 0.5rem;display:flex;flex-direction:column;gap: 0.5rem;">${keys.reduce((
                acc, seriesKey
            ) => {
                const seriesConfig = series[seriesKey] as unknown as {color:string;field:string;title: string;};
                return acc + (`<div style="display:flex;gap:0.25rem;align-items:center;justify-content:space-between;">` +
                    `<div style="display:flex;gap:0.25rem;align-items:center;"><div style="background:${value[seriesConfig.color || 'color']};width:0.75rem;height:0.75rem;border-radius:0.15rem;"></div><span>${seriesConfig.title}</span></div><span>${value[seriesConfig.field]}</span></div>`)
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
            const seriesValue = this.svg.querySelector('[data-series] [data-index]:hover');
            const index = seriesValue ? (seriesValue as HTMLElement).dataset.index || '-1' : '-1';
            return +index;
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
                    <svg id='chart' viewBox='0 0 ${this.viewBox.maxX} ${this.viewBox.maxY}' xmlns='http://www.w3.org/2000/svg'>
                        <g id='grid'></g>
                        <g id='data'></g>
                    </svg>
                    <dialog id='tooltip'></dialog>
                </div>
            `;
        }

        getDataSVG() {
            return '';
        }

        formatData(data: object[]) {
            return data;
        }

        setActive(index: number | null) {
            if (index === this._active) return;
            this._active = index === null ? -1 : index;
            [...this.svg.querySelectorAll<HTMLElement>('[data-active]')].forEach((i) => delete i.dataset.active);
            if (this._active !== -1) {
                [...this.svg.querySelectorAll<HTMLElement>(`[data-index='${index}']`)].forEach((i) => i.dataset.active = '');
            }
        }

        getDataCSS() {
            return '';
        }

        setCSS(styles: {
            tooltip: string;
        }): void {
            if (this.shadowRoot) {
                const staticCSS = new CSSStyleSheet();
                staticCSS.replaceSync(STATIC_CSS);
                const dynamicCSS = new CSSStyleSheet();
                dynamicCSS.replaceSync(
                    `@scope (#tooltip) {:scope{transition-property:transform;transition-duration:200ms;transition-timing-function:linear;transition-delay:0ms;` +
                    `pointer-events:none;position: absolute;box-shadow: 0 0 0.5rem currentColor;` +
                    `width:max-content;margin:0;padding:0;border:0px;border-radius: 0.5rem;color: currentColor;` +
                    `background:oklch(from light-dark(white, grey) l c h / 0.9);}&:focus,&:focus-visible {border:none;outline:none;}` +
                    styles.tooltip +
                    `}` +
                    this.getDataCSS()
                );
                this.shadowRoot.adoptedStyleSheets = [staticCSS, dynamicCSS];
            }
        }

        render() {
            if (!this.isConnected || !this.svg) return;
            const config = this.config;
            const styles = {
                tooltip: ''
            };
            if (config.tooltip) {
                const tooltipCSS = config.tooltip.css;
                if (tooltipCSS) styles.tooltip = tooltipCSS;
            }
            this.setCSS(styles);
            this.svgData.innerHTML = this.getDataSVG();
        }

        disconnectedCallback: () => void;

        connectedCallback() {
            this.attachShadow({ mode: 'open' });
            const attr = this.getAttribute('config');
            const configVal = attr ? JSON.parse(decodeURIComponent(attr)) : {};
            this.setLayout();
            this.config = configVal;
            this.render();
            const tooltipOff = tooltipOn(this)
            const eventsOff = eventsOn(this);
            this.disconnectedCallback = () => {
                tooltipOff();
                eventsOff();
            }
        }

        attributeChangedCallback(
            name: string
        ) {
            switch(name) {
                case 'ratio':
                    this.setLayout();
                    this.render();
                case 'config':
                    const attr = this.getAttribute('config');
                    const configVal = attr ? JSON.parse(decodeURIComponent(attr)) : {};
                    this.config = configVal;
                    this.render();
                    break;
            }
        }
    }
};
