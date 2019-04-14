'use strict';

var GoogleAssistant = require('./googleassistant.js')

var net = require('net');
/* [DEBUG] Save audio chunks
const FileWriter = require('wav').FileWriter;
var stream = require('stream');
*/

//Server configuration
const HOST = '0.0.0.0'
const PORT = 4000

//GA configuration
const inputSampleRate = 16000;
const inputEncoding = 1;
const outputSampleRate = 16000;
const outputEncoding = 1;

const assistant = GoogleAssistant.assistant;
const embedded_assistant_pb = GoogleAssistant.embedded_assistant_pb;

var server = net.createServer(function (client) {
    console.log('Client connected:' + client.remoteAddress + ':' + client.remotePort);

    client.setTimeout(3000);
    client.setKeepAlive(true);

    //GA start
    const config = new embedded_assistant_pb.AssistConfig();

    //Input
    config.setAudioInConfig(new embedded_assistant_pb.AudioInConfig());
    config.getAudioInConfig().setEncoding(inputEncoding);
    config.getAudioInConfig().setSampleRateHertz(inputSampleRate);

    //Output
    config.setAudioOutConfig(new embedded_assistant_pb.AudioOutConfig());
    config.getAudioOutConfig().setEncoding(outputEncoding);
    config.getAudioOutConfig().setSampleRateHertz(outputSampleRate);
    config.getAudioOutConfig().setVolumePercentage(100);

    config.setDialogStateIn(new embedded_assistant_pb.DialogStateIn());
    config.setDeviceConfig(new embedded_assistant_pb.DeviceConfig());
    config.getDialogStateIn().setLanguageCode(assistant.locale);
    config.getDeviceConfig().setDeviceId(assistant.deviceInstanceId);
    config.getDeviceConfig().setDeviceModelId(assistant.deviceModelId);
    const request = new embedded_assistant_pb.AssistRequest();
    request.setConfig(config);
    delete request.audio_in;

    const conversation = assistant.client.assist();

    // Send config to GA
    conversation.write(request);

    // GA response JSON
    let response = {};

    //[DEBUG] Audio bytes
    //let audioTCP = null;

    /* GA data start */
    conversation.on('data', (data) => {
        if (data.device_action) {
            // Device action
            response.deviceAction = JSON.parse(data.device_action.device_request_json);
        } else if (data.dialog_state_out !== null && data.dialog_state_out.supplemental_display_text) {
            // Response text
            response.text = data.dialog_state_out.supplemental_display_text;
            response.microphone_mode = data.dialog_state_out.microphone_mode;
            response.conversation_state = data.dialog_state_out.conversation_state;
        } else if (data.speech_results != [] && data.speech_results.length == 1 && data.speech_results[0].stability == 1) {
            // Audio transcript
            response.transcript = data.speech_results[0].transcript;
        }else if (data.event_type == "END_OF_UTTERANCE") {
            // End of utterance
            var bf = Buffer.from("0END_OF_UTTERANCE");
            
            client.write(bf);
            console.log("END_OF_UTTERANCE");
        }

        //[DEBUG] AssistResponse
        console.log(data);
    });

    conversation.on('end', (error) => {
        // Send json with response to the client
        var bf1 = Buffer.from("START_JSON");
        var bf2 = Buffer.from(JSON.stringify(response));
        var bf3 = Buffer.from("STOP_JSON");
        client.write(Buffer.concat([bf1, bf2, bf3]));
    });

    conversation.on('error', (error) => {
            console.log(error);
    });
    /* GA data end */

    /* Server start */
    client.on('data', function (data) {
        //console.log('Read: ' + client.bytesRead);

        //[DEBUG] Concat audio buffer for save the final audio
        /*if(audioTCP == null){
            audioTCP = data
        }else{
            audioTCP = Buffer.concat([audioTCP, data])
        }*/

        // Split audio in smaller chunks if needed
        const buf_length = 1024;
        var buf_start = 0;
        var buf_end = buf_length;
        while (true) {
            //Create GA request
            const audio = new embedded_assistant_pb.AssistRequest();
            audio.setAudioIn(data.slice(buf_start, buf_end));

            //Send audio to GA
            conversation.write(audio);

            buf_start = buf_end;
            buf_end += buf_length;

            if (buf_start >= data.length) {
                break;
            }
        }
    });

    client.on('error', (error) => {
        console.log(error);
    });

    client.on('end', function () {
        console.log('Client disconnect.');

        //[DEBUG] Save final audio file
        /*var outputFileStream = new FileWriter('out.wav', {
            sampleRate: 16000,
            channels: 1
        });

        var bufferStream = new stream.PassThrough();
        bufferStream.end(audioTCP);
        bufferStream.pipe(outputFileStream)*/

        conversation.end();

        server.getConnections(function (err, count) {
            if (!err) {
                console.log('There are ' + count +' connections.');
            } else {
                console.error(JSON.stringify(err));
            }
        });
    });

    client.on('timeout', function () {
        console.log('Client request time out. ');
    })
    /* Server end */
});


// TCP server listening
server.listen(PORT, HOST, function () {

    console.log('TCP server listen on address : ' + HOST + ':' + PORT);

    server.on('close', function () {
        console.log('TCP server socket is closed.');
    });

    server.on('error', function (error) {
        console.error(JSON.stringify(error));
    });
});
