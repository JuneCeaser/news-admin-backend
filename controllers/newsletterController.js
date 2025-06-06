const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
const sendEmail = require("../config/nodemailer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createNewsletter = async (req, res) => {
  try {
    const { subject, description } = req.body;

    let imageUrl = "";
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "newsletters" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const newNewsletter = new Newsletter({
      subject,
      description,
      imageUrl,
    });

    await newNewsletter.save();

    // Only fetch subscribed users
    const users = await User.find({ isSubscribed: true }, "email");
    console.log(`Sending to ${users.length} subscribed users`);

    const emailContent = `
      <h1>${subject}</h1>
      <p>${description}</p>
      ${imageUrl ? `<img src="${imageUrl}" alt="Newsletter Image" style="max-width: 100%;" />` : ""}
    `;

    const emailPromises = users.map((user) =>
      sendEmail(user.email, subject, emailContent).catch((error) => {
        console.error(`Failed to send to ${user.email}:`, error);
      })
    );

    await Promise.all(emailPromises);

    res.status(201).json({
      message: `Newsletter sent to ${users.length} subscribers`,
      newsletter: newNewsletter,
      recipientsCount: users.length
    });
  } catch (error) {
    console.error("Error creating newsletter:", error);
    res.status(500).json({
      message: "Error creating newsletter",
      error: error.message,
    });
  }
};

// Get all newsletters with pagination
const getNewsletters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const newsletters = await Newsletter.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCount = await Newsletter.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      newsletters,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    res.status(500).json({
      message: "Error fetching newsletters",
      error: error.message,
    });
  }
};

// Delete a newsletter
const deleteNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    if (newsletter.imageUrl) {
      const publicId = newsletter.imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Newsletter.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Newsletter deleted successfully" });
  } catch (error) {
    console.error("Error deleting newsletter:", error);
    res.status(500).json({
      message: "Error deleting newsletter",
      error: error.message,
    });
  }
};

module.exports = { createNewsletter, getNewsletters, deleteNewsletter };