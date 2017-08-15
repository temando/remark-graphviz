# remark-graphviz

[![NPM](https://img.shields.io/npm/v/remark-graphviz.svg)](https://npmjs.org/packages/remark-graphviz/)
[![Travis CI](https://img.shields.io/travis/temando/remark-graphviz.svg)](https://travis-ci.org/temando/remark-graphviz)
[![MIT License](https://img.shields.io/github/license/temando/remark-graphviz.svg)](https://en.wikipedia.org/wiki/MIT_License)

Replaces graphs defined in [`dot`](http://www.graphviz.org/content/dot-language)
with rendered SVGs.

## Installation

```sh
$ npm install remark-graphviz
```

## Usage

Graphs defined using `dot` can be referenced using a `dot:` title which will
generate an SVG image.

```md
[Link to a Graph](test/fixtures/assets/example.dot "dot:")
![Embed image of graph](test/fixtures/assets/example.dot "dot:")
```

Alternatively, graphs can be generated inline, by using `dot` (or `circo`) as
the language identifier for a fenced code block.

<pre>
```dot
digraph graphname {
  a -> b;
  b -> c;
  a -> c;
}
```
</pre>

See this project's [fixtures](test/fixtures) for more examples.

## Example

Given a file, `example.md`, which contains the following Markdown:

<pre>
# dot code block

```dot
digraph graphname {
  a -> b;
  b -> c;
  a -> c;
}
```
</pre>

Using remark like follows:

```js
var vfile = require('to-vfile');
var remark = require('remark');
var graphviz = require('remark-graphviz');

var example = vfile.readSync('example.md');

remark()
  .use(graphviz)
  .process(example, function (err, file) {
    if (err) throw err;

    console.log(String(file))
  });
```

Will result in an SVG being written relative to `example.md`, and the Markdown
being transformed to:

```md
# dot code block

![](./6b03e143dc2a47a93496133d692c44d5ec012b57.svg "`dot` image")
```

To change where the SVG's are written, set `data.destinationFilePath` on the
vFile. This following shows how you could process a file from one directory and
output the transformed file to another:

```js
var vfile = require('to-vfile');
var remark = require('remark');
var graphviz = require('remark-graphviz');

var example = vfile.readSync('example.md');
example.data = {
  destinationFilePath: 'out/example.md'
};

remark()
  .use(graphviz)
  .process(example, function (err, file) {
    if (err) throw err;

    vfile.writeSync({ path: file.data.destinationFilePath });
  });
```

Both `example.md` and the generated SVG will reside in the `/out` directory.
