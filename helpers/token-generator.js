const jwt = require("jsonwebtoken");

// Create an access token
const payloadToToken = (payload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACESS_TOKEN_EXPIRES,
  });

// Create a refresh token
const payloadToRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
  });

// Verify the access token
const tokenToPayload = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

module.exports = { payloadToToken, tokenToPayload, payloadToRefreshToken };
