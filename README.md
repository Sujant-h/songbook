# Tamil Christian Songs Website

A modern, accessible Progressive Web App (PWA) for browsing and searching Tamil Christian songs with translations in English and German.

![Tamil Christian Songs Website](https://songs.c-g-m.eu/og-image.jpg)

## 🌟 Features

- **Multilingual Support**: Browse songs in Tamil, English, and German
- **Advanced Search**: Search by title or lyrics in any supported language
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices
- **Dark Mode**: Toggle between light and dark themes for comfortable reading
- **Audio Integration**: Listen to song recordings where available
- **Accessibility**: Built with keyboard navigation and screen reader support
- **Progressive Web App**: Install on your device and use offline
- **Optimized Performance**: Fast loading with caching strategies
- **SEO Ready**: Structured data and social media meta tags

## 🚀 Project Structure

```text
/
├── public/
│   └── audio/         # Song audio files
├── src/
│   ├── assets/        # Static assets (images, fonts)
│   ├── components/    # Reusable UI components
│   ├── data/          # Song data files
│   ├── layouts/       # Page layout templates
│   ├── pages/         # Page components and routes
│   │   └── songs/     # Song detail pages
│   │       └── [lang] # Dynamic language-based routes
│   └── styles/        # Global and component styles
└── package.json
```

## 💻 Technologies

- [Astro](https://astro.build/) - Fast, lightweight web framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Progressive Web App (PWA)](https://web.dev/progressive-web-apps/) - For offline access and mobile installation
- [Material Icons](https://fonts.google.com/icons) - For UI elements
- [Noto Sans Tamil](https://fonts.google.com/noto/specimen/Noto+Sans+Tamil) - Font with excellent Tamil script support

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🌐 Deployment

The site is deployed and can be accessed at [https://songs.c-g-m.eu/](https://songs.c-g-m.eu/).

### PWA Configuration

This project is configured as a Progressive Web App, allowing users to install it on their devices and access content offline. The PWA configuration includes:

- Custom app icons for various device sizes
- Offline caching strategy for improved performance
- Background color and theme color settings
- "Add to Home Screen" functionality

## 🔍 Usage

### Searching for Songs

1. Select your preferred language from the dropdown
2. Type keywords in the search box to find songs by title or lyrics
3. Click on a song to view its full details, including translations

### Switching Themes

Click the theme toggle button in the footer to switch between light and dark modes.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgements

- All song contributors and translators
- [Tailwind CSS](https://tailwindcss.com)
- [Astro](https://astro.build)
- [Noto Sans Tamil](https://fonts.google.com/noto/specimen/Noto+Sans+Tamil) by Google Fonts
- [Material Icons](https://fonts.google.com/icons) by Google
- [@vite-pwa/astro](https://vite-pwa-org.netlify.app/frameworks/astro.html) for PWA integration

---

© 2025 Tamil Christian Songs | All Rights Reserved