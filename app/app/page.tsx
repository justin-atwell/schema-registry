"use client";

import dynamic from "next/dynamic";
import { ETF_SCHEMA, SUPPLY_CHAIN_SCHEMA } from "../lib/merkle";
import { ScenarioCard } from "../components/ScenarioCard";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Schema Registry
            </h1>
            <p className="text-xs text-gray-400">
              On-chain semantic interoperability · Solana Devnet
            </p>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
            v0.1 · Local Validator
          </span>
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-3">
          Trustless schema verification for the post-tokenization world
        </h2>
        <p className="text-gray-500 max-w-2xl">
          Data producers publish schema definitions on-chain with a Merkle root
          as a cryptographic fingerprint. AI agents and institutional systems
          verify field definitions trustlessly — no off-chain documentation
          required.
        </p>
      </section>

      {/* Scenario cards */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScenarioCard
            title="Tokenized ETF"
            description="On-chain schema for a tokenized exchange-traded fund. Enables AI agents to interpret NAV, settlement, and issuer data without relying on off-chain docs."
            industry="Institutional Finance"
            fields={ETF_SCHEMA}
            accentColor="#4F46E5"
          />
          <ScenarioCard
            title="Supply Chain Event"
            description="GS1-aligned schema for product custody events. Enables trustless interpretation of provenance data across counterparties and jurisdictions."
            industry="Supply Chain"
            fields={SUPPLY_CHAIN_SCHEMA}
            accentColor="#059669"
          />
        </div>
      </section>
    </main>
  );
}