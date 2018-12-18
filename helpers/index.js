const request   = require('request')
    , path      = require('path')
    , fs        = require('fs')
    , temp      = require('temp')
    , download  = require('download')
    , ffmpeg    = require('fluent-ffmpeg')
    , ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

const witSpeechRequest = (audioBinary, callback) => {

    //const buffer  = fs.readFileSync(wavPath);

    const headers = {
        'Authorization': 'Bearer ' + process.env.TOKEN,
        'Content-Type': 'audio/wav'
    };

    request({
        url: 'https://api.wit.ai/speech',
        method: 'POST',
        headers: headers,
        body: fs.readFileSync(audioBinary),
        encoding: null
    }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            callback(null, JSON.parse(body))
        }
        else {
            callback(error)
        }
    })
};


module.exports = async function speechToText(req, res) {

    const ogaPath = temp.path({ suffix: '.oga' });
    const wavPath = temp.path({ suffix: '.wav' });
    //const wavPath = 'files/file223.wav';

    try {
        const data = await download(req.query.url);
        fs.writeFileSync(ogaPath, data);
    } catch (err) {
        console.log(err);
        res.sendStatus(400)
    }

    try {

        console.log(ffmpeg)

        await new Promise((resolve, reject) => {
            ffmpeg(ogaPath)
                .toFormat('wav')
                .on('error', (err) => {
                    console.log('An error occurred: ' + err.message);
                    reject();
                })
                .on('progress', (progress) => {
                    console.log('Processing: ' + progress.targetSize + ' KB converted');
                })
                .on('end', () => {
                    console.log('Processing finished !');
                    resolve();
                })
                .output(wavPath)
                .run();
        });

    } catch (err) {
        console.log(err);
        res.sendStatus(400)
    }


    try {
        await witSpeechRequest(wavPath, function(err, data) {
            if (err) {
                res.send(500, {error: 'something blew up'});
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send(data);
            }
        });
    } catch (err) {
        console.log(err);
        res.sendStatus(400)
    }


};
