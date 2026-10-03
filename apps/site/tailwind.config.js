/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/widgets/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/entities/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#086b64",
        blue: {50:'#edf7f3',100:'#dcefe7',200:'#b9dfcf',300:'#89c5b3',400:'#4da48f',500:'#267e70',600:'#086b64',700:'#09574f',800:'#11493f',900:'#163e36'},
        secondary: "#1e293b",
      },
    },
  },
  plugins: [],
};
