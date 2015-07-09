/**
 *  parse docchi output to waves compliant doc format
 *  @output {json}
 */
var fs = require('fs');

'use strict';

module.exports.parse = function(options) {
  var source = options.source;
  var destination = options.destination;

  return Promise.resolve(source)
    .then(cleanDocchi)
    .then(getTargets)
    .then(reorder)
    .then(function(result) {
      if (destination) {
        // write file sync
      } else {
        return result;
      }
    });
}

/**
 *  Clean docchi output
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

          block.target = targetTag.name;
          block.tags.splice(block.tags.indexOf(targetTag), 1);
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
 * find target for each block
 */
function getTargets(json) {
  var toReorder = [];

  return new Promise(function(resolve, reject) {
    // find the target class for each docchi definition
    json.forEach(function(block, index) {
      if (block.target) {
        var pointer = _getJSONPointerFromTarget(json, block.target);
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
      // delete source.type;

      target[type] = target[type] || [];
      target[type].push(source);

      // remove source from tree
      delete json[instruction[0]];
    });

    for (var i = json.length; i >= 0; i--) {
      if (json[i] === undefined) {
        json.splice(i, 1);
      }
    }
    resolve(json);
  })
}
