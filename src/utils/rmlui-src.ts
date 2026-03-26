// Utility functions for working with RMLUI source code

export type Property = {
    id: string;
    name: string;
    defaultValue: string;
    inherited: boolean;
    forces_layout: boolean;
};

// RegisterProperty(PropertyId::PaddingTop, "padding-top", "0px", false, true)
const REGISTER_PROPERTY_REGEX = /RegisterProperty\(\s*PropertyId::(\w+),\s*"([^"]+)",\s*"([^"]*)",\s*(true|false),\s*(true|false)\)/gm;
export function extractProperties(content: string) {
    const properties: Property[] = [];
    let match;
    while ((match = REGISTER_PROPERTY_REGEX.exec(content)) !== null) {
        const [_, id, name, defaultValue, inherited, forces_layout] = match;
        const rawProperty = { id, name, defaultValue, inherited, forces_layout };
        if (typeof rawProperty.id !== 'string') {
            console.warn(`Skipping property with invalid ID: ${JSON.stringify(rawProperty)}`);
            continue;
        } else if (typeof rawProperty.name !== 'string') {
            console.warn(`Skipping property with invalid name: ${JSON.stringify(rawProperty)}`);
            continue;
        } else if (typeof rawProperty.defaultValue !== 'string') {
            console.warn(`Skipping property with invalid default value: ${JSON.stringify(rawProperty)}`);
            continue;
        } else if (rawProperty.inherited !== 'true' && rawProperty.inherited !== 'false') {
            console.warn(`Skipping property with invalid inherited value: ${JSON.stringify(rawProperty)}`);
            continue;
        } else if (rawProperty.forces_layout !== 'true' && rawProperty.forces_layout !== 'false') {
            console.warn(`Skipping property with invalid forces_layout value: ${JSON.stringify(rawProperty)}`);
            continue;
        }

        properties.push({
            id: rawProperty.id,
            name: rawProperty.name,
            defaultValue: rawProperty.defaultValue,
            inherited: rawProperty.inherited === 'true',
            forces_layout: rawProperty.forces_layout === 'true'
        });
    }

    return properties;
}


export type Shorthand = {
    id: string;
    name: string;
    components: string[];
    type: string;
};

// RegisterShorthand(ShorthandId::Flex, "flex", "flex-grow, flex-shrink, flex-basis", ShorthandType::Flex);
const REGISTER_SHORTHAND_REGEX = /RegisterShorthand\(\s*ShorthandId::(\w+),\s*"([^"]+)",\s*"([^"]*)",\s*ShorthandType::(\w+)\s*\)/gm;
export function extractShorthands(content: string) {
    const shorthands: Shorthand[] = [];
    let match;
    while ((match = REGISTER_SHORTHAND_REGEX.exec(content)) !== null) {
        const [_, id, name, componentsStr, type] = match;
        const rawShorthand = { id, name, componentsStr, type };
        if (typeof rawShorthand.id !== 'string') {
            console.warn(`Skipping shorthand with invalid ID: ${JSON.stringify(rawShorthand)}`);
            continue;
        } else if (typeof rawShorthand.name !== 'string') {
            console.warn(`Skipping shorthand with invalid name: ${JSON.stringify(rawShorthand)}`);
            continue;
        } else if (typeof rawShorthand.componentsStr !== 'string') {
            console.warn(`Skipping shorthand with invalid components string: ${JSON.stringify(rawShorthand)}`);
            continue;
        } else if (typeof rawShorthand.type !== 'string') {
            console.warn(`Skipping shorthand with invalid type: ${JSON.stringify(rawShorthand)}`);
            continue;
        }

        const components = rawShorthand.componentsStr.split(',').map(s => s.trim());
        shorthands.push({
            id: rawShorthand.id,
            name: rawShorthand.name,
            components,
            type: rawShorthand.type
        });
    }
    return shorthands;
}

export type Selector = {
    id: string;
    selector: string;
};

// {"nth-child", StructuralSelectorType::Nth_Child},
const SELECTOR_REGEX = /{\s*"([^"]+)"\s*,\s*StructuralSelectorType::(\w+)\s*}/gm;
// Additional selectors that are not registered in the factory but are still supported by RMLUI, these ids are made up btw
const ADDITIONAL_SELECTORS: Selector[] = [
    // "Unlike CSS, this pseudo-class propagates backward through its parents."
    { id: 'Hover', selector: 'hover' },
    // "Unlike CSS, this pseudo-class propagates backward through its parents."
    { id: 'Active', selector: 'active' },
    // "Unlike CSS, this pseudo-class propagates backward through its parents."
    { id: 'Focus', selector: 'focus' },
    // "Unlike CSS, this pseudo-class propagates backward through its parents."
    { id: 'FocusVisible', selector: 'focus-visible' },
    { id: 'Checked', selector: 'checked' },
    // I'm not certain the functionality of this, it appears to only be present for inputs?
    { id: 'Placeholder', selector: 'placeholder' },
];
export function extractSelectors(content: string) {
    const selectors: Selector[] = [ ...ADDITIONAL_SELECTORS ];
    let match;
    while ((match = SELECTOR_REGEX.exec(content)) !== null) {
        const [_, selector, id] = match;
        const rawSelector = { id, selector };
        if (typeof rawSelector.id !== 'string') {
            console.warn(`Skipping selector with invalid ID: ${JSON.stringify(rawSelector)}`);
            continue;
        } else if (typeof rawSelector.selector !== 'string') {
            console.warn(`Skipping selector with invalid selector: ${JSON.stringify(rawSelector)}`);
            continue;
        }

        selectors.push({
            id: rawSelector.id,
            selector: rawSelector.selector
        });
    }
    return selectors;
}

/*
const styleSheetSpecFilePath = path.join(RMLUI_SRC_PATH, STYLE_SHEET_SPEC_PATH);
const styleSheetSpecContent = readFileSync(styleSheetSpecFilePath, 'utf-8');
const properties = extractProperties(styleSheetSpecContent);
console.log(`Extracted ${properties.length} Properties:`);
properties.forEach(prop => {
    console.log(`- ${prop.name} (ID: ${prop.id}, Default: "${prop.defaultValue}", Inherited: ${prop.inherited}, Forces Layout: ${prop.forces_layout})`);
});

const shorthands = extractShorthands(styleSheetSpecContent);
console.log(`\nExtracted ${shorthands.length} Shorthands:`);
shorthands.forEach(shorthand => {
    console.log(`- ${shorthand.name} (ID: ${shorthand.id}, Type: ${shorthand.type}, Components: [${shorthand.components.join(', ')}])`);
});
*/
