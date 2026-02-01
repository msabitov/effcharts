import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from './package.json' with { type: 'json' };

const banner = `/*
* EffCharts v${json.version}
* {@link ${json.repository.url}}
* Copyright (c) Marat Sabitov
* @license ${json.license}
*/`;

const output =  {
    dir: 'dist',
    banner,
    format: 'es',
    plugins: [
        terser(),
    ]
};
const tsPlugin = typescript({
    tsconfig: 'tsconfig.json'
});
const plugins = [
    tsPlugin
];

const inputs = [
    'bar', 'line', 'pie'
];

export default inputs.map((name) => ({
    input: {
        [name]: `src/${name}.ts`
    },
    output,
    plugins
}));
