import { computeMerkleRoot, verifySchema, ETF_SCHEMA, SUPPLY_CHAIN_SCHEMA } from "./merkle";

// Run with: npx ts-node -e "require('./lib/merkle.test.ts')"

const etfRoot = computeMerkleRoot(ETF_SCHEMA);
console.log("ETF Merkle root:", etfRoot.toString("hex"));

const supplyRoot = computeMerkleRoot(SUPPLY_CHAIN_SCHEMA);
console.log("Supply chain Merkle root:", supplyRoot.toString("hex"));

// Verify that roots are deterministic
const etfRoot2 = computeMerkleRoot(ETF_SCHEMA);
console.assert(etfRoot.equals(etfRoot2), "ETF root should be deterministic");

// Verify that verifySchema works
console.assert(
  verifySchema(ETF_SCHEMA, Array.from(etfRoot)),
  "ETF schema verification should pass"
);

// Verify that tampered fields fail
const tampered = [...ETF_SCHEMA];
tampered[0] = { ...tampered[0], name: "hacked_field" };
console.assert(
  !verifySchema(tampered, Array.from(etfRoot)),
  "Tampered schema should fail verification"
);

console.log("All Merkle tests passed");