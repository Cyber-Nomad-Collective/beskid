# NodeBB 4 theming and pckg thread integration

Date: 2026-10-15. Scope: NodeBB 4.16.x with nodebb-theme-harmony 3.3.x, Postgres, OIDC sign-in. Claims come from the NodeBB source (cloned from GitHub, HEAD reports 4.16.3, so confirm the few version-sensitive points on 4.16.0) because the official docs do not cover skins, SCSS variables or token internals. Paths below are relative to the NodeBB repository unless stated.

## A. Theming

Facts from source:

- ACP Custom CSS (config keys `customCSS`, `useCustomCSS`) is compiled with Sass when saved (`src/meta/configs.js`, `saveRenderedCss`, `sass.compileStringAsync`). The output is stored in `renderedCustomCSS` and inlined in the page head (`src/middleware/render.js`). It is compiled standalone, so it has no access to Bootstrap or Harmony SCSS variables. It can only use CSS custom properties (`--bs-primary`, `--bs-body-bg`, and so on) and plain selectors. SCSS syntax (nesting, own variables) works. No build step is needed; a save through `Meta.configs.set` recompiles it.
- ACP Appearance > Customise has a Bootstrap Variables tab (config keys `bsVariables`, `useBSVariables=1`). That text is prepended to the client SCSS bundle before Harmony's `scss/overrides.scss` (`src/meta/css.js`, `bsvariables()`). Harmony declares its colours with `!default` (`$primary: $blue !default`, `$body-bg`, `$link-color`, `$gray-*`), so `$primary: #047857;` there recompiles every button, link and badge. Exception: `$font-family-sans-serif` in Harmony is not `!default`, so a prepended override of the font stack loses. Set fonts with `--bs-body-font-family` in Custom CSS, or in a child theme.
- Dark mode in Harmony 4 is a skin, not `data-bs-theme`. Skins are 26 Bootswatch themes plus "custom skins". The skin class goes on `<body class="skin-<name>">`, and `client-<skin>.css` is built per skin (`templates/header.tpl` in Harmony, `src/routes/index.js`). The ACP default is config key `bootswatchSkin`; each user may override it (user setting `bootswatchSkin`; ACP option `disableCustomUserSkins` blocks that). Harmony's sidebar skin switcher lists light and dark groups. I found no `prefers-color-scheme` handling in core or Harmony. `data-bs-theme` appears only in the ACP.
- Custom skins are stored in the settings hash `custom-skins` (`custom-skin-list`, items with `custom-skin-name` and `_variables`, an SCSS variable block). Their slugified name is the skin id and they appear in the switcher (`CSS.getCustomSkins`). Two custom skins, `beskid-light` and `beskid-dark`, give a brand-correct light/dark pair that users can switch.
- Child theme: `theme.json` with `"baseTheme": "nodebb-theme-harmony"`, and `theme.scss` that imports the Harmony theme (the quickstart theme does this). The build puts the active theme directory first in the Sass load path, so a child `scss/overrides.scss` shadows Harmony's (inference from `css.js`; test it). Child themes inherit templates. This survives upgrades but needs an npm package, an `npm install` in the image, `nodebb activate` and a rebuild.
- Logo, favicon, title keys in `config`: `brand:logo`, `brand:logo:alt`, `brand:logo:url`, `brand:favicon`, `brand:touchIcon`, `title`, `title:short`. They hold upload URLs, so the SVG must be uploaded first (ACP, or `/api/admin/uploadlogo` and `/api/admin/uploadfavicon`) or served from a plugin `staticDirs` path. `brand:emailLogo` is derived from a PNG that only the logo upload creates (`getLogoSize`).
- Applying values declaratively: `PUT /api/v3/admin/settings/:setting` with `{value}` calls `meta.configs.set`, so it also recompiles `renderedCustomCSS`. Writing straight into the DB `config` hash skips that recompile and the cache buster. `bsVariables` and skin changes need `nodebb build` (they change the compiled client bundle); Custom CSS and logo values do not. There is no `nodebb config` CLI, and no CLI for skins (community.nodebb.org/topic/18150).

Recommendation: do not fork a child theme yet. Ship two custom skins plus `bsVariables` for the palette and Custom CSS for font, logo sizing and the `prefers-color-scheme` mapping, all written through the admin settings API (or `Meta.configs`/`Meta.settings` in a node script), then run `nodebb build` once. Move to a child theme only if template changes are needed.

## B. Write API integration

