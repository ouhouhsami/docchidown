"use strict"

var parseArgs = require('minimist')

module.exports = function(args) {
    if(!args){
        args=process.argv.slice(2);
    }
    return new Promise((resolve, reject) => {
          const chunks = []
          process.stdin.on('readable', () => {
            const chunk = process.stdin.read()
            if (chunk !== null) {
                chunks.push(chunk)
            }
          })
          process.stdin.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
    })
}
