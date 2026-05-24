// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "hsl(210, 100%, 55%)",
        secondary: "hsl(210, 20%, 15%)",
        foreground: "hsl(210, 10%, 95%)",
        "muted-foreground": "hsl(210, 5%, 70%)",
        border: "hsl(210, 5%, 30%)"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))"
      }
    }
  },
  plugins: []
};