- Create topic: `POST /api/v3/topics` with `cid`, `title`, `content`, optional `tags`. Reply: `POST /api/v3/topics/:tid` with `content`. Counters: `GET /api/v3/topics/:tid` or the Read API `GET /api/topic/:tid` (`postcount`, `viewcount`). Responses of 202 mean the post went to the post queue.
- Tokens (`src/api/utils.js`): a token is a UUID stored as hash `token:<uuid>` with `uid`, `description`, `timestamp`, plus sorted sets `tokens:createtime`, `tokens:uid`, `tokens:lastSeen`. A user token acts as that user. A master token has uid 0 and every request must add `_uid` (body or query), else `error:api.master-token-no-uid` (`src/middleware/user.js`). A master token with a non-admin `_uid` gets no admin rights.
- In HEAD, creating tokens through the API (`POST /api/v3/admin/tokens`) requires interactive re-auth (a password for master tokens), so it cannot be scripted cleanly. Script it instead: run a small node script inside the container (after NodeBB config load) that calls `api.utils.tokens.add({ token: <secret from env>, uid: <bot uid>, description })`, or insert the rows directly. Because the token is a plain UUID, the entrypoint can seed a pre-generated secret idempotently.
- Pattern: a dedicated bot user (for example `pckg-bot`, created with `nodebb user` CLI or the user API), a user-bound token (least privilege, no `_uid`), and membership of a "Package bots" group.
- Restrict creation: on the Packages category, rescind `groups:topics:create` from `registered-users` and `guests`, and grant it to the bot group; keep `groups:topics:reply` and `groups:topics:read` for `registered-users`. API: `PUT /api/v3/categories/:cid/privileges/:privilege` with `{member}` (needs an admin token; DELETE rescinds). Note `topics:create` also covers tagging checks in `src/topics/create.js`.
- Throttles that hit bots: `postDelay`, `newbiePostDelay` with `newbieReputationThreshold`, `initialPostDelay`, the post queue (`postQueue`, reputation threshold), and a per-user posting lock that returns `already-posting` for concurrent requests (`src/controllers/write/topics.js`). Admins and category moderators skip the delays (`src/user/posts.js`). Otherwise add the bot to the groups in `groupsExemptFromNewUserRestrictions` and `groupsExemptFromPostQueue`. Serialise bot calls per uid.

Recommendation: user-bound token for a bot in an exempt group, seeded by script, with topic creation limited to that group.

## C. Prior art and architecture

- nodebb-plugin-blog-comments2 (fork of psychobunny's plugin, last npm release 0.9.8 in 2022) publishes an article as a topic in a chosen category, keyed by `articleID` and `blogger`, and embeds comments by script. It is old and unmaintained, so use it only as a design reference.
- ActivityPub in NodeBB 4 federates categories and topics with the fediverse. It does not give an external site a way to own a topic, and package actors would add a new, larger surface. Not recommended here.
- A small own plugin has real value for package metadata (store `pckgName` on the topic, show a package badge/link in the topic header via `filter:topic.get`, enforce one topic per package, expose a lookup endpoint `GET /api/pckg/topic/:name`). The registry calling the Write API remains simplest for creation and replies.

Recommendation: start with Write API calls from the registry (idempotent: store `tid` in the registry database, and a package name tag as a fallback lookup); add a thin plugin later for header badge and metadata only.

## D. Embedding

- Read API `GET /api/topic/:tid` returns JSON (posts, `postcount`, `viewcount`) for anyone with read privileges. Cross-origin browser calls need the ACP Advanced setting for `access-control-allow-origin` (config keys `access-control-allow-origin`, `access-control-allow-origin-regex`; `src/middleware/headers.js`). Calling it from the registry server avoids CORS, can cache the result for about a minute, and keeps the counters fresh enough. There is no first-party embed widget in NodeBB 4; blog-comments2 is the unofficial route.

Recommendation: fetch server-side and cache; render the last N posts and the counters, link to the thread.

## Recommended architecture

- Brand through two custom skins (`beskid-light`, `beskid-dark`) with `_variables`, plus `bsVariables` and Custom CSS, set by the entrypoint through the admin settings API, followed by `nodebb build` when `bsVariables` or skins change.
- Upload the ridge SVG logo and favicon once at start, or serve them from a small plugin `staticDirs`, and set `brand:logo`, `brand:favicon`, `title`.
- Map OS dark preference with `prefers-color-scheme` in Custom CSS, or keep the skin switcher as the user-visible control.
- Create a `pckg-bot` user in a "Package bots" group with a user-bound token seeded from a secret by a node script in the entrypoint.
- Packages category: only the bot group may create topics; registered users reply; bot group exempt from post delays and queue.
- Registry stores `tid` per package and posts a reply per release; counters come from the cached Read API.
- Add a plugin later only for header badge and metadata; do not use ActivityPub or the blog-comments plugin.
- Re-verify token-creation and re-auth behaviour on 4.16.0 before relying on this.

## Sources

- https://github.com/NodeBB/NodeBB (src/meta/css.js, src/meta/configs.js, src/meta/themes.js, src/api/utils.js, src/api/users.js, src/api/admin.js, src/api/categories.js, src/middleware/user.js, src/middleware/headers.js, src/middleware/render.js, src/routes/write/*.js, src/controllers/write/topics.js, src/user/posts.js, src/topics/create.js, src/views/admin/appearance/customise.tpl and skins.tpl, public/src/admin/appearance/skins.js)
- https://github.com/NodeBB/nodebb-theme-harmony (theme.json, theme.scss, scss/overrides.scss, scss/fonts.scss, templates/header.tpl, templates/partials/skin-switcher.tpl)
- https://github.com/NodeBB/nodebb-theme-quickstart (theme.json, theme.scss)
- https://docs.nodebb.org/development/themes/
- https://docs.nodebb.org/activitypub/
- https://raw.githubusercontent.com/NodeBB/NodeBB/develop/public/openapi/write.yaml
- https://community.nodebb.org/topic/18150/set-skin-via-cli
- https://registry.npmjs.org/nodebb-plugin-blog-comments2
