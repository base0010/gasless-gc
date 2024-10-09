import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const envPath = path.resolve(__dirname, '../../.env');

/**
 * Function to set or update an environment variable in the .env file
 * @param key - The environment variable key
 * @param value - The value to set
 */
export function setEnvValue(key: string, value: string): void {
  // Read the .env file
  const envFile = fs.readFileSync(envPath, 'utf8');

  // Split the file content into lines
  const lines = envFile.split('\n');

  // Check if the key already exists
  const keyExists = lines.some((line, index) => {
    if (line.startsWith(`${key}=`)) {
      lines[index] = `${key}=${value}`;
      return true;
    }
    return false;
  });

  // If the key does not exist, add it
  if (!keyExists) {
    lines.push(`${key}=${value}`);
  }

  // Write the updated content back to the .env file
  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

  console.log(`Updated ${key} in .env to ${value}`);

  // Reload environment.
  dotenv.config();
}
