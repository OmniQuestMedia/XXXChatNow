import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ModelMoodState } from '../schemas/mood-state.schema';
import { MoodState, TemplateType, TierLevel } from '../constants';
import { DBLoggerService } from 'src/modules/logger';

/**
 * Mood Messaging Service
 * Implements Phase 6: Mood Messaging for TIP_GRID_ITEM settlements
 * Reference: MOOD_MESSAGING_BRIEFING.md
 */
@Injectable()
export class MoodMessagingService {
  // Default templates as per MOOD_MESSAGING_BRIEFING.md section on templates
  private readonly defaultTemplates = {
    [MoodState.NEUTRAL]: {
      [TemplateType.TIP_THANK_YOU]: {
        [TierLevel.FREE]: 'Thank you {{userName}} for the {{amount}} token tip! 😊',
        [TierLevel.BRONZE]: 'Thank you {{userName}} for the {{amount}} token tip! 💛',
        [TierLevel.SILVER]: 'Thank you {{userName}} for the {{amount}} token tip! Much appreciated! ✨',
        [TierLevel.GOLD]: 'Thank you so much {{userName}} for the {{amount}} token tip! You\'re a valued supporter! 💎',
        [TierLevel.PLATINUM]: 'Thank you SO much {{userName}} for the {{amount}} token tip! You\'re amazing! 🌟',
        default: 'Thank you {{userName}} for the {{amount}} token tip!'
      }
    },
    [MoodState.POSITIVE]: {
      [TemplateType.TIP_THANK_YOU]: {
        [TierLevel.FREE]: 'Wow! Thank you {{userName}} for the {{amount}} tokens! You made my day! 🎉',
        [TierLevel.BRONZE]: 'YES! Thank you {{userName}} for the {{amount}} tokens! So happy! 💛✨',
        [TierLevel.SILVER]: 'Amazing! Thank you {{userName}} for the {{amount}} tokens! You\'re the best! 🌟',
        [TierLevel.GOLD]: 'WOW! 🌟 Thank you SO much {{userName}} for the {{amount}} tokens! You\'re incredible! 💎',
        [TierLevel.PLATINUM]: 'OMG! 🎊 Thank you {{userName}} for the {{amount}} tokens! You\'re absolutely AMAZING! 💖✨',
        default: 'Wow! Thank you {{userName}} for the {{amount}} token tip! 😊🎉'
      }
    },
    [MoodState.NEGATIVE]: {
      [TemplateType.TIP_THANK_YOU]: {
        [TierLevel.FREE]: 'Thanks {{userName}} for the {{amount}} tokens.',
        [TierLevel.BRONZE]: 'Thanks {{userName}} for the {{amount}} tokens. I appreciate it.',
        [TierLevel.SILVER]: 'Thank you {{userName}} for the {{amount}} tokens. Much appreciated.',
        [TierLevel.GOLD]: 'Thank you {{userName}} for the {{amount}} tokens. That means a lot.',
        [TierLevel.PLATINUM]: 'Thank you {{userName}} for the {{amount}} tokens. You\'re very supportive.',
        default: 'Thanks {{userName}} for the {{amount}} tokens.'
      }
    }
  };

  constructor(
    @InjectModel(ModelMoodState.name) private readonly MoodStateModel: Model<ModelMoodState>,
    private readonly logger: DBLoggerService
  ) {}

  /**
   * Get mood state for a performer
   * Returns NEUTRAL as default if no state exists (graceful degradation)
   * 
   * @param performerId The performer's ID
   * @returns The mood state or default NEUTRAL
   */
  async getMoodState(performerId: string | Types.ObjectId): Promise<MoodState> {
    try {
      const moodState = await this.MoodStateModel.findOne({ 
        modelId: performerId 
      }).lean();

      if (!moodState) {
        return MoodState.NEUTRAL;
      }

      // Check if expired
      if (moodState.expiresAt && new Date() > moodState.expiresAt) {
        return MoodState.NEUTRAL;
      }

      return moodState.moodState;
    } catch (error) {
      this.logger.error('Error fetching mood state, defaulting to NEUTRAL', {
        context: 'MoodMessagingService',
        error: error.stack || error.message,
        performerId: performerId.toString()
      });
      // Graceful degradation - return neutral on error
      return MoodState.NEUTRAL;
    }
  }

  /**
   * Render a mood-based message template
   * Implements template variable substitution
   * 
   * @param performerId The performer's ID
   * @param templateType Type of template to render
   * @param userTier User's tier level
   * @param variables Variables to substitute in template
   * @returns Rendered message string
   */
  async renderTemplate(
    performerId: string | Types.ObjectId,
    templateType: TemplateType,
    userTier: TierLevel | null,
    variables: Record<string, any>
  ): Promise<string> {
    try {
      // Get mood state
      const moodState = await this.getMoodState(performerId);

      // Get template for mood, type, and tier
      const template = this.getTemplate(moodState, templateType, userTier);

      // Substitute variables
      return this.substituteVariables(template, variables);
    } catch (error) {
      this.logger.error('Error rendering mood template', {
        context: 'MoodMessagingService',
        error: error.stack || error.message,
        performerId: performerId.toString(),
        templateType
      });
      
      // Graceful degradation - return generic message
      return this.getGenericFallbackMessage(templateType, variables);
    }
  }

  /**
   * Get template based on mood state, template type, and user tier
   * 
   * @param moodState Current mood state
   * @param templateType Type of template
   * @param userTier User tier level
   * @returns Template string
   */
  private getTemplate(
    moodState: MoodState,
    templateType: TemplateType,
    userTier: TierLevel | null
  ): string {
    const moodTemplates = this.defaultTemplates[moodState];
    
    if (!moodTemplates || !moodTemplates[templateType]) {
      // Fallback to neutral mood
      return this.defaultTemplates[MoodState.NEUTRAL][templateType]?.default || '';
    }

    const typeTemplates = moodTemplates[templateType];
    
    // Try to get tier-specific template, fallback to default
    if (userTier && typeTemplates[userTier]) {
      return typeTemplates[userTier];
    }

    return typeTemplates.default || typeTemplates[TierLevel.FREE] || '';
  }

  /**
   * Substitute variables in template
   * Replaces {{variableName}} with actual values
   * 
   * @param template Template string with {{variables}}
   * @param variables Object with variable values
   * @returns Processed template string
   */
  private substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Get generic fallback message when template rendering fails
   * 
   * @param templateType Type of template
   * @param variables Variables object
   * @returns Generic fallback message
   */
  private getGenericFallbackMessage(
    templateType: TemplateType,
    variables: Record<string, any>
  ): string {
    if (templateType === TemplateType.TIP_THANK_YOU) {
      return `Thank you ${variables.userName || 'for the tip'}!`;
    }
    return 'Thank you!';
  }
}
