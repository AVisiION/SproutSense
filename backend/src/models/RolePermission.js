import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
      required: true,
      index: true,
    },
    constraints: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);

export default RolePermission;
