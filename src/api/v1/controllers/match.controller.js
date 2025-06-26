import matchService from '../../services/match.service.js';
import { asyncWrapper } from '../utils/async.wrapper.js';
import { pick } from '../utils/pick.js';

/**
 * @desc    دریافت لیست مسابقات بر اساس فیلترها
 */
const getMatches = asyncWrapper(async (req, res) => {
  // فیلترها و گزینه‌های صفحه‌بندی از query استخراج می‌شوند
  const filter = pick(req.query, ['tournamentId', 'userId']);
  const options = pick(req.query, ['page', 'limit']);
  
  const result = await matchService.queryMatches(filter, options);
  res.status(200).json(result);
});

/**
 * @desc    دریافت جزئیات یک مسابقه با شناسه
 */
const getMatchById = asyncWrapper(async (req, res) => {
  const match = await matchService.getMatchById(req.params.id, req.user.id);
  res.status(200).json(match);
});

/**
 * @desc    ثبت نتیجه یک مسابقه
 */
const reportMatchResult = asyncWrapper(async (req, res) => {
  const matchId = req.params.id;
  const reporterId = req.user.id;
  
  // جلوگیری از آسیب‌پذیری Mass Assignment با انتخاب صریح فیلدهای مجاز
  const resultData = pick(req.body, ['scores', 'results']);

  await matchService.reportResult(matchId, reporterId, resultData);

  res.status(200).json({ message: 'نتیجه با موفقیت ثبت شد و در انتظار تایید است.' });
});

export default {
  getMatches,
  getMatchById,
  reportMatchResult,
};
