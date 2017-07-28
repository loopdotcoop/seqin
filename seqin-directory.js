//// A curated list of Seqins.
!function (ROOT) {

ROOT.SEQIN = ROOT.SEQIN || {}
ROOT.SEQIN.directory = ROOT.SEQIN.directory || {

    //// The base ‘Seqin’ class.
    CDN: 'https://rawgit.com/loopdotcoop/seqin-base/master/seqin-base.js'
  , META: {
        NAME: 'Seqin'
      , ID: 'base'
      , VERSION: '1.0.2'
      , SPEC: '20170728'
      , HELP: 'The base class for all sequencer instruments. It’s not usually used directly - it just generates silent buffers.'
    }

    //// The ‘MathSeqin’ family.
  , ma: {
        CDN: 'https://rawgit.com/loopdotcoop/seqin-ma/master/seqin-ma.js'
      , META: {
            NAME: 'MathSeqin'
          , ID: 'ma'
          , VERSION: '1.0.0'
          , SPEC: '20170728'
          , HELP: 'The base class for all mathematical Seqins. It generates sine waves with ADSR envelopes.'
        }
      , m1ma: {
            CDN: 'https://rawgit.com/loopdotcoop/seqin-m1ma/master/seqin-m1ma.js'
          , META: {
                NAME: 'Monty1MathSeqin'
              , ID: 'm1ma'
              , VERSION: '1.0.0'
              , SPEC: '20170728'
              , HELP: 'Monty’s first (experimental) mathematical Seqin. @TODO description'
            }
        }
      , r1ma: {
            CDN: 'https://rawgit.com/richplastow/seqin-r1ma/master/seqin-r1ma.js'
          , META: {
                NAME: 'Rich1MathSeqin'
              , ID: 'r1ma'
              , VERSION: '1.0.0'
              , SPEC: '20170728'
              , HELP: 'Rich’s first (experimental) mathematical Seqin. @TODO description'
            }
        }
    }

    //// The ‘SynthSeqin’ family.
  , sy: {
        CDN: 'https://rawgit.com/loopdotcoop/seqin-sy/master/seqin-sy.js'
      , META: {
            NAME: 'SynthSeqin'
          , ID: 'sy'
          , VERSION: '1.0.0'
          , SPEC: '20170728'
          , HELP: 'The base class for all Seqin synths.'
        }
    }

}


}( 'object' === typeof window ? window : global )
