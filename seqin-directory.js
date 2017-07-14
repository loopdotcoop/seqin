//// A curated list of Seqins.
!function (ROOT) {

ROOT.SEQIN = ROOT.SEQIN || {}
ROOT.SEQIN.directory = ROOT.SEQIN.directory || {

    //// The base ‘Seqin’ class.
    CDN: 'https://rawgit.com/loopdotcoop/seqin-si/master/Seqin.js'
  , META: {
        NAME: 'Seqin'
      , ID: 'si'
      , VERSION: '0.0.7'
      , SPEC: '20170705'
      , HELP: 'The base class for all sequencer instruments. It’s not usually used directly - it just generates silent buffers.'
    }

    //// The ‘MathSeqin’ family.
  , ma: {
        CDN: 'https://rawgit.com/loopdotcoop/seqin-ma/master/MathSeqin.js'
      , META: {
            NAME: 'MathSeqin'
          , ID: 'ma'
          , VERSION: '0.0.3'
          , SPEC: '20170705'
          , HELP: 'The base class for all mathematical Seqins. It’s not usually used directly - it just generates silent buffers.'
        }
      , m1ma: {
            CDN: 'https://rawgit.com/loopdotcoop/seqin-m1ma/master/Monty1MathSeqin.js'
          , META: {
                NAME: 'Monty1MathSeqin'
              , ID: 'm1ma'
              , VERSION: '0.0.4'
              , SPEC: '20170705'
              , HELP: 'Monty’s first (experimental) mathematical Seqin. @TODO description'
            }
        }
      , r1ma: {
            CDN: 'https://rawgit.com/richplastow/seqin-r1ma/master/Rich1MathSeqin.js'
          , META: {
                NAME: 'Rich1MathSeqin'
              , ID: 'r1ma'
              , VERSION: '0.0.3'
              , SPEC: '20170705'
              , HELP: 'Rich’s first (experimental) mathematical Seqin. @TODO description'
            }
        }
    }

    //// The ‘SynthSeqin’ family.
  , sy: {
        CDN: 'https://rawgit.com/loopdotcoop/seqin-sy/master/SynthSeqin.js'
      , META: {
            NAME: 'SynthSeqin'
          , ID: 'sy'
          , VERSION: '0.0.5'
          , SPEC: '20170705'
          , HELP: 'The base class for all Seqin synths. It’s not usually used directly - it’s a very rudimentary synthesiser.'
        }
    }

}


}( 'object' === typeof window ? window : global )
