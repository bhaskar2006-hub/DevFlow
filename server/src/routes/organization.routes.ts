import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireOrgRole } from '../middleware/role.middleware';

const router = Router();

// All organization routes require authentication
router.use(authenticate);

// Organization CRUD
router.post('/', OrganizationController.create);
router.get('/', OrganizationController.getAll);
router.get('/my', OrganizationController.getAll); // Support both /api/organizations and /api/organizations/my
router.get('/:id', OrganizationController.getById);
router.patch('/:id', requireOrgRole(['OWNER', 'ADMIN']), OrganizationController.update);
router.post('/:id/test-slack', requireOrgRole(['OWNER', 'ADMIN']), OrganizationController.testSlack);
router.delete('/:id', requireOrgRole(['OWNER']), OrganizationController.delete);

// Organization Members
router.post('/:id/members', requireOrgRole(['OWNER', 'ADMIN']), OrganizationController.addMember);
router.get('/:id/members', requireOrgRole(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']), OrganizationController.getMembers);
router.patch('/:id/members/:memberId', requireOrgRole(['OWNER', 'ADMIN']), OrganizationController.updateMemberRole);
router.delete('/:id/members/:memberId', requireOrgRole(['OWNER', 'ADMIN']), OrganizationController.removeMember);

// Organization Activities
router.get('/:id/activities', requireOrgRole(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']), OrganizationController.getActivities);

export default router;
