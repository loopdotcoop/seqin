!function () { 'use strict'

const NAME     = 'seqin-worker'
    , VERSION  = '0.0.17'
    , HOMEPAGE = 'http://seqin.loop.coop/'
;

if ('undefined' !== typeof window) throw(`Run ${NAME} ${VERSION} as a Worker`)


////
let droppedTickIds   = []
  , duplicateTickIds = []
  , previousTickId   = null
  , syncOffset       = 0
  , startTime        = +new Date()
  , samplerate       = 96000 // default
  , fidelity         = 5400  // default
  , msPerStep        = fidelity / samplerate * 1000 // 112.5 at 48kHz


//// Listen for messages from the seqin instance. @todo deal with 2+ instances?
onmessage = function(e) {
    const { action, value } = e.data
    if ('sync' === action) {
        syncOffset = value - ( +new Date() - startTime )
        // console.log(`${NAME} ${VERSION} sync-offset is ${syncOffset}`, value, (+new Date()-startTime) );
    }
    if ('set-samplerate' === action) {
        samplerate = value
        msPerStep = fidelity / samplerate * 1000
    }
    if ('set-fidelity' === action) {
        fidelity = value
        msPerStep = fidelity / samplerate * 1000
    }
}


//// Start checking for metronome-ticks.
tickCheck()

function tickCheck () {

    let now = ( +new Date() - startTime ) + syncOffset // current time in ms
      , timeSinceLastTick = now % msPerStep
      , notice = msPerStep - timeSinceLastTick
      , tickId = Math.round ( (now + notice) / msPerStep )

    //// If tick is not expected any time soon, go back to sleep.
    if (50 < notice) return setTimeout(tickCheck, 20) // over 50ms til next tick
    if (30 < notice) return setTimeout(tickCheck, 5)  // over 30ms til next tick

    //// Deal with timing errors
    if (null !== previousTickId) {
        if (tickId === previousTickId) { // double tick
            duplicateTickIds.push(tickId)
            return setTimeout(tickCheck, 10) // don't postMessage a tick twice
        }
        if (tickId > previousTickId + 1) { // missed a tick
            droppedTickIds.push(tickId) //@todo might be several ticks in a row
        }
    }
    previousTickId = tickId

    //// Less than 30ms to go til next tick, so notify all listeners...
    postMessage({
        action:'tick', notice, tickId, now
      , dropped:   droppedTickIds.length
      , duplicate: duplicateTickIds.length
    })

    //// ...and schedule the next check about 40ms after the tick has happened.
    setTimeout(tickCheck, notice + 20)
}


}()
