const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io').listen(server);
const RTM = require("satori-sdk-js");

//START SERVER / SERVER HTML

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

server.listen(3000, () => console.log('SERVER RUNNING ON 3000'));


//SATORI DATA STREAM CONNECT
const endpoint = "wss://open-data.api.satori.com";
const appKey = "9BABD0370e2030dd5AFA3b1E35A9acBf";
const channelTraffic = "nyc-traffic-speed";
const rtm = new RTM(endpoint, appKey);

rtm.on("enter-connected", () => console.log("Connected to RTM!"));

const subscriptionTraffic = rtm.subscribe(channelTraffic, RTM.SubscriptionMode.SIMPLE);

let barData = [];
let tempData = [];

subscriptionTraffic.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(function (msg) {
    if(msg.Borough === 'Staten island') msg.Borough = 'Staten Island';
    if(tempData.length < 1000) tempData.push(msg);
  });
});

rtm.start();

setInterval(() => {
  if (tempData.length > 0) {
    let freshData = tempData.shift();

    let found = false;
    for (let i = 0; i < barData.length; i += 1) {
      if (barData[i].Borough === freshData.Borough) {
        barData[i].Speed = (Number(barData[i].Speed) + Number(freshData.Speed)) / 2;
        found = true;
      }
    }

    freshData.Speed = Number(freshData.Speed);
    if (!found) barData.push(freshData);
  }
}, 800)

//CONNECT TO SOCKETS
let connections = [];

io.sockets.on('connection', socket => {
  //Connect
  connections.push(socket);
  console.log('connected: %s sockets connected', connections.length);

  //Disconnect
  socket.on('disconnect', data => {
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });

  //Send Data
  setInterval(() => socket.emit('SEND_DATA', barData), 1000);
});



