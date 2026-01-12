# Email Notification System - Implementation Plan

## Overview

This document outlines the implementation plan for the order email notification system in the BC Flame Premium Client Portal. The system will send automated email notifications to customers when they create order inquiries and when the status of their orders changes.

## Architecture Decisions

### Email Provider: SendGrid

**Why SendGrid:**
- Free tier: 100 emails/day (sufficient for initial deployment)
- Reliable delivery rates and infrastructure
- Simple REST API integration (no SMTP complexity)
- Easy template management
- Good documentation and support

**Alternatives Considered:**
- Nodemailer with SMTP: More complex setup, requires SMTP credentials
- AWS SES: Cost-effective but requires AWS account setup
- Postmark: Excellent but smaller free tier

### Notification Strategy

#### Customer Notifications
1. **Order Creation**: Send confirmation email immediately after order inquiry is created
2. **Status Changes**: Send update email on all status transitions:
   - `pending` → `reviewing`: "Your order is now under review"
   - `reviewing` → `approved`: "Your order has been approved"
   - `reviewing` → `rejected`: "Your order requires revisions"
   - `approved` → `fulfilled`: "Your order has been fulfilled"

#### Admin Notifications
- **Phase 1 (Current)**: Dashboard-only (no email notifications)
- **Phase 2 (Future)**: Email alerts for new orders and status changes

### Email Trigger Points

**Strapi Lifecycle Hooks:**
- `afterCreate`: Triggered when a new order inquiry is created
- `afterUpdate`: Triggered when an order inquiry is updated (detect status changes)

**Batch Operations:**
- Special handling for batch order creation to send multiple emails efficiently

## Technical Architecture

### File Structure

```
backend/
├── config/
│   ├── plugins.ts                      # SendGrid email plugin configuration
│   └── custom.ts                       # Custom app configuration (NEW)
├── src/
│   ├── services/
│   │   ├── email-service.ts           # Email service wrapper (NEW)
│   │   └── email-service.test.ts      # Unit tests (NEW)
│   ├── templates/
│   │   └── emails/                     # Email HTML templates (NEW)
│   │       ├── order-confirmation.html
│   │       ├── status-reviewing.html
│   │       ├── status-approved.html
│   │       ├── status-rejected.html
│   │       └── status-fulfilled.html
│   └── api/
│       └── order-inquiry/
│           ├── content-types/
│           │   └── order-inquiry/
│           │       └── lifecycles.ts   # Update with email triggers
│           └── controllers/
│               └── order-inquiry.ts    # Update batch creation
└── tests/
    └── integration/
        └── email-notifications.test.ts # Integration tests (NEW)
```

### Environment Variables

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@bcflame.com
EMAIL_FROM_NAME=BC Flame Premium
EMAIL_REPLY_TO=support@bcflame.com

# Application URLs
FRONTEND_URL=http://localhost:3000

# Production values (when deploying)
# EMAIL_FROM_ADDRESS=noreply@yourdomain.com
# FRONTEND_URL=https://portal.yourdomain.com
```

## Implementation Phases

### Phase 1: Setup Email Infrastructure

**Tasks:**
1. Install SendGrid provider: `npm install @strapi/provider-email-sendgrid`
2. Configure environment variables in `.env` and `.env.example`
3. Update `config/plugins.ts` with SendGrid configuration
4. Create `config/custom.ts` for email settings

**Files Modified:**
- `/backend/package.json`
- `/backend/.env.example`
- `/backend/.env`
- `/backend/config/plugins.ts`
- `/backend/config/custom.ts` (NEW)

**Configuration Example:**

```typescript
// config/plugins.ts
export default ({ env }) => ({
  'users-permissions': {
    config: {
      // existing config...
    },
  },
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: env('EMAIL_FROM_ADDRESS'),
        defaultReplyTo: env('EMAIL_REPLY_TO'),
      },
    },
  },
});
```

### Phase 2: Create Email Service

**Task:** Build reusable email service wrapper

**File:** `/backend/src/services/email-service.ts`

**Responsibilities:**
- Load HTML templates from filesystem
- Populate templates with dynamic data (customer name, order details, etc.)
- Fetch related data (customer email, product details) from database
- Send emails via Strapi email plugin
- Handle errors gracefully (log but don't throw)
- Return success/failure status

**Key Methods:**

```typescript
interface EmailService {
  // Send order confirmation when inquiry is created
  sendOrderConfirmation(strapi: Strapi, orderInquiry: any): Promise<boolean>;

