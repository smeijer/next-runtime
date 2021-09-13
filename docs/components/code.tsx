// ignore order, because Prism must be loaded before the prism assets
// eslint-disable-next-line simple-import-sort/imports
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/components/prism-jsx.min';
import 'prismjs/components/prism-bash.min';
import 'prismjs/components/prism-typescript.min';

import clsx from 'clsx';
import { stripIndent } from 'common-tags';
import { useMemo } from 'react';

function Code({ children, language = 'markup', size = 'xs' }) {
  const highlighted = useMemo(
    () =>
      Prism.highlight(
        stripIndent`${children}`,
        Prism.languages[language],
        language,
      ),
    [children],
  );

  if (!Prism.languages[language]) {
    console.error(
      'Invalid language provided to <Code>, use markup, html, svg, xml, javascript, js or check here for a full list https://prismjs.com/#supported-languages',
    );
  }

  return (
    <pre
      tabIndex={0}
      className={clsx(
        '!bg-gray-900 !p-4 !rounded !leading-normal !m-0',
        {
          '!text-xs': size === 'xs',
          '!text-sm': size === 'sm',
          '!text-base': size === 'md',
        },
        `language-${language}`,
      )}
    >
      <code
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
}

export default Code;
