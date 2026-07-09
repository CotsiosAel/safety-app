import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const distMainPath = 'dist/src/main.js';
const sourceMainPath = 'src/main.js';

function resolveBuildValue(envNames, fallback) {
  for (const envName of envNames) {
    const value = String(process.env[envName] || '').trim();
    if (value) return value;
  }
  return fallback;
}

function injectSupabaseConfig(source) {
  const supabaseUrl = resolveBuildValue(
    ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
    '__SAFE_ME_SUPABASE_URL__',
  );
  const supabasePublishableKey = resolveBuildValue(
    ['SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'],
    '__SAFE_ME_SUPABASE_PUBLISHABLE_KEY__',
  );

  return source
    .replaceAll("'__SAFE_ME_SUPABASE_URL__'", JSON.stringify(supabaseUrl))
    .replaceAll("'__SAFE_ME_SUPABASE_PUBLISHABLE_KEY__'", JSON.stringify(supabasePublishableKey));
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('manifest.webmanifest', 'dist/manifest.webmanifest');
await cp('sw.js', 'dist/sw.js');
await cp('version.json', 'dist/version.json');
await cp('assets', 'dist/assets', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('src/styles.css', 'dist/src/styles.css');

const mainSource = await readFile(sourceMainPath, 'utf8');
await writeFile(distMainPath, injectSupabaseConfig(mainSource));

console.log('Static app built in dist/');
