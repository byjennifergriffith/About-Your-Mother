// Airtable automation script: "Run a script" step.
// Trigger: when a record in Open Opps & Published matches "Publish Guest Page is checked".
//
// Input variables to configure in the automation UI:
//   githubRepo   -> "OWNER/REPO"  (e.g. byjennifergriffith/About-Your-Mother)
//   githubToken  -> fine-grained personal access token with "Contents: Read and write" on that repo
//   recordId     -> Record ID from the trigger step
//
// What it does: calls GitHub's repository_dispatch endpoint, which starts the
// "Build guest pages" workflow. That workflow pulls from this base, builds the
// page, and writes Guest Page URL + Guest Page Status back to the record.

const cfg = input.config();
const table = base.getTable('Open Opps & Published');
const [owner, repo] = String(cfg.githubRepo || '').split('/');

if (!owner || !repo || !cfg.githubToken || cfg.githubToken.startsWith('PASTE')) {
  await table.updateRecordAsync(cfg.recordId, { 'Guest Page Status': { name: 'Error' } });
  throw new Error('githubRepo or githubToken is not configured on this automation step.');
}

const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${cfg.githubToken}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ event_type: 'airtable-publish', client_payload: { recordId: cfg.recordId } }),
});

if (res.status === 204) {
  await table.updateRecordAsync(cfg.recordId, { 'Guest Page Status': { name: 'Build requested' } });
  output.set('status', 'Build requested');
} else {
  const body = await res.text();
  await table.updateRecordAsync(cfg.recordId, { 'Guest Page Status': { name: 'Error' } });
  throw new Error(`GitHub returned ${res.status}: ${body}`);
}
