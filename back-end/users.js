const express = require("express");
const mongoose = require('mongoose');
const argon2 = require("argon2");

const router = express.Router();

//
// User schema and model
//

// this is the schema. Users have usernames and passwords. We solemnly promise to
// salt an dhash the password!
const userSchema = new mongoose.Schema({
    Username: String,
    Password: String,
    EmailAddress: String,
});

// This is a hook that will be called before a user record is saved,
// allowing use to be sure to salt and hash the password first
userSchema.pre('save', async function (next) {
    // only hash the password if it has been modified (or is new)
    if (!this.isModified('Password'))
        return next();

    try {
        // generate a hash. argon2 does the salting and hashing for us
        const hash = await argon2.hash(this.Password);
        //override the plaintext password with the hashed one
        this.Password = hash;
        next();
    } catch (e) {
        console.log(e);
        next(e);
    }
});

// This is a method that we can call on User objects to compare the hash of the
// password the browser sends with the has of the user's true password stored in
// the database.
userSchema.methods.comparePassword = async function (Password) {
    try {
        // note that we supply the hash stored in the database (first argument) and 
        // the plaintext password. argon2 will do the hashing and salting and
        // comparison for us.
        const isMatch = await argon2.verify(this.Password, Password);
        return isMatch;
    } catch (e) {
        return false;
    }
}

// This is a method that will be called automatically any time we convert a user
// object to JSON. It deletes the password hash from the object. This ensures
// that we never send password hashes over our API, to avoid giving away
// anything to an attacker.
userSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.Password;
    return obj;
}

// create a User model from the User schema
const User = mongoose.model('User', userSchema);

/* Middleware */

// middleware function to check for logged-in users
const validUser = async (req, res, next) => {
    if (!req.session.userID)
        return res.status(403).send({
            message: "not logged in"
        });
    try {
        const user = await User.findOne({
            _id: req.session.userID
        });
        if (!user) {
            return res.status(403).send({
                message: "not logged in"
            });
        }
        // set the user field in the request
        req.user = user;
    } catch (e) {
        // Return an error if user does not exist.
        return res.status(403).send({
            message: "not logged in"
        });
    }

    // If everything succeeds, move to the next middleware
    next();
}

/* API Endpoints */

/* All of these endpoints start with "/" here, but will be configured by the
   module that imports this one to use a complete path, such as "/api/user" */

// create a new user
router.post('/register', async (req, res) => {
    // Make sure that the form coming from the browser includes all required fields,
    // otherwise return an error. A 400 error means the request was
    // malformed.

    console.log("Registering new user");
    console.log(req.body);

    if (!req.body.Username || !req.body.Password || !req.body.EmailAddress)
        return res.status(400).send({
            Message: "Error: Username, Password, and Email Address are required",
            Success: false
        });

    try {

        //  Check to see if username already exists and if not send a 403 error. A 403
        // error means permission denied.
        console.log("finding existing user");
        const existingUser = await User.findOne({
            Username: req.body.Username
        });
        console.log("Existing user:");
        console.log(existingUser);
        if (existingUser)
            return res.status(403).send({
                Message: "Error: username already exists",
                Success: false
            });

        // create a new user and save it to the database
        const user = new User({
            Username: req.body.Username,
            Password: req.body.Password,
            EmailAddress: req.body.EmailAddress
        });
        console.log("Before saving user");
        await user.save();
        // set user session info
        req.session.userID = user._id;

        // send back a 200 OK response, along with the user that was created
        let response = {
            _id: user._id,
            Username: user.Username,
            Success: true
        }
        console.log("Before send");
        return res.send(response);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500).send({
            Message: "Error: Internal server error",
            Success: false
        });
    }
});

// login a user
router.post('/login', async (req, res) => {
    // Make sure that the form coming from the browser includes a username and a
    // password, otherwise return an error.
    if (!req.body.Username || !req.body.Password)
        return res.sendStatus(400).send({
            Message: "Error: Username and Password required",
            Success: false
        });

    try {
        //  lookup user record
        const user = await User.findOne({
            Username: req.body.Username
        });
        // Return an error if user does not exist.
        if (!user)
            return res.status(403).send({
                Message: "Error: Username or Password is incorrect",
                Success: false
            });

        // Return the SAME error if the password is wrong. This ensure we don't
        // leak any information about which users exist.
        if (!await user.comparePassword(req.body.Password))
            return res.status(403).send({
                Message: "Error: Username or Password is incorrect",
                Success: false
            });

        // set user session info
        req.session.userID = user._id;

        return res.send({
            _id: user._id,
            Username: user.Username,
            Success: true
        });

    } catch (error) {
        console.log(error);
        return res.sendStatus(500).send({
            Message: "Error: Internal server error",
            Success: false
        });
    }
});

// get logged in user
router.get('/', validUser, async (req, res) => {
    try {
        res.send({
            user: req.user
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

// get a single user
router.get('/:id', async (req, res) => {
    try {
        let user = await User.findOne({
            _id: req.params.id
        });
        return res.send(user);
    } catch(e) {
        console.log(e);
        return res.sendStatus(500);
    }
});

// get logged in user
router.get('/:id', async (req, res) => {
    try {
        let user = await User.findOne({
            _id: req.params.id
        });
        res.send(user);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

// logoutq45w
router.delete("/", validUser, async (req, res) => {
    try {
        req.session = null;
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

module.exports = {
    routes: router,
    model: User,
    valid: validUser
};