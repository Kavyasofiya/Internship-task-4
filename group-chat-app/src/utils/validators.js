const { body, param, query, validationResult } = require('express-validator');

// Custom validators
const isObjectId = (value) => {
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

const isValidUsername = (value) => {
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(value)) {
    throw new Error('Username must be 3-30 characters and contain only letters, numbers, and underscores');
  }
  return true;
};

const isStrongPassword = (value) => {
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(value)) {
    throw new Error('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character');
  }
  return true;
};

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .custom(isValidUsername),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .custom(isStrongPassword),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  validate
];

const loginValidator = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

// User validators
const updateProfileValidator = [
  body('username')
    .optional()
    .custom(isValidUsername),
  
  body('profilePicture')
    .optional()
    .isURL().withMessage('Profile picture must be a valid URL'),
  
  validate
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .custom(isStrongPassword)
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  validate
];

// Group validators
const createGroupValidator = [
  body('name')
    .notEmpty().withMessage('Group name is required')
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Group name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('isAdminOnly')
    .optional()
    .isBoolean().withMessage('isAdminOnly must be a boolean value'),
  
  validate
];

const updateGroupValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Group name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  validate
];

const groupIdValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  validate
];

const addMemberValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .custom(isObjectId).withMessage('Invalid user ID'),
  
  body('role')
    .optional()
    .isIn(['admin', 'member']).withMessage('Role must be either "admin" or "member"'),
  
  validate
];

const removeMemberValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  param('userId')
    .custom(isObjectId).withMessage('Invalid user ID'),
  
  validate
];

const updateRoleValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  param('userId')
    .custom(isObjectId).withMessage('Invalid user ID'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'member']).withMessage('Role must be either "admin" or "member"'),
  
  validate
];

const muteMemberValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  param('userId')
    .custom(isObjectId).withMessage('Invalid user ID'),
  
  body('minutes')
    .optional()
    .isInt({ min: 1, max: 10080 }).withMessage('Minutes must be between 1 and 10080 (7 days)'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters'),
  
  validate
];

// Message validators
const sendMessageValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  body('content')
    .notEmpty().withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'system']).withMessage('Invalid message type'),
  
  body('fileUrl')
    .optional()
    .isURL().withMessage('File URL must be a valid URL'),
  
  body('fileName')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('File name cannot exceed 255 characters'),
  
  validate
];

const getMessagesValidator = [
  param('groupId')
    .custom(isObjectId).withMessage('Invalid group ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('before')
    .optional()
    .isISO8601().withMessage('Invalid date format for "before" parameter'),
  
  query('after')
    .optional()
    .isISO8601().withMessage('Invalid date format for "after" parameter'),
  
  validate
];

const messageIdValidator = [
  param('messageId')
    .custom(isObjectId).withMessage('Invalid message ID'),
  
  validate
];

// Search validators
const searchUsersValidator = [
  query('query')
    .notEmpty().withMessage('Search query is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Search query must be between 2 and 50 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  validate
];

const searchGroupsValidator = [
  query('query')
    .notEmpty().withMessage('Search query is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Search query must be between 2 and 50 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  validate
];

// Socket event validators
const socketValidators = {
  validateSendMessage: (data) => {
    const errors = [];
    
    if (!data.groupId || !/^[0-9a-fA-F]{24}$/.test(data.groupId)) {
      errors.push('Invalid group ID');
    }
    
    if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
      errors.push('Message content is required');
    }
    
    if (data.content && data.content.trim().length > 2000) {
      errors.push('Message cannot exceed 2000 characters');
    }
    
    if (data.messageType && !['text', 'image', 'file', 'system'].includes(data.messageType)) {
      errors.push('Invalid message type');
    }
    
    return errors;
  },
  
  validateJoinGroups: (groupIds) => {
    const errors = [];
    
    if (!Array.isArray(groupIds)) {
      return ['groupIds must be an array'];
    }
    
    groupIds.forEach((groupId, index) => {
      if (!/^[0-9a-fA-F]{24}$/.test(groupId)) {
        errors.push(`Invalid group ID at index ${index}`);
      }
    });
    
    return errors;
  },
  
  validateTyping: (data) => {
    const errors = [];
    
    if (!data.groupId || !/^[0-9a-fA-F]{24}$/.test(data.groupId)) {
      errors.push('Invalid group ID');
    }
    
    if (typeof data.isTyping !== 'boolean') {
      errors.push('isTyping must be a boolean');
    }
    
    return errors;
  },
  
  validateMessageRead: (data) => {
    const errors = [];
    
    if (!data.messageId || !/^[0-9a-fA-F]{24}$/.test(data.messageId)) {
      errors.push('Invalid message ID');
    }
    
    if (!data.groupId || !/^[0-9a-fA-F]{24}$/.test(data.groupId)) {
      errors.push('Invalid group ID');
    }
    
    return errors;
  }
};

// Export all validators
module.exports = {
  validate,
  isObjectId,
  isValidUsername,
  isStrongPassword,
  
  // Auth
  registerValidator,
  loginValidator,
  
  // User
  updateProfileValidator,
  changePasswordValidator,
  
  // Group
  createGroupValidator,
  updateGroupValidator,
  groupIdValidator,
  addMemberValidator,
  removeMemberValidator,
  updateRoleValidator,
  muteMemberValidator,
  
  // Message
  sendMessageValidator,
  getMessagesValidator,
  messageIdValidator,
  
  // Search
  searchUsersValidator,
  searchGroupsValidator,
  
  // Socket
  socketValidators
};