# Model Mood Messaging - Visibility & Analytics

## Overview

This document describes the visibility controls and analytics capabilities for the Model Mood Messaging System. It defines what data is collected, how it's used, and what insights are provided to models and administrators.

## Visibility Controls

### Public vs Private Responses

#### Public Responses
- **Visibility**: Visible to all users in public chat/stream
- **Use Cases**:
  - Gratitude for tips
  - Public announcements
  - General greetings
- **Storage**: Not logged to message history
- **Privacy**: No user-specific information included

#### Private Responses
- **Visibility**: Only visible to the specific user in private messages
- **Use Cases**:
  - Personal acknowledgments
  - Direct message replies
  - Private gratitude
- **Storage**: Metadata logged (no content)
- **Privacy**: User ID and performer ID associated

### Model Configuration Visibility

- **Own Configuration**: Models can view and edit their own configuration
- **Other Models**: No access to other models' configurations
- **Admin**: Admins can view all configurations (read-only analytics)

## Analytics Data Collection

### What is Collected

#### Response Usage Metrics
```typescript
{
  performerId: ObjectId,      // Which model used the response
  bucketId: ObjectId,         // Which mood bucket was selected
  bucketName: string,         // Name of the bucket (e.g., "happy")
  responseIndex: number,      // Which response in the bucket (for distribution analysis)
  timestamp: Date,            // When the response was used
  context: {
    messageType: string,      // "tip", "gift", "message", "greeting"
    amount?: number           // Tip/gift amount if applicable
  }
}
```

#### Configuration Change Metrics
```typescript
{
  performerId: ObjectId,
  action: string,             // "update", "restore_defaults", "enable_bucket", "disable_bucket"
  changedFields: string[],    // Which fields were modified
  timestamp: Date,
  userId: ObjectId            // Admin or model who made the change
}
```

### What is NOT Collected

❌ **Never Collected:**
- User message content
- User personally identifiable information (PII)
- User names or usernames in response history
- Payment card information
- User location or device information
- Conversation context or history

## Analytics Dashboard (Future)

### Model-Facing Analytics

Models should be able to see:

1. **Response Usage Summary**
   - Total responses sent (by bucket)
   - Most-used mood bucket
   - Response distribution graph
   - Usage trends over time

2. **Engagement Metrics**
   - Average response time
   - User engagement rate after response
   - Return visitor rate

3. **Configuration History**
   - When configurations were changed
   - What was changed
   - Comparison to defaults

### Admin-Facing Analytics

Administrators should be able to see:

1. **System-Wide Metrics**
   - Total responses sent across all models
   - Most popular mood buckets
   - Adoption rate (% of models using the feature)
   - Average custom responses per model

2. **Performance Metrics**
   - API response times
   - Error rates
   - Rate limit hits
   - Database query performance

3. **Usage Patterns**
   - Peak usage times
   - Geographic distribution (if available)
   - Bucket popularity trends

## Algorithm Input Mappings

### Mood Detection (Future Feature)

When automated mood detection is implemented, the following mappings will be used:

#### Text Sentiment Analysis
```typescript
interface SentimentScore {
  positive: number;    // 0.0 - 1.0
  negative: number;    // 0.0 - 1.0
  neutral: number;     // 0.0 - 1.0
}

function mapSentimentToBucket(sentiment: SentimentScore): string {
  if (sentiment.positive > 0.6) return 'happy';
  if (sentiment.negative > 0.6) return 'sad';
  if (sentiment.negative > 0.7 && /* anger indicators */) return 'angry';
  return 'neutral';
}
```

#### Context-Based Selection
```typescript
interface MessageContext {
  messageType: 'tip' | 'gift' | 'message' | 'greeting';
  amount?: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userHistory?: {
    previousInteractions: number;
    totalSpent: number;
  };
}

function selectBucket(context: MessageContext): string {
  // Tips always use gratitude responses
  if (context.messageType === 'tip') {
    return 'public_gratitude';
  }
  
  // First-time users get neutral/welcoming responses
  if (!context.userHistory || context.userHistory.previousInteractions === 0) {
    return 'neutral';
  }
  
  // High-value supporters get enthusiastic responses
  if (context.userHistory.totalSpent > 1000) {
    return 'happy';
  }
  
  // Default to neutral
  return 'neutral';
}
```

