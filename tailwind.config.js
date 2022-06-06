module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/ui/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        main: "#fffffe",
        headline: "#272343",
        paragraph: "#2d334a",
        highlight: "#ffd803",
        secondary: "#e3f6f5",
        tertiary: "#bae8e8",
      },
    },
  },
  plugins: [],
};
