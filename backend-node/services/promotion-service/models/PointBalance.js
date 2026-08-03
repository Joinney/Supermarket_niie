import mongoose from 'mongoose';

const pointBalanceSchema = new mongoose.Schema({
    customerId: { 
        type: Number, 
        required: true, 
        unique: true, 
        index: true // Đánh index để tìm ví nhanh hơn
    },
    availablePoints: { 
        type: Number, 
        default: 0,
        min: 0 // Không cho phép điểm âm
    },
    totalEarned: { 
        type: Number, 
        default: 0 
    },
    totalSpent: { 
        type: Number, 
        default: 0 
    }
}, { 
    timestamps: true // Tự động có createdAt, updatedAt
});

export default mongoose.model('PointBalance', pointBalanceSchema);