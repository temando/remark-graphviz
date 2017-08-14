const path = require('path');
const parse = require('remark-parse');
const stringify = require('remark-stringify');
const toVFile = require('to-vfile');
const unified = require('unified');
const graphviz = require('../src/');

const fixturesDir = path.join(__dirname, '/fixtures');
const runtimeDir = path.join(__dirname, '/runtime');
const remark = unified().use(parse).use(stringify).freeze();

// Utility function to add metdata to a vFile.
function addMetadata(vFile, destinationFilePath) {
  vFile.data = {
    destinationFilePath,
    destinationDir: path.dirname(destinationFilePath),
  };
}

describe('remark-graphviz', () => {
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
