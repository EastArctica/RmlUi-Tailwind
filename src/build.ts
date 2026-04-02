import fs from 'node:fs';
import path from 'node:path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssPresetEnv from 'postcss-preset-env';
import tailwindcss from 'tailwindcss';
import type { RmluiTailwindConfig } from './config.js';
import { writeTransformedCss } from './transform-css.js';

const DEFAULT_INPUT_CSS = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';

export async function buildRcss(config: RmluiTailwindConfig) {
    const inputCss = config.input ? fs.readFileSync(config.input, 'utf-8') : DEFAULT_INPUT_CSS;
    const from = config.input ?? path.join(process.cwd(), 'inline-tailwind.css');

    const tailwindConfig = {
        content: config.content,
        ...(config.tailwind ?? {}),
    };

    const result = await postcss([
        tailwindcss(tailwindConfig),
        postcssCustomProperties({ preserve: false }),
        postcssPresetEnv({ preserve: false, stage: 3 }),
        autoprefixer(),
    ]).process(inputCss, { from });

    return writeTransformedCss({
        css: result.css,
        outputFilePath: config.output,
        ...(config.support ? { supportFilePath: config.support } : {}),
    });
}
