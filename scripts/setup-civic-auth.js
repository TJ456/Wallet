// Setup script for Civic Auth integration

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up Civic Auth integration...');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file with Civic configuration placeholders...');
  
  const envContent = `# Civic Auth Configuration
CIVIC_GATEKEEPER_NETWORK=your_gatekeeper_network
CIVIC_AUTH_BASE_URL=https://auth.civic.com
CIVIC_AUTH_STAGING_URL=https://staging.auth.civic.com

# Add your other environment variables below
`;
  
  fs.writeFileSync(envPath, envContent);
} else {
  console.log('Updating existing .env file with Civic configuration...');
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('CIVIC_GATEKEEPER_NETWORK')) {
    envContent += `\n# Civic Auth Configuration
CIVIC_GATEKEEPER_NETWORK=your_gatekeeper_network
CIVIC_AUTH_BASE_URL=https://auth.civic.com
CIVIC_AUTH_STAGING_URL=https://staging.auth.civic.com
`;
    
    fs.writeFileSync(envPath, envContent);
  }
}

// Install Civic dependencies
console.log('Installing Civic dependencies...');
try {
  execSync('npm install @civic/civic-pass-api @civic/solana-gateway-react @civic/auth-client-web3 @civic/profile', { stdio: 'inherit' });
  console.log('Civic dependencies installed successfully!');
} catch (error) {
  console.error('Failed to install Civic dependencies:', error);
  process.exit(1);
}

console.log('\nCivic Auth setup completed!');
console.log('\nNext steps:');
console.log('1. Update your .env file with your actual Civic credentials');
console.log('2. Deploy the Civic contracts with: npx hardhat run scripts/deploy-civic.js --network yournetwork');
console.log('3. Import the CivicAuth component in your React components to start using it');
console.log('\nRefer to CIVIC_INTEGRATION.md for complete documentation');
