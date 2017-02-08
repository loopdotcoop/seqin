!function () { 'use strict'

const NAME     = 'Seqin Make'
    , VERSION  = '0.0.1'
    , HOMEPAGE = 'http://seqin.loop.coop/'

    , HELP =
`
${NAME} ${VERSION}
${'='.repeat( (NAME+VERSION).length+1 )}

This Node.js script reads source files from ‘src/’ (all ES6), and rebuilds the
production files in ‘dist/’ (ES6, ES5 and minified ES5).

Basic Usage
-----------
You’ll need Uglify and Traceur installed globally before running make.js:
$ npm install -g uglify-js; npm install -g traceur
$ cd /your/path/to/seqin/
$ node make.js

Make Tasks
----------
1. Copy ‘src/worker/...’ as-is, transpile it to ES5, and minify it
2. Copy each ‘src/examples/...’ file as-is, and transpile each one to ES5
3. Concatenate the files in ‘src/main/’ to ‘dist/main/seqin.es6.js’
4. Transpile the new ‘seqin.es6.js’ to ‘seqin.es5.js’
5. Minify ‘seqin.es5.js’ to ‘seqin.es5.min.js’

Options
-------
-h  --help      Show this help message
-v  --version   Show the current ${NAME} version

This script belongs to ${HOMEPAGE}`




//// SETUP


//// Load library functionality.
const fs = require('fs')
    , uglify = tidyUglifyWarnings( require('uglify-js') )
    , traceur = require('traceur/src/node/api.js')

//// Declare variables.
let opt, es6, es5, min, examples, main

//// Deal with command-line options.
while ( opt = process.argv.shift() ) {
    if ('-h' === opt || '--help'    === opt) return console.log(HELP)
    if ('-v' === opt || '--version' === opt) return console.log(VERSION)
}




//// MAKE TASKS


//// 1. Copy ‘src/worker/...’ as-is, transpile it to ES5, and minify it
es6 = fs.readFileSync('src/worker/seqin-worker.es6.js')+''
es5 = traceur.compile( es6, { blockBinding:true } )
min = uglify.minify( es5, minConfig('dist/worker/seqin-worker.es5.min.js') )
fs.writeFileSync( 'dist/worker/seqin-worker.es6.js', es6 )
fs.writeFileSync( 'dist/worker/seqin-worker.es5.js', es5 )
fs.writeFileSync( 'dist/worker/seqin-worker.es5.min.js', min.code )


//// 2. Copy each ‘src/examples/...’ file as-is, and transpile each one to ES5
examples = fs.readdirSync('src/examples')
examples.forEach( name => {
    if ( '.es6.js' !== name.slice(-7) ) return
    es6 = fs.readFileSync('src/examples/' + name)+''
    es5 = traceur.compile( es6, { blockBinding:true } )
    fs.writeFileSync( 'dist/examples/' + name, es6 )
    fs.writeFileSync( 'dist/examples/' + name.slice(0,-7) + '.es5.js', es5 )
})


//// 3. Concatenate the files in ‘src/main/’ to ‘dist/main/seqin.es6.js’
main = fs.readdirSync('src/main')
es6 = []
main.forEach( name => {
    if ( '.es6.js' !== name.slice(-7) ) return
    es6.push('//// src/main/' + name)
    es6.push( fs.readFileSync('src/main/' + name)+'' )
})
es6 = es6.join('\n')
fs.writeFileSync( 'dist/main/seqin.es6.js', es6 )


//// 4. Transpile the new ‘seqin.es6.js’ to ‘seqin.es5.js’
es5 = traceur.compile( es6, { blockBinding:true } )
fs.writeFileSync( 'dist/main/seqin.es5.js', es5 )


//// 5. Minify ‘seqin.es5.js’ to ‘seqin.es5.min.js’
min = uglify.minify( es5, minConfig('dist/main/seqin.es5.min.js') )
fs.writeFileSync( 'dist/main/seqin.es5.min.js', min.code )




//// UTILITY


//// Hack Uglify, to avoid warnings we don’t care about.
function tidyUglifyWarnings (uglify) {
    var origWarn = uglify.AST_Node.warn
    uglify.AST_Node.warn = function(txt, props) {
        if (! (
            'Dropping unused variable {name} [{file}:{line},{col}]' === txt
            && ( // 'WARN: Dropping unused variable HOMEPAGE [...]', etc
                'NAME'     === props.name
             || 'VERSION'  === props.name
             || 'HOMEPAGE' === props.name
            )
        ) ) origWarn(txt, props)
    }
    return uglify
}


//// Generate a configuration object for Uglify.
function minConfig(outFileName) {
    return {
        fromString:  true
      , outFileName: outFileName
      , warnings:    true
      , output: { max_line_len:64 } // easier on the eye - but 500 would be safe
      , compress: {
            dead_code:   true
          , global_defs: { DEBUG:false }
        }
    }
}

}()
