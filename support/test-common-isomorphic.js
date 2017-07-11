//// 'common', because these tests can be run unmodified by all subclasses, eg
//// MathSeqin just replaces `TestClass = Seqin` with `TestClass = MathSeqin`.

//// 'isomorphic', because these tests will run in the browser or in Node.js.

!function (ROOT) {

const
    isBrowser = 'object' === typeof window
  , a         = isBrowser ? chai.assert : require('chai').assert
  , expect    = isBrowser ? chai.expect : require('chai').expect
  , eq        = a.strictEqual

    //// To test a `Seqin` subclass called `MyGreatSeqin`, you should have set:
    //// window.TestClassName = 'MyGreatSeqin' // browser
    //// ...or...
    //// global.TestClassName = 'MyGreatSeqin' // Node.js
  , TestClass = SEQIN[ROOT.TestClassName]

    //// To test a `Seqin` subclass called `MyGreatSeqin`, you should have set:
    //// window.TestMeta = { // replace `window` with `global` for Node.js
    ////     NAME:    { value:'MyGreatSeqin' }
    ////   , ID:      { value:'mygt'       }
    ////   , VERSION: { value:'1.2.3'    }
    ////   , SPEC:    { value:'20170705' }
    ////   , HELP:    { value: 'This is literally the best Seqin ever made!' }
    //// }
  , TestMeta = ROOT.TestMeta


describe(`Test common isomorphic '${ROOT.TestClassName}'`, () => {

	describe('META', () => {

        ['NAME','ID','VERSION','SPEC','HELP'].map( key => {
            const val = TestMeta[key].value
            const shortval = 60<(''+val).length ? val.substr(0,59)+'…' : ''+val
        	it(`${ROOT.TestClassName}.${key} is "${shortval}"`, () => {
        		eq(TestClass[key], val)
        	})
        })

    })

	describe('Instantiation config', () => {

    	it(`should be an object`, () => {
            expect( () => { new TestClass() } )
               .to.throw('config is type undefined not object')
            expect( () => { new TestClass(123) } )
               .to.throw('config is type number not object')
    	})

    	it(`should contain values of expected type`, () => {
            expect( () => { new TestClass({
                audioContext:     true
              , sharedCache:      {}
              , samplesPerBuffer: 123
              , sampleRate:       22050
              , channelCount:     1
            }) } )
               .to.throw('config.audioContext is type boolean not object')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      'abc'
              , samplesPerBuffer: 123
              , sampleRate:       22050
              , channelCount:     1
            }) } )
               .to.throw('config.sharedCache is type string not object')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , sampleRate:       22050
              , channelCount:     1
            }) } )
               .to.throw('config.samplesPerBuffer is type undefined not number')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 123
              , sampleRate:       null
              , channelCount:     1
            }) } )
               .to.throw('config.sampleRate is type object not number')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 123
              , sampleRate:       22050
              , channelCount:     null
            }) } )
               .to.throw('config.channelCount is type object not number')
    	})

    	it(`samplesPerBuffer should contain values within range`, () => {
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: -7
              , sampleRate:       22050
              , channelCount:     1
            }) } )
               .to.throw('config.samplesPerBuffer is less than the minimum 8')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 96001
              , sampleRate:       22050
              , channelCount:     1
            }) } )
               .to.throw('config.samplesPerBuffer is greater than the maximum 96000')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 12345.6
              , sampleRate:       22050
              , channelCount:     1
            }) } )
               .to.throw('config.samplesPerBuffer leaves a remainder when divided by 1')
    	})

    	it(`sampleRate should contain values within range`, () => {
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 8
              , sampleRate:       22049
              , channelCount:     1
            }) } )
               .to.throw('config.sampleRate is less than the minimum 22050')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 8
              , sampleRate:       96001
              , channelCount:     1
            }) } )
               .to.throw('config.sampleRate is greater than the maximum 96000')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 8
              , sampleRate:       22050.5
              , channelCount:     1
            }) } )
               .to.throw('config.sampleRate leaves a remainder when divided by 1')
    	})

    	it(`channelCount should contain values within range`, () => {
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 8
              , sampleRate:       22050
              , channelCount:     0
            }) } )
               .to.throw('config.channelCount is less than the minimum 1')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 8
              , sampleRate:       96000
              , channelCount:     33
            }) } )
               .to.throw('config.channelCount is greater than the maximum 32')
            expect( () => { new TestClass({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 8
              , sampleRate:       96000
              , channelCount:     15.0001
            }) } )
               .to.throw('config.channelCount leaves a remainder when divided by 1')
    	})

        {
            const ctx = {}
            const cache = {}
            const testInstance = new TestClass({
                audioContext:     ctx
              , sharedCache:      cache
              , samplesPerBuffer: 123
              , sampleRate:       22050
              , channelCount:     2
            })

        	it(`should create instance properties`, () => {
        		eq(testInstance.audioContext,     ctx,   'testInstance.audioContext fail')
        		eq(testInstance.sharedCache,      cache, 'testInstance.sharedCache fail')
        		eq(testInstance.samplesPerBuffer, 123,   'testInstance.samplesPerBuffer fail')
        		eq(testInstance.sampleRate,       22050, 'testInstance.sampleRate fail')
        		eq(testInstance.channelCount,     2,     'testInstance.channelCount fail')
        	})

        	it(`instance properties should be immutable`, () => {
                testInstance.audioContext = {a:1}
                testInstance.sharedCache = {b:2}
                testInstance.samplesPerBuffer = 77
                testInstance.sampleRate = 88
                testInstance.channelCount = 1
        		eq(testInstance.audioContext,     ctx,   'testInstance.audioContext fail')
        		eq(testInstance.sharedCache,      cache, 'testInstance.sharedCache fail')
        		eq(testInstance.samplesPerBuffer, 123,   'testInstance.samplesPerBuffer fail')
        		eq(testInstance.sampleRate,       22050, 'testInstance.sampleRate fail')
        		eq(testInstance.channelCount,     2,     'testInstance.channelCount fail')
        	})
        }
    })


	describe('getBuffers() config', () => {
        const ctx = {}
        const cache = {}
        const testInstance = new TestClass({
            audioContext:     ctx
          , sharedCache:      cache
          , samplesPerBuffer: 123
          , sampleRate:       45678
          , channelCount:     1
        })

    	it(`should be an object`, () => {
            expect( () => { testInstance.getBuffers() } )
               .to.throw('config is type undefined not object')
            expect( () => { testInstance.getBuffers(true) } )
               .to.throw('config is type boolean not object')
    	})

    	it(`should contain values of expected type`, () => {
            expect( () => { testInstance.getBuffers({
                bufferCount:     false
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.bufferCount is type boolean not number')
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: /nope/
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.cyclesPerBuffer is type object not number')
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 123
              , isLooping:       null
              , events:          []
            }) } )
               .to.throw('config.isLooping is type object not boolean')
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          ''
            }) } )
               .to.throw('config.events is type string not object')
    	})

    	it(`bufferCount should contain values within range`, () => {
            expect( () => { testInstance.getBuffers({
                bufferCount:     0
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.bufferCount is less than the minimum 1')
            expect( () => { testInstance.getBuffers({
                bufferCount:     65536
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.bufferCount is greater than the maximum 65535')
            expect( () => { testInstance.getBuffers({
                bufferCount:     123.4
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.bufferCount leaves a remainder when divided by 1')
    	})

    	it(`cyclesPerBuffer should contain values within range`, () => {
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 0
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.cyclesPerBuffer is less than the minimum 1')
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 65536
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.cyclesPerBuffer is greater than the maximum 65535')
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 123.4
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.cyclesPerBuffer leaves a remainder when divided by 1')
    	})

    	it(`samplesPerBuffer/cyclesPerBuffer must be an integer`, () => {
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 124
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('samplesPerBuffer/cyclesPerBuffer is not an integer')
    	})


    	it(`config.events should be an array`, () => {
            expect( () => { testInstance.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          {}
            }) } )
               .to.throw('config.events is not an array')
    	})


    	it(`config.events should only contain valid 'event' objects`, () => {
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1}, {at:456,up:1}, 'whoops!', {at:789,down:1} ]
            }) } )
               .to.throw('config.events[2] is not an object')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1}, {} ]
            }) } )
               .to.throw('config.events[1].at is not a number')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1}, {at:-123.456} ]
            }) } )
               .to.throw('config.events[1] does not specify an action')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1,up:0} ]
            }) } )
               .to.throw('config.events[0] has more than one action')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,up:true} ]
            }) } )
               .to.throw('config.events[0].up is invalid')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,up:1.0001} ]
            }) } )
               .to.throw('config.events[0].up is invalid')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,up:-0.0001} ]
            }) } )
               .to.throw('config.events[0].up is invalid')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:'1'} ]
            }) } )
               .to.throw('config.events[0].down is invalid')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1.0001} ]
            }) } )
               .to.throw('config.events[0].down is invalid')
            expect( () => { testInstance.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:-0.0001} ]
            }) } )
               .to.throw('config.events[0].down is invalid')

           //@TODO NEXT valid event objects

    	})
    })

})

}( 'object' === typeof window ? window : global )
