"use strict";
!function() {
  'use strict';
  var NAME = 'seqin',
      VERSION = '0.0.10',
      HOMEPAGE = 'http://seqin.loop.coop/';
  ;
  window.Seqin = function() {
    function Seqin(config) {
      var $__4 = this;
      this.worker = config.worker;
      this.fidelity = config.fidelity || 5600;
      this.notes = [];
      this.cbs = {'*': []};
      this.metronome = 'o';
      this.droppedTicks = 0;
      this.duplicateTicks = 0;
      this.missedTicks = 0;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.tracks = [];
      for (var i = 0; i < (config.tracks || 1); i++) {
        this.tracks.push(new Track(i, this));
      }
      this.steps = [];
      for (var i$__6 = 0; i$__6 < (config.steps || 16); i$__6++) {
        this.steps.push(new Step(i$__6, this));
      }
      this.isPlaying = true;
      this.activeStep = this.steps[0];
      this.activeStep.isActive = true;
      this.play();
      setTimeout(function() {
        $__4.worker.postMessage({
          action: 'sync',
          value: $__4.ctx.currentTime * 1000
        });
      }, 1000);
      this.worker.onmessage = function(e) {
        var $__5 = e.data,
            action = $__5.action,
            notice = $__5.notice,
            now = $__5.now,
            tickId = $__5.tickId,
            dropped = $__5.dropped,
            duplicate = $__5.duplicate;
        if ('tick' === action) {
          $__4.droppedTicks = dropped;
          $__4.duplicateTicks = duplicate;
          $__4.scheduleTick(notice);
        }
      };
    }
    return ($traceurRuntime.createClass)(Seqin, {
      scheduleTick: function(notice) {
        var $__4 = this;
        var timestamp = this.ctx.currentTime,
            timeSinceLastTick = timestamp % 0.12244897959183673,
            timeTilNextTick = 0.12244897959183673 - timeSinceLastTick;
        if (this.isPlaying) {
          var source = this.ctx.createBufferSource(),
              nextStepId = (this.activeStep.id + 1) % this.steps.length,
              nextStep = this.steps[nextStepId],
              timeOfNextTick = timestamp + timeTilNextTick;
          source.buffer = nextStep.masterSlot.buffer;
          source.connect(this.ctx.destination);
          if (0 > timeTilNextTick) {
            this.missedTicks++;
            source.start(0, -timeTilNextTick);
          } else {
            source.start(timeOfNextTick);
          }
        }
        setTimeout(function() {
          return $__4.tick();
        }, notice + 30);
      },
      tick: function() {
        this.metronome = 'o' === this.metronome ? 'x' : 'o';
        if (this.isPlaying)
          this.seek(this.activeStep.id + 1);
        this.trigger('tick');
      },
      on: function(eventName, callback) {
        var cbs = this.cbs[eventName];
        if (!cbs)
          return;
        cbs.push(callback);
      },
      trigger: function(eventName) {
        if (this.cbs[eventName]) {
          for (var i = 0,
              cb = void 0; cb = this.cbs[eventName][i++]; )
            cb(eventName);
        }
        for (var i$__7 = 0,
            cb$__8 = void 0; cb$__8 = this.cbs['*'][i$__7++]; )
          cb$__8(eventName);
      },
      play: function() {
        if (this.isPlaying)
          return;
        this.isPlaying = true;
        this.trigger('play');
      },
      stop: function() {
        if (!this.isPlaying)
          return;
        this.isPlaying = false;
        this.trigger('stop');
      },
      seek: function(stepId) {
        this.activeStep.isActive = false;
        this.activeStep = this.steps[stepId % this.steps.length];
        this.activeStep.isActive = true;
        this.trigger('seek');
      },
      addNote: function(config) {
        config.id = this.notes.length;
        this.notes.push(new Note(config, this));
        this.trigger('add-note');
        return config.id;
      },
      dump: function() {
        var out = [("[" + this.metronome + "] " + this.ctx.sampleRate / 1000 + "kHz\n") + ("    dropped ticks: " + this.droppedTicks + "\n") + ("    duplicate ticks: " + this.duplicateTicks + "\n") + ("    missed ticks: " + this.missedTicks)];
        for (var i = 0,
            step = void 0; step = this.steps[i++]; ) {
          out.push(step.dump());
        }
        return out.join('\n');
      }
    }, {});
  }();
  var Step = function() {
    function Step(id, seqin) {
      this.id = id;
      this.seqin = seqin;
      this.isActive = false;
      this.trackSlots = [];
      for (var i = 0; i < seqin.tracks.length; i++) {
        this.trackSlots.push(new TrackSlot(seqin));
      }
      this.masterSlot = new MasterSlot(seqin);
    }
    return ($traceurRuntime.createClass)(Step, {
      addNote: function(note, adsr) {
        this.trackSlots[note.track].update(note, adsr);
        this.masterSlot.mix(this.trackSlots.filter(function(slot) {
          return slot.note;
        }));
      },
      dump: function() {
        var out = [],
            maxIdLen = (this.seqin.steps.length + '').length,
            thisIdLen = (this.id + '').length;
        out.push(this.isActive ? this.seqin.isPlaying ? '>' : '#' : '.');
        out.push(' '.repeat(maxIdLen - thisIdLen));
        out.push(this.id);
        for (var i = 0,
            slot = void 0; slot = this.trackSlots[i++]; ) {
          out.push(("| " + slot.dump() + " |"));
        }
        out.push(this.masterSlot.dump());
        return out.join(' ');
      }
    }, {});
  }();
  var Track = function() {
    function Track(id, seqin) {
      this.id = id;
      this.seqin = seqin;
      this.notes = {};
    }
    return ($traceurRuntime.createClass)(Track, {addNote: function(note) {
        this.notes[note.id] = note;
      }}, {});
  }();
  var Note = function() {
    function Note(config, seqin) {
      for (var key in config)
        this[key] = config[key];
      seqin.tracks[this.track].addNote(this);
      var stepId = this.on;
      var stepCount = seqin.steps.length;
      seqin.steps[stepId % stepCount].addNote(this, 'attack');
      seqin.steps[++stepId % stepCount].addNote(this, 'decay');
      for (var i = 0; i < this.duration; i++)
        seqin.steps[++stepId % stepCount].addNote(this, 'sustain');
      for (var i$__9 = 0; i$__9 < this.voice.release; i$__9++)
        seqin.steps[++stepId % stepCount].addNote(this, 'release');
    }
    return ($traceurRuntime.createClass)(Note, {}, {});
  }();
  var Slot = function() {
    function Slot(seqin) {
      this.buffer = seqin.ctx.createBuffer(1, seqin.fidelity, seqin.ctx.sampleRate);
    }
    return ($traceurRuntime.createClass)(Slot, {}, {});
  }();
  var TrackSlot = function($__super) {
    function TrackSlot(seqin) {
      $traceurRuntime.superConstructor(TrackSlot).call(this, seqin);
      this.note = null;
      this.adsr = null;
    }
    return ($traceurRuntime.createClass)(TrackSlot, {
      update: function(note, adsr) {
        this.note = note;
        this.adsr = adsr;
        note.voice.fillBuffer({
          buffer: this.buffer.getChannelData(0),
          adsr: adsr,
          pitch: note.pitch,
          velocity: note.velocity
        });
      },
      dump: function() {
        return ('attack' === this.adsr ? this.note.pitch.split('').join('\u0332') + '\u0332' : 'decay' === this.adsr ? this.note.pitch : 'sustain' === this.adsr ? this.note.pitch.toLowerCase() : 'release' === this.adsr ? '..' : '  ');
      }
    }, {}, $__super);
  }(Slot);
  var MasterSlot = function($__super) {
    function MasterSlot(seqin) {
      $traceurRuntime.superConstructor(MasterSlot).call(this, seqin);
      this.seqin = seqin;
      this.isMixing = false;
    }
    return ($traceurRuntime.createClass)(MasterSlot, {
      mix: function(trackSlots) {
        var $__4 = this;
        this.isMixing = true;
        this.trackSlots = trackSlots;
        var offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, this.seqin.fidelity, this.seqin.ctx.sampleRate);
        for (var i = 0,
            trackSlot = void 0; trackSlot = trackSlots[i++]; ) {
          var source = offlineCtx.createBufferSource();
          source.buffer = trackSlot.buffer;
          source.connect(offlineCtx.destination);
          source.start();
        }
        offlineCtx.startRendering();
        offlineCtx.oncomplete = function(e) {
          $__4.buffer = e.renderedBuffer;
          $__4.isMixing = false;
        };
      },
      dump: function() {
        return ((!this.trackSlots) ? ' ' : this.isMixing ? '!!!' : this.trackSlots.map(function(slot) {
          return slot.dump();
        }).join('+'));
      }
    }, {}, $__super);
  }(Slot);
}();
//# sourceURL=<compile-source>
