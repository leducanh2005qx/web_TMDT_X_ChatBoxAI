/**
 * Centralized Role Utility
 * Ensures consistent, case-insensitive role checking across the frontend.
 */

export const normalizeRole = (role) => {
  return String(role || "").trim().toUpperCase();
};

export const isAdmin = (role) => {
  return normalizeRole(role) === "ADMIN";
};

export const isManager = (role) => {
  return normalizeRole(role) === "MANAGER";
};

export const isStaff = (role) => {
  return normalizeRole(role) === "STAFF";
};

/**
 * Returns true if the user has a management role (ADMIN or MANAGER).
 */
export const isManagementRole = (role) => {
  const norm = normalizeRole(role);
  return norm === "ADMIN" || norm === "MANAGER";
};

/**
 * Returns true if the user has any authorized system role.
 */
export const isAuthorized = (role) => {
  const norm = normalizeRole(role);
  return ["ADMIN", "MANAGER", "STAFF"].includes(norm);
};
