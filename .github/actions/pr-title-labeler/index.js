#!/usr/bin/env node

/**
 * PR Title Labeler Action
 * Labels PRs based on the title prefix
 */

const { Octokit } = require('@octokit/rest');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

/**
 * Get labels that were likely added by this action using a conservative approach
 * Since we can't rely on persistent storage, we'll use a smart heuristic:
 * 1. Only consider labels that are in our configuration
 * 2. Only consider labels added by GitHub Actions recently
 * 3. Be conservative - only remove when we're confident
 */
async function getLabelsAddedByAction(
  octokit,
  owner,
  repo,
  issueNumber,
  labelMappings
) {
  try {
    const events = await octokit.rest.issues.listEvents({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100
    });

    const labelsAddedByAction = new Set();
    const configuredLabels = new Set(
      labelMappings.map(mapping => mapping.label)
    );

    console.log(
      `🔍 Checking ${events.data.length} events for labels added by this action...`
    );
    console.log(
      `📋 Configured labels: [${Array.from(configuredLabels).join(', ')}]`
    );

    // Look for "labeled" events that were created by GitHub Actions
    for (const event of events.data) {
      if (event.event === 'labeled' && event.label?.name) {
        const actorLogin = event.actor?.login;

        console.log(
          `📋 Found labeled event: "${event.label.name}" by "${actorLogin || 'unknown'}"`
        );

        // Conservative approach: only consider labels that:
        // 1. Are in our configuration (could have been added by this action)
        // 2. Were added by GitHub Actions bot
        if (
          actorLogin === 'github-actions[bot]' &&
          configuredLabels.has(event.label.name)
        ) {
          labelsAddedByAction.add(event.label.name);
          console.log(
            `✅ Added "${event.label.name}" to action-added labels (configured + GitHub Actions)`
          );
        }
      }
    }

    console.log(
      `📊 Labels added by this action: [${Array.from(labelsAddedByAction).join(', ')}]`
    );
    return labelsAddedByAction;
  } catch (error) {
    console.log('⚠️ Could not fetch issue events:', error.message);
    return new Set();
  }
}

/**
 * Get current labels on the PR
 */
async function getCurrentLabels(octokit, owner, repo, issueNumber) {
  try {
    const response = await octokit.rest.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number: issueNumber
    });
    return new Set(response.data.map(label => label.name));
  } catch (error) {
    console.log('⚠️ Could not fetch current labels:', error.message);
    return new Set();
  }
}

/**
 * Find matching label based on PR title prefix
 */
function findMatchingLabel(title, labelMappings) {
  const normalizedTitle = title.toLowerCase();

  for (const mapping of labelMappings) {
    for (const prefix of mapping.prefixes) {
      const prefixWithColon = `${prefix}:`;
      if (normalizedTitle.startsWith(prefixWithColon)) {
        return mapping.label;
      }
    }
  }

  return null;
}

/**
 * Determine which labels to remove
 */
function getLabelsToRemove(labelsAddedByAction, currentLabels, targetLabel) {
  const labelsToRemove = new Set();

  console.log(`🔍 Determining labels to remove...`);
  console.log(
    `📋 Labels added by action: [${Array.from(labelsAddedByAction).join(', ')}]`
  );
  console.log(`📋 Current labels: [${Array.from(currentLabels).join(', ')}]`);
  console.log(`🎯 Target label: "${targetLabel || 'none'}"`);

  for (const addedLabel of labelsAddedByAction) {
    if (currentLabels.has(addedLabel) && addedLabel !== targetLabel) {
      labelsToRemove.add(addedLabel);
      console.log(`🗑️ Will remove: "${addedLabel}"`);
    }
  }

  console.log(
    `📊 Labels to remove: [${Array.from(labelsToRemove).join(', ')}]`
  );
  return labelsToRemove;
}

/**
 * Remove labels from the PR
 */
