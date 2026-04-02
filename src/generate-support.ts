import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
    extractProperties,
    extractSelectors,
    extractShorthands,
    type RmluiSupportData,
} from './utils/rmlui-src.js';

const STYLE_SHEET_SPEC_PATH = 'Source/Core/StyleSheetSpecification.cpp';
const STYLE_SHEET_FACTORY_PATH = 'Source/Core/StyleSheetFactory.cpp';

function tryExecGit(args: string[], cwd: string) {
    try {
        return execFileSync('git', args, {
            cwd,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
    } catch {
        return null;
    }
}

function hashFile(filePath: string) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

function getGitProvenance(sourcePath: string) {
    const repoRoot = tryExecGit(['rev-parse', '--show-toplevel'], sourcePath);
    if (!repoRoot) {
        return {
            remoteUrl: null,
            commit: null,
            dirty: null,
        };
    }

    const status = tryExecGit(['status', '--porcelain'], repoRoot);

    return {
        remoteUrl: tryExecGit(['remote', 'get-url', 'origin'], repoRoot),
        commit: tryExecGit(['rev-parse', 'HEAD'], repoRoot),
        dirty: status !== null ? status.length > 0 : null,
    };
}

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
            git: getGitProvenance(resolvedSourcePath),
            files: [
                {
                    path: STYLE_SHEET_SPEC_PATH,
                    sha256: hashFile(specFilePath),
                },
                {
                    path: STYLE_SHEET_FACTORY_PATH,
                    sha256: hashFile(factoryFilePath),
                },
            ],
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
