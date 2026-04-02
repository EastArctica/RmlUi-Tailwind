import path from 'node:path';
import { pathToFileURL } from 'node:url';

export type RmluiTailwindConfig = {
    content: string[];
    output: string;
    input?: string;
    support?: string;
    tailwind?: Record<string, unknown>;
};

export async function loadConfig(configPath: string) {
    const resolvedConfigPath = path.resolve(configPath);
    const configDir = path.dirname(resolvedConfigPath);
    const imported = await import(pathToFileURL(resolvedConfigPath).href);
    const rawConfig = (imported.default ?? imported) as RmluiTailwindConfig;

    if (!rawConfig || !Array.isArray(rawConfig.content) || typeof rawConfig.output !== 'string') {
        throw new Error(`Invalid config file: ${resolvedConfigPath}`);
    }

    const resolvedConfig: RmluiTailwindConfig = {
        content: rawConfig.content.map((entry) => path.resolve(configDir, entry)),
        output: path.resolve(configDir, rawConfig.output),
        ...(rawConfig.input ? { input: path.resolve(configDir, rawConfig.input) } : {}),
        ...(rawConfig.support ? { support: path.resolve(configDir, rawConfig.support) } : {}),
        ...(rawConfig.tailwind ? { tailwind: rawConfig.tailwind } : {}),
    };

    return resolvedConfig;
}
