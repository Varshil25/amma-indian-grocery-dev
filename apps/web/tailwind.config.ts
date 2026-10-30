/** @type {import('tailwindcss').Config} */

/** A font size that grows smoothly from `min` px on a 375px phone to `max` px on a 1280px+ screen. */
const fluid = (min: number, max: number) => {
  const slope = (max - min) / (1280 - 375);
  const base = min - slope * 375;
  const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`;
  return `clamp(${rem(min)}, ${rem(base)} + ${+(slope * 100).toFixed(4)}vw, ${rem(max)})`;
};

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
  
		// One type scale for the whole store. Headings are fluid: each size grows smoothly from
		// its phone size (375px screen) to its desktop size (1280px and wider), so the same class
		// works on every screen. Where each size is used:
		//   h1  home hero headline                      34 → 56px
		//   h2  promo banners / call-to-action titles    30 → 52px
		//   h3  page titles and section titles           28 → 48px
		//   h4  auth & confirmation titles               24 → 40px
		//   h5  empty-state and listing titles           22 → 36px
		//   h6  card / panel headings                    20 → 24px
		//   body-lg  intro & lead paragraphs             16 → 18px
		//   body-md  normal text                         16px
		//   body-sm  secondary text, form hints/errors   14px
		//   body-xs  meta (dates, badges, small print)   12px
		fontSize: {
		  h1: [fluid(34, 56), { lineHeight: "1.15" }],
		  h2: [fluid(30, 52), { lineHeight: "1.15" }],
		  h3: [fluid(28, 48), { lineHeight: "1.2" }],
		  h4: [fluid(24, 40), { lineHeight: "1.25" }],
		  h5: [fluid(22, 36), { lineHeight: "1.25" }],
		  h6: [fluid(20, 24), { lineHeight: "1.3" }],

		  body: [fluid(18, 28), { lineHeight: "1.4" }],
		  body1: [fluid(18, 26), { lineHeight: "1.4" }],
		  body2: [fluid(18, 24), { lineHeight: "1.4" }],

		  "body-xl": [fluid(18, 20), { lineHeight: "1.6" }],
		  "body-lg": [fluid(16, 18), { lineHeight: "1.6" }],
		  "body-md": ["16px", { lineHeight: "1.5" }],
		  "body-sm": ["14px", { lineHeight: "1.5" }],
		  "body-xs": ["12px", { lineHeight: "1.5" }],

		  title: [fluid(18, 20), { lineHeight: "1.3" }],
		  smtitle: [fluid(16, 18), { lineHeight: "1.3" }],

		  caption: ["16px", { lineHeight: "1.5" }],
		  label: ["14px", { lineHeight: "1.5" }],
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
  