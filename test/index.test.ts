import { beforeAll, describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { usePie } from '../src/pie';
import { useLine } from '../src/line';
import { useBar } from '../src/bar';

const pieHandlers = usePie()
const lineHandlers = useLine();
const barHandlers = useBar()

const PIECHART_DATA = pieHandlers.getConfig({
    data: [
        {
            key: '1',
            value: 0.50,
            color: 'green',
            val2: 120
        },
        {
            key: '2',
            value: 0.25,
            color: 'red',
            val2: 140
        },
        {
            key: '3',
            value: 0.12,
            color: 'blue',
            val2: 30
        },
        {
            key: '4',
            color: 'yellow',
            val2: 50
        }
    ],
    series: {
        def: {
            field: 'value',
            color: 'color',
            title: 'Default',
            inner: 0.55,
            outer: 1
        },
        other: {
            field: 'val2',
            title: 'Alter',
            outer: 0.5,
            angle: 180
        }
    },
    tooltip: {
        offset: '5px'
    }
});

const LINECHART_DATA = lineHandlers.getConfig({
    data: [{
            name: '<b>Page A</b>',
            namealt: '<b>Pagaae A</b>',
            uv: 4000,
            y: 2400,
            amt: -2400,
            tooltip: '<p>Inline tooltip</p>'
        },
        {
            name: 'Page B',
            namealt: '<b>Pagaae A</b>',
            uv: 3000,
            y: 1398,
            amt: -1510,
        },
        {
            name: 'Page C',
            namealt: '<b>Pagaae A</b>',
            uv: 2000,
            y: 9800,
            amt: 2290,
        },
        {
            name: 'Page D',
            namealt: '<b>Pagaae A</b>',
            uv: 2780,
            y: 3908,
            amt: 2000,
        },
        {
            name: 'Page E',
            namealt: '<b>Pagaae A</b>',
            uv: 1890,
            y: 4800,
            amt: 2181,
        },
        {
            name: 'Page F',
            namealt: '<b>Pagaae A</b>',
            uv: 2390,
            y: 3800,
            amt: 2500,
        },
        {
            name: 'Page G',
            namealt: '<b>Pagaae A</b>',
            uv: 3490,
            y: 4300,
            amt: 2100,
        }
    ],
    series: {
        def: {
            title: 'Base vals',
            field: 'y',
            color: 'green',
            smooth: true,
            marker: {},
            area: {
                towards: 'max'
            }
        },
        next: {
            title: 'Next vals',
            field: 'uv',
            color: 'blue',
            area: {
                towards: 'min'
            }
        },
        amt: {
            title: 'Amt vals',
            field: 'amt',
            color: 'red',
            area: {
                towards: 'zero'
            }
        }
    }
});

const LINECHART_DATA_STACKED = lineHandlers.getConfig({
    data: [{
            name: '<b>Page A</b>',
            namealt: '<b>Pagaae A</b>',
            uv: 4000,
            y: 2400,
            amt: 2400,
            tooltip: '<p>Inline tooltip</p>'
        },
        {
            name: 'Page B',
            namealt: '<b>Pagaae A</b>',
            uv: 3000,
            y: 1398,
            amt: 1510,
        },
        {
            name: 'Page C',
            namealt: '<b>Pagaae A</b>',
            uv: 2000,
            y: 9800,
            amt: 2290,
        },
        {
            name: 'Page D',
            namealt: '<b>Pagaae A</b>',
            uv: 2780,
            y: 3908,
            amt: 2000,
        },
        {
            name: 'Page E',
            namealt: '<b>Pagaae A</b>',
            uv: 1890,
            y: 4800,
            amt: 2181,
        },
        {
            name: 'Page F',
            namealt: '<b>Pagaae A</b>',
            uv: 2390,
            y: 3800,
            amt: 2500,
        },
        {
            name: 'Page G',
            namealt: '<b>Pagaae A</b>',
            uv: 3490,
            y: 4300,
            amt: 2100,
        }
    ],
    series: {
        def: {
            title: 'Base vals',
            field: 'y',
            color: 'green'
        },
        next: {
            title: 'Next vals',
            field: 'uv',
            color: 'blue'
        },
        amt: {
            title: 'Amt vals',
            field: 'amt',
            color: 'red'
        }
    },
    stacked: true
});

const BARCHART_DATA = {
    data: [
        {
            name: 'Page A',
            uv: 4000,
            pv: 2400,
            amt: -2400,
        },
        {
            name: 'Page B',
            uv: 3000,
            pv: 1398,
            amt: -2210,
        },
        {
            name: 'Page C',
            uv: 2000,
            pv: 9800,
            amt: -2290,
        },
        {
            name: 'Page D',
            uv: 2780,
            pv: 3908,
            amt: -2000,
        },
        {
            name: 'Page E',
            uv: 1890,
            pv: 4800,
            amt: -2181,
        },
        {
            name: 'Page F',
            uv: 2390,
            pv: 3800,
            amt: -2500,
        },
        {
            name: 'Page G',
            uv: 3490,
            pv: 4300,
            amt: -2100,
        },
    ],
    series: {
        def: {
            title: 'Default',
            field: 'uv',
            color: 'blue',
            stack: 'base'
        },
        sec: {
            title: 'Secondary',
            field: 'pv',
            color: 'green',
            stack: 'base'
        },
        pri: {
            title: 'Primary',
            field: 'amt',
            color: 'red'
        }
    },
    labels: {
        css: ':scope{color: green;font-weight:bold;}'
    }
};

const BAR_PARAMS = barHandlers.getConfig(BARCHART_DATA);

const IDS = {
    pieBase: 'pie-base',
    pieWithRatio: 'pie-with-ratio',
    lineX: 'line-x',
    lineY: 'line-y',
    lineXStacked: 'line-x-stacked',
    lineYStacked: 'line-y-stacked',
    barX: 'bar-x',
    barY: 'bar-y'
}

describe('EffCharts:', () => {
    let handlers = {};
    beforeAll(() => {
        handlers = {};
        window.document.body.innerHTML = `
            <style>
                :root {
                    font-size: 10px;
                }
            </style>
            <div style="display:flex;flex-direction:column;gap: 10px;">
                <effcharts-pie data-testid="${IDS.pieBase}" inner="0.5" config="${PIECHART_DATA}" style="border:2px solid black;"></effcharts-pie>

                <effcharts-pie data-testid="${IDS.pieWithRatio}" ratio="16/9" inner="0.5" config="${PIECHART_DATA}" style="border:2px solid black;"></effcharts-pie>

                <effcharts-line data-testid="${IDS.lineX}" ratio="16/9" style="border:2px solid black;" config="${LINECHART_DATA}">
                </effcharts-line>

                <effcharts-line data-testid="${IDS.lineY}" ratio="9/16" axis="y" style="border:2px solid black;" config="${LINECHART_DATA}">
                </effcharts-line>

                <effcharts-line data-testid="${IDS.lineXStacked}" ratio="16/9" style="border:2px solid black;" config="${LINECHART_DATA_STACKED}">
                </effcharts-line>

                <effcharts-line data-testid="${IDS.lineYStacked}" ratio="9/16" axis="y" style="border:2px solid black;" config="${LINECHART_DATA_STACKED}">
                </effcharts-line>

                <effcharts-bar data-testid="${IDS.barX}" ratio="2" style="border:2px solid black;" config="${BAR_PARAMS}">
                </effcharts-bar>

                <effcharts-bar data-testid="${IDS.barY}" ratio="2" axis="y" style="border:2px solid black;" config="${BAR_PARAMS}">
                </effcharts-bar>
            </div>
        `;
    });

    describe('effcharts base:', () => {
        test(`screenshot ${IDS.pieBase}:`, async () => {
            await expect.element(page.getByTestId(IDS.pieBase)).toMatchScreenshot(IDS.pieBase, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });

        test(`screenshot ${IDS.pieWithRatio}:`, async () => {
            await expect.element(page.getByTestId(IDS.pieWithRatio)).toMatchScreenshot(IDS.pieWithRatio, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });

        test(`screenshot ${IDS.lineX}:`, async () => {
            await expect.element(page.getByTestId(IDS.lineX)).toMatchScreenshot(IDS.lineX, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });

        test(`screenshot ${IDS.lineY}:`, async () => {
            await expect.element(page.getByTestId(IDS.lineY)).toMatchScreenshot(IDS.lineY, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });

        test(`screenshot ${IDS.lineXStacked}:`, async () => {
            await expect.element(page.getByTestId(IDS.lineXStacked)).toMatchScreenshot(IDS.lineXStacked, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });

        test(`screenshot ${IDS.lineYStacked}:`, async () => {
            await expect.element(page.getByTestId(IDS.lineYStacked)).toMatchScreenshot(IDS.lineYStacked, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });

        test(`screenshot ${IDS.barX}:`, async () => {
            await expect.element(page.getByTestId(IDS.barX)).toMatchScreenshot(IDS.barX, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });

        test(`screenshot ${IDS.barY}:`, async () => {
            await expect.element(page.getByTestId(IDS.barY)).toMatchScreenshot(IDS.barY, {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                    allowedMismatchedPixelRatio: 0.01,
                },
            })
        });
    });
});
