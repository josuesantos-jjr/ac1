const { join } = require('path');

/**
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  // Specify cache directory for Puppeteer relative to project root
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  // Add necessary arguments for running in a headless environment
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};