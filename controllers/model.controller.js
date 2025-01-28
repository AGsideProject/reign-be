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
              console.log("Cloudinary upload result:", result);
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

  static async getAccessTokenPost(req, res, next) {
    try {
      const { code } = req.query;

      const payload = {
        client_id: "1321846202393193",
        client_secret: "cbe9c71bc48b0e069a1209724ad90bce",
        redirect_uri:
          "https://reign-service.onrender.com/v1/model/post/get-code-post",
        code: code,
      };

      console.log(payload, "<<<payload");

      const { data } = await axios.post(
        "https://graph.facebook.com/v21.0/oauth/access_token",
        payload
      );
      const { access_token } = data;

      if (access_token) {
        const { data } = await axios.get(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name&access_token=${access_token}`
        );
        return res.status(200).json(data);
      } else return res.status(200).json(access_token);
    } catch (error) {
      next(error);
    }
  }

  static async getUserPost(req, rest, next) {
    const { username } = req.params;
    try {
      const data = await fetch(`https://www.instagram.com/${username}/`);
      const source = await data.text();
      console.log(source, "<<source");

      const jsonObject = source
        .match(
          /<script type="text\/javascript">window\._sharedData = (.*)<\/script>/
        )[1]
        .slice(0, -1);

      const userInfo = JSON.parse(jsonObject);

      const feed =
        userInfo.entry_data.ProfilePage[0].graphql.user
          .edge_owner_to_timeline_media.edges;

      const images = feed
        .filter((e) => e.node.__typename === "GraphImage")
        .map((e) => {
          const {
            display_url,
            shortcode,
            edge_media_preview_like,
            edge_media_to_comment,
            accessibility_caption,
            thumbnail_resources,
          } = e.node;

          return {
            src: display_url,
            link: `https://www.instagram.com/p/${shortcode}/`,
            likes: edge_media_preview_like.count,
            comments: edge_media_to_comment.count,
            caption: accessibility_caption,
            thumbnails: thumbnail_resources,
          };
        });

      return res.status(200).json({ images });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { ModelController, upload };

// https://www.facebook.com/v21.0/dialog/oauth?client_id=1321846202393193&redirect_uri=https://reign-service.onrender.com/v1/model/post/get-code-post&scope=instagram_basic,pages_show_list,instagram_manage_insights,pages_read_engagement&response_type=code
