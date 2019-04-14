'use strict';

const path = require('path');
const grpc = require('grpc');
const protoFiles = require('google-proto-files');
const GoogleAuth = require('google-auth-library');

//Import proto files
const PROTO_ROOT_DIR = protoFiles('..');

const embedded_assistant_pb = grpc.load({
    root: PROTO_ROOT_DIR,
    file: path.relative(PROTO_ROOT_DIR, protoFiles.embeddedAssistant.v1alpha2)
}).google.assistant.embedded.v1alpha2;

class GoogleAssistant {
    constructor(credentials) {
        GoogleAssistant.prototype.endpoint_ = "embeddedassistant.googleapis.com";
        this.client = this.createClient_(credentials);
        this.locale = "en-US";
        this.deviceModelId = 'default';
        this.deviceInstanceId = 'default';
    }

    createClient_(credentials) {
        const sslCreds = grpc.credentials.createSsl();
        // https://github.com/google/google-auth-library-nodejs/blob/master/ts/lib/auth/refreshclient.ts
        const auth = new GoogleAuth();
        const refresh = new auth.UserRefreshClient();
        refresh.fromJSON(credentials, function (res) { });
        const callCreds = grpc.credentials.createFromGoogleCredential(refresh);
        const combinedCreds = grpc.credentials.combineChannelCredentials(sslCreds, callCreds);
        const client = new embedded_assistant_pb.EmbeddedAssistant(this.endpoint_, combinedCreds);
        return client;
    }
}

// GA auth
const homedir = require('homedir')
const deviceCredentials = require(`${homedir()}/.config/google-oauthlib-tool/credentials.json`); // Path to the Google credentials

const CREDENTIALS = {
    client_id: deviceCredentials.client_id,
    client_secret: deviceCredentials.client_secret,
    refresh_token: deviceCredentials.refresh_token,
    type: "authorized_user"
};

var assistant = new GoogleAssistant(CREDENTIALS);

exports.assistant = assistant;
exports.embedded_assistant_pb = embedded_assistant_pb;