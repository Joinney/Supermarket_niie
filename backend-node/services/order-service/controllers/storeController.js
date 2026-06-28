import Store from '../models/StoreModel.js'; // Nhớ bắt buộc phải có đuôi .js

export const calculateShipping = async (req, res) => {
  try {
    const { userLat, userLng } = req.body;

    if (!userLat || !userLng) {
      return res.status(400).json({ success: false, message: "Địa chỉ này chưa có tọa độ bản đồ!" });
    }

    const nearestStore = await Store.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [ parseFloat(userLng), parseFloat(userLat) ]
          }
        }
      }
    });

    if (!nearestStore) return res.status(404).json({ success: false, message: "Chưa có trụ sở hoạt động!" });

    const storeLng = nearestStore.location.coordinates[0];
    const storeLat = nearestStore.location.coordinates[1];
    const distanceKm = calcHaversine(userLat, userLng, storeLat, storeLng);

    const estimatedMinutes = Math.round((distanceKm / 30) * 60) + 15;
    const shippingFee = distanceKm <= 2 ? 0 : Math.round((distanceKm - 2) * 5000);

    return res.status(200).json({
      success: true,
      data: {
        nearestStore: { id: nearestStore._id, name: nearestStore.name, lat: storeLat, lng: storeLng },
        distanceKm: Number(distanceKm.toFixed(1)),
        estimatedMinutes,
        shippingFee
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function calcHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}