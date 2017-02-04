!function () { 'use strict'

    const NAME     = 'seqin'
        , VERSION  = '0.0.7'
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

            this.ctx = new AudioContext()

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
            if (100 < timestamp - this.oldTimestamp) {
                this.inaccuracy = timestamp - this.oldTimestamp - 100
                this.oldTimestamp = timestamp
                this.tick()
            }
            window.requestAnimationFrame( (ts) => this.checkForTick(ts) )
        }

        tick () {
            this.metronome = 'o' === this.metronome ? 'x' : 'o'
            if (this.isPlaying) {
                this.seek( this.activeStep.id + 1 )
                let source = this.ctx.createBufferSource()
                source.buffer = this.activeStep.masterSlot.buffer
                source.connect(this.ctx.destination)
                source.start()
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


    class Slot {

        constructor (seqin) {
            this.buffer = seqin.ctx.createBuffer(
                1                    // mono
              , seqin.fidelity       // 5400 frames, by default
              , seqin.ctx.sampleRate //
            )
        }

    }


    class TrackSlot extends Slot {

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
                'attack'  === this.adsr ? this.note.pitch + '\u0332'
              : 'decay'   === this.adsr ? this.note.pitch
              : 'sustain' === this.adsr ? this.note.pitch.toLowerCase()
              : 'release' === this.adsr ? '.'
              :                           ' ' // empty slot
            )
        }

    }


    class MasterSlot extends Slot {

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
            const offlineCtx = new OfflineAudioContext(
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

            //// Mix the track-slots.
            offlineCtx.startRendering()
               .then( buffer => (this.buffer = buffer, this.isMixing = false) )
               .catch( err => console.log('Rendering failed: ' + err) )

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
