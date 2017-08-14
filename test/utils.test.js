const fs = require('fs');
const path = require('path');
const toVFile = require('to-vfile');
const { render, getDestinationDir } = require('../src/utils');

const fixturesDir = path.join(__dirname, '/fixtures');
const runtimeDir = path.join(__dirname, '/runtime');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

// Utility function to add metdata to a vFile.
function addMetadata(vFile, destinationFilePath) {
  vFile.data = {
    destinationFilePath,
    destinationDir: path.dirname(destinationFilePath),
  };
}

describe('remark-graphviz utils', () => {
  it('renders a dot graph', () => {
    const dotExample = fs.readFileSync(`${fixturesDir}/example.dot`, 'utf8');
    let renderedGraphFile;

    try {
      renderedGraphFile = render(runtimeDir, dotExample, 'dot');
    } catch (err) {
      console.error(err.message);
    }

    expect(renderedGraphFile).not.toBeUndefined();
  });

  it('handles explicity set destination', () => {
    const srcFile = `${fixturesDir}/code-block.md`;
    const destFile = `${runtimeDir}/code-block.md`;
    const vfile = toVFile.readSync(srcFile);
    addMetadata(vfile, destFile);

    expect(getDestinationDir(vfile)).toEqual(runtimeDir);
  });

  it('handles fallback destination', () => {
    const srcFile = `${fixturesDir}/code-block.md`;
    const vfile = toVFile.readSync(srcFile);

    expect(getDestinationDir(vfile)).toEqual(fixturesDir);
  });
});
