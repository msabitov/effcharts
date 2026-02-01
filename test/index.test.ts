import { beforeAll, describe, test } from 'vitest';
import { usePie } from '../src/pie';
import { useLine } from '../src/line';
import { useBar } from '../src/bar';

const pieHandlers = usePie()
const lineHandlers = useLine();
const barHandlers = useBar()

const PIE_DATA = pieHandlers.getConfig({
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
    }
});

const LINE_DATA = lineHandlers.getConfig({
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

const BARCHART_PARAMS = {
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
    series: { // массив - это стек
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
    }
};

const BAR_PARAMS = barHandlers.getConfig(BARCHART_PARAMS);

describe('EffCharts:', () => {
    let handlers = {};
    beforeAll(() => {
        handlers = {};
        window.document.body.innerHTML = `
            <div>
                <effcharts-pie data-id="pie" inner="0.5" style="width: 200px;" config="${PIE_DATA}"></effcharts-pie>

                <effcharts-pie data-id="pie" ratio="16/9" inner="0.5" style="width: 200px;" config="${PIE_DATA}"></effcharts-pie>

                <effcharts-line ratio="16/9" style="width: 600px;border:2px solid red;" config="${LINE_DATA}">
                </effcharts-line>

                <effcharts-line ratio="9/16" axis="y" style="width: 600px;border:2px solid red;" config="${LINE_DATA}">
                </effcharts-line>

                <effcharts-bar ratio="2" style="width: 600px;border:2px solid cyan;" config="${BAR_PARAMS}">
                </effcharts-bar>

                <effcharts-bar ratio="2" axis="y" style="width: 600px;border:2px solid cyan;" config="${BAR_PARAMS}">
                </effcharts-bar>
            </div>
        `;
    });

    describe('effcharts base:', () => {
        test('fdir=c axis:', async () => {
            // TODO
        });
    });
});
