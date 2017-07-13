"use strict";
!function() {
  'use strict';
  var NAME = 'seqin-worker',
      VERSION = '0.0.17',
      HOMEPAGE = 'http://seqin.loop.coop/';
  ;
  if ('undefined' !== typeof window)
    throw (("Run " + NAME + " " + VERSION + " as a Worker"));
  var droppedTickIds = [],
      duplicateTickIds = [],
      previousTickId = null,
      syncOffset = 0,
      startTime = +new Date(),
      samplerate = 96000,
      fidelity = 5400,
      msPerStep = fidelity / samplerate * 1000;
  onmessage = function(e) {
    var $__1 = e.data,
        action = $__1.action,
        value = $__1.value;
    if ('sync' === action) {
      syncOffset = value - (+new Date() - startTime);
    }
    if ('set-samplerate' === action) {
      samplerate = value;
      msPerStep = fidelity / samplerate * 1000;
    }
    if ('set-fidelity' === action) {
      fidelity = value;
      msPerStep = fidelity / samplerate * 1000;
    }
  };
  tickCheck();
  function tickCheck() {
    var now = (+new Date() - startTime) + syncOffset,
        timeSinceLastTick = now % msPerStep,
        notice = msPerStep - timeSinceLastTick,
        tickId = Math.round((now + notice) / msPerStep);
    if (50 < notice)
      return setTimeout(tickCheck, 20);
    if (30 < notice)
      return setTimeout(tickCheck, 5);
    if (null !== previousTickId) {
      if (tickId === previousTickId) {
        duplicateTickIds.push(tickId);
        return setTimeout(tickCheck, 10);
      }
      if (tickId > previousTickId + 1) {
        droppedTickIds.push(tickId);
      }
    }
    previousTickId = tickId;
    postMessage({
      action: 'tick',
      notice: notice,
      tickId: tickId,
      now: now,
      dropped: droppedTickIds.length,
      duplicate: duplicateTickIds.length
    });
    setTimeout(tickCheck, notice + 20);
  }
}();
//# sourceURL=<compile-source>
