import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HamburgerMenuIcon,
} from '@modulz/radix-icons';
import cn from 'classnames';
import clsx from 'clsx';
import fs from 'fs';
import glob from 'glob';
import matter from 'gray-matter';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import path from 'path';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import _slugify from 'slugify';

import Code from '../components/code';
import {
  GithubCircleIcon,
  GithubIcon,
  NpmIcon,
  TwitterIcon,
} from '../components/icons';
import SocialHead from '../components/social-head';
import toc, { TocLink } from '../content/toc';
import { absoluteUrl } from '../lib/absolute-url';

export function slugify(name) {
  name = renderToString(name)
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '');

  return _slugify(`${name}`.replace(/\./g, '-'), {
    lower: true,
    remove: /[^\w\s\-]/g,
  });
}

function CustomLink({ href, children }) {
  const onClick = (event) => {
    if (!href.startsWith('#')) return;
    event.preventDefault();
    history.pushState(null, document.title, href);

    document.body.querySelector(href)?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  return (
    <Link href={href}>
      <a onClick={onClick} className="!text-blue-600 !font-normal underline">
        {children}
      </a>
    </Link>
  );
}

function WrapCode({ className, children }) {
  const language = (className || '').split('-')[1];

  return (
    <Code size="md" language={language}>
      {children}
    </Code>
  );
}

function H({ tag, children }) {
  const Tag = tag;
  const slug = slugify(children);

  const onClick = (event) => {
    event.preventDefault();

    history.pushState(null, document.title, `#${slug}`);

    event.currentTarget?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  return (
    <Tag id={slug} className="relative group">
      <Link href={`#${slug}`}>
        <a className="!no-underline" onClick={onClick}>
          <div className="absolute -translate-x-2 group-hover:-translate-x-6 opacity-0 group-hover:opacity-100 transition">
            #
          </div>
          {children}
        </a>
      </Link>
    </Tag>
  );
}

function Note({ children }) {
  return <p className="bg-blue">{children}</p>;
}
// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  a: CustomLink,
  h1: ({ children }) => <H tag="h1">{children}</H>,
  h2: ({ children }) => <H tag="h2">{children}</H>,
  h3: ({ children }) => <H tag="h3">{children}</H>,
  h4: ({ children }) => <H tag="h4">{children}</H>,
  h5: ({ children }) => <H tag="h5">{children}</H>,
  ul: ({ children }) => <ul className="list-disc list-outside">{children}</ul>,
  code: WrapCode,
  note: ({ children }) => (
    <p className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
      <strong>note: </strong>
      {children}
    </p>
  ),
  Head,
};

function NavLink({ href, children, active }) {
  return (
    <div
      className={cn(
        'hover:border-blue-600 w-full group border-l-4 transition',
        {
          'border-blue-600 bg-blue-50 text-black': active,
          'hover:bg-blue-50 border-transparent': !active,
        },
      )}
    >
      <Link href={href}>
        <a className="block w-full h-full p-4">{children}</a>
      </Link>
    </div>
  );
}

function NavCaption({ children, className = '' }) {
  return (
    <div
      className={clsx(
        'p-4 flex-auto flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider',
        className,
      )}
    >
      {children}
    </div>
  );
}

function SocialBar() {
  return (
    <div className="flex w-full px-4 space-x-4 py-2">
      <a
        title="GitHub"
        target="_blank"
        href="https://github.com/smeijer/next-runtime"
      >
        <GithubIcon className="" />
      </a>
      <a title="npm" target="_blank" href="https://npmjs.com/next-runtime">
        <NpmIcon className="" />
      </a>
      <a title="Twitter" target="_blank" href="https://twitter.com/meijer_s">
        <TwitterIcon className="" />
      </a>
    </div>
  );
}

function Sidebar({ selected }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-0 md:w-64">
      <div
        className={cn(
          'flex-none z-10 fixed top-0 left-0 bottom-0 md:w-64 flex bg-opacity-25 bg-black',
          {
            'w-full': menuOpen,
            'w-0': !menuOpen,
          },
        )}
        onClick={() => {
          setMenuOpen(false);
        }}
      >
        <aside
          className={cn(
            'flex-none flex flex-col w-64 bg-white border-r border-gray-200 h-screen transition md:translate-x-0',
            {
              '-translate-x-64': !menuOpen,
              'translate-x-0': menuOpen,
            },
          )}
        >
          <h1 className="w-full mt-8 px-4 py-2 text-2xl font-light flex-none">
            <Link href="/">next-runtime</Link>
          </h1>

          <div className="flex-none mb-4">
            <SocialBar />
          </div>

          {/* be sure to add enough bottom padding for mobile 100vh trouble */}
          <div className="flex-auto overflow-y-scroll pt-4 pb-20 relative">
            {toc.map((entry, idx) =>
              'caption' in entry ? (
                <NavCaption
                  key={`${idx}-${entry.caption}`}
                  className={idx > 0 ? 'mt-8' : ''}
                >
                  {entry.caption}
                </NavCaption>
              ) : (
                <NavLink
                  key={`${idx}-${entry.slug}`}
                  href={`/${entry.slug}`}
                  active={entry.slug === selected.slug}
                >
                  {entry.title}
                </NavLink>
              ),
            )}
          </div>
        </aside>
      </div>

      <button
        onClick={() => setMenuOpen((open) => !open)}
        className="z-50 md:hidden bg-gray-800 hover:bg-gray-900 text-white fixed w-16 h-16 shadow-lg rounded-full bottom-6 right-6 flex items-center justify-center focus:outline-none"
      >
        <HamburgerMenuIcon width="20" height="20" />
      </button>
    </div>
  );
}

