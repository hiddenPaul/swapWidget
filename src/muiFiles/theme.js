import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    error: {
      main: red.A400,
    }
  },
  overrides: {
    MuiButton: {
      raisedPrimary: {
        color: 'white',
      },
    },
  },    
});

theme.typography.h3 = {
    fontSize: '2rem',
    '@media (min-width:600px)': {
        fontSize: '3rem',
    },
    [theme.breakpoints.up('md')]: {
        fontSize: '4rem',
    },
};

// theme.typography.h5 = {
//     fontSize: '2rem',
//     '@media (min-width:600px)': {
//         fontSize: '3rem',
//     },
//     [theme.breakpoints.up('md')]: {
//         fontSize: '4rem',
//     },
// };


export default theme;
