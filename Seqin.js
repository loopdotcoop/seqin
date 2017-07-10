!function (ROOT) { 'use strict'

const META = {
    NAME:    { value:'Seqin'    }
  , ID:      { value:'si'       }
  , VERSION: { value:'0.0.4'    }
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
          , { name:'channelCount'    , type:'number' }
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
        //// Note that the base Seqin class only creates silent buffers, so the
        //// events don’t make any difference. Validation is included here for
        //// parity with Seqin sub-classes.
        const events = config.events
        if (! Array.isArray(events) )
            throw new Error(`Seqin:getBuffers(): config.events is not an array`)
        events.forEach( (event, i) => {
            if ('object' !== typeof event)
                throw new Error(`Seqin:getBuffers(): config.events[${i}] is not an object`)
            if ('number' !== typeof event.at)
                throw new Error(`Seqin:getBuffers(): config.events[${i}].at is not a number`)
            if (null == event.up && null == event.down)
                throw new Error(`Seqin:getBuffers(): config.events[${i}] does not specify an action`)
            if (null != event.up && null != event.down)
                throw new Error(`Seqin:getBuffers(): config.events[${i}] has more than one action`)
            if ( null != event.up && ('number' !== typeof event.up || 0 > event.up || 1 < event.up) )
                throw new Error(`Seqin:getBuffers(): config.events[${i}].up is invalid`)
            if ( null != event.down && ('number' !== typeof event.down || 0 > event.down || 1 < event.down) )
                throw new Error(`Seqin:getBuffers(): config.events[${i}].down is invalid`)
        })

        //// The base Seqin class just returns silence.
        const buffers = []
        for (let i=0; i<config.bufferCount; i++) {
            buffers.push({
                id:   'si' // always silence, so always the same cache-identifier
              , data: this.audioContext.createBuffer( //@TODO start using sharedCache
                    this.channelCount     // numOfChannels
                  , this.samplesPerBuffer // length
                  , this.sampleRate       // sampleRate
                )
            }) // developer.mozilla.org/en-US/docs/Web/API/AudioContext/createBuffer#Syntax
        }
        return buffers

    }

}


//// Add static constants to the Seqin class.
Object.defineProperties(SEQIN.Seqin, META)


}( 'object' === typeof window ? window : global )
