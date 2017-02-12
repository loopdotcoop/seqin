"use strict";
!function() {
  'use strict';
  var NAME = 'seqin-worker',
      VERSION = '0.0.11',
      HOMEPAGE = 'http://seqin.loop.coop/';
  ;
  if ('undefined' !== typeof window)
    throw (("Run " + NAME + " " + VERSION + " as a Worker"));
  var droppedTickIds = [],
      duplicateTickIds = [],
      previousTickId = null,
      syncOffset = 0,
      startTime = +new Date();
  onmessage = function(e) {
    var $__1 = e.data,
        action = $__1.action,
        value = $__1.value;
    if ('sync' === action) {
      syncOffset = value - (+new Date() - startTime);
    }
  };
  tickCheck();
  function tickCheck() {
    var now = (+new Date() - startTime) + syncOffset,
        timeSinceLastTick = now % 122.44897959183673,
        notice = 122.44897959183673 - timeSinceLastTick,
        tickId = Math.round((now + notice) / 122.44897959183673);
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
    setTimeout(tickCheck, notice + 70);
  }
}();
//# sourceURL=<compile-source>
