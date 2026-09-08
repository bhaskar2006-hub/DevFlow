import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireOrgRole, requireProjectRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

// Project CRUD with Role-based Access Control
router.post('/', requireOrgRole(['OWNER', 'ADMIN', 'MEMBER']), ProjectController.create);
router.get('/', ProjectController.getAll);
router.get('/organization/:organizationId', requireOrgRole(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']), ProjectController.getByOrganization);
router.get('/:id', requireProjectRole(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']), ProjectController.getById);
router.patch('/:id', requireProjectRole(['OWNER', 'ADMIN']), ProjectController.update);
router.delete('/:id', requireProjectRole(['OWNER']), ProjectController.delete);

// Nested Issues under Projects
router.post('/:id/issues', requireProjectRole(['OWNER', 'ADMIN', 'MEMBER']), ProjectController.createIssue);
router.get('/:id/issues', requireProjectRole(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']), ProjectController.getIssues);

export default router;
