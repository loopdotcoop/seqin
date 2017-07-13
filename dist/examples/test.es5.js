"use strict";
describe("Seqin", function() {
  describe("Main", function() {
    var worker = new Worker("../src/worker/seqin-worker.es6.js");
    var main = new SEQIN.Main({
      worker: worker,
      tracks: 3,
      steps: 1,
      fidelity: 5400
    });
    it("should have 16 steps", function() {
      assert.lengthOf(main.steps, 1);
    });
    it("should have 2 tracks", function() {
      assert.lengthOf(main.tracks, 3);
    });
    main.addNote({
      voice: SEQIN.Buzz,
      track: 0,
      on: 0,
      duration: 1,
      cycles: 60,
      velocity: 0.5
    });
    main.addNote({
      voice: SEQIN.Buzz,
      track: 1,
      on: 0,
      duration: 1,
      cycles: 80,
      velocity: 0.8
    });
    main.addNote({
      voice: SEQIN.Buzz,
      track: 2,
      on: 0,
      duration: 1,
      cycles: 90,
      velocity: 1.0
    });
    it("should have mixed down slots", function() {
      return (new Promise(function(resolve) {
        return setTimeout(resolve, 1000);
      })).then(function() {
        var buffer = main.steps[0].masterSlot.buffer.getChannelData(0);
        var hash = asmCrypto.SHA256.hex(new Uint8Array(buffer));
        assert.equal(hash, "1f7690d538aff47235621853143cfe2152e5b3bdc791fa821053655c6b88eb49");
      });
    });
  });
});
//# sourceURL=<compile-source>
