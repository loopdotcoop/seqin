!function () { 'use strict'


const SEQIN = window.SEQIN = window.SEQIN || {}


//// `Slot`
SEQIN.Slot = class {

    constructor (seqin) {
        this.buffer = seqin.ctx.createBuffer(
            1                    // mono
          , seqin.fidelity       // 5400 frames, by default
          , seqin.ctx.sampleRate //
        )
    }

}


//// `TrackSlot`
SEQIN.TrackSlot = class extends SEQIN.Slot {

    constructor (seqin) {
        super(seqin)
        this.note = null
        this.adsr = null
    }

    update (note, adsr) {
        this.note = note
        this.adsr = adsr
        note.voice.fillBuffer({
            buffer:   this.buffer.getChannelData(0)
          , adsr:     adsr
          , pitch:    note.pitch
          , velocity: note.velocity
        })
    }

    dump () {
        return (
            'attack'  === this.adsr ? this.note.pitch.split('').join('\u0332') + '\u0332'
          : 'decay'   === this.adsr ? this.note.pitch
          : 'sustain' === this.adsr ? this.note.pitch.toLowerCase()
          : 'release' === this.adsr ? '..'
          :                           '  ' // empty slot
        )
    }

}


//// `MasterSlot`
SEQIN.MasterSlot = class extends SEQIN.Slot {

    constructor (seqin) {
        super(seqin)
        this.seqin = seqin
        this.isMixing = false
    }

    mix (trackSlots) {
        this.isMixing = true

        //// Record the list of track-slots - used by dump()
        this.trackSlots = trackSlots

        //// We need a fresh offline audio context for each new mix
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
            1                         // mono
          , this.seqin.fidelity       // 5400 frames, by default
          , this.seqin.ctx.sampleRate //
        )

        //// Connect each track-slot to the offline audio context.
        for (let i=0, trackSlot; trackSlot=trackSlots[i++];) {
            let source = offlineCtx.createBufferSource()
            source.buffer = trackSlot.buffer
            source.connect(offlineCtx.destination)
            source.start()
        }

        //// Mix the track-slots. @todo modern browsers should use promises
        // offlineCtx.startRendering()
        //    .then( buffer => (this.buffer = buffer, this.isMixing = false) )
        //    .catch( err => console.log('Rendering failed: ' + err) )
        offlineCtx.startRendering()
        offlineCtx.oncomplete = e => { // Safari needs this older syntax
            this.buffer = e.renderedBuffer
            this.isMixing = false
        }

    }

    dump () {
        return (
              (! this.trackSlots) ? ' '
            : this.isMixing       ? '!!!'
            : this.trackSlots.map( slot => slot.dump() ).join('+')
        )
    }

}


}()
