//// src/main/Main.es6.js
!function () { 'use strict'


const SEQIN = window.SEQIN = window.SEQIN || {}

SEQIN.NAME     = 'seqin'
SEQIN.VERSION  = '0.0.11'
SEQIN.HOMEPAGE = 'http://seqin.loop.coop/'

//// Dependencies.
let Slot
  , TrackSlot
  , MasterSlot


SEQIN.Main = class {

    constructor (config) {

        Slot       = SEQIN.Slot
        TrackSlot  = SEQIN.TrackSlot
        MasterSlot = SEQIN.MasterSlot

        this.worker = config.worker
        this.fidelity = config.fidelity || 5600
        this.notes = []

        this.cbs = { '*':[] } // event-listener callbacks @todo +'play' etc

        this.metronome = 'o' // flips between 'o' and 'x'

        this.droppedTicks = 0
        this.duplicateTicks = 0
        this.missedTicks = 0

        this.ctx = new (window.AudioContext || window.webkitAudioContext)()

        //// Create each track.
        this.tracks = []
        for (let i=0; i<(config.tracks||1); i++) {
            this.tracks.push( new Track(i, this) )
        }

        //// Create each step.
        this.steps = []
        for (let i=0; i<(config.steps||16); i++) {
            this.steps.push( new Step(i, this) )
        }

        //// Playback is stopped, and playhead is at the first step.
        this.isPlaying = true
        this.activeStep = this.steps[0]
        this.activeStep.isActive = true
        this.play()

        //// Synchronise our AudioContext clock with the worker's clock.
        setTimeout( () => {
            this.worker.postMessage({
                action: 'sync'
              , value: this.ctx.currentTime * 1000
            })
        }, 1000) // AudioContext takes a moment to settle down

        //// Listen for the Seqin worker's 'tick' message.
        this.worker.onmessage = e => {
            const { action, notice, now, tickId, dropped, duplicate } = e.data
            if ('tick' === action) {
                this.droppedTicks   = dropped
                this.duplicateTicks = duplicate
                this.scheduleTick(notice)
            }
        }
    }

    scheduleTick (notice) {
        let timestamp = this.ctx.currentTime
          , timeSinceLastTick = timestamp % 0.12244897959183673
          , timeTilNextTick = 0.12244897959183673 - timeSinceLastTick
        if (this.isPlaying) {
            let source = this.ctx.createBufferSource()
              , nextStepId = (this.activeStep.id+1) % this.steps.length
              , nextStep = this.steps[nextStepId]
              , timeOfNextTick = timestamp + timeTilNextTick
            source.buffer = nextStep.masterSlot.buffer
            source.connect(this.ctx.destination)
            if (0 > timeTilNextTick) {
                this.missedTicks++
                source.start(0, - timeTilNextTick) // play immediately
            } else {
                source.start(timeOfNextTick)
            }
        }
        setTimeout(
            () => this.tick()
          , notice + 30
        )
    }

    tick () {
        this.metronome = 'o' === this.metronome ? 'x' : 'o'
        if (this.isPlaying) this.seek( this.activeStep.id + 1 )
        this.trigger('tick')
    }

    on (eventName, callback) {
        const cbs = this.cbs[eventName]
        if (! cbs) return // event-name not recognised
        cbs.push(callback)
    }

    trigger (eventName) {
        if (this.cbs[eventName]) {
          for (let i=0, cb; cb=this.cbs[eventName][i++];) cb(eventName) }
        for (let i=0, cb; cb=this.cbs['*'][i++];) cb(eventName)
    }

    play () {
        if (this.isPlaying) return
        this.isPlaying = true
        this.trigger('play')
    }

    stop () {
        if (! this.isPlaying) return
        this.isPlaying = false
        this.trigger('stop')
    }

    seek (stepId) {
        this.activeStep.isActive = false
        this.activeStep = this.steps[ stepId % this.steps.length ]
        this.activeStep.isActive = true
        this.trigger('seek')
    }

    addNote (config) {
        config.id = this.notes.length
        this.notes.push( new Note(config, this) )
        this.trigger('add-note')
        return config.id
    }

    dump () {
        const out = [
            `[${this.metronome}] ${this.ctx.sampleRate/1000}kHz\n`
          + `    dropped ticks: ${this.droppedTicks}\n`
          + `    duplicate ticks: ${this.duplicateTicks}\n`
          + `    missed ticks: ${this.missedTicks}`
        ]
        for (let i=0, step; step=this.steps[i++];) {
            out.push( step.dump() )
        }
        return out.join('\n')
    }
}


class Step {

    constructor (id, seqin) {
        this.id = id
        this.seqin = seqin
        this.isActive = false

        //// Create a slot for each track.
        this.trackSlots = []
        for (let i=0; i<seqin.tracks.length; i++) {
            this.trackSlots.push( new TrackSlot(seqin) )
        }

        //// Create the master-mix slot.
        this.masterSlot = new MasterSlot(seqin)
    }

    addNote (note, adsr) {
        this.trackSlots[note.track].update(note, adsr)
        this.masterSlot.mix( this.trackSlots.filter( slot => slot.note ) )
    }

    dump () {
        let out = []
          , maxIdLen = (this.seqin.steps.length+'').length
          , thisIdLen = (this.id+'').length
        out.push(this.isActive ? this.seqin.isPlaying ? '>' : '#' : '.')
        out.push( ' '.repeat(maxIdLen - thisIdLen) )
        out.push(this.id)
        for (let i=0, slot; slot=this.trackSlots[i++];) {
            out.push( `| ${slot.dump()} |` )
        }
        out.push( this.masterSlot.dump() )
        return out.join(' ')
    }

}


class Track {

    constructor (id, seqin) {
        this.id = id
        this.seqin = seqin
        this.notes = {}
    }

    addNote (note) {
        this.notes[note.id] = note
    }

}


class Note {

    constructor (config, seqin) {
        for (let key in config) this[key] = config[key]
        seqin.tracks[this.track].addNote(this)
        let stepId = this.on
        let stepCount = seqin.steps.length
        seqin.steps[  stepId % stepCount].addNote(this, 'attack')
        seqin.steps[++stepId % stepCount].addNote(this, 'decay')
        for (let i=0; i<this.duration; i++)
            seqin.steps[++stepId % stepCount].addNote(this, 'sustain')
        for (let i=0; i<this.voice.release; i++)
            seqin.steps[++stepId % stepCount].addNote(this, 'release')
    }

}


}()

//// src/main/Slot.es6.js
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
