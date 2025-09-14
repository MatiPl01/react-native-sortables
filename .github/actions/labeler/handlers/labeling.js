/**
 * Labeling logic for PR Labeler
 * Handles both title-based and file-based labeling
 */

/**
 * Find matching label based on PR title prefix
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
 * Find matching labels based on file changes
 */
function findMatchingFileLabels(changedFiles, fileMappings) {
  const matchingLabels = [];

  for (const mapping of fileMappings) {
    const label = mapping.label;
    const patterns = mapping.patterns || [];

    for (const pattern of patterns) {
      // More precise pattern matching
      const matches = changedFiles.filter(file => {
        // Handle directory patterns (ending with /)
        if (pattern.endsWith('/')) {
          return file.startsWith(pattern);
        }
        // Handle file patterns (containing dots or specific files)
        if (pattern.includes('.')) {
          return file.includes(pattern);
        }
        // Handle directory patterns without trailing slash
        return file.startsWith(pattern + '/') || file === pattern;
      });

      if (matches.length > 0) {
        matchingLabels.push({
          label: label,
          source: 'files',
          reason: `file pattern "${pattern}" matches [${matches.join(', ')}]`
        });
        console.log(`📁 File pattern "${pattern}" matches [${matches.join(', ')}] -> adding label "${label}"`);
      }
    }
  }

  return matchingLabels;
}

/**
 * Smart label management - determines which labels to add/remove
 */
function calculateLabelChanges(currentLabels, titleLabelInfo, fileLabelInfos, config) {
  const labelsToAdd = [];
  const labelsToRemove = [];

  // Get all configured labels by source
  const titleConfiguredLabels = new Set((config.titleMappings || []).map(m => m.label));
  const fileConfiguredLabels = new Set((config.fileMappings || []).map(m => m.label));
  const allConfiguredLabels = new Set([...titleConfiguredLabels, ...fileConfiguredLabels]);

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

  console.log(`🎯 Target labels: ${Array.from(targetLabels.entries()).map(([label, info]) => `${label} (${info.source}: ${info.reason})`).join(', ')}`);

  // Determine labels to add (not currently present)
  for (const [label, info] of targetLabels) {
    if (!currentLabels.has(label)) {
      labelsToAdd.push(label);
      console.log(`➕ Will add: ${label} (${info.source}: ${info.reason})`);
    } else {
      console.log(`✅ Already present: ${label} (${info.source}: ${info.reason})`);
    }
  }

  // Determine labels to remove (currently present but no longer needed)
  for (const currentLabel of currentLabels) {
    if (allConfiguredLabels.has(currentLabel)) {
      if (!targetLabels.has(currentLabel)) {
        // This label is configured but no longer needed
        labelsToRemove.push(currentLabel);
        console.log(`🗑️ Will remove: ${currentLabel} (no longer needed)`);
      } else {
        const targetInfo = targetLabels.get(currentLabel);
        console.log(`✅ Keeping: ${currentLabel} (${targetInfo.source}: ${targetInfo.reason})`);
      }
    } else {
      console.log(`🔒 Preserving: ${currentLabel} (not managed by this labeler)`);
    }
  }

  return { labelsToAdd, labelsToRemove };
}

module.exports = {
  findMatchingTitleLabel,
  findMatchingFileLabels,
  calculateLabelChanges
};
