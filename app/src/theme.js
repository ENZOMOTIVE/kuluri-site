import { createTheme } from '@mantine/core'

// Calm palette: warm stone/sand surfaces and a muted sage accent, used sparingly.
// Low contrast between surfaces, no pure white, no saturated green -> less eye strain.
export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 7,
  colors: {
    brand: [
      '#eef1ea', '#e0e6da', '#c6d1bd', '#a9b99e', '#90a484',
      '#7f9673', '#728a67', '#5f7556', '#4e6047', '#3e4c39',
    ],
    // warm greys for borders, table heads, skeletons
    gray: [
      '#f0ece4', '#e9e4da', '#e1dbcf', '#d4cdbf', '#b9b1a2',
      '#9a9283', '#7d766a', '#625c52', '#4a453e', '#34302b',
    ],
    // muted blue-green for "edited by you" / worker-confirmed
    teal: [
      '#ebf1f0', '#dbe6e4', '#bccfcc', '#9cb8b4', '#83a5a0',
      '#739893', '#668b86', '#557672', '#46625e', '#374e4b',
    ],
    // muted terracotta for warnings / disputes
    red: [
      '#f7ebe7', '#efd8d0', '#e0b3a5', '#d18e7a', '#c47158',
      '#bb6047', '#b0553c', '#984631', '#863d2a', '#713221',
    ],
    yellow: [
      '#f8f0df', '#f1e3c4', '#e6cf9c', '#dbbb74', '#d2aa55',
      '#cc9f43', '#c29438', '#a87e2d', '#957024', '#7f5f1a',
    ],
  },
  white: '#f7f4ee',
  black: '#34302b',
  fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  headings: {
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
    fontWeight: '700',
  },
  defaultRadius: 'md',
  radius: { md: '10px', lg: '14px' },
  components: {
    Button: { defaultProps: { fw: 600 } },
    Card: { defaultProps: { withBorder: true, radius: 'lg', padding: 'lg' } },
    Paper: { defaultProps: { radius: 'lg' } },
    Badge: { defaultProps: { radius: 'sm', fw: 600 } },
  },
})
