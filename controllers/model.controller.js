const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const { Artist, Asset } = require("../models");

// Configure multer to handle file uploads
const upload = multer({ storage: multer.memoryStorage() });

class ModelController {
  // Static method to get all models
  static async getAllModels(_req, res, next) {
    try {
      const artists = await Artist.findAll();
      // Send response
      return res.status(200).json({
        message: "success",
        data: artists,
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to get a model by slug
  static async getModelBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const artist = await Artist.findOne({
        where: { slug },
        include: Asset,
      });

      if (!artist) {
        throw { name: "Not Found" };
      }

      // Convert the artist instance to a plain object
      const artistJson = artist.toJSON();

      // Refactoring the artist object
      artistJson.carousel = [];
      artistJson.polaroid = [];

      if (artistJson.Assets && artistJson.Assets.length) {
        const assets = artistJson.Assets;

        const sortedCarousel = assets
          .filter((asset) => asset.type === "carousel")
          .sort((a, b) => a.order - b.order)
          .map((asset) => asset.img_url);

        const sortedPolaroid = assets
          .filter((asset) => asset.type === "polaroid")
          .sort((a, b) => a.order - b.order)
          .map((asset) => asset.img_url);

        artistJson.carousel = sortedCarousel;
        artistJson.polaroid = sortedPolaroid;
      }

      // Remove the Assets array
      delete artistJson.Assets;

      // Send response with the plain object
      return res.status(200).json({
        message: "success",
        data: artistJson,
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to create a new artist
  static async createArtist(req, res, next) {
    try {
      const artistData = req.body;

      // Check if a file is provided
      if (req.file) {
        // Upload file to Cloudinary
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

        // Set the Cloudinary URL to `cover_img`
        artistData.cover_img = result.secure_url;
      }

      // Create the artist in the database
      await Artist.create(artistData);

      return res.status(201).json({
        message: "Model created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to update an existing artist
  static async updateArtist(req, res, next) {
    try {
      const { id } = req.params;
      const artistData = req.body;

      const artist = await Artist.findByPk(id);

      if (!artist) {
        throw { name: "Not Found" };
      }

      // Check if a file is provided
      if (req.file) {
        // Upload file to Cloudinary
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

        // Update the Cloudinary URL in `cover_img`
        artistData.cover_img = result.secure_url;
      } else {
        artistData.cover_img = artist.cover_img || null;
      }

      // Update the artist in the database
      await artist.update(artistData);

      return res.status(200).json({
        message: "Model updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Static method to delete a model by ID
  static async deleteModelById(req, res, next) {
    try {
      const { id } = req.params;

      const artist = await Artist.findByPk(id, { include: Asset });

      if (!artist) {
        throw { name: "Not Found" };
      }

      // Delete associated assets from Cloudinary and the database
      for (const asset of artist.Assets) {
        const publicId = asset.img_url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        await asset.destroy();
      }

      // Optionally delete the artist's cover image from Cloudinary
      if (artist.cover_img) {
        const publicId = artist.cover_img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Delete the artist
      await artist.destroy();

      return res.status(200).json({ message: "Artist deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { ModelController, upload };
