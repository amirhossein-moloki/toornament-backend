import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // اصلاحیه نهایی: استفاده از عدد صحیح برای ذخیره مبالغ مالی (به ریال)
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'مبلغ تراکنش باید یک عدد صحیح (به ریال) باشد.'
      }
    },
    type: {
      type: String,
      required: true,
      enum: ['wallet_charge', 'tournament_fee', 'payout', 'refund'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'canceled'],
      default: 'pending',
    },
    description: {
      type: String,
      required: true,
    },
    authority: {
      type: String,
      index: true,
    },
    refId: {
      type: String,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntityModel',
    },
    relatedEntityModel: {
      type: String,
      enum: ['Tournament', 'Match'],
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
