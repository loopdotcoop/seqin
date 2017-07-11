//// 'common', because these tests can be run unmodified by all subclasses, eg
//// MathSeqin just replaces `TestClass = Seqin` with `TestClass = MathSeqin`.

//// 'browser', because these tests need a fully functional AudioContext. That
//// means they’ll only run in the browser, not Node.js.

!function (ROOT) {

const
    a         = chai.assert
  , expect    = chai.expect
  , eq        = a.strictEqual

    //// To test a `Seqin` subclass called `MyGreatSeqin`, you should have set:
    //// window.TestClassName = 'MyGreatSeqin'
  , TestClass = SEQIN[ROOT.TestClassName]


describe(`Test common browser '${ROOT.TestClassName}'`, () => {

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

    	it(`should return an array of buffers`, () => {
    		a.ok( Array.isArray(buffers), 'not an array' )
    		eq( buffers.length, 8, 'wrong buffers.length' )
            buffers.forEach( (buffer,i) => {
                a.ok( buffer.data instanceof ROOT.AudioBuffer, `buffers[${i}].data is not an AudioBuffer` )
                eq( buffer.data.duration, 0.1, `buffers[${i}].duration is incorrect` )
                eq( buffer.data.length, 2340, `buffers[${i}].length is incorrect` )
                eq( buffer.data.numberOfChannels, 1, `buffers[${i}].numberOfChannels is incorrect` )
                eq( buffer.data.sampleRate, 23400, `buffers[${i}].sampleRate is incorrect` )
            })
    	})


    })

})

}( 'object' === typeof window ? window : global )
