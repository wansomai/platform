# Law School Event Registration & Opt-In System

## Overview

This system handles event registration for the Law School AI Launch Event and provides a seamless opt-in flow for Wansom Pro access.

## Implementation Complete

✅ Database schema with `EventRegistration` model
✅ Event registration API endpoint
✅ Opt-in API with auto-account creation
✅ Email templates for registration and credentials
✅ Auto-login after opt-in

---

## API Endpoints

### 1. Event Registration

**Endpoint**: `POST https://www.wansom.ai/api/events/law-school-launch/register`

**Purpose**: Register a user for the law school launch event

**Request Body**:
```json
{
  "name": "John Doe",
  "institution": "Strathmore Law School",
  "email": "john@strathmore.edu",
  "registrationType": "student",
  "competitions": ["Moot Court", "Mock Trial"]
}
```

**Response (Success - 201)**:
```json
{
  "status": 201,
  "message": "Registration successful! Check your email for next steps.",
  "data": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@strathmore.edu",
    "institution": "Strathmore Law School"
  }
}
```

**Response (Error - 400)**:
```json
{
  "status": 400,
  "message": "This email is already registered for the event."
}
```

**What Happens**:
1. Validates the registration data
2. Creates an `EventRegistration` record
3. Generates a unique `optInToken`
4. Sends confirmation email with opt-in button

---

### 2. Opt-In Flow (Auto-Create Account)

**Entry Point**: `GET /api/events/opt-in?token={optInToken}`

**Purpose**: Redirect to opt-in page with loading UI

**Flow**:
1. User clicks "Activate Wansom Pro Access" in email
2. Redirects to `/events/opt-in?token={token}` (loading page)
3. Loading page shows animated UI while calling activation API
4. Activation API (`GET /api/events/opt-in/activate?token={token}`) processes:
   - Validates the opt-in token
   - Checks if account already exists
   - Generates secure random password (12 chars)
   - Creates User + Organization
   - Sends credentials email
   - Sets auth cookies
   - Returns success
5. User is automatically redirected to `/dashboard`

**User Experience**:
- ✅ Professional loading UI with animation
- ✅ Clear status messages
- ✅ Automatic redirect to dashboard
- ✅ Email with credentials sent

**API Response** (`/api/events/opt-in/activate`):
```json
{
  "status": 200,
  "message": "Account activated successfully!",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@university.edu",
      "fullName": "John Doe",
      "organizationName": "University Name"
    }
  }
}
```

---

## Integration with External Event Website

Your external event registration website should POST to the registration endpoint:

```javascript
// Example integration
async function registerForEvent(formData) {
  const response = await fetch('https://wansom.ai/api/events/law-school-launch/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: formData.name,
      institution: formData.institution,
      email: formData.email,
      registrationType: formData.registrationType,
      competitions: formData.competitions,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    // Show success message
    console.log('Registration successful!');
  } else {
    // Show error message
    console.error(data.message);
  }
}
```

---

## Email Flow

### Email 1: Registration Confirmation (Sent Immediately)

**Subject**: "You're Registered for the Law School AI Launch Event!"

**Content**:
- Event details
- Wansom Pro offer explanation
- **CTA Button**: "Activate Wansom Pro Access" → Links to opt-in endpoint
- Benefits of Wansom Pro

**Template**: `src/lib/event-email-templates.ts::sendEventRegistrationEmail()`

---

### Email 2: Credentials Email (Sent After Opt-In)

**Subject**: "Welcome to Wansom Pro - Your Access Details"

**Content**:
- Login credentials (email + auto-generated password)
- **CTA Button**: "Login to Wansom Pro"
- Getting started steps
- Security reminder to change password

**Template**: `src/lib/event-email-templates.ts::sendWansomProCredentialsEmail()`

---

## Database Schema

```prisma
model EventRegistration {
  id                String    @id @default(cuid())
  name              String
  institution       String
  email             String    @unique
  registrationType  String
  competitions      String[]
  hasOptedIn        Boolean   @default(false)
  optInToken        String?   @unique
  accountCreated    Boolean   @default(false)
  userId            String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([email])
  @@index([optInToken])
  @@map("event_registrations")
}
```

---

## Tracking & Analytics

### Query All Event Registrations

```sql
SELECT * FROM event_registrations
ORDER BY "createdAt" DESC;
```

### Get Conversion Metrics

```sql
SELECT
  COUNT(*) as total_registered,
  SUM(CASE WHEN "hasOptedIn" THEN 1 ELSE 0 END) as opted_in,
  SUM(CASE WHEN "accountCreated" THEN 1 ELSE 0 END) as accounts_created,
  ROUND(
    (SUM(CASE WHEN "hasOptedIn" THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100,
    2
  ) as opt_in_rate
FROM event_registrations;
```

### Get Non-Converters (for follow-up emails)

```sql
SELECT * FROM event_registrations
WHERE "hasOptedIn" = false
AND "createdAt" > NOW() - INTERVAL '30 days'
ORDER BY "createdAt" DESC;
```

---

## Security Features

✅ **Secure Password Generation**: 12-character passwords with mixed case, numbers, and symbols
✅ **Token-Based Opt-In**: Cryptographically secure 64-character hex tokens
✅ **Unique Email Enforcement**: Prevents duplicate registrations
✅ **Auto-Login Security**: HTTP-only cookies with proper SameSite settings
✅ **Password Change Encouraged**: Emails remind users to change password

---

## Testing the Flow

### Test Registration

```bash
curl -X POST http://localhost:3002/api/events/law-school-launch/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "institution": "Test University",
    "email": "test@university.edu",
    "registrationType": "student",
    "competitions": ["Moot Court"]
  }'
```

### Test Opt-In

1. Register a user (get the `optInToken` from the database)
2. Visit: `http://localhost:3002/api/events/opt-in?token={optInToken}`
3. Should redirect to `/dashboard` with user logged in

---

## Files Created

```
src/
├── app/
│   ├── api/events/
│   │   ├── law-school-launch/register/route.ts  (Registration endpoint)
│   │   └── opt-in/
│   │       ├── route.ts                         (Redirect to opt-in page)
│   │       └── activate/route.ts                (Account activation API)
│   └── events/opt-in/
│       └── page.tsx                             (Opt-in loading page UI)
├── lib/
│   └── event-email-templates.ts                 (Email templates)
└── prisma/
    └── schema.prisma                            (Updated with EventRegistration)
```

---

## Environment Variables Required

Ensure these are set in your `.env`:

```env
# Database
DATABASE_URL="your_postgres_url"

# Email (for nodemailer)
EMAIL_USER="your_email@gmail.com"
EMAIL_PASSWORD="your_app_password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"

# App URL
NEXT_PUBLIC_APP_URL="https://wansom.ai"

# JWT Secrets (existing)
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
```

---

## Next Steps (Optional - For Later)

### Follow-Up Email Campaign

Create endpoints for sending reminder emails to non-converters:

- Day 3: "Don't miss out on Wansom Pro"
- Day 7: "See what students are saying about Wansom Pro"
- Day 14: "Last chance to activate your free access"

### Admin Dashboard

Create an admin view to:
- View all event registrations
- See conversion metrics
- Export registrant list
- Manually trigger follow-up emails

### Webhook Support

Add webhook endpoint to notify external systems when:
- New registration occurs
- User opts in
- Account is created

---

## Support

For questions or issues, contact: law@wansom.ai

**Implementation completed**: ✅ All core functionality is live and ready to use!
