import socket
import re
import json
import wave
import struct

# TCP client
TCP_IP = '127.0.0.1'
TCP_PORT = 32768

waveFile = wave.open("whoisobama.wav", 'rb')

dataList = []

length = waveFile.getnframes()
for i in range(0, length):
    data = struct.unpack("<h", waveFile.readframes(1))
    dataList.append(data[0])

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect((TCP_IP, TCP_PORT))

s.send(struct.pack("<48000h", *dataList))

eu = ""

while True:
    eu += s.recv(1024)

    #No more data from server
    if("STOP_JSON" in eu):
        break

data = re.search('START_JSON(.*)STOP_JSON', eu)

response = json.loads(data.group(1))

print response["text"]

s.close()
