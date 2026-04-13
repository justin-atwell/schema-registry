import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN, setProvider } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../../target/idl/schema_registry.json";

// This is the TypeScript type generated from your Rust program
// It gives you full type safety on all instructions and accounts
export type SchemaRegistryProgram = Program<typeof idl>;

export const PROGRAM_ID = new PublicKey(idl.address);

// Factory function — think of this like a typed service locator
// Pass in the wallet and connection from React hooks,
// get back a fully configured program client
export function getProgram(
  wallet: AnchorWallet,
  connection: Connection
): SchemaRegistryProgram {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  setProvider(provider);
  return new Program(idl as any, provider) as SchemaRegistryProgram;
}

// Derive the RegistryConfig PDA
// Same seeds as the Rust program: ["registry"]
export function getRegistryConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    PROGRAM_ID
  );
  return pda;
}

// Derive a SchemaRecord PDA
// Seeds: ["schema", authority_pubkey, schema_id_le_bytes]
export function getSchemaRecordPda(
  authority: PublicKey,
  schemaId: number
): PublicKey {
  const idBuffer = Buffer.alloc(8);
  new BN(schemaId).toArrayLike(Buffer, "le", 8).copy(idBuffer);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("schema"), authority.toBuffer(), idBuffer],
    PROGRAM_ID
  );
  return pda;
}

// Fetch a schema record and return it in a friendly shape
export async function fetchSchemaRecord(
  program: SchemaRegistryProgram,
  pda: PublicKey
) {
  try {
    return await program.account.schemaRecord.fetch(pda);
  } catch {
    return null;
  }
}

// Fetch the registry config
export async function fetchRegistryConfig(
  program: SchemaRegistryProgram,
) {
  const pda = getRegistryConfigPda();
  try {
    return await program.account.registryConfig.fetch(pda);
  } catch {
    return null;
  }
}