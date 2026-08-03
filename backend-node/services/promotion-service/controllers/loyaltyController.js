import PointBalance from '../models/PointBalance.js';
import PointTransaction from '../models/PointTransaction.js';

// [GET] Lấy số dư ví Xu của khách hàng
export const getPointBalance = async (req, res) => {
    try {
        const userId = req.user?.id; 
        
        let balance = await PointBalance.findOne({ customerId: userId });
        
        // Nếu khách hàng chưa có ví điểm, tạo ví mới với 0 điểm
        if (!balance) {
            balance = await PointBalance.create({ customerId: userId });
        }

        res.status(200).json({ success: true, data: balance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] Lấy lịch sử giao dịch Xu
export const getPointHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const history = await PointTransaction.find({ customerId: userId }).sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] Logic Cộng điểm (VD: Khi điểm danh, đánh giá)
export const earnPoints = async (req, res) => {
    try {
        const { customerId, points, source, referenceId, description } = req.body;

        // 1. Tạo lịch sử giao dịch
        await PointTransaction.create({
            customerId: customerId,
            transactionType: 'EARN',
            source,
            points,
            referenceId,
            description
        });

        // 2. Cập nhật số dư ví (Dùng $inc để cập nhật an toàn)
        const updatedBalance = await PointBalance.findOneAndUpdate(
            { customerId: customerId },
            { 
                $inc: { 
                    availablePoints: points, 
                    totalEarned: points 
                } 
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, data: updatedBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================================
// 🎁 [POST] LOGIC ĐIỂM DANH NHẬN XU HÀNG NGÀY
// =========================================================================
export const dailyCheckIn = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        // 1. Tạo mốc thời gian từ 00:00:00 đến 23:59:59 của ngày hôm nay
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 2. Truy vấn xem trong hôm nay khách hàng này đã có giao dịch CHECK_IN nào chưa
        const existingCheckIn = await PointTransaction.findOne({
            customerId: userId,
            source: 'CHECK_IN', // 👉 ĐÃ SỬA: Thêm dấu gạch dưới cho khớp với Database
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // Nếu có rồi thì chặn lại và báo lỗi
        if (existingCheckIn) {
            return res.status(400).json({ 
                success: false, 
                message: "Hôm nay bạn đã nhận thưởng rồi, quay lại vào ngày mai nhé! 🎁" 
            });
        }

        // 3. Nếu chưa điểm danh, tặng 100 Xu
        const bonusPoints = 100; 

        // Ghi lại lịch sử giao dịch
        await PointTransaction.create({
            customerId: userId,
            transactionType: 'EARN',
            source: 'CHECK_IN', // 👉 ĐÃ SỬA: Thêm dấu gạch dưới cho khớp với Database
            points: bonusPoints,
            referenceId: `CHECKIN_${Date.now()}`,
            description: 'Thưởng điểm danh hàng ngày'
        });

        // Cộng tiền vào ví Xu
        const updatedBalance = await PointBalance.findOneAndUpdate(
            { customerId: userId },
            { $inc: { availablePoints: bonusPoints, totalEarned: bonusPoints } },
            { new: true, upsert: true }
        );

        res.status(200).json({ 
            success: true, 
            message: `Điểm danh thành công! Nhận ngay ${bonusPoints} Xu ⚡`, 
            data: updatedBalance 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};