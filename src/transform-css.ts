// Transforms CSS to convert it for RmlUi compatibility.

/*
Notes:
  - RML acts like pseudo-elements and pseudo-classes are identical and parses them as such.
*/

import fs from 'node:fs';
import path from 'node:path';
import * as csstree from 'css-tree';
import { loadSupportData } from './utils/rmlui-src.js';

const SCRIPT_DIR = __dirname;
const DEFAULT_SUPPORT_FILE_PATH = path.resolve(SCRIPT_DIR, '../data/rmlui-support.json');

export type TransformResult = {
    css: string;
    unsupportedStyles: Map<string, string[]>;
    unsupportedPseudos: Map<string, string[]>;
    unsupportedAtRules: Map<string, number>;
};

type TransformCssOptions = {
    css: string;
    supportFilePath?: string;
};

type WriteTransformedCssOptions = {
    css?: string;
    cssFilePath?: string;
    outputFilePath: string;
    supportFilePath?: string;
};

function isVendorPrefixedName(name: string) {
  return /^(?:-webkit-|-moz-|-ms-|-o-)/.test(name);
}

function isVendorPrefixedDeclaration(node: csstree.Declaration) {
    if (isVendorPrefixedName(node.property)) {
        return true;
    }

    if (node.value.type === 'Value') {
        let children = node.value.children.toJSON();
        if (children.length === 1) {
            if (children[0]?.type === 'Identifier') {
                if (isVendorPrefixedName(children[0].name)) {
                    return true;
                }
            }
        }
    } else if (node.value.type === 'Raw') {
        if (isVendorPrefixedName(node.value.value.trim())) {
            return true;
        }
    }

    return false;
}

function hasUnsupportedFunction(node: csstree.Declaration, functionNames: Set<string>) {
    let unsupported = false;

    csstree.walk(node.value, {
        visit: 'Function',
        enter(fn) {
            if (functionNames.has(fn.name)) {
                unsupported = true;
            }
        }
    });

    return unsupported;
}

export function transformCss({ css, supportFilePath = DEFAULT_SUPPORT_FILE_PATH }: TransformCssOptions): TransformResult {
    const ast = csstree.parse(css, { });
    const { properties, shorthands, selectors } = loadSupportData(supportFilePath);
    const supportedPropertyNames = new Set(properties.map(prop => prop.name));
    const supportedShorthandNames = new Set(shorthands.map(sh => sh.name));
    const supportedSelectors = new Set(selectors.map(sel => sel.selector));
    const unsupportedFunctionNames = new Set(['var']);

    const unsupportedStyles = new Map<string, string[]>();
    csstree.walk(ast, {
        visit: 'Declaration',
        reverse: true,
        enter(node, item, list) {
            if (!list) return;

            if (isVendorPrefixedDeclaration(node)) {
                list.remove(item);
                return;
            }

            const propertyName = node.property;
            // TODO: Currently all custom properties are stripped since RMLUI does not support them, but we
            // may want to keep them in the future if we add support for custom properties in RMLUI.
            if (propertyName.startsWith('--')) {
                list.remove(item);
                return;
            }

            if (hasUnsupportedFunction(node, unsupportedFunctionNames)) {
                unsupportedStyles.set(propertyName, (unsupportedStyles.get(propertyName) || []).concat('var(...)'));
                list.remove(item);
                return;
            }

            if (!supportedPropertyNames.has(propertyName) && !supportedShorthandNames.has(propertyName)) {
                unsupportedStyles.set(propertyName, (unsupportedStyles.get(propertyName) || []).concat(propertyName));
                list.remove(item);
            }
        }
    });

    const unsupportedAtRules = new Map<string, number>();
    csstree.walk(ast, {
        visit: 'Atrule',
        reverse: true,
        enter(node, item, list) {
            if (!list) return;
            unsupportedAtRules.set(node.name, (unsupportedAtRules.get(node.name) || 0) + 1);
            list.remove(item);
        }
    });

    const unsupportedPseudos = new Map<string, string[]>();
    csstree.walk(ast, {
        visit: 'Rule',
        reverse: true,
        enter(rule, ruleItem, ruleList) {
            if (!rule.prelude || rule.prelude.type !== 'SelectorList') return;

            rule.prelude.children.forEach((selectorNode, selectorItem) => {
                let removeSelector = false;

                csstree.walk(selectorNode, {
                    enter(node: csstree.CssNode) {
                        if (
                            node.type !== 'PseudoElementSelector' &&
                            node.type !== 'PseudoClassSelector'
                        ) {
                            return;
                        }

                        const pseudoElement = node.name;
                        if (isVendorPrefixedName(pseudoElement)) {
                            removeSelector = true;
                            return;
                        }

                        if (!supportedSelectors.has(pseudoElement)) {
                            unsupportedPseudos.set(pseudoElement, (unsupportedPseudos.get(pseudoElement) || []).concat(pseudoElement));
                            removeSelector = true;
                        }
                    }
                });

                if (rule.prelude.type === 'SelectorList' && removeSelector) {
                    rule.prelude.children.remove(selectorItem);
                }
            });

            if (rule.prelude.children.size === 0 && ruleList) {
                ruleList.remove(ruleItem);
            }
        }
    });

    csstree.walk(ast, {
        visit: 'Rule',
        reverse: true,
        enter(rule, ruleItem, ruleList) {
            if (!ruleList || !rule.block || rule.block.children.size > 0) {
                return;
            }

            ruleList.remove(ruleItem);
        }
    });

    let outputCss = csstree.generate(ast);

    // RmlUi's CSS parser does not support CSS Color Level 4 space-separated
    // rgb() syntax: rgb(r g b / a). Convert to legacy rgba(r, g, b, a).
    outputCss = outputCss.replace(
        /rgb\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)/g,
        (_match, r, g, b, a) => {
            const alpha = parseFloat(a);
            if (Math.abs(alpha - 1) < 0.001) {
                const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
                return `#${hex(parseFloat(r))}${hex(parseFloat(g))}${hex(parseFloat(b))}`;
            }
            return `rgba(${Math.round(parseFloat(r))},${Math.round(parseFloat(g))},${Math.round(parseFloat(b))},${alpha})`;
        }
    );

    const header = [
        '/* !! AUTO-GENERATED - DO NOT EDIT !!',
        ' * This file is generated by rmlui-tailwind.',
        ' * Any changes made here will be overwritten by the next build.',
        ' */',
    ].join('\n');

    return {
        css: header + '\n' + outputCss,
        unsupportedStyles,
        unsupportedPseudos,
        unsupportedAtRules,
    };
}

export function writeTransformedCss({ css, cssFilePath, outputFilePath, supportFilePath }: WriteTransformedCssOptions) {
    const sourceCss = css ?? (cssFilePath ? fs.readFileSync(cssFilePath, 'utf-8') : undefined);
    if (typeof sourceCss !== 'string') {
        throw new Error('Expected css or cssFilePath.');
    }

    const result = transformCss({
        css: sourceCss,
        ...(supportFilePath ? { supportFilePath } : {}),
    });
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, result.css);
    return result;
}
