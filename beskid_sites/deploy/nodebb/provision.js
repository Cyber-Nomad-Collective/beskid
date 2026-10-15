'use strict';

/*
 * Idempotent production provisioning for the Beskid NodeBB forum.
 *
 * Run inside the NodeBB container, then restart it (the entrypoint rebuilds
 * assets on start):
 *
 *   docker cp beskid_sites/deploy/nodebb beskid-community:/tmp/beskid-nodebb
 *   docker exec -e PCKG_NODEBB_BOT_TOKEN=... beskid-community \
 *     node /tmp/beskid-nodebb/provision.js
 *
 * DRY_RUN=1 reports the planned changes without writing. The script applies
 * the Emerald Ridge branding (light Bootstrap variables, a "Beskid Dark"
 * custom skin, custom CSS, logo, favicon, title, category colors), and the
 * pckg integration: the "Packages" category where only the registry bot opens
 * topics, the bot user and group, posting exemptions, and the bot's
 * user-bound API token. It prints `PCKG_NODEBB_PACKAGES_CID=<cid>`.
 */

const fs = require('node:fs');
const path = require('node:path');

const APP = '/usr/src/app';
const CONFIG = process.env.NODEBB_CONFIG || '/opt/config/config.json';
const DRY_RUN = process.env.DRY_RUN === '1';
const HERE = __dirname;

const BOT_USERNAME = 'Beskid Packages';
const BOT_GROUP = 'Package bots';
const BOT_TOKEN_DESCRIPTION = 'pckg registry: package topics and release replies';
const PACKAGES_PARENT = 'Beskid Platform';
const PACKAGES_NAME = 'Packages';
const PACKAGES_DESCRIPTION = 'One thread per published Beskid package. The registry opens each thread and posts every release; reply there to discuss the package.';

// Emerald Ridge tiles; text color chosen for contrast on each background.
const CATEGORY_STYLE = {
	Announcements: ['#047857', '#ffffff', 'fa-bullhorn'],
	'Beskid Platform': ['#0f766e', '#ffffff', 'fa-cubes'],
	Community: ['#065f46', '#ffffff', 'fa-users'],
	Packages: ['#059669', '#ffffff', 'fa-box-open'],
	'Language & Compiler': ['#115e59', '#ffffff', 'fa-code'],
	'Tooling & IDE': ['#0e7490', '#ffffff', 'fa-screwdriver-wrench'],
	'Documentation & Learning': ['#155e75', '#ffffff', 'fa-book'],
	'General Discussion': ['#047857', '#ffffff', 'fa-comments'],
	'Questions & Support': ['#0d9488', '#ffffff', 'fa-circle-question'],
	'Showcase & Projects': ['#34d399', '#022c22', 'fa-star'],
	'Ideas & Feedback': ['#a7f3d0', '#022c22', 'fa-lightbulb'],
};

const BOT_PRIVILEGES = [
	'groups:find',
	'groups:read',
	'groups:topics:read',
	'groups:topics:create',
	'groups:topics:reply',
	'groups:topics:tag',
	'groups:posts:edit',
	// Category moderators skip NodeBB's posting delays (src/user/posts.js
	// isReady); the general postDelay has no group exemption otherwise, and
	// the registry opens many threads in a row during reconcile.
	'groups:moderate',
];
const TOPIC_CREATORS_TO_REMOVE = ['registered-users', 'guests', 'spiders', 'fediverse'];

const read = (name) => fs.readFileSync(path.join(HERE, name), 'utf8');

function log(action, detail) {
	console.log(`${DRY_RUN ? '[dry-run] ' : ''}${action}${detail ? `: ${detail}` : ''}`);
}

async function apply(action, detail, fn) {
	log(action, detail);
	if (!DRY_RUN) {
		await fn();
	}
}

