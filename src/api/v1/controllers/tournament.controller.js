import tournamentService from '../../services/tournament.service.js';
import { asyncWrapper } from '../utils/async.wrapper.js';
import { pick } from '../utils/pick.js'; // فرض بر وجود یک ابزار کمکی برای انتخاب فیلدها

/**
 * @desc    دریافت لیست تورنومنت‌ها با صفحه‌بندی
 */
const getAllTournaments = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const result = await tournamentService.queryTournaments(options);
  res.status(200).json(result);
});

/**
 * @desc    دریافت جزئیات یک تورنومنت با شناسه
 */
const getTournamentById = asyncWrapper(async (req, res) => {
  const tournament = await tournamentService.getTournamentById(req.params.id);
  res.status(200).json(tournament);
});

/**
 * @desc    ایجاد یک تورنومنت جدید
 */
const createTournament = asyncWrapper(async (req, res) => {
  // اصلاحیه نهایی طبق حکم دادگاه: جلوگیری از آسیب‌پذیری Mass Assignment
  // تنها فیلدهای مجاز از بدنه درخواست انتخاب می‌شوند.
  const allowedFields = [
    'name', 'game', 'structure', 'teamSize', 'maxParticipants', 'rules',
    'registrationStartDate', 'registrationEndDate', 'checkInStartDate',
    'tournamentStartDate', 'entryFee', 'prizeStructure'
  ];
  const tournamentData = pick(req.body, allowedFields);
  
  // شناسه سازمان‌دهنده به صورت امن از کاربر لاگین‌کرده اضافه می‌شود.
  tournamentData.organizer = req.user.id;

  const tournament = await tournamentService.createTournament(tournamentData);
  res.status(201).json(tournament); // 201 Created
});

/**
 * @desc    به‌روزرسانی یک تورنومنت موجود
 */
const updateTournament = asyncWrapper(async (req, res) => {
  // اصلاحیه نهایی: تنها فیلدهای مجاز برای به‌روزرسانی انتخاب می‌شوند.
  // فیلدهای حساس مانند 'organizer' هرگز از ورودی کاربر گرفته نمی‌شوند.
  const allowedUpdates = [
    'name', 'game', 'status', 'structure', 'teamSize', 'maxParticipants', 'rules',
    'registrationStartDate', 'registrationEndDate', 'checkInStartDate',
    'tournamentStartDate', 'entryFee', 'prizeStructure'
  ];
  const updateBody = pick(req.body, allowedUpdates);

  const tournament = await tournamentService.updateTournamentById(req.params.id, updateBody);
  res.status(200).json(tournament);
});

/**
 * @desc    حذف یک تورنومنت
 */
const deleteTournament = asyncWrapper(async (req, res) => {
  await tournamentService.deleteTournamentById(req.params.id);
  res.status(204).send(); // 204 No Content
});


export default {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
};
