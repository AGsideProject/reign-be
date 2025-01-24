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

  // Static method to list assets by model_id with optional status filtering
  static async listAssets(req, res, next) {
    try {
      const { model_id } = req.params;
      const { status } = req.query;

      // Validate model_id
      if (!model_id) {
        return res.status(400).json({ message: "model_id is required" });
      }

      // Define the base query
      const query = {
        where: { model_id },
      };

      // Add status filter if provided
      if (status) {
        if (status !== "active" && status !== "inactive") {
          return res.status(400).json({
            message: "Invalid status. Status must be 'active' or 'inactive'.",
          });
        }
        query.where.status = status;
      }

      // Fetch assets based on the query
      const assets = await Asset.findAll(query);

      return res.status(200).json({
        message: "success",
        data: assets,
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to update the status of an asset
  static async updateAssetStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({
          message: "Invalid status. Status must be 'active' or 'inactive'.",
        });
      }

      // Find the asset by ID
      const asset = await Asset.findByPk(id);

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Update the asset's status
      await asset.update({ status });

      return res.status(200).json({
        message: "Asset status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to update the ordering of a single asset
  static async updateAssetOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { order } = req.body;

      // Validate order
      if (typeof order !== "number" || order < 0) {
        return res.status(400).json({
          message: "Invalid order. Order must be a non-negative number.",
        });
      }

      // Find the asset by ID
      const asset = await Asset.findByPk(id);

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Update the asset's order
      await asset.update({ order });

      return res.status(200).json({
        message: "Asset order updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to bulk update the ordering of multiple assets
  static async bulkUpdateAssetOrder(req, res, next) {
    try {
      const { assets } = req.body;

      // Validate the input
      if (!Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({
          message:
            "Invalid input. Expected an array of assets with id and order.",
        });
      }

      // Update each asset's order
      for (const { id, order } of assets) {
        const asset = await Asset.findByPk(id);

        if (!asset) {
          return res
            .status(404)
            .json({ message: `Asset with ID ${id} not found` });
        }

        await asset.update({ order });
      }

      return res.status(200).json({
        message: "Bulk asset order update successful",
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
