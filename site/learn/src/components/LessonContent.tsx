import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function LessonContent({ markdown }: { markdown: string }) {
	return (
		<div className="lesson-prose">
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				code({ className, children, ...props }) {
					return className ? (
						<code className={className} {...props}>{children}</code>
					) : <code {...props}>{children}</code>;
				},
			}}
		>
			{markdown}
		</ReactMarkdown>
		</div>
	);
}
