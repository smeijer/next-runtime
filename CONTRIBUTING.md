# Contributing

Thanks for being willing to contribute!

**Working on your first Pull Request?** You can learn how from this _free_
series [How to Contribute to an Open Source Project on GitHub][egghead]

## Project setup

1.  Fork and clone the repo
2.  Run `npm ci` to install dependencies
3.  Create a branch for your PR with `git checkout -b feature/your-branch-name`

> Tip: Keep your `main` branch pointing at the original repository and make
> pull requests from branches on your fork. To do this, run:
>
> ```
> git remote add upstream git@github.com:smeijer/next-runtime.git
> git fetch upstream
> git branch --set-upstream-to=upstream/main main
> ```
>
> This will add the original repository as a "remote" called "upstream," Then
> fetch the git information from that remote, then set your local `main`
> branch to use the upstream main branch whenever you run `git pull`. Then you
> can make all of your pull request branches based on this `main` branch.
> Whenever you want to update your version of `main`, do a regular `git pull`.

## Committing and Pushing changes

Please make sure to run the tests before you commit your changes. You can run
`npm run test` to do so.

### Linting with git hooks

There are git hooks set up with this project that are automatically installed
when you install dependencies. They're really handy, and will take care of linting
and formatting for you.

## Project structure

There are a few surprising things going on in this repo. We have two test runners, as well as two tsconfig files. Let me explain why;

**npm run test:unit**

This is a basic ts-jest runner that runs tests located in `./src`. The tests will use a fake next server to test our functionality, without depending on a next build.

**npm run test:e2e**

These are tests run by playwright, against a real next instance. Running next means that we need a `/pages` directory. Hence, the test files are located in `/pages`. That directory now serves as place for e2e tests, which can also serve as "examples".

**tsconfig.build.json**

`test:e2e` is also the reason why we need two tsconfigs. `tsconfig.build.json` is used to build the lib. Because the spawning of next for e2e tests, automatically create or adjusts the main `tsconfig.json`. Which breaks our build.

**/src**

That's where you find all the source files for `next-runtime`.

**/docs**

Is where you'll find the documentation. Run `npm run dev` in that directory to start the documentation webserver. All documentation content files can be found in `/docs/content`.

## Help needed

Please check out the [the open issues][issues]

Also, please watch the repo and respond to questions/bug reports/feature
requests! Thanks!

[egghead]: https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[issues]: https://github.com/smeijer/next-runtime/issues
