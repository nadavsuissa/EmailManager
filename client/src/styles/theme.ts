import { extendTheme, ThemeConfig } from '@chakra-ui/react';

// Color mode config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Custom colors
const colors = {
  brand: {
    50: '#e0f5ff',
    100: '#b8dcff',
    200: '#8dc3ff',
    300: '#63abfe',
    400: '#3a93fc',
    500: '#2079e2', // primary brand color
    600: '#1460c0',
    700: '#0c489e',
    800: '#04317c',
    900: '#001b5a',
  },
  secondary: {
    50: '#f5f8ff',
    100: '#eaf0ff',
    200: '#d5e1ff',
    300: '#aac2ff',
    400: '#809dff',
    500: '#5679f9',
    600: '#435ee0',
    700: '#3145b8',
    800: '#1f3091',
    900: '#0d1c69',
  },
};

// Font configuration
const fonts = {
  heading: `'Rubik', 'Assistant', sans-serif`,
  body: `'Assistant', 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
  mono: `'Roboto Mono', 'SFMono-Regular', monospace`,
};

// Breakpoints for responsive design
const breakpoints = {
  sm: '30em',
  md: '48em',
  lg: '62em',
  xl: '80em',
  '2xl': '96em',
};

// Define direction-specific styles
const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
  }),
};

// Define component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 500,
      borderRadius: 'md',
    },
    variants: {
      solid: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
        color: 'white',
        _hover: {
          bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.600',
        },
      }),
      outline: (props: any) => ({
        border: '1px solid',
        borderColor: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
        color: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
      }),
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: 'heading',
      fontWeight: 700,
    },
  },
  Text: {
    baseStyle: {
      fontFamily: 'body',
    },
  },
  Container: {
    baseStyle: {
      maxW: '1200px',
      px: { base: '4', md: '6' },
    },
  },
};

// Create the extended theme
const theme = extendTheme({ 
  config, 
  colors, 
  fonts, 
  breakpoints, 
  styles, 
  components,
  direction: 'rtl', // Default to RTL for Hebrew
  textStyles: {
    // Special text styles for Hebrew
    hebrew: {
      fontFamily: 'Assistant, Rubik, sans-serif',
      fontSize: { base: 'md', md: 'lg' },
      fontWeight: 400,
    },
    // Emphasized Hebrew text
    hebrewEmphasis: {
      fontFamily: 'Rubik, Assistant, sans-serif',
      fontSize: { base: 'md', md: 'lg' },
      fontWeight: 600,
    },
  }
});

export default theme; 