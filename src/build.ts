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

const DEFAULT_CORE_PLUGINS = {
    preflight: false,
    container: false,
    accentColor: false,
    appearance: false,
    scrollBehavior: false,
    scrollMargin: false,
    scrollPadding: false,
    scrollSnapAlign: false,
    scrollSnapStop: false,
    scrollSnapType: false,
    touchAction: false,
    willChange: false,
    gridTemplateRows: false,
    gridTemplateColumns: false,
    gridAutoRows: false,
    gridAutoFlow: false,
    gridAutoColumns: false,
    gridRow: false,
    gridRowStart: false,
    gridRowEnd: false,
    gridColumn: false,
    gridColumnStart: false,
    gridColumnEnd: false,
    outlineColor: false,
    outlineOffset: false,
    outlineWidth: false,
    outlineStyle: false,
    borderSpacing: false,
    borderCollapse: false,
    mixBlendMode: false,
    backgroundBlendMode: false,
    textUnderlineOffset: false,
    textDecorationColor: false,
    textDecorationStyle: false,
    textDecorationThickness: false,
    textIndent: false,
    textWrap: false,
    backgroundOrigin: false,
    backgroundRepeat: false,
    backgroundPosition: false,
    backgroundClip: false,
    backgroundAttachment: false,
    backgroundSize: false,
    backgroundImage: false,
    overscrollBehavior: false,
    justifySelf: false,
    justifyItems: false,
    placeSelf: false,
    placeItems: false,
    placeContent: false,
    fill: false,
    stroke: false,
    strokeWidth: false,
    objectFit: false,
    objectPosition: false,
    order: false,
    isolation: false,
    tableLayout: false,
    captionSide: false,
    userSelect: false,
    resize: false,
    listStyleImage: false,
    listStylePosition: false,
    listStyleType: false,
    columns: false,
    breakBefore: false,
    breakAfter: false,
    breakInside: false,
    transitionTimingFunction: false,
    transitionDuration: false,
    transitionDelay: false,
    transitionProperty: false,
    forcedColorAdjust: false,
    content: false,
    contain: false,
    fontVariantNumeric: false,
    fontFeatureSettings: false,
    boxDecorationBreak: false,
    hyphens: false,
    aspectRatio: false,
} as const;

export async function buildRcss(config: RmluiTailwindConfig) {
    const inputCss = config.input ? fs.readFileSync(config.input, 'utf-8') : DEFAULT_INPUT_CSS;
    const from = config.input ?? path.join(process.cwd(), 'inline-tailwind.css');
    const tailwindConfig = config.tailwind ?? {};

    const mergedTailwindConfig = {
        content: config.content,
        ...tailwindConfig,
        corePlugins: {
            ...DEFAULT_CORE_PLUGINS,
            ...(typeof tailwindConfig.corePlugins === 'object' && tailwindConfig.corePlugins !== null
                ? tailwindConfig.corePlugins
                : {}),
        },
    };

    const result = await postcss([
        tailwindcss(mergedTailwindConfig),
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
