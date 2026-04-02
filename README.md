# rmlui-tailwind

Generate RmlUi-compatible RCSS from Tailwind utility classes.

## Usage

Build from a config file:

```bash
pnpx rmlui-tailwind@latest build --config ./rmlui-tailwind.config.mjs
```

Build directly from CLI flags:

```bash
pnpx rmlui-tailwind@latest build \
  --content "./assets/ui/**/*.rml" \
  --out ./assets/ui/tailwind.rcss
```

Transform an existing CSS file:

```bash
pnpx rmlui-tailwind@latest transform \
  -i ./tailwind.generated.css \
  -o ./assets/ui/tailwind.rcss
```

Show CLI help:

```bash
pnpx rmlui-tailwind@latest --help
```

The `build` command uses an inline Tailwind input stylesheet by default:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Provide `input` in your config or `--input` on the CLI if you need a custom source stylesheet.

Option aliases:

- `--config`, `-c`
- `--input`, `--in`, `-i`
- `--output`, `--out`, `-o`

## Config

Example `rmlui-tailwind.config.mjs`:

```js
export default {
  content: ['./assets/ui/**/*.rml'],
  output: './assets/ui/tailwind.rcss',
  tailwind: {
    theme: {
      extend: {}
    }
  }
}
```

Supported config fields:

```js
export default {
  content: ['./assets/ui/**/*.rml'],
  output: './assets/ui/tailwind.rcss',
  input: './tailwind.css',
  support: './tools/data/rmlui-support.json',
  tailwind: {
    theme: {},
    corePlugins: {},
    safelist: []
  }
}
```

## Updating Support Data

The package ships with a generated `data/rmlui-support.json` file describing supported RmlUi properties, shorthands, and selectors.

To regenerate it against a local RmlUi checkout:

```bash
pnpm exec tsx src/cli.ts generate-support \
  --rmlui-source /path/to/RmlUi \
  -o data/rmlui-support.json
```

This is intended as maintainer workflow, not something consumers need during normal builds.
