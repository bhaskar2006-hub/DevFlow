import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', CommentController.create);
router.get('/issue/:issueId', CommentController.getByIssue);
router.patch('/:id', CommentController.update);
router.delete('/:id', CommentController.delete);

export default router;
