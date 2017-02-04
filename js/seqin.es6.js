!function () { 'use strict'

    const NAME     = 'seqin'
        , VERSION  = '0.0.3'
        , HOMEPAGE = 'http://seqin.loop.coop/'
    ;

    window.Seqin = class Seqin {

        constructor(config) {
            this.fidelity = config.fidelity || 5600
            this.steps = []
            for (let i=0; i<(config.steps||16); i++) {
                this.steps.push( new Step(i, this) )
            }
            this.steps[0].active = true
        }

        dump() {
            for (var i=0, out=[], step; step=this.steps[i++];) {
                out.push( step.dump() )
            }
            return out.join('\n')
        }
    }

    class Step {

        constructor(id, sequin) {
            this.id = id
            this.sequin = sequin
        }

        dump() {
            let out = []
              , maxIdLen = (this.sequin.steps.length+'').length
              , thisIdLen = (this.id+'').length
            out.push(this.active ? '#' : '.')
            out.push( ' '.repeat(maxIdLen - thisIdLen) )
            out.push(this.id)
            return out.join(' ')
        }

    }


}()
