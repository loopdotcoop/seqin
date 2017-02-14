"use strict";
!function() {
  'use strict';
  var SEQIN = window.SEQIN = window.SEQIN || {};
  SEQIN.NAME = 'seqin';
  SEQIN.VERSION = '0.0.13';
  SEQIN.HOMEPAGE = 'http://seqin.loop.coop/';
  var Slot,
      TrackSlot,
      MasterSlot;
  SEQIN.Main = ($traceurRuntime.createClass)(function(config) {
    var $__4 = this;
    Slot = SEQIN.Slot;
    TrackSlot = SEQIN.TrackSlot;
    MasterSlot = SEQIN.MasterSlot;
    this.worker = config.worker;
    this.fidelity = config.fidelity || 5400;
    this.notes = [];
    this.cbs = {'*': []};
    this.metronome = 'o';
    this.droppedTicks = 0;
    this.duplicateTicks = 0;
    this.missedTicks = 0;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.tracks = [];
    for (var i = 0; i < (config.tracks || 1); i++) {
      this.tracks.push(new TrackChannel(i, this));
    }
    this.masterChannel = new MasterChannel(this);
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
  }, {
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
  var Step = function() {
    function Step(id, seqin) {
      this.id = id;
      this.seqin = seqin;
      this.isActive = false;
      this.trackSlots = [];
      for (var i = 0,
          track = void 0; track = seqin.tracks[i++]; ) {
        this.trackSlots.push(new TrackSlot(seqin, track));
      }
      this.masterSlot = new MasterSlot(seqin, seqin.masterChannel, this.trackSlots);
    }
    return ($traceurRuntime.createClass)(Step, {dump: function() {
        var out = [],
            maxIdLen = (this.seqin.steps.length + '').length,
            thisIdLen = (this.id + '').length;
        out.push(this.isActive ? this.seqin.isPlaying ? '>' : '#' : '.');
        out.push(' '.repeat(maxIdLen - thisIdLen));
        out.push(this.id);
        for (var i = 0,
            slot = void 0; slot = this.trackSlots[i++]; ) {
          out.push(("|" + slot.dump() + "|"));
        }
        out.push(("|" + this.masterSlot.dump() + "|"));
        return out.join('');
      }}, {});
  }();
  var Channel = function() {
    function Channel(seqin) {
      this.seqin = seqin;
      this.max = 0;
    }
    return ($traceurRuntime.createClass)(Channel, {}, {});
  }();
  var TrackChannel = function($__super) {
    function TrackChannel(id, seqin) {
      $traceurRuntime.superConstructor(TrackChannel).call(this, seqin);
      this.id = id;
      this.notes = {};
    }
    return ($traceurRuntime.createClass)(TrackChannel, {
      addNote: function(note) {
        this.notes[note.id] = note;
        this.updateMax();
      },
      updateMax: function() {
        var $__4 = this;
        this.seqin.steps.forEach(function(step) {
          return step.trackSlots.forEach(function(slot) {
            return $__4.max = Math.max($__4.max, slot.text.length);
          });
        });
      }
    }, {}, $__super);
  }(Channel);
  var MasterChannel = function($__super) {
    function MasterChannel(seqin) {
      $traceurRuntime.superConstructor(MasterChannel).call(this, seqin);
    }
    return ($traceurRuntime.createClass)(MasterChannel, {updateMax: function() {
        var $__4 = this;
        this.seqin.steps.forEach(function(step) {
          return $__4.max = Math.max($__4.max, step.masterSlot.text.length);
        });
      }}, {}, $__super);
  }(Channel);
  var Note = function() {
    function Note(config, seqin) {
      for (var key in config)
        this[key] = config[key];
      this.voice.updateSteps(config, seqin);
      seqin.tracks[this.track].addNote(this);
    }
    return ($traceurRuntime.createClass)(Note, {}, {});
  }();
}();
!function() {
  'use strict';
  var SEQIN = window.SEQIN = window.SEQIN || {};
  var pad = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       '];
  SEQIN.Slot = ($traceurRuntime.createClass)(function(seqin, track) {
    this.track = track;
    this.buffer = seqin.ctx.createBuffer(1, seqin.fidelity, seqin.ctx.sampleRate);
  }, {}, {});
  SEQIN.TrackSlot = function($__super) {
    function $__1(seqin, track) {
      $traceurRuntime.superConstructor($__1).call(this, seqin, track);
      this.note = null;
      this.adsr = null;
      this.text = '';
    }
    return ($traceurRuntime.createClass)($__1, {dump: function() {
        return this.text + pad[this.track.max - this.text.length];
      }}, {}, $__super);
  }(SEQIN.Slot);
  SEQIN.MasterSlot = function($__super) {
    function $__2(seqin, track, trackSlots) {
      $traceurRuntime.superConstructor($__2).call(this, seqin, track);
      this.seqin = seqin;
      this.isMixing = false;
      this.trackSlots = trackSlots;
      this.text = '';
    }
    return ($traceurRuntime.createClass)($__2, {
      mix: function() {
        var $__4 = this;
        this.isMixing = true;
        var offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, this.seqin.fidelity, this.seqin.ctx.sampleRate);
        for (var i = 0,
            trackSlot = void 0; trackSlot = this.trackSlots[i++]; ) {
          if ('' === trackSlot.text)
            continue;
          var source = offlineCtx.createBufferSource();
          source.buffer = trackSlot.buffer;
          source.connect(offlineCtx.destination);
          source.start();
        }
        offlineCtx.startRendering();
        offlineCtx.oncomplete = function(e) {
          $__4.buffer = e.renderedBuffer;
          $__4.isMixing = false;
          var texts = [];
          for (var i = 0,
              slot = void 0; slot = $__4.trackSlots[i++]; )
            if ('' !== slot.text)
              texts.push(slot.text);
          $__4.text = texts.join('+');
          $__4.seqin.masterChannel.updateMax();
        };
      },
      dump: function() {
        return this.isMixing ? '!'.repeat(this.text.length) : this.text + pad[this.track.max - this.text.length];
      }
    }, {}, $__super);
  }(SEQIN.Slot);
}();
!function() {
  'use strict';
  var SEQIN = window.SEQIN = window.SEQIN || {};
  SEQIN.Voice = ($traceurRuntime.createClass)(function() {}, {}, {updateSteps: function(config, seqin) {
      var stepId = config.on,
          step = seqin.steps[stepId],
          trackSlot = step.trackSlots[config.track],
          buffer = trackSlot.buffer.getChannelData(0);
      buffer[0] = config.velocity;
      buffer[1] = config.velocity * 0.5;
      trackSlot.text = 0.5 <= config.velocity ? '* ' : '· ';
      step.masterSlot.mix();
    }});
  SEQIN.Buzz = function($__super) {
    function $__0() {
      $traceurRuntime.superConstructor($__0).apply(this, arguments);
    }
    return ($traceurRuntime.createClass)($__0, {}, {updateSteps: function(config, seqin) {
        var stepId = config.on,
            stepCount = seqin.steps.length,
            f = Math.PI * 2 * config.cycles / seqin.fidelity;
        for (var i = 0,
            step = void 0,
            trackSlot = void 0,
            buffer = void 0; i < config.duration; i++) {
          step = seqin.steps[stepId++ % stepCount];
          trackSlot = step.trackSlots[config.track];
          buffer = trackSlot.buffer.getChannelData(0);
          for (var j = 0; j < 5400; j++) {
            buffer[j] = Math.sin(j * f) / 2;
          }
          trackSlot.text = config.cycles + '';
          step.masterSlot.mix(step.trackSlots.filter(function(slot) {
            return slot.note;
          }));
        }
      }}, $__super);
  }(SEQIN.Voice);
  SEQIN.Noise = function($__super) {
    function $__2() {
      $traceurRuntime.superConstructor($__2).apply(this, arguments);
    }
    return ($traceurRuntime.createClass)($__2, {}, {}, $__super);
  }(SEQIN.Voice);
}();
//# sourceURL=<compile-source>
