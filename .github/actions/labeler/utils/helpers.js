/**
 * Helper utilities for PR Labeler
 * Contains validation and logging functions moved from index.js
 */

const { context } = require('@actions/github');

// Constants
const CONSTANTS = {
  DISPLAY: {
    MAX_FILES_TO_SHOW: 5,
    MAX_FILES_IN_SUMMARY: 3
  },
  ENV: {
    GITHUB_TOKEN: 'GITHUB_TOKEN',
    CONFIG_FILE: 'CONFIG_FILE'
  },
  DEFAULT_CONFIG_FILE: 'labeler-config.yml'
};

/**
 * Validates environment variables and GitHub context
 *
 * @returns {string} The GitHub token for API access
 * @throws {Error} If GITHUB_TOKEN is missing or no PR context is found
 */
function validateEnvironment() {
  const githubToken = process.env[CONSTANTS.ENV.GITHUB_TOKEN];

  if (!githubToken) {
    console.error(
      `❌ Missing ${CONSTANTS.ENV.GITHUB_TOKEN} environment variable`
    );
    process.exit(1);
  }

  if (!context.payload.pull_request) {
    console.error('❌ No pull request found in context');
    process.exit(1);
  }

  return githubToken;
}

/**
 * Loads and validates the labeler configuration
 *
 * @returns {Object} The validated configuration object
 * @throws {Error} If configuration file cannot be loaded or is invalid
 */
function loadAndValidateConfig() {
  const { loadConfiguration, validateConfiguration } = require('./config');
  const configFilePath =
    process.env[CONSTANTS.ENV.CONFIG_FILE] || CONSTANTS.DEFAULT_CONFIG_FILE;
  const config = loadConfiguration(configFilePath);
  validateConfiguration(config);
  return config;
}

/**
 * Logs the current state of labels and changed files
 *
 * @param {Set<string>} currentLabels - Currently applied labels
 * @param {string[]} changedFiles - List of changed files
 */
function logCurrentState(currentLabels, changedFiles) {
  console.log(`🔍 Current labels: [${Array.from(currentLabels).join(', ')}]`);
  console.log(`📁 Changed files: ${changedFiles.length} files`);

  if (changedFiles.length <= CONSTANTS.DISPLAY.MAX_FILES_TO_SHOW) {
    console.log(`   ${changedFiles.join(', ')}`);
  } else {
    console.log(
      `   ${changedFiles.slice(0, CONSTANTS.DISPLAY.MAX_FILES_IN_SUMMARY).join(', ')} and ${changedFiles.length - CONSTANTS.DISPLAY.MAX_FILES_IN_SUMMARY} more`
    );
  }
}

/**
 * Logs title analysis results
 *
 * @param {Object|null} titleLabelInfo - Title label information or null
 */
function logTitleAnalysis(titleLabelInfo) {
  if (titleLabelInfo) {
    const prefix = titleLabelInfo.reason.split('"')[1];
    console.log(
      `🎯 Title analysis: "${titleLabelInfo.label}" (prefix: "${prefix}")`
    );
  } else {
    console.log(`📝 Title analysis: no matching prefix found`);
  }
}

/**
 * Logs file analysis results
 *
 * @param {Object[]} fileLabelInfos - Array of file label information objects
 */
function logFileAnalysis(fileLabelInfos) {
  if (fileLabelInfos.length > 0) {
    console.log(`📁 File analysis: ${fileLabelInfos.length} label(s) found`);
  } else {
    console.log(`📁 File analysis: no matching patterns found`);
  }
}

/**
 * Logs the final completion summary
 *
 * @param {Object|null} titleLabelInfo - Title label information or null
 * @param {Object[]} fileLabelInfos - Array of file label information objects
 */
function logSummary(titleLabelInfo, fileLabelInfos) {
  const finalTargetLabels = [
    ...(titleLabelInfo ? [titleLabelInfo.label] : []),
    ...fileLabelInfos.map(info => info.label)
  ];

  console.log('\n🎉 PR Labeler completed successfully!');
  if (finalTargetLabels.length > 0) {
    console.log(`📌 Final labels: [${finalTargetLabels.join(', ')}]`);
  } else {
    console.log('📌 No labels applied.');
  }
}

module.exports = {
  validateEnvironment,
  loadAndValidateConfig,
  logCurrentState,
  logTitleAnalysis,
  logFileAnalysis,
  logSummary
};
