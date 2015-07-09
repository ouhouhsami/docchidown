/**
 *  parse docchi output to waves compliant doc format
 *  @output {json}
 */
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

'use strict';

module.exports.parse = function(options) {
  // docchi.output();
  var source = options.source;
  // if defined the path of the file where we should write the output
  var destination = path.join(process.cwd(), options.destination);
  // configurable output type (json|markdown)
  var outputType = options.outputType || 'json';
  // path to the md template
  var templatePath = options.template || path.join(__dirname, 'templates', 'wavesdoc.tmpl');

  return Promise.resolve(source)
    .then(cleanDocchi)
    .then(getTargets)
    .then(reorder)
    .then(function(result) {
      switch (outputType) {
        case 'json':
          if (destination) {
            var json = JSON.stringify(result, null, 2);
            fs.writeFileSync(destination, json);
          }

          return result;
          break;

        // could use potentially any type of output as long as the given template works
        default:
          var templateSrc = fs.readFileSync(templatePath).toString();
          // var template = Handlebars.compile(templateSrc);
          // var rendered = template(result);
          // var rendered = swig.render(templateSrc,  });
          // var rendered = swig.render(templateSrc, result );
          var template = _.template(templateSrc);
          var rendered = template({ results: result });
          // remove template indentation
          // rendered = rendered.replace(/^ +/gm, '');
          rendered = rendered.replace(/\n{2,}/gm, '\n\n');
          rendered = rendered.replace(/(.*)$/gm, '$1  ');

          // replace ``` with {% highlight js %} ? maybe later...

          if (destination) {
            fs.writeFileSync(destination, rendered);
          }

          return rendered;
          break;
      }
    }).catch(function(err) {
      console.error(err.stack);
    });
}

/**
 *  Flatten and clean docchi output
 */
function cleanDocchi(json) {
  var result = [];

  return new Promise(function(resolve, reject) {
    json.forEach(function(block) {
      delete block.context.location;

      // flatten the blocks
      block.name = block.context.name;
      if (block.context.target) { // class object as no target block
        block.target = block.context.target;
      }
      block.type = block.context.type;
      delete block.context;

      block.description = block.comment.description;
      block.tags = block.comment.tags;
      delete block.comment;

      // rewrite target for properties (should have an @this pointing to the class name)
      if (block.target) {
        if (block.target === 'this' && block.type === 'property') {
          var targetTag = block.tags.filter(function(tag) {
            return tag.title === 'this';
          })[0];

          // don't crash if @this is not defined
          if (targetTag) {
            block.target = targetTag.name;
            block.tags.splice(block.tags.indexOf(targetTag), 1);
          } else {
            // remove this block if no target
            json.splice(json.indexOf(block), 1);
          }
        }
      }

      // get set are considered as properties
      if (block.type === 'set' || block.type === 'get') {
        block.type = 'property';
      }

      result.push(block);
    });

    resolve(result);
  });
}

function _getJSONPointerFromTarget(json, target) {
  var pointer;

  json.forEach(function(block, index) {
    if (block.name === target) { pointer = index; }
  });

  return pointer;
}

/**
 * Find the target for each block
 */
function getTargets(json) {
  var toReorder = [];

  return new Promise(function(resolve, reject) {
    // find the target class for each docchi definition
    json.forEach(function(block, index) {
      if (block.target) {
        var pointer = _getJSONPointerFromTarget(json, block.target);
        if (pointer === undefined) { return; }

        toReorder.push([index, pointer]);
      }
      // delete block.target;
    });

    resolve([json, toReorder]);
  });
}

/**
 *  Rearrange the blocks
 */
function reorder(data) {
  var json = data[0];
  var instructions = data[1];

  return new Promise(function(resolve, reject) {
    instructions.forEach(function(instruction) {
      var source = json[instruction[0]];
      var target = json[instruction[1]];
      var type = '_' + source.type;

      // if (!source || !target) { return; }

      target[type] = target[type] || [];
      target[type].push(source);

      // remove source from tree
      delete json[instruction[0]];
      // console.log(json.indexOf(source));
      // json.splice(json.indexOf(source), 1);
    });

    // clean all dummy entries
    for (var i = json.length; i >= 0; i--) {
      if (json[i] === undefined) {
        json.splice(i, 1);
      } else if (json[i].type !== 'class') {
        json.splice(i, 1);
      }
    }

    resolve(json);
  })
}
