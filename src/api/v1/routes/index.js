import { Router } from 'express';

// 1. وارد کردن ماژول‌های مربوط به Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerConfig from '../../../config/swagger.config.js'; // فایل پیکربندی که قبلا ساختیم

// وارد کردن تمام ماژول‌های مسیرها
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import tournamentRoutes from './tournament.routes.js';
import teamRoutes from './team.routes.js';
import matchRoutes from './match.routes.js';
import adminRoutes from './admin.routes.js';
import paymentRoutes from './payment.routes.js';
import disputeRoutes from './dispute.routes.js'; // اضافه کردن مسیر dispute

const router = Router();

// آرایه‌ای برای نگهداری تمام مسیرهای ماژولار
const moduleRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/users', route: userRoutes },
  { path: '/tournaments', route: tournamentRoutes },
  { path: '/teams', route: teamRoutes },
  { path: '/matches', route: matchRoutes },
  { path: '/admin', route: adminRoutes },
  { path: '/payments', route: paymentRoutes },
  { path: '/disputes', route: disputeRoutes }, // اضافه کردن مسیر dispute
];

// ثبت هر ماژول مسیر با پیشوند مشخص شده
moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});


// 2. راه‌اندازی مسیر مستندات API
// این بخش باید پس از ثبت تمام مسیرهای API قرار گیرد
const swaggerSpecs = swaggerJsdoc(swaggerConfig);
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));


export default router;