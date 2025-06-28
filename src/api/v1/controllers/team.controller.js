import teamService from '#services/team.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';
import pick from '#utils/pick.js';

// --- Public Controllers ---

const getTeams = asyncWrapper(async (req, res) => {
  const filter = pick(req.query, ['game']);
  const options = pick(req.query, ['page', 'limit']);
  const result = await teamService.queryTeams(filter, options);
  res.status(200).json(result);
});

const getTeamById = asyncWrapper(async (req, res) => {
  const team = await teamService.getTeamById(req.params.id);
  res.status(200).json(team);
});


// --- Private Controllers ---

const createTeam = asyncWrapper(async (req, res) => {
  const teamData = pick(req.body, ['name', 'tag', 'game']);
  // The creator automatically becomes the captain and a member.
  teamData.captain = req.user.id;
  teamData.members = [req.user.id];

  const team = await teamService.createTeam(teamData);
  res.status(201).json(team);
});

const updateTeam = asyncWrapper(async (req, res) => {
  const teamId = req.params.id;
  const updateBody = pick(req.body, ['name', 'avatar']);
  
  const team = await teamService.updateTeamById(teamId, updateBody);
  res.status(200).json(team);
});

const deleteTeam = asyncWrapper(async (req, res) => {
  await teamService.deleteTeamById(req.params.id);
  res.status(204).send();
});


// --- Member Management Controllers ---

const addMember = asyncWrapper(async (req, res) => {
    const teamId = req.params.id;
    const { userId } = req.body;
    const team = await teamService.addMember(teamId, userId);
    res.status(200).json(team);
});

const removeMember = asyncWrapper(async (req, res) => {
    const { id: teamId, userId } = req.params;
    const team = await teamService.removeMember(teamId, userId);
    res.status(200).json(team);
});

const leaveTeam = asyncWrapper(async (req, res) => {
    const teamId = req.params.id;
    const userId = req.user.id;
    await teamService.leaveTeam(teamId, userId);
    res.status(204).send();
});


export default {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  leaveTeam
};
