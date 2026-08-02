/** @type {import('tailwindcss').Config} */

export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  
	theme: {
	  extend: {
		colors: {
		  base: {
			white: "#FFFFFF",
			black: "#000000",
		  },
  
		  green: {
			50: "#EAF2EB",
			100: "#BED7BF",
			200: "#9FC3A1",
			300: "#73A876",
			400: "#58975B",
			500: "#2E7D32",
			600: "#2A722E",
			700: "#215924",
			800: "#19451C",
			900: "#133515",
		  },
  
		  yellow: {
			50: "#FEF9E8",
			100: "#FDEDB8",
			200: "#FCE496",
			300: "#FAD766",
			400: "#F9D048",
			500: "#F8C41A",
			600: "#E2B218",
			700: "#B08B12",
			800: "#886C0E",
			900: "#68520B",
		  },
  
		  text: {
			50: "#E9E9E9",
			100: "#BAB9BA",
			200: "#989898",
			300: "#69686A",
			400: "#4C4B4D",
			500: "#1F1E20",
			600: "#1C1B1D",
			700: "#161517",
			800: "#111112",
			900: "#0D0D0D",
		  },
  
		  background: {
			secondary: "#F7F7F7",
		  },

		  status: {
			success: "#2E7D32",
			warning: "#F8C41A",
			error: "#D32F2F",
			info: "#1976D2",
		  },
		},

		fontFamily: {
		  poppins: ["Poppins", "sans-serif"],
		},
  
		fontSize: {
		  h1: ["56px", { lineHeight: "130%" }],
		  h2: ["52px", { lineHeight: "130%" }],
		  h3: ["48px", { lineHeight: "130%" }],
		  h4: ["40px", { lineHeight: "130%" }],
		  h5: ["36px", { lineHeight: "130%" }],
		  h6: ["32px", { lineHeight: "130%" }],
  
		  body: ["28px", { lineHeight: "130%" }],
		  body1: ["26px", { lineHeight: "130%" }],
		  body2: ["24px", { lineHeight: "130%" }],
  
		  title: ["20px", { lineHeight: "130%" }],
		  smtitle: ["18px", { lineHeight: "130%" }],
  
		  caption: ["16px", { lineHeight: "150%" }],
		  label: ["14px", { lineHeight: "150%" }],
		},

		borderRadius: {
		  sm: "4px",
		  md: "8px",
		  lg: "12px",
		  xl: "16px",
		  "2xl": "20px",
		  "3xl": "24px",
		  full: "9999px",
		},

		boxShadow: {
		  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
		  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
		  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
		  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
		  card: "0 2px 8px rgba(0, 0, 0, 0.06)",
		  "card-hover": "0 8px 24px rgba(0, 0, 0, 0.1)",
		},

		container: {
		  center: true,
		  padding: {
			DEFAULT: "1rem",
			sm: "1.5rem",
			lg: "2rem",
			xl: "2.5rem",
		  },
		},
	  },
	},

	plugins: [],
  };
  