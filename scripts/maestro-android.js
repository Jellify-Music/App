const { execSync,exec } = require('child_process');
const path = require('path');

// Read arguments from CLI
const [, , serverAddress, username] = process.argv;


if (!serverAddress || !username) {
  console.error('Usage: node runMaestro.js <server_address> <username>');
  process.exit(1);
}

try {
// Set environment variable and build command
const MAESTRO_PATH = path.join(process.env.HOME, '.maestro', 'bin', 'maestro');
const FLOW_PATH = './maestro-tests/flow.yaml';

const command = `maestro test ${FLOW_PATH} \
  --env server_address=${serverAddress} \
  --env username=${username}`;
execSync("adb install android/app/app-x86-release.apk", { stdio: 'inherit', env: process.env });
exec("adb shell screenrecord /sdcard/screen.mp4", { stdio: 'inherit', env: process.env,detached: true, }).unref();

const output = execSync(command, { stdio: 'inherit', env: process.env });
console.log('✅ Maestro test completed');
console.log(output);


} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
finally{
    execSync('adb pull /sdcard/screen.mp4', {stdio: 'inherit'});
    execSync('pwd', {stdio: 'inherit'});
}