  // Send status update when inquiry status changes
  sendStatusUpdate(
    strapi: Strapi,
    orderInquiry: any,
    oldStatus: string,
    newStatus: string
  ): Promise<boolean>;

  // Load and populate HTML template
  loadTemplate(templateName: string, context: EmailContext): string;
}
```

**Data Required for Templates:**
- `inquiryNumber`: Unique inquiry number (e.g., INQ-20260113-1234)
- `customerName`: Customer's name from user profile
- `customerEmail`: Customer's email address
- `productName`: Name of the product being ordered
- `totalWeight`: Total weight of the order
- `weightUnit`: Unit of measurement (g, oz, lb)
- `submittedAt`: Date/time when order was submitted
- `orderDetailsUrl`: Link to view order in portal
- `reviewedBy`: Admin who reviewed the order (status updates only)
- `reviewedAt`: Date/time when reviewed (status updates only)
- `notes`: Admin notes or rejection reason (status updates only)

### Phase 3: Create Email Templates

**Task:** Design responsive HTML email templates

**Location:** `/backend/src/templates/emails/`

**Templates:**
1. `order-confirmation.html` - Sent when order is created
2. `status-reviewing.html` - Sent when status changes to "reviewing"
3. `status-approved.html` - Sent when status changes to "approved"
4. `status-rejected.html` - Sent when status changes to "rejected"
5. `status-fulfilled.html` - Sent when status changes to "fulfilled"

**Template Requirements:**
- Responsive design (mobile-friendly)
- Inline CSS for email client compatibility
- BC Flame branding (colors, logo)
- Clear call-to-action buttons
- Unsubscribe footer (future compliance)
- Professional and friendly tone

**Template Structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    /* Inline CSS styles */
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with logo -->
    <div class="header">
      <img src="logo-url" alt="BC Flame Premium">
    </div>

    <!-- Main content -->
    <div class="content">
      <h1>Hi {{customerName}},</h1>
      <p><!-- Email message --></p>

      <!-- Order details -->
      <div class="order-summary">
        <p><strong>Inquiry Number:</strong> {{inquiryNumber}}</p>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>Total Weight:</strong> {{totalWeight}} {{weightUnit}}</p>
        <p><strong>Submitted:</strong> {{submittedAt}}</p>
      </div>

      <!-- Call to action -->
      <a href="{{orderDetailsUrl}}" class="button">View Order Details</a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>BC Flame Premium | support@bcflame.com</p>
      <p><a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
```

**Variable Replacement:**
- Use `{{variableName}}` syntax for placeholders
- Email service will replace with actual values before sending

### Phase 4: Implement Lifecycle Hooks

**Task:** Update order inquiry lifecycle hooks to trigger email notifications

**File:** `/backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts`

#### 4.1: Update `afterCreate` Hook

**Purpose:** Send order confirmation email when new inquiry is created

```typescript
async afterCreate(event) {
  const { result } = event;

  try {
    // Call email service to send confirmation
    await strapi.service('api::order-inquiry.email-service')
      .sendOrderConfirmation(result);

    strapi.log.info(`Order confirmation email sent for: ${result.inquiry_number}`);
  } catch (error) {
    strapi.log.error(`Failed to send order confirmation email: ${error.message}`);
    // Don't throw - order creation should succeed even if email fails
  }
}
```

