"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entities = exports.entity = exports.success = void 0;
const success = (res, status = 200, payload) => {
    return res.status(status).json(payload);
};
exports.success = success;
const entity = (data, message = "OK") => ({ message, data });
exports.entity = entity;
const entities = (data, message = "OK", meta) => ({
    message,
    data,
    meta: meta ?? { total: data.length },
});
exports.entities = entities;
