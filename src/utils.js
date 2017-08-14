const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const viz = require('viz.js');

const PLUGIN_NAME = 'remark-graphviz';

/**
 * Accepts the `source` of the graph, and an `engine` to render an SVG using viz.js.
 * Returns the path to the rendered SVG.
 *
 * @param  {string} destination
 * @param  {string} source
 * @param  {string} engine 'dot' or 'circo'
 * @return {string}
 */
function render(destination, source, engine) {
  const unique = crypto.createHmac('sha1', PLUGIN_NAME).update(source).digest('hex');
  const svgFilename = `${unique}.svg`;
  const svgPath = path.join(destination, svgFilename);

  fs.outputFileSync(svgPath, viz(source, { engine }));

  return `./${svgFilename}`;
}

/**
 * Returns the destination for the SVG to be rendered at, explicity defined
 * using `vFile.data.destinationDir`, or falling back to the file's current
 * directory.
 *
 * @param {vFile} vFile
 * @return {string}
 */
function getDestinationDir(vFile) {
  if (vFile.data.destinationDir) {
    return vFile.data.destinationDir;
  }

  return vFile.dirname;
}

module.exports = {
  render,
  getDestinationDir,
};
