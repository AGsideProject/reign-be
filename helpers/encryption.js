const crypt = require("bcryptjs");

const hashThePassword = (password) => crypt.hashSync(password, 9);
const compareThePass = (password, hash) => crypt.compareSync(password, hash);

module.exports = { hashThePassword, compareThePass };
