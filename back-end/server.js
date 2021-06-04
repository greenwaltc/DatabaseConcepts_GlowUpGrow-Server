const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// setup express
const app = express();

// setup body parser middleware to convert to JSON and handle URL encoded forms
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// connect to the mongodb database
const password = "GlowUpGrow-2021";
const database = "GlowUpGrow";
const uri = "mongodb+srv://greenwaltc:" + password + "@cluster0.gxvag.mongodb.net/" + database + "?retryWrites=true&w=majority";
// uri for connecting to remote mongodb hosted on AWS and accessed through mongodb.com

mongoose.connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).catch(error => {
    console.log("Unable to connect to database");
    console.log(error);
});

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const cookieSession = require('cookie-session');
app.use(cookieSession({
    name: 'session',
    keys: [
        'secretValue'
    ],
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));


// import the module and setup API paths
const users = require("./users.js");
app.use("/api/users", users.routes);

const terrariums = require("./terrarium.js");
app.use("/api/terrarium", terrariums.routes);

app.listen(3000, () => console.log('Server listening on port 3000!'));