export default function DocsPage({ source, frontMatter, next, prev, page }) {
  return (
    <>
      <SocialHead
        title={`next-runtime — ${
          frontMatter.pageTitle || frontMatter.title
        }`.toLowerCase()}
        description="All you need to handle POST requests, file uploads, and api requests, in Next.js getServerSideProps."
        url={absoluteUrl(page.slug)}
      />
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-auto w-full max-w-6xl mx-auto">
          <Sidebar selected={page} />

          <div className="overflow-x-hidden px-8 pb-16 mx-auto w-full max-w-prose">
            <h1 className="text-5xl tracking-tight font-light mt-8 mb-6 relative text-gray-900">
              {frontMatter.title}
            </h1>

            <main className="flex-auto w-full prose mdx">
              {frontMatter.description && (
                <p className="pb-">{frontMatter.description}</p>
              )}
              <MDXRemote {...source} components={components} />
            </main>

            <div className="mt-16 pt-8 flex justify-between items-center text-blue-600">
              {prev ? (
                <Link href={`/${prev.slug}`}>
                  <a className="flex items-center px-4 py-2 rounded-lg hover:bg-blue-50">
                    <ChevronLeftIcon className="mr-2" />
                    {prev.title}
                  </a>
                </Link>
              ) : (
                <div />
              )}

              {next ? (
                <Link href={`/${next.slug}`}>
                  <a className="flex items-center px-4 py-2 rounded-lg hover:bg-blue-50">
                    {next.title}
                    <ChevronRightIcon className="ml-2" />
                  </a>
                </Link>
              ) : (
                <div />
              )}
            </div>

            <div className="mt-12 pt-8 flex justify-end items-center text-gray-700 border-t border-gray-200">
              <a
                className="flex items-center px-4 py-2 rounded-lg hover:opacity-60"
                href={`https://github.com/smeijer/next-runtime/edit/main/docs/content/${page.slug}.mdx`}
              >
                <GithubCircleIcon className="w-5 h-5 mr-2" /> Edit on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps = async ({ params }) => {
  const file = ['content', ...params.slug].join('/');
  const source = fs.existsSync(file + '.mdx')
    ? fs.readFileSync(file + '.mdx')
    : fs.readFileSync(path.join(file, 'index.mdx'));

  const { content, data } = matter(source);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
    scope: data,
  });

  const slug = params.slug.join('/');
  const pages: Array<TocLink & { section: string }> = [];

  let section;
  for (const entry of toc) {
    if ('caption' in entry) {
      section = entry.caption;
      continue;
    }

    pages.push({ ...entry, section });
  }

  const idx = pages.findIndex((entry) => entry.slug === slug);
  const prev = pages[idx - 1] || null;
  const page = pages[idx] || null;
  const next = pages[idx + 1] || null;

  // add sections
  if (prev && prev.section !== page.section) {
    prev.title = `${prev.section}: ${prev.title}`;
  }

  if (next && next.section !== page.section) {
    next.title = `${next.section}: ${next.title}`;
  }

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
      prev,
      page,
      next,
    },
  };
};

export const getStaticPaths = async () => {
  const files = glob.sync('**/*.mdx', {
    cwd: path.join(process.cwd(), 'content'),
  });

  const paths = files.map((path) => ({
    params: {
      slug: path
        .replace(/\.mdx?$/, '')
        .split('/')
        .filter((x) => x !== 'index'),
    },
  }));

  return {
    paths,
    fallback: false,
  };
};
