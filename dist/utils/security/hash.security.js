"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareeHash = exports.generateHash = void 0;
const bcrypt_1 = require("bcrypt");
const generateHash = async (plaintext, saltRound = Number(process.env.SALT)) => {
    return await (0, bcrypt_1.hash)(plaintext, saltRound);
};
exports.generateHash = generateHash;
const compareeHash = async (plaintext, hash) => {
    return await (0, bcrypt_1.compare)(plaintext, hash);
};
exports.compareeHash = compareeHash;
