import express from 'express';
import { 
    getAllUnits, 
    createUnit, 
    updateUnit, 
    softDeleteUnit,
    restoreUnit,
    hardDeleteUnit
} from '../controllers/unitController.js';

const router = express.Router();

router.get('/', getAllUnits);
router.post('/', createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', softDeleteUnit);
router.put('/:id/restore', restoreUnit);
router.delete('/:id/hard', hardDeleteUnit);

export default router;