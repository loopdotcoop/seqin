//// These tests only run in the browser - not Node.js.
!function (ROOT) {

const
    a         = chai.assert
  , expect    = chai.expect
  , eq        = a.strictEqual
  , Seqin     = SEQIN.Seqin
  , TestClass = Seqin // eg MathSeqin uses `TestClass = MathSeqin` here


describe(`Test specific browser '${ROOT.TestClassName}'`, () => {

	describe('getBuffers() result', () => {
        const ctx = new AudioContext()
        const cache = {}
        const testInstance = new TestClass({
            audioContext:     ctx
          , sharedCache:      cache
          , samplesPerBuffer: 2340
          , sampleRate:       23400
          , channelCount:     1
        })
        const buffers = testInstance.getBuffers({
            bufferCount:     8
          , cyclesPerBuffer: 234
          , isLooping:       true
          , events:          []
        })

    	it(`Buffers should contain expected data`, () => {
            buffers.forEach( (buffer,i) => {
                eq( buffer.id, 'si', `buffers[${i}].id is incorrect` )
                const channelData = buffer.data.getChannelData(0)
                const hash = asmCrypto.SHA256.hex( new Uint8Array(channelData) ) //@TODO check whether Uint8Array is correct
                eq(
                    hash
                  , '07993eb015fc52a2fd0f0d936bd674b93ddf29cc98fd252b77b35b8377bbb947'
                  , `buffers[${i}].data.getChannelData(0) has incorrect hash`
                )

                // console.log(hash)
            })
    	})


    })

})

}( 'object' === typeof window ? window : global )