async function main() {
	process.chdir(APP);
	// Same bootstrap as NodeBB's CLI (src/cli/index.js); no cron jobs here.
	process.env.jobsDisabled = 'true';
	require(`${APP}/node_modules/nconf`).argv().env({ separator: '__' });
	require(`${APP}/src/prestart`).loadConfig(CONFIG);
	const db = require(`${APP}/src/database`);
	await db.init();
	const meta = require(`${APP}/src/meta`);
	await meta.configs.init();
	const user = require(`${APP}/src/user`);
	const groups = require(`${APP}/src/groups`);
	const categories = require(`${APP}/src/categories`);
	const privileges = require(`${APP}/src/privileges`);
	const apiUtils = require(`${APP}/src/api/utils`);

	// Branding. setMultiple recompiles customCSS into renderedCustomCSS.
	await apply('set branding config', 'title, logo, favicon, bsVariables, customCSS', () => meta.configs.setMultiple({
		title: 'Beskid Community',
		'title:short': 'Beskid',
		browserTitle: 'Beskid Community',
		showSiteTitle: 1,
		description: 'Discussion for the Beskid programming language: packages, tooling, questions and showcases.',
		keywords: 'beskid,programming language,packages,compiler',
		'brand:logo': 'https://beskid-lang.org/logo.svg',
		'brand:logo:alt': 'Beskid',
		'brand:favicon': 'https://beskid-lang.org/favicon.svg',
		bsVariables: read('beskid-light.scss'),
		useBSVariables: 1,
		customCSS: read('beskid-custom.scss'),
		useCustomCSS: 1,
		bootswatchSkin: '',
	}));
	await apply('set custom skins', 'Beskid Dark', () => meta.settings.set('custom-skins', {
		'custom-skin-list': [{ 'custom-skin-name': 'Beskid Dark', _variables: read('beskid-dark.scss') }],
	}));

	// Category tiles.
	const cids = await categories.getAllCidsFromSet('categories:cid');
	const all = await categories.getCategoriesFields(cids, ['cid', 'name', 'parentCid', 'topic_count']);
	for (const category of all) {
		const style = CATEGORY_STYLE[category.name];
		if (style) {
			const [bgColor, color, icon] = style;
			await apply('style category', `${category.cid} ${category.name}`, () => categories.update({
				[category.cid]: { bgColor, color, icon },
			}));
		}
	}

	// Bot user and group.
	let botUid = await user.getUidByUsername(BOT_USERNAME);
	if (!botUid) {
		await apply('create bot user', BOT_USERNAME, async () => {
			botUid = await user.create({ username: BOT_USERNAME });
		});
	}
	if (!await groups.exists(BOT_GROUP)) {
		await apply('create group', BOT_GROUP, () => groups.create({
			name: BOT_GROUP,
			description: 'Automation accounts that publish registry events.',
			hidden: 1,
			private: 1,
			disableJoinRequests: 1,
		}));
	}
	if (botUid && !await groups.isMember(botUid, BOT_GROUP)) {
		await apply('join group', `${BOT_USERNAME} -> ${BOT_GROUP}`, () => groups.join(BOT_GROUP, botUid));
	}
	for (const key of ['groupsExemptFromNewUserRestrictions', 'groupsExemptFromPostQueue']) {
		// Deserialized as an array; serialize() stores arrays as JSON.
		const list = Array.isArray(meta.config[key]) ? meta.config[key] : [];
		if (!list.includes(BOT_GROUP)) {
			await apply('exempt group', `${BOT_GROUP} from ${key}`, () => meta.configs.set(key, [...list, BOT_GROUP]));
		}
	}

	// Packages category: one per forum, bot-opened threads only.
	const parent = all.find(c => c.name === PACKAGES_PARENT && Number(c.parentCid) === 0);
	let packages = all.find(c => c.name === PACKAGES_NAME);
	if (!packages) {
		await apply('create category', PACKAGES_NAME, async () => {
			const [bgColor, color, icon] = CATEGORY_STYLE.Packages;
			packages = await categories.create({
				name: PACKAGES_NAME, description: PACKAGES_DESCRIPTION, parentCid: parent ? parent.cid : 0, bgColor, color, icon,
			});
		});
	} else {
		await apply('describe category', `${packages.cid} ${PACKAGES_NAME}`, () => categories.update({
			[packages.cid]: { description: PACKAGES_DESCRIPTION },
		}));
	}
	const packagesCid = packages ? packages.cid : null;
	if (packagesCid) {
		// Retired design: one subcategory per package. Remove only empty ones.
		for (const child of all.filter(c => Number(c.parentCid) === Number(packagesCid))) {
			if (Number(child.topic_count) === 0) {
				await apply('purge empty per-package category', `${child.cid} ${child.name}`, () => categories.purge(child.cid, 1));
			} else {
				log('keep non-empty per-package category', `${child.cid} ${child.name}`);
			}
		}
		await apply('restrict topic creation', `cid ${packagesCid}`, () => privileges.categories.rescind(['groups:topics:create'], packagesCid, TOPIC_CREATORS_TO_REMOVE));
		await apply('grant bot privileges', `cid ${packagesCid}`, () => privileges.categories.give(BOT_PRIVILEGES, packagesCid, [BOT_GROUP]));
	}

	// Bot token: user-bound, supplied by the operator so it can live in pckg's env.
	const token = process.env.PCKG_NODEBB_BOT_TOKEN;
	if (token && botUid) {
		const existing = await db.getObject(`token:${token}`);
		if (!existing || Number(existing.uid) !== Number(botUid)) {
			await apply('register bot token', BOT_TOKEN_DESCRIPTION, () => apiUtils.tokens.add({ token, uid: botUid, description: BOT_TOKEN_DESCRIPTION }));
		}
	} else if (!token) {
		log('skip bot token', 'PCKG_NODEBB_BOT_TOKEN not set');
	}

	console.log(`PCKG_NODEBB_PACKAGES_CID=${packagesCid ?? 'unknown'}`);
	process.exit(0);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
