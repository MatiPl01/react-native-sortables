/**
 * GitHub API utilities for PR Labeler
 */

const { context } = require('@actions/github');

/**
 * Get current labels on the PR using GitHub context
 */
function getCurrentLabels() {
  try {
    // Get labels directly from the GitHub context
    const labels = context.payload.pull_request.labels || [];
    return new Set(labels.map(label => label.name));
  } catch (error) {
    console.log('⚠️ Could not fetch current labels:', error.message);
    return new Set();
  }
}

/**
 * Get changed files from PR using GitHub API
 */
async function getChangedFiles(octokit) {
  try {
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number
    });

    return files.map(file => file.filename);
  } catch (error) {
    console.log('⚠️ Could not fetch changed files:', error.message);
    return [];
  }
}

/**
 * Add multiple labels to the PR using GitHub SDK
 */
async function addLabels(octokit, labels) {
  if (labels.length === 0) return;

  try {
    await octokit.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      labels: labels
    });
    console.log(`✅ Successfully applied labels: [${labels.join(', ')}]`);
  } catch (error) {
    console.log(
      `⚠️ Could not add labels [${labels.join(', ')}]:`,
      error.message
    );
  }
}

/**
 * Remove multiple labels from the PR using GitHub SDK
 */
async function removeLabels(octokit, labels) {
  if (labels.length === 0) return;

  const removePromises = labels.map(async label => {
    try {
      await octokit.rest.issues.removeLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
        name: label
      });
      console.log(`🗑️ Removed label: ${label}`);
    } catch (error) {
      console.log(`⚠️ Could not remove label ${label}:`, error.message);
    }
  });

  await Promise.all(removePromises);
}

module.exports = {
  getCurrentLabels,
  getChangedFiles,
  addLabels,
  removeLabels
};
