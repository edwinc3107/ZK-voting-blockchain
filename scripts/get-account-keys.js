const hre = require('hardhat');

async function main() {
  const signers = await hre.ethers.getSigners();
  
  // Get accounts 0, 2, 5, 8
  const indices = [0, 2, 5, 8];
  console.log('Hardhat Account Addresses:\n');
  
  for (const index of indices) {
    if (signers[index]) {
      console.log(`Account #${index}: ${signers[index].address}`);
    }
  }
  
  // Note: Hardhat doesn't expose private keys directly
  // These are the standard Hardhat test account private keys:
  console.log('\nStandard Hardhat Private Keys (from documentation):\n');
  console.log('Account #0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266):');
  console.log('  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  console.log('\nAccount #2 (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC):');
  console.log('  0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a');
  console.log('\nAccount #5 (0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc):');
  console.log('  0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba');
  console.log('\nAccount #8 (0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8):');
  console.log('  0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97');
}

main().catch(console.error);

