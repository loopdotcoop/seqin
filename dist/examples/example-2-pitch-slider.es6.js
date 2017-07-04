!function () { 'use strict'

let demo1;

initDemo()
function initDemo () {

//// Load the proper Web Worker, according to the <SELECT> dropdown menu.
const i = ~~document.cookie.split('~')[1] // 0 - 3
    , worker = new Worker(
          '../' + (3 == i ? 'src' : 'dist') // `3` signifies development
        + '/worker/seqin-worker.es' + (1 < i ? 6 : 5) + '.js'
      )

const tracks = 200

//// Create a Seqin instance.
demo1 = window.DEMO = new SEQIN.Main({
    worker:   worker // runs a metronome, outside of the main thread
  , tracks:   tracks     // number of audio channels (default 2)
  , steps:    16     // defines the grid (default 16)
  , fidelity: 5400   // samples per step (default 5400)
})

//// Listen for events.
const $output = document.getElementById('output')
demo1.on( '*', (event) => { $output.innerHTML = demo1.dump() } )

//// Jump to a step in the sequence.
demo1.seek(2)

//// Schedule an initial note.
const noteId_0 = demo1.addNote({
    voice:    SEQIN.Buzz
  , track:    0    // id of the track which the note should be added to
  , on:       2    // id of the step at which the 'piano key' is pressed
  , duration: 3    // number of steps until the 'piano key' is released
  , cycles:   60   // determines the pitch
  , velocity: 0.5  // softness/hardness of the 'piano key' strike, 0 to 1
})

//// Schedule more notes when the ‘Add Example Note’ button is clicked.
let hasAddedNoExampleNotes = true
window.addExampleNote = function () {
    if (hasAddedNoExampleNotes) {
        hasAddedNoExampleNotes = false;

		for(let i = 0; i < tracks; i++) {
			const noteId_1 = demo1.addNote({
				voice:    SEQIN.Buzz
			  , track:    i
			  , on:       Math.floor(Math.random() * 16)
			  , duration: 2
			  , cycles:   Math.floor(Math.random() * 100)
			  , velocity: 0.8
			})

		}
    } else {
        const noteId_2 = demo1.addNote({
            voice:    SEQIN.Buzz
          , track:    1
          , on:       14
          , duration: 8
          , cycles:   45
          , velocity: 0.9
        })
    }
}

} //init()

window.unlockAudio = function () {
    var buffer = demo1.ctx.createBuffer(1, 1, 22050)
    var source = demo1.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(demo1.ctx.destination)
    if ('function' == typeof source.noteOn) source.noteOn(0)
}

}()
