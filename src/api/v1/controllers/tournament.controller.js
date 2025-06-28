import tournamentService from '#services/tournament.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';
import { pick } from '#utils/pick.js';

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
  const allowedFields = [
    'name', 'game', 'structure', 'teamSize', 'maxParticipants', 'rules',
    'registrationStartDate', 'registrationEndDate', 'checkInStartDate',
    'tournamentStartDate', 'entryFee', 'prizeStructure'
  ];
  const tournamentData = pick(req.body, allowedFields);
  
  tournamentData.organizer = req.user.id;

  const tournament = await tournamentService.createTournament(tournamentData);
  res.status(201).json(tournament);
});

/**
 * @desc    به‌روزرسانی یک تورنومنت موجود
 */
const updateTournament = asyncWrapper(async (req, res) => {
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
  res.status(204).send();
});

/**
 * @desc    شروع تورنومنت و ساخت براکت‌ها
 */
const startTournament = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    await tournamentService.startTournamentAndGenerateBrackets(id);
    res.status(200).json({ message: 'تورنومنت با موفقیت شروع شد و براکت‌ها ایجاد شدند.' });
});


export default {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  startTournament, // تابع جدید اضافه شد
};
