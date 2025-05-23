const { Asset } = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const uploadDir = path.join(__dirname, "../Assets");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const getTimestamp = () => {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .substring(0, 17);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = getTimestamp();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

class AssetController {
  static async createAsset(req, res, next) {
    try {
      const {
        type,
        order,
        model_id,
        orientation = "portrait",
        status,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      if (!model_id) {
        return res.status(400).json({ message: "model_id is required" });
      }

      let nextOrder = order;
      if (!nextOrder) {
        const lastAsset = await Asset.findOne({
          where: { model_id, type },
          order: [["order", "DESC"]],
        });
        nextOrder = lastAsset ? lastAsset.order + 1 : 1;
      }

      const originalFilePath = path.join(uploadDir, req.file.filename);
      const compressedFilePath = path.join(
        uploadDir,
        `mini_${req.file.filename}`
      );

      const quality = req.file?.size > 3047404 ? 8 : 10;
      // Kompresi gambar
      const compressedBuffer = await sharp(originalFilePath)
        .jpeg({ quality: quality })
        .toBuffer();

      fs.writeFileSync(compressedFilePath, compressedBuffer);

      await Asset.create({
        img_url: `/Assets/${req.file.filename}`,
        type,
        order: nextOrder,
        model_id,
        orientation,
        status,
      });

      return res.status(201).json({
        message: "Asset created successfully",
        original_url: `/Assets/${req.file.filename}`,
        compressed_url: `/Assets/mini_${req.file.filename}`,
      });
    } catch (error) {
      next(error);
    }
  }

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
        instagram: [],
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

        if (groupedAssets.instagram) {
          result.instagram = groupedAssets.instagram;
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

      if (assetWithNewOrder) {
        const currentOrder = assetToUpdate.order;

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

      // Hapus file dari penyimpanan lokal
      const filePath = path.join(uploadDir, path.basename(asset.img_url));
      const compressedFilePath = path.join(
        uploadDir,
        `mini_${path.basename(asset.img_url)}`
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (fs.existsSync(compressedFilePath)) {
        fs.unlinkSync(compressedFilePath);
      }

      // Hapus data dari database
      await asset.destroy();

      return res.status(200).json({ message: "Asset deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Static method to update a single asset by ID
  static async updateAssetById(req, res, next) {
    try {
      const { id } = req.params;
      const { type, order, model_id, orientation, status } = req.body;

      // Cari aset berdasarkan ID
      const asset = await Asset.findByPk(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      let img_url = asset.img_url;
      let compressed_url = `/Assets/mini_${path.basename(asset.img_url)}`;

      // Periksa apakah ada file baru yang diunggah
      if (req.file) {
        // Hapus file lama dari penyimpanan lokal
        const oldFilePath = path.join(uploadDir, path.basename(asset.img_url));
        const oldCompressedFilePath = path.join(
          uploadDir,
          `mini_${path.basename(asset.img_url)}`
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        if (fs.existsSync(oldCompressedFilePath)) {
          fs.unlinkSync(oldCompressedFilePath);
        }

        // Simpan file baru
        const newFilePath = path.join(uploadDir, req.file.filename);
        const newCompressedFilePath = path.join(
          uploadDir,
          `mini_${req.file.filename}`
        );

        // Kompresi gambar baru
        const compressedBuffer = await sharp(newFilePath)
          .jpeg({ quality: 50 })
          .toBuffer();

        fs.writeFileSync(newCompressedFilePath, compressedBuffer);

        img_url = `/Assets/${req.file.filename}`;
        compressed_url = `/Assets/mini_${req.file.filename}`;
      }

      // Update data aset
      await asset.update({
        img_url,
        type,
        order,
        model_id,
        orientation,
        status,
      });

      return res.status(200).json({
        message: "Asset updated successfully",
        data: {
          id: asset.id,
          img_url,
          compressed_url,
          type,
          order,
          model_id,
          orientation,
          status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLandingPageCover(_req, res, next) {
    try {
      const cover = await Asset.findOne({
        where: {
          type: "landingpage",
        },
      });

      return res.status(200).json({ message: "Success", data: cover });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { AssetController, upload };
