const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
//const fs = require('fs');
const path = require('path');

const admin = require('firebase-admin');
const express = require('express');
const app = express();
const cors=require('cors');
app.use(cors());
const saltedMd5 = require('salted-md5');
app.set('views', path.join(__dirname, 'static', 'views'));
app.use('/public', express.static(path.join(__dirname, 'static', 'public')));
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const multer = require('multer');
const upload = multer();
var nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const REFRESH_TOKEN = "1//04bbM6JCFu8hRCgYIARAAGAQSNwF-L9IrSsFZUWdFsLyBu0RwjdbYMGsXn0aGR6THU1AgckIt7QKjxUFjy0VN_cIYGcB_9-RYbv8";
const CLIENT_SECRET = "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";
const CLIENT_ID = "909703194558-ss01pbjoreqkskn6su7f03op8ch6oqs8.apps.googleusercontent.com";
const Ftp = require('ftp');
const ftp = require("basic-ftp")
var fs = require('fs');
app.use(express.urlencoded({extended: true}));
const AUTH_TOKEN = 'dasdalkd9w0aid09wjf9okdpfoj0sjd289unklvxcnjbrb9tg94nv';
var backendPort = 8080
//*************************************
const schedule = require('node-schedule');
const startTime = new Date(Date.now() + 1000);
const endTime1 = new Date(Date.now() + 10000);
var counter = 0;
var todayDate = new Date();
var dd = String(todayDate.getDate()).padStart(2, '0');
var mm = String(todayDate.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = todayDate.getFullYear();
todayDate = dd + '-' + mm + '-' + yyyy;
//const job = schedule.scheduleJob({ start: startTime, end: endTime, rule: '*/10 * * * * *' }, async function(){
const job = schedule.scheduleJob({ start: startTime, rule: '* * * /1 * *' }, async function(){
//const job = schedule.scheduleJob({ start: startTime, rule: '*/5 * * * * *' }, async function(){
  counter++;
  console.log('Monitoring all client data, ', counter);

  var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }

    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    var keysClientData = [];
    await userRef.once('value').then((snapshot) => {
        var index = 0;
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            keysClientData.push({id: Object.keys(snapshot.val())[index], clientname: itemVal['Client Name'], email: itemVal.email, date: itemVal.initial_certification_conclusion_date, surveillance_date: surveillance_audit_date});
            index++;
        });
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    }); 
    for (var intIdx = 0; intIdx < keysClientData.length; intIdx++) {
        var newUserRef=db.ref("surveillance_audit_clients/" + keysClientData[intIdx].id + "/surveillance_audit_date");
        var surveillance_audit_date = "";
        var initial_certification_conclusion_date = "";
        await newUserRef.once('value').then((snapshot) => {
            var item1 = snapshot.val();
            if (item1 != null)
            surveillance_audit_date = item1;
        });
        if (surveillance_audit_date == "") {
            var auditDate = keysClientData[intIdx].date;
            var today = new Date(todayDate.split('-')[2],todayDate.split('-')[1]-1,todayDate.split('-')[0]);
            var date2 = new Date(auditDate.split('-')[2],auditDate.split('-')[1]-1,auditDate.split('-')[0]);
            var timeDiff = Math.abs(date2.getTime() - today.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            if (diffDays > 183) {
                //console.log('Name: ', keysClientData[intIdx].clientname, 'diffdays: ', diffDays);
                const createTransporter = async () => {
                    const oauth2Client = new OAuth2(
                        CLIENT_ID,
                        CLIENT_SECRET,
                        "https://developers.google.com/oauthplayground"
                    );
                    oauth2Client.setCredentials({
                        refresh_token: REFRESH_TOKEN
                    });
                    const accessToken = await new Promise((resolve, reject) => {
                        oauth2Client.getAccessToken((err, token) => {
                        if (err) {
                            res.send(err);
                        }
                        resolve(token);
                        });
                    });
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                        type: "OAuth2",
                        user: "cwactechnologies@gmail.com",
                        accessToken,
                        clientId: CLIENT_ID,
                        clientSecret: CLIENT_SECRET,
                        refreshToken: REFRESH_TOKEN
                        }
                    });
                    return transporter;
                    };
                    const sendEmail = async (emailOptions) => {
                        let emailTransporter = await createTransporter();
                        await emailTransporter.sendMail(emailOptions, function(error, info) {               
                            if(error) {
                                console.log(error);
                            } else {
                                console.log('Thank you for your submission. We will contact you soon.')
                            }
                        });
                    };
                    sendEmail({
                        subject: "Please conduct your surveillance Audit",
                        //text: "Dear sir,\nYou applied for Initial Certification " + diffDays + " days back. Please apply for initial certification within " + (365 - diffDays) + " days.",
                        text: "Dear sir,\nYou have completed your Initial Certification Process on " + keysClientData[intIdx].date + ". Please apply for initial certification within " + (365 - diffDays) + " days.",
                        to: keysClientData[intIdx].email,
                        from: "cwactechnologies@gmail.com"
                    });
            }
        }
        var newItem = keysClientData[intIdx];
        newItem.surveillance_date = surveillance_audit_date;
        keysClientData[intIdx] = newItem;
    }
});
//*************************************
app.post('/addclientapplicationform', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    addUser({
        'Client Name': req.body['Client Name'],
        'Approved': 'No',
        'description': req.body['description'],
        'date': req.body['date'],
        'assignedToWhom': req.body['assignedToWhom'],
        'stage1_team_assigned': 'No',
        'stage2_team_assigned': 'No',
        'stage1_plan_status': 'Open',
        'stage1_plan_date': "",
        'stage2_plan_status': 'Open',
        'stage2_plan_date': "",
        'quotation_status': 'Open',
        'quotation_date': '',
        'HO_activity_status': 'Open',
        'HO_activity_date': '',
        'stage1_plan_task_status': 'Open',
        'stage1_plan_task_date': '',
        'stage2_plan_task_status': 'Open',
        'stage2_plan_task_date': '',
        'initial_certification_conclusion': 'Open',
        'initial_certification_conclusion_date': '',
        'surveillance_audit_status': 'Open',
        'email': req.body['email'],
        'phone': req.body['phone'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Customer Application Added Successfully');
            client.delete();
        })
    }
});
app.post('/addclientapplicationform_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'status': 'Open',
        'date': req.body['date'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Customer Application Added Successfully');
            client.delete();
        })
    }
});
app.post('/addclientapplicationfile', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/init_certification_client_application/' + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('Customer Application Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/addclientapplicationfile_to_logs', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('Customer Application Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/fetchcustomerapplication_v1', (req, res) => {
    // if (req.body['audit_software_token'] != AUTH_TOKEN) {
    //     res.send({'error_message': "User Not Authorized"});
    //     return;
    // }
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    userRef.on('value', (snapshot) => {
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            if (req.body.request_from == 'Quotation Status' || req.body.request_from == 'HO Activity')
            {
                if (itemVal['Approved'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Assign Stage 1 Audit Team')
            {
                if (itemVal['quotation_status'] == 'Completed')
                //if (itemVal['Approved'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Stage 1 Audit Plan') {
                if (itemVal['stage1_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Assign Stage 2 Audit Team') {
                if (itemVal['stage1_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Stage 2 Audit Plan') {
                if (itemVal['stage2_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Initial Certification Conclusions') {
                if (itemVal['stage2_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Existing Surveillance Audit Clients') {
                if (itemVal['initial_certification_conclusion'] == 'Completed')
                    keys.push(itemVal);
            }
            else keys.push(itemVal);
            index++;
            if (index == snapshot.numChildren()) {
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetchcustomerapplication_v2', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    userRef.on('value', (snapshot) => {
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            if (req.body.request_from == 'Assign Surveillance Audit Team')
            {
                if (itemVal['Status'] == 'Approved')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Surveillance Audit Plan')
            {
                if (itemVal['surveillance_audit_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Surveillance Audit Conclusions')
            {
                if (itemVal['surveillance_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Existing Recertification Audit Clients')
            {
                if (itemVal['surveillance_audit_conclusion'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Assign Recertification Audit Team')
            {
                if (itemVal['recertification_status'] == 'Approved')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Plan')
            {
                if (itemVal['recertification_audit_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Conclusions')
            {
                if (itemVal['recertification_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else keys.push(itemVal);
            index++;
            if (index == snapshot.numChildren()) {
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetchcustomerapplication_v3', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    userRef.on('value', (snapshot) => {
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            // if (req.body.request_from == 'Assign Surveillance Audit Team')
            // {
            //     if (itemVal['Status'] == 'Approved')
            //         keys.push(itemVal);
            // }
            // else if (req.body.request_from == 'Surveillance Audit Plan')
            // {
            //     if (itemVal['surveillance_audit_team_assigned'] == 'Yes')
            //         keys.push(itemVal);
            // }
            // else if (req.body.request_from == 'Surveillance Audit Conclusions')
            // {
            //     if (itemVal['surveillance_plan_status'] == 'Completed')
            //         keys.push(itemVal);
            // }
            // else if (req.body.request_from == 'Existing Recertification Audit Clients')
            // {
            //     if (itemVal['surveillance_audit_conclusion'] == 'Completed')
            //         keys.push(itemVal);
            // }
            //else if (req.body.request_from == 'Assign Recertification Audit Team')
            if (req.body.request_from == 'Assign Recertification Audit Team')
            {
                if (itemVal['Status'] == 'Approved')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Plan')
            //if (req.body.request_from == 'Recertification Audit Plan')
            {
                if (itemVal['recertification_audit_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Conclusions')
            {
                if (itemVal['recertification_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            // else keys.push(itemVal);
            else keys.push(itemVal);
            index++;
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetchcustomerapplication', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage1_audit_team_members', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage1_audit_team_members', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage1_audit_teams/" + req.body['clientid'] + "/stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage1_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage1_audit_teams/" + req.body['clientid'] + "/stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_surveillance_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_surveillance_audit_teams/" + req.body['clientid'] + "/surveillance_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_recertification_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_recertification_audit_teams/" + req.body['clientid'] + "/recertification_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage2_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage2_audit_teams/" + req.body['clientid'] + "/stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage1_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, stage1PlanDescription: value.stage1PlanDescription, status: value.status, date: value.date});
                });
            }
            res.send({stage1PlanDescription: val.stage1PlanDescription, logs: keys});
        }
        else res.send({stage1PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit_plan', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //if (snapshot.val() != null)
        //    res.send(snapshot.val());
        //else res.send({surveillanceAuditPlanDescription: "", taskList: []});
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({surveillancePlanDescription: val.surveillanceAuditPlanDescription, logs: keys});
        }
        else res.send({stage2PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit_plan', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //console.log(snapshot.val());
        // if (snapshot.val() != null)
        //     res.send(snapshot.val());
        // else res.send({recertificationAuditPlanDescription: "", taskList: []});
        // client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({recertificationPlanDescription: val.recertificationAuditPlanDescription, logs: keys});
        }
        else res.send({stage2PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage1_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage2_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage1_audit_plan_v1', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
// app.post('/fetch_stage2_audit_plan', (req, res) => {
//     //console.log(req.body['clientid'] );
//     var serviceAccount = require('./admin.json');
//     var client;
//     if (!admin.apps.length) {
//         client = admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount),
//             databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
//             authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
//         });
//     }else {
//         client = admin.app(); // if already initialized, use that one
//         client.delete();
//         client = admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount),
//             databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
//             authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
//         });
//     }
//     var db=admin.database();
//     var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/stage2PlanDescription");
//     userRef.on('value', (snapshot) => {
//         res.send(JSON.stringify(snapshot.val()));
//         client.delete();
//       }, (errorObject) => {
//         console.log('The read failed: ' + errorObject.name);
//       }); 
// });
app.post('/fetch_stage2_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, stage2PlanDescription: value.stage2PlanDescription, status: value.status, date: value.date});
                });
            }
            res.send({stage2PlanDescription: val.stage2PlanDescription, logs: keys});
        }
        else res.send({stage2PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_HOActivity', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        //console.log(snapshot.val() );
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.HOActivityDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_initial_certification_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.conclusionDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit_conclusion', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        //console.log(req.body['clientid']);
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            //console.log({description: val.conclusionDescription, logs: keys});
            res.send({description: val.conclusionDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit_conclusion', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.conclusionDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            //console.log({description: val.description, logs: keys});
            res.send({description: val.description, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/recertification_description");
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.description, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_quotations', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.quotation_description, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage2_audit_team_members', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage2_audit_teams/" + req.body['clientid'] + "/stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      });
});
app.get('/fetch_stage2_audit_team_members', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetchcustomerapplicationfiles', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    if (list[intIdx].name != 'logs' && list[intIdx].name != 'forms')
                        fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage1_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    if (list[intIdx].name != 'attendance_sheet' && 
                        list[intIdx].name != 'audit_report' && 
                        list[intIdx].name != 'auditor_appointment_form' && 
                        list[intIdx].name != 'confidentiality_statement' && 
                        list[intIdx].name != 'document_review_report' && 
                        list[intIdx].name != 'nc_report' && 
                        list[intIdx].name != 'logs' && 
                        list[intIdx].name != 'forms' &&
                        list[intIdx].name != 'surveillance_audit_report')
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage1_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_initial_certification_log_files', (req, res) => {
    const ftpClient = new Ftp();
    //console.log(req.body.clientid);
    //console.log(req.body.timestamp);
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage2_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_quotation_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_ho_activity_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_initial_certification_conclusion_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_conclusion_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_conclusion_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    // if (list[intIdx].name != 'attendance_sheet' && 
                    //     list[intIdx].name != 'audit_report' && 
                    //     list[intIdx].name != 'auditor_appointment_form' && 
                    //     list[intIdx].name != 'confidentiality_statement' && 
                    //     list[intIdx].name != 'document_review_report' && 
                    //     list[intIdx].name != 'nc_report' && 
                    //     list[intIdx].name != 'surveillance_audit_report')
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage1_audit_plan_form_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    var allFileNames = [];
    await ftpClient.on( 'ready', async function() {
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/auditor_appointment_form", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'auditor_appointment_form': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/confidentiality_statement", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'confidentiality_statement': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/document_review_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'document_review_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/attendance_sheet", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'attendance_sheet': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/surveillance_audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'surveillance_audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/nc_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'nc_report': fileNames})
            //console.log(allFileNames);
            res.send(allFileNames);
            ftpClient.end();
        });
    });
});
app.post('/fetch_stage2_audit_plan_form_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    var allFileNames = [];
    await ftpClient.on( 'ready', async function() {
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/auditor_appointment_form", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'auditor_appointment_form': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/confidentiality_statement", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'confidentiality_statement': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/document_review_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'document_review_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/attendance_sheet", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'attendance_sheet': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/surveillance_audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'surveillance_audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/nc_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'nc_report': fileNames})
            //console.log(allFileNames);
            res.send(allFileNames);
            ftpClient.end();
        });
    });
});
app.post('/fetch_stage2_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    if (list[intIdx].name != 'attendance_sheet' && 
                        list[intIdx].name != 'audit_report' && 
                        list[intIdx].name != 'auditor_appointment_form' && 
                        list[intIdx].name != 'confidentiality_statement' && 
                        list[intIdx].name != 'document_review_report' && 
                        list[intIdx].name != 'nc_report' && 
                        list[intIdx].name != 'logs' && 
                        list[intIdx].name != 'forms' &&
                        list[intIdx].name != 'surveillance_audit_report')
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_HOActivity_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    var fileNames = [];
    var fileNamesContractReviewForm = [];
    var fileNamesAuditDocumentChecklist = [];
    var fileNamesCertificationRecommendationReport = [];
    await ftpClient.on( 'ready', async function() {
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    if (list[intIdx].name != 'audit_document_checklist' && 
                        list[intIdx].name != 'certification_recommendation_report' && 
                        list[intIdx].name != 'contract_review_form')
                    fileNames.push(list[intIdx].name);
                }
            }
            //res.send(fileNames);
            //ftpClient.end();
        });
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp + "/contract_review_form", false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                    fileNamesContractReviewForm.push(list[intIdx].name);
            }
            //res.send(fileNames);
            //ftpClient.end();
        });
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp + "/audit_document_checklist", false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                    fileNamesAuditDocumentChecklist.push(list[intIdx].name);
            }
            //res.send(fileNames);
            //ftpClient.end();
        });
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp + "/certification_recommendation_report", false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                    fileNamesCertificationRecommendationReport.push(list[intIdx].name);
            }
            //res.send(fileNames);
            res.send({
                fileNames: fileNames,
                fileNamesContractReviewForm: fileNamesContractReviewForm,
                fileNamesAuditDocumentChecklist: fileNamesAuditDocumentChecklist,
                fileNamesCertificationRecommendationReport: fileNamesCertificationRecommendationReport,
            });
            ftpClient.end();
        });
    });
});
app.post('/fetch_quotation_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_initial_certification_conclusion_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_conclusion_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_conclusion_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs' && list[intIdx].name != 'forms')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/approve_client_init_cert', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/Approved");
                userRefApproved.set(req.body['Approved']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_surveillance_audit_status', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/Status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_recertification_audit_status', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/Status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_surveillance_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("surveillance_audit_clients");
    var userRefApproved=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/surveillance_audit_conclusion");
    userRefApproved.set(req.body['status'], (err) => {
        //client.delete();
        if (err) {
            res.send(err);
        }
        else {
            if (req.body['status'] == 'Completed') {
                var userRefSurveillanceAudit = db.ref("recertification_audit_clients");
                addUser({
                    'Client Name': req.body['clientName'],
                    'Status': 'Not Conducted',
                    'recertification_status': 'Not Conducted',
                    'description': '',
                    'recertification_audit_date': '',
                    'recertification_description': '',
                    //'surveillance_audit_team_assigned': 'No',
                    'recertification_audit_team_assigned': 'No',
                    //'surveillance_plan_status': 'Open',
                    'recertification_plan_status': 'Open',
                    //'surveillance_plan_task_status': 'Open',
                    'recertification_plan_task_status': 'Open',
                    //'surveillance_audit_conclusion': 'Open',
                    'recertification_audit_conclusion': 'Open',
                    'recertification_audit_plan_date': '',
                    'recertification_audit_conclusion_date': ''
                })
                async function addUser(obj1) {
                    //console.log('reached here');
                    var oneUser=userRefSurveillanceAudit.child(req.body['clientid']);
                    await oneUser.update(obj1,(err)=>{
                        client.delete();
                        if(err){
                            res.send('Something went wrong. Please submit again.');
                        }
                        else res.send('Operation Completed Successfully');
                        //else res.send('Customer Application Added Successfully');
                        //else res.send('Operation Completed Successfully');
                        //client.delete();
                        //res.send('Operation Completed Successfully');
                    })
                }
            }
            else {
                //console.log("surveillance_audit_clients/" + timestamp);
                var userRefSurveillanceAudit = db.ref("recertification_audit_clients/" + req.body['clientid']);
                //userRefSurveillanceAudit.remove();
                userRefSurveillanceAudit.remove((err) => {
                    client.delete();
                    if (err) {
                        console.log(err);
                        res.send(err)
                    }
                    else res.send('Operation Completed Successfully');
                })
            }
        }
        //res.send('Operation Completed Successfully');
    });
    //ApproveDisapprove();
    // function ApproveDisapprove() {
    // userRef.on('value', (snapshot) => {
    //     var stringrecord = JSON.stringify(snapshot);
    //     recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
    //     for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
    //     {
    //         var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
    //         if (timestamp === req.body.clientid) {
    //             var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/surveillance_audit_conclusion");
    //             userRefApproved.set(req.body['status']);
    //             client.delete();
    //             break;
    //         }
    //     }
        
    // }, (errorObject) => {

    // }); 
    
    // }
});
app.post('/mark_recertification_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/recertification_audit_conclusion");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        else res.send('Operation Completed Successfully');
    })
    //var userRef=db.ref("recertification_audit_clients");
    // ApproveDisapprove();
    // function ApproveDisapprove() {
    // userRef.on('value', (snapshot) => {
    //     var stringrecord = JSON.stringify(snapshot);
    //     recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
    //     for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
    //     {
    //         var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
    //         if (timestamp === req.body.timestamp) {
    //             var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/recertification_audit_conclusion");
    //             userRefApproved.set(req.body['status']);
    //             client.delete();
    //             break;
    //         }
    //     }
        
    //     }, (errorObject) => {

    //     }); 
    //     res.send('Operation Completed Successfully');
    // }
});
app.post('/mark_stage1_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage1_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage1_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_initial_certification_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_stage2_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_recertification_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_quotation_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_ho_activity_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_initial_certification_conclusion_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_conclusion_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_recertification_audit_conclusion_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_recertification_audit_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/surveillance_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_recertification_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/recertification_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage1_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage1_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_surveillance_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/surveillance_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_recertification_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/recertification_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage2_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage2_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage2_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage2_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_quotation', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/quotation_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_HOActivity', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/HO_activity_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_initial_certification_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    async function ApproveDisapprove() {
    //userRef.on('value', (snapshot) => {
    await userRef.once('value').then((snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/initial_certification_conclusion");
                userRefApproved.set(req.body['status']);
                if (req.body['status'] == 'Completed') {
                    var userRefSurveillanceAudit = db.ref("surveillance_audit_clients");
                    addUser({
                        'Client Name': req.body['clientName'],
                        'Status': 'Not Conducted',
                        //'recertification_status': 'Not Conducted',
                        'description': '',
                        'surveillance_audit_date': '',
                        //'recertification_description': '',
                        'surveillance_audit_team_assigned': 'No',
                        //'recertification_audit_team_assigned': 'No',
                        'surveillance_plan_status': 'Open',
                        //'recertification_plan_status': 'Open',
                        'surveillance_plan_task_status': 'Open',
                        //'recertification_plan_task_status': 'Open',
                        'surveillance_audit_conclusion': 'Open',
                        //'recertification_conclusion': 'Open',
                        'surveillance_audit_plan_date': '',
                        'surveillance_audit_conclusion_date': ''
                    })
                    async function addUser(obj1) {
                        //console.log('reached here');
                        var oneUser=userRefSurveillanceAudit.child(timestamp);
                        await oneUser.update(obj1,(err)=>{
                            client.delete();
                            if(err){
                                res.send('Something went wrong. Please submit again.');
                            }
                            else res.send('Operation Completed Successfully');
                            //else res.send('Customer Application Added Successfully');
                            //else res.send('Operation Completed Successfully');
                            client.delete();
                            //res.send('Operation Completed Successfully');
                        })
                    }
                }
                else {
                    //console.log("surveillance_audit_clients/" + timestamp);
                    var userRefSurveillanceAudit = db.ref("surveillance_audit_clients/" + timestamp);
                    //userRefSurveillanceAudit.remove();
                    userRefSurveillanceAudit.remove((err) => {
                        client.delete();
                        if (err) {
                            console.log(err);
                            res.send(err)
                        }
                        else res.send('Operation Completed Successfully');
                    })
                }
                //client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    }
    //res.send('Operation Completed Successfully');
});
app.post('/add_stage1_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage1_audit_teams");
    addUser({
        'stage1_audit_teams': req.body['list_stage1_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_team_assigned");
                userRef.set("Yes");
                res.send('Stage 1 Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_surveillance_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_surveillance_audit_teams");
    addUser({
        'surveillance_audit_teams': req.body['list_surveillance_audit_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_team_assigned");
                userRef.set("Yes");
                res.send('Surveillance Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_recertification_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_recertification_audit_teams");
    addUser({
        'recertification_audit_teams': req.body['list_recertification_audit_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_team_assigned");
                userRef.set("Yes");
                res.send('Recertification Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_stage2_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage2_audit_teams");
    addUser({
        'stage2_audit_teams': req.body['list_stage2_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_team_assigned");
                userRef.set("Yes");
                res.send('Stage 2 Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_stage1_audit_team_in_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    addUser({
        'Member Name': req.body['Member Name'],
        'Member Email': req.body['Member Email'],
        'Member PhoneNumber': req.body['Member PhoneNumber'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Stage 1 Audit Team Added Successfully');
            client.delete();
        })
    }
});
app.post('/add_employee_in_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("employees");
    addUser({
        'Member Name': req.body['Member Name'],
        'Member Designation': req.body['Member Designation'],
        'Member Email': req.body['Member Email'],
        'Member PhoneNumber': req.body['Member PhoneNumber'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Employee Added Successfully');
            client.delete();
        })
    }
});
app.post('/add_stage2_audit_team_in_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    addUser({
        'Member Name': req.body['Member Name'],
        'Member Email': req.body['Member Email'],
        'Member PhoneNumber': req.body['Member PhoneNumber'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Stage 2 Audit Team Added Successfully');
            client.delete();
        })
    }
});
app.post('/downloadcustomerapplicationfile', async (req, res) => {
    
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        //ftpClient.downloadTo(req.body.filename, "/init_certification_client_application/" + req.body.timestamp + "/" + req.body.filename)
        ftpClient.get("/init_certification_client_application/" + req.body.timestamp + "/" + req.body.filename, function(err, stream) {
            if (err) throw err;
            var ext = req.body.extensions.replace("\\n", '');
            ext = req.body.filename.slice(0, -1);
            stream.once('close', function() { ftpClient.end(); });
            stream.pipe(fs.createWriteStream(ext));
            console.log("Completed!!!");
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
   
});
app.get('/connect_mssql', (req, res) => {
    const sql = require('mssql')
    const sqlConfig = {
    user: "sa",
    password: "12345",
    database: "DATABASE1",
    server: 'DESKTOP-L64S3HU\\TEW_SQLEXPRESS',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
    }
    try {
        sql.connect(sqlConfig)
            .then(function () {
                // Function to retrieve all the data - Start
                console.log("connected");
                new sql.Request()
                    .query("select * from TABLE1")
                    .then(function (dbData) {
                        if (dbData == null || dbData.length === 0)
                            return;
                        //console.dir('All the courses');
                        console.log(dbData);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });

            }).catch(function (error) {
                console.dir(error);
            });
    } catch (error) {
        console.dir(error);
    }
})
app.get('/connect_mysql', (req, res) => {
    var mysql = require("mysql");
    const pool  = mysql.createPool({
        connectionLimit : 1000,
        connectTimeout  : 60 * 60 * 1000,
        acquireTimeout  : 60 * 60 * 1000,
        timeout         : 60 * 60 * 1000,
        host            : 'localhost',
        user            : 'root',
        password        : '',
        database        : 'cwacin',
        port: 3307
    })
    pool.getConnection((err, connection) => {
        if(err) {
            res.send('Error connecting to Db');
            return;
        }
        res.send("Connection established")
        // connection.query('SELECT * from beers', (err, rows) => {
        //     connection.release() // return the connection to pool

        //     if (!err) {
        //         res.send(rows)
        //     } else {
        //         console.log(err)
        //     }

        //     // if(err) throw err
        //     console.log('The data from beer table are: \n', rows)
        // })
    })
})
app.get('/fetch_stage1_audit_team_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage1_audit_team_library_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
//app.get('/fetch_employee_library', (req, res) => {
app.post('/fetch_employee_library', (req, res) => {
    //console.log('reached here');
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("employees");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            //console.log(index);
            if (req.body['request_from'] === 'Surveillance Audit Team') {
                if (itemVal['Member Designation'] == "Surveillance Auditor") {
                    keys.push(itemVal);
                }
            }
            else if (req.body['request_from'] === 'Recertification Audit Team') {
                if (itemVal['Member Designation'] == "Recertification Auditor") {
                    keys.push(itemVal);
                }
            }
            else keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage2_audit_team_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage2_audit_team_library_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/add_stage1_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans");
    addUser({
        'stage1PlanDescription': req.body['stage1PlanDescription'],
        // 'date': req.body['date']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Stage 1 Audit Plan Added Successfully');
                });
            }
            //client.delete();
        })
    }
});
app.post('/add_stage1_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'stage1PlanDescription': req.body['stage1PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Stage 1 Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_stage2_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'stage2PlanDescription': req.body['stage2PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Stage 2 Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_surveillance_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['stage2PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Surveillance Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_recertification_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['stage2PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Recertification Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_quotation_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Quotation Added Successfully');
            }
        })
    }
});
app.post('/add_ho_activity_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Head Office Activity Added Successfully');
            }
        })
    }
});
app.post('/add_initial_certification_conclusion_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Initial Certification Conclusion Added Successfully');
            }
        })
    }
});
app.post('/add_surveillance_audit_conclusion_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Surveillance Audit Conclusion Added Successfully');
            }
        })
    }
});
app.post('/add_recertification_audit_conclusion_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Recertification Audit Conclusion Added Successfully');
            }
        })
    }
});
app.post('/add_surveillance_audit_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Surveillance Audit Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_recertification_audit_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Recertification Audit Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_surveillance_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans");
    addUser({
        'surveillanceAuditPlanDescription': req.body['stage1PlanDescription'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Surveillance Audit Plan Added Successfully');
                });
                //res.send('Surveillance Audit Plan Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_recertification_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans");
    addUser({
        'recertificationAuditPlanDescription': req.body['stage1PlanDescription'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Recertification Audit Plan Added Successfully');
                });
                //res.send('Recertification Audit Plan Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_stage1_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_task_status");
                userRef.set("In-Progress");
                res.send('Stage 1 Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_surveillance_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_plan_task_status");
                userRef.set("In-Progress");
                res.send('Surveillance Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_recertification_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_plan_task_status");
                userRef.set("In-Progress");
                res.send('Recertification Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_stage2_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_plan_task_status");
                userRef.set("In-Progress");
                res.send('Stage 2 Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/delete_stage1_audit_plan_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_stage1_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_customer_application_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_stage2_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_quotation_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/quotations/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_ho_activity_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_initial_certification_conclusion_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_conclusion_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_conclusion_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_initial_certification_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_plan_files', async (req, res) => {
    //console.log(req.body['clientid']);
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    //console.log('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/" + list[intIdx].name);
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_plan_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_stage2_audit_plan_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        //console.log(req.body['clientid']);
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body['clientid'], false, async function( err, list ) {
            //console.log('here');
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            //console.log(list);
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            //console.log('success');
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_HOActivity_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
        });
    });
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/contract_review_form", false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/contract_review_form/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
        });
    });
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/audit_document_checklist", false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/audit_document_checklist/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
        });
    });
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/certification_recommendation_report", false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/certification_recommendation_report/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_initial_certification_conclusion_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_surveillance_audit_conclusion_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_recertification_audit_conclusion_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_surveillance_audit_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_recertification_audit_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_surveillance_audit_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/add_stage1_audit_plan_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 1 Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_stage1_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 1 Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_stage2_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 2 Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_quotation_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/quotation_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/quotation_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Quotation Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_ho_activity_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Head Office Activity Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_initial_certification_conclusion_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Initial Certification Conclusion Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_conclusion_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Conclusion Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_conclusion_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Conclusion Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_plan_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_plan_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_plans/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_stage1_audit_plan_form_files', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    //console.log(req.body['directory_name']);
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'], true, async (err) => {
            if (!err) {
            await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 1 Audit Plan Form Added Successfully'); 
            });  
            }
        });
    });

})
app.post('/add_stage2_audit_plan_form_files', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    //console.log(req.body['directory_name']);
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'], true, async (err) => {
            if (!err) {
            await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 2 Audit Plan Form Added Successfully'); 
            });  
            }
        });
    });

})
app.post('/add_stage2_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'stage2PlanDescription': req.body['stage2PlanDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Stage 2 Audit Plan Added Successfully');
                });
                //res.send('Stage 2 Audit Plan Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_HOActivity', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'HOActivityDescription': req.body['HOActivityDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/HO_activity_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/HO_activity_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('HO Activity Added Successfully');
                });
                // res.send('HO Activity Added Successfully');
                // client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_initial_certification_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'conclusionDescription': req.body['conclusionDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/initial_certification_conclusion");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/initial_certification_conclusion_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Initial Certification Conclusion Added Successfully');
                });
                //res.send('Initial Certification Conclusion Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_surveillance_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'conclusionDescription': req.body['conclusionDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_conclusion");
                userRef.set("In-Progress");
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_conclusion_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Surveillance Audit Conclusion Added Successfully');
                });
                //res.send('Surveillance Audit Conclusion Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_recertification_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'conclusionDescription': req.body['conclusionDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_conclusion");
                userRef.set("In-Progress");
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_conclusion_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Recertification Audit Conclusion Added Successfully');
                });
                //res.send('Recertification Audit Conclusion Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_surveillance_audit', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/description");
    userRef.set(req.body['conclusionDescription'], (err) => {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            var userRefInner=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/Status");
            userRefInner.set("Not Approved", (err) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    // res.send('Surveillance Audit Details Added Successfully');
                    // client.delete();
                    var userRefIInner=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/surveillance_audit_date");
                    userRefIInner.set(req.body['date'], (err) => {
                        if (err) {
                            console.log(err);
                            res.send(err);
                        }
                        else {
                            res.send('Surveillance Audit Details Added Successfully');
                            client.delete();
                        }
                    });
                }
            });
        }
    });

    // userRef.update(req.body['conclusionDescription'],(err)=>{
    //     if(err){
    //         res.send('Something went wrong. Please submit again.');
    //     }
    //     else {
    //         //res.send('Customer Application Added Successfully');
    //         db=admin.database();
    //         userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/Status");
    //         userRef.set("In-Progress");
    //         res.send('Surveillance Audit Details Added Successfully');
    //         client.delete();
    //     }
    //     client.delete();
    // })
    //console.log(req.body['stage2PlanDescription']);
    // addUser({
    //     'conclusionDescription': req.body['conclusionDescription']
    // })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/initial_certification_conclusion");
                userRef.set("In-Progress");
                res.send('Initial Certification Conclusion Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_recertification_audit', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/recertification_description");
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/description");
    userRef.set(req.body['conclusionDescription'], (err) => {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            //var userRefInner=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/recertification_status");
            var userRefInner=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/Status");
            userRefInner.set("Not Approved", (err) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    //res.send('Recertification Audit Details Added Successfully');
                    //client.delete();
                    var userRefIInner=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/recertification_audit_date");
                    userRefIInner.set(req.body['date'], (err) => {
                        if (err) {
                            console.log(err);
                            res.send(err);
                        }
                        else {
                            res.send('Recertification Audit Details Added Successfully');
                            client.delete();
                        }
                    });
                }
            });
        }
    });
});
app.post('/add_quotation', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'quotation_description': req.body['QuotationDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/quotation_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/quotation_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Quotation Added Successfully');
                });
                //res.send('Quotation Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_stage2_audit_plan_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    //ftpClient.end();     
                    res.send('Stage 2 Audit Plan Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_HOActivity_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });

})
app.post('/add_initial_certification_conclusion_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Initial Certification Conclusion Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_surveillance_audit_conclusion_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Surveillance Audit Conclusion Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_recertification_audit_conclusion_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Recertification Audit Conclusion Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_surveillance_audit_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Surveillance Audit Details Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_recertification_audit_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Recertification Audit Details Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_HOActivity_file_contract_review_form', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    });
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/contract_review_form", true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/contract_review_form/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });
})
app.post('/add_HOActivity_file_audit_document_checklist', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    });
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/audit_document_checklist", true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/audit_document_checklist/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });
})
app.post('/add_HOActivity_file_certification_recommendation_report', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    });
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/certification_recommendation_report", true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/certification_recommendation_report/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });
})
app.post('/add_quotation_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/quotation_files/' + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/quotation_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('Quotation Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/delete_quotation_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        //console.log(req.body['clientid']);
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body['clientid'], false, async function( err, list ) {
            //console.log('here');
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            //console.log(list);
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/quotation_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            //console.log('success');
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.get('/generate_mis_reports_ref', (req, res) => {
    var xl = require('excel4node');
    var wb = new xl.Workbook();
   
    // Add Worksheets to the workbook
    var ws = wb.addWorksheet('Sheet 1');
    var ws2 = wb.addWorksheet('Sheet 2');
   
    // Create a reusable style
    var style = wb.createStyle({
      font: {
        color: '#FF0800',
        size: 12,
      },
      numberFormat: '$#,##0.00; ($#,##0.00); -',
    });
   
   // Set value of cell A1 to 100 as a number type styled with 
   ws.cell(1, 1)
      .number(100)
      .style(style);
   
   // Set value of cell B1 to 200 as a number type styled with 
  
  //paramaters of style
  ws.cell(1, 2)
    .number(200)
    .style(style);
   
  // Set value of cell C1 to a formula styled with paramaters of style
  ws.cell(1, 3)
    .formula('A1 + B1')
    .style(style);
   
  // Set value of cell A2 to 'string' styled with paramaters of style
  ws.cell(2, 1)
    .string('Rohan Vishwakarma')
    .style(style);
   
  // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
  ws.cell(3, 1)
    .bool(true)
    .style(style)
    .style({font: {size: 14}});
  //console.log('reached here');
  wb.write('Excel.xlsx', res);
});
app.get('/generate_mis_reports', async (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    } else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    var keys = [];
    var intAppointedAuditorIdx = 2;
    var intTaskRegisterIdx = 2;
    var xl = require('excel4node');
    var wb = new xl.Workbook();
    await userRef.once('value').then(async (snapshot) => {
        if (snapshot.numChildren() == 0) {
            //res.send(keys);
        }
        var index = 0;
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            index++;
            keys.push(itemVal);
        });
        //console.log('completed');
        var ws = wb.addWorksheet('Ongoing Projects with Status');
        var ws2 = wb.addWorksheet('Client wise Appointed Auditors');
        var ws3 = wb.addWorksheet('Task Register');
        var style = wb.createStyle({
          font: {
            color: '#FF0800',
            size: 12,
          },
          numberFormat: '$#,##0.00; ($#,##0.00); -',
        });
        ws.cell(1, 1).string('Client Name');
        ws.cell(1, 2).string('Application Approved?');
        ws.cell(1, 3).string('Quotation Status?');
        ws.cell(1, 4).string('Stage 1 Team Assigned?');
        ws.cell(1, 5).string('Stage 1 Plan Status');
        ws.cell(1, 6).string('Stage 1 Task Status');
        ws.cell(1, 7).string('Stage 2 Team Assigned?');
        ws.cell(1, 8).string('Stage 2 Plan Status');
        ws.cell(1, 9).string('Stage 2 Task Status');
        ws.cell(1, 10).string('HO Activity Status');
        ws2.cell(1, 1).string("Client Name");
        ws2.cell(1, 2).string("Audit Type");
        ws2.cell(1, 3).string("Member Name");
        ws2.cell(1, 4).string("Member Email");
        ws2.cell(1, 5).string("Member Phone Number");
        ws3.cell(1, 1).string("Client Name");
        ws3.cell(1, 2).string("Audit Type");
        ws3.cell(1, 3).string("Member Name");
        ws3.cell(1, 4).string("Task Name");
        ws3.cell(1, 5).string("Task Description");
        for (var intIdx = 0; intIdx < keys.length; intIdx++) {
            ws.cell(intIdx + 2, 1).string(keys[intIdx]['Client Name']);
            ws.cell(intIdx + 2, 2).string(keys[intIdx].Approved);
            ws.cell(intIdx + 2, 3).string(keys[intIdx].quotation_status);
            ws.cell(intIdx + 2, 4).string(keys[intIdx].stage1_team_assigned);
            ws.cell(intIdx + 2, 5).string(keys[intIdx].stage1_plan_status);
            ws.cell(intIdx + 2, 6).string(keys[intIdx].stage1_plan_task_status);
            ws.cell(intIdx + 2, 7).string(keys[intIdx].stage2_team_assigned);
            ws.cell(intIdx + 2, 8).string(keys[intIdx].stage2_plan_status);
            ws.cell(intIdx + 2, 9).string(keys[intIdx].stage2_plan_task_status);
            ws.cell(intIdx + 2, 10).string(keys[intIdx].HO_activity_status); 
            // Stage 1 Audit Printing
            //ws2.cell(intAppointedAuditorIdx, 1).string("Stage 1 Audit");
            var refStage1AssignedTeams=db.ref("assigned_stage1_audit_teams/" + keys[intIdx].timestamp + "/stage1_audit_teams/");
            await refStage1AssignedTeams.once('value').then(async (snapshot) => {
                var keysStage1AssignedTeams = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysStage1AssignedTeams.push(itemVal);
                });
                if (keysStage1AssignedTeams.length != 0)  {
                    ws2.cell(intAppointedAuditorIdx, 1).string(keys[intIdx]['Client Name']);
                    //ws3.cell(intTaskRegisterIdx, 1).string(keys[intIdx]['Client Name']);
                    ws2.cell(intAppointedAuditorIdx, 2).string('Stage 1 audit');
                    //ws3.cell(intTaskRegisterIdx, 2).string('Stage 1 audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysStage1AssignedTeams.length; intInnerIdx++) 
                {
                    var ref=db.ref("stage1_audit_teams");
                    var email = "";
                    var phoneNo = "";
                    await ref.once('value').then(async function(dataSnapshot) {
                        dataSnapshot.forEach(function(item) {
                            var itemVar = item.val();
                            if (itemVar['Member Name'] == keysStage1AssignedTeams[intInnerIdx]) {
                                email = itemVar['Member Email'];
                                phoneNo = itemVar['Member PhoneNumber'];
                                return;
                            }
                        })
                    });
                    ws2.cell(intAppointedAuditorIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    //ws3.cell(intTaskRegisterIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    ws2.cell(intAppointedAuditorIdx, 4).string(email);
                    ws2.cell(intAppointedAuditorIdx, 5).string(phoneNo);
                    intAppointedAuditorIdx++;
                    //intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            var refStage1TaskList=db.ref("stage1_audit_plans/" + keys[intIdx].timestamp + "/taskList/");
            await refStage1TaskList.once('value').then(async (snapshot) => {
                var keysTaskList = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysTaskList.push(itemVal);
                });
                if (keysTaskList.length != 0)  {
                    ws3.cell(intTaskRegisterIdx, 1).string(keys[intIdx]['Client Name']);
                    ws3.cell(intTaskRegisterIdx, 2).string('Stage 1 audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysTaskList.length; intInnerIdx++) {
                    ws3.cell(intTaskRegisterIdx, 3).string(keysTaskList[intInnerIdx]['Member Assigned']);
                    ws3.cell(intTaskRegisterIdx, 4).string(keysTaskList[intInnerIdx]['Task Name']);
                    ws3.cell(intTaskRegisterIdx, 5).string(keysTaskList[intInnerIdx]['Task Description']);
                    intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            // End of Stage 1 Audit Printing
            // Stage 2 Audit Printing
            //ws2.cell(intAppointedAuditorIdx, 1).string("Stage 2 Audit");
            var refStage1AssignedTeams=db.ref("assigned_stage2_audit_teams/" + keys[intIdx].timestamp + "/stage2_audit_teams/");
            await refStage1AssignedTeams.once('value').then(async (snapshot) => {
                var keysStage1AssignedTeams = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysStage1AssignedTeams.push(itemVal);
                });
                if (keysStage1AssignedTeams.length != 0)  {
                    ws2.cell(intAppointedAuditorIdx, 2).string('Stage 2 Audit');
                    //ws3.cell(intTaskRegisterIdx, 2).string('Stage 2 Audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysStage1AssignedTeams.length; intInnerIdx++) 
                {    
                    var ref=db.ref("stage2_audit_teams");
                    var email = "";
                    var phoneNo = "";
                    await ref.once('value').then(async function(dataSnapshot) {
                        dataSnapshot.forEach(function(item) {
                            var itemVar = item.val();
                            if (itemVar['Member Name'] == keysStage1AssignedTeams[intInnerIdx]) {
                                email = itemVar['Member Email'];
                                phoneNo = itemVar['Member PhoneNumber'];
                                return;
                            }
                        })
                    });
                    ws2.cell(intAppointedAuditorIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    //ws3.cell(intTaskRegisterIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    ws2.cell(intAppointedAuditorIdx, 4).string(email);
                    ws2.cell(intAppointedAuditorIdx, 5).string(phoneNo);
                    intAppointedAuditorIdx++;
                    //intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            refStage1TaskList=db.ref("stage2_audit_plans/" + keys[intIdx].timestamp + "/taskList/");
            await refStage1TaskList.once('value').then(async (snapshot) => {
                var keysTaskList = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysTaskList.push(itemVal);
                });
                if (keysTaskList.length != 0)  {
                    //ws3.cell(intTaskRegisterIdx, 1).string(keys[intIdx]['Client Name']);
                    ws3.cell(intTaskRegisterIdx, 2).string('Stage 2 audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysTaskList.length; intInnerIdx++) {
                    ws3.cell(intTaskRegisterIdx, 3).string(keysTaskList[intInnerIdx]['Member Assigned']);
                    ws3.cell(intTaskRegisterIdx, 4).string(keysTaskList[intInnerIdx]['Task Name']);
                    ws3.cell(intTaskRegisterIdx, 5).string(keysTaskList[intInnerIdx]['Task Description']);
                    intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            // End of Stage 2 Audit Printing
        }
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
      wb.write('Excel.xlsx', res);
      client.delete();
});
app.get('/sample_on_async', async (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    //var done = false;
    await getData1();
    async function getData1() {
        await userRef.once('value')
        .then(async function(dataSnapshot) {
            console.log('completed inside stage 1')
        });
    }
    //while (!done);
    console.log('completed stage 1')


    userRef=db.ref("stage1_audit_teams");
    await getData2();
    async function getData2() {
        await userRef.once('value')
            .then(async function(dataSnapshot) {
                console.log('completed inside stage 2')
        });
    }   
    console.log('completed stage 2')


    res.send('done');
});
app.post('/register_user', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("registered_users");
    addUser({
        'timestamp': req.body.timestamp,
        'username': req.body.username,
        'password': req.body.password,
        'email': req.body.email
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('User Registered Successfully');
            client.delete();
        })
    }
});
app.post('/logging_in', async (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("registered_users");
    var status = "Invalid username or password";
    await userRef.once('value').then((snapshot) => {
        snapshot.forEach(function(item) {
            var user = item.val();
            if (user.username == req.body.username && user.password == req.body.password) {
                //status = "Logged in Successfully";
                status = AUTH_TOKEN;
                return;
            }
        });
        res.send(status);
    }, (errorObject) => {

    }); 
});
app.post('/verify_token', async (req, res) => {
    if (req.body['audit_software_token'] == AUTH_TOKEN) 
        res.send("Token Verified");
    else res.send("Token Invalid");
});
// added on 5-Apr-2022
app.get('/testurl_1', (req, res) => {
    var xl = require('excel4node');
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Ongoing Projects with Status');
    ws.cell(1, 1).string('Entry 1');
    ws.cell(2, 1).string('Entry 2');
    ws.cell(3, 1).string('Entry 3');
    wb.write('Excel.xlsx', res);
    
});
app.post('/testurl_2', (req, res) => {
    var xl = require('excel4node');
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Ongoing Projects with Status');
    ws.cell(1, 1).string(req.body['entry1']);
    ws.cell(2, 1).string(req.body['entry2']);
    ws.cell(3, 1).string(req.body['entry3']);
    var bf = null;
    wb.writeToBuffer().then(function(buffer) {
        // Do something with buffer
        console.log('buffer')
        bf = buffer
        const ftpClient = new Ftp();
        ftpClient.on( 'ready', function() {
            ftpClient.mkdir('domains/cwac.in/public_html/temp_files/', true, (err) => {
                if (!err) {
                    ftpClient.put( buffer, 'domains/cwac.in/public_html/temp_files/Excel.xlsx', function( err, list ) {
                        if ( err ) throw err;
                        ftpClient.end();     
                        res.send(JSON.stringify({"OK": "File Uploaded", "Param1": req.body['entry1'], "Param2": req.body['entry2'], "Param3": req.body['entry3']}));
                        //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": 'entry1', "Param2": 'entry2', "Param3": 'entry3'}));
                    });  
                }
            });
        });
        
        ftpClient.connect( {
            'host': 'ftp.cwac.in',
            'user': 'cwacin',
            'password': '$Rv01111996'
        } );
    });
});
app.post('/testurl_3', (req, res) => {
    var Excel = require('exceljs');
    var workbook = new Excel.Workbook();
    //workbook.xlsx.readFile('old.xlsx')
    workbook.xlsx.readFile('dummy_template.xlsx')
        .then(async function() {
            var worksheet = workbook.getWorksheet(1);
            var row = worksheet.getRow(1);
            row.getCell(10).value = req.body['entry1']; // A5's value set to 5
            row.getCell(11).value = req.body['entry2']; // A5's value set to 5
            row.getCell(12).value = req.body['entry3']; // A5's value set to 5
            row.commit();
            //return workbook.xlsx.writeFile('new.xlsx');
            //const buffer = await workbook.xlsx.writeBuffer();
            const buffer = await workbook.xlsx.writeBuffer();
            const ftpClient = new Ftp();
            ftpClient.on( 'ready', function() {
                //ftpClient.cwd
                //res.send(JSON.stringify({"aaz":"aaz"})) //error not coming here
                ftpClient.mkdir('domains/cwac.in/public_html/temp_files/', true, (err) => {
                    //res.send(JSON.stringify({"aaz":"aaz"})) // error coming here
                    if (!err) {
                        ftpClient.put( buffer, 'domains/cwac.in/public_html/temp_files/Excel.xlsx', function( err, list ) {
                            if ( err ) throw err;
                            ftpClient.end();     
                            res.send(JSON.stringify({"OK": "File Uploaded", "Param1": req.body['entry1'], "Param2": req.body['entry2'], "Param3": req.body['entry3']}));
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": 'entry1', "Param2": 'entry2', "Param3": 'entry3'}));
                        });
                    }
                });
                //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
            });

            ftpClient.connect( {
                'host': 'ftp.cwac.in',
                'user': 'cwacin',
                'password': '$Rv01111996'
            } );
        })
});
app.post('/testurl_4', async (req, res) => {
    const templateFile = fs.readFileSync(path.resolve(__dirname, 'old_doc2.docx'), 'binary');
    const zip = new PizZip(templateFile);
    
    try {
        // Attempt to read all the templated tags
        let outputDocument = new Docxtemplater(zip);
    
        const dataToAdd = {
            employeeList: [
            { id: 28521, name: 'Frank', age: 34, city: 'Melbourne' },
            { id: 84973, name: 'Chloe', age: 28, city: 'Perth' },
            { id: 10349, name: 'Hank', age: 68, city: 'Hobart' },
            { id: 44586, name: 'Gordon', age: 47, city: 'Melbourne' },
            ],
            'title': req.body['entry1'],
            'description': req.body['entry2'],
            'body': req.body['entry3'],
            'Age': "19",
            'Address': "Flat 305, ABC",
            'Employees': "50"
        };
        // Set the data we wish to add to the document
        outputDocument.setData(dataToAdd);
    
        try {
            // Attempt to render the document (Add data to the template)
            outputDocument.render()
    
            // Create a buffer to store the output data
            let outputDocumentBuffer = outputDocument.getZip().generate({ type: 'nodebuffer' });
    
            // Save the buffer to a file
            fs.writeFileSync(path.resolve(__dirname, 'OUTPUT.docx'), outputDocumentBuffer);
            const ftpClient = new Ftp();
            ftpClient.on( 'ready', function() {
                //ftpClient.cwd
                //res.send(JSON.stringify({"aaz":"aaz"})) //error not coming here
                ftpClient.mkdir('domains/cwac.in/public_html/temp_files/', true, (err) => {
                    //res.send(JSON.stringify({"aaz":"aaz"})) // error coming here
                    if (!err) {
                        ftpClient.put( outputDocumentBuffer, 'domains/cwac.in/public_html/temp_files/output.docx', function( err, list ) {
                            if ( err ) throw err;
                            ftpClient.end();     
                            console.log('done')
                            res.send(JSON.stringify({"OK": "OK"}))
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": req.body['entry1'], "Param2": req.body['entry2'], "Param3": req.body['entry3']}));
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": 'entry1', "Param2": 'entry2', "Param3": 'entry3'}));
                        });
                    }
                });
                //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
            });
    
            ftpClient.connect( {
                'host': 'ftp.cwac.in',
                'user': 'cwacin',
                'password': '$Rv01111996'
            } );
        }
        catch (error) {
            console.error(`ERROR Filling out Template:`);
            console.error(error)
        }
    } catch(error) {
        console.error(`ERROR Loading Template:`);
        console.error(error);
    }
});
app.post('/url_exists', (req, res) => {
    const { JavaCaller } = require("java-caller");
    var urlExists = require('url-exists');
    urlExists(req.body['url'], function(err, exists) {
        if (!exists)
        {
            console.log(exists)
            res.send(exists); // false
        }
        else {
            var noOfFilledEntries = 0;
            if (req.body['file_type'] == 'application_form')
            {
            var application_form_field_values = [
                {"word_file_field_name": "Form No.", "field_name": "Form No.", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Issue No.", "field_name": "Issue No.", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Rev No.", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Rev date", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Certification Type", "field_name": "Certification Type", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Organization Name", "field_name": "Organization Name", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Organisation Type", "field_name": "Organization Type", "field_value": "", "optional": "no"}, //radio
                {"word_file_field_name": "Organisation Type: Others", "field_name": "Organization Type: Others", "field_value": "", "optional": "yes"},
                {"word_file_field_name": "Name/ Designation of Top Management", "field_name": "Name/ Designation of Top Management", "field_value": "", "optional": "no"},
                {"word_file_field_name": " Mobile no.", "field_name": "Mobile Number", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Head Office", "field_name": "Head Office", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Main Operative Site (for additional sites see next page)", "field_name": "Main Operative Site", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Name ", "field_name": "Contact Person Name", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Mobile", "field_name": "Contact Person Mobile", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Tel.", "field_name": "Contact Person Telephone 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Tel.", "field_name": "Contact Person Telephone 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Position", "field_name": "Contact Person Position", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Fax", "field_name": "Contact Person Fax", "field_value": "", "optional": "no"},
                {"word_file_field_name": "e-mail", "field_name": "Contact Person Email", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Website", "field_name": "Contact Person Website", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Products/ Services", "field_name": "Products/ Services", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Desired Scope of Certification", "field_name": "Desired Scope of Certification", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Certification Scheme Applied", "field_name": "Certification Scheme Applied", "field_value": "", "optional": "no"}, //radio
                {"word_file_field_name": "Certification Scheme Applied: Accreditation", "field_name": "Certification Scheme Applied: Accreditation", "field_value": "", "optional": "no"}, //radio
                {"word_file_field_name": "Certified in any other management systems", "field_name": "Certified in any other management systems", "field_value": "", "optional": "no"}, //radio
                {"word_file_field_name": "Certified in any other management systems Details", "field_name": "Certified in any other management systems Details", "field_value": "", "optional": "yes"}, //radio
                {"word_file_field_name": "Applicable legal and statutory requirements ", "field_name": "Applicable legal and statutory requirements", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Compliance", "field_name": "Compliance", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Language ", "field_name": "Language", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Safety conditions, if applicable ", "field_name": "Safety conditions, if applicable", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Outsourced processes", "field_name": "Outsourced processes", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Description of Technical resources e.g machinery", "field_name": "Description of Technical resources e.g machinery", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Consultancy  Organization/ consultant ", "field_name": "Consultancy Organization/ consultant", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Consultancy  Organization/ consultant: Self Prepared", "field_name": "Consultancy Organization/ consultant: Self Prepared?", "field_value": "", "optional": "no"},
                {"word_file_field_name": "#Desired date of audit", "field_name": "Desired Date of Audit", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Total including contracted (give break-up as below): Main Site (above)", "field_name": "No. of Employees: Total including contracted (give breakup-as below): Main Site (above)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Total including contracted (give break-up as below): Site 1", "field_name": "No. of Employees: Total including contracted (give breakup-as below): Site 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Total including contracted (give break-up as below): Site 2", "field_name": "No. of Employees: Total including contracted (give breakup-as below): Site 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Total including contracted (give break-up as below): Remarks", "field_name": "No. of Employees: Total including contracted (give breakup-as below): Remarks", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Part time: Main Site (above)", "field_name": "No. of Employees: Part time: Main Site (above)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Part time: Site 1", "field_name": "No. of Employees: Part time: Site 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Part time: Site 2", "field_name": "No. of Employees: Part time: Site 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Part time: Remarks", "field_name": "No. of Employees: Part time: Remarks", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Production(Process wise break up is required): Main Site (above)", "field_name": "No. of Employees: Production (Process wise break up is required): Main Site (above)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Production(Process wise break up is required): Site 1", "field_name": "No. of Employees: Production (Process wise break up is required): Site 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Production(Process wise break up is required): Site 2", "field_name": "No. of Employees: Production (Process wise break up is required): Site 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Production(Process wise break up is required): Remarks", "field_name": "No. of Employees: Production (Process wise break up is required): Remarks", "field_value": "", "optional": "no"},
                {"word_file_field_name": "QC+Purchase+Store : Main Site (above)", "field_name": "No. of Employees: QC + Purchase + Store: Main Site (above)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "QC+Purchase+Store : Site 1", "field_name": "No. of Employees: QC + Purchase + Store: Site 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "QC+Purchase+Store : Site 2", "field_name": "No. of Employees: QC + Purchase + Store: Site 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "QC+Purchase+Store : Remarks", "field_name": "No. of Employees: QC + Purchase + Store: Remarks", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Marketing : Main Site (above)", "field_name": "No. of Employees: Marketing: Main Site (above)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Marketing : Site 1", "field_name": "No. of Employees: Marketing: Site 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Marketing : Site 2", "field_name": "No. of Employees: Marketing: Site 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Marketing : Remarks", "field_name": "No. of Employees: Marketing: Remarks", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Others: Main Site (above)", "field_name": "No. of Employees: Others: Main Site (above)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Others: Site 1", "field_name": "No. of Employees: Others: Site 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Others: Site 2", "field_name": "No. of Employees: Others: Site 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Others: Remarks", "field_name": "No. of Employees: Others: Remarks", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Number of persons in repetitive/identical process: Main Site (above)", "field_name": "No. of Employees: Number of persons in repetitive/identical process: Main Site (above)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Number of persons in repetitive/identical process: Site 1", "field_name": "No. of Employees: Number of persons in repetitive/identical process: Site 1", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Number of persons in repetitive/identical process: Site 2", "field_name": "No. of Employees: Number of persons in repetitive/identical process: Site 2", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Number of persons in repetitive/identical process: Remarks", "field_name": "No. of Employees: Number of persons in repetitive/identical process: Remarks", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Number of Shifts (Details of employees working in each shift) ", "field_name": "No. of Employees: Number of Shifts (Details of employees working in each shift)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Name of CB                (attach certificate)", "field_name": "Name of CB", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Latest Audit         (attach report)", "field_name": "Latest Audit", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Reason for Transfer", "field_name": "Reason for Transfer", "field_value": "", "optional": "no"},
                {"word_file_field_name": "certificate under suspension or under threat of suspension", "field_name": "Certificate under suspension or under threat of suspension", "field_value": "", "optional": "no"},
                {"word_file_field_name": "certificate under suspension or under threat of suspension Reason", "field_name": "Certificate under suspension or under threat of suspension: Reason if yes", "field_value": "", "optional": "yes"},
                {"word_file_field_name": "1 Site address:", "field_name": "Site 1 address", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Activity(ies):", "field_name": "Site 1 Activity (ies)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "2 Site address:", "field_name": "Site 2 address", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Activity(ies):", "field_name": "Site 2 Activity (ies)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Number of process lines", "field_name": "ISO 22000/ HACCP specific: Number of process lines", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Number of HACCP Studies", "field_name": "ISO 22000/ HACCP specific: Number of HACCP Studies", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Any statutory/ regulatory requirements related to the operations", "field_name": "ISO 14001 specific: Any statutory/ regulatory requirements related to the operations", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Any license/ approvals received related to environmental issues", "field_name": "ISO 14001 specific: Any license/ approvals received related to environmental issues", "field_value": "", "optional": "no"},
                {"word_file_field_name": "What type of emissions your organisation does", "field_name": "ISO 14001 specific: What type of emissions your organisation does", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Do you measure any emissions, if yes define", "field_name": "ISO 14001 specific: Do you measure any emissions, if yes define", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Did you had any environmental incident in the past, if yes detail ", "field_name": "ISO 14001 specific: Did you had any environmental incident in the past, if yes detail", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Other information", "field_name": "ISO 14001 specific: Other information", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Please detail the identification of key hazards  and OH &SMS risks associated with processes.", "field_name": "ISO 45001 specific: Please detail the identification of key hazards and OH &SMS risks associated with processes", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Detail the main hazardous materials used in the processes", "field_name": "ISO 45001 specific: Detail the main hazardous materials used in the processes", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Relevant applicable OH&SMS legal obligations ", "field_name": "ISO 45001 specific: Relevant applicable OH&SMS legal obligations", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Give the details on the annual energy Consumption in KW/Terra Joules (Eg:Electrical, Thermal, Fuel etc)", "field_name": "ISO 50001 specific: Give the details on the annual energy Consumption in KW/Terra Joules (Eg:Electrical, Thermal, Fuel etc)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Give the details of the number of energy sources and name them(Eg: Electicity, Natural gas etc)", "field_name": "ISO 50001 specific: Give the details of the number of energy sources and name them(Eg: Electicity, Natural gas etc)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Details on the significant energy uses", "field_name": "ISO 50001 specific: Details on the significant energy uses", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Give the details on the number of EnMs effective Personnel (Top Managemen/MR/Energy management Team, Person responsible for major changes affecting energy performance, effectiveness of the Enms, developing, implementing or maintaining energy performance improvements  significant energy uses). ", "field_name": "ISO 50001 specific: Give the details on the number of EnMs effective Personnel (Top Managemen/MR/Energy management Team, Person responsible for major changes affecting energy performance, effectiveness of the Enms, developing, implementing or maintaining energy performance improvements  significant energy uses)", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Have you prepared your Statement of Applicability?", "field_name": "ISO 27001 specific: Have you prepared your Statement of Applicability?", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Please identify the level and type of risk associated with your information systems", "field_name": "ISO 27001 specific: Please identify the level and type of risk associated with your information systems", "field_value": "", "optional": "no"},
                {"word_file_field_name": "LEVEL OF INTEGRATION FOR COMBINED AUDITS:", "field_name": "ANNEXURE: LEVEL OF INTEGRATION FOR COMBINED AUDITS", "field_value": "", "optional": "no"},
                {"word_file_field_name": "1.Integrated documentation set, including work instructions", "field_name": "ANNEXURE: 1. Integrated documentation set, including work instructions", "field_value": "", "optional": "no"},
                {"word_file_field_name": "2.Management Reviews that consider the overall business strategy and plan", "field_name": "ANNEXURE: 2. Management Reviews that consider the overall business strategy and plan", "field_value": "", "optional": "no"},
                {"word_file_field_name": "3.Integrated approach to internal audits", "field_name": "ANNEXURE: 3. Integrated approach to internal audits", "field_value": "", "optional": "no"},
                {"word_file_field_name": "4.Integrated approach to policy and objectives", "field_name": "ANNEXURE: 4. Integrated approach to policy and objectives", "field_value": "", "optional": "no"},
                {"word_file_field_name": "5.Integrated approach to systems processes", "field_name": "ANNEXURE: 5. Integrated approach to systems processes", "field_value": "", "optional": "no"},
                {"word_file_field_name": "6.Integrated approach to improvement mechanisms", "field_name": "ANNEXURE: 6. Integrated approach to improvement mechanisms", "field_value": "", "optional": "no"},
                {"word_file_field_name": "7.Integrated management support and responsibilities", "field_name": "ANNEXURE: 7. Integrated management support and responsibilities", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Attachments", "field_name": "Attachments", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Name of the Authorized Representative", "field_name": "Name of the Authorized Representative", "field_value": "", "optional": "no"},
                {"word_file_field_name": "Date", "field_name": "Date", "field_value": "", "optional": "no"},
                {"no_of_filled_entries": 0}
            ];
            const http = require('https'); // or 'https' for https:// URLs
            const fs = require('fs');
            const file = fs.createWriteStream("application_form11.docx");
            //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
            const request = http.get(req.body['url'], function(response) {
                response.pipe(file);
                // after download completed close filestream
                file.on("finish", () => {
                    file.close();
                    //res.send('ok')
                    (async () => {
                        try {
                            //await runExample();
                        const java = new JavaCaller({
                            classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                            mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                            rootPath: __dirname,
                        });
                        const { status, stdout, stderr } = await java.run();
                        var dataString = String(stdout)
                        dataString = dataString.replaceAll('\n', '')
                        dataString = dataString.replaceAll('\r', '')
                        dataString = dataString.replaceAll('\t\t', '-->')
                        var dataString = dataString.split("**************************")
                        //console.log(dataString);
                        for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                            var keyValuePair = dataString[intIdx];
                            console.log(dataString[intIdx])
                            var blnFillingTableRow = false;
                            //console.log('------------------------------')
                            var key = keyValuePair.split("-->")[0]
                            var value = keyValuePair.split("-->")[1]
                            if (key == 'Name/ Designation of Top Management') 
                            {
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == ' Mobile no.') 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];
                                        if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                    }
                            }
                            if (key == 'Name of CB                (attach certificate)') 
                            {
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == 'Latest Audit         (attach report)')
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];
                                        if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                    }
                            }
                            if (key == 'Applicable legal and statutory requirements ') 
                            {
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == 'Compliance') 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = dataString[intIdx + 1].split("-->")[2];
                                        if (dataString[intIdx + 1].split("-->")[2].trim() != "") noOfFilledEntries++;
                                    }
                            }
                            if (key == '') {
                                if (value == 'Name ') key = 'Name '
                                else if (value == 'Mobile') 
                                {
                                    key = 'Mobile'
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['word_file_field_name'] == 'Fax') 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[4];
                                            if (keyValuePair.split("-->")[4].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                else if (value == 'Tel.') 
                                {
                                    key = 'Tel.'
                                    if (dataString[intIdx - 2].split("-->")[0] == 'Contact Person')
                                    {
                                        for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                            if (application_form_field_values[intIIdx]['word_file_field_name'] == 'e-mail') 
                                            {
                                                application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[4];
                                                if (keyValuePair.split("-->")[4].trim() != "") noOfFilledEntries++;
                                            }
                                        for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                            if (application_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                            {
                                                application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                                if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                            }
                                    }
                                    else if (dataString[intIdx - 3].split("-->")[0] == 'Contact Person')
                                    {
                                        for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                            if (application_form_field_values[intIIdx]['word_file_field_name'] == 'Website') 
                                            {
                                                application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[4];
                                                if (keyValuePair.split("-->")[4].trim() != "") noOfFilledEntries++;
                                            }
                                        for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                            if (application_form_field_values[intIIdx]['field_name'] == "Contact Person Telephone 2") 
                                            {
                                                application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                                if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                            }
                                    }
                                }
                                if (value)
                                {
                                    if (value.includes("Accreditation: "))
                                    {
                                        key = "Certification Scheme Applied: Accreditation";
                                        value = value.replace("Accreditation: ", "");
                                    }
                                    else value = keyValuePair.split("-->")[2]
                                }
                                else value = keyValuePair.split("-->")[2]
                            }
                            //else if (key == 'Contact Person') {
                            if (key == 'Contact Person') 
                            {
                                key = 'Name '
                                value = keyValuePair.split("-->")[2]
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == 'Position') 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[4];
                                        if (keyValuePair.split("-->")[4].trim() != "") noOfFilledEntries++;
                                    }
                            }
                            if (key == 'Activity(ies):' || key == 'Activity (ies):')
                            {
                                if (dataString[intIdx - 1].split("-->")[0] == '1 Site address:')
                                {
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['field_name'] == "Site 1 Activity (ies)") 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = value;
                                            if (value.trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (dataString[intIdx - 1].split("-->")[0] == '2 Site address:')
                                {
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['field_name'] == "Site 2 Activity (ies)") 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = value;
                                            if (value.trim() != "") noOfFilledEntries++;
                                        }
                                }
                            }
                            if (keyValuePair.split("-->").length == 1 && (keyValuePair.includes("[_yes_]") || keyValuePair.includes("[_no_]"))) {
                                var optionsArray = keyValuePair.split("[_");
                                //console.log("optionsArray___", optionsArray);
                                for (var intIIdx = 0; intIIdx < optionsArray.length; intIIdx++)
                                {
                                    if (optionsArray[intIIdx].split("_]")[0] == 'yes')
                                    {
                                        key = "Certification Type"
                                        value = "[[Radio]]" + optionsArray[intIIdx].split("_]")[1].trim() + ";;"
                                        break;
                                    }
                                }
                            }
                            if (value)
                            {
                                if (value.includes("[_yes_]") || value.includes("[_no_]"))
                                {
                                    var optionsArray = value.split("[_");
                                    var newValue = "";
                                    var intYesCount = 0;
                                    if (key != 'Attachments')
                                    {
                                        if (key == "Organisation Type")
                                        {
                                            if (value.split("[_yes_] ")[1].split(" ")[0] == "Other")
                                            {
                                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "Organisation Type: Others") 
                                                    {
                                                        application_form_field_values[intIIdx]['field_value'] = value.split("[_yes_] Other")[1].trim();
                                                        if (value.split("[_yes_] Other")[1].trim() != "") noOfFilledEntries++;
                                                    }
                                            }
                                        }
                                        if (key == "certificate under suspension or under threat of suspension")
                                        {
                                            if (value.includes("[_yes_] Yes"))
                                            {
                                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "certificate under suspension or under threat of suspension Reason") 
                                                    {
                                                        application_form_field_values[intIIdx]['field_value'] = value.split("state reason: ")[1].split("[_no_]")[0].trim();
                                                        if (value.split("state reason: ")[1].split("[_no_]")[0].trim() != "") noOfFilledEntries++;
                                                    }
                                            }
                                        }
                                        if (key == "Certified in any other management systems")
                                        {
                                            if (value.includes("[_yes_] Yes"))
                                            {
                                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "Certified in any other management systems Details") 
                                                    {
                                                        application_form_field_values[intIIdx]['field_value'] = value.split("[_yes_] Yes: ")[1].split("[_no_]")[0].trim();
                                                        if (value.split("[_yes_] Yes: ")[1].split("[_no_]")[0].trim() != "") noOfFilledEntries++;
                                                    }
                                            }
                                        }
                                        //console.log("__key__" + key + ", ___value___", value)
                                        for (var intIIdx = 0; intIIdx < optionsArray.length; intIIdx++)
                                        {
                                            if (optionsArray[intIIdx].split("_]")[0] == 'yes')
                                            {
                                                intYesCount++;
                                                newValue = newValue + optionsArray[intIIdx].split("_]")[1].replace("__________", "")
                                                newValue = newValue.replace("____________________________________", "")
                                                newValue = newValue.replace("__________________________", "")
                                                newValue = newValue.replace(",  state reason______________________", "").trim() + ";;"
                                            }
                                        }
                                        if (intYesCount == 1) value = "[[Radio]]" + newValue;
                                        else value = "[[Check]]" + newValue;
                                    }

                                    else
                                    {
                                        newValue = "";
                                        for (var intIIdx = 0; intIIdx < optionsArray.length; intIIdx++)
                                        {
                                            if (optionsArray[intIIdx].split("_]")[0].trim() == 'yes')
                                            {
                                                intYesCount++;
                                                newValue = newValue + optionsArray[intIIdx].split("_]")[1].trim() + ";;"
                                                break;
                                            }
                                        }
                                        for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        {
                                            if (application_form_field_values[intIIdx]['word_file_field_name'] == "Attachments") 
                                            {
                                                application_form_field_values[intIIdx]['field_value'] = newValue;
                                                if (newValue.trim() != "") noOfFilledEntries++;
                                                optionsArray = dataString[intIdx + 1].split("-->")[1].split("[_");
                                                for (var intIIIdx = 0; intIIIdx < optionsArray.length; intIIIdx++)
                                                {
                                                    if (optionsArray[intIIIdx].split("_]")[0].trim() == 'yes')
                                                    {
                                                        intYesCount++;
                                                        newValue = newValue + optionsArray[intIIIdx].split("_]")[1].trim() + ";;"
                                                        break;
                                                    }
                                                }
                                                optionsArray = dataString[intIdx + 2].split("-->")[1].split("[_");
                                                for (var intIIIdx = 0; intIIIdx < optionsArray.length; intIIIdx++)
                                                {
                                                    if (optionsArray[intIIIdx].split("_]")[0].trim() == 'yes')
                                                    {
                                                        //console.log('optionsArray[intIIIdx].split("_]")[1].trim();', optionsArray[intIIIdx].split("_]")[1].trim());
                                                        intYesCount++;
                                                        newValue = newValue + optionsArray[intIIIdx].split("_]")[1].trim() + ";;"
                                                        break;
                                                    }
                                                }
                                                optionsArray = dataString[intIdx + 3].split("-->")[1].split("[_");
                                                for (var intIIIdx = 0; intIIIdx < optionsArray.length; intIIIdx++)
                                                {
                                                    if (optionsArray[intIIIdx].split("_]")[0].trim() == 'yes')
                                                    {
                                                        console.log('optionsArray[intIIIdx].split("_]")[1].trim();', optionsArray[intIIIdx].split("_]")[1].trim());
                                                        intYesCount++;
                                                        newValue = newValue + optionsArray[intIIIdx].split("_]")[1].trim() + ";;"
                                                        break;
                                                    }
                                                }
                                                application_form_field_values[intIIdx]['field_value'] = "[[Check]]" + newValue;
                                                if (("[[Check]]" + newValue).trim() != "") noOfFilledEntries++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (keyValuePair.split("-->").length > 2 && keyValuePair.split("-->")[2].includes('[_yes_]'))
                            {
                                //key = "Consultancy  Organization/ consultant: Self Prepared"
                                //value = "[[Radio]][Yes];;"
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "Consultancy  Organization/ consultant: Self Prepared") 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = "[[Check]]Yes;;";
                                        noOfFilledEntries++;
                                    }
                            }
                            if (keyValuePair.split("-->").length > 2 && keyValuePair.split("-->")[2].includes('[_no_]'))
                            {
                                //key = "Consultancy  Organization/ consultant: Self Prepared"
                                //value = "[[Radio]][No];;"
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "Consultancy  Organization/ consultant: Self Prepared") 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = "[[Radio]]No;;";
                                        noOfFilledEntries++;
                                    }
                            }
                            if (key == "Total including contracted (give break-up as below)"
                            || key == "Part time"
                            || key == "Production(Process wise break up is required)"
                            || key == "QC+Purchase+Store "
                            || key == "Marketing "
                            || key == "Others"
                            || key == "Number of persons in repetitive/identical process"
                            || key == "Number of Shifts (Details of employees working in each shift) ")
                            {
                                blnFillingTableRow = true;
                                if (key != "Number of Shifts (Details of employees working in each shift) ")
                                {
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['word_file_field_name'] == key + ": Main Site (above)") 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1].trim();
                                            if (keyValuePair.split("-->")[1].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['word_file_field_name'] == key + ": Site 1") 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2].trim();
                                            if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['word_file_field_name'] == key + ": Site 2") 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3].trim();
                                            if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['word_file_field_name'] == key + ": Remarks") 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[4].trim();
                                            if (keyValuePair.split("-->")[4].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                else
                                {
                                    for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                        if (application_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                        {
                                            application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1].trim();
                                            if (keyValuePair.split("-->")[1].trim() != "") noOfFilledEntries++;
                                        }
                                }
                            }
                            //if (keyValuePair.split("-->").length == 1 && (keyValuePair.split("-->")[0].includes("Date: ") || keyValuePair.split("-->")[0].includes("Name of the Authorized Representative: ")))
                            if (keyValuePair.split("-->")[0].includes("Date: ") || keyValuePair.split("-->")[0].includes("Name of the Authorized Representative: "))
                            {
                                value = keyValuePair.split("-->")[0].split(": ")[1].trim();
                                key = keyValuePair.split("-->")[0].split(": ")[0].trim();
                            }
                            if (keyValuePair.split("-->")[0].includes("Quest Certification (P) Ltd") 
                            || keyValuePair.split("-->")[0].includes("Form")
                            || keyValuePair.split("-->")[0].includes("Issue No.")
                            || keyValuePair.split("-->")[0].includes("Rev no:")
                            || keyValuePair.split("-->")[0].includes("Rev date:"))
                            {
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "Form No.") 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Form")[1].split(", Issue No")[0].trim();
                                        if (keyValuePair.split("Form")[1].split(", Issue No")[0].trim() != "") noOfFilledEntries++;
                                    }
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "Issue No.") 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Issue No.")[1].split(", Rev no")[0].trim();
                                        if (keyValuePair.split("Issue No.")[1].split(", Rev no")[0].trim() != "") noOfFilledEntries++;
                                    }
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == "Rev No.") 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev no:")[1].split(", Rev date")[0].trim();
                                        if (keyValuePair.split("Rev no:")[1].split(", Rev date")[0].trim() != "") noOfFilledEntries++;
                                    }
                                key = "Rev date";
                                value = keyValuePair.split("Rev date:")[1].split("-->")[0].trim();
                            }
                            if (key != 'Tel.' && key != 'Activity(ies):' && key != 'Activity (ies):' && key != "Attachments" && !blnFillingTableRow)
                            {
                                for (var intIIdx = 0; intIIdx < application_form_field_values.length; intIIdx++) 
                                    if (application_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                    {
                                        application_form_field_values[intIIdx]['field_value'] = value.trim();
                                        if (value.trim() != "") noOfFilledEntries++;
                                    }
                            }
                        }
                        application_form_field_values[application_form_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                        console.log(application_form_field_values)
                        res.send(application_form_field_values);
                        } catch (err) {
                            console.error("Unexpected error: " + err.message + "\n" + err.stack);
                            process.exitCode = 1;
                        }
                    })();
                });
            });
            }
            if (req.body['file_type'] == 'contract_review_form')
            {
                var contract_review_form_field_values = [
                    {"word_file_field_name": "Form", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev no: ", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date: ", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Application Date: ", "field_name": "Application Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Ref  No: ", "field_name": "Ref No", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Company Name:    ", "field_name": "Company Name", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Address              :", "field_name": "Address", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Site (if any):", "field_name": "Site (if any)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "No. of Employees:", "field_name": "No. of Employees", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Scope: ", "field_name": "Scope", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Consultancy Organisation: ", "field_name": "Consultancy Organisation", "field_value": "", "optional": "no"},
                    {"word_file_field_name": " Are Documented informations available:", "field_name": "Are Documented informations available", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "NACE/EA Code/ Sectors : ", "field_name": "NACE/EA Code/ Sectors", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "ISO 9001: 1", "field_name": "ISO 9001 (Part 1)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "ISO 9001: 2", "field_name": "ISO 9001 (Part 2)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "ISO 22000: 1", "field_name": "ISO 22000 (Part 1)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "ISO 22000: 2", "field_name": "ISO 22000 (Part 2)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "First certification", "field_name": "First certification", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Reason of the transfer to QCPL from another CB: ", "field_name": "Reason of the transfer to QCPL from another CB", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "QMS, NCRs reviewed  and audit approved: ", "field_name": "QMS, NCRs reviewed and audit approved", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Reason for QMS, NCRs reviewed and audit, not approved", "field_name": "Reason for QMS, NCRs reviewed and audit, not approved", "field_value": "", "optional": "yes"},
                    {"word_file_field_name": "Is the QCPL scope covered by accreditation:", "field_name": "Is the QCPL scope covered by accreditation?", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Verified that there is no threat to impartiality:", "field_name": "Verified that there is no threat to impartiality?", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Verified that persons qualified in the NACE Code is/ are available:  ", "field_name": "Verified that persons qualified in the NACE Code is/ are available?", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Review of changes in Client Organisation(Surveillance/ Recertification):", "field_name": "Review of changes in Client Organisation (Surveillance/ Recertification)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Temporary Sites audit", "field_name": "Consideration for calculating man-day: 1. Temporary Sites audit", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Outsourced Process", "field_name": "Consideration for calculating man-day: 2. Outsourced Process", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Shift audit", "field_name": "Consideration for calculating man-day: 3. Shift audit", "field_value": "", "optional": "no"},

                    {"word_file_field_name": "      If yes: Number of Shifts", "field_name": "Number of Shifts", "field_value": "", "optional": "yes"},
                    {"word_file_field_name": "                  No of Persons in each shift                 ", "field_name": "No of Persons in each shift", "field_value": "", "optional": "yes"},
                    {"word_file_field_name": "                  Activities carried out in each shift", "field_name": "Activities carried out in each shift", "field_value": "", "optional": "yes"},
                    {"word_file_field_name": "Plan to cover the shift", "field_name": "Plan to cover the shifts", "field_value": "", "optional": "yes"},

                    {"word_file_field_name": "Seasonal Production time", "field_name": "Consideration for calculating man-day: 4. Seasonal Production time", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Contract/ Temporary employees", "field_name": "Consideration for calculating man-day: 5. Contract/ Temporary employees", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Language", "field_name": "Consideration for calculating man-day: 6. Language", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Safety", "field_name": "Consideration for calculating man-day: 7. Safety", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Manday calculation: ", "field_name": "Manday calculation", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Stage I Required", "field_name": "Audit Manday: Required: Stage I", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Stage I Apply", "field_name": "Audit Manday: Apply: Stage I", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Stage II Required", "field_name": "Audit Manday: Required: Stage II", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Stage II Apply", "field_name": "Audit Manday: Apply: Stage II", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Surveillance Required", "field_name": "Audit Manday: Required: Surveillance", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Surveillance Apply", "field_name": "Audit Manday: Apply: Surveillance", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Justification for reduction/increase: ", "field_name": "Justification for reduction/increase", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Based on the above QCPL  has competence to carry out the certification activity and audit can be undertaken :", "field_name": "Based on the above QCPL has competence to carry out the certification activity and audit can be undertaken?", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Application status : Accepted/ Rejected: ", "field_name": "Application status : Accepted/ Rejected", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Remarks: ", "field_name": "Remarks", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Date: ", "field_name": "Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Enms Table", "field_name": "Table: To Calculate the Effective Enms Personnel", "field_value": "", "optional": "no"},
                    {"no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');

                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);

                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            //console.log(dataString)
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            console.log(dataString);
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                var key = keyValuePair.split("-->")[0]
                                var value = keyValuePair.split("-->")[1]
                                if (key.includes("Application Date: ")) {
                                    key = "Ref  No: "
                                    for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                        if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                        {
                                            contract_review_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2].split(":")[1].trim();
                                            if (keyValuePair.split("-->")[2].split(":")[1].trim() != "") noOfFilledEntries++;
                                        }
                                    key = 'Application Date: '
                                    value = keyValuePair.split("-->")[0].split(":")[1].trim()
                                }
                                if (key == 'Company Name:    ' 
                                || key == 'Address              :' 
                                || key == 'No. of Employees:' 
                                || key == 'Site (if any):')
                                    value = keyValuePair.split("-->")[2];
                                if (keyValuePair.includes("Reason of the transfer to QCPL from another CB: "))
                                {
                                    key = 'Reason of the transfer to QCPL from another CB: '
                                    value = keyValuePair.split('QMS, NCRs reviewed  and audit approved')[0].split(':')[1].trim()
                                }
                                if (key == 'AUDIT MANDAY')
                                {
                                    key = 'Manday calculation: '
                                    value = keyValuePair.split("-->")[4].split(":")[1].trim()
                                }
                                if (key == 'Stage I ')
                                {
                                    key = 'Stage I Apply'
                                    for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                        if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                        {
                                            contract_review_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];
                                            if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                        }
                                    key = 'Justification for reduction/increase: '
                                    for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                        if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                        {
                                            contract_review_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[4].split(":")[1].trim();
                                            if (keyValuePair.split("-->")[4].split(":")[1].trim() != "") noOfFilledEntries++;
                                        }
                                    key = 'Stage I Required'
                                    value = keyValuePair.split("-->")[2];
                                }
                                if (key == 'Stage II ')
                                {
                                    key = 'Stage II Apply'
                                    for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                        if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                        {
                                            contract_review_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];
                                            if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                        }
                                    key = 'Stage II Required'
                                    value = keyValuePair.split("-->")[2];
                                }
                                if (key == 'Surveillance')
                                {
                                    key = 'Surveillance Apply'
                                    for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                        if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                        {
                                            contract_review_form_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];
                                            if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                        }
                                    key = 'Surveillance Required'
                                    value = keyValuePair.split("-->")[2];
                                }
                                if (key.includes('Application status : Accepted/ Rejected: '))
                                {
                                    key = 'Application status : Accepted/ Rejected: '
                                    value = keyValuePair.split("-->")[0].split(":")[2].trim();
                                }
                                if (key.includes('Remarks: '))
                                {
                                    key = 'Remarks: ';
                                    value = keyValuePair.split("-->")[0].split(":")[1].trim()
                                    //console.log(value)
                                }
                                if (key == 'Reviewer sign:')
                                {
                                    key = 'Date: ';
                                    value = value.split(":")[1].trim()
                                }
                                if (keyValuePair.split("-->")[0].includes("Form")
                                || keyValuePair.split("-->")[0].includes("Rev no:")
                                || keyValuePair.split("-->")[0].includes("Rev date:"))
                                {
                                    for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                        if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == "Form") 
                                        {
                                            contract_review_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Form")[1].split(" , Rev no")[0].trim();
                                            if (keyValuePair.split("Form")[1].split(" , Rev no")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                        if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == "Rev no: ") 
                                        {
                                            contract_review_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev no: ")[1].split(", Rev date:")[0].trim();
                                            if (keyValuePair.split("Rev no: ")[1].split(", Rev date:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    key = "Rev date: ";
                                    value = keyValuePair.split("Rev date: ")[1].split("-->")[0].trim();
                                }
                                var optionsArray;
                                var optionsArrayBelow;
                                var newValue;
                                var intYesCount = 0;
                                if (value)
                                {
                                    if (value.includes("[_yes_]") || value.includes("[_no_]"))
                                    {
                                        if (key == "ISO 9001" || key == "ISO 22000")
                                        {
                                            optionsArray = value.split("[_");
                                            optionsArrayBelow = dataString[intIdx + 1].split("-->")[1].split("[_");
                                            newValue = "";
                                            intYesCount = 0;
                                            if (optionsArray[1].split("_]")[0] == "yes")
                                            {
                                                newValue = newValue + optionsArray[1].split("_]")[1]  + ";;";
                                                intYesCount++;
                                            }
                                            for (var intIIdx = 0; intIIdx < optionsArrayBelow.length; intIIdx++)
                                            {
                                                if (optionsArrayBelow[intIIdx].split("_]")[0] == 'yes')
                                                {
                                                    newValue = newValue + optionsArrayBelow[intIIdx].split("_]")[1].replace(",", "").trim() + ";;";
                                                    intYesCount++;
                                                }
                                            }
                                            if (intYesCount == 1) value = "[[Radio]]" + newValue;
			                                else value = "[[Check]]" + newValue;
                                            console.log(value);
                                            for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                            {
                                                if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key + ": 1") 
                                                {
                                                    contract_review_form_field_values[intIIdx]['field_value'] = value;
                                                    if (value.trim() != "") noOfFilledEntries++;
                                                }
                                            }
                                            optionsArray = dataString[intIdx].split("-->")[2].split("[_");
                                            optionsArrayBelow = dataString[intIdx + 1].split("-->")[2].split("[_");
                                            newValue = "";
                                            intYesCount = 0;
                                            if (optionsArray[1].split("_]")[0] == "yes")
                                            {
                                                newValue = newValue + optionsArray[1].split("_]")[1]  + ";;";
                                                intYesCount++;
                                            }
                                            for (var intIIdx = 0; intIIdx < optionsArrayBelow.length; intIIdx++)
                                            {
                                                if (optionsArrayBelow[intIIdx].split("_]")[0] == 'yes')
                                                {
                                                    newValue = newValue + optionsArrayBelow[intIIdx].split("_]")[1].replace(",", "").trim() + ";;";
                                                    intYesCount++;
                                                }
                                            }
                                            if (intYesCount == 1) value = "[[Radio]]" + newValue;
			                                else value = "[[Check]]" + newValue;
                                            console.log(value);
                                            for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                            {
                                                if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key + ": 2") 
                                                {
                                                    contract_review_form_field_values[intIIdx]['field_value'] = value;
                                                    if (value.trim() != "") noOfFilledEntries++;
                                                }
                                            }
                                        }
                                        else if (key == "First certification")
                                        {
                                            optionsArray = value.split("[_");
                                            //optionsArrayBelow = dataString[intIdx + 1].split("-->")[1].split("[_");
                                            newValue = "";
                                            intYesCount = 0;
                                            for (var intIIdx = 1; intIIdx < dataString[intIdx].split("-->").length; intIIdx++)
                                            {
                                                optionsArray = dataString[intIdx].split("-->")[intIIdx].split("[_");
                                                for (var intIIIdx = 0; intIIIdx < optionsArray.length; intIIIdx++)
                                                {
                                                    if (optionsArray[intIIIdx].split("_]")[0] == 'yes')
                                                    {
                                                        newValue = newValue + optionsArray[intIIIdx].split("_]")[1].replace(",  ", "").replace(", ", "").trim() + ";;";
                                                        intYesCount++;
                                                    }
                                                }
                                            }
                                            //if (intYesCount == 1) value = "[[Radio]]" + newValue;
			                                //else value = "[[Check]]" + newValue;
                                            value = "[[Check]]" + newValue;
                                            //console.log(value);
                                        }
                                    }
                                }
                                if (key)
                                {
                                    if (key.includes("[_yes_]") || key.includes("[_no_]"))
                                    {
                                        newValue = ""
                                        value = key;
                                        key = "QMS, NCRs reviewed  and audit approved: ";
                                        optionsArray = value.split("[_");
                                        for (var intIIdx = 0; intIIdx < optionsArray.length; intIIdx++)
                                        {
                                            if (optionsArray[intIIdx].split("_]")[0] == 'yes')
                                            {
                                                if (optionsArray[intIIdx].split("_]")[1] == " Y/ ")
                                                    newValue = newValue + "Yes" + ";;";
                                                else if (optionsArray[intIIdx].split("_]")[1].includes("N  if  N give reason :"))
                                                {
                                                    newValue = newValue + "No" + ";;";
                                                    for (var intIIIdx = 0; intIIIdx < contract_review_form_field_values.length; intIIIdx++) 
                                                        if (contract_review_form_field_values[intIIIdx]['word_file_field_name'] == "Reason for QMS, NCRs reviewed and audit, not approved") 
                                                        {
                                                            contract_review_form_field_values[intIIIdx]['field_value'] = optionsArray[intIIdx].split("_]")[1].split("N give reason :")[1].trim();
                                                            if (optionsArray[intIIdx].split("_]")[1].split("N give reason :")[1].trim() != "") noOfFilledEntries++;
                                                        }
                                                }
                                                intYesCount++;
                                            }
                                        }
                                        if (intYesCount == 1) value = "[[Radio]]" + newValue;
                                        else value = "[[Check]]" + newValue;
                                        console.log(value);
                                    }
                                }
                                if (key == "Is the QCPL scope covered by accreditation:")
                                {
                                    if (dataString[intIdx + 2].split("-->")[1].includes("[_yes_]"))
                                        value = "[[Radio]]Yes;;";
                                    else if (dataString[intIdx + 3].split("-->")[1].includes("[_yes_]"))
                                        value = "[[Radio]]No;;";
                                }
                                if (key == "Verified that there is no threat to impartiality:" 
                                || key == "Verified that persons qualified in the NACE Code is/ are available:  "
                                || key == "Based on the above QCPL  has competence to carry out the certification activity and audit can be undertaken :")
                                {
                                    if (dataString[intIdx + 2].split("-->")[1].includes("[_yes_]"))
                                        value = "[[Radio]]Yes;;";
                                    else if (dataString[intIdx + 2].split("-->")[3].includes("[_yes_]"))
                                        value = "[[Radio]]No;;";
                                }
                                if (key == "Temporary Sites audit" || key == "Outsourced Process" 
                                || key == "Shift audit" || key == "Seasonal Production time"
                                || key == "Contract/ Temporary employees")
                                {
                                    newValue = ""
                                    optionsArray = value.split("[_");
                                    intYesCount = 0;
                                    for (var intIIdx = 0; intIIdx < optionsArray.length; intIIdx++)
                                    {
                                        if (optionsArray[intIIdx].split("_]")[0] == 'yes')
                                        {
                                            newValue = newValue + optionsArray[intIIdx].split("_]")[1].trim() + ";;";
                                            intYesCount++;
                                        }
                                    }
                                    if (intYesCount == 1) value = "[[Radio]]" + newValue;
                                    else value = "[[Check]]" + newValue;
                                    console.log(value);
                                }
                                if (key.includes("Review of changes in Client Organisation(Surveillance/ Recertification):"))
                                {
                                    value = key.split("Review of changes in Client Organisation(Surveillance/ Recertification):")[1].trim();
                                    key = "Review of changes in Client Organisation(Surveillance/ Recertification):";
                                }
                                if (key.includes("Plan to cover the shift"))
                                {
                                    key = "Plan to cover the shift"
                                    optionsArray = value.split("[_");
                                    for (var intIIIdx = 0; intIIIdx < optionsArray.length; intIIIdx++)
                                    {
                                        if (optionsArray[intIIIdx].split("_]")[0] == 'yes')
                                        {
                                            //newValue = newValue + optionsArray[intIIIdx].split("_]")[1].replace(",  ", "").replace(", ", "").trim() + ";;";
                                            if (optionsArray[intIIIdx].split("_]")[1].includes("Initial/"))
                                                value = "[[Radio]]Initial Certification;;";
                                            else if (optionsArray[intIIIdx].split("_]")[1].includes("Surveillance 1/"))
                                                value = "[[Radio]]Surveillance Audit 1;;";
                                            else if (optionsArray[intIIIdx].split("_]")[1].includes("Surveillance 2"))
                                                value = "[[Radio]]Surveillance Audit 2;;";
                                        }
                                    }
                                    console.log(value);
                                }
                                if (keyValuePair.split("-->").length == 4)
                                {
                                    if (keyValuePair.split("-->")[0] == "S.NO"
                                    && keyValuePair.split("-->")[1] == "SECTION"
                                    && keyValuePair.split("-->")[2] == "NUMBER"
                                    && keyValuePair.split("-->")[3] == "DEPARTMENT/PROCESS")
                                    {
                                        var intIIdx = intIdx + 1;
                                        value = [];
                                        while (dataString[intIIdx].split("-->")[0] != "Annexure (Enms Standard)")
                                        {
                                            dataString[intIIdx].split("-->")
                                            value.push({
                                                "SNO": dataString[intIIdx].split("-->")[0],
                                                "SECTION": dataString[intIIdx].split("-->")[1],
                                                "NUMBER": dataString[intIIdx].split("-->")[2],
                                                "DEPARTMENT/PROCESS": dataString[intIIdx].split("-->")[3],
                                            })
                                            intIIdx++;
                                        }
                                        key = "Enms Table"
                                    }
                                }
                                for (var intIIdx = 0; intIIdx < contract_review_form_field_values.length; intIIdx++) 
                                    if (contract_review_form_field_values[intIIdx]['word_file_field_name'] == key) 
                                    {
                                        contract_review_form_field_values[intIIdx]['field_value'] = value;
                                        if ((value + "").trim() != "") noOfFilledEntries++;
                                    }
                            }
                            contract_review_form_field_values[contract_review_form_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            console.log(contract_review_form_field_values)
                            res.send(contract_review_form_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            if (req.body['file_type'] == "stage1_audit_report")
            {
                var stage1_audit_report_field_values = [
                    {"word_file_field_name": "Form", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev no: ", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date: ", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Organisation", "field_name": "Organisation", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Scope of Certification", "field_name": "Scope of Certification", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "NACE/EA", "field_name": "NACE/EA", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Auditor", "field_name": "Auditor", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Date of Audit", "field_name": "Date of Audit", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "1. Documentation including quality manual and procedures were reviewed against the applicable standard. The result of documentation review is included in attachment.", "field_name": "1. Documentation including quality manual and procedures were reviewed against the applicable standard. The result of documentation review is included in attachment", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "2.Evaluation of  clients location and site-specific conditions and to undertake discussions with the client's personnel to determine the preparedness for the stage 2 audit", "field_name": "2. Evaluation of clients location and site-specific conditions and to undertake discussions with the client's personnel to determine the preparedness for the stage 2 audit", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "3. Review of client's status and understanding regarding requirements of the standard, in particular with respect to the identification of key performance or significant aspects, processes, objectives and operation of the management system", "field_name": "3. Review of client's status and understanding regarding requirements of the standard, in particular with respect to the identification of key performance or significant aspects, processes, objectives and operation of the management system", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "4. Collected necessary information regarding the scope of the management system, processes and location(s) of the client, and related statutory and regulatory aspects and compliance (e.g. quality, environmental, legal aspects of the client's operation, associated risks, etc.);Mention the justification for any clause exclusion.", "field_name": "4. Collected necessary information regarding the scope of the management system, processes and location(s) of the client, and related statutory and regulatory aspects and compliance (e.g. quality, environmental, legal aspects of the client's operation, associated risks, etc.);Mention the justification for any clause exclusion", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "5.Evaluation of Internal audits and Management Review", "field_name": "5. Evaluation of Internal audits and Management Review", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "6. Review the allocation of resources for stage 2 audit and agreed with the client on the details of the stage 2 audit", "field_name": "6. Review the allocation of resources for stage 2 audit and agreed with the client on the details of the stage 2 audit", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "7. Collected necessary information for planning stage 2 audit ", "field_name": "7. Collected necessary information for planning stage 2 audit", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "8. Verified the information provided in the application including number of employees", "field_name": "8. Verified the information provided in the application including number of employees", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Audit Findings", "field_name": "Audit Findings", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Areas of Concern", "field_name": "Areas of Concern", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Based on the above evaluation, it is recommended-", "field_name": "Based on the above evaluation, it is recommended -:", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Reviewed by QCPL office", "field_name": "Reviewed by QCPL office", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Remarks", "field_name": "Remarks", "field_value": "", "optional": "no"},
                    {"no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');
            
                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);
            
                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            console.log(dataString);
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                var key = keyValuePair.split("-->")[0]
                                var value = keyValuePair.split("-->")[1]
                                if (keyValuePair.split("-->").length == 1)
                                {
                                    //console.log(keyValuePair.split("-->"));
                                    if (keyValuePair.includes(":"))
                                    {
                                        //console.log("key, ", key);
                                        
                                        key = keyValuePair.split(":")[0]
                                        value = keyValuePair.split(":")[1];
                                        
                                    }
                                    else if (keyValuePair.includes(";"))
                                    {
                                        key = keyValuePair.split(";")[0]
                                        value = keyValuePair.split(";")[1];
                                    }
                                }
                                if (value)
                                {
                                    value = value.replace("\t", "")
                                    if (value.includes("Remarks") && key.includes("Reviewed by QCPL office"))
                                    {
                                        var oldValue = value;
                                        key = "Remarks"
                                        value = keyValuePair.split(":")[2]
                                        for (var intIIdx = 0; intIIdx < stage1_audit_report_field_values.length; intIIdx++) 
                                            if (stage1_audit_report_field_values[intIIdx]['word_file_field_name'] == key)
                                            {
                                                stage1_audit_report_field_values[intIIdx]['field_value'] = value;
                                                if (value.trim() != "") noOfFilledEntries++;
                                            }
                                        key = 'Reviewed by QCPL office'
                                        value = oldValue.replace("Remarks", "")
                                    }
                                }
                                if (keyValuePair.split("-->").length == 4)
                                {
                                    var newKey = keyValuePair.split("-->")[2];
                                    for (var intIIdx = 0; intIIdx < stage1_audit_report_field_values.length; intIIdx++) 
                                            if (stage1_audit_report_field_values[intIIdx]['word_file_field_name'] == newKey)
                                            {
                                                stage1_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];
                                                if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                            }
                                }
                                if (key.includes("1. Documentation including quality manual and procedures were reviewed against the applicable standard."))
                                {
                                    key = "1. Documentation including quality manual and procedures were reviewed against the applicable standard. The result of documentation review is included in attachment.";
                                    value = keyValuePair.split(".")[3].trim()
                                }
                                if (keyValuePair.includes("4. Collected necessary information regarding the scope of the management system, processes and location(s) of the client, and related statutory and regulatory aspects and compliance (e.g. quality, environmental, legal aspects of the client's operation, associated risks, etc.);Mention the justification for any clause exclusion."))
                                {
                                    key = "4. Collected necessary information regarding the scope of the management system, processes and location(s) of the client, and related statutory and regulatory aspects and compliance (e.g. quality, environmental, legal aspects of the client's operation, associated risks, etc.);Mention the justification for any clause exclusion."
                                    value = keyValuePair.split(";")[1].split(".")[1].trim()
                                }
                                if (keyValuePair.includes("6. Review the allocation of resources for stage 2 audit and agreed with the client on the details of the stage 2 audit"))
                                {
                                    key = "6. Review the allocation of resources for stage 2 audit and agreed with the client on the details of the stage 2 audit"
                                    value = keyValuePair.split(":")[1].trim()
                                    //console.log("value: ", value)
                                }
                                if (keyValuePair.split("-->")[0].includes("Form")
                                || keyValuePair.split("-->")[0].includes("Rev no:")
                                || keyValuePair.split("-->")[0].includes("Rev date:"))
                                {
                                    for (var intIIdx = 0; intIIdx < stage1_audit_report_field_values.length; intIIdx++) 
                                        if (stage1_audit_report_field_values[intIIdx]['word_file_field_name'] == "Form") 
                                        {
                                            stage1_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Form")[1].split(", Rev no:")[0].trim();
                                            if (keyValuePair.split("Form")[1].split(", Rev no:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < stage1_audit_report_field_values.length; intIIdx++) 
                                        if (stage1_audit_report_field_values[intIIdx]['word_file_field_name'] == "Rev no: ") 
                                        {
                                            stage1_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim();
                                            if (keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    key = "Rev date: ";
                                    value = keyValuePair.split(", Rev date:")[1].split("-->")[0].trim();
                                }
                                if (key == "Based on the above evaluation, it is recommended-")
                                {
                                    var newValue = "";
                                    if (dataString[intIdx + 1].includes("[_yes_]"))
                                        newValue = newValue + "System is in place for Stage 2 audit.;;"
                                    if (dataString[intIdx + 2].includes("[_yes_]"))
                                        newValue = newValue + "Will be ready for Stage 2 after actions on the areas of concern identified.;;"
                                    if (dataString[intIdx + 3].includes("[_yes_]"))
                                        newValue = newValue + "Stage 1 needs to be repeated;;"
                                    value = "[[Check]]" + newValue;
                                }
                                for (var intIIdx = 0; intIIdx < stage1_audit_report_field_values.length; intIIdx++) 
                                    if (stage1_audit_report_field_values[intIIdx]['word_file_field_name'] == key)
                                    {
                                        stage1_audit_report_field_values[intIIdx]['field_value'] = value;
                                        if (value.trim() != "") noOfFilledEntries++;
                                    }
                            }
                            stage1_audit_report_field_values[stage1_audit_report_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            console.log(stage1_audit_report_field_values)
                            res.send(stage1_audit_report_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            if (req.body['file_type'] == "certification_audit_report")
            {
                var certification_audit_report_field_values = [
                    {"word_file_field_name": "Form", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev no: ", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date: ", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Organization Name", "field_name": "Organization Name", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Address :(Give Physical location, State and country)Site (if any)", "field_name": "Address :(Give Physical location, State and country). Site (if any)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Management Representative", "field_name": "Management Representative", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Contract Number", "field_name": "Contract Number", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Accreditation Body", "field_name": "Accreditation Body", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Standard", "field_name": "Standard", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Type of Audit", "field_name": "Type of Audit", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Audit Objective", "field_name": "Audit Objective", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Scope of Certification", "field_name": "Scope of Certification", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "NACE/EA CodeANZSIC Code", "field_name": "NACE/EA Code, ANZSIC Code", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Audit Team ", "field_name": "Audit Team", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Audit Dates: Stage 1", "field_name": "Audit Dates: Stage 1", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Audit Dates: Stage 2", "field_name": "Audit Dates: Stage 2", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Mandays", "field_name": "Mandays", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Any deviation from the audit plan and their reason", "field_name": "Any deviation from the audit plan and their reason", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Any significant Issues impacting on theaudit programme", "field_name": "Any significant Issues impacting on the audit programme", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Applicable Statutory /Regulatory Requirement(s),Aspects and their associated impacts, emergency preparedness response and itsinclusion in relevant functional areas", "field_name": "Applicable Statutory Regulatory Requirement(s), Aspects and their associated impacts, emergency preparedness response and its inclusion in relevant functional areas", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Introduction about the Organisation", "field_name": "Introduction about the Organisation", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Capability of the Management system to meet applicable requirements and expected outcomes.", "field_name": "Capability of the Management system to meet applicable requirements and expected outcomes.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Effectiveness of Internal audit and MRM ", "field_name": "Effectiveness of Internal audit and MRM", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Any unresolved issues", "field_name": "Any unresolved issues", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Significant Changes if any, since last audit(Applicable for surveillanceand re-certification audit)", "field_name": "Significant Changes if any, since last audit (Applicable for surveillance and re-certification audit)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Review of actions takenfrom non-conformities identified during the previous audit", "field_name": "Review of actions taken from non-conformities identified during the previous audit", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Treatment of complaints", "field_name": "Treatment of complaints", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Progress of planned activities aimed at continual improvement.", "field_name": "Progress of planned activities aimed at continual improvement", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Use of Quality Marks and Certification documents", "field_name": "Use of Quality Marks and Certification documents", "field_value": "", "optional": "no"},
                    //{"word_file_field_name": "Effectiveness and improvement of management system, certified management systems contributions to the achievement of organization�s policy &objectives", "field_name": "Effectiveness and improvement of management system, certified management systems contributions to the achievement of organization’s policy &objectives", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Effectiveness and improvement of management system,", "field_name": "Effectiveness and improvement of management system, certified management systems contributions to the achievement of organization’s policy &objectives", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Effectiveness of ICT in achieving the the audit objectives", "field_name": "Effectiveness of ICT in achieving the the audit objectives", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Adequacy of documentationstructure for the  scope ofcertification", "field_name": "Adequacy of documentation structure for the scope of certification", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Opportunities for Improvement", "field_name": "Opportunities for Improvement", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Non-Conformities raised Major:00        Minor: 01 ", "field_name": "Non-Conformities raised (Major:00, Minor: 01)", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "1. Based on the analysis of all the information and audit evidences gathered during the Stage 1 and stage 2 audits, the audit team concluded to -:", "field_name": "1. Based on the analysis of all the information and audit evidences gathered during the Stage 1 and stage 2 audits, the audit team concluded to -:", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "2.Follow up actions (if any):", "field_name": "2. Follow up actions (if any)", "field_value": "", "optional": "no"},
                    {"no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');
            
                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);
            
                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            //console.log(dataString)
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            console.log(dataString);
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                var key = keyValuePair.split("-->")[0]
                                var value = keyValuePair.split("-->")[1]
                                if (key == 'Audit Dates')
                                {
                                    for (var intIIdx = 0; intIIdx < certification_audit_report_field_values.length; intIIdx++) 
                                        if (certification_audit_report_field_values[intIIdx]['word_file_field_name'] == 'Audit Dates: Stage 1')
                                        {
                                            certification_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                            if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < certification_audit_report_field_values.length; intIIdx++) 
                                        if (certification_audit_report_field_values[intIIdx]['word_file_field_name'] == keyValuePair.split("-->")[3])
                                        {
                                            certification_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[4]; 
                                            if (keyValuePair.split("-->")[4].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (key == '')
                                {
                                    if (value == 'Stage 2')
                                    {
                                        for (var intIIdx = 0; intIIdx < certification_audit_report_field_values.length; intIIdx++) 
                                            if (certification_audit_report_field_values[intIIdx]['word_file_field_name'] == 'Audit Dates: Stage 2')
                                            {
                                                certification_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                                if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                            }
                                    }
                                }
                                if (keyValuePair.split("-->")[0].includes("Form")
                                || keyValuePair.split("-->")[0].includes("Rev no:")
                                || keyValuePair.split("-->")[0].includes("Rev date:"))
                                {
                                    for (var intIIdx = 0; intIIdx < certification_audit_report_field_values.length; intIIdx++) 
                                        if (certification_audit_report_field_values[intIIdx]['word_file_field_name'] == "Form") 
                                        {
                                            certification_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Form")[1].split("Rev no:")[0].trim();
                                            if (keyValuePair.split("Form")[1].split("Rev no:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < certification_audit_report_field_values.length; intIIdx++) 
                                        if (certification_audit_report_field_values[intIIdx]['word_file_field_name'] == "Rev no: ") 
                                        {
                                            certification_audit_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim();
                                            if (keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    key = "Rev date: ";
                                    value = keyValuePair.split(", Rev date:")[1].split("-->")[0].trim();
                                }
                                if (key == "Adequacy of documentationstructure for the  scope ofcertification")
                                {
                                    if (value.includes("[_yes_]")) value = "Acceptable";
                                    else value = "Not acceptable"
                                    value = "[[Radio]]" + value + ";;";
                                }
                                if (key.includes("Considering this assessment is a sampling exercise, each of the nonconformities and observations should be reviewed in"))
                                {
                                    key = "1. Based on the analysis of all the information and audit evidences gathered during the Stage 1 and stage 2 audits, the audit team concluded to -:";
                                    var newValue = "";
                                    if (dataString[intIdx + 1].includes("[_yes_]"))
                                        newValue = newValue + "Recommend for Certification;;";
                                    if (dataString[intIdx + 2].includes("[_yes_]"))
                                        newValue = newValue + "Recommend to Hold till Major NC’s are effectively closed;;";
                                    if (dataString[intIdx + 3].includes("[_yes_]"))
                                        newValue = newValue + "Conduct a full audit again as the system is not yet ready;;";
                                    value = "[[Check]]" + newValue
                                }
                                if (key.includes("2.Follow up actions (if any):"))
                                {
                                    value = key.split("2.Follow up actions (if any):")[1].trim();
                                    key = "2.Follow up actions (if any):"
                                }
                                if (keyValuePair.split("-->")[0].includes("Effectiveness and improvement of management system,")) key = "Effectiveness and improvement of management system,";
                                //Effectiveness and improvement of management system,
                                for (var intIIdx = 0; intIIdx < certification_audit_report_field_values.length; intIIdx++) 
                                    if (certification_audit_report_field_values[intIIdx]['word_file_field_name'] == key)
                                    {
                                        certification_audit_report_field_values[intIIdx]['field_value'] = value;
                                        if (value.trim() != "") noOfFilledEntries++;
                                    }
                            }
                            certification_audit_report_field_values[certification_audit_report_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            res.send(certification_audit_report_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            if (req.body['file_type'] == "nc_report")
            {
                var nc_report_field_values = [
                    {"word_file_field_name": "Form No.", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Issue No.", "field_name": "Issue No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev No.", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "NCR No", "field_name": "NCR No", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Organization Name & Location", "field_name": "Organization Name & Location", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Date ", "field_name": "Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Classified As:", "field_name": "Classified As:", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Process/ Area", "field_name": "Process/Area", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Standard", "field_name": "Standard", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Clause no. ", "field_name": "Clause no.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Non Conformity observed", "field_name": "Non Conformity observed", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Root cause", "field_name": "Root cause", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Correction and Corrective Actions taken or planned based on Root cause analysis", "field_name": "Correction and Corrective Actions taken or planned based on Root cause analysis", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Name / Title", "field_name": "Name / Title", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Review of Action Plan/ Taken submitted: Response Acceptable:", "field_name": "Review of Action Plan/ Taken submitted: Response Acceptable:", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Review of Action Plan/ Taken not submitted", "field_name": "Comment: ", "field_value": "", "optional": "yes"},
                    {"word_file_field_name": "Verified by", "field_name": "Verified by", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Date .", "field_name": "Date .", "field_value": "", "optional": "no"},
                    {"no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');
            
                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);
            
                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            //console.log(dataString)
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            console.log(dataString);
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                //console.log('keyValuePair.split("-->"), ', keyValuePair.split("-->"));
                                var key = keyValuePair.split("-->")[0].trim()
                                var value = keyValuePair.split("-->")[1]
                                if (keyValuePair.split("-->").length > 1 && value.includes("NCR No"))
                                {
                                    key = value.split("Non-Conformity Report")[1].split(":")[0].trim()
                                    value = value.split("Non-Conformity Report")[1].split(":")[1].trim()
                                }
                                if (key == 'Organization Name & Location')
                                {
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == keyValuePair.split("-->")[2])
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];    
                                            if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (keyValuePair.split("-->").length > 3 && (keyValuePair.split("-->")[2] == "Process/ Area"))
                                {
                                    key = keyValuePair.split("-->")[2];
                                    value = keyValuePair.split("-->")[3];
                                }
                                if (key == 'Standard')
                                {
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == keyValuePair.split("-->")[2])
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[3];    
                                            if (keyValuePair.split("-->")[3].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (key.includes("Non Conformity observed"))
                                {
                                    key = keyValuePair.split("-->")[0].split(":")[0]
                                    value = keyValuePair.split("-->")[0].split(":")[1].split("Signature (Auditor)")[0]
                                }
                                if (key.includes("Root cause"))
                                {
                                    key = keyValuePair.split("-->")[0].split(":")[0]
                                    value = keyValuePair.split("-->")[0].split(":")[1]
                                    if (value) value = value.trim()
                                }
                                if (key.includes("Correction and Corrective Actions taken or planned based on Root cause analysis"))
                                {
                                    key = "Correction and Corrective Actions taken or planned based on Root cause analysis";
                                    value = keyValuePair.split(key)[1].split("Name /")[0]
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == "Correction and Corrective Actions taken or planned based on Root cause analysis")
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = keyValuePair.split(key)[1].split("Name /")[0];
                                            if (keyValuePair.split(key)[1].split("Name /")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    key = "Name / Title";
                                    value = keyValuePair.split(key)[1].split("(Signature)")[0].trim()
                                }
                                if (key.includes("Verified by"))
                                {
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == "Date .")
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Date : ")[1].split("Note: ")[0].trim();
                                            if (keyValuePair.split("Date : ")[1].split("Note: ")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    key = "Verified by"
                                    value = keyValuePair.split(key)[1].split("(Signature)")[0].trim()
                                }
                                if (keyValuePair.split("-->")[0].includes("Form")
                                || keyValuePair.split("-->")[0].includes("Issue No.")
                                || keyValuePair.split("-->")[0].includes("Rev no:")
                                || keyValuePair.split("-->")[0].includes("Rev date:"))
                                {
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == "Form No.") 
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Form")[1].split(", Issue No")[0].trim();
                                            if (keyValuePair.split("Form")[1].split(", Issue No")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == "Issue No.") 
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Issue No.")[1].split(", Rev no")[0].trim();
                                            if (keyValuePair.split("Issue No.")[1].split(", Rev no")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == "Rev No.") 
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev no:")[1].split(", Rev date")[0].trim();
                                            if (keyValuePair.split("Rev no:")[1].split(", Rev date")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    key = "Rev date";
                                    value = keyValuePair.split("Rev date:")[1].split("-->")[0].trim();
                                }
                                if (key == "Classified as:")
                                {
                                    if (dataString[intIdx].split("-->")[1].includes("[_yes_]"))
                                        value = "[[Radio]]Major;;";
                                    else if (dataString[intIdx].split("-->")[2].includes("[_yes_]"))
                                        value = "[[Radio]]Minor;;";
                                    for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                        if (nc_report_field_values[intIIdx]['word_file_field_name'] == "Classified As:")
                                        {
                                            nc_report_field_values[intIIdx]['field_value'] = value;
                                            if (value.trim() != "") noOfFilledEntries++;
                                        }
                                    value = keyValuePair.split("-->")[4];
                                    key = "Process/ Area"
                                }
                                if (key == "Response Acceptable:")
                                {
                                    key = "Review of Action Plan/ Taken submitted: Response Acceptable:"
                                    if (dataString[intIdx].split("-->")[1].includes("[_yes_]"))
                                        value = "[[Radio]]Yes;;";
                                    else if (dataString[intIdx].split("-->")[2].includes("[_yes_]"))
                                    {
                                        for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                            if (nc_report_field_values[intIIdx]['word_file_field_name'] == "Review of Action Plan/ Taken not submitted")
                                            {
                                                nc_report_field_values[intIIdx]['field_value'] = dataString[intIdx + 1].split("If No, Comment:")[1].split("Verified by")[0].trim();
                                                if (dataString[intIdx + 1].split("If No, Comment:")[1].split("Verified by")[0].trim() != "") noOfFilledEntries++;
                                            }
                                        value = "[[Radio]]No;;";
                                    }
                                }
                                for (var intIIdx = 0; intIIdx < nc_report_field_values.length; intIIdx++) 
                                    if (nc_report_field_values[intIIdx]['word_file_field_name'] == key)
                                    {
                                        nc_report_field_values[intIIdx]['field_value'] = value;
                                        if (value.trim() != "") noOfFilledEntries++;
                                    }
                            }
                            nc_report_field_values[nc_report_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            res.send(nc_report_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            if (req.body['file_type'] == "customer_feedback_form")
            {
                var customer_feedback_form_field_values = [
                    {"word_file_field_name": "Form No.", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Issue No.", "field_name": "Issue No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev No.", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "QCPL REF NO", "field_name": "QCPL REF NO", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "DATE", "field_name": "DATE", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "COMPANY NAME", "field_name": "COMPANY NAME", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "STANDARD: ISO 9001/ ISO 14001/ HACCP / OHSAS / OTHERS", "field_name": "STANDARD", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "STANDARD: OTHERS", "field_name": "Other Standard Name", "field_value": "", "optional": "yes"},
                    {"word_file_field_name": "APPEARANCE", "field_name": "1.	APPEARANCE: Grading: Write 1 for good, 2 for average, 3 for Poor", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "ATTITUDE", "field_name": "2.	ATTITUDE: Grading: Write 1 for good, 2 for average, 3 for Poor", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "TECHNICAL KNOWLEDGE", "field_name": "3.	TECHNICAL KNOWLEDGE: Grading: Write 1 for good, 2 for average, 3 for Poor", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "COMMUNICATION SKILLS", "field_name": "4.	COMMUNICATION SKILLS: Grading: Write 1 for good, 2 for average, 3 for Poor", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "CONVERSANT WITH STANDARD", "field_name": "5.	CONVERSANT WITH STANDARD: Grading: Write 1 for good, 2 for average, 3 for Poor", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "WOULD YOU RECOMMEND THIS AUDITOR FOR FURTHER ASSESSMENT WORK?", "field_name": "WOULD YOU RECOMMEND THIS AUDITOR FOR FURTHER ASSESSMENT WORK?", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Comments for No", "field_name": "Comments for No", "field_value": "", "optional": "yes"},
                    {"word_file_field_name": "OTHER COMMENTS", "field_name": "OTHER COMMENTS", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "DATE BOTTOM", "field_name": "DATE .", "field_value": "", "optional": "no"},
                    {"no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');
            
                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);
            
                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                var key = keyValuePair.split("-->")[0].trim()
                                var value = keyValuePair.split("-->")[1]
                                console.log(dataString[intIdx]);
                                if (key.includes("QCPL REF NO"))
                                {
                                    key = "QCPL REF NO"
                                    value = keyValuePair.split("-->")[0].split(":")[1].trim()
                                    for (var intIIdx = 0; intIIdx < customer_feedback_form_field_values.length; intIIdx++) 
                                        if (customer_feedback_form_field_values[intIIdx]['word_file_field_name'] == key)
                                        {
                                            customer_feedback_form_field_values[intIIdx]['field_value'] = value;
                                            if (value.trim() != "") noOfFilledEntries++;
                                        }
                                    key = "DATE"
                                    value = keyValuePair.split("-->")[1].split(":")[1].trim()
                                }
                                if (key.includes("COMPANY NAME"))
                                {
                                    key = keyValuePair.split(":")[0].trim()
                                    value = keyValuePair.split(":")[1].replace("STANDARD", "").trim()
                                    for (var intIIdx = 0; intIIdx < customer_feedback_form_field_values.length; intIIdx++) 
                                        if (customer_feedback_form_field_values[intIIdx]['word_file_field_name'] == key)
                                        {
                                            customer_feedback_form_field_values[intIIdx]['field_value'] = value;
                                            if (value.trim() != "") noOfFilledEntries++;
                                        }
                                    key = "STANDARD: ISO 9001/ ISO 14001/ HACCP / OHSAS / OTHERS"
                                    if (keyValuePair.split(key).length > 1)
                                        value = keyValuePair.split(key)[1].trim()
                                    else value = ""
                                }
                                if (key.includes("OTHER COMMENTS:"))
                                {
                                    value = key.split("OTHER COMMENTS:")[1].trim()
                                    key = 'OTHER COMMENTS'
                                    // if (keyValuePair.split(key).length > 1)
                                    //     value = keyValuePair.split(key)[1].split("Completing this feedback form will have no bearing on your assessment/surveillance")[0].replace(": ", "")
                                    // else value = ""
                                }
                                if (key.includes("SIGNED"))
                                {
                                    key = 'DATE BOTTOM'
                                    value = keyValuePair.split("DATE: ")[1]
                                }
                                if (keyValuePair.split("-->")[0].includes("Form")
                                || keyValuePair.split("-->")[0].includes("Issue No.")
                                || keyValuePair.split("-->")[0].includes("Rev no.")
                                || keyValuePair.split("-->")[0].includes("Rev date :"))
                                {
                                    for (var intIIdx = 0; intIIdx < customer_feedback_form_field_values.length; intIIdx++) 
                                        if (customer_feedback_form_field_values[intIIdx]['word_file_field_name'] == "Form No.") 
                                        {
                                            customer_feedback_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Form ")[1].split(", Issue No.")[0].trim();
                                            if (keyValuePair.split("Form ")[1].split(", Issue No.")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < customer_feedback_form_field_values.length; intIIdx++) 
                                        if (customer_feedback_form_field_values[intIIdx]['word_file_field_name'] == "Issue No.") 
                                        {
                                            customer_feedback_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Issue No.")[1].split(", Rev No")[0].trim();
                                            if (keyValuePair.split("Issue No.")[1].split(", Rev No")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < customer_feedback_form_field_values.length; intIIdx++) 
                                        if (customer_feedback_form_field_values[intIIdx]['word_file_field_name'] == "Rev No.") 
                                        {
                                            customer_feedback_form_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev No.")[1].split(", Rev date :")[0].trim();
                                            if (keyValuePair.split("Rev No.")[1].split(", Rev date :")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    key = "Rev date";
                                    value = keyValuePair.split("Rev date :")[1].split("-->")[0].trim();
                                }
                                var optionsArray = [];
                                var newValue = "";
                                if (key == "STANDARD:")
                                {
                                    optionsArray = value.split("[_");
                                    for (var intIIdx = 0; intIIdx < optionsArray.length; intIIdx++)
                                    {
                                        if (optionsArray[intIIdx].split("_]")[0] == 'yes')
                                        {
                                            newValue = newValue + optionsArray[intIIdx].split("_]")[1].trim() + ";;"
                                            if (optionsArray[intIIdx].split("_]")[1].trim().includes('OTHERS'))
                                            {
                                                for (var intIIIdx = 0; intIIIdx < customer_feedback_form_field_values.length; intIIIdx++) 
                                                    if (customer_feedback_form_field_values[intIIIdx]['word_file_field_name'] == "STANDARD: OTHERS")
                                                    {
                                                        customer_feedback_form_field_values[intIIIdx]['field_value'] = optionsArray[intIIdx].split("_]")[1].trim().split("OTHERS")[1].trim();
                                                        if (optionsArray[intIIdx].split("_]")[1].trim().split("OTHERS")[1].trim() != "") noOfFilledEntries++;
                                                    }
                                            }
                                        }
                                    }
                                    value = "[[Radio]]" + newValue;
                                    key = "STANDARD: ISO 9001/ ISO 14001/ HACCP / OHSAS / OTHERS";
                                }
                                if (key.includes("WOULD YOU RECOMMEND THIS AUDITOR FOR FURTHER ASSESSMENT WORK?"))
                                {
                                    optionsArray = key.split("[_");
                                    for (var intIIdx = 1; intIIdx < optionsArray.length; intIIdx++)
                                    {
                                        if (optionsArray[intIIdx].split("_]")[0] == 'yes')
                                        {
                                            if (optionsArray[intIIdx].split("_]")[1].trim() == "YES")
                                                newValue = newValue + "Yes;;"
                                            else if (optionsArray[intIIdx].split("_]")[1].trim() == "NO")
                                            {
                                                newValue = newValue + "No;;"
                                                for (var intIIIdx = 0; intIIIdx < customer_feedback_form_field_values.length; intIIIdx++) 
                                                    if (customer_feedback_form_field_values[intIIIdx]['word_file_field_name'] == "Comments for No")
                                                    {
                                                        customer_feedback_form_field_values[intIIIdx]['field_value'] = dataString[intIdx + 1].split("IF NO, YOUR COMMENTS AS TO WHY:")[1].split("OTHER COMMENTS:")[0].trim();
                                                        if (dataString[intIdx + 1].split("IF NO, YOUR COMMENTS AS TO WHY:")[1].split("OTHER COMMENTS:")[0].trim() != "") noOfFilledEntries++;
                                                    }
                                            }
                                        }
                                    }
                                    value = "[[Radio]]" + newValue;
                                    key = "WOULD YOU RECOMMEND THIS AUDITOR FOR FURTHER ASSESSMENT WORK?";
                                }
                                if (key.includes("APPEARANCE"))
                                {
                                    value = key.split("APPEARANCE")[1].trim();
                                    key = "APPEARANCE"
                                }
                                if (key.includes("ATTITUDE"))
                                {
                                    value = key.split("ATTITUDE")[1].trim();
                                    key = "ATTITUDE"
                                }
                                if (key.includes("TECHNICAL KNOWLEDGE"))
                                {
                                    value = key.split("TECHNICAL KNOWLEDGE")[1].trim();
                                    key = "TECHNICAL KNOWLEDGE"
                                }
                                if (key.includes("COMMUNICATION SKILLS"))
                                {
                                    value = key.split("COMMUNICATION SKILLS")[1].trim();
                                    key = "COMMUNICATION SKILLS"
                                }
                                if (key.includes("CONVERSANT WITH STANDARD"))
                                {
                                    value = key.split("CONVERSANT WITH STANDARD")[1].trim();
                                    key = "CONVERSANT WITH STANDARD"
                                }
                                for (var intIIdx = 0; intIIdx < customer_feedback_form_field_values.length; intIIdx++) 
                                    if (customer_feedback_form_field_values[intIIdx]['word_file_field_name'] == key)
                                    {
                                        customer_feedback_form_field_values[intIIdx]['field_value'] = value;
                                        if (value.trim() != "") noOfFilledEntries++;
                                    }
                            }
                            customer_feedback_form_field_values[customer_feedback_form_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            //console.log(customer_feedback_form_field_values)
                            res.send(customer_feedback_form_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            if (req.body['file_type'] == "auditor_notes_9001")
            {
                var auditor_notes_9001_field_values = [
                    {"word_file_field_name": "Form No.", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Issue No.", "field_name": "Issue No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev No.", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Organisation Name", "field_value": "", "field_name": "Organisation Name"},
                    {"word_file_field_name": "Location", "field_value": "", "field_name": "Location"},
                    {"word_file_field_name": "Scope", "field_value": "", "field_name": "Scope"},
                    {"word_file_field_name": "Exclusions/Justification", "field_value": "", "field_name": "Exclusions/Justification"},
                    {"word_file_field_name": "4.1 Understanding the organization and its context: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.1 Understanding the organization and its context: C/NC"},
                    {"word_file_field_name": "4.1 Understanding the organization and its context: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.1 Understanding the organization and its context: Evidences"},
                    {"word_file_field_name": "4.2 Understanding the needs and expectations of interested parties: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.2 Understanding the needs and expectations of interested parties: C/NC"},
                    {"word_file_field_name": "4.2 Understanding the needs and expectations of interested parties: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.2 Understanding the needs and expectations of interested parties: Evidences"},
                    {"word_file_field_name": "4.3 Determining the scope of the quality management system: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.3 Determining the scope of the quality management system: C/NC"},
                    {"word_file_field_name": "4.3 Determining the scope of the quality management system: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.3 Determining the scope of the quality management system: Evidences"},
                    {"word_file_field_name": "4.4. Quality management system and its processes: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.4. Quality management system and its processes: C/NC"},
                    {"word_file_field_name": "4.4. Quality management system and its processes: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.4. Quality management system and its processes: Evidences"},
                    {"word_file_field_name": "5  Leadership5.1Leadership and commitment5.1.1 General: C/NC", "field_value": "", "field_name": "5  Leadership: 5  Leadership\n5.1Leadership and commitment\n5.1.1 General: C/NC"},
                    {"word_file_field_name": "5  Leadership5.1Leadership and commitment5.1.1 General: Evidences", "field_value": "", "field_name": "5  Leadership: 5  Leadership\n5.1Leadership and commitment\n5.1.1 General: Evidences"},
                    {"word_file_field_name": "5.1.2    Customer focus : C/NC", "field_value": "", "field_name": "5  Leadership: 5.1.2    Customer focus: C/NC"},
                    {"word_file_field_name": "5.1.2    Customer focus : Evidences", "field_value": "", "field_name": "5  Leadership: 5.1.2    Customer focus: Evidences"},
                    {"word_file_field_name": "5.2.2 Communicating the quality policy: C/NC", "field_value": "", "field_name": "5.2  Policy: 5.2.2 Communicating the quality policy: C/NC"},
                    {"word_file_field_name": "5.2.2 Communicating the quality policy: Evidences", "field_value": "", "field_name": "5.2  Policy: 5.2.2 Communicating the quality policy: Evidences"},
                    {"word_file_field_name": "5.3 Organization roles, responsibilities and authorities: C/NC", "field_value": "", "field_name": "5.2  Policy: 5.3 Organization roles, responsibilities and authorities: C/NC"},
                    {"word_file_field_name": "5.3 Organization roles, responsibilities and authorities: Evidences", "field_value": "", "field_name": "5.2  Policy: 5.3 Organization roles, responsibilities and authorities: Evidences"},
                    {"word_file_field_name": "6  Planning6.1 Actions to address risks and opportunities: C/NC", "field_value": "", "field_name": "6  Planning: 6.1 Actions to address risks and opportunities: C/NC"},
                    {"word_file_field_name": "6  Planning6.1 Actions to address risks and opportunities: Evidences", "field_value": "", "field_name": "6  Planning: 6.1 Actions to address risks and opportunities: Evidences"},
                    {"word_file_field_name": "6.2 Quality objectives and planning to achieve them: C/NC", "field_value": "", "field_name": "6  Planning: 6.2 Quality objectives and planning to achieve them: C/NC"},
                    {"word_file_field_name": "6.2 Quality objectives and planning to achieve them: Evidences", "field_value": "", "field_name": "6  Planning: 6.2 Quality objectives and planning to achieve them: Evidences"},
                    {"word_file_field_name": "6.3 Planning of changes: C/NC", "field_value": "", "field_name": "6  Planning: 6.3 Planning of changes: C/NC"},
                    {"word_file_field_name": "6.3 Planning of changes: Evidences", "field_value": "", "field_name": "6  Planning: 6.3 Planning of changes: Evidences"},
                    {"word_file_field_name": "7  Support: C/NC", "field_value": "", "field_name": "7  Support: C/NC"},
                    {"word_file_field_name": "7  Support: Evidences", "field_value": "", "field_name": "7  Support: Evidences"},
                    {"word_file_field_name": "7.1.2  People: C/NC", "field_value": "", "field_name": "7  Support: 7.1.2  People: C/NC"},
                    {"word_file_field_name": "7.1.2  People: Evidences", "field_value": "", "field_name": "7  Support: 7.1.2  People: Evidences"},
                    {"word_file_field_name": "7.1.3 Infrastructure: C/NC", "field_value": "", "field_name": "7  Support: 7.1.3 Infrastructure: C/NC"},
                    {"word_file_field_name": "7.1.3 Infrastructure: Evidences", "field_value": "", "field_name": "7  Support: 7.1.3 Infrastructure: Evidences"},
                    {"word_file_field_name": "7.1.4 Environment for the operation of processes: C/NC", "field_value": "", "field_name": "7  Support: 7.1.4 Environment for the operation of processes: C/NC"},
                    {"word_file_field_name": "7.1.4 Environment for the operation of processes: Evidences", "field_value": "", "field_name": "7  Support: 7.1.4 Environment for the operation of processes: Evidences"},
                    {"word_file_field_name": "7.1.5  Monitoring and measuring resources: C/NC", "field_value": "", "field_name": "7  Support: 7.1.5  Monitoring and measuring resources: C/NC"},
                    {"word_file_field_name": "7.1.5  Monitoring and measuring resources: Evidences", "field_value": "", "field_name": "7  Support: 7.1.5  Monitoring and measuring resources: Evidences"},
                    {"word_file_field_name": "7.1.6 Organizational knowledge: C/NC", "field_value": "", "field_name": "7  Support: 7.1.6 Organizational knowledge: C/NC"},
                    {"word_file_field_name": "7.1.6 Organizational knowledge: Evidences", "field_value": "", "field_name": "7  Support: 7.1.6 Organizational knowledge: Evidences"},
                    {"word_file_field_name": "7.2 Competence: C/NC", "field_value": "", "field_name": "7  Support: 7.2 Competence: C/NC"},
                    {"word_file_field_name": "7.2 Competence: Evidences", "field_value": "", "field_name": "7  Support: 7.2 Competence: Evidences"},
                    {"word_file_field_name": "7.3  Awareness: C/NC", "field_value": "", "field_name": "7  Support: 7.3  Awareness: C/NC"},
                    {"word_file_field_name": "7.3  Awareness: Evidences", "field_value": "", "field_name": "7  Support: 7.3  Awareness: Evidences"},
                    {"word_file_field_name": "7.4 Communication: C/NC", "field_value": "", "field_name": "7  Support: 7.4 Communication: C/NC"},
                    {"word_file_field_name": "7.4 Communication: Evidences", "field_value": "", "field_name": "7  Support: 7.4 Communication: Evidences"},
                    {"word_file_field_name": "7.5 Documented information: C/NC", "field_value": "", "field_name": "7  Support: 7.5 Documented information: C/NC"},
                    {"word_file_field_name": "7.5 Documented information: Evidences", "field_value": "", "field_name": "7  Support: 7.5 Documented information: Evidences"},
                    {"word_file_field_name": "7.5.2 Creating and updating: C/NC", "field_value": "", "field_name": "7  Support: 7.5.2 Creating and updating: C/NC"},
                    {"word_file_field_name": "7.5.2 Creating and updating: Evidences", "field_value": "", "field_name": "7  Support: 7.5.2 Creating and updating: Evidences"},
                    {"word_file_field_name": "7.5.3 Control of documented information: C/NC", "field_value": "", "field_name": "7  Support: 7.5.3 Control of documented information: C/NC"},
                    {"word_file_field_name": "7.5.3 Control of documented information: Evidences", "field_value": "", "field_name": "7  Support: 7.5.3 Control of documented information: Evidences"},
                    {"word_file_field_name": "7.5.3.2  : C/NC", "field_value": "", "field_name": "7  Support: 7.5.3.2: C/NC"},
                    {"word_file_field_name": "7.5.3.2  : Evidences", "field_value": "", "field_name": "7  Support: 7.5.3.2: Evidences"},
                    {"word_file_field_name": "8  Operation8.1  Operational planning and control: C/NC", "field_value": "", "field_name": "8  Operation: 8.1  Operational planning and control: C/NC"},
                    {"word_file_field_name": "8  Operation8.1  Operational planning and control: Evidences", "field_value": "", "field_name": "8  Operation: 8.1  Operational planning and control: Evidences"},
                    {"word_file_field_name": "8.2 Requirements for products and services8.2.1 Customer communication: C/NC", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.1 Customer communication: C/NC"},
                    {"word_file_field_name": "8.2 Requirements for products and services8.2.1 Customer communication: Evidences", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.1 Customer communication: Evidences"},
                    {"word_file_field_name": "8.2.2 Determining the requirements for products and services: C/NC", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.2 Determining the requirements for products and services: C/NC"},
                    {"word_file_field_name": "8.2.2 Determining the requirements for products and services: Evidences", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.2 Determining the requirements for products and services: Evidences"},
                    {"word_file_field_name": "8.2.3 Review of the requirements for products and services: C/NC", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.3 Review of the requirements for products and services: C/NC"},
                    {"word_file_field_name": "8.2.3 Review of the requirements for products and services: Evidences", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.3 Review of the requirements for products and services: Evidences"},
                    {"word_file_field_name": "8.2.3.2  Design and development planning: C/NC", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.3.2  Design and development planning: C/NC"},
                    {"word_file_field_name": "8.2.3.2  Design and development planning: Evidences", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.3.2  Design and development planning: Evidences"},
                    {"word_file_field_name": "8.2.4 Changes to requirements for products and services: C/NC", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.4 Changes to requirements for products and services: C/NC"},
                    {"word_file_field_name": "8.2.4 Changes to requirements for products and services: Evidences", "field_value": "", "field_name": "8.2 Requirements for products and services: 8.2.4 Changes to requirements for products and services: Evidences"},
                    {"word_file_field_name": "8.3 Design and development of products and services: C/NC", "field_value": "", "field_name": "8.3 Design and development of products and services: C/NC"},
                    {"word_file_field_name": "8.3 Design and development of products and services: Evidences", "field_value": "", "field_name": "8.3 Design and development of products and services: Evidences"},
                    {"word_file_field_name": "8.3.2 Design and development planning: C/NC", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.2 Design and development planning: C/NC"},
                    {"word_file_field_name": "8.3.2 Design and development planning: Evidences", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.2 Design and development planning: Evidences"},
                    {"word_file_field_name": "8.3.3 Design and development inputs: C/NC", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.3 Design and development inputs: C/NC"},
                    {"word_file_field_name": "8.3.3 Design and development inputs: Evidences", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.3 Design and development inputs: Evidences"},
                    {"word_file_field_name": "8.3.4 Design and development controls: C/NC", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.4 Design and development controls: C/NC"},
                    {"word_file_field_name": "8.3.4 Design and development controls: Evidences", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.4 Design and development controls: Evidences"},
                    {"word_file_field_name": "8.3.5 Design and development outputs: C/NC", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.5 Design and development outputs: C/NC"},
                    {"word_file_field_name": "8.3.5 Design and development outputs: Evidences", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.5 Design and development outputs: Evidences"},
                    {"word_file_field_name": "8.3.6 Design and development changes: C/NC", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.6 Design and development changes: C/NC"},
                    {"word_file_field_name": "8.3.6 Design and development changes: Evidences", "field_value": "", "field_name": "8.3 Design and development of products and services: 8.3.6 Design and development changes: Evidences"},
                    {"word_file_field_name": "8.4 Control of externally provided processes, products and services8.4.1 General: C/NC", "field_value": "", "field_name": "8.4 Control of externally provided processes, products and services: 8.4.1 General: C/NC"},
                    {"word_file_field_name": "8.4 Control of externally provided processes, products and services8.4.1 General: Evidences", "field_value": "", "field_name": "8.4 Control of externally provided processes, products and services: 8.4.1 General: Evidences"},
                    {"word_file_field_name": "8.4.2  Type and extent of control: C/NC", "field_value": "", "field_name": "8.4 Control of externally provided processes, products and services: 8.4.2  Type and extent of control: C/NC"},
                    {"word_file_field_name": "8.4.2  Type and extent of control: Evidences", "field_value": "", "field_name": "8.4 Control of externally provided processes, products and services: 8.4.2  Type and extent of control: Evidences"},
                    {"word_file_field_name": "8.4.3 Information for external providers: C/NC", "field_value": "", "field_name": "8.4 Control of externally provided processes, products and services: 8.4.3 Information for external providers: C/NC"},
                    {"word_file_field_name": "8.4.3 Information for external providers: Evidences", "field_value": "", "field_name": "8.4 Control of externally provided processes, products and services: 8.4.3 Information for external providers: Evidences"},
                    {"word_file_field_name": "8.5 Production and service provision8.5.1 Control of production and service provision: C/NC", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.1 Control of production and service provision: C/NC"},
                    {"word_file_field_name": "8.5 Production and service provision8.5.1 Control of production and service provision: Evidences", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.1 Control of production and service provision: Evidences"},
                    {"word_file_field_name": "8.5.2  Identification and traceability: C/NC", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.2  Identification and traceability: C/NC"},
                    {"word_file_field_name": "8.5.2  Identification and traceability: Evidences", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.2  Identification and traceability: Evidences"},
                    {"word_file_field_name": "8.5.3 Property belonging to customers or external providers: C/NC", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.3 Property belonging to customers or external providers: C/NC"},
                    {"word_file_field_name": "8.5.3 Property belonging to customers or external providers: Evidences", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.3 Property belonging to customers or external providers: Evidences"},
                    {"word_file_field_name": "8.5.4 Preservation: C/NC", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.4 Preservation: C/NC"},
                    {"word_file_field_name": "8.5.4 Preservation: Evidences", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.4 Preservation: Evidences"},
                    {"word_file_field_name": "8.5.5 Post-delivery activities: C/NC", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.5 Post-delivery activities: C/NC"},
                    {"word_file_field_name": "8.5.5 Post-delivery activities: Evidences", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.5 Post-delivery activities: Evidences"},
                    {"word_file_field_name": "8.5.6 Control of changes: C/NC", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.6 Control of changes: C/NC"},
                    {"word_file_field_name": "8.5.6 Control of changes: Evidences", "field_value": "", "field_name": "8.5 Production and service provision: 8.5.6 Control of changes: Evidences"},
                    {"word_file_field_name": "8.6 Release of products and services: C/NC", "field_value": "", "field_name": "8.6 Release of products and services: C/NC"},
                    {"word_file_field_name": "8.6 Release of products and services: Evidences", "field_value": "", "field_name": "8.6 Release of products and services: Evidences"},
                    {"word_file_field_name": "8.7 Control of nonconforming outputs8.7.1 : C/NC", "field_value": "", "field_name": "8.7 Control of nonconforming outputs: 8.7.1: C/NC"},
                    {"word_file_field_name": "8.7 Control of nonconforming outputs8.7.1 : Evidences", "field_value": "", "field_name": "8.7 Control of nonconforming outputs: 8.7.1: Evidences"},
                    {"word_file_field_name": "8.7.2  : C/NC", "field_value": "", "field_name": "8.7 Control of nonconforming outputs: 8.7.2: C/NC"},
                    {"word_file_field_name": "8.7.2  : Evidences", "field_value": "", "field_name": "8.7 Control of nonconforming outputs: 8.7.2: Evidences"},
                    {"word_file_field_name": "9 Performance evaluation9.1  Monitoring, measurement, analysis and evaluation9.1.1 General: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.1  Monitoring, measurement, analysis and evaluation: 9.1.1 General: C/NC"},
                    {"word_file_field_name": "9 Performance evaluation9.1  Monitoring, measurement, analysis and evaluation9.1.1 General: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.1  Monitoring, measurement, analysis and evaluation: 9.1.1 General: Evidences"},
                    {"word_file_field_name": "9.1.2 Customer Satisfaction : C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.1  Monitoring, measurement, analysis and evaluation: 9.1.2 Customer Satisfaction: C/NC"},
                    {"word_file_field_name": "9.1.2 Customer Satisfaction : Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.1  Monitoring, measurement, analysis and evaluation: 9.1.2 Customer Satisfaction: Evidences"},
                    {"word_file_field_name": "9.1.3 Analysis and evaluation: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.1  Monitoring, measurement, analysis and evaluation: 9.1.3 Analysis and evaluation: C/NC"},
                    {"word_file_field_name": "9.1.3 Analysis and evaluation: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.1  Monitoring, measurement, analysis and evaluation: 9.1.3 Analysis and evaluation: Evidences"},
                    {"word_file_field_name": "9.2 Internal audit : C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: C/NC"},
                    {"word_file_field_name": "9.2 Internal audit : Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: Evidences"},
                    {"word_file_field_name": "Management reviewGeneral : C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Management review: 9.2.1	General: C/NC"},
                    {"word_file_field_name": "Management reviewGeneral : Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Management review: 9.2.1	General: Evidences"},
                    {"word_file_field_name": "Management review inputs  9.3.3    Management review outputs : C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.3.3 Management review outputs: C/NC"},
                    {"word_file_field_name": "Management review inputs  9.3.3    Management review outputs : Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.3.3 Management review outputs: Evidences"},
                    {"word_file_field_name": "10   Improvement10.1   General: C/NC", "field_value": "", "field_name": "10 Improvement: 10.1 General: C/NC"},
                    {"word_file_field_name": "10   Improvement10.1   General: Evidences", "field_value": "", "field_name": "10 Improvement: 10.1 General: Evidences"},
                    {"word_file_field_name": "Nonconformity and corrective action: C/NC", "field_value": "", "field_name": "10 Improvement: 10.2 Nonconformity and corrective action: C/NC"},
                    {"word_file_field_name": "Nonconformity and corrective action: Evidences", "field_value": "", "field_name": "10 Improvement: 10.2 Nonconformity and corrective action: Evidences"},
                    {"word_file_field_name": "10.3 Continual improvement: C/NC", "field_value": "", "field_name": "10 Improvement: 10.3 Continual improvement: C/NC"},
                    {"word_file_field_name": "10.3 Continual improvement: Evidences", "field_value": "", "field_name": "10 Improvement: 10.3 Continual improvement: Evidences"},
                    {"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :\
                    \n1. A review of actions taken from non -conformities identified during the previous audit.\
                    \n2. Internal audit and Management review.\
                    \n3. Treatment of complaints.\
                    \n4. Effectiveness of the management system with regard to achieving the certified client's objectives.\
                    \n5. Progress of planned activities aimed at continual improvement.\
                    \n6. Continuing Operational control.\
                    \n7. Review of any changes\
                    \n8. Use of marks and/or any other reference to certification: C/NC", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT :\
                    \n1. A review of actions taken from non -conformities identified during the previous audit.\
                    \n2. Internal audit and Management review.\
                    \n3. Treatment of complaints.\
                    \n4. Effectiveness of the management system with regard to achieving the certified client's objectives.\
                    \n5. Progress of planned activities aimed at continual improvement.\
                    \n6. Continuing Operational control.\
                    \n7. Review of any changes\
                    \n8. Use of marks and/or any other reference to certification: C/NC"},
                    {"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :\
                    \n1. A review of actions taken from non -conformities identified during the previous audit.\
                    \n2. Internal audit and Management review.\
                    \n3. Treatment of complaints.\
                    \n4. Effectiveness of the management system with regard to achieving the certified client's objectives.\
                    \n5. Progress of planned activities aimed at continual improvement.\
                    \n6. Continuing Operational control.\
                    \n7. Review of any changes\
                    \n8. Use of marks and/or any other reference to certification: Evidences", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT :\
                    \n1. A review of actions taken from non -conformities identified during the previous audit.\
                    \n2. Internal audit and Management review.\
                    \n3. Treatment of complaints.\
                    \n4. Effectiveness of the management system with regard to achieving the certified client's objectives.\
                    \n5. Progress of planned activities aimed at continual improvement.\
                    \n6. Continuing Operational control.\
                    \n7. Review of any changes\
                    \n8. Use of marks and/or any other reference to certification: Evidences"},
                    {"word_file_field_name": "RECERTIFICATION AUDIT :\
                    \n1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.\
                    \n2. Effectiveness and improvement of the management system in order to enhance the overall performance.\
                    \n3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives.\
                    \n4. The organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement: C/NC", "field_value": "", "field_name": "RECERTIFICATION AUDIT :\
                    \n1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.\
                    \n2. Effectiveness and improvement of the management system in order to enhance the overall performance.\
                    \n3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives.\
                    \n4. The organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement: C/NC"},
                    {"word_file_field_name": "RECERTIFICATION AUDIT :\
                    \n1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.\
                    \n2. Effectiveness and improvement of the management system in order to enhance the overall performance.\
                    \n3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives.\
                    \n4. The organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement: Evidences", "field_value": "", "field_name": "RECERTIFICATION AUDIT :\
                    \n1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.\
                    \n2. Effectiveness and improvement of the management system in order to enhance the overall performance.\
                    \n3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives.\
                    \n4. The organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement: Evidences"},
                    {"word_file_field_name": "SITE DETAILS :\
                    \n1. Site name/Location.\
                    \n2. No. of. Employees working in site.\
                    \n3. Activities carried out in site.\
                    \n4. Records maintained in site: C/NC", "field_value": "", "field_name": "SITE DETAILS :\
                    \n1. Site name/Location.\
                    \n2. No. of. Employees working in site.\
                    \n3. Activities carried out in site.\
                    \n4. Records maintained in site: C/NC"},
                    {"word_file_field_name": "SITE DETAILSSite name/LocationNo. of. Employees working in siteActivities carried out in siteRecords maintained in site", "field_value": "", "field_name": "SITE DETAILS :\
                    \n1. Site name/Location.\
                    \n2. No. of. Employees working in site.\
                    \n3. Activities carried out in site.\
                    \n4. Records maintained in site: Evidences"},
                    {"field_name": "", "word_file_field_name": "", "no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');
            
                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);
            
                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                var key = keyValuePair.split("-->")[0].trim()
                                var value = keyValuePair.split("-->")[1]
                                if (key.includes('Organisation Name'))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == 'Organisation Name')
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[1].replace("Location", "");
                                            if (keyValuePair.split(":")[1].replace("Location", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == 'Location')
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[2].replace("Scope", "");
                                            if (keyValuePair.split(":")[2].replace("Scope", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == 'Scope')
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[3].replace('Exclusions/Justification', '');
                                            if (keyValuePair.split(":")[3].replace('Exclusions/Justification', '').trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == 'Exclusions/Justification')
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[4];
                                            if (keyValuePair.split(":")[4].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (key.includes('SURVEILLANCE AUDIT REQUIREMENT'))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['field_name'].includes("SURVEILLANCE AUDIT REQUIREMENT") && auditor_notes_9001_field_values[intIIdx]['field_name'].includes(": C/NC"))
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1];
                                            if (keyValuePair.split("-->")[1].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['field_name'].includes("SURVEILLANCE AUDIT REQUIREMENT") && auditor_notes_9001_field_values[intIIdx]['field_name'].includes(": Evidences"))
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                            if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (key.includes('RECERTIFICATION AUDIT'))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['field_name'].includes("RECERTIFICATION AUDIT") && auditor_notes_9001_field_values[intIIdx]['field_name'].includes(": C/NC"))
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1];
                                            if (keyValuePair.split("-->")[1].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['field_name'].includes("RECERTIFICATION AUDIT") && auditor_notes_9001_field_values[intIIdx]['field_name'].includes(": Evidences"))
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                            if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (key.includes('SITE DETAILS'))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['field_name'].includes("SITE DETAILS") && auditor_notes_9001_field_values[intIIdx]['field_name'].includes(": C/NC"))
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1].replace("C/NC", "")
                                            if (keyValuePair.split("-->")[1].replace("C/NC", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['field_name'].includes("SITE DETAILS") && auditor_notes_9001_field_values[intIIdx]['field_name'].includes(": Evidences"))
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2].replace("Evidences", "")
                                            if (keyValuePair.split("-->")[2].replace("Evidences", "").trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (keyValuePair.split("-->")[0].includes("Form")
                                || keyValuePair.split("-->")[0].includes("Issue No.")
                                || keyValuePair.split("-->")[0].includes("Rev no:")
                                || keyValuePair.split("-->")[0].includes("Rev date:"))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == "Form No.") 
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("Form ")[1].split(" Issue No.")[0].trim();
                                            if (keyValuePair.split("Form ")[1].split(" Issue No.")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == "Issue No.") 
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("Issue No.")[1].split(", Rev no")[0].trim();
                                            if (keyValuePair.split("Issue No.")[1].split(", Rev no")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == "Rev No.") 
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim();
                                            if (keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'] == "Rev date") 
                                        {
                                            auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev date:")[1].split("-->")[0].trim();
                                            if (keyValuePair.split("Rev date:")[1].split("-->")[0].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                //
                                for (var intIIdx = 0; intIIdx < auditor_notes_9001_field_values.length; intIIdx++) 
                                {
                                    if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'].includes(key) && key != "")
                                    {
                                        if (auditor_notes_9001_field_values[intIIdx]['word_file_field_name'].includes("C/NC"))
                                        {
                                            if (keyValuePair.split("-->")[1])
                                            {
                                                auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1];
                                                if (keyValuePair.split("-->")[1].trim() != "") noOfFilledEntries++;
                                            }
                                        }
                                        else 
                                        {
                                            if(keyValuePair.split("-->")[1])
                                            {
                                                auditor_notes_9001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                                if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                            }
                                        }
                                    }
                                }
                            }
                            const util = require('util');
                            //console.log(stage1_audit_report_field_values)
                            //console.log(auditor_notes_9001_field_values)
                            //console.log(util.inspect(auditor_notes_9001_field_values, {showHidden: true, depth: null, colors: true}))
                            auditor_notes_9001_field_values[auditor_notes_9001_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            console.log(util.inspect(auditor_notes_9001_field_values, { maxArrayLength: null }))
                            res.send(auditor_notes_9001_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            if (req.body['file_type'] == "auditor_notes_14001")
            {
                var auditor_notes_14001_field_values = [
                    {"word_file_field_name": "Form No.", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Issue No.", "field_name": "Issue No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev No.", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "ORGANISATION NAME", "field_value": "", "field_name": "Organisation Name"},
                    {"word_file_field_name": "LOCATION", "field_value": "", "field_name": "Location"},
                    {"word_file_field_name": "SCOPE", "field_value": "", "field_name": "Scope"},
                    {"word_file_field_name": "4.1     Understanding�the�organization�and�its�context: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.1 Understanding the organization and its context: C/NC"},
                    {"word_file_field_name": "4.1     Understanding�the�organization�and�its�context: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.1 Understanding the organization and its context: Evidences"},
                    {"word_file_field_name": "4.2      Understanding�the�needs�and�expectations�           of�interested�parties: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.2 Understanding the needs and expectations of interested parties: C/NC"},
                    {"word_file_field_name": "4.2      Understanding�the�needs�and�expectations�           of�interested�parties: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.2 Understanding the needs and expectations of interested parties: Evidences"},
                    {"word_file_field_name": "4.3      Determining�the�scope�of�the�environmental�management�system: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.3 Determining the scope of the environmental management system: C/NC"},
                    {"word_file_field_name": "4.3      Determining�the�scope�of�the�environmental�management�system: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.3 Determining the scope of the environmental management system: Evidences"},
                    {"word_file_field_name": "4.4     Environmental�management�system: C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.4 Environmental management system: C/NC"},
                    {"word_file_field_name": "4.4     Environmental�management�system: Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.4 Environmental management system: Evidences"},
                    {"word_file_field_name": "5        Leadership5.1     Leadership�and�commitment: C/NC", "field_value": "", "field_name": "5 Leadership: 5.1 Leadership and commitment: C/NC"},
                    {"word_file_field_name": "5        Leadership5.1     Leadership�and�commitment: Evidences", "field_value": "", "field_name": "5 Leadership: 5.1 Leadership and commitment: Evidences"},
                    {"word_file_field_name": "5.2       Environmental�policy: C/NC", "field_value": "", "field_name": "5 Leadership: 5.2 Environmental policy: C/NC"},
                    {"word_file_field_name": "5.2       Environmental�policy: Evidences", "field_value": "", "field_name": "5 Leadership: 5.2 Environmental policy: Evidences"},
                    {"word_file_field_name": "5.3           Organizational�roles,�responsibilities�and�authorities: C/NC", "field_value": "", "field_name": "5 Leadership: 5.3 Organizational roles, responsibilities and authorities: C/NC"},
                    {"word_file_field_name": "5.3           Organizational�roles,�responsibilities�and�authorities: Evidences", "field_value": "", "field_name": "5 Leadership: 5.3 Organizational roles, responsibilities and authorities: Evidences"},
                    {"word_file_field_name": "6         Planning6.1     Actions�to�address�risks�and�opportunities6.1.1   General: C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.1 General: C/NC"},
                    {"word_file_field_name": "6         Planning6.1     Actions�to�address�risks�and�opportunities6.1.1   General: Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.1 General: Evidences"},
                    {"word_file_field_name": "6.1.2     Environmental�aspects: C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.2 Environmental aspects: C/NC"},
                    {"word_file_field_name": "6.1.2     Environmental�aspects: Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.2 Environmental aspects: Evidences"},
                    {"word_file_field_name": "6.1.3      Compliance�obligations: C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.3 Compliance obligations: C/NC"},
                    {"word_file_field_name": "6.1.3      Compliance�obligations: Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.3 Compliance obligations: Evidences"},
                    {"word_file_field_name": "6.1.4               Planning�action: C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.4 Planning action: C/NC"},
                    {"word_file_field_name": "6.1.4               Planning�action: Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.4 Planning action: Evidences"},
                    {"word_file_field_name": "6.2          Environmental�objectives�and�planning�to�achieve�them6.2.1         Environmental�objectives: C/NC", "field_value": "", "field_name": "6 Planning: 6.2 Environmental objectives and planning to achieve them: 6.2.1 Environmental objectives: C/NC"},
                    {"word_file_field_name": "6.2          Environmental�objectives�and�planning�to�achieve�them6.2.1         Environmental�objectives: Evidences", "field_value": "", "field_name": "6 Planning: 6.2 Environmental objectives and planning to achieve them: 6.2.1 Environmental objectives: Evidences"},
                    {"word_file_field_name": "6.2.2         Planning�actions�to�achieve�environmental�objectives: C/NC", "field_value": "", "field_name": "6 Planning: 6.2 Environmental objectives and planning to achieve them: 6.2.2 Planning actions to achieve environmental objectives: C/NC"},
                    {"word_file_field_name": "6.2.2         Planning�actions�to�achieve�environmental�objectives: Evidences", "field_value": "", "field_name": "6 Planning: 6.2 Environmental objectives and planning to achieve them: 6.2.2 Planning actions to achieve environmental objectives: Evidences"},
                    {"word_file_field_name": "7              Support7.1          Resources: C/NC", "field_value": "", "field_name": "7 Support: 7.1 Resources: C/NC"},
                    {"word_file_field_name": "7              Support7.1          Resources: Evidences", "field_value": "", "field_name": "7 Support: 7.1 Resources: Evidences"},
                    {"word_file_field_name": "7.2          Competence�: C/NC", "field_value": "", "field_name": "7 Support: 7.2 Competence: C/NC"},
                    {"word_file_field_name": "7.2          Competence�: Evidences", "field_value": "", "field_name": "7 Support: 7.2 Competence: Evidences"},
                    {"word_file_field_name": "7.3          Awareness: C/NC", "field_value": "", "field_name": "7 Support: 7.3 Awareness: C/NC"},
                    {"word_file_field_name": "7.3          Awareness: Evidences", "field_value": "", "field_name": "7 Support: 7.3 Awareness: Evidences"},
                    {"word_file_field_name": "7.4             Communication7.4.1            General: C/NC", "field_value": "", "field_name": "7 Support: 7.4 Communication: 7.4.1 General: C/NC"},
                    {"word_file_field_name": "7.4             Communication7.4.1            General: Evidences", "field_value": "", "field_name": "7 Support: 7.4 Communication: 7.4.1 General: Evidences"},
                    {"word_file_field_name": "7.4.2         Internal�communication: C/NC", "field_value": "", "field_name": "7 Support: 7.4 Communication: 7.4.2 Internal communication: C/NC"},
                    {"word_file_field_name": "7.4.2         Internal�communication: Evidences", "field_value": "", "field_name": "7 Support: 7.4 Communication: 7.4.2 Internal communication: Evidences"},
                    {"word_file_field_name": "7.4.3          External�communication: C/NC", "field_value": "", "field_name": "7 Support: 7.4 Communication: 7.4.3 External communication: C/NC"},
                    {"word_file_field_name": "7.4.3          External�communication: Evidences", "field_value": "", "field_name": "7 Support: 7.4 Communication: 7.4.3 External communication: Evidences"},
                    {"word_file_field_name": "7.5           Documented�information7.5.1          General: C/NC", "field_value": "", "field_name": "7 Support: 7.5 Documented information: 7.5.1 General: C/NC"},
                    {"word_file_field_name": "7.5           Documented�information7.5.1          General: Evidences", "field_value": "", "field_name": "7 Support: 7.5 Documented information: 7.5.1 General: Evidences"},
                    {"word_file_field_name": "7.5.2           Creating�and�updating: C/NC", "field_value": "", "field_name": "7 Support: 7.5 Documented information: 7.5.2 Creating and updating: C/NC"},
                    {"word_file_field_name": "7.5.2           Creating�and�updating: Evidences", "field_value": "", "field_name": "7 Support: 7.5 Documented information: 7.5.2 Creating and updating: Evidences"},
                    {"word_file_field_name": "7.5.3          Control�of�documented�information�: C/NC", "field_value": "", "field_name": "7 Support: 7.5 Documented information: 7.5.3 Control of documented information: C/NC"},
                    {"word_file_field_name": "7.5.3          Control�of�documented�information�: Evidences", "field_value": "", "field_name": "7 Support: 7.5 Documented information: 7.5.3 Control of documented information: Evidences"},
                    {"word_file_field_name": "8           Operation8.1        Operational�planning�and�control: C/NC", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: C/NC"},
                    {"word_file_field_name": "8           Operation8.1        Operational�planning�and�control: Evidences", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: Evidences"},
                    {"word_file_field_name": "8.2                    Emergency�preparedness�and�response: C/NC", "field_value": "", "field_name": "8 Operation: 8.2 Emergency preparedness and response: C/NC"},
                    {"word_file_field_name": "8.2                    Emergency�preparedness�and�response: Evidences", "field_value": "", "field_name": "8 Operation: 8.2 Emergency preparedness and response: Evidences"},
                    {"word_file_field_name": "9             Performance�evaluation9.1          Monitoring,�measurement,�analysis� and�evaluation9.1.1         General�: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.1 Monitoring, measurement, analysis and evaluation: 9.1.1 General: C/NC"},
                    {"word_file_field_name": "9             Performance�evaluation9.1          Monitoring,�measurement,�analysis� and�evaluation9.1.1         General�: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.1 Monitoring, measurement, analysis and evaluation: 9.1.1 General: Evidences"},
                    {"word_file_field_name": "9.1.2         Evaluation�of�compliance: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.1 Monitoring, measurement, analysis and evaluation: 9.1.2 Evaluation of compliance: C/NC"},
                    {"word_file_field_name": "9.1.2         Evaluation�of�compliance: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.1 Monitoring, measurement, analysis and evaluation: 9.1.2 Evaluation of compliance: Evidences"},
                    {"word_file_field_name": "9.2        Internal�audit9.2.1      General: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: 9.2.1 General: C/NC"},
                    {"word_file_field_name": "9.2        Internal�audit9.2.1      General: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: 9.2.1 General: Evidences"},
                    {"word_file_field_name": "9.2.2             Internal�audit�programme: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: 9.2.2 Internal audit programme: C/NC"},
                    {"word_file_field_name": "9.2.2             Internal�audit�programme: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: 9.2.2 Internal audit programme: Evidences"},
                    {"word_file_field_name": "9.3            Management�review: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.3 Management review: C/NC"},
                    {"word_file_field_name": "9.3            Management�review: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.3 Management review: Evidences"},
                    {"word_file_field_name": "10�     Improvement10.1      General: C/NC", "field_value": "", "field_name": "10 Improvement: 10.1 General: C/NC"},
                    {"word_file_field_name": "10�     Improvement10.1      General: Evidences", "field_value": "", "field_name": "10 Improvement: 10.1 General: Evidences"},
                    {"word_file_field_name": "10.2         Nonconformity�and�corrective�action10.3.Continual Improvement:: C/NC", "field_value": "", "field_name": "10 Improvement: 10.2 Nonconformity and corrective action\n10.3 Continual Improvement: C/NC"},
                    {"word_file_field_name": "10.2         Nonconformity�and�corrective�action10.3.Continual Improvement:: Evidences", "field_value": "", "field_name": "10 Improvement: 10.2 Nonconformity and corrective action\n10.3 Continual Improvement: Evidences"},
                    {"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken from non -conformities identified during the previous audit.Internal audit and Management review.Treatment of complaints.Effectiveness of the management system with regard to achieving the certified client�s objectives.Progress of planned activities aimed at continual improvement. Continuing Operational control.Review of any changes      8.Use of marks and/or any other reference to certification: C/NC", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT : 1. A review of actions taken from non -conformities identified during the previous audit. 2. Internal audit and Management review. 3. Treatment of complaints. 4. Effectiveness of the management system with regard to achieving the certified client’s objectives. 5. Progress of planned activities aimed at continual improvement. 6. Continuing Operational control. 7. Review of any changes 8. Use of marks and/or any other reference to certification: C/NC"},
                    {"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken from non -conformities identified during the previous audit.Internal audit and Management review.Treatment of complaints.Effectiveness of the management system with regard to achieving the certified client�s objectives.Progress of planned activities aimed at continual improvement. Continuing Operational control.Review of any changes      8.Use of marks and/or any other reference to certification: Evidences", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT : 1. A review of actions taken from non -conformities identified during the previous audit. 2. Internal audit and Management review. 3. Treatment of complaints. 4. Effectiveness of the management system with regard to achieving the certified client’s objectives. 5. Progress of planned activities aimed at continual improvement. 6. Continuing Operational control. 7. Review of any changes 8. Use of marks and/or any other reference to certification: Evidences"},
                    {"word_file_field_name": "RECERTIFICATION AUDIT:Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.Effectiveness and improvement of the management system in order to enhance the overall performance.Whether the operation of the certified management system contributes to the achievement of the Organization�s policy and objectives: C/NC", "field_value": "", "field_name": "RECERTIFICATION AUDIT : 1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification. 2. Effectiveness and improvement of the management system in order to enhance the overall performance. 3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives: C/NC"},
                    {"word_file_field_name": "RECERTIFICATION AUDIT:Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.Effectiveness and improvement of the management system in order to enhance the overall performance.Whether the operation of the certified management system contributes to the achievement of the Organization�s policy and objectives: Evidences", "field_value": "", "field_name": "RECERTIFICATION AUDIT : 1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification. 2. Effectiveness and improvement of the management system in order to enhance the overall performance. 3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives: Evidences"},
                    {"word_file_field_name": "Site detailsSite nameNo. of. Employees working in siteActivities carried out in siteRecords maintained in site: C/NC", "field_value": "", "field_name": "Site details Site name No. of. Employees working in site Activities carried out in site Records maintained in site: C/NC"},
                    {"word_file_field_name": "Site detailsSite nameNo. of. Employees working in siteActivities carried out in siteRecords maintained in site: Evidences", "field_value": "", "field_name": "Site details Site name No. of. Employees working in site Activities carried out in site Records maintained in site: Evidences"},
                    {"field_name": "", "word_file_field_name": "", "no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');
            
                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);
            
                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                var key = keyValuePair.split("-->")[0].trim()
                                var value = keyValuePair.split("-->")[1]
                                if (key.includes('ORGANISATION NAME'))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'] == 'ORGANISATION NAME')
                                        {
                                            auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[1].replace("LOCATION", "");
                                            if (keyValuePair.split(":")[1].replace("LOCATION", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'] == 'LOCATION')
                                        {
                                            auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[2].replace("SCOPE", "");
                                            if (keyValuePair.split(":")[2].replace("SCOPE", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'] == 'SCOPE')
                                        {
                                            auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[3];
                                            if (keyValuePair.split(":")[3].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (keyValuePair.split("-->")[0].includes("Form")
                                || keyValuePair.split("-->")[0].includes("Issue No.")
                                || keyValuePair.split("-->")[0].includes("Revno:")
                                || keyValuePair.split("-->")[0].includes("Revdate:"))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'] == "Form No.") 
                                        {
                                            auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split("Form ")[1].split(",  Issue No.")[0].trim();
                                            if (keyValuePair.split("Form ")[1].split(",  Issue No.")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'] == "Issue No.") 
                                        {
                                            auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split("Issue No.")[1].split(", Revno:")[0].trim();
                                            if (keyValuePair.split("Issue No.")[1].split(", Revno:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'] == "Rev No.") 
                                        {
                                            auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split("Revno:")[1].split(", Revdate:")[0].trim();
                                            if (keyValuePair.split("Revno:")[1].split(", Revdate:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'] == "Rev date") 
                                        {
                                            auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split("Revdate:")[1].split("-->")[0].trim();
                                            if (keyValuePair.split("Revdate:")[1].split("-->")[0].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                for (var intIIdx = 0; intIIdx < auditor_notes_14001_field_values.length; intIIdx++) 
                                {
                                    if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'].includes(key))
                                    {
                                        //console.log("auditor_notes_14001_field_values[intIIdx]['word_file_field_name']: ", auditor_notes_14001_field_values[intIIdx]['word_file_field_name']);
                                        if (auditor_notes_14001_field_values[intIIdx]['word_file_field_name'].includes("C/NC"))
                                        {
                                            if (keyValuePair.split("-->")[1])
                                            {
                                                auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1];
                                                if (keyValuePair.split("-->")[1].trim() != "") noOfFilledEntries++;
                                            }
                                        }
                                        else 
                                        {
                                            if(keyValuePair.split("-->")[1])
                                            {
                                                auditor_notes_14001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                                if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                            }
                                        }
                                    }
                                }
                            }
                            const util = require('util');
                            //console.log(stage1_audit_report_field_values)
                            //console.log(auditor_notes_9001_field_values)
                            //console.log(util.inspect(auditor_notes_9001_field_values, {showHidden: true, depth: null, colors: true}))
                            //console.log(util.inspect(auditor_notes_14001_field_values, { maxArrayLength: null }))
                            //console.log(auditor_notes_14001_field_values)
                            auditor_notes_14001_field_values[auditor_notes_14001_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            res.send(auditor_notes_14001_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            if (req.body['file_type'] == "auditor_notes_45001")
            {
                var auditor_notes_45001_field_values = [
                    {"word_file_field_name": "Form No.", "field_name": "Form No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Issue No.", "field_name": "Issue No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev No.", "field_name": "Revision No.", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "Rev date", "field_name": "Revision Date", "field_value": "", "optional": "no"},
                    {"word_file_field_name": "ORGANISATION NAME", "field_value": "", "field_name": "Organisation Name"},
                    {"word_file_field_name": "LOCATION", "field_value": "", "field_name": "Location"},
                    {"word_file_field_name": "SCOPE", "field_value": "", "field_name": "Scope"},
                    {"word_file_field_name": "EXCLUSION/JUSTIFICATION", "field_value": "", "field_name": "EXCLUSION/JUSTIFICATION"},
                    {"word_file_field_name": "4.1 Understanding the organization and its context : C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.1 Understanding the organization and its context: C/NC"},
                    {"word_file_field_name": "4.1 Understanding the organization and its context : Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.1 Understanding the organization and its context: Evidences"},
                    {"word_file_field_name": "INTERESTED PARTIES and their requirements (4.2): C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.2 INTERESTED PARTIES and their requirements: C/NC"},
                    {"word_file_field_name": "INTERESTED PARTIES and their requirements (4.2): Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.2 INTERESTED PARTIES and their requirements: Evidences"},
                    {"word_file_field_name": "SCOPE of OH&S  management system (4.3): C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.3 SCOPE of OH&S management system: C/NC"},
                    {"word_file_field_name": "SCOPE of OH&S  management system (4.3): Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.3 SCOPE of OH&S management system: Evidences"},
                    {"word_file_field_name": "OH&S Management System (4.4): C/NC", "field_value": "", "field_name": "4 Context of the organization: 4.4 OH&S Management System: C/NC"},
                    {"word_file_field_name": "OH&S Management System (4.4): Evidences", "field_value": "", "field_name": "4 Context of the organization: 4.4 OH&S Management System: Evidences"},
                    {"word_file_field_name": " Leadership and Commitment  (5.1): C/NC", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.1 Leadership and Commitment: C/NC"},
                    {"word_file_field_name": " Leadership and Commitment  (5.1): Evidences", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.1 Leadership and Commitment: Evidences"},
                    {"word_file_field_name": "OH&S Policy (5.2): C/NC", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.2 OH&S Policy: C/NC"},
                    {"word_file_field_name": "OH&S Policy (5.2): Evidences", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.2 OH&S Policy: Evidences"},
                    {"word_file_field_name": "ROLES, RESPONSIBILITIES & AUTHORITIES (5.3): C/NC", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.3 ROLES, RESPONSIBILITIES & AUTHORITIES: C/NC"},
                    {"word_file_field_name": "ROLES, RESPONSIBILITIES & AUTHORITIES (5.3): Evidences", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.3 ROLES, RESPONSIBILITIES & AUTHORITIES: Evidences"},
                    {"word_file_field_name": "consultation & participation of workers (5.4 ): C/NC", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.4 Consultation & participation of workers: C/NC"},
                    {"word_file_field_name": "consultation & participation of workers (5.4 ): Evidences", "field_value": "", "field_name": "5 LEADERSHIP & WORKER PARTICIPATION: 5.4 Consultation & participation of workers: Evidences"},
                    {"word_file_field_name": "6.1 ACTIONS TO ADDRESS RISK & OPPORTUNITIES: C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: C/NC"},
                    {"word_file_field_name": "6.1 ACTIONS TO ADDRESS RISK & OPPORTUNITIES: Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: Evidences"},
                    {"word_file_field_name": "RISKS AND OPPPORTUNITIES related to OH&S hazards & risks(6.1.1): C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.1 RISKS AND OPPPORTUNITIES related to OH&S hazards & risks: C/NC"},
                    {"word_file_field_name": "RISKS AND OPPPORTUNITIES related to OH&S hazards & risks(6.1.1): Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.1 RISKS AND OPPPORTUNITIES related to OH&S hazards & risks: Evidences"},
                    {"word_file_field_name": "Hazard identification and assessment of risks and opportunities. (6.1.2): C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.2 Hazard identification and assessment of risks and opportunities: C/NC"},
                    {"word_file_field_name": "Hazard identification and assessment of risks and opportunities. (6.1.2): Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.2 Hazard identification and assessment of risks and opportunities: Evidences"},
                    {"word_file_field_name": "Determination of legal requirements and other requirements (6.1.3): C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.3 Determination of legal requirements and other requirements: C/NC"},
                    {"word_file_field_name": "Determination of legal requirements and other requirements (6.1.3): Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.3 Determination of legal requirements and other requirements: Evidences"},
                    {"word_file_field_name": "Planning action (6.1.4): C/NC", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.4 Planning action: C/NC"},
                    {"word_file_field_name": "Planning action (6.1.4): Evidences", "field_value": "", "field_name": "6 Planning: 6.1 Actions to address risks and opportunities: 6.1.4 Planning action: Evidences"},
                    {"word_file_field_name": "OH&S objectives and planning to achieve them (6.2): C/NC", "field_value": "", "field_name": "6 Planning: 6.2 OH&S objectives and planning to achieve them: C/NC"},
                    {"word_file_field_name": "OH&S objectives and planning to achieve them (6.2): Evidences", "field_value": "", "field_name": "6 Planning: 6.2 OH&S objectives and planning to achieve them: Evidences"},
                    {"word_file_field_name": "OH&S objectives (6.2.1): C/NC", "field_value": "", "field_name": "6 Planning: 6.2 OH&S objectives and planning to achieve them: 6.2.1 OH&S objectives: C/NC"},
                    {"word_file_field_name": "OH&S objectives (6.2.1): Evidences", "field_value": "", "field_name": "6 Planning: 6.2 OH&S objectives and planning to achieve them: 6.2.1 OH&S objectives: Evidences"},
                    {"word_file_field_name": "6.2.2 Planning to achieve OH&S objectives: C/NC", "field_value": "", "field_name": "6 Planning: 6.2 OH&S objectives and planning to achieve them: 6.2.2 Planning to achieve OH&S objectives: C/NC"},
                    {"word_file_field_name": "6.2.2 Planning to achieve OH&S objectives: Evidences", "field_value": "", "field_name": "6 Planning: 6.2 OH&S objectives and planning to achieve them: 6.2.2 Planning to achieve OH&S objectives: Evidences"},
                    {"word_file_field_name": "7.1 Resources: C/NC", "field_value": "", "field_name": "7 Support: 7.1 Resources: C/NC"},
                    {"word_file_field_name": "7.1 Resources: Evidences", "field_value": "", "field_name": "7 Support: 7.1 Resources: Evidences"},
                    {"word_file_field_name": "7.2 Competence: C/NC", "field_value": "", "field_name": "7 Support: 7.2 Competence: C/NC"},
                    {"word_file_field_name": "7.2 Competence: Evidences", "field_value": "", "field_name": "7 Support: 7.2 Competence: Evidences"},
                    {"word_file_field_name": "7.3 Awareness.: C/NC", "field_value": "", "field_name": "7 Support: 7.3 Awareness: C/NC"},
                    {"word_file_field_name": "7.3 Awareness.: Evidences", "field_value": "", "field_name": "7 Support: 7.3 Awareness: Evidences"},
                    {"word_file_field_name": "7.4 Communication: C/NC", "field_value": "", "field_name": "7 Support: 7.4 Communication: C/NC"},
                    {"word_file_field_name": "7.4 Communication: Evidences", "field_value": "", "field_name": "7 Support: 7.4 Communication: Evidences"},
                    {"word_file_field_name": "7.5 Documented information: C/NC", "field_value": "", "field_name": "7 Support: 7.5 Documented information: C/NC"},
                    {"word_file_field_name": "7.5 Documented information: Evidences", "field_value": "", "field_name": "7 Support: 7.5 Documented information: Evidences"},
                    {"word_file_field_name": "8.1 Operational planning and control: C/NC", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: C/NC"},
                    {"word_file_field_name": "8.1 Operational planning and control: Evidences", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: Evidences"},
                    {"word_file_field_name": "8.1.2 Eliminating hazards and reducing OH&S risks: C/NC", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: 8.1.2 Eliminating hazards and reducing OH&S risks: C/NC"},
                    {"word_file_field_name": "8.1.2 Eliminating hazards and reducing OH&S risks: Evidences", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: 8.1.2 Eliminating hazards and reducing OH&S risks: Evidences"},
                    {"word_file_field_name": "8.1.3 Management of change: C/NC", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: 8.1.3 Management of change: C/NC"},
                    {"word_file_field_name": "8.1.3 Management of change: Evidences", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: 8.1.3 Management of change: Evidences"},
                    {"word_file_field_name": "8.1.4 Procurement: C/NC", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: 8.1.4 Procurement: C/NC"},
                    {"word_file_field_name": "8.1.4 Procurement: Evidences", "field_value": "", "field_name": "8 Operation: 8.1 Operational planning and control: 8.1.4 Procurement: Evidences"},
                    {"word_file_field_name": "8.2 Emergency preparedness and response: C/NC", "field_value": "", "field_name": "8 Operation: 8.2 Emergency preparedness and response: C/NC"},
                    {"word_file_field_name": "8.2 Emergency preparedness and response: Evidences", "field_value": "", "field_name": "8 Operation: 8.2 Emergency preparedness and response: Evidences"},
                    {"word_file_field_name": "9.1 Monitoring, measurement, analysis and performance evaluation: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.1 Monitoring, measurement, analysis and performance evaluation: C/NC"},
                    {"word_file_field_name": "9.1 Monitoring, measurement, analysis and performance evaluation: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.1 Monitoring, measurement, analysis and performance evaluation: Evidences"},
                    {"word_file_field_name": "9.2 Internal audit: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: C/NC"},
                    {"word_file_field_name": "9.2 Internal audit: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.2 Internal audit: Evidences"},
                    {"word_file_field_name": "9.3 Management review: C/NC", "field_value": "", "field_name": "9 Performance evaluation: 9.3 Management review: C/NC"},
                    {"word_file_field_name": "9.3 Management review: Evidences", "field_value": "", "field_name": "9 Performance evaluation: 9.3 Management review: Evidences"},
                    {"word_file_field_name": "10.2 Incident, nonconformity and corrective action: C/NC", "field_value": "", "field_name": "10 Improvement: 10.2 Incident, nonconformity and corrective action: C/NC"},
                    {"word_file_field_name": "10.2 Incident, nonconformity and corrective action: Evidences", "field_value": "", "field_name": "10 Improvement: 10.2 Incident, nonconformity and corrective action: Evidences"},
                    {"word_file_field_name": "10.3 Continual improvement: C/NC", "field_value": "", "field_name": "10 Improvement: 10.3 Continual improvement: C/NC"},
                    {"word_file_field_name": "10.3 Continual improvement: Evidences", "field_value": "", "field_name": "10 Improvement: 10.3 Continual improvement: Evidences"},
                    //{"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken from non -conformities identified during the previous audit.Internal audit and Management review.Treatment of complaints.Effectiveness of the management system with regard to achieving the certified client�s objectives.Progress of planned activities aimed at continual improvement. Continuing Operational control.Review of any changes      8.Use of marks and/or any other reference to certification: C/NC", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT : 1. A review of actions taken from non -conformities identified during the previous audit. 2. Internal audit and Management review. 3. Treatment of complaints. 4. Effectiveness of the management system with regard to achieving the certified client’s objectives. 5. Progress of planned activities aimed at continual improvement. 6. Continuing Operational control. 7. Review of any changes 8. Use of marks and/or any other reference to certification: C/NC"},
                    {"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken: C/NC", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT : 1. A review of actions taken from non -conformities identified during the previous audit. 2. Internal audit and Management review. 3. Treatment of complaints. 4. Effectiveness of the management system with regard to achieving the certified client’s objectives. 5. Progress of planned activities aimed at continual improvement. 6. Continuing Operational control. 7. Review of any changes 8. Use of marks and/or any other reference to certification: C/NC"},
                    //{"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken from non -conformities identified during the previous audit.Internal audit and Management review.Treatment of complaints.Effectiveness of the management system with regard to achieving the certified client�s objectives.Progress of planned activities aimed at continual improvement. Continuing Operational control.Review of any changes      8.Use of marks and/or any other reference to certification: Evidences", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT : 1. A review of actions taken from non -conformities identified during the previous audit. 2. Internal audit and Management review. 3. Treatment of complaints. 4. Effectiveness of the management system with regard to achieving the certified client’s objectives. 5. Progress of planned activities aimed at continual improvement. 6. Continuing Operational control. 7. Review of any changes 8. Use of marks and/or any other reference to certification: Evidences"},
                    {"word_file_field_name": "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken: Evidences", "field_value": "", "field_name": "SURVEILLANCE AUDIT REQUIREMENT : 1. A review of actions taken from non -conformities identified during the previous audit. 2. Internal audit and Management review. 3. Treatment of complaints. 4. Effectiveness of the management system with regard to achieving the certified client’s objectives. 5. Progress of planned activities aimed at continual improvement. 6. Continuing Operational control. 7. Review of any changes 8. Use of marks and/or any other reference to certification: Evidences"},
                    //{"word_file_field_name": "RECERTIFICATION AUDIT:Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.Effectiveness and improvement of the management system in order to enhance the overall performance.Whether the operation of the certified management system contributes to the achievement of the Organization�s policy and objectivesThe organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement.: C/NC", "field_value": "", "field_name": "RECERTIFICATION AUDIT : 1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification. 2. Effectiveness and improvement of the management system in order to enhance the overall performance. 3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives: C/NC"},
                    {"word_file_field_name": "RECERTIFICATION AUDIT:Effectiveness of the management system: C/NC", "field_value": "", "field_name": "RECERTIFICATION AUDIT : 1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification. 2. Effectiveness and improvement of the management system in order to enhance the overall performance. 3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives: C/NC"},
                    //{"word_file_field_name": "RECERTIFICATION AUDIT:Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification.Effectiveness and improvement of the management system in order to enhance the overall performance.Whether the operation of the certified management system contributes to the achievement of the Organization�s policy and objectivesThe organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement.: Evidences", "field_value": "", "field_name": "RECERTIFICATION AUDIT : 1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification. 2. Effectiveness and improvement of the management system in order to enhance the overall performance. 3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives: Evidences"},
                    {"word_file_field_name": "RECERTIFICATION AUDIT:Effectiveness of the management system: Evidences", "field_value": "", "field_name": "RECERTIFICATION AUDIT : 1. Effectiveness of the management system in its entirety in the light of internal and external changes and its continued relevance and applicability to the scope of certification. 2. Effectiveness and improvement of the management system in order to enhance the overall performance. 3. Whether the operation of the certified management system contributes to the achievement of the Organization’s policy and objectives: Evidences"},
                    {"word_file_field_name": "SITE DETAILSSite name/LocationNo. of. Employees working in siteActivities carried out in siteRecords maintained in site: C/NC", "field_value": "", "field_name": "Site details Site name No. of. Employees working in site Activities carried out in site Records maintained in site: C/NC"},
                    {"word_file_field_name": "SITE DETAILSSite name/LocationNo. of. Employees working in siteActivities carried out in siteRecords maintained in site: Evidences", "field_value": "", "field_name": "Site details Site name No. of. Employees working in site Activities carried out in site Records maintained in site: Evidences"},
                    {"field_name": "", "word_file_field_name": "", "no_of_filled_entries": 0}
                ];
                const http = require('https'); // or 'https' for https:// URLs
                const fs = require('fs');
            
                const file = fs.createWriteStream("application_form11.docx");
                //const request = http.get('https://cwac.in/init_certification_client_application/1645433053973/forms/application_form.docx', function(response) {
                const request = http.get(req.body['url'], function(response) {
                    response.pipe(file);
            
                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        //res.send('ok')
                        (async () => {
                            try {
                                //await runExample();
                                const java = new JavaCaller({
                                classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                                mainClass: 'wordfilemgtnodejs.WordFileMgtNodeJS',// Main class to call, must be available from CLASSPATH,
                                rootPath: __dirname,
                            });
                            const { status, stdout, stderr } = await java.run();
                            var dataString = String(stdout)
                            dataString = dataString.replaceAll('\n', '')
                            dataString = dataString.replaceAll('\r', '')
                            dataString = dataString.replaceAll('\t\t', '-->')
                            var dataString = dataString.split("**************************")
                            for (var intIdx = 0; intIdx < dataString.length; intIdx++) {
                                var keyValuePair = dataString[intIdx];
                                var key = keyValuePair.split("-->")[0].trim()
                                var value = keyValuePair.split("-->")[1]
                                if (key.includes('ORGANISATION NAME'))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == 'ORGANISATION NAME')
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[1].replace("LOCATION", "").trim();
                                            if (keyValuePair.split(":")[1].replace("LOCATION", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == 'LOCATION')
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[2].replace("SCOPE", "").trim();
                                            if (keyValuePair.split(":")[2].replace("SCOPE", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == 'SCOPE')
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[3].replace("EXCLUSION/JUSTIFICATION", "").trim();
                                            if (keyValuePair.split(":")[3].replace("EXCLUSION/JUSTIFICATION", "").trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == 'EXCLUSION/JUSTIFICATION')
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split(":")[4].trim();
                                            if (keyValuePair.split(":")[4].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                if (keyValuePair.split("-->")[0].includes("Issue No.")
                                || keyValuePair.split("-->")[0].includes("Revno:")
                                || keyValuePair.split("-->")[0].includes("Revdate:"))
                                {
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == "Form No.") 
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split("Quest Certification (P) Ltd, ")[1].split(",  Issue No.")[0].trim();
                                            if (keyValuePair.split("Quest Certification (P) Ltd, ")[1].split(",  Issue No.")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == "Issue No.") 
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split("Issue No.")[1].split(", Rev no:")[0].trim();
                                            if (keyValuePair.split("Issue No.")[1].split(", Rev no:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == "Rev No.") 
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim();
                                            if (keyValuePair.split("Rev no:")[1].split(", Rev date:")[0].trim() != "") noOfFilledEntries++;
                                        }
                                    for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'] == "Rev date") 
                                        {
                                            auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split("Rev date:")[1].split("-->")[0].trim();
                                            if (keyValuePair.split("Rev date:")[1].split("-->")[0].trim() != "") noOfFilledEntries++;
                                        }
                                }
                                console.log('keyValuePair.split("-->")[0]: ', keyValuePair.split("-->")[0]);
                                //console.log('keyValuePair: ', keyValuePair);
                                //if (keyValuePair.split("-->")[0].includes("SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken: C/NC")) 
                                if (keyValuePair.split("-->")[0].includes("SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken")) 
                                    key = "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken"
                                // else if (keyValuePair.split("-->")[0].includes("SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken: Evidences")) 
                                //     key = "SURVEILLANCE AUDIT REQUIREMENT :A review of actions taken: Evidences"
                                //else if (keyValuePair.split("-->")[0].includes("RECERTIFICATION AUDIT:Effectiveness of the management system: C/NC")) 
                                else if (keyValuePair.split("-->")[0].includes("RECERTIFICATION AUDIT:Effectiveness of the management system")) 
                                    //key = "RECERTIFICATION AUDIT:Effectiveness of the management system: C/NC"
                                    key = "RECERTIFICATION AUDIT:Effectiveness of the management system"
                                // else if (keyValuePair.split("-->")[0].includes("RECERTIFICATION AUDIT:Effectiveness of the management system: Evidences")) 
                                //     key = "RECERTIFICATION AUDIT:Effectiveness of the management system: Evidences"
                                for (var intIIdx = 0; intIIdx < auditor_notes_45001_field_values.length; intIIdx++) 
                                {
                                    if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'].includes(key))
                                    {
                                        //console.log("auditor_notes_14001_field_values[intIIdx]['word_file_field_name']: ", auditor_notes_14001_field_values[intIIdx]['word_file_field_name']);
                                        if (auditor_notes_45001_field_values[intIIdx]['word_file_field_name'].includes("C/NC"))
                                        {
                                            if (keyValuePair.split("-->")[1])
                                            {
                                                auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[1];
                                                if (keyValuePair.split("-->")[1].trim() != "") noOfFilledEntries++;
                                            }
                                        }
                                        else 
                                        {
                                            if(keyValuePair.split("-->")[1])
                                            {
                                                auditor_notes_45001_field_values[intIIdx]['field_value'] = keyValuePair.split("-->")[2];
                                                if (keyValuePair.split("-->")[2].trim() != "") noOfFilledEntries++;
                                            }
                                        }
                                    }
                                }
                            }
                            const util = require('util');
                            //console.log(stage1_audit_report_field_values)
                            //console.log(auditor_notes_9001_field_values)
                            //console.log(util.inspect(auditor_notes_9001_field_values, {showHidden: true, depth: null, colors: true}))
                            //console.log(util.inspect(auditor_notes_45001_field_values, { maxArrayLength: null }))
                            //console.log(auditor_notes_14001_field_values)
                            auditor_notes_45001_field_values[auditor_notes_45001_field_values.length - 1]['no_of_filled_entries'] = noOfFilledEntries;
                            res.send(auditor_notes_45001_field_values)
                            } catch (err) {
                                console.error("Unexpected error: " + err.message + "\n" + err.stack);
                                process.exitCode = 1;
                            }
                        })();
                    });
                });
            }
            // const http = require('https'); // or 'https' for https:// URLs
            // const fs = require('fs');

            // const file = fs.createWriteStream("word_output.docx");
            // const request = http.get(req.body['url'], function(response) {
            //     response.pipe(file);

            //     // after download completed close filestream
            //     file.on("finish", () => {
            //         file.close();
            //         res.send('true')
            //         // console.log("Download Completed");
            //         // const WordExtractor = require("word-extractor"); 
            //         // const extractor = new WordExtractor();
            //         // const extracted = extractor.extract("word_output.docx");
                    
            //         // extracted.then(function(doc) {
            //         //     //console.log(doc.getBody()); 
            //         //     fs.unlink("word_output.docx", (err) => {
            //         //         console.log('ok')
            //         //         res.send(doc.getBody())
            //         //     })
            //         // });
            //         // const docxTables = require('docx-tables')
            //         // docxTables({
            //         // file: 'word_output.docx'
            //         // }).then((tables) => {
            //         // // .docx table data
            //         //     //console.log(data)
            //         //     // for (var intIdx = 0; intIdx < tables.length; intIdx++)
            //         //     // {
            //         //     //     var table = Object.values(tables[intIdx])
            //         //     //     for (var intInnerIdx = 0; intInnerIdx < table.length; intInnerIdx++) {
            //         //     //         console.log(table[intInnerIdx])
            //         //     //         //console.log("bb")
            //         //     //     }
            //         //     //     //console.log(table)
            //         //     //     //console.log('aa', table.length)
            //         //     // }
            //         //     // console.log(tables)
            //         //     // res.send(tables)
            //         //     console.log(tables)
            //         //     res.send('aa')
            //         // }).catch((error) => {
            //         //     console.error(error)
            //         // })
            //     });
            // });
        }
    });
})
app.post('/generate_app_form', async (req, res) => {
    //const templateFile = fs.readFileSync(path.resolve(__dirname, 'application_form.docx'), 'binary');
    console.log(req.body);


    const templateFile = fs.readFileSync(path.resolve(__dirname, req.body['template_name'] + '.docx'), 'binary');
    const zip = new PizZip(templateFile);
    //const doc2pdf = require('doc2pdf');
    try {
        // Attempt to read all the templated tags
        let outputDocument = new Docxtemplater(zip, { linebreaks: true });
    
        // const dataToAdd = {
        //     'org_name': req.body['org_name'],
        //     'name_desig': req.body['name_desig'],
        //     'mob_no': req.body['mob_no'],
        //     'head_office': req.body['head_office'],
        // };
        //console.log(req.body);
        var dataToAdd = req.body
        //console.log(dataToAdd)
        // Set the data we wish to add to the document
        outputDocument.setData(dataToAdd);
    
        try {
            // Attempt to render the document (Add data to the template)
            outputDocument.render()
    
            // Create a buffer to store the output data
            let outputDocumentBuffer = outputDocument.getZip().generate({ type: 'nodebuffer' });
    
            // Save the buffer to a file
            fs.writeFileSync(path.resolve(__dirname, 'OUTPUT.docx'), outputDocumentBuffer);
            //************************* converted PDF file is not exactly as same as word file
            //const docxConverter = require('docx-pdf');
            // docxConverter('./OUTPUT.docx','./OUTPUT.pdf', (err, result) => {
            //     if (err) console.log(err);
            //     else console.log(result); // writes to file for us
            //   });
            //******************************************************************************
            //************************* Exceptions when trying to execute
            // const path1 = require('path');
            // const fs1 = require('fs').promises;
            
            // const libre = require('libreoffice-convert');
            // libre.convertAsync = require('util').promisify(libre.convert);

            // const ext = '.pdf'
            // const inputPath = path1.join(__dirname, 'OUTPUT.docx');
            // const outputPath = path1.join(__dirname, `OUTPUT${ext}`);
        
            // // Read file
            // const docxBuf = await fs1.readFile(inputPath);
        
            // // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
            // let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);
            
            // // Here in done you have pdf file which you can save or transfer in another stream
            // await fs1.writeFile(outputPath, pdfBuf);
            //******************************************************************************
            //************************* 'soffice' is not recognized as an internal or external command
            // var toPdf = require("custom-soffice-to-pdf")
            // var fs1 = require("fs")
            // var wordBuffer = fs1.readFileSync("./OUTPUT.docx")

            // toPdf(wordBuffer).then(
            // (pdfBuffer) => {
            //     fs1.writeFileSync("./OUTPUT.pdf", pdfBuffer)
            // }, (err) => {
            //     console.log(err)
            // }
            // )
            //******************************************************************************
            //************************* unoconv command not found. Error: spawn unoconv ENOENT
            // const path1 = require('path');
            // const unoconv = require('awesome-unoconv');
            
            // const sourceFilePath = path1.resolve('./OUTPUT.docx');
            // const outputFilePath = path1.resolve('./OUTPUT.pdf');
            // unoconv.convert(sourceFilePath, outputFilePath)
            // .then(result => {
            //     console.log(result); // return outputFilePath
            // })
            // .catch(err => {
            //     console.log(err);
            // });
            //******************************************************************************
            //************************* Command failed. The system cannot find the path specified.
            // var toPdf = require("zapoj-office-to-pdf")
            // var fs1 = require("fs")
            // var wordBuffer = fs1.readFileSync("./OUTPUT.docx")

            // toPdf(wordBuffer).then(
            // (pdfBuffer) => {
            //     fs1.writeFileSync("./OUTPUT.pdf", pdfBuffer)
            // }, (err) => {
            //     console.log(err)
            // }
            // )
            //******************************************************************************
            //************************* 'soffice' is not recognized as an internal or external command
            // var toPdf = require("office-to-pdf")
            // var fs1 = require("fs")
            // var wordBuffer = fs1.readFileSync("./OUTPUT.docx")

            // toPdf(wordBuffer).then(
            // (pdfBuffer) => {
            //     fs1.writeFileSync("./OUTPUT.pdf", pdfBuffer)
            // }, (err) => {
            //     console.log(err)
            // }
            // )
            //******************************************************************************
            //****************************Successfully working but not in heroku
            // const { wordToPdf } = require('node-docto');
            // var buffer;
            // await wordToPdf('./OUTPUT.docx', './OUTPUT.pdf', {deleteOriginal: false}) // heroku throws error here
            // //await wordToPdf('./OUTPUT.docx', buffer, {deleteOriginal: false})
            // //await wordToPdf('./OUTPUT.docx', 'https://cwac.in/temp_files/OUTPUT.pdf', {deleteOriginal: false})
            // .then(stdout => console.log(stdout));
            //******************************************************************************
            

            //var data = fs.readFileSync('./OUTPUT.pdf');

            //var data = fs.readFileSync('https://cwac.in/temp_files/OUTPUT.pdf');
            var data;
            var strPythonCmd = "";
            var docxFileName = "OUTPUT.docx"
            if (req.body['template_name'] == "application_form" || req.body['template_name'] == "contract_review_form" || req.body['template_name'] == "stage1_audit_report" || req.body['template_name'] == "certification_audit_report" || req.body['template_name'] == "nc_report" || req.body['template_name'] == "customer_feedback_form")
            {
                docxFileName = "OUTPUT11.docx"
                //var serviceAccount = require('./admin.json');
                //var client;


                // if (!admin.apps.length) {
                //     client = admin.initializeApp({
                //         credential: admin.credential.cert(serviceAccount),
                //         databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
                //         authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
                //     });
                // }else {
                //     client = admin.app(); // if already initialized, use that one
                //     client.delete();
                //     client = admin.initializeApp({
                //         credential: admin.credential.cert(serviceAccount),
                //         databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
                //         authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
                //     });
                // }

                // var objListRadioCheckBtnValues = Object.keys(req.body).map((key) => [key, req.body[key]]);
                // console.log(objListRadioCheckBtnValues);
                // var objSimpleListRadioCheckBtnValues = [];
                // for (var intIdx = 0; intIdx < objListRadioCheckBtnValues.length; intIdx++)
                // {
                //     if (objListRadioCheckBtnValues[intIdx][0].includes("radiobutton"))
                //     {
                //         for (var intIIdx = 0; intIIdx < objListRadioCheckBtnValues[intIdx][1]['field_value'].length; intIIdx++)
                //         {
                //             if (objListRadioCheckBtnValues[intIdx][1]['field_value'][intIIdx]['option_value'] === objListRadioCheckBtnValues[intIdx][1]['option_value'])
                //             {
                //                 //objSimpleListRadioCheckBtnValues.push({"field_name": })
                //                 break;
                //             }
                //         }
                //     }
                //     else objListRadioCheckBtnValues[intIdx][0].includes("checkbox")
                //     {

                //     }
                // }


                // var db=admin.database();
                // var userRef=db.ref("client_application_form_data/" + req.body['clientid'] + "/app_form_parameters/");
                // await AddParameters({
                //     'Client Name': req.body['Client Name'],
                //     'Approved': 'No',
                //     'description': req.body['description'],
                //     'date': req.body['date'],
                //     'assignedToWhom': req.body['assignedToWhom'],
                //     'stage1_team_assigned': 'No',
                //     'stage2_team_assigned': 'No',
                //     'stage1_plan_status': 'Open',
                //     'stage1_plan_date': "",
                //     'stage2_plan_status': 'Open',
                //     'stage2_plan_date': "",
                //     'quotation_status': 'Open',
                //     'quotation_date': '',
                //     'HO_activity_status': 'Open',
                //     'HO_activity_date': '',
                //     'stage1_plan_task_status': 'Open',
                //     'stage1_plan_task_date': '',
                //     'stage2_plan_task_status': 'Open',
                //     'stage2_plan_task_date': '',
                //     'initial_certification_conclusion': 'Open',
                //     'initial_certification_conclusion_date': '',
                //     'surveillance_audit_status': 'Open',
                //     'email': req.body['email'],
                //     'phone': req.body['phone'],
                // })
                async function AddParameters(obj) {
                    var oneUser=userRef.child(req.body['timestamp']);
                    oneUser.update(obj,(err)=>{
                        if(err){
                            res.send('Something went wrong. Please submit again.');
                        }
                        else res.send('Customer Application Added Successfully');
                        client.delete();
                    })
                }
                var radioBtnList = Object.keys(req.body).map((key) => [key, req.body[key]]);
                //radioBtnList = Array.from(req.body);
                radioBtnList = radioBtnList.filter((ele) => {
                    //console.log(ele[0]);
                    //console.log(ele);
                    //console.log("****************")
                    if ((ele[0] + "").includes('radiobutton') || (ele[0] + "").includes('checkbox'))
                    {
                        //console.log(ele);
                        return ele;
                    }
                })
                //radioBtnList = {"radioObj": radioBtnList};
                console.log(radioBtnList);
                const { JavaCaller } = require("java-caller");
                const java = new JavaCaller({
                    classPath: 'WordFileMgtNodeJS.jar', // CLASSPATH referencing the package embedded jar files
                    mainClass: 'wordfilemgtnodejs.WriteMCQ',// Main class to call, must be available from CLASSPATH,
                    rootPath: __dirname,
                });
                //const { status, stdout, stderr } = await java.run(['abc', JSON.stringify(radioBtnList)]);
                //console.log(radioBtnList)
                //console.log(JSON.stringify(radioBtnList));
                //console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
                const { status, stdout, stderr } = await java.run(['abc', JSON.stringify(radioBtnList)]);
                console.log(stdout);
                strPythonCmd = 'wordtopdf.py OUTPUT11.docx'
            }
            strPythonCmd = 'wordtopdf.py OUTPUT.docx'


            const http = require('https');
            var convertapi = require('convertapi')('23bUgrOh1fg2G2p1');
            convertapi.convert('pdf', {
                //File: 'OUTPUT.docx'
                File: docxFileName
            }).then(async function(result) {
                const fs2 = require('fs');
                const file1 = fs2.createWriteStream("OUTPUT.PDF");
                await http.get(result.file.fileInfo.Url, async function(response) {
                    await response.pipe(file1);
                    file1.on("finish", () => {
                        file1.close()
                        data = fs.readFileSync('./' + docxFileName);
                        dataPDF = fs.readFileSync('./OUTPUT.PDF');
                        const ftpClient = new Ftp();
                        ftpClient.on( 'ready', function() {
                            ftpClient.mkdir('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/forms/", true, async (err) => {
                                if (!err) {
                                    await ftpClient.put( data, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + '/forms/' + req.body['template_name'] + '.docx', function( err, list ) {
                                        if ( err ) throw err;
                                        ftpClient.end();     
                                        console.log('word file uploaded')
                                        //res.send(JSON.stringify({"OK": "OK"}))
                                    });
                                    await ftpClient.put( dataPDF, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + '/forms/' + req.body['template_name'] + '.pdf', function( err, list ) {
                                        if ( err ) throw err;
                                        ftpClient.end();     
                                        console.log('pdf file uploaded1')
                                        res.send(JSON.stringify({"OK": "OK"}))
                                    });
                                }
                            });
                            //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
                        });
                        ftpClient.connect( {
                            'host': 'ftp.cwac.in',
                            'user': 'cwacin',
                            'password': '$Rv01111996'
                        } );
                    })      
                })
            })




            //python.run('wordtopdf.py', options, function (err, results) { 
                //console.log(data.toString());
                //console.log(results)
                //dataToSend = data.toString();
                // data = fs.readFileSync('./OUTPUT.docx');
                // dataPDF = fs.readFileSync('./OUTPUT.pdf');
                // const ftpClient = new Ftp();
                // ftpClient.on( 'ready', function() {
                //     //ftpClient.cwd
                //     //res.send(JSON.stringify({"aaz":"aaz"})) //error not coming here
                //     ftpClient.mkdir('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/forms/", true, async (err) => {
                //         if (!err) {
                //             await ftpClient.put( data, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + '/forms/' + req.body['template_name'] + '.docx', function( err, list ) {
                //                 if ( err ) throw err;
                //                 ftpClient.end();     
                //                 console.log('word file uploaded')
                //                 //res.send(JSON.stringify({"OK": "OK"}))
                //             });
                //             await ftpClient.put( dataPDF, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + '/forms/' + req.body['template_name'] + '.pdf', function( err, list ) {
                //                 if ( err ) throw err;
                //                 ftpClient.end();     
                //                 console.log('pdf file uploaded')
                //                 res.send(JSON.stringify({"OK": "OK"}))
                //             });
                //         }
                //     });
                //     //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
                // });
                // ftpClient.connect( {
                //     'host': 'ftp.cwac.in',
                //     'user': 'cwacin',
                //     'password': '$Rv01111996'
                // } );
            //});
            // data = fs.readFileSync('./OUTPUT.docx');
            // dataPDF = fs.readFileSync('./OUTPUT11.pdf');
            // const ftpClient = new Ftp();
            // ftpClient.on( 'ready', function() {
            //     //ftpClient.cwd
            //     //res.send(JSON.stringify({"aaz":"aaz"})) //error not coming here
            //     ftpClient.mkdir('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/forms/", true, async (err) => {
            //         if (!err) {
            //             await ftpClient.put( data, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + '/forms/' + req.body['template_name'] + '.docx', function( err, list ) {
            //                 if ( err ) throw err;
            //                 ftpClient.end();     
            //                 console.log('word file uploaded')
            //                 //res.send(JSON.stringify({"OK": "OK"}))
            //             });
            //             await ftpClient.put( dataPDF, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + '/forms/' + req.body['template_name'] + '.pdf', function( err, list ) {
            //                 if ( err ) throw err;
            //                 ftpClient.end();     
            //                 console.log('pdf file uploaded')
            //                 res.send(JSON.stringify({"OK": "OK"}))
            //             });
            //         }
            //     });
            //     //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
            // });
            // ftpClient.connect( {
            //     'host': 'ftp.cwac.in',
            //     'user': 'cwacin',
            //     'password': '$Rv01111996'
            // } );
        }
        catch (error) {
            console.error(`ERROR Filling out Template:`);
            console.error(error)
        }
    } catch(error) {
        console.error(`ERROR Loading Template:`);
        console.error(error);
    }
});
app.get("/read_nace_ea_codes_table", (req, res) => {
    const readXlsxFile = require('read-excel-file/node')
    // File path.
    readXlsxFile('nace_ea_codes_table.xlsx').then((rows) => {
        //var lstPinCodes = rows.map(row => row[1]);
        var resList = rows.filter((row, idx) => {if (idx != 0) return row});
        resList = resList.map(row => {
            return {"scope": row[0], "ea_code": row[1], "nace_code": row[2]}
        });
        //res.send({"pincodes": lstPinCodes})
        console.log({"data": resList});
        res.send({"data": resList})
    })
})
//End of adding on 5-Apr-2022
app.listen(process.env.PORT || backendPort,()=>
{
    console.log("APP IS RUNNING AT " + backendPort)
})