#!/usr/bin/env node

import path from 'node:path';
import { buildRcss } from './build.js';
import { loadConfig, type RmluiTailwindConfig } from './config.js';
import { generateSupportData, writeSupportData } from './generate-support.js';
import { writeTransformedCss } from './transform-css.js';

type ParsedArgs = {
    command: string;
    options: Map<string, string[]>;
};

function parseArgs(argv: string[]): ParsedArgs {
    const args = [...argv];
    const first = args[0];
    const command = first && !first.startsWith('--') ? args.shift() ?? 'build' : 'build';
    const options = new Map<string, string[]>();

    for (let index = 0; index < args.length; index += 1) {
        const token = args[index];
        if (!token?.startsWith('--')) {
            throw new Error(`Unexpected argument: ${token}`);
        }

        const value = args[index + 1];
        if (!value || value.startsWith('--')) {
            throw new Error(`Missing value for argument: ${token}`);
        }

        const key = token.slice(2);
        const current = options.get(key) ?? [];
        current.push(value);
        options.set(key, current);
        index += 1;
    }

    return { command, options };
}

function getOption(parsedArgs: ParsedArgs, name: string) {
    return parsedArgs.options.get(name)?.at(-1);
}

function getRequiredOption(parsedArgs: ParsedArgs, name: string) {
    const value = getOption(parsedArgs, name);
    if (!value) {
        throw new Error(`Missing required argument: --${name}`);
    }

    return value;
}

function getMultiOption(parsedArgs: ParsedArgs, name: string) {
    return parsedArgs.options.get(name) ?? [];
}

async function resolveBuildConfig(parsedArgs: ParsedArgs): Promise<RmluiTailwindConfig> {
    const configPath = getOption(parsedArgs, 'config');
    const fileConfig = configPath ? await loadConfig(configPath) : undefined;

    const content = getMultiOption(parsedArgs, 'content');
    const output = getOption(parsedArgs, 'output');
    const input = getOption(parsedArgs, 'input');
    const support = getOption(parsedArgs, 'support');

    const merged: RmluiTailwindConfig = {
        content: content.length > 0
            ? content.map((entry) => path.resolve(entry))
            : (fileConfig?.content ?? []),
        output: output ? path.resolve(output) : (fileConfig?.output ?? ''),
        ...((input ? path.resolve(input) : fileConfig?.input) ? { input: input ? path.resolve(input) : fileConfig?.input! } : {}),
        ...((support ? path.resolve(support) : fileConfig?.support) ? { support: support ? path.resolve(support) : fileConfig?.support! } : {}),
        ...(fileConfig?.tailwind ? { tailwind: fileConfig.tailwind } : {}),
    };

    if (merged.content.length === 0) {
        throw new Error('Missing content globs. Provide --content or --config.');
    }

    if (!merged.output) {
        throw new Error('Missing output path. Provide --output or --config.');
    }

    return merged;
}

function printWarnings(result: { unsupportedStyles: Map<string, string[]>; unsupportedPseudos: Map<string, string[]>; unsupportedAtRules: Map<string, number>; }) {
    if (result.unsupportedStyles.size > 0) {
        console.error('Unsupported RMLUI styles found:');
        result.unsupportedStyles.forEach((count, style) => {
            console.error(`- ${style} (${count.length})`);
        });
    }

    if (result.unsupportedPseudos.size > 0) {
        console.error('Unsupported RMLUI pseudo-classes/elements found:');
        result.unsupportedPseudos.forEach((count, pseudo) => {
            console.error(`- ${pseudo} (${count.length})`);
        });
    }

    if (result.unsupportedAtRules.size > 0) {
        console.error('Unsupported RMLUI at-rules removed:');
        result.unsupportedAtRules.forEach((count, ruleName) => {
            console.error(`- @${ruleName} (${count})`);
        });
    }
}

async function main() {
    const parsedArgs = parseArgs(process.argv.slice(2));

    switch (parsedArgs.command) {
        case 'build': {
            const result = await buildRcss(await resolveBuildConfig(parsedArgs));
            printWarnings(result);
            return;
        }
        case 'transform': {
            const supportFilePath = getOption(parsedArgs, 'support');
            const result = writeTransformedCss({
                cssFilePath: path.resolve(getRequiredOption(parsedArgs, 'in')),
                outputFilePath: path.resolve(getRequiredOption(parsedArgs, 'out')),
                ...(supportFilePath ? { supportFilePath: path.resolve(supportFilePath) } : {}),
            });
            printWarnings(result);
            return;
        }
        case 'generate-support': {
            const supportData = generateSupportData(getRequiredOption(parsedArgs, 'rmlui-source'));
            writeSupportData(getRequiredOption(parsedArgs, 'out'), supportData);
            return;
        }
        default:
            throw new Error(`Unknown command: ${parsedArgs.command}`);
    }
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(message);
    process.exit(1);
});
