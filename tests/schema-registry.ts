import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SchemaRegistry } from "../target/types/schema_registry";
import { expect } from "chai";

describe("schema-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SchemaRegistry as Program<SchemaRegistry>;
  const authority = provider.wallet as anchor.Wallet;

  // Derive the RegistryConfig PDA once — reused across all tests
  const [registryConfigPda, registryConfigBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

  describe("initialize", () => {
    it("creates a RegistryConfig with correct authority and fee", async () => {
      const feeInLamports = new anchor.BN(1_000_000); // 0.001 SOL

      await program.methods
        .initialize(feeInLamports)
        .accounts({
          authority: authority.publicKey,
          registryConfig: registryConfigPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.registryConfig.fetch(
        registryConfigPda
      );

      expect(config.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(config.feeInLamports.toNumber()).to.equal(1_000_000);
      expect(config.schemaCount.toNumber()).to.equal(0);
      expect(config.bump).to.equal(registryConfigBump);
    });

    it("fails if called a second time", async () => {
      try {
        await program.methods
          .initialize(new anchor.BN(999))
          .accounts({
            authority: authority.publicKey,
            registryConfig: registryConfigPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).to.exist;
      }
    });
  });
});