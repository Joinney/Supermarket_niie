import express from 'express';
import { 
    getAllNations, 
    getNationById, 
    createNation, 
    updateNation, 
    toggleNationStatus,
    deleteNation 
} from '../controllers/nationalController.js';

const router = express.Router();

router.get('/', getAllNations);
router.get('/:id', getNationById);
router.post('/', createNation);
router.put('/:id', updateNation);
router.patch('/:id/toggle', toggleNationStatus);
router.delete('/:id', deleteNation);
export default router;