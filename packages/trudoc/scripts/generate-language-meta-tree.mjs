/**
 * Generates platform-spec/language-meta/{area}/*.mdx feature stubs (no URL version segment; Git is the version line).
 * Run: node scripts/generate-language-meta-tree.mjs (from site/website)
 */
import fs from 'node:fs';
import path from 'node:path';

import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs', 'platform-spec', 'language-meta');
const TODAY = new Date().toISOString().slice(0, 10);

const owner = { name: 'Piotr Mikstacki', email: 'pmikstacki@cybernomad.it' };

const areas = [
	{
		slug: 'surface-syntax',
		title: 'Surface syntax',
		description: 'Lexical structure, comments, and how source text maps to the grammar.',
		features: [
			{
				slug: 'lexical-and-syntax',
				title: 'Lexical and syntax',
				spec: '/platform-spec/language-meta/surface-syntax/lexical-and-syntax/',
				status: 'Standard',
				summary:
					'Defines tokens, whitespace, and the context-free skeleton that every later phase assumes. The normative grammar and lexical rules live in the Language Spec; this page records platform ownership and how the compiler front-end, formatter, and LSP agree on the same surface.',
			},
			{
				slug: 'documentation-comments',
				title: 'Documentation comments',
				spec: '/platform-spec/language-meta/surface-syntax/documentation-comments/',
				status: 'Standard',
				summary:
					'Structured comments attach human-readable contracts to declarations. Tooling must preserve them through formatting and refactors without changing semantics.',
			},
		],
	},
	{
		slug: 'type-system',
		title: 'Type system',
		description: 'Types, inference, dispatch, and algebraic data.',
		features: [
			{
				slug: 'types',
				title: 'Types',
				spec: '/platform-spec/language-meta/type-system/types/',
				status: 'Standard',
				summary:
					'The type grammar (nominal classes, interfaces, generics, nullability) is the backbone of static checking. All analysis phases share these definitions.',
			},
			{
				slug: 'enums-and-match',
				title: 'Enums and match',
				spec: '/platform-spec/language-meta/type-system/enums-and-match/',
				status: 'Standard',
				summary:
					'Algebraic enums and exhaustive `match` tie data representation to control flow. Lowering must preserve discriminant layout described in Execution where relevant.',
			},
			{
				slug: 'type-inference',
				title: 'Type inference',
				spec: '/platform-spec/language-meta/type-system/type-inference/',
				status: 'Standard',
				summary:
					'Local type inference reduces annotation burden while keeping programs predictable. The inference algorithm is specified here; diagnostics reference these rules.',
			},
			{
				slug: 'method-dispatch',
				title: 'Method dispatch',
				spec: '/platform-spec/language-meta/type-system/method-dispatch/',
				status: 'Standard',
				summary:
					'Virtual dispatch, overload resolution, and receiver rules decide which code runs. Interop and codegen consume the same dispatch table model.',
			},
		],
	},
	{
		slug: 'memory-model',
		title: 'Memory model',
		description: 'References, lifetimes, and safe memory operations.',
		features: [
			{
				slug: 'memory-and-references',
				title: 'Memory and references',
				spec: '/platform-spec/language-meta/memory-model/memory-and-references/',
				status: 'Standard',
				summary:
					'Stack vs heap, borrowing, and invalidation rules keep Beskid memory-safe without a GC for all patterns. Runtime write barriers and GC details are specified under Execution.',
			},
		],
	},
	{
		slug: 'program-structure',
		title: 'Program structure',
		description: 'Modules, paths, and name resolution across compilation units.',
		features: [
			{
				slug: 'modules-and-visibility',
				title: 'Modules and visibility',
				spec: '/platform-spec/language-meta/program-structure/modules-and-visibility/',
				status: 'Standard',
				summary:
					'File layout, `public`/`internal` boundaries, and how packages compose. The driver and package manager use the same module graph the typechecker sees.',
			},
			{
				slug: 'name-resolution',
				title: 'Name resolution',
				spec: '/platform-spec/language-meta/program-structure/name-resolution/',
				status: 'Standard',
				summary:
					'Scopes, imports, and shadowing tie syntax to symbols. Diagnostics for unresolved names must cite these rules verbatim.',
			},
		],
	},
	{
		slug: 'contracts-and-effects',
		title: 'Contracts and effects',
		description: 'Errors, contracts, testing, and observable behavior.',
		features: [
			{
				slug: 'error-handling',
				title: 'Error handling',
				spec: '/platform-spec/language-meta/contracts-and-effects/error-handling/',
				status: 'Standard',
				summary:
					'Representing and propagating failures (`Result`, `try`, unwinding policy). Runtime lowering shares the ABI error envelope described in Execution.',
			},
			{
				slug: 'contracts',
				title: 'Contracts',
				spec: '/platform-spec/language-meta/contracts-and-effects/contracts/',
				status: 'Standard',
				summary:
					'Pre/post/invariant contracts and how they interact with optimization. Tooling may strip or enforce contracts per build mode as specified.',
			},
			{
				slug: 'testing',
				title: 'Testing',
				spec: '/platform-spec/language-meta/contracts-and-effects/testing/',
				status: 'Standard',
				summary:
					'The language-level test harness, discovery, and assertions users rely on. Corelib testing helpers extend but do not redefine these semantics.',
			},
		],
	},
	{
		slug: 'evaluation',
		title: 'Evaluation',
		description: 'Control flow, closures, and events.',
		features: [
			{
				slug: 'control-flow',
				title: 'Control flow',
				spec: '/platform-spec/language-meta/evaluation/control-flow/',
				status: 'Standard',
				summary:
					'Conditionals, loops, and structured control transfer. Lowering to HIR/CLIF follows the evaluation order defined here.',
			},
			{
				slug: 'lambdas-and-closures',
				title: 'Lambdas and closures',
				spec: '/platform-spec/language-meta/evaluation/lambdas-and-closures/',
				status: 'Standard',
				summary:
					'Capture lists, environment layout, and lifetime of delegates. JIT and AOT must agree on closure calling conventions.',
			},
			{
				slug: 'events',
				title: 'Events',
				spec: '/platform-spec/language-meta/evaluation/events/',
				status: 'Standard',
				summary:
					'Multicast events, subscription lifetime, and thread affinity assumptions. UI stacks build on these primitives.',
			},
		],
	},
	{
		slug: 'metaprogramming',
		title: 'Metaprogramming',
		description: 'Compile-time computation and code generation hooks.',
		features: [
			{
				slug: 'metaprogramming',
				title: 'Metaprogramming',
				spec: '/platform-spec/language-meta/metaprogramming/metaprogramming/',
				status: 'Standard',
				summary:
					'Source generators, attributes that drive compiler plug-ins, and scheduling relative to other analyses. The broader generator roadmap may live in guides; v0.1 rules are normative here.',
			},
		],
	},
	{
		slug: 'interop',
		title: 'Interop',
		description: 'Foreign functions and native boundaries.',
		features: [
			{
				slug: 'ffi-and-extern',
				title: 'FFI and extern',
				spec: '/platform-spec/language-meta/interop/ffi-and-extern/',
				status: 'Standard',
				summary:
					'Calling native libraries, marshalling, and safety around unmanaged pointers. ABI details pair with Execution runtime chapters.',
			},
		],
	},
	{
		slug: 'conformance',
		title: 'Conformance',
		description: 'Vocabulary for requirements and implementation quality.',
		features: [
			{
				slug: 'glossary-and-conformance',
				title: 'Glossary and conformance',
				spec: '/platform-spec/language-meta/conformance/glossary-and-conformance/',
				status: 'Standard',
				summary:
					'Defines MUST / SHOULD / MAY usage across all Beskid specifications. Every diagnostic and platform RFC should reference this vocabulary consistently.',
			},
		],
	},
	{
		slug: 'composition',
		title: 'Composition',
		description: 'Dependency injection and host composition for the language-meta composition area.',
		features: [
			{
				slug: 'dependency-injection',
				title: 'Dependency injection hub',
				spec: '/platform-spec/language-meta/composition/dependency-injection/',
				status: 'Standard',
				summary:
					'Native host-based DI: `host`, `launch`, registrations, and lifetimes. This feature page is the canonical specification entry in the platform-spec tree.',
			},
		],
	},
];

