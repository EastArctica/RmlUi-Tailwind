module.exports = {
  plugins: [
    require('tailwindcss'),
    require('postcss-custom-properties')({
      preserve: false,
    }),
    require('postcss-preset-env')({
      preserve: false,
      stage: 3,
    }),
    require('autoprefixer'),
  ],
}
