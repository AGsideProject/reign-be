const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const { Artist, Asset } = require("../models");
const axios = require("axios");

// Configure multer to handle file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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

  static async getAllPublicModels(req, res, next) {
    try {
      const { gender } = req.query;

      const query = {
        where: { status: "active" },
      };

      if (gender) query.where.gender = gender;

      const artists = await Artist.findAll(query);
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
        include: {
          model: Asset,
        },
      });

      if (!artist) {
        throw { name: "Not Found" };
      }

      const artistJson = artist.toJSON();

      const result = {
        ...artistJson,
        carousel: [],
        polaroid: [],
        instagram: [],
      };

      if (artistJson.Assets && artistJson.Assets.length) {
        const activeAssets = artistJson.Assets.filter(
          (asset) => asset.status === "active"
        );

        const sortedAssets = activeAssets.sort((a, b) => {
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
          result.carousel = groupedAssets.carousel.map((asset) => ({
            img_url: asset.img_url,
            orientation: asset.orientation,
          }));
        }

        if (groupedAssets.polaroid) {
          result.polaroid = groupedAssets.polaroid.map((asset) => ({
            img_url: asset.img_url,
            orientation: asset.orientation,
          }));
        }

        if (groupedAssets.instagram) {
          result.instagram = groupedAssets.instagram.map((asset) => ({
            img_url: asset.img_url,
            orientation: asset.orientation,
            redirect: asset.redirect,
            comments: asset.comments,
            likes: asset.likes,
          }));
        }
      }

      // Remove the Assets array
      delete result.Assets;

      // Send response with the plain object
      return res.status(200).json({
        message: "success",
        data: result,
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
        // Validate file type and size
        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(req.file.mimetype)) {
          return res
            .status(400)
            .json({ message: "Only JPG and PNG files are allowed." });
        }

        if (req.file.size > maxSize) {
          return res
            .status(400)
            .json({ message: "File size must be less than 10MB." });
        }

        // Upload file to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                return reject(error);
              }

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
      console.error("Error in createArtist:", error);
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

  static async updateArtistStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate the status
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({
          message:
            "Invalid status. Status must be either 'active' or 'inactive'.",
        });
      }

      // Find the artist by ID
      const artist = await Artist.findByPk(id);

      if (!artist) {
        throw { name: "Not Found" };
      }

      // Update the artist's status
      await artist.update({ status });

      return res.status(200).json({
        message: `Artist status updated to '${status}' successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInstagramPost(req, res, next) {
    req.setTimeout(90000);
    try {
      const { model_id, username } = req.body;

      if (!model_id || !username) {
        return res.status(400).json({
          message: "model_id and username are required",
        });
      }

      const model = await Artist.findByPk(model_id);
      if (!model) {
        return res.status(404).json({
          message: "Model not found",
        });
      }

      const payload = {
        addParentData: false,
        directUrls: [`https://www.instagram.com/${username}`],
        enhanceUserSearchWithFacebookPage: false,
        isUserReelFeedURL: false,
        isUserTaggedFeedURL: false,
        resultsLimit: 10,
        resultsType: "posts",
        searchLimit: 1,
        searchType: "hashtag",
      };

      const apifyUrl = `https://api.apify.com/v2/acts/${process.env.APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`;

      const apifyResponse = await axios.post(apifyUrl, payload, {
        params: {
          timeout: 60000,
          limit: 10,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      const instagramPosts = apifyResponse.data;

      await Asset.destroy({
        where: {
          model_id: model_id,
          type: "instagram",
        },
      });

      const assetsToInsert = instagramPosts.map((post, index) => ({
        img_url: post.displayUrl,
        type: "instagram",
        order: index + 1,
        model_id: model_id,
        orientation: "portrait",
        status: "active",
        likes: post.likesCount,
        comments: post.commentsCount,
        redirect: post.url,
      }));

      await Asset.bulkCreate(assetsToInsert);

      return res.status(200).json({
        message: "Instagram posts scraped and saved successfully",
        inserted: assetsToInsert,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.response ? error.response.data : error.message,
      });
    }
  }
}

module.exports = { ModelController, upload };
