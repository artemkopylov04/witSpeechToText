const express   = require('express')
    , router    = express.Router()
    , speechToText = require('../helpers')

router.get('/', function(req, res) {

    speechToText(req, res);

});

module.exports = router;
