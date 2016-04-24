/*
    author : sandeep.mogla@gmail.com
*/
var express = require('express');
var fs = require("fs");
var mongodb = require('mongodb');
var multer = require('multer');
var path = require('path');
var csv = require('fast-csv')

// Retrieve
var mgoClient = mongodb.MongoClient;

//multer uploader
var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');

//var upload = multer({
//    dest: 'uploads/'
//})

// initialize the express module
var app = express();
app.use(express.static(path.join(__dirname, 'public')));


var colVessels;

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

// Connect to the db
mgoClient.connect("mongodb://localhost:27017/vesselsDB", function (err, db) {
    if (!err) {
        console.log("database is connected");
        colVessels = db.collection('vessels');
    }
})

app.get('/api/listVassels', function (req, res) {
    colVessels.find({}, {
        limit: 500,
        sort: [['_id', -1]]
    }).toArray(function (e, results) {
        if (e) return next(e)
        res.send(results)
    })
});

app.get('/api/addVassels', function (req, res) {

});

/** API path that will upload the files */
app.post('/api/upload', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.json({
                error_code: 1,
                err_desc: err
            });
            return;
        }
        if (!req.file) {
            return
        }
        console.log(req.file.path);

        var stream = fs.createReadStream(req.file.path);
        var ind = 0;
        var fields;
        var obj = new Object();
        var allObjs = [];
        var csvStream = csv()
            .on("data", function (data) {
                if (ind == 0) {
                    fields = data;
                    for (var d in data) {
                        fields[d] = String(data[d]).replace(/ /g, "_");
                        fields[d] = fields[d].toLocaleLowerCase();
                    }
                } else {
                    for (var m in fields) {
                        var _field = fields[m]
                        obj[_field] = data[m]
                    }
                    allObjs.push(obj);
                    obj = new Object();
                }
                ind++;
            })
            .on("end", function () {
                // Initialize the Ordered Batch
                var batch = colVessels.initializeOrderedBulkOp()

                for (var a in allObjs) {
                    batch.insert(allObjs[a]);
                }

                // Execute the operations
                batch.execute({
                    w: "majority",
                    wtimeout: 5000
                });

                console.log(req.file.path + "import to database done");
            });

        stream.pipe(csvStream);

        res.json({
            error_code: 0,
            err_desc: null
        });
    })

});


var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("listening at http://%s:%s", host, port);
});