## Privacy Compliance

### Data Retention

- **Response Usage Metrics**: Retained for 90 days
- **Configuration History**: Retained indefinitely
- **Aggregated Analytics**: Retained indefinitely
- **User-Specific Data**: Anonymized after 30 days

### Data Access Controls

1. **Models**: Can only access their own analytics
2. **Admins**: Can access system-wide aggregated analytics
3. **API**: No public access to analytics data
4. **Exports**: Analytics exports are sanitized and anonymized

### GDPR Compliance

- Users can request deletion of their interaction history
- No PII is stored in the mood messaging system
- Data is processed only for stated purposes
- Clear consent mechanisms for data collection

## Audit Trail

All actions on the mood messaging system are logged for audit purposes:

```typescript
interface AuditLog {
  action: string;              // "select_response", "update_config", "restore_defaults"
  performerId: ObjectId;
  userId?: ObjectId;           // If user-initiated
  adminId?: ObjectId;          // If admin action
  details: {
    bucketId?: ObjectId;
    changesMade?: object;
    reasonCode?: string;
  };
  ipAddress: string;           // Hashed for privacy
  timestamp: Date;
  result: 'success' | 'failure';
  errorMessage?: string;
}
```

### Audit Log Retention

- Stored for 1 year minimum
- Critical security events stored for 7 years
- Available for security investigations
- Access restricted to security team and auditors

## Performance Monitoring

### Key Performance Indicators (KPIs)

1. **Response Time**
   - Target: < 100ms for response selection
   - Alert threshold: > 500ms

2. **Availability**
   - Target: 99.9% uptime
   - Alert threshold: < 99.5%

3. **Error Rate**
   - Target: < 0.1% of requests
   - Alert threshold: > 1%

4. **Rate Limit Hits**
   - Target: < 5% of users hitting limits
   - Alert threshold: > 10%

### Monitoring Tools

- Real-time API metrics dashboard
- Error tracking and alerting
- Performance profiling
- Database query monitoring
- Cache hit/miss rates

## Reporting

### Daily Reports

- Total responses sent
- Top-performing buckets
- Error summary
- Performance metrics

### Weekly Reports

- Usage trends
- New model adoption
- Configuration changes
- User engagement metrics

### Monthly Reports

- Comprehensive analytics summary
- Comparative analysis (month-over-month)
- Feature usage statistics
- Recommendations for optimization

## Data Export

### Available Exports

1. **Model Analytics Export** (CSV)
   - Own usage statistics
   - Response distribution
   - Configuration history

2. **Admin Analytics Export** (CSV)
   - System-wide statistics
   - Aggregated usage data
   - Performance metrics

3. **Audit Log Export** (JSON)
   - Security team only
   - Complete audit trail
   - Filtered by date range

### Export Security

- All exports require authentication
- Exports are rate-limited
- Export access is logged
- Exports are encrypted in transit
- Personal data is redacted

## Future Analytics Features

### Planned Enhancements

1. **Predictive Analytics**
   - Predict best response based on user history
   - Suggest optimal mood buckets for time of day
   - Forecast user engagement

2. **A/B Testing Framework**
   - Test response effectiveness
   - Compare custom vs. default responses
   - Measure engagement impact

3. **Machine Learning Insights**
   - Automated mood detection accuracy
   - Response recommendation engine
   - Anomaly detection for unusual patterns

4. **Real-Time Dashboard**
   - Live response usage
   - Active models using the feature
   - Current system health

5. **Comparative Benchmarks**
   - Compare performance to similar models
   - Industry benchmarks (anonymized)
   - Best practices recommendations
