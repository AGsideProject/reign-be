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
      const {
        type,
        order,
        model_id,
        orientation = "portrait",
        status,
      } = req.body;

      // Check if a file is provided
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // Validate model_id
      if (!model_id) {
        return res.status(400).json({ message: "model_id is required" });
      }

      let nextOrder = order;

      // If no order is provided, calculate the next order value
      if (!nextOrder) {
        const lastAsset = await Asset.findOne({
          where: { model_id, type },
          order: [["order", "DESC"]],
        });

        // If no assets exist for the model_id, start with order 1
        // Otherwise, increment the highest order by 1
        nextOrder = lastAsset ? lastAsset.order + 1 : 1;
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
        order: nextOrder, // Use the calculated or provided order
        model_id,
        orientation,
        status,
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
        raw: true,
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

      const result = {
        carousel: [],
        polaroid: [],
      };

      if (assets && assets.length) {
        const sortedAssets = assets.sort((a, b) => {
          if (a.order === b.order) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          }

          return a.order - b.order;
        });

        const groupedAssets = sortedAssets.reduce((acc, asset) => {
          if (!acc[asset.type]) {
            acc[asset.type] = [];
          }
          acc[asset.type].push(asset);
          return acc;
        }, {});

        if (groupedAssets.carousel) {
          result.carousel = groupedAssets.carousel;
        }

        if (groupedAssets.polaroid) {
          result.polaroid = groupedAssets.polaroid;
        }
      }

      return res.status(200).json({
        message: "success",
        data: result,
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

      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({
          message: "Invalid status. Status must be 'active' or 'inactive'.",
        });
      }

      const asset = await Asset.findByPk(id);

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      if (status === "inactive") {
        const maxOrder = await Asset.max("order", {
          where: { model_id: asset.model_id },
        });

        await asset.update({ status, order: maxOrder + 1 });
      } else {
        await asset.update({ status });
      }

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
      const newOrder = Number(order);

      if (typeof newOrder !== "number" || newOrder < 0) {
        return res.status(400).json({
          message: "Invalid order. Order must be a non-negative number.",
        });
      }

      const assetToUpdate = await Asset.findByPk(id);

      if (!assetToUpdate) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const assetWithNewOrder = await Asset.findOne({
        where: {
          model_id: assetToUpdate.model_id,
          order: newOrder,
          type: assetToUpdate.type,
        },
      });

      console.log(assetWithNewOrder, "<<assetWithNewOrder");

      if (assetWithNewOrder) {
        const currentOrder = assetToUpdate.order;
        console.log(currentOrder, "<<<currentOrder");
        console.log(newOrder, "<<<newOrder");

        await assetToUpdate.update({ order: newOrder });
        await assetWithNewOrder.update({ order: currentOrder });
      } else {
        await assetToUpdate.update({ order: newOrder });
      }

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
