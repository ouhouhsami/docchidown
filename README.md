# DocchiDown

Util to produce Markdown from json produced by [Docchi](https://github.com/daliwali/docchi) from jsdoc.

The interesting fact here is that Docchi is working in ES6.

```
docchi < ./path/to/es6/es2015/js | docchidown | mustache - node_modules/docchidown/jsdoc.template > output.md
```


## Example usage

### Command Line



### API

```
docchidown.parse({
  // the output from docchi (mandatory)
  source: docchiDoc.out({ render: false }),
  // defaults to 'json'
  outputType: 'markdown',
  // the file in which write the result (relative to `process.cwd()`)
  destination: './path/to/file',
});
```

`docchidown.parse` returns a Promise so you can also :

```
docchidown
  .parse(options)
  .then(function(result) {
    doSomethingWithResult(result);
  });
```


