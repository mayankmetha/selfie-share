var express = require('express');
var helmet = require('helmet');
var bodyParser = require('body-parser');

var app = express();
app.use(helmet());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.put('/create/:user', (req,res) => {
    console.log("Created user: "+req.params.user);
    res.send("Created User: "+req.params.user+"\n");
    res.status(200);
});

app.delete('/delete/:user', (req,res) => {
    console.log("Deleted user: "+req.params.user);
    res.send("Deleted User: "+req.params.user+"\n");
    res.status(200);
});

app.get('/request/send/:from/:to', (req,res) => {
    console.log(req.params.from+" has sent a friend request to "+req.params.to);
    res.send(req.params.from+" has sent a friend request to "+req.params.to+"\n");
    res.status(200);
});

app.get('/request/confirm/:to/:from', (req, res) => {
    console.log(req.params.to+" has accepted friend request from "+req.params.from);
    res.send(req.params.to+" has accepted friend request from "+req.params.from+"\n");
    res.status(200);
});

app.listen(8080);