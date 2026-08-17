import type { LandingSourceLink } from "./landing-sources";

export interface DotNetBullet {
	text: string;
	example?: string;
	sources?: LandingSourceLink[];
}

export const dotnetRightBullets: DotNetBullet[] = [
	{
		text: "Ergonomic APIs and language features that respect daily work.",
		example:
			"LINQ, async/await, records, and pattern matching keep service code readable without ceremony for every line.",
		sources: [
			{
				label: "Language-Integrated Query (LINQ)",
				href: "https://learn.microsoft.com/en-us/dotnet/csharp/linq/",
			},
			{
				label: "Asynchronous programming (async/await)",
				href:
					"https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/",
			},
			{
				label: "Records",
				href:
					"https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record",
			},
			{
				label: "Pattern matching",
				href:
					"https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching",
			},
		],
	},
	{
		text: "Readable syntax with a coherent object model.",
		example:
			"C# reads like intent—properties, namespaces, and nullable reference types are easy to teach and review in PRs.",
		sources: [
			{
				label: "C# programming guide",
				href: "https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/",
			},
			{
				label: "Nullable reference types",
				href: "https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references",
			},
		],
	},
	{
		text: "Developer experience in CLI and tooling is a high bar.",
		example:
			"dotnet CLI, NuGet, project files, test discovery, and first-class Visual Studio / VS Code debugging set expectations Beskid should meet or beat.",
		sources: [
			{
				label: ".NET CLI overview",
				href: "https://learn.microsoft.com/en-us/dotnet/core/tools/",
			},
			{
				label: "NuGet documentation",
				href: "https://learn.microsoft.com/en-us/nuget/",
			},
			{
				label: "Debug with Visual Studio Code",
				href:
					"https://learn.microsoft.com/en-us/dotnet/core/tutorials/debugging-with-visual-studio-code",
			},
		],
	},
];

export const dotnetWrongBullets: DotNetBullet[] = [
	{
		text:
			"Reflection-heavy libraries fight Native AOT instead of compiling cleanly.",
		example:
			"Microsoft's AOT guidance: walking Type graphs (typical of reflection serializers) is not supported—you must know the code at compile time.",
		sources: [
			{
				label: "Introduction to AOT warnings (trim / dynamic code)",
				href:
					"https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/fixing-warnings",
			},
			{
				label: "Creating AOT-compatible libraries (.NET Blog)",
				href:
					"https://devblogs.microsoft.com/dotnet/creating-aot-compatible-libraries/",
			},
			{
				label: "Reflection in Native AOT mode (dotnet/runtime)",
				href:
					"https://github.com/dotnet/runtime/blob/main/src/coreclr/nativeaot/docs/reflection-in-aot-mode.md",
			},
		],
	},
	{
		text: "Incremental source generators became a bottleneck, not a relief.",
		example:
			"Weak generator APIs and pipeline friction push teams back toward runtime reflection when compile-time answers should be native.",
		sources: [
			{
				label:
					"System.Text.Json incremental generator performance (dotnet/runtime#68353)",
				href: "https://github.com/dotnet/runtime/issues/68353",
			},
			{
				label: "VS sluggishness from source generators (dotnet/runtime#56702)",
				href: "https://github.com/dotnet/runtime/issues/56702",
			},
			{
				label: "Incremental generators need short-circuit (dotnet/roslyn#55579)",
				href: "https://github.com/dotnet/roslyn/issues/55579",
			},
		],
	},
	{
		text: "Startup and codegen costs can invert common assumptions.",
		example:
			"One-time source-generated methods can still lose to reflection, because each path pays JIT compile cost on startup.",
		sources: [
			{
				label: "JIT vs one-time source-generated methods (dotnet/runtime#126541)",
				href: "https://github.com/dotnet/runtime/issues/126541",
			},
			{
				label: "Too many methods JITted on startup (dotnet/runtime#85791)",
				href: "https://github.com/dotnet/runtime/issues/85791",
			},
		],
	},
	{
		text: "Native AOT is a late constraint bolted onto a reflection-first stack.",
		example:
			"ASP.NET Native AOT drops or warns on controllers, Razor, session, and other MVC-era surfaces—trim/AOT warnings become a second product.",
		sources: [
			{
				label: "ASP.NET Core support for Native AOT",
				href:
					"https://learn.microsoft.com/en-us/aspnet/core/fundamentals/native-aot",
			},
			{
				label: "Native AOT deployment overview",
				href: "https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/",
			},
		],
	},
	{
		text:
			"Platform features live in Microsoft.Extensions.* layers, not language semantics.",
		example:
			"Dependency injection, hosting, and configuration are framework contracts—not things the compiler can verify as language rules.",
		sources: [
			{
				label: "Dependency injection in ASP.NET Core",
				href:
					"https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection",
			},
			{
				label: "Use dependency injection (.NET extensions)",
				href:
					"https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/usage",
			},
			{
				label: "Generic host configuration",
				href:
					"https://learn.microsoft.com/en-us/dotnet/core/extensions/generic-host",
			},
		],
	},
	{
		text:
			"CIL and VM indirection remain the default tax on performance-sensitive work.",
		example:
			"Even when AOT works, teams inherit decades of abstraction shaped for a different deployment era than edge services and tight CLIs.",
		sources: [
			{
				label: "Managed execution process (CLR)",
				href:
					"https://learn.microsoft.com/en-us/dotnet/standard/managed-execution-process",
			},
			{
				label: "Common Intermediate Language (CIL)",
				href: "https://learn.microsoft.com/en-us/dotnet/standard/managed-code#cil",
			},
			{
				label: "Tiered compilation",
				href:
					"https://learn.microsoft.com/en-us/dotnet/core/runtime-config/compilation",
			},
		],
	},
];
