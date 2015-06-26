#!/usr/local/bin/node --harmony
"use strict"

var fs = require('fs');
var cli = require('../cli')


let json;

cli().then(getTargets)
.then(reorder)
.then(function(response){
    process.stdout.write(JSON.stringify(json, null, 2))
})

function getTargets(jsonResponse){
    let toReorder = [];
    json = jsonResponse;

    return new Promise(function(resolve, reject){
        json.forEach(function(block, id, jsonData){
            if(block.context.target){
                var target = block.context.target;
                var pointer = getJSONPointerFromTarget(target);
                toReorder.push([id, pointer])
            }
        })
        resolve(toReorder)
    })
}

function reorder(array){
    return new Promise(function(resolve, reject){
        array.forEach(function(item){
            json[item[1]].children = json[item[1]].children || []
            json[item[1]].children.push(json[item[0]])
            delete json[item[0]]
        })
        for (var i=json.length;i--;){
            if (json[i]===undefined){
                json.splice(i,1)
            }
        }
        resolve()
    })
}

function getJSONPointerFromTarget(target){
    var p;
    json.forEach(function(block, id){
        if(block.context.name == target){
            p = id;
        }
    })
    return p;
}