**Error Handling:**
- Log errors but don't throw exceptions
- Order creation must succeed even if email fails
- Failed emails logged for debugging

#### 4.2: Add `afterUpdate` Hook

**Purpose:** Send status update email when inquiry status changes

```typescript
async afterUpdate(event) {
  const { result, params } = event;

  try {
    // Fetch the previous state from database
    const previousInquiry = await strapi.db
      .query('api::order-inquiry.order-inquiry')
      .findOne({ where: { id: params.where.id } });

    // Check if status changed
    if (previousInquiry && previousInquiry.status !== result.status) {
      await strapi.service('api::order-inquiry.email-service')
        .sendStatusUpdate(result, previousInquiry.status, result.status);

      strapi.log.info(
        `Status update email sent for: ${result.inquiry_number} ` +
        `(${previousInquiry.status} → ${result.status})`
      );
    }
  } catch (error) {
    strapi.log.error(`Failed to send status update email: ${error.message}`);
    // Don't throw - order update should succeed even if email fails
  }
}
```

**Status Change Detection:**
- Query database for previous state before update
- Compare old status with new status
- Only send email if status actually changed
- Include both old and new status in email context

#### 4.3: Update Batch Creation Controller

**File:** `/backend/src/api/order-inquiry/controllers/order-inquiry.ts`

**Purpose:** Send confirmation emails for batch order creation

```typescript
async batchCreate(ctx) {
  try {
    // ... existing batch creation logic ...
    const createdInquiries = await createMultipleInquiries(data);

    // Send batch confirmation emails (asynchronous, non-blocking)
    Promise.all(
      createdInquiries.map(inquiry =>
        strapi.service('api::order-inquiry.email-service')
          .sendOrderConfirmation(inquiry)
          .catch(err => strapi.log.error(`Batch email failed: ${err.message}`))
      )
    );

    return ctx.send({ data: createdInquiries });
  } catch (error) {
    // ... existing error handling ...
  }
}
```

**Batch Email Strategy:**
- Don't await email sending (non-blocking)
- Use `Promise.all()` for parallel email delivery
- Catch individual email failures without blocking entire batch
- Log each failure separately for debugging

### Phase 5: Testing Strategy

#### 5.1: Unit Tests

**File:** `/backend/src/services/email-service.test.ts`

**Test Cases:**
- Template loading from filesystem
- Variable replacement in templates
- Email context building (customer data, product data)
- Error handling when email service fails
- Mock Strapi email plugin

**Example Test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import emailService from './email-service';

