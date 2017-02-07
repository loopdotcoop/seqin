/* -------------------------------------------------------------------------- */
/* Node.js script which concatenates and minifies the ‘src/’ files into       */
/* ‘dist/life.js’ and ‘dist/life.min.js’.                                     */
/* -------------------------------------------------------------------------- */

/* @todo concat and minify seqin.*.class.js
const fs = require('fs')
    , path = require('path')
    // , uglify = require('uglify-js') // probs? Try `$ npm install -g uglify-js`
    , traceur = require('traceur/src/node/api.js')  // probs? Try `$ npm install -g traceur`
    , allNames = fs.readdirSync('src')
    , srcNames = []
    , maxs = []
    , codes = []

//// Read all source files.
allNames.forEach( name => {
    if ( '.es6.js' !== name.slice(-7) ) return
    srcNames.push(name)
    maxs.push( fs.readFileSync( path.resolve('src', name) )+'' )
})

fs.writeFileSync(
    path.resolve('dist', 'seqin.js')
  , traceur.compile( maxs.join('\n\n'), { blockBinding:true } )
)
// fs.writeFileSync( path.resolve('dist', 'life.min.map.js'), min.map )
*/
