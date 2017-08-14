const fs = require('fs');
const path = require('path');
const parse = require('remark-parse');
const stringify = require('remark-stringify');
const toVFile = require('to-vfile');
const unified = require('unified');
const remarkPlugin = require('../src/');
const render = remarkPlugin.render;
const getDestinationDir = remarkPlugin.getDestinationDir;
const graphviz = remarkPlugin.default;

const fixturesDir = path.join(__dirname, '/fixtures');
const runtimeDir = path.join(__dirname, '/runtime');
const remark = unified().use(parse).use(stringify).freeze();

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

// Utility function to add metdata to a vFile.
function addMetadata(vFile, destinationFilePath) {
  vFile.data = {
    destinationFilePath,
    destinationDir: path.dirname(destinationFilePath)
  };
}

describe('remark-graphviz', () => {
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

  it('can handle code blocks', () => {
    const srcFile = `${fixturesDir}/code-block.md`;
    const destFile = `${runtimeDir}/code-block.md`;
    const vfile = toVFile.readSync(srcFile);
    addMetadata(vfile, destFile);

    const result = remark().use(graphviz).processSync(vfile).toString();
    expect(result).toMatch(/!\[\]\(\.\/\w+\.svg/);
    expect(vfile.messages[0].message).toBe('dot code block replaced with graph');
  });

  it('can handle dot images', () => {
    const srcFile = `${fixturesDir}/image-dot.md`;
    const destFile = `${runtimeDir}/image-dot.md`;
    const vfile = toVFile.readSync(srcFile);
    addMetadata(vfile, destFile);

    const result = remark().use(graphviz).processSync(vfile).toString();
    expect(result).toMatch(/!\[Example\]\(\.\/\w+\.svg/);
    expect(vfile.messages[0].message).toBe('dot link replaced with link to graph');
  });

  it('can handle dot links', () => {
    const srcFile = `${fixturesDir}/link-dot.md`;
    const destFile = `${runtimeDir}/link-dot.md`;
    const vfile = toVFile.readSync(srcFile);
    addMetadata(vfile, destFile);

    const result = remark().use(graphviz).processSync(vfile).toString();
    expect(result).toMatch(/\[Example\]\(\.\/\w+\.svg/);
    expect(vfile.messages[0].message).toBe('dot link replaced with link to graph');
  });

  it('it ignores markdown that does not have dot references', () => {
    const srcFile = `${fixturesDir}/simple.md`;
    const destFile = `${runtimeDir}/simple.md`;
    const vfile = toVFile.readSync(srcFile);
    addMetadata(vfile, destFile);

    const result = remark().use(graphviz).processSync(vfile).toString();
    expect(result).not.toMatch(/!\[\]\(\.\/\w+\.svg/);
    expect(vfile.messages).toHaveLength(0);
  });
});
