import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('manifest.webmanifest', 'dist/manifest.webmanifest');
await cp('assets', 'dist/assets', { recursive: true });
await cp('src', 'dist/src', { recursive: true });

console.log('Static app built in dist/');
