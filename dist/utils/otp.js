"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNumperOtp = void 0;
const generateNumperOtp = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
exports.generateNumperOtp = generateNumperOtp;
