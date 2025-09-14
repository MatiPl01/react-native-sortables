/**
 * Label analysis utilities for PR Labeler
 * Analyzes PR content to determine which labels should be applied
 *
 * @fileoverview Utilities for analyzing PR titles and file changes to determine labels
 * @author Mateusz Łopaciński
 * @version 1.0.0
 */

const { minimatch } = require('minimatch');

// Constants
const CONSTANTS = {
  DISPLAY: {
    MAX_FILES_IN_SUMMARY: 3,
    SEPARATOR_LENGTH: 50
  },
  MINIMATCH_OPTIONS: {
    dot: true, // Match files starting with dots
    matchBase: true, // Match basename if no slashes in pattern
    noglobstar: false // Allow ** patterns
  }
};

/**
 * Finds matching label based on PR title prefix
 *
 * @param {string} title - The PR title to analyze
 * @param {Object[]} titleMappings - Array of title mapping configurations
 * @returns {Object|null} Label information object or null if no match found
 */
function findMatchingTitleLabel(title, titleMappings) {
  const normalizedTitle = title.toLowerCase();

  for (const mapping of titleMappings) {
    for (const prefix of mapping.prefixes) {
      const prefixWithColon = `${prefix}:`;
      if (normalizedTitle.startsWith(prefixWithColon)) {
        return {
          label: mapping.label,
          source: 'title',
          reason: `title prefix "${prefix}"`
        };
      }
    }
  }

  return null;
}

/**
 * Finds matching labels based on file changes using glob patterns
 *
 * @param {string[]} changedFiles - Array of changed file paths
 * @param {Object[]} fileMappings - Array of file mapping configurations
 * @returns {Object[]} Array of label information objects
 */
function findMatchingFileLabels(changedFiles, fileMappings) {
  const matchingLabels = [];
  const labelMatches = new Map(); // label -> { allMatches, allPatterns }

  for (const mapping of fileMappings) {
    const label = mapping.label;
    const patterns = mapping.patterns || [];

    for (const pattern of patterns) {
      const matches = changedFiles.filter(file => {
        return matchesPattern(file, pattern);
      });

      if (matches.length > 0) {
        if (!labelMatches.has(label)) {
          labelMatches.set(label, {
            allMatches: new Set(),
            allPatterns: []
          });
        }

        const labelInfo = labelMatches.get(label);
        matches.forEach(match => labelInfo.allMatches.add(match));
        labelInfo.allPatterns.push(pattern);
      }
    }
  }

  // Convert to final format, deduplicating matches
  for (const [label, info] of labelMatches) {
    matchingLabels.push({
      label: label,
      source: 'files',
      reason: `file patterns [${info.allPatterns.join(', ')}] match [${Array.from(info.allMatches).join(', ')}]`
    });
  }

  return matchingLabels;
}

/**
 * Formats reason for display in a more readable way
 *
 * @param {string} source - The source of the label ('title' or 'files')
 * @param {string} reason - The raw reason string
 * @returns {string} Formatted reason string for display
 */
function formatReason(source, reason) {
  if (source === 'title') {
    return `title prefix "${reason.split('"')[1]}"`;
  } else if (source === 'files') {
    // Extract pattern and file count from reason
    const match = reason.match(/file patterns \[([^\]]+)\] match \[([^\]]+)\]/);
    if (match) {
      const patterns = match[1];
      const files = match[2].split(', ');
      const fileCount = files.length;
      const fileList =
        fileCount <= CONSTANTS.DISPLAY.MAX_FILES_IN_SUMMARY
          ? files.join(', ')
          : `${files.slice(0, CONSTANTS.DISPLAY.MAX_FILES_IN_SUMMARY).join(', ')} and ${fileCount - CONSTANTS.DISPLAY.MAX_FILES_IN_SUMMARY} more`;
      return `files (${patterns}): ${fileList}`;
    }
    return reason;
  }
  return reason;
}

