"use strict";
!function() {
  'use strict';
  var demo1;
  initDemo();
  function initDemo() {
    var i = ~~document.cookie.split('~')[1],
        worker = new Worker('../' + (3 == i ? 'src' : 'dist') + '/worker/seqin-worker.es' + (1 < i ? 6 : 5) + '.js');
    var tracks = 1000;
    demo1 = window.DEMO = new SEQIN.Main({
      worker: worker,
      tracks: tracks,
      steps: 16,
      fidelity: 5400
    });
    var $output = document.getElementById('output');
    demo1.on('*', function(event) {
      $output.innerHTML = demo1.dump();
    });
    demo1.seek(2);
    var noteId_0 = demo1.addNote({
      voice: SEQIN.Buzz,
      track: 0,
      on: 2,
      duration: 3,
      cycles: 60,
      velocity: 0.2
    });
    var hasAddedNoExampleNotes = true;
    window.addExampleNote = function() {
      if (hasAddedNoExampleNotes) {
        hasAddedNoExampleNotes = false;
        for (var i = 0; i < tracks; i++) {
          var noteId_1 = demo1.addNote({
            voice: SEQIN.Buzz,
            track: i,
            on: Math.floor(Math.random() * 16),
            duration: 2,
            cycles: Math.floor(Math.random() * 100),
            velocity: 0.8
          });
        }
      } else {
        var noteId_2 = demo1.addNote({
          voice: SEQIN.Buzz,
          track: 1,
          on: 14,
          duration: 8,
          cycles: 45,
          velocity: 0.9
        });
      }
    };
  }
  window.unlockAudio = function() {
    var buffer = demo1.ctx.createBuffer(1, 1, 22050);
    var source = demo1.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(demo1.ctx.destination);
    if ('function' == typeof source.noteOn)
      source.noteOn(0);
  };
}();
//# sourceURL=<compile-source>
