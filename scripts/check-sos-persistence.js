import { readFile } from 'node:fs/promises';

const source = await readFile('src/main.js', 'utf8');

const requiredPatterns = [
  ['ended session tombstone storage key', "endedSosSession: 'safety-app-ended-sos-session'"],
  ['legacy active SOS storage cleanup', 'function clearLegacyActiveSosStorage()'],
  ['restore gate defaults inactive for ended sessions', 'function shouldRestoreActiveSosSession(session)'],
  ['central runtime cleanup stops live tracking', 'function clearActiveSosRuntimeState('],
  ['end flow marks backend sessions ended', ".update({ status: 'ended', ended_at: now, updated_at: now })"],
  ['pull-to-refresh blocks active SOS reloads', "if (isActiveSosInProgress())"],
];

for (const [label, pattern] of requiredPatterns) {
  if (!source.includes(pattern)) {
    console.error(`Missing SOS persistence safeguard: ${label}`);
    process.exit(1);
  }
}

const loadSupabaseStart = source.indexOf('async function loadSupabaseData()');
const loadSupabaseEnd = source.indexOf('async function handleAuthSubmit', loadSupabaseStart);
const loadSupabaseBody = source.slice(loadSupabaseStart, loadSupabaseEnd);

if (!loadSupabaseBody.includes('shouldRestoreActiveSosSession(restoredActiveSosSession)')) {
  console.error('Supabase/account loading must gate active SOS restore through shouldRestoreActiveSosSession().');
  process.exit(1);
}

const endFlowStart = source.indexOf('async function endActiveSosSession()');
const endFlowEnd = source.indexOf('function formatCheckInDateTime', endFlowStart);
const endFlowBody = source.slice(endFlowStart, endFlowEnd);

for (const pattern of ['markSosSessionEnded(endingSession', 'stopActiveSosLocationAutoUpdate()', 'clearActiveSosRuntimeState({']) {
  if (!endFlowBody.includes(pattern)) {
    console.error(`End SOS flow is missing required cleanup call: ${pattern}`);
    process.exit(1);
  }
}

console.log('SOS persistence regression safeguards are present.');
