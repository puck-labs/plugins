export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="mb-8 font-bold text-4xl">
          Puck Labs - JSONata Expressions
        </h1>
        <p className="mb-4 text-lg">
          Welcome to the demo application for{" "}
          <code className="font-bold font-mono">@puck-labs/jsonata</code>
        </p>
        <div className="rounded-lg bg-white/10 p-6">
          <h2 className="mb-4 font-semibold text-2xl">Features</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>JSONata expression evaluation for Puck editor</li>
            <li>Static/Dynamic mode switcher for component properties</li>
            <li>Type-safe expression evaluation with runtime validation</li>
            <li>Headless-first architecture with optional styling</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
