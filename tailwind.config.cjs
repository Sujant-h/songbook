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
    safelist: [
      'bg-green-100',
      'text-green-800',
      'dark:bg-green-900',
      'dark:text-green-200',
      'bg-blue-100',
      'text-blue-800',
      'dark:bg-blue-900',
      'dark:text-blue-200'
    ]
  };
  