const express = require("express");
const publicRouter = express.Router();
const auth = require("./auth.js");
const realEstate = require("./realEstate.js");

publicRouter.use("/auth", auth);
publicRouter.use("/real-estate", realEstate);

module.exports = publicRouter;
