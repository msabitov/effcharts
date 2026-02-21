<p align="center">
  <a href="https://effnd.tech/charts/">
    <img alt="effcharts" src="https://effnd.tech/charts/logo.svg" height="256px" />
  </a>
</p>

<h1 align="center">EffCharts</h1>

<div align="center">

[![license](https://badgen.net/static/license/Apache%202.0/blue)](https://gitverse.ru/msabitov/effcharts/content/master/LICENSE)
[![npm latest package](https://badgen.net/npm/v/effcharts)](https://www.npmjs.com/package/effcharts)
![install size](https://badgen.net/packagephobia/install/effcharts)

</div>

EffCharts is a self-confident 2D charts library based on Web Components

## Some features

-   lightweight
-   zero-dependency
-   framework agnostic

## Links

-   [Docs](https://effnd.tech/charts/)
-   [SourceCraft](https://sourcecraft.dev/msabitov/effcharts)
-   [GitHub](https://github.com/msabitov/effcharts)
-   [GitFlic](https://gitflic.ru/project/msabitov/effcharts)

## Installation

Type in your terminal:

```sh
# npm
npm i effcharts

# pnpm
pnpm add effcharts

# yarn
yarn add effcharts
```

## Quick start

In short each web component should be defined before use. Every module in this library provides such a function
-    `usePie` from `effcharts/pie` allows to use pie and donut charts;
-    `useLine` from `effcharts/line` allows to use line and area charts (that can be grouped into a single stack);
-    `useBar` from `effcharts/bar` allows to use bar charts (also stacked bar charts).

Each function returns object with `getConfig`, `observe` and `unobserve` handlers to control components behavior.

For example, you would like to use **Bar chart**:

```jsx
import { useState, useEffect } from 'react';
import { useBar } from 'effcharts/bar';

// define custom web component before use
// note, that for SSR you need to call it before browser parse document body
// so you might need to add separate definition script to the document head
const { observe, getConfig } = useBar();

export const App = () => {
    const ref = useRef();
    const [config, setConfig] = useState(getConfig({
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
        }
      ],
      series: {
        def: {
          title: 'Default',
          field: 'uv',
          color: 'blue'
        },
        sec: {
          title: 'Secondary',
          field: 'pv',
          color: 'green'
        }
      }
    }));
    useEffect(() => {
      // you can observe web component events
      const unobserve = observe((e) => {
        // event handler
      }, ref.current);
      // and you can unobserve
      return () => unobserve();
    }, []);
    // just use web component in jsx
    // all attributes are described in IBarChartAttrs interface
    return <div ref={ref}>
        <effcharts-bar config={config}>
        </effcharts-bar>
    </div>;
}
```

That's all. Enjoy simplicity.