/** YAML-safe quoted string (always JSON-style double quotes for generated files). */
function yamlString(s) {
	return JSON.stringify(s);
}

function writeFile(rel, body) {
	const p = path.join(ROOT, rel);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, body, 'utf8');
}

const hubFrontmatter = `---
title: ${yamlString('Language meta')}
description: ${yamlString('User-visible semantics, conformance vocabulary, and how they map to compiler and tooling contracts.')}
template: splash
tableOfContents: false
specLevel: domain
owner:
  name: ${owner.name}
  email: ${owner.email}
submitter:
  name: ${owner.name}
  email: ${owner.email}
---

import SpecPageHeader from '../../../../components/platform-spec/SpecPageHeader.astro';
import SpecSection from '../../../../components/platform-spec/SpecSection.astro';
import DomainTiles from '../../../../components/platform-spec/DomainTiles.astro';

<SpecPageHeader
	ownerName="${owner.name}"
	ownerEmail="${owner.email}"
	submitterName="${owner.name}"
	submitterEmail="${owner.email}"
/>

<SpecSection title="Rationale" id="rationale">
Readers should find **one** authoritative description of what programs *mean*, independent of how the
compiler is structured internally. This domain is the canonical language specification surface under **/platform-spec** and indexes the standard by **area** and **feature**—**ownership** and **how the platform realizes each chapter**—not a backlog or delivery tracker. **Versioning** is **Git** (\`main\` rolling release), not URL segments.
</SpecSection>

<SpecSection title="Background" id="background">
Feature pages in [language-meta](/platform-spec/language-meta/) are canonical for language semantics. Example:
[Dependency injection](/platform-spec/language-meta/composition/dependency-injection/) is maintained directly in this tree. This
domain **lays out** **areas** and **feature** leaves with normative prose and platform metadata. **Components**—functional groupings in the wider platform—can be modeled later (URLs or \`relatedTopics\`); see the [spec bridge](/platform-spec/legacy-spec-mapping/).
</SpecSection>

<DomainTiles pathPrefix="platform-spec/language-meta" heading="Areas" />
`;

