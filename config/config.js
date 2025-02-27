require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "reign_dev",
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "postgres",
  },
  test: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || "database_test",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "mysql",
  },
  production: {
    username: process.env.DB_USERNAME || "reign_db_prod_user",
    password: process.env.DB_PASSWORD || "52zLeLln1lMuSQobq4STa8RQ94WhNaVU",
    database: process.env.DB_DATABASE || "reign_db_prod_4yxh",
    host:
      process.env.DB_HOST ||
      "dpg-cucvdthopnds73amnnv0-a.singapore-postgres.render.com",
    dialect: process.env.DB_DIALECT || "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
