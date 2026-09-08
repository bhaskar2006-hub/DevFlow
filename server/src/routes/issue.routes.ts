import { Router } from 'express';
import { IssueController } from '../controllers/issue.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireIssueRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

// Issues CRUD with Role-based Access Control
router.post('/', IssueController.create);
router.get('/', IssueController.getAll);
router.get('/:id', requireIssueRole(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']), IssueController.getById);
router.patch('/:id', requireIssueRole(['OWNER', 'ADMIN', 'MEMBER']), IssueController.update);
router.delete('/:id', requireIssueRole(['OWNER', 'ADMIN']), IssueController.delete);

// Nested Comments under Issue
router.post('/:id/comments', requireIssueRole(['OWNER', 'ADMIN', 'MEMBER']), IssueController.createComment);
router.get('/:id/comments', requireIssueRole(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']), IssueController.getComments);

export default router;
