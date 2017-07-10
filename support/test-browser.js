//// These tests only run in the browser - not Node.js.
!function (ROOT) {

const
    a         = chai.assert
  , expect    = chai.expect
  , eq        = a.strictEqual
  , Seqin     = SEQIN.Seqin


describe('Seqin (browser)', () => {



	describe('getBuffers() result', () => {
        const ctx = new AudioContext()
        const cache = {}
        const seqin = new Seqin({
            audioContext:     ctx
          , sharedCache:      cache
          , samplesPerBuffer: 2345
          , sampleRate:       23450
          , channelCount:     1
        })
        const buffers = seqin.getBuffers({
            bufferCount:     8
          , cyclesPerBuffer: 123
          , isLooping:       true
          , events:          []
        })

    	it(`should return an array of silent buffers`, () => {
    		a.ok( Array.isArray(buffers), 'not an array' )
    		eq( buffers.length, 8, 'wrong buffers.length' )
            buffers.forEach( (buffer,i) => {
                eq( buffer.id, 'si', `buffers[${i}].id is incorrect` )
                a.ok( buffer.data instanceof ROOT.AudioBuffer, `buffers[${i}].data is not an AudioBuffer` )
                eq( buffer.data.duration, 0.1, `buffers[${i}].duration is incorrect` )
                eq( buffer.data.length, 2345, `buffers[${i}].length is incorrect` )
                eq( buffer.data.numberOfChannels, 1, `buffers[${i}].numberOfChannels is incorrect` )
                eq( buffer.data.sampleRate, 23450, `buffers[${i}].sampleRate is incorrect` )
                const channelData = buffer.data.getChannelData(0)
                const hash = asmCrypto.SHA256.hex( new Uint8Array(channelData) ) //@TODO check whether Uint8Array is correct
                eq( hash, 'dc45d24c951cd887f19d140edba44760bf85658761975eae711e347ed1b12fc0', `buffers[${i}].data.getChannelData(0) has incorrect hash` )

                // console.log(hash)
            })
    	})


    })

})

}( 'object' === typeof window ? window : global )
