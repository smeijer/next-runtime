import typography from '@twind/typography';
import { Configuration } from 'twind';
import { blueGray, lightBlue } from 'twind/colors';

const config: Configuration = {
  mode: 'silent', // process.env.NODE_ENV === 'production' ? 'silent' : 'warn',
  plugins: {
    ...typography({
      className: 'prose',
    }),
    mdx: {
      ':global': {
        '::-webkit-scrollbar': {
          width: '5px',
          height: '5px',
        },

        '::-webkit-scrollbar-thumb': {
          backgroundColor: '#adb5bd',
          borderRadius: '4px',
        },
      },

      '& > pre': {
        padding: 0,
      },
      '& ul > li': {
        marginLeft: '2em',
        paddingLeft: '1em !important',
      },
      '& ul > li > p:first-child > strong:first-child + em:nth-child(2)': {
        marginLeft: '.5em',
      },
      '& ul > li > code:first-child + em:nth-child(2)': {
        fontSize: '.875em',
        marginLeft: '.25em',
        marginRight: '.5em',
      },
    },
  },
  theme: {
    extend: {
      flex: {
        0: '0 0 auto',
      },

      colors: {
        gray: blueGray,
        blue: lightBlue,
      },

      inset: {
        '3/5': `${(3 / 5) * 100}%`,
        '4/5': `${(4 / 5) * 100}%`,
        '5/6': `${(5 / 6) * 100}%`,
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: [''],
      },
    },
  },
};

export default config;
