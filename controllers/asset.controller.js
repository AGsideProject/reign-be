const { Asset } = require("../models");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const multer = require("multer");

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

class AssetController {
  // Static method to create a new asset
  static async createAsset(req, res, next) {
    try {
      const { type, order, model_id } = req.body;

      // Check if a file is provided
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // Upload the file to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      // Create the asset in the database
      await Asset.create({
        img_url: result.secure_url,
        type,
        order,
        model_id,
      });

      return res.status(201).json({
        message: "Asset created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to delete an asset
  static async deleteAsset(req, res, next) {
    try {
      const { id } = req.params;

      // Find the asset by ID
      const asset = await Asset.findByPk(id);

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Optionally delete the image from Cloudinary
      const publicId = asset.img_url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);

      // Delete the asset from the database
      await asset.destroy();

      return res.status(200).json({ message: "Asset deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { AssetController, upload };
