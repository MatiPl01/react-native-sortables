#!/usr/bin/env node

/**
 * PR Labeler Action
 * Labels PRs based on both title prefix AND file changes
 * This eliminates conflicts between multiple labelers
 */

const { context, getOctokit } = require('@actions/github');
const { loadConfiguration, validateConfiguration } = require('./utils/config');
const {
  addLabels,
  getChangedFiles,
  getCurrentLabels,
  removeLabels
} = require('./utils/github');
const {
  calculateLabelChanges,
  findMatchingFileLabels,
  findMatchingTitleLabel
} = require('./handlers/labeling');

/**
 * Validate environment variables and GitHub context
 */
function validateEnvironment() {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    console.error('❌ Missing GITHUB_TOKEN environment variable');
    process.exit(1);
  }

  if (!context.payload.pull_request) {
    console.error('❌ No pull request found in context');
    process.exit(1);
  }

  return githubToken;
}

/**
 * Load and validate configuration
 */
function loadAndValidateConfig() {
  const configFilePath = process.env.CONFIG_FILE || 'labeler-config.yml';
  const config = loadConfiguration(configFilePath);
  validateConfiguration(config);
  return config;
}

/**
 * Analyze PR and determine label changes
 */
async function analyzePR(octokit, pr, config) {
  // Get current state
  const currentLabels = getCurrentLabels();
  const changedFiles = await getChangedFiles(octokit);

  console.log(`🔍 Current labels: [${Array.from(currentLabels).join(', ')}]`);
  console.log(`📁 Changed files: [${changedFiles.join(', ')}]`);

  // Find labels based on title prefix
  const titleLabelInfo = findMatchingTitleLabel(
    pr.title,
    config.titleMappings || []
  );
  if (titleLabelInfo) {
    console.log(
      `🎯 Found title prefix -> applying label "${titleLabelInfo.label}" (${titleLabelInfo.reason})`
    );
  } else {
    console.log(`📝 No matching title prefix found`);
  }

  // Find labels based on file changes
  const fileLabelInfos = findMatchingFileLabels(
    changedFiles,
    config.fileMappings || []
  );
  console.log(
    `📁 File-based labels: [${fileLabelInfos.map(info => `${info.label} (${info.reason})`).join(', ')}]`
  );

  // Calculate smart label changes
  const { labelsToAdd, labelsToRemove } = calculateLabelChanges(
    currentLabels,
    titleLabelInfo,
    fileLabelInfos,
    config
  );

  return { fileLabelInfos, labelsToAdd, labelsToRemove, titleLabelInfo };
}

/**
 * Apply label changes to the PR
 */
async function applyLabelChanges(octokit, labelsToAdd, labelsToRemove) {
  // Remove outdated labels first
  if (labelsToRemove.length > 0) {
    console.log(
      `🗑️ Removing ${labelsToRemove.length} labels: [${labelsToRemove.join(', ')}]`
    );
    await removeLabels(octokit, labelsToRemove);
  }

  // Add new labels
  if (labelsToAdd.length > 0) {
    console.log(
      `➕ Adding ${labelsToAdd.length} labels: [${labelsToAdd.join(', ')}]`
    );
    await addLabels(octokit, labelsToAdd);
  }
}

/**
 * Log completion summary
 */
function logSummary(titleLabelInfo, fileLabelInfos) {
  const finalTargetLabels = [
    ...(titleLabelInfo ? [titleLabelInfo.label] : []),
    ...fileLabelInfos.map(info => info.label)
  ];

  if (finalTargetLabels.length > 0) {
    console.log(
      `🎉 PR labeler completed! Final labels: [${finalTargetLabels.join(', ')}]`
    );
  } else {
    console.log('🎉 PR labeler completed! No labels to apply.');
  }
}

/**
 * Main execution function
 */
async function run() {
  try {
    // Setup and validation
    const githubToken = validateEnvironment();
    const config = loadAndValidateConfig();
    const pr = context.payload.pull_request;

    console.log(`📝 Processing PR #${pr.number}: "${pr.title}"`);

    // Create GitHub client
    const octokit = getOctokit(githubToken);

    // Analyze PR and determine changes
    const { fileLabelInfos, labelsToAdd, labelsToRemove, titleLabelInfo } =
      await analyzePR(octokit, pr, config);

    // Apply changes
    await applyLabelChanges(octokit, labelsToAdd, labelsToRemove);

    // Summary
    logSummary(titleLabelInfo, fileLabelInfos);
  } catch (error) {
    console.error(`💥 Error labeling PR: ${error.message}`);
    process.exit(1);
  }
}

run();
