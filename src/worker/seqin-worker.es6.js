!function () { 'use strict'

const NAME     = 'seqin-worker'
    , VERSION  = '0.0.11'
    , HOMEPAGE = 'http://seqin.loop.coop/'
;

if ('undefined' !== typeof window) throw(`Run ${NAME} ${VERSION} as a Worker`)


////
let droppedTickIds   = []
  , duplicateTickIds = []
  , previousTickId   = null
  , syncOffset       = 0
  , startTime        = +new Date()


//// Listen for messages from the seqin instance. @todo deal with 2+ instances?
onmessage = function(e) {
    const { action, value } = e.data
    if ('sync' === action) {
        syncOffset = value - ( +new Date() - startTime )
        // console.log(`${NAME} ${VERSION} sync-offset is ${syncOffset}`, value, (+new Date()-startTime) );
    }
}


//// Start checking for metronome-ticks.
tickCheck()

function tickCheck () {

    let now = ( +new Date() - startTime ) + syncOffset // current time in ms
      , timeSinceLastTick = now % 122.44897959183673
      , notice = 122.44897959183673 - timeSinceLastTick
      , tickId = Math.round ( (now + notice) / 122.44897959183673 )

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
    setTimeout(tickCheck, notice + 70)
}


}()
