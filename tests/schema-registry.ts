import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SchemaRegistry } from "../target/types/schema_registry";
import { expect } from "chai";

describe("schema-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SchemaRegistry as Program<SchemaRegistry>;
  const authority = provider.wallet as anchor.Wallet;

  const [registryConfigPda, registryConfigBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

  describe("initialize", () => {
    it("creates a RegistryConfig with correct authority and fee", async () => {
      const feeInLamports = new anchor.BN(1_000_000);

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

  describe("register_schema", () => {
    const namespace = Buffer.alloc(32);
    Buffer.from("hedera.atma.product_event").copy(namespace);

    const merkleRoot = Buffer.alloc(32).fill(0xab);
    const fieldsCid = Buffer.alloc(59).fill(0x01);
    const version = 1;

    const schemaId0 = new anchor.BN(0);
    const [schemaRecordPda0] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("schema"),
          authority.publicKey.toBuffer(),
          schemaId0.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    const schemaId1 = new anchor.BN(1);
    const [schemaRecordPda1] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("schema"),
          authority.publicKey.toBuffer(),
          schemaId1.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    it("registers a schema and increments schema_count", async () => {
      await program.methods
        .registerSchema(
          Array.from(namespace),
          Array.from(merkleRoot),
          Array.from(fieldsCid),
          version
        )
        .accounts({
          authority: authority.publicKey,
          registryConfig: registryConfigPda,
          schemaRecord: schemaRecordPda0,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const schema = await program.account.schemaRecord.fetch(schemaRecordPda0);
      expect(schema.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(schema.schemaId.toNumber()).to.equal(0);
      expect(schema.version).to.equal(1);
      expect(schema.deprecated).to.equal(false);
      expect(Buffer.from(schema.merkleRoot)).to.deep.equal(merkleRoot);
      expect(Buffer.from(schema.namespace)).to.deep.equal(namespace);

      const config = await program.account.registryConfig.fetch(
        registryConfigPda
      );
      expect(config.schemaCount.toNumber()).to.equal(1);
    });

    it("registers a second schema with schema_id 1", async () => {
      await program.methods
        .registerSchema(
          Array.from(namespace),
          Array.from(merkleRoot),
          Array.from(fieldsCid),
          version
        )
        .accounts({
          authority: authority.publicKey,
          registryConfig: registryConfigPda,
          schemaRecord: schemaRecordPda1,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const schema = await program.account.schemaRecord.fetch(schemaRecordPda1);
      expect(schema.schemaId.toNumber()).to.equal(1);

      const config = await program.account.registryConfig.fetch(
        registryConfigPda
      );
      expect(config.schemaCount.toNumber()).to.equal(2);
    });

    it("fails if schema_record PDA does not match schema_id", async () => {
      const wrongId = new anchor.BN(99);
      const [wrongPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("schema"),
          authority.publicKey.toBuffer(),
          wrongId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .registerSchema(
            Array.from(namespace),
            Array.from(merkleRoot),
            Array.from(fieldsCid),
            version
          )
          .accounts({
            authority: authority.publicKey,
            registryConfig: registryConfigPda,
            schemaRecord: wrongPda,
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