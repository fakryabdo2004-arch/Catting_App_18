"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetRepository = void 0;
class AssetRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    create = (data) => this.model.create(data);
    findById = (id) => this.model.findById(id);
    findByKey = (key) => this.model.findOne({ key });
    findAllByOwner = (owner, filter = {}) => this.model.find({ owner, ...filter });
    softDeleteById = (id) => this.model.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
    restoreById = (id) => this.model.findByIdAndUpdate(id, { isDeleted: false, deletedAt: undefined }, { new: true });
    hardDeleteById = (id) => this.model.findByIdAndDelete(id);
    deleteByPrefix = (owner, prefix) => this.model.deleteMany({ owner, key: { $regex: `^${prefix}` } });
}
exports.AssetRepository = AssetRepository;
