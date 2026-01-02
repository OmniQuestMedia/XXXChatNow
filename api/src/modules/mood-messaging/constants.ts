/**
 * Mood Messaging Constants
 */

// Mood bucket names
export const MOOD_BUCKET_HAPPY = 'happy';
export const MOOD_BUCKET_SAD = 'sad';
export const MOOD_BUCKET_ANGRY = 'angry';
export const MOOD_BUCKET_NEUTRAL = 'neutral';
export const MOOD_BUCKET_TIP_GRATITUDE = 'tip_gratitude';
export const MOOD_BUCKET_GIFT_GRATITUDE = 'gift_gratitude';
export const MOOD_BUCKET_GENERAL_GRATITUDE = 'general_gratitude';
export const MOOD_BUCKET_NEW_FOLLOWER_GRATITUDE = 'new_follower_gratitude';

// Categories
export const CATEGORY_PUBLIC_GRATITUDE = 'public_gratitude';
export const CATEGORY_PRIVATE_MICRO = 'private_micro';

// Visibility options
export const VISIBILITY_PUBLIC = 'public';
export const VISIBILITY_PRIVATE = 'private';

// Message types for context
export const MESSAGE_TYPE_TIP = 'tip';
export const MESSAGE_TYPE_GIFT = 'gift';
export const MESSAGE_TYPE_MESSAGE = 'message';
export const MESSAGE_TYPE_GREETING = 'greeting';
export const MESSAGE_TYPE_FOLLOW = 'follow';

// Default settings
export const DEFAULT_AUTO_RESPOND = false;
export const DEFAULT_RESPONSE_DELAY = 2;
export const DEFAULT_DAILY_LIMIT = 100;

// Rate limiting
export const RATE_LIMIT_SELECT_RESPONSE = 30; // requests per minute
export const RATE_LIMIT_UPDATE_CONFIG = 10; // requests per minute

// Validation limits
export const MAX_CUSTOM_RESPONSES_PER_BUCKET = 50;
export const MIN_CUSTOM_RESPONSES_PER_BUCKET = 1;
export const MAX_RESPONSE_LENGTH = 500;
export const MIN_RESPONSE_LENGTH = 1;
