//// A curated list of Seqins.
!function (ROOT) {

ROOT.SEQIN = ROOT.SEQIN || {}
ROOT.SEQIN.SEQINS = ROOT.SEQIN.SEQINS || {

    //// Seqins which extend MathSeqin.
    ma: {
        m1: {
            CDN: 'https://rawgit.com/loopdotcoop/seqin-m1ma/master/Monty1MathSeqin.js'
          , NAME: 'Monty1MathSeqin'
          , ID: 'm1ma'
          , VERSION: '0.0.4'
          , SPEC: '20170705'
          , HELP: 'Monty’s first (experimental) mathematical Seqin. @TODO description'
        }
      , m1: {
            CDN: 'https://rawgit.com/richplastow/seqin-r1ma/master/Rich1MathSeqin.js'
          , NAME: 'Rich1MathSeqin'
          , ID: 'r1ma'
          , VERSION: '0.0.3'
          , SPEC: '20170705'
          , HELP: 'Rich’s first (experimental) mathematical Seqin. @TODO description'
        }
    }

    //// Seqins which extend SynthSeqin.
  , sy: {

    }
}


}( 'object' === typeof window ? window : global )
