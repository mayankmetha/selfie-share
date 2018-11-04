var express = require('express');
var helmet = require('helmet');
var bodyParser = require('body-parser');
var publicIp = require('public-ip');

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var app = express();
app.use(helmet());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.put('/:user', (req,res) => {
    if(!fs.existsSync(path.join(__dirname+"/../out/"+req.params.user))) {
        fs.mkdirSync(path.join(__dirname+"/../out/"+req.params.user));
        fs.mkdirSync(path.join(__dirname+"/../out/"+req.params.user+"/friends"));
        fs.mkdirSync(path.join(__dirname+"/../out/"+req.params.user+"/photos"));
        fs.mkdirSync(path.join(__dirname+"/../out/"+req.params.user+"/request"));
        fs.mkdirSync(path.join(__dirname+"/../out/"+req.params.user+"/shared"));
        console.log("Welcome to selfie-share "+req.params.user);
        res.send("Welcome to selfie-share "+req.params.user+"\n");
        res.status(200);
    } else {
        console.log(req.params.user+" exists");
        res.send(req.params.user+" exists\n");
        res.status(404);
    }
});

//TODO: delete logic
app.delete('/:user', (req,res) => {
    if(fs.existsSync(path.join(__dirname+"/../out/"+req.params.user))) {
        fs.readdirSync(path.join(__dirname+"/../out/"+req.params.user+"/friends/")).forEach((file) => {
            fs.unlinkSync(path.join(__dirname+"/../out/"+file+"/friends/"+req.params.user));
            fs.unlinkSync(path.join(__dirname+"/../out/"+req.params.user+"/friends/"+file));
        });
        var sh = "rm -rf "+path.join(__dirname+'/../out/'+req.params.user);
        childProcess.execSync(sh, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }
            console.log(stdout);
        });
        console.log("Farewell "+req.params.user);
        res.send("Farewell "+req.params.user+"\n");
        res.status(200);
    } else {
        console.log(req.params.user+" is immortal");
        res.send(req.params.user+" is immortal\n");
        res.status(404);
    }
});

app.get('/request/send/:from/:to', (req,res) => {
    if(req.params.from != req.params.to) {
        if(fs.existsSync(path.join(__dirname+"/../out/"+req.params.from))) {
            if(fs.existsSync(path.join(__dirname+"/../out/"+req.params.to))) {
                if((!fs.existsSync(path.join(__dirname+"/../out/"+req.params.to+"/friend/"+req.params.from)))&&(!fs.existsSync(path.join(__dirname+"/../out/"+req.params.from+"/friend/"+req.params.to)))) {
                    fs.symlinkSync(path.join(__dirname+"/../out/"+req.params.from),path.join(__dirname+"/../out/"+req.params.to+"/request/"+req.params.from));
                    console.log(req.params.from+" has sent a friend request to "+req.params.to);
                    res.send(req.params.from+" has sent a friend request to "+req.params.to+"\n");
                    res.status(200);
                } else {
                    console.log(req.params.from+" can't request a friend again");
                    res.send(req.params.from+" can't request a friend again\n");
                    res.status(404);
                }
            } else {
                console.log(req.params.to+" doesn't seem to exist");
                res.send(req.params.to+" doesn't seem to exist\n");
                res.status(404);
            }
        } else {
            console.log(req.params.from+" doesn't seem to exist");
            res.send(req.params.from+" doesn't seem to exist\n");
            res.status(404);
        }
    } else {
        console.log(req.params.from+" please don't!");
        res.send(req.params.from+" please don't!\n");
        res.status(403);
    }
});

app.get('/request/confirm/:to/:from', (req, res) => {
    if(req.params.from != req.params.to) {
        if(fs.existsSync(path.join(__dirname+"/../out/"+req.params.to))) {
            if(fs.existsSync(path.join(__dirname+"/../out/"+req.params.from))) {
                if((!fs.existsSync(path.join(__dirname+"/../out/"+req.params.to+"/friend/"+req.params.from)))&&(!fs.existsSync(path.join(__dirname+"/../out/"+req.params.from+"/friend/"+req.params.to)))) {
                    if(fs.existsSync(path.join(__dirname+"/../out/"+req.params.to+"/request/"+req.params.from))) {
                        fs.symlinkSync(path.join(__dirname+"/../out/"+req.params.to),path.join(__dirname+"/../out/"+req.params.from+"/friends/"+req.params.to));
                        fs.symlinkSync(path.join(__dirname+"/../out/"+req.params.from),path.join(__dirname+"/../out/"+req.params.to+"/friends/"+req.params.from));
                        fs.unlinkSync(path.join(__dirname+"/../out/"+req.params.to+"/request/"+req.params.from))
                        console.log(req.params.from+" and "+req.params.to+" are now friends");
                        res.send(req.params.from+" and "+req.params.to+" are now friends\n");
                        res.status(200);
                    } else {
                        console.log(req.params.to+" please send a request to "+req.params.from);
                        res.send(req.params.to+" please send a request to "+req.params.from+"\n");
                        res.status(404);
                    }
                } else {
                    console.log(req.params.from+" can't accept request from an existing friend again");
                    res.send(req.params.from+" can't accept request from an existing friend again\n");
                    res.status(404);
                }
            } else {
                console.log(req.params.from+" doesn't seem to exist");
                res.send(req.params.from+" doesn't seem to exist\n");
                res.status(404);
            }
        } else {
            console.log(req.params.to+" doesn't seem to exist");
            res.send(req.params.to+" doesn't seem to exist\n");
            res.status(404);
        }
    } else {
        console.log(req.params.from+" please don't!");
        res.send(req.params.from+" please don't!\n");
        res.status(403);
    }
});

app.listen(8080,() => {
    publicIp.v4().then(ip => {
        console.log("Public server started at "+ip+":8080");
        console.log("Local server started at localhost:8080");
    });
    if(!fs.existsSync(path.join(__dirname+"/../out"))) {
        fs.mkdirSync(path.join(__dirname+"/../out"));
    }
});