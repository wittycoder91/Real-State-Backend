const express = require("express");
const router = express.Router();
const { 
  addRealEstate, 
  getAllRealEstate, 
  getActiveRealEstate,
  getRealEstateById, 
  updateRealEstateStatus, 
  deleteRealEstate 
} = require("../../controllers/realEstateCtrl");

router.post("/add", addRealEstate);
router.get("/all", getAllRealEstate);
router.get("/active", getActiveRealEstate);
router.get("/:id", getRealEstateById);
router.post("/:id", updateRealEstateStatus);
router.delete("/:id", deleteRealEstate);

module.exports = router;
