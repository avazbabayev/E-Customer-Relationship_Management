var http=require('http');
const express = require('express');
const socketio = require('socket.io');
var session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var http = require('http').Server(app);

app.use(express.static('views'));
app.set('view engine', 'ejs');

// sessions middleware
app.use(session({
    secret: "secret",
    //  name: cookie_name,
    //store: sessionStore, // connect-mongo session store
    proxy: true,
    resave: true,
    saveUninitialized: true
}));


var path = __dirname + '/views/';
var routes = require('./server/routes')(app);
var productroutes = require('./server/Product-Server')(app);
var userroutes = require('./server/User-Server')(app);
var supplier = require('./server/Supplier-Server')(app);
var employee = require('./server/Employee')(app);
const customerRoutes = require('./routes/customers')(app);
const smsService = require('./server/sms-server')(app);
const FCMnotification = require('./server/FCM-Notifications')(app);
//const fcmNotification = require('server/fcm-notification')(app);
//const firebaseClient = require('./server/firebase-client')(app);
//const notification = require('./server/firebase-notifications');

//config database
const configDB = require('./server/config');

// start server
const port = process.env.PORT || 8080;
const server = http.listen(port);

// Connect to socket.io
var io = socketio(server);
io.on('connection', (socket) => {
    console.log('Connected');
    io.on('disconnect', () => {
        console.log('Disconnected');
    })
});

app.set('io', io);