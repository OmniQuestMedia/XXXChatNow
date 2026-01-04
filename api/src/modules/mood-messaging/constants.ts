/* eslint-disable no-shadow */

/**
 * Mood state enum as defined in MOOD_MESSAGING_BRIEFING.md
 */
export enum MoodState {
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  NEGATIVE = 'negative'
}

/**
 * Template types for mood-based messaging
 */
export enum TemplateType {
  GREETING = 'greeting',
  FAREWELL = 'farewell',
  AUTO_RESPONSE = 'auto_response',
  TIP_THANK_YOU = 'tip_thank_you'
}

/**
 * User tier levels for personalized templates
 */
export enum TierLevel {
  FREE = 'free',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}