writeFile('index.mdx', hubFrontmatter);

for (const area of areas) {
	const areaFm = `---
title: ${yamlString(area.title)}
description: ${yamlString(area.description)}
template: splash
tableOfContents: false
specLevel: area
owner:
  name: ${owner.name}
  email: ${owner.email}
submitter:
  name: ${owner.name}
  email: ${owner.email}
---

import SpecPageHeader from '../../../../../components/platform-spec/SpecPageHeader.astro';
import SpecSection from '../../../../../components/platform-spec/SpecSection.astro';
import DomainTiles from '../../../../../components/platform-spec/DomainTiles.astro';

<SpecPageHeader
	ownerName="${owner.name}"
	ownerEmail="${owner.email}"
	submitterName="${owner.name}"
	submitterEmail="${owner.email}"
/>

<SpecSection title="Scope" id="scope">
${area.description}
</SpecSection>

<DomainTiles pathPrefix="platform-spec/language-meta/${area.slug}" heading="Features" />
`;
	writeFile(`${area.slug}/index.mdx`, areaFm);

	for (const f of area.features) {
		const featPath = `${area.slug}/${f.slug}.mdx`;
		const descShort = `${f.summary.slice(0, 200)}${f.summary.length > 200 ? '…' : ''}`;
		const featBody = `---
title: ${yamlString(f.title)}
description: ${yamlString(descShort)}
template: splash
tableOfContents: false
specLevel: feature
status: ${f.status}
lastReviewed: ${TODAY}
owner:
  name: ${owner.name}
  email: ${owner.email}
submitter:
  name: ${owner.name}
  email: ${owner.email}
relatedTopics:
  - type: Area
    title: ${yamlString(area.title)}
    href: /platform-spec/language-meta/${area.slug}/
    relation: Parent area
  - type: Domain
    title: "Language meta"
    href: /platform-spec/language-meta/
    relation: Parent domain hub
  - type: Domain
    title: "Platform specification"
    href: /platform-spec/
    relation: Cross-cutting index
  - type: Domain
    title: "Execution documentation"
    href: /execution/
    relation: Runtime and backend contracts
---

import SpecPageHeader from '../../../../../components/platform-spec/SpecPageHeader.astro';
import SpecSection from '../../../../../components/platform-spec/SpecSection.astro';

<SpecPageHeader
	status="${f.status}"
	ownerName="${owner.name}"
	ownerEmail="${owner.email}"
	submitterName="${owner.name}"
	submitterEmail="${owner.email}"
/>

## Normative specification

The canonical chapter is **[${f.title}](${f.spec})** in the platform specification.

## Platform view

${f.summary}
`;
		writeFile(featPath, featBody);
	}
}

console.log(`Wrote language-meta tree under ${ROOT}`);