async function removeLabels(octokit, owner, repo, issueNumber, labelsToRemove) {
  for (const labelToRemove of labelsToRemove) {
    try {
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: labelToRemove
      });
      console.log(`🗑️ Removed old label: ${labelToRemove}`);
    } catch (error) {
      console.log(`⚠️ Could not remove label ${labelToRemove}:`, error.message);
    }
  }
}

/**
 * Add label to the PR
 */
async function addLabel(octokit, owner, repo, issueNumber, label) {
  try {
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels: [label]
    });
    console.log(`✅ Successfully applied label: ${label}`);
  } catch (error) {
    console.log(`⚠️ Could not add label ${label}:`, error.message);
  }
}

/**
 * Log information when no matching prefix is found
 */
function logNoMatchingPrefix(title, labelMappings) {
  console.log('❓ No matching prefix found in PR title');
  console.log(`📝 PR title: "${title}"`);
  const allPrefixes = labelMappings.flatMap(mapping => mapping.prefixes);
  console.log('📋 Available prefixes:', allPrefixes.join(', '));
}

/**
 * Load configuration from YAML file
 */
function loadConfiguration(configFilePath) {
  const configPath = path.resolve(__dirname, configFilePath);

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    return yaml.load(configContent);
  } catch (error) {
    console.error(
      `❌ Error reading config file "${configFilePath}": ${error.message}`
    );
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const githubToken = process.env.GITHUB_TOKEN;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!githubToken) {
    console.error('❌ GITHUB_TOKEN is required');
    process.exit(1);
  }

  if (!eventPath) {
    console.error('❌ GITHUB_EVENT_PATH is required');
    process.exit(1);
  }

  return { githubToken, eventPath };
}

/**
 * Parse PR data from GitHub event
 */
function parsePullRequestData(eventPath) {
  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const pr = eventData.pull_request;

  if (!pr) {
    console.error('❌ No pull request found in event data');
    process.exit(1);
  }

  return pr;
}

/**
 * Main execution function
 */
async function run() {
  try {
    // Validate environment and load configuration
    const { githubToken, eventPath } = validateEnvironment();
    const configFilePath =
      process.env.CONFIG_FILE || 'pr-title-labeler-config.yml';
    const repository = process.env.GITHUB_REPOSITORY;

    const labelMappings = loadConfiguration(configFilePath);
    const pr = parsePullRequestData(eventPath);

    // Create GitHub client and parse repository info
    const octokit = new Octokit({ auth: githubToken });
    const [owner, repo] = repository.split('/');

    // Find matching label based on title
    const targetLabel = findMatchingLabel(pr.title, labelMappings);

    if (targetLabel) {
      console.log(
        `🎯 Found matching prefix -> applying label "${targetLabel}"`
      );
    }

    // Get current state
    const [currentLabels, labelsAddedByAction] = await Promise.all([
      getCurrentLabels(octokit, owner, repo, pr.number),
      getLabelsAddedByAction(octokit, owner, repo, pr.number, labelMappings)
    ]);

    // Check if target label already exists
    if (targetLabel && currentLabels.has(targetLabel)) {
      console.log(
        `⏭️ Skipping label "${targetLabel}" because it's already added to the PR`
      );
    }

    // Determine which labels to remove
    const labelsToRemove = getLabelsToRemove(
      labelsAddedByAction,
      currentLabels,
      targetLabel
    );

    // Remove old labels if any
    if (labelsToRemove.size > 0) {
      await removeLabels(octokit, owner, repo, pr.number, labelsToRemove);
    }

    // Add new label if needed
    if (targetLabel && !currentLabels.has(targetLabel)) {
      await addLabel(octokit, owner, repo, pr.number, targetLabel);
    } else if (!targetLabel) {
      logNoMatchingPrefix(pr.title, labelMappings);
    }

    console.log('🎉 PR title labeler completed successfully!');
  } catch (error) {
    console.error(`💥 Error labeling PR: ${error.message}`);
    process.exit(1);
  }
}

run();
