const express = require("express");
const router = express.Router();
const { 
  addRealEstate, 
  getAllRealEstate, 
  getActiveRealEstate,
  getRealEstateById, 
  updateRealEstateStatus, 
  deleteRealEstate,
  addContact,
  getAllContacts,
  updateContactStatus,
  getContactById,
  deleteContact
} = require("../../controllers/realEstateCtrl");

router.post("/add", addRealEstate);
router.get("/all", getAllRealEstate);
router.get("/active", getActiveRealEstate);

// Contact-specific routes (must come before /:id routes)
router.post("/contact", addContact);
router.get("/contacts", getAllContacts);
router.post("/contacts/:id", updateContactStatus);
router.get("/contacts/:id", getContactById);
router.delete("/contacts/:id", deleteContact);

// Real estate-specific routes with ID (must come after specific routes)
router.get("/:id", getRealEstateById);
router.post("/:id", updateRealEstateStatus);
router.delete("/:id", deleteRealEstate);

module.exports = router;
