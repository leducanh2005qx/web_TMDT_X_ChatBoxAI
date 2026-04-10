const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

// GET MY PROFILE
router.get("/me", authMiddleware, userController.getMe);

// UPDATE MY PROFILE
router.put("/me", authMiddleware, userController.updateMe);
router.get("/staff/created", authMiddleware, userController.getCreatedStaff);
router.get("/staff/pending", authMiddleware, userController.getPendingStaff);
router.get("/staff/active", authMiddleware, userController.getActiveStaff);
router.get("/staff/probation", authMiddleware, userController.getProbationStaff);
router.post("/staff", authMiddleware, userController.storeUser);
router.patch("/staff/:userId/official", authMiddleware, userController.approveOfficialStaff);
router.get("/inventory/logs", authMiddleware, userController.getInventoryLogs);
router.post("/inventory/restock", authMiddleware, userController.addInventoryStock);
router.post("/staff/work-logs", authMiddleware, userController.addStaffWorkLog);
router.get("/staff/payroll", authMiddleware, userController.getStaffPayroll);
router.get("/staff/payroll/me", authMiddleware, userController.getMyPayroll);
router.post("/staff/requests", authMiddleware, userController.createStaffRequest);
router.get("/staff/requests/my", authMiddleware, userController.getMyStaffRequests);
router.get("/staff/requests/pending", authMiddleware, userController.getPendingStaffRequests);
router.patch("/staff/requests/:requestId/decision", authMiddleware, userController.decideStaffRequest);
router.post("/staff/shifts", authMiddleware, userController.registerShift);
router.get("/staff/shifts/my", authMiddleware, userController.getMyShifts);
router.get("/staff/shifts/pending", authMiddleware, userController.getPendingShifts);
router.patch("/staff/shifts/:shiftId/decision", authMiddleware, userController.decideShift);
router.get("/attendance/me", authMiddleware, userController.getMyAttendanceStatus);
router.post("/attendance/clock-in", authMiddleware, userController.staffClockIn);
router.post("/attendance/clock-out", authMiddleware, userController.staffClockOut);
router.get("/attendance/issues", authMiddleware, userController.getAttendanceIssues);
router.patch("/attendance/sessions/:sessionId/fix-checkout", authMiddleware, userController.fixAttendanceCheckout);
router.patch("/staff/:userId/approve", authMiddleware, userController.approveUser);
router.patch("/staff/:userId/reject", authMiddleware, userController.rejectUser);

module.exports = router;
