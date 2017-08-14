const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const visit = require('unist-util-visit');
const viz = require('viz.js');

const validLanguages = ['dot', 'circo'];
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

/**
 * Given a node which contains a `url` property (eg. Link or Image), follow
 * the link, generate a graph and then replace the link with the link to the
 * generated graph. Checks to ensure node has a title of `dot:` before doing.
 *
 * @param {object} node
 * @param {vFile} vFile
 * @return {object}
 */
function replaceUrlWithGraph(node, vFile) {
  const { title, url, position } = node;
  const { destinationDir } = vFile.data;

  // If the image isn't dot, ignore it.
  if (title !== 'dot:') {
    return node;
  }

  try {
    const source = fs.readFileSync(`${vFile.dirname}/${url}`, {
      encoding: 'utf-8',
    });

    // eslint-disable-next-line no-param-reassign
    node.url = render(destinationDir, source, 'dot');

    vFile.info('dot link replaced with link to graph', position, PLUGIN_NAME);
  } catch (error) {
    vFile.message(error, position, PLUGIN_NAME);
  }

  return node;
}

/**
 * Given the MDAST ast, look for all fenced codeblocks that have a language of
 * `dot` or `circo` and pass that to the Graphvis renderer. Replace the
 * codeblocks with an image of the rendered graph.
 *
 * @param {object} ast
 * @param {vFile} vFile
 * @return {function}
 */
function visitCodeBlock(ast, vFile) {
  return visit(ast, 'code', (node, index, parent) => {
    const { lang, value, position } = node;
    const destinationDir = getDestinationDir(vFile);

    // If this codeblock is not a known graphviz format, bail.
    if (!validLanguages.includes(lang)) {
      return node;
    }

    // Otherwise, let's try and generate a graph!
    let graphSvgFilename;
    try {
      graphSvgFilename = render(destinationDir, value, lang);

      vFile.info(`${lang} code block replaced with graph`, position, PLUGIN_NAME);
    } catch (error) {
      vFile.message(error, position, PLUGIN_NAME);
      return node;
    }

    const image = {
      type: 'image',
      title: '`dot` image',
      url: graphSvgFilename,
    };

    parent.children.splice(index, 1, image);

    return node;
  });
}

/**
 * If links have a title attribute called `dot:`, follow the link and generate
 * the graph. Replace the link with the link to the generated graph.
 *
 * @param {object} ast
 * @param {vFile} vFile
 * @return {function}
 */
function visitLink(ast, vFile) {
  return visit(ast, 'link', node => replaceUrlWithGraph(node, vFile));
}

/**
 * If images have a title attribute called `dot:`, follow the link and generate
 * the graph. Replace the link with the link to the generated graph.
 *
 * @param {object} ast
 * @param {vFile} vFile
 * @return {function}
 */
function visitImage(ast, vFile) {
  return visit(ast, 'image', node => replaceUrlWithGraph(node, vFile));
}

/**
 * Returns the transformer which acst on the MDAST tree and given VFile.
 *
 * @link https://github.com/unifiedjs/unified#function-transformernode-file-next
 * @link https://github.com/syntax-tree/mdast
 * @link https://github.com/vfile/vfile
 * @return {function}
 */
function graphviz() {
  /**
   * @param {object} ast MDAST
   * @param {vFile} vFile
   * @param {function} next
   * @return {object}
   */
  return function transformer(ast, vFile, next) {
    visitCodeBlock(ast, vFile);
    visitLink(ast, vFile);
    visitImage(ast, vFile);

    if (typeof next === 'function') {
      return next(null, ast, vFile);
    }

    return ast;
  };
}

exports.render = render;
exports.getDestinationDir = getDestinationDir;
exports.default = graphviz;
