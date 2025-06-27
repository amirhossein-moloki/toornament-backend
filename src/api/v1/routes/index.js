import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import tournamentRoutes from './tournament.routes.js';
import teamRoutes from './team.routes.js';
import matchRoutes from './match.routes.js';
import adminRoutes from './admin.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

// An array to hold all modular routes for clean registration
const moduleRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/tournaments',
    route: tournamentRoutes,
  },
  {
    path: '/teams',
    route: teamRoutes,
  },
  {
    path: '/matches',
    route: matchRoutes,
  },
  {
    path: '/admin',
    route: adminRoutes,
  },
  {
    path: '/payments',
    route: paymentRoutes,
  }
];

// Register each route module with its specific path prefix
moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
