import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const allowedTextExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.txt',
]);
const allowedFilenames = new Set(['.gitignore']);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...await collectFiles(join(directory, entry.name)));
      }
      continue;
    }

    if (entry.isFile()) files.push(join(directory, entry.name));
  }

  return files;
}

function getExtension(filePath) {
  const extensionStart = filePath.lastIndexOf('.');
  return extensionStart === -1 ? '' : filePath.slice(extensionStart).toLowerCase();
}

function isBinary(buffer) {
  return buffer.includes(0);
}

const files = await collectFiles('.');
const unsupportedFiles = [];

for (const file of files) {
  const buffer = await readFile(file);
  const extension = getExtension(file);

  if (isBinary(buffer) || !(allowedTextExtensions.has(extension) || allowedFilenames.has(file))) {
    unsupportedFiles.push(file);
  }
}

if (unsupportedFiles.length > 0) {
  console.error('Binary or unsupported non-text files are not allowed in this PR:');
  for (const file of unsupportedFiles) console.error(`- ${file}`);
  process.exit(1);
}

console.log('All tracked app files are text/code files.');
