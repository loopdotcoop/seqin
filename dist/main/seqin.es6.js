//// src/main/Main.es6.js
!function () { 'use strict'


const SEQIN = window.SEQIN = window.SEQIN || {}

SEQIN.NAME     = 'seqin'
SEQIN.VERSION  = '0.0.17'
SEQIN.HOMEPAGE = 'http://seqin.loop.coop/'

//// Dependencies.
let Slot
  , TrackSlot
  , MasterSlot


SEQIN.Main = class {

  	get internalSampleRate() {
    		return this._internalSampleRate;
  	}

  	set internalSampleRate(value) {
    		this._internalSampleRate = value;

    		if (this.worker) {
      			this.worker.postMessage({
        				action: 'set-samplerate'
        			, value:  this.internalSampleRate
      			})
    		}
  	}

    constructor (config) {

        Slot       = SEQIN.Slot
        TrackSlot  = SEQIN.TrackSlot
        MasterSlot = SEQIN.MasterSlot

        this.ctx = new (window.AudioContext || window.webkitAudioContext)()

        this.internalSampleRate = config.internalSampleRate || 75000;
        this.worker = config.worker
        this.fidelity = config.fidelity || 5400 //@TODO samplesPerStep
        this.secsPerStep = config.fidelity / this.internalSampleRate // eg 0.1125
        this.notes = []

        this.cbs = { '*':[] } // event-listener callbacks @todo +'play' etc

        this.metronome = 'o' // flips between 'o' and 'x'

        this.droppedTicks = 0
        this.duplicateTicks = 0
        this.missedTicks = 0

        //// Create each track.
        this.tracks = []
        for (let i=0; i<(config.tracks||1); i++) {
            this.tracks.push( new TrackChannel(i, this) )
        }
        this.masterChannel = new MasterChannel(this)

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

        //// Update the worker’s default `samplerate` and `fidelity` settings.
        this.worker.postMessage({
            action: 'set-samplerate'
          , value:  this.internalSampleRate
        })
		this.worker.postMessage({
			action: 'set-secsperstep'
		})
        this.worker.postMessage({
            action: 'set-fidelity'
          , value:  this.fidelity
        })

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
          , timeSinceLastTick = timestamp % this.secsPerStep
          , timeTilNextTick = this.secsPerStep - timeSinceLastTick
        if (this.isPlaying) {
            let source = this.ctx.createBufferSource()
              , nextStepId = (this.activeStep.id+1) % this.steps.length
              , nextStep = this.steps[nextStepId]
              , timeOfNextTick = timestamp + timeTilNextTick


			// console.log(nextStep);
			//const resampler = new OfflineAudioContext(1, )
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
            `[${this.metronome}] internal: ${this.internalSampleRate/1000}kHz\n`
          + `    context: ${this.ctx.sampleRate/1000}kHz\n`
          + `    dropped ticks: ${this.droppedTicks}\n`
          + `    duplicate ticks: ${this.duplicateTicks}\n`
          + `    missed ticks: ${this.missedTicks}`
        ]

        //// Dump each step.
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
        for (let i=0, track; track=seqin.tracks[i++];) {
            this.trackSlots.push( new TrackSlot(seqin, track) )
        }

        //// Create the master-mix slot. @todo maybe a `Step` should become a `MasterSlot`?
        this.masterSlot = new MasterSlot(seqin, seqin.masterChannel, this.trackSlots)
    }

    dump () {
        let out = []
          , maxIdLen = (this.seqin.steps.length+'').length
          , thisIdLen = (this.id+'').length
        out.push(this.isActive ? this.seqin.isPlaying ? '>' : '#' : '.')
        out.push( ' '.repeat(maxIdLen - thisIdLen) )
        out.push(this.id)
        for (let i=0, slot; slot=this.trackSlots[i++];) {
            out.push( `|${slot.dump()}|` )
        }
        out.push( `|${this.masterSlot.dump()}|` )
        return out.join('')
    }

}


class Channel {

    constructor (seqin) {
        this.seqin = seqin
        this.max = 0 // longest `text` of all the steps in this channel
    }

}


class TrackChannel extends Channel {

    constructor (id, seqin) {
        super(seqin)
        this.id = id
        this.notes = {}
    }

    addNote (note) {
        this.notes[note.id] = note
        this.updateMax()
    }

    updateMax () {
        this.seqin.steps.forEach(
            step => step.trackSlots.forEach(
                slot => this.max = Math.max(this.max, slot.text.length)
            )
        )
    }

}


class MasterChannel extends Channel {

    constructor (seqin) {
        super(seqin)
    }

    updateMax () {
        this.seqin.steps.forEach(
            step => this.max = Math.max(this.max, step.masterSlot.text.length)
        )
    }

}


class Note {

    constructor (config, seqin) {

        //// Record `voice`, `track`, `on`, `duration`, `pitch` and `velocity`.
        for (let key in config) this[key] = config[key]

        //// Tell the Voice to modify some of the TrackChannel’s Steps...
        this.voice.updateSteps(config, seqin)

        //// ...and then record the Note in its TrackChannel.
        seqin.tracks[this.track].addNote(this)

    }

}


}()

