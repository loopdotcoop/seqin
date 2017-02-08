!function () { 'use strict'

    //// Load Web Worker functionality (shared by all Seqin instances..?)
    const worker = new Worker('../dist/worker/seqin-worker.es5.js');

    //// Create a Seqin instance.
    const demo1 = window.DEMO = new Seqin({
        worker:   worker // runs a metronome, outside of the main thread
      , tracks:   2      // number of audio channels (default 2)
      , steps:    16     // defines the grid (default 16)
      , fidelity: 5400   // samples per step (default 5400)
    })

    //// Listen for events.
    const $output = document.getElementById('output')
    demo1.on( '*', (event) => { $output.innerHTML = demo1.dump() } )

    //// Jump to a step in the sequence.
    demo1.seek(2)

    //// Schedule some notes.
    const noteId_0 = demo1.addNote({
        track:    0    // id of the track which the note should be added to
      , on:       0    // id of the step at which the 'piano key' is pressed
      , duration: 3   // number of steps until the 'piano key' is released
      , pitch:    'Z3'// 'V6' // frequency of voice, from 'Z0' to 'J9'
      , velocity: 50   // loudness of voice, from 0 to 99
      , voice: {
            release: 11 // number of steps after finger releases piano key
          , fillBuffer: basicSine
        }
    })

    ////
    let hasAddedNoExampleNotes = true
    window.addExampleNote = function () {
        if (hasAddedNoExampleNotes) {
            hasAddedNoExampleNotes = false;
            const noteId_1 = demo1.addNote({
                track:    1
              , on:       6
              , duration: 2
              , pitch:    'X4'
              , velocity: 30
              , voice: {
                    release: 4
                  , fillBuffer: basicSine
                }
            })
        } else {
            const noteId_2 = demo1.addNote({
                track:    1
              , on:       0
              , duration: 0
              , pitch:    'Y3'
              , velocity: 99
              , voice: {
                    release: 1
                  , fillBuffer: basicSine
                }
            })
        }
    }

    //// Define a function for generating AudioBuffer data.
    function basicSine (config) {
        const { buffer, adsr, pitch, velocity } = config
           , l = buffer.length
        let f = Math.PI*2/5400  // Z0 = 1 wavelengths per 5400 samples
        if ('Z3' === pitch) f *= 8  //  8 wavelengths per 5400 samples
        if ('Y3' === pitch) f *= 12 // 12 wavelengths per 5400 samples
        if ('X4' === pitch) f *= 20 // 20 wavelengths per 5400 samples
        if ('V6' === pitch) f *= 60 // 60 wavelengths per 5400 samples
        // if ('attack' === adsr)
        //     for (let i=0, prev=0, now; i<l; i++) {
        //         now = Math.random() * 2 - 1
        //         buffer[i] = (prev*3 + now) / 4
        //         prev = now
        //     }
        // if ('decay' === adsr)
        //     for (let i=0, prev=0, now; i<l; i++) {
        //         now = Math.random() * 2 - 1
        //         buffer[i] = ( (prev*3 + now) / 16 ) + ( Math.sin(i * f) / 2 )
        //         prev = now
        //     }


        if ('attack' === adsr || 'decay' === adsr)
            for (let i=0; i<l; i++)
                buffer[i] = Math.sin(i * f)     // 100% sine wave
        if ('sustain' === adsr)
            for (let i=0; i<l; i++)
                buffer[i] = Math.sin(i * f) / 2 // 50% sine wave
        if ('release' === adsr)
            for (let i=0; i<l; i++)
                buffer[i] = Math.sin(i * f) / 4 // 25% sine wave

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
        buffer[l-1]  = 0
        buffer[l-2]  = 0.25
        buffer[l-3]  = -0.25
        buffer[l-4]  = 0.25
        buffer[l-5]  = -0.25
        buffer[l-6]  = 0.25
        buffer[l-7]  = -0.25
        buffer[l-8]  = 0.25
        buffer[l-9]  = -0.25
        buffer[l-10] = 0.25
        buffer[l-11] = -0.25
        buffer[l-12] = 0.25
        buffer[l-13] = -0.25
        buffer[l-14] = 0.25
        buffer[l-15] = -0.25
        buffer[l-16] = 0.25
    }

}()
