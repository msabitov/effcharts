export type TPoint = {
    x: number;
    y: number;
};

export type TEvents = 'click' | 'dblclick' |
    'contextmenu' | 'mousedown' | 'mouseup' |
    'mousemove' | 'mouseenter' | 'mouseleave' |
    'touchstart' | 'touchmove' | 'touchend' |
    'tooltip';

export type TViewBox = {
    /**
     * X axis maximum
     */
    maxX: number;
    /**
     * Y axis maximum
     */
    maxY: number;
};

export type TLine = {
    /**
     * Line color
     */
    color?: string;
    /**
     * Line width
     */
    width?: string | number;
    /**
     * Line stroke-dasharray
     */
    dasharray?: string;
};

export type TTick = {
    size?: number;
    color?: string;
    width?: number;
}

export type TTooltip = {
    /**
     * Get tooltip template by event
     */
    byEvent?: boolean;
    /**
     * Custom CSS for tooltip
     */
    css?: string;
    /**
     * Tooltip offset from cursor
     */
    offset?: string;
    /**
     * Close delay in ms
     */
    delay?: number;
};

export type TPolarChartParams<TSeries> = {
    /**
     * Chart data
     */
    data: Record<string, any>[];
    /**
     * Chart series
     */
    series: Record<string, Partial<TSeries>>;
    /**
     * Number precision
     */
    precision?: number;
    /**
     * Tooltip config
     */
    tooltip?: TTooltip | false;
}

export interface IChartAttrs {
    /**
     * Chart config
     */
    config: string;
}

export interface ICartesianAttrs extends IChartAttrs {
    /**
     * Label axis
     */
    axis?: 'x' | 'y';
    /**
     * Aspect-ratio
     */
    ratio?: string;
};

/**
 * Cartesian chart params
 */
export type TCartesianChartParams<TSeries> = {
    /**
     * Chart data
     */
    data: Record<string, any>[];
    /**
     * Chart series
     */
    series: Record<string, Partial<TSeries>>;
    /**
     * Number precision
     */
    precision?: number;
    /**
     * Is all series stacked
     */
    stacked?: boolean;
    /**
     * Value levels or count
     * @description
     * Can be used for grid or labels
     */
    levels?: number | number[];
    /**
     * Grid config
     */
    grid?: {
        /**
         * Config for X lines
         */
        xLine?: TLine | false;
        /**
         * Config for Y lines
         */
        yLine?: TLine | false;
        /**
         * Config for X axis
         */
        xAxis?: TLine & {side?: 'top' | 'bottom'} | false;
        /**
         * Config for Y axis
         */
        yAxis?: TLine & {side?: 'left' | 'right'} | false;
        /**
         * X tick
         */
        xTick?: TTick;
        /**
         * Y tick
         */
        yTick?: TTick;
        /**
         * Zero value line
         */
        zero?: TLine | false;
    } | false;
    /**
     * Highlight config
     */
    highlight?: {
        opacity?: number;
        color?: string;
    } | false;
    /**
     * Tooltip config
     */
    tooltip?: TTooltip | false;
    /**
     * Labels config
     */
    labels?: {
        /**
         * Name label field
         * @default `name`
         */
        field?: string;
        /**
         * Custom CSS for labels
         */
        css?: string;
    };
    /**
     * Min size of chart areas
     */
    minSize?: {
        /**
         * Left area
         */
        l?: string;
        /**
         * Right area
         */
        r?: string;
        /**
         * Top area
         */
        t?: string;
        /**
         * Bottom area
         */
        b?: string;
    };
};

export type TPolarExtraConfig = {
    /**
     * X axis radius
     */
    radX: number;
    /**
     * Y axis radius
     */
    radY: number;
    /**
     * Normalized series points
     */
    norm: Record<string, number[]>;
};

export type TCartesianExtraConfig = {
    /**
     * Max grid level
     */
    max: number;
    /**
     * Min grid level
     */
    min: number;
    /**
     * Grid zero level
     */
    zero: number;
    /**
     * Grid key step
     */
    step: number;
    /**
     * Series stacks
     */
    stacks: [string, string[]][];
    /**
     * Data grid keys
     */
    keys: string[];
    /**
     * Data grid vals
     */
    vals: number[];
    /**
     * Normalized series points
     */
    norm: Record<string, {x: number;y: number}[]>;
}
