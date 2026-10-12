const FRIENDLY_MESSAGES = {
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 8 characters.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'permission-denied': 'You do not have permission to perform this action.',
  'PERMISSION_DENIED': 'You do not have permission to perform this action.',
};

export function errorMessage(err) {
  const code = err?.code || '';
  return FRIENDLY_MESSAGES[code] || err?.message || 'Something went wrong. Please try again.';
}
