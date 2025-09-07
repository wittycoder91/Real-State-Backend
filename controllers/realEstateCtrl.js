const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const { getRealEstateCollection, getContactCollection } = require("../helpers/db-conn");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/realestate";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Middleware for handling multiple image uploads
const uploadMultipleImages = upload.array("images", 10);

// Configure multer for contact image uploads (students folder)
const contactStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/students";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure multer for contact uploads
const contactUpload = multer({
  storage: contactStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Middleware for handling contact image uploads
const uploadContactImages = contactUpload.array("images", 10);

// Add real estate property
const addRealEstate = async (req, res) => {
  try {
    uploadMultipleImages(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "File upload error: " + err.message,
        });
      }

      try {
        const {
          userEmail,
          address,
          propertyType,
          bedrooms,
          bathrooms,
          squareFootage,
          price,
          description,
        } = req.body;

        // Validate required fields
        if (!userEmail || !address || !propertyType || !price) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields: userEmail, address, propertyType, and price are required",
          });
        }

        // Process uploaded images
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            const imageUrl = `/uploads/realestate/${file.filename}`;
            imageUrls.push(imageUrl);
          });
        }

        // Create real estate document
        const realEstateData = {
          userEmail,
          address,
          propertyType,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          squareFootage: squareFootage ? parseInt(squareFootage) : null,
          price: parseFloat(price),
          description: description || "",
          images: imageUrls,
          status: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save to database
        const realEstateCollection = getRealEstateCollection();
        const result = await realEstateCollection.insertOne(realEstateData);

        if (result.insertedId) {
          res.status(201).json({
            success: true,
            message: "Real estate property added successfully",
            data: {
              id: result.insertedId,
              ...realEstateData,
            },
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to save real estate property",
          });
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        res.status(500).json({
          success: false,
          message: "Database error occurred",
        });
      }
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all real estate properties
const getAllRealEstate = async (req, res) => {
  try {
    const realEstateCollection = getRealEstateCollection();
    const properties = await realEstateCollection.find({}).toArray();

    res.status(200).json({
      success: true,
      message: "Real estate properties retrieved successfully",
      data: properties,
    });
  } catch (error) {
    console.error("Error retrieving real estate properties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve real estate properties",
    });
  }
};

// Get all real estate properties with status true
const getActiveRealEstate = async (req, res) => {
  try {
    const realEstateCollection = getRealEstateCollection();
    const properties = await realEstateCollection.find({ status: true }).toArray();

    res.status(200).json({
      success: true,
      message: "Active real estate properties retrieved successfully",
      data: properties,
    });
  } catch (error) {
    console.error("Error retrieving active real estate properties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve active real estate properties",
    });
  }
};

// Get real estate property by ID
const getRealEstateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format",
      });
    }

    const realEstateCollection = getRealEstateCollection();
    
    let property;
    try {
      property = await realEstateCollection.findOne({ _id: new ObjectId(id) });
    } catch (objectIdError) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format",
      });
    }

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Real estate property not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Real estate property retrieved successfully",
      data: property,
    });
  } catch (error) {
    console.error("Error retrieving real estate property:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve real estate property",
    });
  }
};

// Update real estate property status
const updateRealEstateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format",
      });
    }

    // Validate status
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Status must be a boolean value (true or false)",
      });
    }

    const realEstateCollection = getRealEstateCollection();    
    let result;
    try {
      result = await realEstateCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: status,
            updatedAt: new Date()
          }
        }
      );
    } catch (objectIdError) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format",
      });
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Real estate property not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Real estate property status updated successfully",
      data: {
        id: id,
        status: status,
        updatedAt: new Date()
      },
    });
  } catch (error) {
    console.error("Error updating real estate property status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update real estate property status",
    });
  }
};

// Delete real estate property
const deleteRealEstate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format",
      });
    }

    const realEstateCollection = getRealEstateCollection();
    
    let property;
    try {
      property = await realEstateCollection.findOne({ _id: new ObjectId(id) });
    } catch (objectIdError) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format",
      });
    }

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Real estate property not found",
      });
    }

    // Delete associated image files
    if (property.images && property.images.length > 0) {
      property.images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "..", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
    const result = await realEstateCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Real estate property not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Real estate property deleted successfully",
      data: {
        id: id,
        deletedAt: new Date()
      },
    });
  } catch (error) {
    console.error("Error deleting real estate property:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete real estate property",
    });
  }
};

