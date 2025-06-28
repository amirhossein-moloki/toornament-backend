import jwt from 'jsonwebtoken';
import User from '#models/user/User.model.js'; // فرض کردم User داخل src/models/User.js هست
import { asyncWrapper } from '#utils/async.wrapper.js';
import { ApiError } from '#utils/ApiError.js';


export const authGuard = asyncWrapper(async (req, res, next) => {
    // ۱. استخراج توکن از هدر Authorization
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'شما احراز هویت نشده‌اید. لطفا وارد شوید.');
    }

    // ۲. اعتبارسنجی توکن در یک بلوک try...catch برای جلوگیری از کرش سرور
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        // مدیریت خطاهای همزمان مانند TokenExpiredError یا JsonWebTokenError
        throw new ApiError(401, 'توکن نامعتبر یا منقضی شده است.');
    }

    // ۳. پیدا کردن کاربر از روی شناسه داخل توکن
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        throw new ApiError(401, 'کاربری که این توکن به او تعلق دارد دیگر وجود ندارد.');
    }

    // ۴. بررسی وضعیت کاربر (Authorization) - آیا کاربر مجاز به دسترسی است؟
    if (currentUser.status !== 'active') {
        throw new ApiError(403, 'دسترسی شما به سیستم مسدود شده است.');
    }

    // ۵. ضمیمه کردن کاربر به درخواست برای استفاده در مراحل بعدی
    req.user = currentUser;

    // ۶. اجازه عبور به مرحله بعد
    next();
});
