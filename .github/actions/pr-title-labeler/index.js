#!/usr/bin/env node

/**
 * PR Title Labeler Action
 * Labels PRs based on the title prefix
 */

const { context, github } = require('@actions/github');
const core = require('@actions/core');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    // Get config file path from input
    const configFilePath = core.getInput('config-file');
    const configPath = path.resolve(__dirname, configFilePath);

    let labelMappings;
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      labelMappings = yaml.load(configContent);
    } catch (error) {
      core.setFailed(
        `Error reading config file "${configFilePath}": ${error.message}`
      );
      return;
    }

    const title = context.payload.pull_request.title.toLowerCase();

    // Find matching prefix and label
    let label = null;
    for (const mapping of labelMappings) {
      for (const prefix of mapping.prefixes) {
        // Try both with and without colon for flexibility
        const prefixWithColon = `${prefix}:`;
        if (title.startsWith(prefixWithColon)) {
          label = mapping.label;
          core.info(
            `Found prefix "${prefixWithColon}" -> applying label "${label}"`
          );
          break;
        }
      }
      if (label) break;
    }

    // Apply label if found
    if (label) {
      await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
        labels: [label]
      });

      core.info(`✅ Successfully applied label: ${label}`);
    } else {
      core.info('ℹ️ No matching prefix found in PR title');
      core.info(`PR title: "${title}"`);
      const allPrefixes = labelMappings.flatMap(mapping => mapping.prefixes);
      core.info('Available prefixes:', allPrefixes.join(', '));
    }
  } catch (error) {
    core.setFailed(`❌ Error labeling PR: ${error.message}`);
  }
}

run();
