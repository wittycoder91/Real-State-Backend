require("dotenv").config();
const express = require("express");
const auth = express.Router();
const authCtrl = require("../../controllers/authCtrl");

// Admin Login
auth.post("/admin/login", async (req, res) => {
  try {
    const data = req.body;
    const userId = data.userId;
    const password = data.password;
    res.send(await authCtrl.adminLogin(userId, password));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

module.exports = auth;