describe('Email Service', () => {
  it('should load and populate order confirmation template', () => {
    const context = {
      inquiryNumber: 'INQ-20260113-1234',
      customerName: 'John Doe',
      productName: 'Premium Flower',
      totalWeight: '100',
      weightUnit: 'g',
      submittedAt: '2026-01-13',
      orderDetailsUrl: 'http://localhost:3000/orders',
    };

    const html = emailService.loadTemplate('order-confirmation', context);

    expect(html).toContain('INQ-20260113-1234');
    expect(html).toContain('John Doe');
    expect(html).toContain('Premium Flower');
  });

  it('should handle email sending errors gracefully', async () => {
    const mockStrapi = {
      plugins: {
        email: {
          services: {
            email: {
              send: vi.fn().mockRejectedValue(new Error('SendGrid error')),
            },
          },
        },
      },
      log: {
        error: vi.fn(),
      },
    };

    const result = await emailService.sendOrderConfirmation(
      mockStrapi,
      mockOrderInquiry
    );

    expect(result).toBe(false);
    expect(mockStrapi.log.error).toHaveBeenCalled();
  });
});
```

#### 5.2: Integration Tests

**File:** `/backend/tests/integration/email-notifications.test.ts`

**Test Cases:**
- Order creation triggers email
- Status change triggers appropriate email
- Batch creation sends multiple emails
- Email failure doesn't break order creation
- Mock SendGrid API responses

**Example Test:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupStrapi, cleanupStrapi } from '../helpers/strapi';

describe('Email Notifications Integration', () => {
  beforeAll(async () => {
    await setupStrapi();
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  it('should send confirmation email when order is created', async () => {
    const response = await request(strapi.server.httpServer)
      .post('/api/order-inquiries')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderData)
      .expect(200);

    // Verify email was sent (check logs or mock email service)
    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        subject: expect.stringContaining('Order Confirmation'),
      })
    );
  });

  it('should send status update email when status changes', async () => {
    const inquiry = await createOrderInquiry();

    await request(strapi.server.httpServer)
      .put(`/api/order-inquiries/${inquiry.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ data: { status: 'approved' } })
      .expect(200);

    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        subject: expect.stringContaining('approved'),
      })
    );
  });
});
```

#### 5.3: Manual Testing Checklist

**Prerequisites:**
- [ ] SendGrid account created
- [ ] API key generated and verified
- [ ] Sender email address verified in SendGrid
- [ ] Environment variables configured in `.env`
- [ ] Backend restarted after configuration

**Order Creation:**
- [ ] Create order inquiry via frontend
- [ ] Check customer receives confirmation email
- [ ] Verify email contains correct inquiry number
- [ ] Verify email contains correct product details
- [ ] Verify email link to order details works

**Status Changes:**
- [ ] Update order status to "reviewing" via admin panel
- [ ] Check customer receives status update email
- [ ] Update status to "approved"
- [ ] Check customer receives approval email
- [ ] Update status to "rejected"
- [ ] Check customer receives rejection email with notes
- [ ] Update status to "fulfilled"
- [ ] Check customer receives fulfillment email

**Batch Operations:**
- [ ] Create multiple orders via batch endpoint
- [ ] Verify all customers receive confirmation emails
- [ ] Check all emails contain unique inquiry numbers

**Error Scenarios:**
- [ ] Test with invalid SendGrid API key
- [ ] Verify order creation still succeeds
- [ ] Check error is logged in Strapi logs
- [ ] Test with invalid customer email format
- [ ] Verify graceful error handling

**Email Quality:**
- [ ] Check emails in different clients (Gmail, Outlook, Apple Mail)
- [ ] Verify responsive design on mobile devices
- [ ] Check spam folder placement
- [ ] Verify all links work correctly
- [ ] Check email rendering in dark mode

### Phase 6: Error Handling & Resilience

#### 6.1: Graceful Email Failures

**Principles:**
- Email failures should never break order operations
- All errors must be logged for debugging
- Return boolean success/failure status from email service
- Use try-catch blocks around all email calls

**Error Scenarios:**
- Invalid SendGrid API key
- Network timeout
- Invalid recipient email address
- SendGrid rate limit exceeded
- Template file not found
- Missing customer email in database

**Logging Strategy:**

```typescript
// Success
strapi.log.info(`Order confirmation email sent for: ${inquiry.inquiry_number}`);

