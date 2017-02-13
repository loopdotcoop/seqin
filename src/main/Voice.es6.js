!function () { 'use strict'


const SEQIN = window.SEQIN = window.SEQIN || {}


//// `Voice`
SEQIN.Voice = class {

    //// The base `Voice` class just creates a simple click.
    static updateSteps (config, seqin) {
        const stepId    = config.on
            , step      = seqin.steps[stepId]
            , trackSlot = step.trackSlots[config.track]
            , buffer    = trackSlot.buffer.getChannelData(0)

        //// Add a simple click on the first sample.
        buffer[0] = config.velocity
        buffer[1] = config.velocity * 0.5

        //// Modify track automation at the effected Step.
        ////@todo gain ... EQ etc later

        //// Generate a two-character representation.
        trackSlot.text = 0.5 <= config.velocity ? '* ' : '· '

        //// Update the Step’s master track. @todo wait for all Voice-updates
        step.masterSlot.mix()
    }

}


//// `Buzz`
SEQIN.Buzz = class extends SEQIN.Voice {

    static updateSteps (config, seqin) {
        let stepId    = config.on
          , stepCount = seqin.steps.length
          , f = Math.PI * 2 * config.cycles / seqin.fidelity

        //// Xx.
        for (let i=0, step, trackSlot, buffer; i<config.duration; i++) {

            step      = seqin.steps[stepId++ % stepCount]
            trackSlot = step.trackSlots[config.track]
            buffer    = trackSlot.buffer.getChannelData(0)

            for (let j=0; j<5400; j++) {
                buffer[j] = Math.sin(j * f) / 2
            }

            //// Generate a string-representation.
            trackSlot.text = config.cycles+''

            //// Modify track automation at the effected Step.
            ////@todo gain ... EQ etc later

            //// Update the Step’s master track. @todo wait for all Voice-updates
            step.masterSlot.mix( step.trackSlots.filter( slot => slot.note ) )

        }

    }

}


//// `Noise`
SEQIN.Noise = class extends SEQIN.Voice {

}


/*

        //// Replace the first eight samples with a click.
        buffer[0] = 0.125
        buffer[1] = 0.45
        buffer[2] = 0.125
        buffer[3] = 0.25
        buffer[4] = 0
        buffer[5] = 0.375
        buffer[6] = 0
        buffer[7] = -0.45
        buffer[8] = 0.125

        //// Replace the last sixteen samples with a buzz.
        buffer[l-1]  = 0
        buffer[l-2]  = 0.25
        buffer[l-3]  = -0.25
        buffer[l-4]  = 0.25
        buffer[l-5]  = -0.25
        buffer[l-6]  = 0.25
        buffer[l-7]  = -0.25
        buffer[l-8]  = 0.25
        buffer[l-9]  = -0.25
        buffer[l-10] = 0.25
        buffer[l-11] = -0.25
        buffer[l-12] = 0.25
        buffer[l-13] = -0.25
        buffer[l-14] = 0.25
        buffer[l-15] = -0.25
        buffer[l-16] = 0.25
*/

}()
