/**
 * Configuration utilities for PR Labeler
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

/**
 * Load configuration from YAML file
 */
function loadConfiguration(configFilePath) {
  const configPath = path.resolve(__dirname, '..', configFilePath);

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    return yaml.load(configContent);
  } catch (error) {
    console.error(`❌ Error reading config file "${configFilePath}": ${error.message}`);
    process.exit(1);
  }
}

/**
 * Validate configuration structure
 */
function validateConfiguration(config) {
  if (!config.titleMappings && !config.fileMappings) {
    console.error('❌ No titleMappings or fileMappings found in configuration');
    process.exit(1);
  }

  // Validate title mappings
  if (config.titleMappings) {
    for (const mapping of config.titleMappings) {
      if (!mapping.label || !mapping.prefixes || !Array.isArray(mapping.prefixes)) {
        console.error('❌ Invalid title mapping structure. Expected: { label: string, prefixes: string[] }');
        process.exit(1);
      }
    }
  }

  // Validate file mappings
  if (config.fileMappings) {
    for (const mapping of config.fileMappings) {
      if (!mapping.label || !mapping.patterns || !Array.isArray(mapping.patterns)) {
        console.error('❌ Invalid file mapping structure. Expected: { label: string, patterns: string[] }');
        process.exit(1);
      }
    }
  }
}

module.exports = {
  loadConfiguration,
  validateConfiguration
};
