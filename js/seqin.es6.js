!function () { 'use strict'

    const NAME     = 'seqin'
        , VERSION  = '0.0.5'
        , HOMEPAGE = 'http://seqin.loop.coop/'
    ;

    window.Seqin = class Seqin {

        constructor(config) {

            this.fidelity = config.fidelity || 5600
            this.notes = []

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
            this.steps[0].active = true

        }

        play() {

        }

        stop() {

        }

        seek() {

        }

        addNote(config) {
            config.id = this.notes.length
            this.notes.push( new Note(config, this) )
            return config.id
        }

        dump() {
            const out = [];
            for (let i=0, step; step=this.steps[i++];) {
                out.push( step.dump() )
            }
            return out.join('\n')
        }
    }

    class Step {

        constructor(id, sequin) {
            this.id = id
            this.sequin = sequin

            //// Create each slot.
            this.slots = []
            for (let i=0; i<sequin.tracks.length; i++) {
                this.slots.push( new Slot(i) )
            }
        }

        addNote(note, adsr) {
            const slot = this.slots[note.track]
            slot.note = note
            slot.adsr = adsr
        }

        dump() {
            let out = []
              , maxIdLen = (this.sequin.steps.length+'').length
              , thisIdLen = (this.id+'').length
            out.push(this.active ? '#' : '.')
            out.push( ' '.repeat(maxIdLen - thisIdLen) )
            out.push(this.id)
            for (let i=0, slot; slot=this.slots[i++];) {
                out.push( `| ${slot.dump()} |` )
            }
            return out.join(' ')
        }

    }

    class Track {

        constructor(id, sequin) {
            this.id = id
            this.sequin = sequin
            this.notes = {}
        }

        addNote(note) {
            this.notes[note.id] = note
        }

    }


    class Note {

        constructor(config, seqin) {
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

        constructor(id, step) {
            this.id = id
            this.step = step
            this.note = null
            this.adsr = null
        }

        dump() {
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

        constructor(id) {
            this.id = id
        }

    }


}()
