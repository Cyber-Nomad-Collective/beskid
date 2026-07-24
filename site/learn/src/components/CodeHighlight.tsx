import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  CodeHighlight                                                      */
/*  Wraps children code blocks with an animated background-color       */
/*  pulse that fires whenever the `active` prop changes.               */
/* ------------------------------------------------------------------ */

export interface CodeHighlightProps {
	children: React.ReactNode;
	active?: boolean;
	language?: string;
	className?: string;
}

export function CodeHighlight({
	children,
	active = false,
	language,
	className,
}: CodeHighlightProps) {
	const [pulse, setPulse] = useState(false);
	const prevActive = useRef(active);

	useEffect(() => {
		if (active !== prevActive.current) {
			setPulse(true);
			const id = setTimeout(() => setPulse(false), 900);
			prevActive.current = active;
			return () => clearTimeout(id);
		}
	}, [active]);

	return (
		<div
			className={clsx("ch-root", className, pulse && "ch-pulse")}
			data-language={language}
		>
			{/* Language badge — only rendered when language is provided */}
			{language && <span className="ch-lang">{language}</span>}

			<pre className="ch-pre">
				<code className={clsx("ch-code", language && `language-${language}`)}>
					{children}
				</code>
			</pre>

			{/* Scoped CSS for the highlight container */}
			<style>{`
        .ch-root {
          position: relative;
          border-radius: 0.75rem;
          background: rgba(12, 20, 44, 0.88);
          border: 1px solid #263c61;
          overflow: hidden;
          transition: background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease;
        }
        .ch-lang {
          position: absolute;
          top: 0.35rem;
          right: 0.65rem;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #7d9ed4;
          background: rgba(20, 40, 80, 0.65);
          border-radius: 4px;
          padding: 0.12rem 0.45rem;
          pointer-events: none;
          user-select: none;
        }
        .ch-pre {
          margin: 0;
          padding: 1rem 1.25rem;
          overflow-x: auto;
          font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
          font-size: 0.88rem;
          line-height: 1.6;
          color: #d6e4ff;
        }
        .ch-code {
          background: transparent;
          display: block;
          white-space: pre;
        }
        .ch-pulse {
          animation: ch-bg-pulse 0.9s ease;
        }
        @keyframes ch-bg-pulse {
          0%   { background-color: rgba(12, 20, 44, 0.88); box-shadow: 0 0 0 0 rgba(96, 156, 255, 0); }
          25%  { background-color: rgba(30, 72, 148, 0.72); box-shadow: 0 0 14px 2px rgba(96, 156, 255, 0.28); }
          100% { background-color: rgba(12, 20, 44, 0.88); box-shadow: 0 0 0 0 rgba(96, 156, 255, 0); }
        }
      `}</style>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  AnimatedLine                                                       */
/*  Single-line variant — renders a numbered gutter + code line with   */
/*  the same pulse behaviour as CodeHighlight.                         */
/* ------------------------------------------------------------------ */

export interface AnimatedLineProps {
	children: React.ReactNode;
	lineNumber?: number;
	active?: boolean;
	language?: string;
	className?: string;
}

export function AnimatedLine({
	children,
	lineNumber,
	active = false,
	language,
	className,
}: AnimatedLineProps) {
	const [pulse, setPulse] = useState(false);
	const prevActive = useRef(active);

	useEffect(() => {
		if (active !== prevActive.current) {
			setPulse(true);
			const id = setTimeout(() => setPulse(false), 900);
			prevActive.current = active;
			return () => clearTimeout(id);
		}
	}, [active]);

	return (
		<div
			className={clsx("al-root", className, pulse && "al-pulse")}
			data-language={language}
		>
			{/* Numbered gutter */}
			<span className="al-gutter" aria-hidden="true">
				{lineNumber != null ? String(lineNumber).padStart(3, " ") : " · "}
			</span>

			<pre className="al-pre">
				<code className={clsx("al-code", language && `language-${language}`)}>
					{children}
				</code>
			</pre>

			<style>{`
        .al-root {
          display: flex;
          align-items: stretch;
          border-radius: 0.4rem;
          background: rgba(12, 20, 44, 0.72);
          border: 1px solid transparent;
          overflow: hidden;
          transition: background-color 0.6s ease, border-color 0.6s ease;
        }
        .al-gutter {
          flex-shrink: 0;
          width: 2.6rem;
          padding: 0.4rem 0.5rem;
          text-align: right;
          font-family: "JetBrains Mono", "Fira Code", monospace;
          font-size: 0.78rem;
          color: #4e6288;
          background: rgba(18, 30, 58, 0.55);
          border-right: 1px solid #263c61;
          user-select: none;
        }
        .al-pre {
          margin: 0;
          padding: 0.4rem 0.75rem;
          overflow-x: auto;
          font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
          font-size: 0.88rem;
          line-height: 1.55;
          color: #d6e4ff;
          flex: 1;
        }
        .al-code {
          background: transparent;
          display: block;
          white-space: pre;
        }
        .al-pulse {
          animation: al-bg-pulse 0.9s ease;
        }
        @keyframes al-bg-pulse {
          0%   { background-color: rgba(12, 20, 44, 0.72); border-color: transparent; }
          30%  { background-color: rgba(42, 88, 168, 0.58); border-color: rgba(120, 180, 255, 0.5); }
          100% { background-color: rgba(12, 20, 44, 0.72); border-color: transparent; }
        }
      `}</style>
		</div>
	);
}
