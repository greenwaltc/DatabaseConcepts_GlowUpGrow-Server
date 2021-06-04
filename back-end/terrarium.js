const express = require("express");
const mongoose = require('mongoose');
const argon2 = require("argon2");
const mongo = require('mongodb');

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
    // UserID: String,
    // ModelID: String,
    // PlantID: String,
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

// Creates a new terrarium and assigns it to a user. By default, the live terrarium is empty and all values are set to 0.
router.post("/new", async (req, res) => {
    // Check request parameters
    if(!req.body.UserID || !req.body.ModelID) {
        return res.status(400).send({
            message: "Error: Please provide the required fields."
        });
    }

    console.log("Adding new live terrarium");
    console.log("userID: " + req.body.UserID);
    console.log("ModelID: " + req.body.ModelID);

    let user = await User.findOne({
        _id: mongo.ObjectId(req.body.UserID)
    });
    let model = await TerrariumModel.findOne({
        ModelID: req.body.ModelID
    });
    let plant = await Plant.findOne({
        Name: "Empty"
    });
    if (!plant) {
        plant = new Plant({
            Name: "Empty",
            Temperature: 0.0,
            SoilMoisture: 0.0,
            Humidity: 0.0,
            LightLevel: 0.0,
            GrowthTimeDays: 0,
            SpaceRequirement: 0.0
        });
        try {
            await plant.save();
        } catch (error) {
            console.log(error);
            return res.sendStatus(500).send({
                Message: "Error: Internal server error",
                Success: false
            });
        }
    }

    // Check to make sure that objects were found
    if (!user) {
        res.statusCode = 400;
        return res.send({
            Message: "Error: user not found",
            Success: false
        });
    }
    if (!model) {
        res.statusCode = 400;
        return res.send({
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
        return res.send({
            Success: true
        });
    } catch (error) {
        console.log(error);
        res.statusCode = 500;
        return res.send({
            Message: "Error: Internal server error",
            Success: false
        });
    }
});

router.put("/plant", async (req, res) => {
    // check parameters
    if (!req.body.TerrariumID || !req.body.PlantID) {
        res.statusCode = 400;
        return res.send({
            Message: "Error: Please provide the required fields.",
            Success: false
        });
    }

    let terrarium = await LiveTerrarium.findOne({
        _id: req.body.TerrariumID
    });

    // check it exists
    if (!terrarium) {
        res.statusCode = 400;
        return res.send({
            Message: "Error: No terrarium with matching ID",
            Success: false
        });
    }

    let plant = await Plant.findOne({
        _id: req.body.PlantID
    })

    // check it exists
    if (!plant) {
        res.statusCode = 400;
        return res.send({
            Message: "Error: No plant with matching ID",
            Success: false
        });
    }

    // update plant
    terrarium.Plant = plant;

    try {
        await terrarium.save();
        res.send({
            Plant: plant,
            Success: true
        });
    } catch (error) {
        console.log(error);
        res.statusCode = 500;
        return res.send({
            Message: "Error: Internal server error",
            Success: false
        });
    }
});

router.get("/", async (req, res) => {
    // check parameters
    if (!req.body.UserID) {
        res.statusCode = 400;
        return res.send({
            Message: "Error: Username missing from request",
            Success: false
        });
    }

    // find user
    let user = await User.findOne({
        _id: req.body.UserID
    });

    // check it exists
    if(!user) {
        res.statusCode = 400;
        return res.send({
            Message: "Error: User does not exist",
            Success: false
        });
    }

    let terrariums = await LiveTerrarium.find({
        User: user
    });

    let response = {
        LiveTerrariums: terrariums,
        Success: true
    }

    res.send(response);
});

router.get("/single", async (req, res) => {
    // check parameters
    if (!req.body.TerrariumID) {
        res.statusCode = 400;
        return res.send({
            Message: "Error: Username missing from request",
            Success: false
        });
    }

    let terrarium = await LiveTerrarium.findOne({
        _id: req.body.TerrariumID
    });

    let response = {
        Terrarium: terrarium,
        Success: true
    }

    res.send(response);
});

module.exports = {
    routes: router,
    model: LiveTerrarium,
    valid: validUser
};