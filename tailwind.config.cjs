/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../assets/ui/tw/**/*.rml',
  ],

  // Add anything that is generated dynamically and won't appear literally
  safelist: [
    { pattern: /.*/ },
  ],

  theme: {
    // Replace the default scales with smaller ones if you want fewer classes
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
    },
    borderRadius: {
      none: '0px',
      sm: '2px',
      DEFAULT: '4px',
      md: '6px',
      lg: '8px',
    },
    fontSize: {
      xs: '10px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '20px',
    },
    extend: {},
  },

  corePlugins: {
    preflight: false,

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

    // These plugins cause some errors, but I believe they also provide some useful classes, so I'm leaving
    // them enabled for now. Maybe we can disable them later if it causes issues.

    // animation-timing-function
    // animation: false,

    // inset-inline-start, inset-inline-end
    // inset: false,

    // margin-inline-start, margin-inline-end
    // margin: false,

    // padding-inline-start, padding-inline-end
    // padding: false,

    // text-decoration-line
    // textDecoration: false,

    // These ones don't seem to have any matching tw plugin

    // border-inline-start-color, border-inline-end-color
    // border-inline-start-width, border-inline-end-width
    // border-start-start-radius, border-start-end-radius, border-end-start-radius, border-end-end-radius
    // border-style

    // overflow-wrap
  },
}
