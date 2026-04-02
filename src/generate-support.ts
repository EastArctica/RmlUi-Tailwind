import fs from 'node:fs';
import path from 'node:path';
import {
    extractProperties,
    extractSelectors,
    extractShorthands,
    type RmluiSupportData,
} from './utils/rmlui-src.js';

const STYLE_SHEET_SPEC_PATH = 'Source/Core/StyleSheetSpecification.cpp';
const STYLE_SHEET_FACTORY_PATH = 'Source/Core/StyleSheetFactory.cpp';

export function generateSupportData(rmluiSourcePath: string): RmluiSupportData {
    const resolvedSourcePath = path.resolve(rmluiSourcePath);
    const specFilePath = path.join(resolvedSourcePath, STYLE_SHEET_SPEC_PATH);
    const factoryFilePath = path.join(resolvedSourcePath, STYLE_SHEET_FACTORY_PATH);

    if (!fs.existsSync(specFilePath)) {
        throw new Error(`Expected file does not exist: ${specFilePath}`);
    }

    if (!fs.existsSync(factoryFilePath)) {
        throw new Error(`Expected file does not exist: ${factoryFilePath}`);
    }

    const specContent = fs.readFileSync(specFilePath, 'utf-8');
    const factoryContent = fs.readFileSync(factoryFilePath, 'utf-8');

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        generatedFrom: {
            sourcePath: resolvedSourcePath,
        },
        properties: extractProperties(specContent),
        shorthands: extractShorthands(specContent),
        selectors: extractSelectors(factoryContent),
    };
}

export function writeSupportData(outputFilePath: string, supportData: RmluiSupportData) {
    const resolvedOutputPath = path.resolve(outputFilePath);
    fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
    fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(supportData, null, 2)}\n`);
}
