"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetModel = exports.AssetVisibility = void 0;
const mongoose_1 = require("mongoose");
var AssetVisibility;
(function (AssetVisibility) {
    AssetVisibility["PUBLIC"] = "public";
    AssetVisibility["PRIVATE"] = "private";
})(AssetVisibility || (exports.AssetVisibility = AssetVisibility = {}));
const schema = new mongoose_1.Schema({
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    key: { type: String, required: true, unique: true },
    bucket: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    etag: String,
    visibility: { type: String, enum: Object.values(AssetVisibility), default: AssetVisibility.PRIVATE },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    tags: [String],
    type: { type: String, enum: ["profile", "cover", "generic"], default: "generic" },
}, { timestamps: true });
exports.AssetModel = (0, mongoose_1.model)("Asset", schema);
