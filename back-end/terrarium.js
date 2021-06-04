const express = require("express");
const mongoose = require('mongoose');
const argon2 = require("argon2");

const router = express.Router();

const users = require("./users.js"); // Gets the user schema and model
const User = users.model;
const validUser = users.valid;

//
// Terrarium schema and model
//

// this is the terrarium model schema. Terrarium models have a modelID and space available (in sq ft).
const terrariumModelSchema = new mongoose.Schema({
    ModelID: Number,
    SpaceAvailable: Number
});

// create a User model from the User schema
const TerrariumModel = mongoose.model('TerrariumModel', terrariumModelSchema);

// schema for a plant 
const plantSchema = new mongoose.Schema({
    Name: String,
    Temperature: Number,
    SoilMoisture: Number,
    Humidity: Number,
    LightLevel: Number,
    GrowthTimeDays: Number,
    SpaceRequirement: Number
});

// Plant model from the plant schema
const Plant = mongoose.model('Plant', plantSchema);

// this is the live terrarium model schema. Live terrariums have a user, model, plant, current temperature, soil moisture, humidity, light level, and days grown
const liveTerrariumSchema = new mongoose.Schema({
    User: {
        type: mongoose.Schema.ObjectId,
        ref: 'User' // Might break
    },
    Model: {
        type: mongoose.Schema.ObjectId,
        ref: 'Model'
    },
    Plant: {
        type: mongoose.Schema.ObjectId,
        ref: 'Plant'
    },
    Temperature: Number,
    SoilMoisture: Number,
    Humidity: Number,
    LightLevel: Number,
    DaysGrown: Number
});

// Live terrarium model made from schema
const LiveTerrarium = mongoose.model('LiveTerrarium', liveTerrariumSchema);

/* API Endpoints */

/* All of these endpoints start with "/" here, but will be configured by the
   module that imports this one to use a complete path, such as "/api/terrarium" */

router.post("/new", async (req, res) => {

    // Check request parameters
    if(!req.body.UserID || !req.body.ModelID) {
        return res.status(400).send({
            message: "Please provide the required fields."
        });
    }

    let user = User.findOne({
        _id: req.body.UserID
    });
    let model = TerrariumModel.findOne({
        ModelID: req.body.ModelID
    });
    let plant = new Plant({
        _id: 1, // might give us issues
        Name: "Empty",
        Temperature: 0.0,
        SoilMoisture: 0.0,
        Humidity: 0.0,
        LightLevel: 0.0,
        GrowthTimeDays: 0,
        SpaceRequirement: 0.0
    });

    // Check to make sure that objects were found
    if (!user) {
        return res.sendStatus(400).send({
            Message: "Error: user not found",
            Success: false
        });
    }
    if (!model) {
        return res.sendStatus(400).send({
            Message: "Error: terrarium model not found",
            Success: false
        });
    }

    // make the live terrarium object
    let liveTerrarium = new LiveTerrarium({
        User: user,
        Model: model,
        Plant: plant,
        Temperature: 0.0,
        SoilMoisture: 0.0,
        Humidity: 0.0,
        LightLevel: 0.0,
        DaysGrown: 0
    });

    try {
        await liveTerrarium.save();
        return res.sendStatus(200).send({
            Success: true
        });
    } catch (error) {
        return res.sendStatus(500).send({
            Message: "Error: Internal server error",
            Success: false
        })
    }
});


module.exports = {
    routes: router,
    model: LiveTerrarium,
    valid: validUser
};