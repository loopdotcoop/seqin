!function () { 'use strict'


const SEQIN = window.SEQIN = window.SEQIN || {}


const pad = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ']


//// `Slot`
SEQIN.Slot = class {

    constructor (seqin, track) {
        this.track = track
        this.buffer = seqin.ctx.createBuffer(
            1                    // mono
          , seqin.fidelity       // 5400 frames, by default
          , seqin.internalSampleRate //
        )
    }

}


//// `TrackSlot`
SEQIN.TrackSlot = class extends SEQIN.Slot {

    constructor (seqin, track) {
        super(seqin, track)
        this.note = null
        this.adsr = null
        this.text = ''
    }

    dump () {
        return this.text + pad[ this.track.max - this.text.length ]
    }

}


//// `MasterSlot`
SEQIN.MasterSlot = class extends SEQIN.Slot {

    constructor (seqin, track, trackSlots) {
        super(seqin, track)
        this.seqin = seqin
        this.isMixing = false
        this.trackSlots = trackSlots
        this.text = ''
    }

    mix () {// step.trackSlots.filter( slot => slot.note )

        this.isMixing = true

        //// We need a fresh offline audio context for each new mix
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
            1                             // mono
          , this.seqin.fidelity           // 5400 frames, by default
          , this.seqin.internalSampleRate //
        )

        //// Connect each track-slot to the offline audio context.
        for (let i=0, trackSlot; trackSlot=this.trackSlots[i++];) {
            if ('' === trackSlot.text) continue // don’t mix an empty slot
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
            const texts=[]
            for (let i=0, slot; slot=this.trackSlots[i++];)
                if ('' !== slot.text) texts.push(slot.text)
            this.text = texts.join('+')
            this.seqin.masterChannel.updateMax()
        }

    }

    dump () {
        return this.isMixing ?
            '!'.repeat(this.text.length)
          : this.text + pad[ this.track.max - this.text.length ]
    }

}


}()
