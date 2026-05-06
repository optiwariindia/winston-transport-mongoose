import { Schema, SchemaDefinition } from 'mongoose';

export const createLogSchema = (
  expires?: string | number,
  additionalFields?: Record<string, any>
): Schema => {
  const baseSchema: SchemaDefinition = {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    level: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
    ...additionalFields,
  };

  // If expires is set, add it to the timestamp field index
  if (expires !== undefined) {
    (baseSchema.timestamp as any).expires = expires;
  }

  return new Schema(baseSchema, {
    timestamps: false, // We use our own timestamp
    versionKey: false,
    minimize: false,
  });
};
