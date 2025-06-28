import tournamentService from '#services/tournament.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';
import { pick } from '#utils/pick.js';
import { ApiResponse } from '#utils/ApiResponse.js';

const getAllTournaments = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const result = await tournamentService.queryTournaments(options);
  res.status(200).json(new ApiResponse(200, result, 'Tournaments retrieved successfully.'));
});

const getTournamentById = asyncWrapper(async (req, res) => {
  const tournament = await tournamentService.getTournamentById(req.params.id);
  res.status(200).json(new ApiResponse(200, tournament, 'Tournament retrieved successfully.'));
});

const createTournament = asyncWrapper(async (req, res) => {
  const allowedFields = [
    'name', 'game', 'structure', 'teamSize', 'maxParticipants', 'rules',
    'registrationStartDate', 'registrationEndDate', 'checkInStartDate',
    'tournamentStartDate', 'entryFee', 'prizeStructure'
  ];
  const tournamentData = pick(req.body, allowedFields);
  
  tournamentData.organizer = req.user.id;

  const tournament = await tournamentService.createTournament(tournamentData);
  res.status(201).json(new ApiResponse(201, tournament, 'Tournament created successfully.'));
});

const updateTournament = asyncWrapper(async (req, res) => {
  const allowedUpdates = [
    'name', 'game', 'status', 'structure', 'teamSize', 'maxParticipants', 'rules',
    'registrationStartDate', 'registrationEndDate', 'checkInStartDate',
    'tournamentStartDate', 'entryFee', 'prizeStructure'
  ];
  const updateBody = pick(req.body, allowedUpdates);

  const tournament = await tournamentService.updateTournamentById(req.params.id, updateBody);
  res.status(200).json(new ApiResponse(200, tournament, 'Tournament updated successfully.'));
});

const deleteTournament = asyncWrapper(async (req, res) => {
  await tournamentService.deleteTournamentById(req.params.id);
  res.status(204).send();
});

const startTournament = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    await tournamentService.startTournamentAndGenerateBrackets(id);
    res.status(200).json(new ApiResponse(200, null, 'Tournament started and brackets generated.'));
});


export default {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  startTournament,
};
