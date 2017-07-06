!function (ROOT) { 'use strict'

const META = {
    NAME:    { value:'Seqin'    }
  , ID:      { value:'si'       }
  , VERSION: { value:'0.0.3'    }
  , SPEC:    { value:'20170705' }
  , HELP:    { value:
`The base class for all sequencer instruments. It’s not usually used directly -
it just generates silent buffers.` }
}

//// Make available on the window (browser) or global (Node.js)
const SEQIN = ROOT.SEQIN = ROOT.SEQIN || {}


SEQIN.Seqin = class {

    constructor (config) {

        //// Validate the configuration object, and record its values as
        //// immutable properties.
        if ('object' !== typeof config)
            throw new Error(`Seqin(): config is type ${typeof config} not object`)
        ;[
            { name:'audioContext'    , type:'object' }
          , { name:'sharedCache'     , type:'object' }
          , { name:'samplesPerBuffer', type:'number' } // fidelity
          , { name:'sampleRate'      , type:'number' }
        ].forEach( valid => {
            const realType = typeof config[valid.name]
            if (realType !== valid.type)
                throw new Error(`Seqin(): config.${valid.name} is type ${realType} not ${valid.type}`)
            //@TODO more validation
            Object.defineProperty(this, valid.name, { value:config[valid.name] })
        })

    }


    getBuffers(config) {

        //// Validate the configuration object.
        if ('object' !== typeof config)
            throw new Error(`Seqin:getBuffers(): config is type ${typeof config} not object`)
        ;[
            { name:'bufferCount'    , type:'number' }
          , { name:'cyclesPerBuffer', type:'number' }
          , { name:'isLooping'      , type:'boolean' }
          , { name:'events'         , type:'object' }
        ].forEach( valid => {
            const realType = typeof config[valid.name]
            if (realType !== valid.type)
                throw new Error(`Seqin:getBuffers(): config.${valid.name} is type ${realType} not ${valid.type}`)
            //@TODO more validation
        })

        //// Validate the config.events array.
        const events = config.events
        if (! Array.isArray(events) )
            throw new Error(`Seqin:getBuffers(): config.events is not an array`)
        events.forEach( (event, i) => {
            if ('object' !== typeof event)
                throw new Error(`Seqin:getBuffers(): config.events[${i}] is not an object`)
        })

    }

}


//// Add static constants to the Seqin class.
Object.defineProperties(SEQIN.Seqin, META)


}( 'object' === typeof window ? window : global )
