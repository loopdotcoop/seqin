"use strict";
!function() {
  'use strict';
  var worker = new Worker('../dist/seqin-worker.js');
  var demo1 = window.DEMO = new Seqin({
    worker: worker,
    tracks: 2,
    steps: 16,
    fidelity: 5400
  });
  var $output = document.getElementById('output');
  demo1.on('*', function(event) {
    $output.innerHTML = demo1.dump();
  });
  demo1.seek(2);
  var noteId_0 = demo1.addNote({
    track: 0,
    on: 0,
    duration: 3,
    pitch: 'Z3',
    velocity: 50,
    voice: {
      release: 11,
      fillBuffer: basicSine
    }
  });
  var hasAddedNoExampleNotes = true;
  window.addExampleNote = function() {
    if (hasAddedNoExampleNotes) {
      hasAddedNoExampleNotes = false;
      var noteId_1 = demo1.addNote({
        track: 1,
        on: 6,
        duration: 2,
        pitch: 'X4',
        velocity: 30,
        voice: {
          release: 4,
          fillBuffer: basicSine
        }
      });
    } else {
      var noteId_2 = demo1.addNote({
        track: 1,
        on: 0,
        duration: 0,
        pitch: 'Y3',
        velocity: 99,
        voice: {
          release: 1,
          fillBuffer: basicSine
        }
      });
    }
  };
  function basicSine(config) {
    var $__2 = config,
        buffer = $__2.buffer,
        adsr = $__2.adsr,
        pitch = $__2.pitch,
        velocity = $__2.velocity,
        l = buffer.length;
    var f = Math.PI * 2 / 5400;
    if ('Z3' === pitch)
      f *= 8;
    if ('Y3' === pitch)
      f *= 12;
    if ('X4' === pitch)
      f *= 20;
    if ('V6' === pitch)
      f *= 60;
    if ('attack' === adsr || 'decay' === adsr)
      for (var i = 0; i < l; i++)
        buffer[i] = Math.sin(i * f);
    if ('sustain' === adsr)
      for (var i$__3 = 0; i$__3 < l; i$__3++)
        buffer[i$__3] = Math.sin(i$__3 * f) / 2;
    if ('release' === adsr)
      for (var i$__4 = 0; i$__4 < l; i$__4++)
        buffer[i$__4] = Math.sin(i$__4 * f) / 4;
    buffer[0] = 0.125;
    buffer[1] = 0.45;
    buffer[2] = 0.125;
    buffer[3] = 0.25;
    buffer[4] = 0;
    buffer[5] = 0.375;
    buffer[6] = 0;
    buffer[7] = -0.45;
    buffer[8] = 0.125;
    buffer[l - 1] = 0;
    buffer[l - 2] = 0.25;
    buffer[l - 3] = -0.25;
    buffer[l - 4] = 0.25;
    buffer[l - 5] = -0.25;
    buffer[l - 6] = 0.25;
    buffer[l - 7] = -0.25;
    buffer[l - 8] = 0.25;
    buffer[l - 9] = -0.25;
    buffer[l - 10] = 0.25;
    buffer[l - 11] = -0.25;
    buffer[l - 12] = 0.25;
    buffer[l - 13] = -0.25;
    buffer[l - 14] = 0.25;
    buffer[l - 15] = -0.25;
    buffer[l - 16] = 0.25;
  }
}();
//# sourceURL=<compile-source>
