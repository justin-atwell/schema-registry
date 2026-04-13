"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  SchemaField,
  FieldType,
  computeMerkleRoot,
  verifySchema,
} from "../lib/merkle";
import {
  getProgram,
  getRegistryConfigPda,
  getSchemaRecordPda,
  fetchRegistryConfig,
  fetchSchemaRecord,
} from "../lib/program";

// Step in the demo flow
// Think of this as an enum-driven state machine
type Step =
  | "idle"
  | "registering"
  | "registered"
  | "verifying"
  | "verified"
  | "error";

interface ScenarioCardProps {
  title: string;
  description: string;
  industry: string;
  fields: SchemaField[];
  accentColor: string;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.U64]: "u64",
  [FieldType.I64]: "i64",
  [FieldType.Pubkey]: "Pubkey",
  [FieldType.String]: "String",
  [FieldType.Bool]: "bool",
  [FieldType.Bytes]: "Bytes",
};

export function ScenarioCard({
  title,
  description,
  industry,
  fields,
  accentColor,
}: ScenarioCardProps) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [step, setStep] = useState<Step>("idle");
  const [schemaId, setSchemaId] = useState<number | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  // Compute the Merkle root from the field definitions
  // This happens client-side before sending anything on-chain
  const root = computeMerkleRoot(fields);
  const rootHex = root.toString("hex");

  async function handleRegister() {
    if (!wallet) return;

    try {
      setStep("registering");
      setErrorMsg(null);

      const program = getProgram(wallet, connection);
      const registryConfigPda = getRegistryConfigPda();

      // Fetch current schema count so we know what ID we'll be assigned
      const config = await fetchRegistryConfig(program);
      if (!config) {
        // Registry not initialized yet — initialize it first
        await program.methods
          .initialize(new BN(1_000_000))
          .accounts({
            authority: wallet.publicKey,
            registryConfig: registryConfigPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      // Re-fetch after potential init
      const freshConfig = await fetchRegistryConfig(program);
      const nextId = freshConfig ? freshConfig.schemaCount.toNumber() : 0;
      const schemaRecordPda = getSchemaRecordPda(wallet.publicKey, nextId);

      // Build namespace — pad to 32 bytes
      const namespace = Buffer.alloc(32);
      Buffer.from(title.slice(0, 32)).copy(namespace);

      // Build fields_cid — placeholder for now, 59 bytes
      const fieldsCid = Buffer.alloc(59).fill(0x01);

      const tx = await program.methods
        .registerSchema(
          Array.from(namespace),
          Array.from(root),
          Array.from(fieldsCid),
          1 // version
        )
        .accounts({
          authority: wallet.publicKey,
          registryConfig: registryConfigPda,
          schemaRecord: schemaRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSchemaId(nextId);
      setMerkleRoot(rootHex);
      setTxSignature(tx);
      setStep("registered");
    } catch (e: any) {
      setErrorMsg(e.message ?? "Unknown error");
      setStep("error");
    }
  }

  async function handleVerify() {
    if (!wallet || schemaId === null) return;

    try {
      setStep("verifying");

      const program = getProgram(wallet, connection);
      const schemaRecordPda = getSchemaRecordPda(wallet.publicKey, schemaId);
      const record = await fetchSchemaRecord(program, schemaRecordPda);

      if (!record) {
        setErrorMsg("Schema record not found on chain");
        setStep("error");
        return;
      }

      // The money moment — verify the local field definitions
      // match the Merkle root stored on-chain
      const result = verifySchema(fields, Array.from(record.merkleRoot));
      setVerifyResult(result);
      setStep("verified");
    } catch (e: any) {
      setErrorMsg(e.message ?? "Unknown error");
      setStep("error");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className="px-6 py-5 border-b border-gray-100"
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {industry}
          </span>
          {schemaId !== null && (
            <span className="text-xs text-gray-400 font-mono">
              schema_id: {schemaId}
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {/* Field definitions */}
      <div className="px-6 py-4 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Field Definitions
        </p>
        <div className="space-y-2">
          {fields.map((f) => (
            <div
              key={f.index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-700">{f.name}</span>
                {f.required && (
                  <span className="text-xs text-red-400">required</span>
                )}
              </div>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                {FIELD_TYPE_LABELS[f.fieldType]}
              </span>
            </div>
          ))}
        </div>

        {/* Merkle root preview */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Merkle Root (computed locally)
          </p>
          <p className="font-mono text-xs text-gray-500 break-all">{rootHex}</p>
        </div>
      </div>

      {/* Transaction info */}
      {txSignature && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Transaction
          </p>
          <p className="font-mono text-xs text-gray-500 truncate">
            {txSignature}
          </p>
        </div>
      )}

      {/* Verification result */}
      {step === "verified" && verifyResult !== null && (
        <div
          className={`px-6 py-3 border-t ${
            verifyResult
              ? "bg-emerald-50 border-emerald-100"
              : "bg-red-50 border-red-100"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              verifyResult ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {verifyResult
              ? "✓ Schema verified — on-chain root matches local field definitions"
              : "✗ Verification failed — root mismatch detected"}
          </p>
        </div>
      )}

      {/* Error */}
      {step === "error" && errorMsg && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-100">
          <p className="text-sm text-red-600">{errorMsg}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
        <button
          onClick={handleRegister}
          disabled={!wallet || step === "registering" || step === "verifying"}
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: accentColor }}
        >
          {step === "registering" ? "Registering…" : "Register Schema"}
        </button>

        <button
          onClick={handleVerify}
          disabled={
            !wallet ||
            schemaId === null ||
            step === "registering" ||
            step === "verifying"
          }
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-40"
          style={{
            borderColor: accentColor,
            color: accentColor,
          }}
        >
          {step === "verifying" ? "Verifying…" : "Verify Schema"}
        </button>
      </div>
    </div>
  );
}