//// src/main/Slot.es6.js
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

//// src/main/Voice.es6.js
!function () { 'use strict'


const SEQIN = window.SEQIN = window.SEQIN || {}


//// `Voice`
SEQIN.Voice = class {

    //// The base `Voice` class just creates a simple click.
    static updateSteps (config, seqin) {
        const stepId    = config.on
            , step      = seqin.steps[stepId]
            , trackSlot = step.trackSlots[config.track]
            , buffer    = trackSlot.buffer.getChannelData(0)

        //// Add a simple click on the first sample.
        buffer[0] = config.velocity
        buffer[1] = config.velocity * 0.5

        //// Modify track automation at the effected Step.
        ////@todo gain ... EQ etc later

        //// Generate a two-character representation.
        trackSlot.text = 0.5 <= config.velocity ? '* ' : '· '

        //// Update the Step’s master track. @todo wait for all Voice-updates
        step.masterSlot.mix()
    }

}


//// `Buzz`
SEQIN.Buzz = class extends SEQIN.Voice {

    static updateSteps (config, seqin) {
        let stepId    = config.on
          , stepCount = seqin.steps.length
          , f = Math.PI * 2 * config.cycles / seqin.fidelity

        //// Xx.
        for (let i=0, step, trackSlot, buffer; i<config.duration; i++) {

            step      = seqin.steps[stepId++ % stepCount]
            trackSlot = step.trackSlots[config.track]
            buffer    = trackSlot.buffer.getChannelData(0)

            for (let j=0; j<5400; j++) {
                buffer[j] = Math.sin(j * f) / 2
            }

            //// Generate a string-representation.
            trackSlot.text = config.cycles+''
		/*
        //// Replace the first eight samples with a click.
        buffer[0] = 0.125
        buffer[1] = 0.45
        buffer[2] = 0.125
        buffer[3] = 0.25
        buffer[4] = 0
        buffer[5] = 0.375
        buffer[6] = 0
        buffer[7] = -0.45
        buffer[8] = 0.125

        //// Replace the last sixteen samples with a buzz.
        buffer[5400-1]  = 0
        buffer[5400-2]  = 0.25
        buffer[5400-3]  = -0.25
        buffer[5400-4]  = 0.25
        buffer[5400-5]  = -0.25
        buffer[5400-6]  = 0.25
        buffer[5400-7]  = -0.25
        buffer[5400-8]  = 0.25
        buffer[5400-9]  = -0.25
        buffer[5400-10] = 0.25
        buffer[5400-11] = -0.25
        buffer[5400-12] = 0.25
        buffer[5400-13] = -0.25
        buffer[5400-14] = 0.25
        buffer[5400-15] = -0.25
        buffer[5400-16] = 0.25
		*/

            //// Modify track automation at the effected Step.
            ////@todo gain ... EQ etc later

            //// Update the Step’s master track. @todo wait for all Voice-updates
            step.masterSlot.mix( step.trackSlots.filter( slot => slot.note ) )
        }

    }

}


//// `Noise`
SEQIN.Noise = class extends SEQIN.Voice {

}





}()
