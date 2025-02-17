// tailwind.config.cjs
module.exports = {
    content: [
      './src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}',
    ],
    safelist: [
      'bg-yellow-200', // Ensure this class is not removed in production
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
  