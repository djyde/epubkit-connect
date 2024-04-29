/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "popup.tsx"
  ],
  daisyui: {
    themes: [
      'lofi'
    ]
  },
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui")
  ],
}

