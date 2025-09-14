#!/usr/bin/env node

/**
 * PR Labeler Action
 * Labels PRs based on both title prefix AND file changes
 *
 * @fileoverview Main entry point for the PR Labeler GitHub Action
 * @author Mateusz Łopaciński
 * @version 1.0.0
 */

const { context, getOctokit } = require('@actions/github');
const {
  validateEnvironment,
  loadAndValidateConfig,
  logCurrentState,
  logTitleAnalysis,
  logFileAnalysis,
  logSummary
} = require('./utils/helpers');
const {
  addLabels,
  getChangedFiles,
  getCurrentLabels,
  removeLabels
} = require('./utils/github');
const {
  determineLabelUpdates,
  findMatchingFileLabels,
  findMatchingTitleLabel
} = require('./utils/labelAnalyzer');

/**
 * Analyzes PR and determines which labels should be added or removed
 *
 * @param {Object} octokit - GitHub API client
 * @param {Object} pr - Pull request object from GitHub context
 * @param {Object} config - Labeler configuration object
 * @returns {Promise<Object>} Analysis results with labels to add/remove
 */
async function analyzePR(octokit, pr, config) {
  // Get current state
  const currentLabels = getCurrentLabels();
  const changedFiles = await getChangedFiles(octokit);

  // Log current state
  logCurrentState(currentLabels, changedFiles);

  // Find labels based on title prefix
  const titleLabelInfo = findMatchingTitleLabel(
    pr.title,
    config.titleMappings || []
  );
  logTitleAnalysis(titleLabelInfo);

  // Find labels based on file changes
  const fileLabelInfos = findMatchingFileLabels(
    changedFiles,
    config.fileMappings || []
  );
  logFileAnalysis(fileLabelInfos);

  // Determine which labels need to be updated
  const { labelsToAdd, labelsToRemove } = determineLabelUpdates(
    currentLabels,
    titleLabelInfo,
    fileLabelInfos,
    config
  );

  return { fileLabelInfos, labelsToAdd, labelsToRemove, titleLabelInfo };
}

/**
 * Applies label changes to the PR (removes outdated, adds new)
 *
 * @param {Object} octokit - GitHub API client
 * @param {string[]} labelsToAdd - Array of labels to add
 * @param {string[]} labelsToRemove - Array of labels to remove
 * @returns {Promise<void>}
 */
async function applyLabelChanges(octokit, labelsToAdd, labelsToRemove) {
  // Remove outdated labels first
  if (labelsToRemove.length > 0) {
    console.log(
      `\n🗑️ Removing ${labelsToRemove.length} outdated label(s): [${labelsToRemove.join(', ')}]`
    );
    await removeLabels(octokit, labelsToRemove);
  }

  // Add new labels
  if (labelsToAdd.length > 0) {
    console.log(
      `\n➕ Adding ${labelsToAdd.length} new label(s): [${labelsToAdd.join(', ')}]`
    );
    await addLabels(octokit, labelsToAdd);
  }
}

/**
 * Main execution function - orchestrates the entire labeling process
 *
 * @returns {Promise<void>}
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
