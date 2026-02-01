import { TEvents } from "../types";

const EVENTS = [
    'click', 'dblclick', 'contextmenu',
    'mousedown', 'mouseup',
    'mousemove', 'mouseenter', 'mouseleave',
    'touchstart', 'touchmove', 'touchend'
] satisfies TEvents[];

export const eventsOn = (container: HTMLElement & {
    root: HTMLDivElement;
}) => {
    const root = container.root;
    const handler = (event: MouseEvent | TouchEvent) => {
        container.dispatchEvent(new CustomEvent(container.tagName.toLowerCase(), {
            detail: {
                type: event.type,
                event
            }
        }));
    };
    EVENTS.forEach((name) => root.addEventListener(name, handler));
    return () => EVENTS.forEach((name) => root.removeEventListener(name, handler));
};
