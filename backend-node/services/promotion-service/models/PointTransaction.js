import mongoose from 'mongoose';

const pointTransactionSchema = new mongoose.Schema({
    customerId: { 
        type: Number, 
        required: true, 
        index: true 
    },
    transactionType: { 
        type: String, 
        required: true, 
        enum: ['EARN', 'SPEND'] // Chỉ nhận 2 giá trị này
    },
    source: { 
        type: String, 
        required: true, 
        enum: ['CHECK_IN', 'REVIEW', 'ORDER', 'REDEEM', 'SYSTEM'] 
    },
    points: { 
        type: Number, 
        required: true,
        min: 1 // Giao dịch ít nhất phải từ 1 điểm
    },
    referenceId: { 
        type: String, 
        default: null // ID của đơn hàng hoặc bài đánh giá để đối soát
    },
    description: { 
        type: String 
    }
}, { 
    timestamps: true 
});

export default mongoose.model('PointTransaction', pointTransactionSchema);