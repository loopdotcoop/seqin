!function () { 'use strict'

    const NAME     = 'seqin'
        , VERSION  = '0.0.5'
        , HOMEPAGE = 'http://seqin.loop.coop/'
    ;

    window.Seqin = class Seqin {

        constructor (config) {

            this.fidelity = config.fidelity || 5600
            this.notes = []
            this.cbs = { '*':[] } // event-listener callbacks @todo +'play' etc
            this.metronome = 'o' // flips between 'o' and 'x'
            this.oldTimestamp = 0
            this.inaccuracy = 0 // @todo remove this, I think

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
            this.isPlaying = false
            this.activeStep = this.steps[0]
            this.activeStep.isActive = true

            //// Start the metronome.
            window.requestAnimationFrame( (ts) => this.checkForTick(ts) )
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

        checkForTick (timestamp) {
            if (1000 < timestamp - this.oldTimestamp) {
                this.inaccuracy = timestamp - this.oldTimestamp - 1000
                this.oldTimestamp = timestamp
                this.tick()
            }
            window.requestAnimationFrame( (ts) => this.checkForTick(ts) )
        }

        tick () {
            this.metronome = 'o' === this.metronome ? 'x' : 'o'
            if (this.isPlaying) {
                this.seek( this.activeStep.id + 1 )
            }
            this.trigger('tick')
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
            this.activeStep = this.steps[ stepId % this.steps.length]
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
                `[${this.metronome}] inaccuracy: ${this.inaccuracy.toFixed(5)}ms`
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

            //// Create each slot.
            this.slots = []
            for (let i=0; i<seqin.tracks.length; i++) {
                this.slots.push( new Slot(i) )
            }
        }

        addNote (note, adsr) {
            const slot = this.slots[note.track]
            slot.note = note
            slot.adsr = adsr
        }

        dump () {
            let out = []
              , maxIdLen = (this.seqin.steps.length+'').length
              , thisIdLen = (this.id+'').length
            out.push(this.isActive ? this.seqin.isPlaying ? '>' : '#' : '.')
            out.push( ' '.repeat(maxIdLen - thisIdLen) )
            out.push(this.id)
            for (let i=0, slot; slot=this.slots[i++];) {
                out.push( `| ${slot.dump()} |` )
            }
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
    class Slot {

        constructor (id, step) {
            this.id = id
            this.step = step
            this.note = null
            this.adsr = null
        }

        dump () {
            return (
                'attack'  === this.adsr ? this.note.pitch + '\u0332'
              : 'decay'   === this.adsr ? this.note.pitch
              : 'sustain' === this.adsr ? this.note.pitch.toLowerCase()
              : 'release' === this.adsr ? '.'
              :                           ' ' // unreachable!
            )
        }

    }

    class Snippet {

        constructor (id) {
            this.id = id
        }

    }


}()
