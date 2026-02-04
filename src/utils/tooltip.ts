/**
 * Tooltip handlers
 */

import { TTooltip } from '../types';

export const tooltipOn = (container: HTMLElement & {
    tooltipTimerId?: number;
    svg: SVGElement, tooltip: HTMLDialogElement; root: HTMLDivElement;
    configVal: {data: object[];tooltip?: TTooltip;series: Record<string, Record<string, any>>};
    getActiveValue(params: {x: number; y: number}): number;
    getActiveSeries(): string;
    setActive(ind: number | null, series: string): void;
    getDefaultTooltip(params: {value: Record<string, any>, activeSeries: string}): string;
}) => {
    const handlers = {
        move: async (e: MouseEvent) => {
            if (!container?.configVal?.tooltip) return;
            const rect = container.svg.getBoundingClientRect();
            const tooltipOffsetAttr = container.getAttribute('tooltip-offset');
            const tooltipOffset = tooltipOffsetAttr ? tooltipOffsetAttr : '0.75rem';
            const x = e.clientX;
            const y = e.clientY;
            let transformX = tooltipOffset;
            let transformY = tooltipOffset;
            if (x > (rect.left + rect.width / 2)) {
                transformX = `calc(-${tooltipOffset} - 100%)`;
            }
            if (y > (rect.top + rect.height / 2)) {
                transformY = `calc(-${tooltipOffset} - 100%)`;
            }
            container.tooltip?.style.setProperty('left', x - rect.left + 'px');
            container.tooltip?.style.setProperty('top', y  - rect.top + 'px');
            container.tooltip?.style.setProperty('transform', `translate(${transformX}, ${transformY})`);
            let activeValueIndex = container.getActiveValue({x, y});
            const activeSeries = container.getActiveSeries();
            if (activeValueIndex === -1) return;
            container.setActive(activeValueIndex, activeSeries);
            // есть фейковые записи - будет смещение
            const value = container.configVal.data?.[activeValueIndex];
            const tooltipByEvent: boolean = !!container?.configVal?.tooltip?.byEvent;
            const tooltipTemplate: string = !Object.keys(value).length ? '' : tooltipByEvent ? await new Promise((resolve) => {
                container.dispatchEvent(new CustomEvent(container.tagName.toLowerCase(), {
                    bubbles: true,
                    detail:{
                        type: 'tooltip',
                        series: container.configVal?.series,
                        value,
                        activeValue: activeValueIndex,
                        activeSeries,
                        resolveTemplate: resolve
                    }
                }));
            }) : container.getDefaultTooltip({value, activeSeries});;
            if (container.tooltip && tooltipTemplate) {
                container.tooltip.innerHTML = tooltipTemplate;
                container.tooltip.show();
            } else {
                const timerId = container.tooltipTimerId;
                if (timerId) clearTimeout(timerId);
                container.tooltip?.close();
            }
        },
        leave: () => {
            const timerId = container.tooltipTimerId;
            if (timerId) clearTimeout(timerId);
            container.tooltipTimerId = setTimeout(() => {
                container.tooltip?.close();
                delete container.tooltipTimerId;
            }, container.configVal?.tooltip?.delay ?? 500);
            container.setActive(null, '');
        },
        enter: () => {
            const timerId = container.tooltipTimerId;
            if (timerId) clearTimeout(timerId);
        }
    };
    container.svg.addEventListener('mousemove', handlers.move);
    container.svg.addEventListener('mouseleave', handlers.leave);
    return () => {
        container.svg.removeEventListener('mousemove', handlers.move);
        container.svg.removeEventListener('mouseleave', handlers.leave);
    };
}