// Add contact inquiry
const addContact = async (req, res) => {
  try {
    uploadContactImages(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "File upload error: " + err.message,
        });
      }

      try {
        const { userName, email, university, realEstateId } = req.body;

        // Validate required fields
        if (!userName || !email || !university || !realEstateId) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields: userName, email, university, and realEstateId are required",
          });
        }

        // Validate realEstateId format
        if (!realEstateId || realEstateId.length !== 24) {
          return res.status(400).json({
            success: false,
            message: "Invalid realEstateId format",
          });
        }

        // Check if contact already exists with same email and realEstateId
        const contactCollection = getContactCollection();
        const existingContact = await contactCollection.findOne({
          email: email,
          realEstateId: realEstateId
        });

        if (existingContact) {
          return res.status(409).json({
            success: false,
            message: "You have already send message, please wait",
          });
        }

        // Process uploaded images
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            // Save only the relative path
            const imageUrl = `/uploads/students/${file.filename}`;
            imageUrls.push(imageUrl);
          });
        }

        // Create contact document
        const contactData = {
          userName,
          email,
          university,
          realEstateId,
          images: imageUrls,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save to database
        const result = await contactCollection.insertOne(contactData);

        if (result.insertedId) {
          res.status(201).json({
            success: true,
            message: "Contact inquiry submitted successfully",
            data: {
              id: result.insertedId,
              ...contactData,
            },
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to save contact inquiry",
          });
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        res.status(500).json({
          success: false,
          message: "Database error occurred",
        });
      }
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all contact inquiries with real estate details using aggregation
const getAllContacts = async (req, res) => {
  try {
    console.log("getAllContacts");
    const contactCollection = getContactCollection();
    
    // Use aggregation with $lookup to join contacts and real estate collections
    const contactsWithDetails = await contactCollection.aggregate([
      {
        $addFields: {
          // Convert realEstateId to ObjectId for proper lookup
          realEstateObjectId: {
            $toObjectId: "$realEstateId"
          }
        }
      },
      {
        $lookup: {
          from: "realestate",
          localField: "realEstateObjectId",
          foreignField: "_id",
          as: "realEstateDetails"
        }
      },
      {
        $addFields: {
          // Convert the array to a single object (since we expect one match)
          realEstateDetails: {
            $cond: {
              if: { $gt: [{ $size: "$realEstateDetails" }, 0] },
              then: { $arrayElemAt: ["$realEstateDetails", 0] },
              else: null
            }
          }
        }
      },
      {
        $project: {
          realEstateObjectId: 0 // Remove the temporary field
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    res.status(200).json({
      success: true,
      message: "Contact inquiries retrieved successfully",
      data: contactsWithDetails,
    });
  } catch (error) {
    console.error("Error retrieving contact inquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact inquiries",
    });
  }
};

// Update contact status
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID format",
      });
    }

    // Validate status
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Status must be a boolean value (true or false)",
      });
    }

    const contactCollection = getContactCollection();
    
    let result;
    try {
      result = await contactCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: status,
            updatedAt: new Date()
          }
        }
      );
    } catch (objectIdError) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID format",
      });
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact inquiry status updated successfully",
      data: {
        id: id,
        status: status,
        updatedAt: new Date()
      },
    });
  } catch (error) {
    console.error("Error updating contact inquiry status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact inquiry status",
    });
  }
};

// Get contact by ID with real estate details using aggregation
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID format",
      });
    }

    const contactCollection = getContactCollection();
    
    let contactWithDetails;
    try {
      // Use aggregation with $lookup to join contacts and real estate collections
      const result = await contactCollection.aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $addFields: {
            // Convert realEstateId to ObjectId for proper lookup
            realEstateObjectId: {
              $toObjectId: "$realEstateId"
            }
          }
        },
        {
          $lookup: {
            from: "realestate",
            localField: "realEstateObjectId",
            foreignField: "_id",
            as: "realEstateDetails"
          }
        },
        {
          $addFields: {
            // Convert the array to a single object (since we expect one match)
            realEstateDetails: {
              $cond: {
                if: { $gt: [{ $size: "$realEstateDetails" }, 0] },
                then: { $arrayElemAt: ["$realEstateDetails", 0] },
                else: null
              }
            }
          }
        },
        {
          $project: {
            realEstateObjectId: 0 // Remove the temporary field
          }
        }
      ]).toArray();

      contactWithDetails = result[0];
    } catch (objectIdError) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID format",
      });
    }

    if (!contactWithDetails) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact inquiry retrieved successfully",
      data: contactWithDetails,
    });
  } catch (error) {
    console.error("Error retrieving contact inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact inquiry",
    });
  }
};

// Delete contact inquiry
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID format",
      });
    }

    const contactCollection = getContactCollection();
    
    // First, get the contact to delete associated images
    let contact;
    try {
      contact = await contactCollection.findOne({ _id: new ObjectId(id) });
    } catch (objectIdError) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID format",
      });
    }

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    // Delete associated image files
    if (contact.images && contact.images.length > 0) {
      contact.images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "..", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // Delete from database
    const result = await contactCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact inquiry deleted successfully",
      data: {
        id: id,
        deletedAt: new Date()
      },
    });
  } catch (error) {
    console.error("Error deleting contact inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact inquiry",
    });
  }
};

module.exports = {
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
  deleteContact,
};
