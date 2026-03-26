// Transforms a .css file to convert it for RMLUI compatibility.
// Usage: `pnpm tsx src/transform-css-for-rmlui.ts path/to/input.css path/to/output.css`

/*
Notes:
 - RML acts like pseudo-elements and pseudo-classes are identical and parses them as such.
*/

import fs from 'fs';
import path from 'path';
import * as csstree from 'css-tree';
import { extractProperties, extractSelectors, extractShorthands } from './utils/rmlui-src.js';
import { fileURLToPath } from 'url';

const RMLUI_SRC_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../ui/RmlUi/repo');
const STYLE_SHEET_SPEC_PATH = 'Source/Core/StyleSheetSpecification.cpp';
const STYLE_SHEET_FACTORY_PATH = 'Source/Core/StyleSheetFactory.cpp';

async function getRmluiSupport() {
    const specContent = fs.readFileSync(path.join(RMLUI_SRC_PATH, STYLE_SHEET_SPEC_PATH), 'utf-8');
    const properties = extractProperties(specContent);
    const shorthands = extractShorthands(specContent);

    const factoryContent = fs.readFileSync(path.join(RMLUI_SRC_PATH, STYLE_SHEET_FACTORY_PATH), 'utf-8');
    const selectors = extractSelectors(factoryContent);
    
    return { properties, shorthands, selectors };
}

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

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Please provide a path to a .css file to transform.');
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const ast = csstree.parse(content, { });
    const { properties, shorthands, selectors } = await getRmluiSupport();

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
            // TODO: For now we just ignore tailwind variables being set, I'm unsure what rmlui's support for css "var" is
            if (propertyName.startsWith('--tw-')) {
                return;
            }

            if (!properties.find(prop => prop.name === propertyName) &&
                !shorthands.find(sh => sh.name === propertyName))
            {
                unsupportedStyles.set(propertyName, (unsupportedStyles.get(propertyName) || []).concat(propertyName));
            }
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

                        if (!selectors.find(sel => sel.selector === pseudoElement)) {
                            unsupportedPseudos.set(pseudoElement, (unsupportedPseudos.get(pseudoElement) || []).concat(pseudoElement));
                            return;
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

    // Write the transformed CSS to the output file
    const outputFilePath = process.argv[3];
    if (outputFilePath) {
        let outputCss = csstree.generate(ast);
        // idk errors
        // outputCss = await prettier.format(outputCss, { parser: 'css' });
        
        fs.writeFileSync(outputFilePath, outputCss);
    }


    if (unsupportedStyles.size > 0) {
        console.error('Unsupported RMLUI styles found:');
        unsupportedStyles.forEach((count, style) => {
            console.error(`- ${style} (${count.length})`);
        });
    }
    if (unsupportedPseudos.size > 0) {
        console.error('Unsupported RMLUI pseudo-classes/elements found:');
        unsupportedPseudos.forEach((count, pseudo) => {
            console.error(`- ${pseudo} (${count.length})`);
        });
    }
}

main().catch(console.error);