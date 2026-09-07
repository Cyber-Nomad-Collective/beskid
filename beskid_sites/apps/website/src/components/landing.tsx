/**
 * Landing page — the consumer-facing homepage.
 *
 * A focused React port of the Astro `LandingTemplate` hero + principles
 * section. The full Astro landing carried large data tables (compare rows,
 * .NET bullets, tile sections); those are trimmed to the high-signal hero
 * and the six Beskid principles, which is what a first-time visitor needs.
 * The book and blog carry the long-form argument.
 */

import { Link } from "@tanstack/react-router";

const PRINCIPLES: { title: string; body: string }[] = [
	{
		title: "Language features stay in the language",
		body:
			"Dependency injection, metaprogramming, and other cross-cutting concerns belong in semantics and the compiler—not as opaque layers in a runtime-shaped core library.",
	},
	{
		title: "Compile-time over reflection",
		body:
			"Prefer verifiable build-time analysis and codegen over runtime inspection and fragile incremental generator APIs that slow you down when you need answers from the compiler.",
	},
	{
		title: "Native direction, not a CIL detour",
		body:
			"Target efficient machine code with AOT as a clear path from the start—escape the overhead and late-stage surprises of a virtual machine and intermediate language stack.",
	},
	{
		title: "Built for daily driving",
		body:
			"Services, CLIs, and internal tools—the code you ship every week, not just kernels and firmware. Beskid is for the work that actually pays the bills.",
	},
	{
		title: "One obvious way",
		body:
			"A single canonical path through each problem, documented in a normative spec, instead of five overlapping framework patterns that disagree at the patch level.",
	},
	{
		title: "Honest by default",
		body:
			"Truncation is honesty. The spec, the tracker, and the CI gate say what is done, what is truncated, and what is a stub—so you can trust the green build.",
	},
];

export function Landing() {
	return (
		<div className="beskid-landing">
			<section className="beskid-landing__hero">
				<p className="beskid-landing__eyebrow">Beskid</p>
				<h1 className="beskid-landing__title">
					A language and platform built for the code you ship every day.
				</h1>
				<p className="beskid-landing__tagline">
					Readable semantics, compile-time power, and native output—without
					reflection, IL, and core-library features pretending to be the language.
				</p>
				<p className="beskid-landing__subtagline">
					Beskid is a statically typed, AOT-first language for services, CLIs, and
					teams that outgrew .NET's abstraction stack.
				</p>
				<div className="beskid-landing__actions">
					<Link to="/downloads" className="beskid-btn beskid-btn--primary">
						Download
					</Link>
					<Link to="/book" className="beskid-btn beskid-btn--ghost">
						Read the book
					</Link>
					<Link to="/blog" className="beskid-btn beskid-btn--ghost">
						Blog
					</Link>
				</div>
			</section>

			<section
				className="beskid-landing__section"
				id="why-beskid"
				aria-labelledby="why-beskid-title"
			>
				<h2 className="beskid-landing__section-title" id="why-beskid-title">
					The Beskid Principle
				</h2>
				<p className="beskid-landing__section-lead">
					Six commitments that follow from auditing the industry stack—not marketing
					pillars, but how Beskid is supposed to behave as a language and platform.
				</p>
				<div className="beskid-features">
					{PRINCIPLES.map((feature) => (
						<div key={feature.title} className="beskid-feature">
							<h3>{feature.title}</h3>
							<p>{feature.body}</p>
						</div>
					))}
				</div>
			</section>

			<section
				className="beskid-landing__section"
				aria-labelledby="start-here-title"
			>
				<h2 className="beskid-landing__section-title" id="start-here-title">
					Start here
				</h2>
				<p className="beskid-landing__section-lead">
					The Beskid Book is the practical introduction. Begin with why the language
					exists, then install and try it.
				</p>
				<div className="beskid-features">
					<Link
						to="/book/$"
						params={{ _splat: "00-why-beskid-exists" }}
						className="beskid-feature"
					>
						<h3>Why Beskid exists →</h3>
						<p>
							Opinionated context for the language—why the industry stack is broken and
							what Beskid refuses to repeat.
						</p>
					</Link>
					<Link
						to="/book/$"
						params={{ _splat: "01-it-works-on-my-machine" }}
						className="beskid-feature"
					>
						<h3>It works on my machine →</h3>
						<p>
							Install the CLI, run your first Beskid program, and verify the toolchain.
						</p>
					</Link>
					<Link to="/downloads" className="beskid-feature">
						<h3>Downloads →</h3>
						<p>
							Install scripts, packages, and container images for every supported
							platform.
						</p>
					</Link>
				</div>
			</section>
		</div>
	);
}
