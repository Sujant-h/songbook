// tailwind.config.cjs
module.exports = {
    content: [
      './src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}',
    ],
    theme: {
      extend: {
        fontFamily: {
          tamil: ["'Noto Sans Tamil'", "sans-serif"], // Add Tamil font
        },
      },
    },
    plugins: [],
  };
  