#!/usr/bin/env node

/**
 * PR Title Labeler Action
 * Labels PRs based on the title prefix
 */

const { Octokit } = require('@octokit/rest');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    // Get environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const configFilePath =
      process.env.CONFIG_FILE || 'pr-title-labeler-config.yml';
    const eventPath = process.env.GITHUB_EVENT_PATH;
    const repository = process.env.GITHUB_REPOSITORY;

    if (!githubToken) {
      console.error('❌ GITHUB_TOKEN is required');
      process.exit(1);
    }

    if (!eventPath) {
      console.error('❌ GITHUB_EVENT_PATH is required');
      process.exit(1);
    }

    // Read GitHub event data
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const pr = eventData.pull_request;

    if (!pr) {
      console.error('❌ No pull request found in event data');
      process.exit(1);
    }

    // Get config file path from environment variable
    const configPath = path.resolve(__dirname, configFilePath);

    let labelMappings;
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      labelMappings = yaml.load(configContent);
    } catch (error) {
      console.error(
        `❌ Error reading config file "${configFilePath}": ${error.message}`
      );
      process.exit(1);
    }

    const title = pr.title.toLowerCase();

    // Find matching prefix and label
    let label = null;
    for (const mapping of labelMappings) {
      for (const prefix of mapping.prefixes) {
        // Try both with and without colon for flexibility
        const prefixWithColon = `${prefix}:`;
        if (title.startsWith(prefixWithColon)) {
          label = mapping.label;
          console.log(
            `Found prefix "${prefixWithColon}" -> applying label "${label}"`
          );
          break;
        }
      }
      if (label) break;
    }

    // Create GitHub client
    const octokit = new Octokit({
      auth: githubToken
    });

    // Parse repository owner and name
    const [owner, repo] = repository.split('/');

    // Apply label if found
    if (label) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: pr.number,
        labels: [label]
      });

      console.log(`✅ Successfully applied label: ${label}`);
    } else {
      console.log('ℹ️ No matching prefix found in PR title');
      console.log(`PR title: "${title}"`);
      const allPrefixes = labelMappings.flatMap(mapping => mapping.prefixes);
      console.log('Available prefixes:', allPrefixes.join(', '));
    }
  } catch (error) {
    console.error(`❌ Error labeling PR: ${error.message}`);
    process.exit(1);
  }
}

run();
