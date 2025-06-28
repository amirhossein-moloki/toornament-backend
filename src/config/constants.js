/**
 * This file centralizes all the constant values and enums used across the application.
 * Using these constants instead of hardcoded strings prevents typos and makes future updates easier.
 */

// ===================================
// User Constants
// ===================================
export const USER_ROLES = Object.freeze({
  USER: 'user',
  MANAGER: 'tournament_manager',
  SUPPORT: 'support',
  ADMIN: 'admin',
});

export const USER_STATUSES = Object.freeze({
  ACTIVE: 'active',
  BANNED: 'banned',
  PENDING: 'pending_verification',
});

// ===================================
// Tournament Constants
// ===================================
export const TOURNAMENT_STATUSES = Object.freeze({
  DRAFT: 'draft',
  REG_OPEN: 'registration_open',
  REG_CLOSED: 'registration_closed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
});

export const TOURNAMENT_STRUCTURES = Object.freeze({
  SINGLE_ELIMINATION: 'single_elimination',
  DOUBLE_ELIMINATION: 'double_elimination',
  ROUND_ROBIN: 'round_robin',
  SWISS: 'swiss',
  BATTLE_ROYALE: 'battle_royale'
});

export const PRIZE_TYPES = Object.freeze({
  WALLET: 'wallet_credit',
  VIRTUAL: 'virtual_item',
  PHYSICAL: 'physical_item',
  OTHER: 'other',
});

// ===================================
// Match Constants
// ===================================
export const MATCH_STATUSES = Object.freeze({
  PENDING: 'pending',
  READY: 'ready',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  FORFEITED: 'forfeited',
});

// ===================================
// Dispute Constants
// ===================================
export const DISPUTE_STATUSES = Object.freeze({
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CANCELED: 'canceled',
});

// ===================================
// Registration Constants
// ===================================
export const REGISTRATION_STATUSES = Object.freeze({
    REGISTERED: 'registered',
    CHECKED_IN: 'checked_in',
    PLAYING: 'playing',
    ELIMINATED: 'eliminated',
    COMPLETED: 'completed',
    DISQUALIFIED: 'disqualified',
});

// ===================================
// Transaction Constants
// ===================================
export const TRANSACTION_TYPES = Object.freeze({
    WALLET_CHARGE: 'wallet_charge',
    TOURNAMENT_FEE: 'tournament_fee',
    PAYOUT: 'payout',
    REFUND: 'refund',
});

export const TRANSACTION_STATUSES = Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELED: 'canceled',
});

// ===================================
// Shared Constants
// ===================================
export const PARTICIPANT_MODELS = Object.freeze({
    USER: 'User',
    TEAM: 'Team',
});
