"use client";

import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import { ExpressionProvider } from "@puck-labs/jsonata";
import { config, initialData } from "./config";

export default function DemoVanillaPage() {
  // Context variables available in JSONata expressions
  const expressionContext = {
    // User data for expressions like: user.name, user.role
    user: {
      name: "John Doe",
      role: "admin",
      email: "john@example.com",
    },

    // App metadata
    appName: "Puck Labs Demo",
    version: "1.0.0",

    // Dynamic values
    currentTime: new Date().toISOString(),
    timestamp: Date.now(),

    // Example data that expressions can reference
    config: {
      theme: "light",
      language: "en",
    },
  };

  return (
    <ExpressionProvider value={expressionContext}>
      <div className="h-screen">
        <Puck config={config} data={initialData} />
      </div>
    </ExpressionProvider>
  );
}
