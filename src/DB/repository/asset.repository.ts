import { Model } from "mongoose";
import type { HAssetDocument } from "../model/asset.model";

export class AssetRepository {
  constructor(private model: Model<HAssetDocument>) {}
  create = (data: Partial<HAssetDocument>) => this.model.create(data);
  findById = (id: string) => this.model.findById(id);
  findByKey = (key: string) => this.model.findOne({ key });
  findAllByOwner = (owner: any, filter: any = {}) => this.model.find({ owner, ...filter });
  softDeleteById = (id: string) => this.model.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
  restoreById = (id: string) => this.model.findByIdAndUpdate(id, { isDeleted: false, deletedAt: undefined }, { new: true });
  hardDeleteById = (id: string) => this.model.findByIdAndDelete(id);
  deleteByPrefix = (owner: any, prefix: string) => this.model.deleteMany({ owner, key: { $regex: `^${prefix}` } });
}
