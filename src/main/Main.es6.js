!function () { 'use strict'


const SEQIN = window.SEQIN = window.SEQIN || {}

SEQIN.NAME     = 'seqin'
SEQIN.VERSION  = '0.0.16'
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

		if(this.worker) {
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
