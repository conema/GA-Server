# Google Assistant server (NodeJs)
GA-Server is a simple script that works as a server, it receives audio chunks from a client and it forwards them to Google Assistant. 
This script can be used (with a client) when you want to integrate GA into a device that is not powerful enough or in a device where the SDK 
couldn't be installed.
##  How use it
Steps from 1 to 5 are needed only if you don't have a registered project or the credentials

 1. Create/open a project in the [Actions Console](http://console.actions.google.com/)
 2. [Register a device model](https://developers.google.com/assistant/sdk/guides/service/python/embed/register-device)
 3. Download `credentials.json`
 4. Install the [`google-oauthlib-tool`](https://github.com/GoogleCloudPlatform/google-auth-library-python-oauthlib) in a [Python 3](https://www.python.org/downloads/) virtual environment:
 ```
python3 -m venv env
env/bin/python -m pip install --upgrade pip setuptools
env/bin/pip install --upgrade "google-auth-oauthlib[tool]"
```

5.  Use the [`google-oauthlib-tool`](https://github.com/GoogleCloudPlatform/google-auth-library-python-oauthlib) to generate credentials:
```
env/bin/google-oauthlib-tool --scope https://www.googleapis.com/auth/assistant-sdk-prototype \ 
--save --headless --client-secrets credentials.json
```
6.  Download the project and open it
7. Run `npm install`
8. Open `index.js` and edit the host, port, input/output  sample rate if needed (Default settings are: accept connections from all IPv4 addresses on the local machine on port 4000, audio with 16000Hz sample rate)
9. Run `node index.js`

If all it's working, it should appear a message with "TCP server listen on address: x.w.y.z:p" . That means that the server is ready to receive audio chunks from a client.


## How it works
A client sends microphone data to this server and waits for a JSON that contains the GA answer, an internet connection is needed where the server is.

 1. A **client** starts recording microphone's audio and every bits it's sent to the server trough a TCP stream
 2. The **server** start a connection with GA and it forwards microphone's audio sent by the client
 3. **GA** sends the response packets to the server 
 4. When GA sends an "END_OF_UTTERANCE", the **server** send a JSON to the client that contains: the transcription of the user input, the text response, the microphone mode and the conversation state (see the [documentation](https://developers.google.com/assistant/sdk/reference/rpc/google.assistant.embedded.v1alpha2) for more information) 
 6. The **client** receive the JSON response

## Client example
If you want to test the project without writing a client, you can use the example python client located in the `test`  folder. You just need to open it and edit the ip/port and put there the one of the server (eg. 127.0.0.1 and 4000). It can be run simply with `python test_send_file.py`.

The python script sends `whoisobama.wav` to the server, the server forward it to GA and send back to the client a JSON with the answer. That answer will be written by the client.

## Projects that use this
[Choregraphe-GA](https://github.com/conema/Choregraphe-GA) (Robot connected to Google Assistant)

[ZAGA](https://github.com/conema/ZAGA)