/**
 * Checks if a file matches a given pattern using minimatch
 *
 * @param {string} file - The file path to check
 * @param {string} pattern - The glob pattern to match against
 * @returns {boolean} True if the file matches the pattern, false otherwise
 */
function matchesPattern(file, pattern) {
  try {
    return minimatch(file, pattern, CONSTANTS.MINIMATCH_OPTIONS);
  } catch (error) {
    console.warn(`⚠️ Invalid pattern: ${pattern} - ${error.message}`);
    return false;
  }
}

/**
 * Determines which labels should be added or removed based on current state
 *
 * @param {Set<string>} currentLabels - Currently applied labels
 * @param {Object|null} titleLabelInfo - Title label information or null
 * @param {Object[]} fileLabelInfos - Array of file label information objects
 * @param {Object} config - Configuration object
 * @returns {Object} Object containing labelsToAdd and labelsToRemove arrays
 */
function determineLabelUpdates(
  currentLabels,
  titleLabelInfo,
  fileLabelInfos,
  config
) {
  const labelsToAdd = [];
  const labelsToRemove = [];

  // Get all configured labels by source
  const titleConfiguredLabels = new Set(
    (config.titleMappings || []).map(m => m.label)
  );
  const fileConfiguredLabels = new Set(
    (config.fileMappings || []).map(m => m.label)
  );
  const allConfiguredLabels = new Set([
    ...titleConfiguredLabels,
    ...fileConfiguredLabels
  ]);

  // Determine what labels should be present and why
  const targetLabels = new Map(); // label -> { source, reason }

  // Add title-based label
  if (titleLabelInfo) {
    targetLabels.set(titleLabelInfo.label, {
      source: titleLabelInfo.source,
      reason: titleLabelInfo.reason
    });
  }

  // Add file-based labels
  for (const fileLabelInfo of fileLabelInfos) {
    targetLabels.set(fileLabelInfo.label, {
      source: fileLabelInfo.source,
      reason: fileLabelInfo.reason
    });
  }

  // Determine labels to add (not currently present)
  for (const [label, info] of targetLabels) {
    if (!currentLabels.has(label)) {
      labelsToAdd.push(label);
    }
  }

  // Determine labels to remove (currently present but no longer needed)
  for (const currentLabel of currentLabels) {
    if (allConfiguredLabels.has(currentLabel)) {
      if (!targetLabels.has(currentLabel)) {
        // This label is configured but no longer needed
        labelsToRemove.push(currentLabel);
      }
    }
  }

  // Log summary in a clean format
  console.log('\n📋 Label Summary:');
  console.log('─'.repeat(CONSTANTS.DISPLAY.SEPARATOR_LENGTH));

  if (labelsToAdd.length > 0) {
    console.log('➕ Labels to add:');
    for (const label of labelsToAdd) {
      const info = targetLabels.get(label);
      const reason = formatReason(info.source, info.reason);
      console.log(`   • ${label} - ${reason}`);
    }
  }

  if (labelsToRemove.length > 0) {
    console.log('🗑️ Labels to remove:');
    for (const label of labelsToRemove) {
      console.log(`   • ${label} - no longer needed`);
    }
  }

  const keepingLabels = Array.from(currentLabels).filter(
    label => allConfiguredLabels.has(label) && targetLabels.has(label)
  );

  if (keepingLabels.length > 0) {
    console.log('✅ Labels to keep:');
    for (const label of keepingLabels) {
      const info = targetLabels.get(label);
      const reason = formatReason(info.source, info.reason);
      console.log(`   • ${label} - ${reason}`);
    }
  }

  console.log('─'.repeat(CONSTANTS.DISPLAY.SEPARATOR_LENGTH));

  return { labelsToAdd, labelsToRemove };
}

module.exports = {
  findMatchingTitleLabel,
  findMatchingFileLabels,
  determineLabelUpdates
};