// Failure
strapi.log.error(`Failed to send email: ${error.message}`, {
  inquiryNumber: inquiry.inquiry_number,
  customerEmail: customer.email,
  errorStack: error.stack,
});
```

#### 6.2: Email Retry Logic (Future Enhancement)

**Current Approach:**
- Single send attempt
- Log failure and move on
- Manual retry by admin if needed

**Future Improvement:**
- Implement job queue (Bull, BullMQ)
- Store failed email attempts in database
- Automatic retry with exponential backoff
- Admin dashboard to view/retry failed emails

**Potential Implementation:**

```typescript
// Add to email service
async sendWithRetry(emailData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.send(emailData);
      return true;
    } catch (error) {
      if (attempt === maxRetries) {
        // Store in failed emails table
        await this.storeFailed EmailAttempt(emailData, error);
        return false;
      }
      // Wait before retry (exponential backoff)
      await this.sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

### Phase 7: Admin Email Support (Future)

**When to Implement:**
- After initial system is stable
- When admin team requests email notifications
- When dashboard monitoring becomes insufficient

**Implementation Steps:**

#### 7.1: Create Admin Settings

**Option A: Environment Variable**
```env
ADMIN_NOTIFICATION_EMAIL=admin@bcflame.com
```

**Option B: Database Configuration (Preferred)**
- Create "Email Settings" content type in Strapi
- Fields:
  - `admin_notification_email` (email)
  - `enable_admin_notifications` (boolean)
  - `notification_types` (JSON): Which events trigger emails

#### 7.2: Update Email Service

```typescript
// Add to email service
async sendAdminNotification(strapi: Strapi, orderInquiry: any) {
  // Fetch admin email from settings
  const settings = await strapi.db
    .query('api::email-setting.email-setting')
    .findOne();

  if (!settings?.enable_admin_notifications) {
    return false; // Admin notifications disabled
  }

  // Send summary email to admin
  await this.send({
    to: settings.admin_notification_email,
    subject: `New Order Inquiry: ${orderInquiry.inquiry_number}`,
    html: this.loadTemplate('admin-new-order', context),
  });
}
```

#### 7.3: Create Admin Templates

**Template:** `admin-new-order.html`
- Subject: "New Order Inquiry: INQ-20260113-1234"
- Content:
  - Customer name and email
  - Product ordered
  - Total weight
  - Link to review in admin panel
  - Quick approve/reject buttons (future)

**Template:** `admin-order-update.html`
- Subject: "Order Updated: INQ-20260113-1234"
- Content:
  - What changed (status, notes, etc.)
  - Updated by (customer or admin)
  - Link to view changes

## SendGrid Setup Guide

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com/
2. Sign up for free account (no credit card required)
3. Verify email address
4. Complete account setup

### Step 2: Verify Sender Identity

**Single Sender Verification (Easiest):**
1. Navigate to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter email address (e.g., noreply@bcflame.com)
4. Check email and click verification link
5. Wait for verification to complete

**Domain Authentication (Production):**
1. Navigate to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Follow DNS setup instructions
4. Add CNAME records to your domain DNS
5. Wait for verification (can take up to 48 hours)

### Step 3: Generate API Key

1. Navigate to Settings → API Keys
2. Click "Create API Key"
3. Name: "BC Flame Production" (or "Development")
4. Permissions: Select "Full Access" or "Mail Send" only
5. Click "Create & View"
6. **IMPORTANT:** Copy API key immediately (shown only once)
7. Save to `.env` file: `SENDGRID_API_KEY=SG.xxxx...`

### Step 4: Test Email Sending

**Using SendGrid API Testing Tool:**
1. Navigate to Email API → Integration Guide
2. Select "Web API" → "Node.js"
3. Use provided test code to send test email
4. Check inbox for test email

**Using Strapi:**
```bash
# Restart backend with new configuration
docker-compose restart strapi

# Check logs for email plugin initialization
docker-compose logs -f strapi
```

## Deployment Checklist

### Development Environment

- [ ] Install `@strapi/provider-email-sendgrid` package
- [ ] Configure `.env` with SendGrid credentials (use test API key)
- [ ] Update `config/plugins.ts` with email configuration
- [ ] Create `config/custom.ts` for app settings
- [ ] Restart Strapi backend
- [ ] Verify email plugin loaded (check Strapi logs)

### Email Service Implementation

- [ ] Create `/backend/src/services/email-service.ts`
- [ ] Implement `sendOrderConfirmation` method
- [ ] Implement `sendStatusUpdate` method
- [ ] Implement `loadTemplate` helper
- [ ] Add error handling and logging
- [ ] Write unit tests for email service
- [ ] Verify tests pass: `npm run test`

### Email Templates

- [ ] Create `/backend/src/templates/emails/` directory
- [ ] Create `order-confirmation.html` template
- [ ] Create `status-reviewing.html` template
- [ ] Create `status-approved.html` template
- [ ] Create `status-rejected.html` template
- [ ] Create `status-fulfilled.html` template
- [ ] Test template rendering with sample data
- [ ] Verify responsive design on mobile

### Lifecycle Hooks

- [ ] Update `afterCreate` hook in lifecycles.ts
- [ ] Add `afterUpdate` hook for status changes
- [ ] Update batch creation controller
- [ ] Add error handling to all hooks
- [ ] Test order creation triggers email
- [ ] Test status updates trigger emails
- [ ] Test batch creation sends multiple emails

### Testing

- [ ] Run unit tests: `cd backend && npm run test`
- [ ] Run integration tests
- [ ] Manual test: Create order via frontend
- [ ] Manual test: Update order status via admin panel
- [ ] Test all status transitions (pending → fulfilled)
- [ ] Verify email content accuracy
- [ ] Check email deliverability (spam folder)
- [ ] Test error scenario (invalid API key)

### Production Deployment

- [ ] Set up production SendGrid account
- [ ] Verify sender domain (not just single sender)
- [ ] Generate production API key with Mail Send permission only
- [ ] Update production `.env` with secure credentials
- [ ] Set `EMAIL_FROM_ADDRESS` to verified domain email
- [ ] Set `FRONTEND_URL` to production URL
- [ ] Deploy backend with new configuration
- [ ] Monitor Strapi logs for email send status
- [ ] Set up SendGrid webhook for delivery tracking
- [ ] Configure SendGrid alerts for delivery issues
- [ ] Document email configuration in team wiki

## Monitoring & Maintenance

### SendGrid Dashboard Metrics

**Activity Feed:**
- Track email delivery status (delivered, bounced, dropped)
- Monitor open rates and click rates
- View bounce reasons (invalid email, mailbox full, etc.)

**Stats:**
- Daily email volume
- Delivery rates
- Bounce rates
- Spam report rates

**Alerts:**
- Set up alerts for high bounce rates
- Alert for approaching daily limit (100 emails/day on free tier)
- Alert for blocked emails

### Strapi Logs Monitoring

**Email Success Logs:**
```
[info] Order confirmation email sent for: INQ-20260113-1234
[info] Status update email sent for: INQ-20260113-5678 (pending → approved)
```

**Email Failure Logs:**
```
[error] Failed to send order confirmation email: Invalid API key
[error] Failed to send status update email: Network timeout
```

**Monitoring Commands:**
```bash
# Watch live logs
docker-compose logs -f strapi

# Filter email-related logs
docker-compose logs strapi | grep "email"

# Check recent email errors
docker-compose logs --tail=100 strapi | grep "Failed to send"
```

### Performance Considerations

**Current Limits:**
- SendGrid free tier: 100 emails/day
- Batch creation: No limit on number of orders
- Email sending: Asynchronous, non-blocking

**Scaling Strategy:**
- Monitor daily email volume in SendGrid dashboard
- Upgrade to paid plan before hitting limit
- Consider email queueing for high-volume batches
- Implement rate limiting for API endpoints

### Troubleshooting Guide

**Problem: Emails not being sent**

Possible causes:
1. Invalid SendGrid API key
2. Sender email not verified
3. Email plugin not loaded
4. Customer email missing in database

Solutions:
- Check Strapi logs for error messages
- Verify API key in SendGrid dashboard
- Verify sender identity in SendGrid
- Check customer user profile has email

**Problem: Emails going to spam**

Possible causes:
1. Sender domain not authenticated
2. High spam complaint rate
3. Poor email content (too many links, spammy words)

Solutions:
- Set up domain authentication in SendGrid
- Review email templates for spam triggers
- Add unsubscribe link to all emails
- Monitor spam reports in SendGrid dashboard

**Problem: Emails delayed**

Possible causes:
1. SendGrid processing queue
2. Network latency
3. Recipient mail server delays

Solutions:
- Check SendGrid activity feed for delivery status
- Monitor Strapi response times
- Consider implementing email queue for retries

**Problem: Wrong data in emails**

Possible causes:
1. Template variable mismatch
2. Missing populated relations
3. Incorrect data fetching in email service

Solutions:
- Review email service context building
- Verify database relations are populated correctly
- Add logging to track data flow
- Write unit tests for data formatting

## Future Enhancements

### 1. Email Queue with Job Processing
- Implement Bull or BullMQ for reliable email delivery
- Retry failed emails with exponential backoff
- Store email history in database
- Admin dashboard to view/retry failed emails

### 2. Email Analytics
- Track email opens and clicks via SendGrid webhooks
- Store analytics in database
- Display metrics in admin dashboard
- A/B test email templates for better engagement

### 3. Advanced Templating
- Use Handlebars or EJS for complex templates
- Support conditional content based on order type
- Multi-language template support
- Template versioning and A/B testing

### 4. Email Preferences
- Allow customers to opt-out of certain notifications
- Frequency capping (daily digest instead of real-time)
- Preferred contact methods (email, SMS, both)
- Notification preferences in user settings page

### 5. Rich Email Content
- Attach order details as PDF
- Include product images from CDN
- Dynamic pricing tables
- Interactive elements (buttons, surveys)

### 6. SMS Notifications
- Integrate Twilio for SMS alerts
- Send SMS for critical status changes (approved, rejected)
- SMS for time-sensitive updates
- Two-factor authentication for sensitive actions

### 7. Admin Notification Enhancements
- Real-time email alerts for new orders
- Daily summary digest of all orders
- Alerts for orders pending review > 24 hours
- Customizable notification rules per admin

### 8. Email Compliance
- GDPR-compliant unsubscribe mechanism
- Email consent tracking
- Data retention policies
- Audit log for all emails sent

## Cost Analysis

### SendGrid Free Tier
- **Limit:** 100 emails/day
- **Cost:** $0/month
- **Suitable for:** Development, small deployments, initial launch

**Estimated Usage:**
- 10 orders/day = 10 confirmation + 30 status updates = 40 emails/day
- Comfortable within free tier limits

### SendGrid Essentials Plan
- **Limit:** 50,000 emails/month (~1,600/day)
- **Cost:** $19.95/month
- **Suitable for:** Production with moderate volume

### SendGrid Pro Plan
- **Limit:** 100,000 emails/month (~3,300/day)
- **Cost:** $89.95/month
- **Suitable for:** High-volume production

**Recommendation:**
- Start with free tier for development and initial launch
- Monitor usage via SendGrid dashboard
- Upgrade to Essentials when approaching 80% of daily limit
- Consider email queueing and batching before upgrading to Pro

## Documentation Updates

After implementation, update the following documentation:

### CLAUDE.md
- Add email notification system to Project Status
- Document SendGrid setup requirements
- Add email-related environment variables
- Update testing section with email test instructions

### README.md
- Add SendGrid to prerequisites
- Document email configuration steps
- Add troubleshooting section for email issues

### API Documentation
- Document email triggers and timing
- List all email types and templates
- Explain email failure handling
- Add email testing endpoints (dev only)

## Summary

This implementation plan provides a comprehensive roadmap for building a reliable, scalable email notification system for the BC Flame Premium Client Portal. The system prioritizes customer experience while maintaining operational resilience through graceful error handling and non-blocking email delivery.

**Key Success Metrics:**
- Email delivery rate > 95%
- Order creation always succeeds regardless of email status
- Customer satisfaction with timely notifications
- Zero email-related system downtime

**Timeline Estimate:**
- Phase 1-2 (Infrastructure + Service): 1-2 days
- Phase 3 (Templates): 1 day
- Phase 4 (Lifecycle Hooks): 1 day
- Phase 5 (Testing): 1-2 days
- **Total:** 4-6 days of development time

**Next Steps:**
1. Review and approve this plan
2. Create SendGrid account and get API key
3. Begin Phase 1 implementation
4. Test incrementally after each phase
5. Deploy to production with monitoring
