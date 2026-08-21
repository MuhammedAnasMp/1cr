import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Theme Colors
        background: '#131313',
        'on-background': '#e5e2e1',
        surface: '#131313',
        'surface-dim': '#131313',
        'surface-bright': '#393939',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1c1b1b',
        'surface-container': '#20201f',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353535',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#c4c7c8',
        'inverse-surface': '#e5e2e1',
        'inverse-on-surface': '#313030',
        outline: '#8e9192',
        'outline-variant': '#444748',
        'surface-tint': '#c6c6c7',
        primary: '#ffffff',
        'on-primary': '#2f3131',
        'primary-container': '#e2e2e2',
        'on-primary-container': '#636565',
        'inverse-primary': '#5d5f5f',
        secondary: '#c8c6c5',
        'on-secondary': '#313030',
        'secondary-container': '#4a4949',
        'on-secondary-container': '#bab8b7',
        tertiary: '#ffffff',
        'on-tertiary': '#2b276a',
        'tertiary-container': '#e3dfff',
        'on-tertiary-container': '#605ca2',
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
        'primary-fixed': '#e2e2e2',
        'primary-fixed-dim': '#c6c6c7',
        'on-primary-fixed': '#1a1c1c',
        'on-primary-fixed-variant': '#454747',
        'secondary-fixed': '#e5e2e1',
        'secondary-fixed-dim': '#c8c6c5',
        'on-secondary-fixed': '#1c1b1b',
        'on-secondary-fixed-variant': '#474646',
        'tertiary-fixed': '#e3dfff',
        'tertiary-fixed-dim': '#c4c0ff',
        'on-tertiary-fixed': '#150e55',
        'on-tertiary-fixed-variant': '#423e82',
        'surface-variant': '#353535',

        // Active / AI states
        'active-lavender': '#B6B2FF',
        'active-cyan': '#8FE3FF',
        'active-silver': '#E0E0E0',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        gutter: '16px',
        margin: '24px',
      },
      borderRadius: {
        DEFAULT: '4px', // Standard elements: buttons, inputs, tags (0.25rem)
        card: '8px', // Cards & Panes (0.375rem - 0.5rem)
        modal: '12px', // Large Sections / Modals (0.75rem)
      },
    },
  },
  plugins: [],
};
export default config;
