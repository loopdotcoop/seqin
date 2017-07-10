//// These tests run in the browser and also Node.js.
!function (ROOT) {

const
    isBrowser = 'object' === typeof window
  , a         = isBrowser ? chai.assert : require('chai').assert
  , expect    = isBrowser ? chai.expect : require('chai').expect
  , eq        = a.strictEqual
  , Seqin     = SEQIN.Seqin


//// This can be copy-pasted from the main script.
const META = {
    NAME:    { value:'Seqin'    }
  , ID:      { value:'si'       }
  , VERSION: { value:'0.0.4'    }
  , SPEC:    { value:'20170705' }
  , HELP:    { value:
`The base class for all sequencer instruments. It’s not usually used directly -
it just generates silent buffers.` }
}


describe('Seqin (isomorphic)', () => {

	describe('META', () => {

        ['NAME','ID','VERSION','SPEC','HELP'].map( key => {
            const val = META[key].value
            const shortval = 60<(''+val).length ? val.substr(0,59)+'…' : ''+val
        	it(`Seqin.${key} is "${shortval}"`, () => {
        		eq(Seqin[key], val)
        	})
        })

    })

	describe('Instantiation config', () => {

    	it(`should be an object`, () => {
            expect( () => { new Seqin() } )
               .to.throw('config is type undefined not object')
            expect( () => { new Seqin(123) } )
               .to.throw('config is type number not object')
    	})

    	it(`should contain values of expected type`, () => {
            expect( () => { new Seqin({
                audioContext:     true
              , sharedCache:      {}
              , samplesPerBuffer: 123
              , sampleRate:       123
              , channelCount:     1
            }) } )
               .to.throw('config.audioContext is type boolean not object')
            expect( () => { new Seqin({
                audioContext:     {}
              , sharedCache:      'abc'
              , samplesPerBuffer: 123
              , sampleRate:       123
              , channelCount:     1
            }) } )
               .to.throw('config.sharedCache is type string not object')
            expect( () => { new Seqin({
                audioContext:     {}
              , sharedCache:      {}
              , sampleRate:       123
              , channelCount:     1
            }) } )
               .to.throw('config.samplesPerBuffer is type undefined not number')
            expect( () => { new Seqin({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 123
              , sampleRate:       null
              , channelCount:     1
            }) } )
               .to.throw('config.sampleRate is type object not number')
            expect( () => { new Seqin({
                audioContext:     {}
              , sharedCache:      {}
              , samplesPerBuffer: 123
              , sampleRate:       123
              , channelCount:     null
            }) } )
               .to.throw('config.channelCount is type object not number')
    	})

        {
            const ctx = {}
            const cache = {}
            const seqin = new Seqin({
                audioContext:     ctx
              , sharedCache:      cache
              , samplesPerBuffer: 123
              , sampleRate:       456
              , channelCount:     2
            })

        	it(`should create instance properties`, () => {
        		eq(seqin.audioContext,     ctx,   'seqin.audioContext fail')
        		eq(seqin.sharedCache,      cache, 'seqin.sharedCache fail')
        		eq(seqin.samplesPerBuffer, 123,   'seqin.samplesPerBuffer fail')
        		eq(seqin.sampleRate,       456,   'seqin.sampleRate fail')
        		eq(seqin.channelCount,     2,     'seqin.channelCount fail')
        	})

        	it(`instance properties should be immutable`, () => {
                seqin.audioContext = {a:1}
                seqin.sharedCache = {b:2}
                seqin.samplesPerBuffer = 77
                seqin.sampleRate = 88
                seqin.channelCount = 1
        		eq(seqin.audioContext,     ctx,   'seqin.audioContext fail')
        		eq(seqin.sharedCache,      cache, 'seqin.sharedCache fail')
        		eq(seqin.samplesPerBuffer, 123,   'seqin.samplesPerBuffer fail')
        		eq(seqin.sampleRate,       456,   'seqin.sampleRate fail')
        		eq(seqin.channelCount,     2,     'seqin.sampleRate fail')
        	})
        }
    })


	describe('getBuffers() config', () => {
        const ctx = {}
        const cache = {}
        const seqin = new Seqin({
            audioContext:     ctx
          , sharedCache:      cache
          , samplesPerBuffer: 123
          , sampleRate:       45678
          , channelCount:     1
        })

    	it(`should be an object`, () => {
            expect( () => { seqin.getBuffers() } )
               .to.throw('config is type undefined not object')
            expect( () => { seqin.getBuffers(true) } )
               .to.throw('config is type boolean not object')
    	})

    	it(`should contain values of expected type`, () => {
            expect( () => { seqin.getBuffers({
                bufferCount:     false
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.bufferCount is type boolean not number')
            expect( () => { seqin.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: /nope/
              , isLooping:       true
              , events:          []
            }) } )
               .to.throw('config.cyclesPerBuffer is type object not number')
            expect( () => { seqin.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 123
              , isLooping:       null
              , events:          []
            }) } )
               .to.throw('config.isLooping is type object not boolean')
            expect( () => { seqin.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          ''
            }) } )
               .to.throw('config.events is type string not object')
    	})


    	it(`config.events should be an array`, () => {
            expect( () => { seqin.getBuffers({
                bufferCount:     8
              , cyclesPerBuffer: 123
              , isLooping:       true
              , events:          {}
            }) } )
               .to.throw('config.events is not an array')
    	})


    	it(`config.events should only contain valid 'event' objects`, () => {
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1}, {at:456,up:1}, 'whoops!', {at:789,down:1} ]
            }) } )
               .to.throw('config.events[2] is not an object')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1}, {} ]
            }) } )
               .to.throw('config.events[1].at is not a number')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1}, {at:-123.456} ]
            }) } )
               .to.throw('config.events[1] does not specify an action')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1,up:0} ]
            }) } )
               .to.throw('config.events[0] has more than one action')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,up:true} ]
            }) } )
               .to.throw('config.events[0].up is invalid')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,up:1.0001} ]
            }) } )
               .to.throw('config.events[0].up is invalid')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,up:-0.0001} ]
            }) } )
               .to.throw('config.events[0].up is invalid')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:'1'} ]
            }) } )
               .to.throw('config.events[0].down is invalid')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:1.0001} ]
            }) } )
               .to.throw('config.events[0].down is invalid')
            expect( () => { seqin.getBuffers({
                bufferCount: 8, cyclesPerBuffer: 123, isLooping: true
              , events: [ {at:123,down:-0.0001} ]
            }) } )
               .to.throw('config.events[0].down is invalid')

           //@TODO NEXT valid event objects

    	})
    })

    	// const main = new SEQIN.Main({
    	// 	worker: worker,
    	// 	tracks: 3,
    	// 	steps: 1,
    	// 	samplesPerBuffer: 5400
    	// });
        //
    	// it("should have 16 steps", () => {
    	// 	assert.lengthOf(main.steps, 1);
    	// });
        //
    	// it("should have 2 tracks", () => {
    	// 	assert.lengthOf(main.tracks, 3);
    	// });
        //
    	// main.addNote({
    	// 	voice:    SEQIN.Buzz,
    	// 	track:    0,
    	// 	on:       0,
    	// 	duration: 1,
    	// 	cycles:   60,
    	// 	velocity: 0.5
    	// });
        //
    	// main.addNote({
    	// 	voice:    SEQIN.Buzz,
    	// 	track:    1,
    	// 	on:       0,
    	// 	duration: 1,
    	// 	cycles:   80,
    	// 	velocity: 0.8
    	// });
        //
    	// main.addNote({
    	// 	voice:    SEQIN.Buzz,
    	// 	track:    2,
    	// 	on:       0,
    	// 	duration: 1,
    	// 	cycles:   90,
    	// 	velocity: 1.0
    	// });
        //
    	// it("should have mixed down slots", () => {
    	// 	return (new Promise(resolve => setTimeout(resolve, 1000))).then(() => {
    	// 		const buffer = main.steps[0].masterSlot.buffer.getChannelData(0);
        //
    	// 		const hash = asmCrypto.SHA256.hex(new Uint8Array(buffer));
        //
    	// 		assert.equal(hash, "1f7690d538aff47235621853143cfe2152e5b3bdc791fa821053655c6b88eb49");
    	// 	});
    	// });


})

}( 'object' === typeof window ? window : global )
