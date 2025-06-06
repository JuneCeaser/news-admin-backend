const express = require("express");
const { 
  getAllUsers, 
  deleteUser,
  toggleSubscription
} = require("../controllers/userController");
const router = express.Router();

// Public routes (no auth as requested)
router.get("/", getAllUsers);
router.delete("/:id", deleteUser);
router.patch("/:id/toggle-subscription", toggleSubscription);

module.exports = router;