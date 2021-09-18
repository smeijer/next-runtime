# Maintaining

This is documentation for maintainers of this project.

## Code of Conduct

Please review, understand, and be an example of it. Violations of the code of
conduct are taken seriously, even (especially) for maintainers.

## Issues

We want to support and build the community. We do that best by helping people
learn to solve their own problems. We have an issue template and hopefully most
folks follow it. If it's not clear what the issue is, invite them to create a
minimal reproduction of what they're trying to accomplish or the bug they think
they've found.

Once it's determined that a code change is necessary, point people to
[makeapullrequest.com][make-a-pr] and invite them to make a
pull request. If they're the one who needs the feature, they're the one who can
build it. If they need some hand holding and you have time to lend a hand,
please do so. It's an investment into another human being, and an investment
into a potential maintainer.

Remember that this is open source, so the code is not yours, it's ours. If
someone needs a change in the codebase, you don't have to make it happen
yourself. Commit as much time to the project as you want/need to. Nobody can ask
any more of you than that.

## Pull Requests

As a maintainer, you're fine to make your branches on the main repo or on your
own fork. Either way is fine.

When we receive a pull request, a various automated checks are kicked off
automatically. We avoid merging anything that doesn't pass these checks.

Please review PRs and focus on the code rather than the individual. You never
know when this is someone's first ever PR and we want their experience to be as
positive as possible, so be uplifting and constructive.

When you merge the pull request, 99% of the time you should use the
[Squash and merge][squash-and-merge]
feature. This keeps our git history clean, but more importantly, this allows us
to make any necessary changes to the commit message so we release what we want
to release. See the next section on Releases for more about that.

## Release

Documentation changes are released automatically. They happen whenever changes land into `main`. A netlify build gets kicked off, and the [documentation site][docs] gets updated.

Library versions are published manually. Run `npm run release {pach|minor|major}` in the root of this project, and a new git tag will be pushed, a changelog is written to github releases, and a new version will be published to npm.

The changelog is generated based on the git commit messages. With this
in mind, **please brush up on [the commit message convention][commit] which
drives our releases.**

## Thanks!

Thank you so much for helping to maintain this project!

[commit]: https://github.com/conventional-changelog-archived-repos/conventional-changelog-angular/blob/ed32559941719a130bb0327f886d6a32a8cbc2ba/convention.md
[squash-and-merge]: https://help.github.com/articles/merging-a-pull-request/
[make-a-pr]: http://makeapullrequest.com
[docs]: https://next-runtime.meijer.ws/
