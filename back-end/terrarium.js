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
const Terrarium = mongoose.model('TerrariumModel', terrariumModelSchema);

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
   module that imports this one to use a complete path, such as "/api/user" */


module.exports = {
    routes: router,
    model: LiveTerrarium,
    valid: validUser
};