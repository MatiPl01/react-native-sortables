#!/usr/bin/env node

/**
 * Custom PR Title Labeler Script
 * Labels PRs based on title prefixes using the labels available in the repository
 */

const { context, github } = require('@actions/github');

// Title prefix mappings based on available repository labels
const PREFIX_MAPPINGS = {
  'feat:': 'feature',
  'feature:': 'feature',
  'fix:': 'fix',
  'bugfix:': 'bug',
  'docs:': 'documentation',
  'doc:': 'documentation',
  'style:': 'cleanup',
  'format:': 'cleanup',
  'refactor:': 'refactor',
  'perf:': 'performance',
  'performance:': 'performance',
  'test:': 'test',
  'tests:': 'test',
  'chore:': 'chore',
  'build:': 'chore',
  'ci:': 'ci',
  'deps:': 'dependencies',
  'dependencies:': 'dependencies',
  'example:': 'example',
  'demo:': 'example',
  'enhancement:': 'enhancement',
  'critical:': 'critical',
  'released:': 'released'
};

(async () => {
  try {
    const title = context.payload.pull_request.title.toLowerCase();

    // Find matching prefix and label
    let label = null;
    for (const [prefix, mappedLabel] of Object.entries(PREFIX_MAPPINGS)) {
      if (title.startsWith(prefix)) {
        label = mappedLabel;
        console.log(`Found prefix "${prefix}" -> applying label "${label}"`);
        break;
      }
    }

    // Apply label if found
    if (label) {
      await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
        labels: [label]
      });

      console.log(`✅ Successfully applied label: ${label}`);
    } else {
      console.log('ℹ️ No matching prefix found in PR title');
      console.log(`PR title: "${title}"`);
      console.log(
        'Available prefixes:',
        Object.keys(PREFIX_MAPPINGS).join(', ')
      );
    }
  } catch (error) {
    console.error('❌ Error labeling PR:', error.message);
    process.exit(1);
  }
})();
