"use client";

import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import { config, initialData } from "./config";

export default function DemoVanillaPage() {
  return (
    <div className="h-screen">
      <Puck config={config} data={initialData} />
    </div>
  );
}
