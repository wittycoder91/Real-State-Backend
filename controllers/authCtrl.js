const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  getUserCollection,
  getAdminCollection,
} = require("../helpers/db-conn");

const AuthCtrl = () => {
  const checkExist = async (email) => {
    const collection = getUserCollection();
    const user = await collection.findOne({ email: email });
    if (user) return user;
    return false;
  };
  const checkAdminExist = async (userid) => {
    const collection = getAdminCollection();
    
    const user = await collection.findOne({ userid: userid });
    if (user) return user;
    return false;
  };

  // Admin Login
  const adminLogin = async (userId, password) => {
    const collection = getAdminCollection();

    if (!(await checkAdminExist(userId))) {
      return { success: false, message: "User doesn't exists in the database" };
    }

    const user = await collection.findOne({ userid: userId });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return { success: false, message: "Invalid userId or password" };
      }

      // const token = await user.generateAuthtoken();
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      return {
        success: true,
        message: "Logged in successfully",
        token: token,
        user: user,
      };
    } else {
      return { success: false, message: "User doesn't exists" };
    }
  };

  return {
    adminLogin,
    checkExist,
  };
};

module.exports = AuthCtrl();
