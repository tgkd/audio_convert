const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const toWav = require('audiobuffer-to-wav');
const AudioContext = require('web-audio-api').AudioContext;

const audioContext = new AudioContext();
const app = express();

app.use(
    cors({
        origin: 'http://localhost:9000',
        methods: ['POST'],
        credentials: true
    })
);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'results')));

const cleanupDirectory = name => {
    fs.readdir(name, (err, files) => {
        if (err) throw err;

        for (const file in files) {
            fs.unlink(path.join(name, file), err => {
                if (err) throw err;
            });
        }
    });
};

app.post('/convert', (req, res) => {
    const data = req.body;
    const fileFormat = data.name.split('.').slice(-1)[0];
    const randomName = Math.random()
        .toString(36)
        .substring(4);

    const filePath = path.resolve(
        __dirname,
        `incoming/${randomName}.${fileFormat}`
    );

    const base64Data = data.content
        .split(',')
        .slice(1)
        .join('');

    fs.writeFileSync(filePath, base64Data, 'base64');

    const resp = fs.readFileSync(filePath);

    audioContext.decodeAudioData(resp, buffer => {
        const wav = toWav(buffer);
        const resultFile = `./results/${randomName}.wav`;
        fs.appendFile(resultFile, new Buffer(wav), (err, result) => {
            const resultPath = path.resolve(
                __dirname,
                `results/${randomName}.wav`
            );
            res.status(200).send({
                link: `http://localhost:3056/${randomName}.wav`
            });
           // cleanupDirectory('incoming');
        });
    });
});

app.listen(3056);
