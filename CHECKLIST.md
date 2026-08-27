# COMPLETE PRODUCT, UX, ENGINEERING & APP STORE AUDIT

## Purpose

We are approaching the end of the web app design/build phase, with the intention of eventually releasing a native or properly implemented iOS mobile app.

I do **not** want a superficial review.

I want you to perform a full **pre-launch product and engineering audit** of the entire project and identify anything that is:

- missing
- incomplete
- incorrectly implemented
- only visually designed but not functionally implemented
- implemented but not connected to the backend
- implemented but missing error/edge states
- technically fragile
- insecure
- inaccessible
- difficult to maintain
- likely to cause problems when building the mobile app
- likely to cause App Store rejection
- likely to create problems after launch

Do not assume that because something isn't currently visible in the UI that it isn't needed.

For every section below, mark each item as:

**✅ COMPLETE** — fully implemented and tested  
**🟡 PARTIAL** — exists but requires work  
**🔴 MISSING** — needs to be built  
**⚠️ RISK** — technically/strategically questionable  
**N/A** — genuinely does not apply

For every 🟡, 🔴 or ⚠️ item, explain:

1. What is missing or wrong
2. Why it matters
3. What needs to be done
4. Where it should be implemented
5. Whether it is required for MVP, launch, or can wait

Do not simply tell me that something “looks good.” Verify the underlying implementation.

---

# 1. PRODUCT DEFINITION & SCOPE

- [ ] Is the core purpose of the product clearly defined?
- [ ] Is the primary user problem clearly defined?
- [ ] Is the target user clearly defined?
- [ ] Is the primary user value proposition clear?
- [ ] Is the MVP scope clearly defined?
- [ ] Is there a documented distinction between MVP and future functionality?
- [ ] Are all currently designed features actually necessary?
- [ ] Are there features in the UI that have no actual functionality?
- [ ] Are there backend capabilities that exist but have no UI?
- [ ] Are there important product requirements that were never translated into the design?
- [ ] Are there assumptions about how users behave that need validation?
- [ ] Are there features that should exist but were accidentally omitted?
- [ ] Is there a clear definition of what constitutes a successful user journey?
- [ ] Are the primary success metrics defined?

### Ask:

- What are the 5 most important things this product must do exceptionally well?
- What functionality can we safely postpone?
- What functionality would be dangerous to postpone until after launch?
- What important product requirement have we probably overlooked?

---

# 2. COMPLETE FEATURE INVENTORY

Create a complete inventory of **every feature in the product**.

For each feature document:

- Name
- Purpose
- User
- Entry point
- Main flow
- Success state
- Empty state
- Loading state
- Error state
- Permission state
- Offline state
- Edge cases
- Backend/API dependency
- Database dependency
- Analytics events
- Authentication requirements
- Mobile implications

Then verify:

- [ ] Every designed feature has implementation
- [ ] Every implementation has a UI
- [ ] Every feature has all required states
- [ ] Every feature has appropriate error handling
- [ ] Every feature has defined permissions
- [ ] Every feature behaves correctly for logged-out users
- [ ] Every feature behaves correctly for logged-in users
- [ ] Every feature has reasonable mobile behavior
- [ ] There are no “fake” buttons or controls
- [ ] There are no placeholder interactions
- [ ] There are no dead-end flows
- [ ] There are no screens that cannot be reached
- [ ] There are no features that cannot be exited

---

# 3. USER JOURNEYS

Audit the complete journeys from beginning to end.

## New user

- [ ] Landing/entry
- [ ] First impression
- [ ] Onboarding
- [ ] Account creation
- [ ] Verification
- [ ] Permissions
- [ ] First meaningful action
- [ ] First success
- [ ] Returning user experience

## Existing user

- [ ] Login
- [ ] Session restoration
- [ ] Dashboard/home
- [ ] Core action
- [ ] Secondary actions
- [ ] Account/settings
- [ ] Logout

## Returning after inactivity

- [ ] Expired session
- [ ] Outdated data
- [ ] Changed permissions
- [ ] Changed password
- [ ] Changed subscription/account state
- [ ] Re-authentication

## Failure journeys

- [ ] Network failure
- [ ] Server failure
- [ ] Invalid input
- [ ] Unauthorized action
- [ ] Forbidden action
- [ ] Missing data
- [ ] Deleted object
- [ ] Expired link
- [ ] Duplicate submission
- [ ] Timeout

Create a flow map showing all major journeys and identify any missing branches.

---

# 4. INFORMATION ARCHITECTURE & NAVIGATION

- [ ] Is the information architecture logical?
- [ ] Are all major features discoverable?
- [ ] Is navigation consistent?
- [ ] Are navigation states defined?
- [ ] Is the active state clear?
- [ ] Are breadcrumbs needed anywhere?
- [ ] Can users always understand where they are?
- [ ] Can users always return?
- [ ] Are deep links supported where useful?
- [ ] Do URLs accurately represent application state?
- [ ] Does browser back behave correctly?
- [ ] Does forward navigation behave correctly?
- [ ] Does refresh preserve the expected state?
- [ ] Are unauthorized URLs handled correctly?
- [ ] Are deleted/invalid routes handled correctly?
- [ ] Is there a proper 404 experience?

---

# 5. UX/UI COMPLETENESS

For **every screen**, verify that we have:

- [ ] Default state
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Success state
- [ ] Disabled state
- [ ] Hover state where relevant
- [ ] Focus state
- [ ] Active state
- [ ] Selected state
- [ ] Validation state
- [ ] Permission-denied state
- [ ] Long-content state
- [ ] Very-short-content state
- [ ] First-time state
- [ ] Returning-user state

Also verify:

- [ ] Typography hierarchy
- [ ] Spacing system
- [ ] Grid
- [ ] Alignment
- [ ] Component consistency
- [ ] Button hierarchy
- [ ] Form consistency
- [ ] Iconography
- [ ] Modals
- [ ] Toasts
- [ ] Notifications
- [ ] Confirmation dialogs
- [ ] Destructive-action confirmations
- [ ] Content overflow
- [ ] Text wrapping
- [ ] Localization readiness

---

# 6. RESPONSIVE WEB DESIGN

Test all important functionality at:

- [ ] Large desktop
- [ ] Standard desktop
- [ ] Laptop
- [ ] Tablet
- [ ] Small tablet
- [ ] Large mobile
- [ ] Small mobile

Verify:

- [ ] No horizontal scrolling
- [ ] No overlapping elements
- [ ] No clipped content
- [ ] No broken navigation
- [ ] No impossible tap targets
- [ ] No unusable forms
- [ ] No viewport-specific bugs
- [ ] Modals work on mobile
- [ ] Tables work on mobile
- [ ] Dropdowns work on mobile
- [ ] Keyboard behavior works on mobile
- [ ] Touch interactions are appropriate
- [ ] Orientation considerations are understood

---

# 7. FORMS & INPUTS

For every form:

- [ ] Required fields
- [ ] Optional fields
- [ ] Correct input types
- [ ] Validation
- [ ] Inline validation
- [ ] Server validation
- [ ] Error messages
- [ ] Success message
- [ ] Submit loading state
- [ ] Duplicate submission prevention
- [ ] Disabled submit state
- [ ] Keyboard behavior
- [ ] Autofill behavior
- [ ] Paste behavior
- [ ] Character limits
- [ ] Minimum/maximum values
- [ ] Special characters
- [ ] Malicious input handling
- [ ] Empty input
- [ ] Extremely long input
- [ ] Incorrect input formats

---

# 8. AUTHENTICATION & ACCOUNT SYSTEM

Audit the entire authentication system.

- [ ] Sign up
- [ ] Login
- [ ] Logout
- [ ] Session handling
- [ ] Session expiration
- [ ] Refresh tokens
- [ ] Password reset
- [ ] Password change
- [ ] Email verification
- [ ] Email change
- [ ] Account recovery
- [ ] Account deletion
- [ ] Duplicate accounts
- [ ] Duplicate email
- [ ] Invalid credentials
- [ ] Brute-force protection
- [ ] Rate limiting
- [ ] Remember-me behavior
- [ ] Multi-device sessions
- [ ] Session invalidation
- [ ] Suspicious login behavior
- [ ] Unauthorized access

### Social login

If using Google, Facebook, Microsoft, etc.:

- [ ] Confirm whether Sign in with Apple is required
- [ ] Confirm login policy for iOS
- [ ] Confirm email privacy behavior
- [ ] Confirm identity mapping
- [ ] Confirm account merging
- [ ] Confirm returning users using different login methods

Apple currently requires equivalent login functionality in many cases where third-party/social login is used, subject to its listed exceptions.

---

# 9. ACCOUNT MANAGEMENT

- [ ] Profile
- [ ] Edit profile
- [ ] Change email
- [ ] Change password
- [ ] Notification preferences
- [ ] Privacy preferences
- [ ] Connected accounts
- [ ] Active sessions
- [ ] Subscription
- [ ] Billing
- [ ] Delete account
- [ ] Export personal data if applicable
- [ ] Logout everywhere if needed

If users can create accounts, verify that account deletion is supported in a clear, accessible manner. Apple explicitly requires account deletion for apps that support account creation.

---

# 10. DATABASE & DATA MODEL

Audit the complete database schema.

- [ ] All entities documented
- [ ] Relationships documented
- [ ] Primary keys
- [ ] Foreign keys
- [ ] Unique constraints
- [ ] Required fields
- [ ] Nullable fields
- [ ] Defaults
- [ ] Indexes
- [ ] Query performance
- [ ] Data integrity
- [ ] Cascading deletes
- [ ] Soft deletes where appropriate
- [ ] Audit fields
- [ ] Created timestamps
- [ ] Updated timestamps
- [ ] Ownership rules
- [ ] Permission rules
- [ ] Data retention
- [ ] Data deletion
- [ ] Migration strategy
- [ ] Backup strategy
- [ ] Recovery strategy

Ask:

> Can the database support the product if the user base becomes 10x, 100x, and 1,000x larger?

---

# 11. BACKEND & API

- [ ] API architecture documented
- [ ] All endpoints documented
- [ ] Authentication
- [ ] Authorization
- [ ] Validation
- [ ] Rate limiting
- [ ] Error handling
- [ ] Consistent response format
- [ ] HTTP status codes
- [ ] Pagination
- [ ] Filtering
- [ ] Sorting
- [ ] Search
- [ ] Caching
- [ ] Idempotency
- [ ] Retry handling
- [ ] Timeouts
- [ ] API versioning
- [ ] Logging
- [ ] Monitoring

For every API endpoint verify:

- [ ] What happens when valid?
- [ ] What happens when invalid?
- [ ] What happens when unauthorized?
- [ ] What happens when forbidden?
- [ ] What happens when the object no longer exists?
- [ ] What happens during server failure?
- [ ] What happens during timeout?
- [ ] What happens when the same request is sent twice?

---

# 12. SECURITY AUDIT

Perform a genuine security review.

- [ ] HTTPS everywhere
- [ ] Secure cookies
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL injection protection
- [ ] Input sanitization
- [ ] Authentication security
- [ ] Authorization security
- [ ] Password hashing
- [ ] Secret management
- [ ] Environment variables
- [ ] API keys protected
- [ ] No secrets in frontend code
- [ ] No secrets committed to Git
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Abuse prevention
- [ ] File upload security
- [ ] Malicious file handling
- [ ] Request size limits
- [ ] Bot protection where appropriate
- [ ] Dependency vulnerabilities
- [ ] Admin privilege protection
- [ ] User-to-user data isolation

### Critical test

Try to determine whether User A can access, modify, delete or infer data belonging to User B.

---

# 13. FILES, IMAGES & UPLOADS

If uploads exist:

- [ ] File type validation
- [ ] MIME validation
- [ ] File size limits
- [ ] Image dimension limits
- [ ] Filename sanitization
- [ ] Storage architecture
- [ ] Access permissions
- [ ] Private/public files
- [ ] Signed URLs where needed
- [ ] Image optimization
- [ ] Thumbnail generation
- [ ] Failed upload handling
- [ ] Interrupted upload handling
- [ ] Delete behavior
- [ ] Orphaned-file cleanup

---

# 14. SEARCH, FILTERING & SORTING

If applicable:

- [ ] Search works
- [ ] Empty search
- [ ] No results
- [ ] Partial matches
- [ ] Misspellings
- [ ] Case sensitivity
- [ ] Filters
- [ ] Multiple filters
- [ ] Filter persistence
- [ ] Reset filters
- [ ] Sorting
- [ ] Pagination
- [ ] Performance
- [ ] Mobile UX

---

# 15. NOTIFICATIONS & COMMUNICATION

If applicable:

- [ ] Email system
- [ ] Transactional emails
- [ ] Email verification
- [ ] Password reset emails
- [ ] Push notifications
- [ ] In-app notifications
- [ ] Notification preferences
- [ ] Opt-in/opt-out
- [ ] Notification deep linking
- [ ] Failed notification handling
- [ ] Duplicate notification prevention
- [ ] Notification analytics

Do not make critical functionality dependent on users enabling push notifications or other system permissions where Apple prohibits such a requirement.

---

# 16. PAYMENTS / SUBSCRIPTIONS

If the app has payments, determine exactly what is being sold:

- [ ] Physical goods
- [ ] Physical services
- [ ] Digital goods
- [ ] Digital services
- [ ] Subscription
- [ ] Marketplace transaction
- [ ] Commission
- [ ] Other

Then determine:

- [ ] Correct payment provider
- [ ] Web payment flow
- [ ] iOS payment flow
- [ ] Apple In-App Purchase requirements
- [ ] Subscription management
- [ ] Cancellation
- [ ] Refund handling
- [ ] Failed payment
- [ ] Expired payment
- [ ] Restore purchases
- [ ] Entitlement synchronization
- [ ] Receipt/server-side verification
- [ ] Pricing
- [ ] Taxes
- [ ] Currency
- [ ] Region availability

Apple generally requires In-App Purchase when unlocking digital features or functionality within an iOS app.

---

# 17. ANALYTICS

Define a complete analytics plan.

- [ ] Product analytics tool
- [ ] Error analytics
- [ ] Conversion tracking
- [ ] User acquisition tracking
- [ ] Retention tracking
- [ ] Funnel tracking
- [ ] Feature usage
- [ ] Onboarding completion
- [ ] Activation
- [ ] Revenue
- [ ] Subscription events
- [ ] Churn
- [ ] Crash analytics

Define events for all major actions.

For every event document:

- Event name
- Trigger
- Properties
- Platform
- Purpose

Also verify:

- [ ] No sensitive information is accidentally sent to analytics
- [ ] Privacy disclosure is accurate
- [ ] Third-party data sharing is documented
- [ ] Tracking consent is implemented where required

Apple requires appropriate disclosure and consent for tracking and regulates how personal data is shared with third parties.

---

# 18. ERROR HANDLING

Create a complete error matrix.

Test:

- [ ] 400
- [ ] 401
- [ ] 403
- [ ] 404
- [ ] 409
- [ ] 422
- [ ] 429
- [ ] 500
- [ ] Timeout
- [ ] Network offline
- [ ] Partial response
- [ ] Invalid response
- [ ] Expired session
- [ ] Deleted resource

For every error:

- [ ] User sees understandable message
- [ ] Technical details are not exposed
- [ ] Recovery action exists where possible
- [ ] Error is logged
- [ ] Error can be diagnosed

---

# 19. OFFLINE & BAD NETWORK BEHAVIOR

Especially important for the future mobile app.

- [ ] What happens with no internet?
- [ ] What happens with slow internet?
- [ ] What happens when connection drops during a request?
- [ ] What happens when connection returns?
- [ ] Can actions be retried?
- [ ] Is local state cached?
- [ ] Can important data be accessed offline?
- [ ] Are duplicate requests prevented?

Decide explicitly which functionality should work offline and which should not.

---

# 20. PERFORMANCE

Measure rather than assume performance.

- [ ] Initial page load
- [ ] Time to interactive
- [ ] Largest content
- [ ] JavaScript bundle size
- [ ] Image sizes
- [ ] Font loading
- [ ] API latency
- [ ] Database queries
- [ ] Rendering performance
- [ ] Large lists
- [ ] Memory usage
- [ ] Caching
- [ ] CDN
- [ ] Lazy loading
- [ ] Code splitting

Test on:

- [ ] High-end device
- [ ] Mid-range device
- [ ] Low-end device
- [ ] Fast internet
- [ ] Slow internet
- [ ] Mobile network

---

# 21. ACCESSIBILITY

Audit against modern accessibility standards.

- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Focus visibility
- [ ] Screen reader compatibility
- [ ] Semantic HTML
- [ ] Labels
- [ ] Form descriptions
- [ ] Error announcements
- [ ] Alt text
- [ ] Heading hierarchy
- [ ] Contrast
- [ ] Touch target size
- [ ] Reduced motion
- [ ] Color-independent meaning
- [ ] Zoom/text scaling
- [ ] Accessible modals
- [ ] Accessible dropdowns
- [ ] Accessible notifications

Do not rely on color alone to communicate status.

---

# 22. INTERNATIONALIZATION & LOCALIZATION

Even if initially launching in one country:

- [ ] Text is not hardcoded in ways that prevent translation
- [ ] Dates are configurable
- [ ] Currency is configurable
- [ ] Number formatting is configurable
- [ ] Time zones are handled correctly
- [ ] Text expansion is supported
- [ ] Long translated strings won't break layouts
- [ ] RTL possibility is understood
- [ ] Locale-aware sorting
- [ ] Locale-aware validation

---

# 23. SEO / PUBLIC WEB APP

For public pages:

- [ ] Page titles
- [ ] Meta descriptions
- [ ] Canonical URLs
- [ ] Open Graph
- [ ] Twitter/social metadata
- [ ] Sitemap
- [ ] robots.txt
- [ ] Structured data where appropriate
- [ ] Clean URLs
- [ ] 404
- [ ] Redirect strategy
- [ ] Indexing strategy
- [ ] No accidental indexing of private pages
- [ ] Authentication pages protected appropriately
- [ ] Performance
- [ ] Core Web Vitals

---

# 24. BROWSER & PLATFORM COMPATIBILITY

Test:

- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] macOS
- [ ] Windows
- [ ] iOS Safari
- [ ] Android browser

Document any intentionally unsupported combinations.

---

# 25. DESIGN SYSTEM & COMPONENT ARCHITECTURE

- [ ] Design tokens
- [ ] Typography tokens
- [ ] Spacing tokens
- [ ] Color system
- [ ] Border radius
- [ ] Shadows
- [ ] Buttons
- [ ] Inputs
- [ ] Selects
- [ ] Cards
- [ ] Modals
- [ ] Navigation
- [ ] Tables
- [ ] Notifications
- [ ] Tooltips
- [ ] Icons

Verify:

- [ ] Components are reusable
- [ ] Components aren't unnecessarily duplicated
- [ ] Variants are systematic
- [ ] Styling is maintainable
- [ ] Design and code remain synchronized

---

# 26. CODE QUALITY

Audit the codebase.

- [ ] Clear architecture
- [ ] Logical folder structure
- [ ] Naming conventions
- [ ] Reusable components
- [ ] No excessive duplication
- [ ] No dead code
- [ ] No abandoned experiments
- [ ] No debug code
- [ ] No console errors
- [ ] No console logs containing sensitive data
- [ ] No TODOs that affect launch
- [ ] No hardcoded production assumptions
- [ ] No magic numbers
- [ ] No unnecessary dependencies
- [ ] Dependencies are current
- [ ] Dependencies are maintained
- [ ] Type safety where applicable
- [ ] Linting
- [ ] Formatting
- [ ] Build succeeds cleanly

---

# 27. VERSION CONTROL

- [ ] Git repository configured
- [ ] Main/master branch strategy
- [ ] Development branch strategy
- [ ] Commit history reasonably clean
- [ ] No secrets in history
- [ ] .gitignore correct
- [ ] Environment configuration documented
- [ ] Production deployment connected to repository
- [ ] Rollback possible
- [ ] Release tags/versioning strategy

---

# 28. ENVIRONMENTS

There should ideally be a clear separation between:

- [ ] Local
- [ ] Development
- [ ] Staging
- [ ] Production

Verify:

- [ ] Separate databases where appropriate
- [ ] Separate API environments
- [ ] Separate environment variables
- [ ] Separate credentials
- [ ] Production secrets inaccessible to developers where appropriate
- [ ] Staging resembles production
- [ ] Deployment process documented

---

# 29. DEPLOYMENT & INFRASTRUCTURE

- [ ] Production hosting
- [ ] Domain
- [ ] SSL
- [ ] DNS
- [ ] CDN
- [ ] Backend deployment
- [ ] Database deployment
- [ ] Storage
- [ ] Email provider
- [ ] Monitoring
- [ ] Logging
- [ ] Backups
- [ ] Automated deployment
- [ ] Rollback process
- [ ] Uptime monitoring
- [ ] Alerting

Ask:

> If the production server disappeared tomorrow, how would we restore the product?

Document the answer.

---

# 30. DATABASE BACKUPS & DISASTER RECOVERY

- [ ] Automated backups
- [ ] Backup frequency
- [ ] Backup retention
- [ ] Backup encryption
- [ ] Restore procedure
- [ ] Restore tested
- [ ] Point-in-time recovery where appropriate
- [ ] Disaster recovery procedure
- [ ] Recovery time objective
- [ ] Recovery point objective

A backup that has never been restored/tested should not be considered reliable.

---

# 31. LOGGING & MONITORING

- [ ] Application logs
- [ ] Backend logs
- [ ] Database monitoring
- [ ] Error monitoring
- [ ] Crash monitoring
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] API monitoring
- [ ] Alerts
- [ ] Admin visibility
- [ ] Sensitive data excluded from logs

---

# 32. ADMIN / INTERNAL TOOLS

Ask whether the product requires an admin panel.

Potential functionality:

- [ ] User management
- [ ] Search users
- [ ] Suspend user
- [ ] Delete user
- [ ] Reset account
- [ ] Content management
- [ ] Reports
- [ ] Moderation
- [ ] Analytics
- [ ] Payments
- [ ] Refunds
- [ ] Support
- [ ] System configuration
- [ ] Audit logs

Identify which administrative tools are required before launch.

---

# 33. USER-GENERATED CONTENT

If users can upload, post, message, comment, review, create profiles, etc.:

- [ ] Content reporting
- [ ] Blocking
- [ ] Moderation
- [ ] Abuse handling
- [ ] Spam prevention
- [ ] Offensive content handling
- [ ] User bans
- [ ] Content deletion
- [ ] Content ownership
- [ ] Privacy
- [ ] Legal takedown procedure

For applicable App Store scenarios, Apple requires mechanisms such as filtering objectionable material, reporting, timely response, and user blocking.

---

# 34. PRIVACY & DATA PROTECTION

Create a complete data inventory.

For every piece of user data determine:

- What is collected?
- Why is it collected?
- Where is it stored?
- Who has access?
- Which third party receives it?
- How long is it retained?
- How is it deleted?
- Is consent required?
- Is it optional?
- Is it used for analytics?
- Is it used for advertising?
- Is it sent to AI providers?

Verify:

- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie policy where required
- [ ] Consent mechanisms
- [ ] Data deletion
- [ ] Data export where legally required
- [ ] Data retention
- [ ] Third-party processors
- [ ] Data processing agreements where applicable
- [ ] GDPR considerations
- [ ] International data transfers
- [ ] User consent
- [ ] Revocation of consent

Apple requires a privacy policy URL in App Store Connect and an accessible privacy policy within the app, with clear information about collection, use, third-party sharing, retention, deletion, and consent.

---

# 35. GDPR / EU CONSIDERATIONS

Because the product may operate in the EU, explicitly review:

- [ ] Lawful basis for processing
- [ ] Consent where required
- [ ] Data minimization
- [ ] Right of access
- [ ] Right to deletion
- [ ] Right to rectification
- [ ] Data portability
- [ ] Data retention
- [ ] Privacy notices
- [ ] Processor relationships
- [ ] International transfers
- [ ] Cookie/analytics consent where applicable
- [ ] Children's data if applicable

Flag anything that requires legal advice rather than pretending the engineering team can determine it alone.

---

# 36. AI FEATURES

If any AI functionality exists:

- [ ] AI provider identified
- [ ] API keys secure
- [ ] User data sent to AI documented
- [ ] Consent requirements considered
- [ ] Prompt injection considered
- [ ] Sensitive data handling
- [ ] Abuse prevention
- [ ] Output validation
- [ ] Hallucination handling
- [ ] Cost controls
- [ ] Rate limits
- [ ] Fallback behavior
- [ ] Timeouts
- [ ] AI failure handling
- [ ] User disclosure where appropriate

---

# 37. THIRD-PARTY SERVICES

Create a complete dependency inventory.

For each external service document:

- Service
- Purpose
- Data shared
- API key
- Environment
- Cost
- Failure impact
- Alternative
- Privacy impact
- Vendor lock-in
- Cancellation/deprecation risk

Examples:

- Authentication
- Database
- Storage
- Analytics
- Email
- Payments
- AI
- Maps
- Search
- Notifications
- Monitoring
- CDN

Then ask:

> What happens if each third-party service becomes unavailable tomorrow?

---

# 38. COST & SCALABILITY

Estimate ongoing costs for:

- [ ] Hosting
- [ ] Database
- [ ] Storage
- [ ] Bandwidth
- [ ] Email
- [ ] Analytics
- [ ] AI
- [ ] Payments
- [ ] Monitoring
- [ ] Apple Developer
- [ ] Other third-party services

Calculate approximate cost at:

- 100 users
- 1,000 users
- 10,000 users
- 100,000 users

Identify any architecture decisions that could become unexpectedly expensive.

---

# 39. TESTING

Do not only test happy paths.

Create:

### Functional tests

- [ ] Every main feature
- [ ] Every major user journey
- [ ] Every form
- [ ] Every API
- [ ] Every authentication flow

### Edge-case tests

- [ ] Empty data
- [ ] Huge data
- [ ] Deleted data
- [ ] Duplicate data
- [ ] Invalid data
- [ ] Expired session
- [ ] Expired token
- [ ] Slow network
- [ ] Offline
- [ ] Server errors
- [ ] Concurrent actions

### Regression tests

- [ ] Existing functionality after new changes
- [ ] Navigation
- [ ] Authentication
- [ ] Database
- [ ] Payments
- [ ] Notifications

---

# 40. AUTOMATED TESTING

Determine what should have:

- [ ] Unit tests
- [ ] Integration tests
- [ ] API tests
- [ ] End-to-end tests
- [ ] Visual regression tests
- [ ] Accessibility tests
- [ ] Performance tests

Tell me what percentage of important functionality currently has automated coverage.

Do not optimize for a vanity coverage percentage. Identify the genuinely risky areas that must be tested.

---

# 41. QUALITY ASSURANCE MATRIX

Create a table containing every important feature and:

- Feature
- Desktop
- Mobile web
- Backend
- Error states
- Accessibility
- Analytics
- Security
- Automated test
- Manual test
- Status

Anything without complete verification should be highlighted.

---

# 42. MOBILE APP STRATEGY

This is extremely important.

Before we build the iOS app, determine whether the mobile application should be:

- Native Swift/SwiftUI
- React Native
- Flutter
- Another approach
- A hybrid approach

Do NOT automatically assume that wrapping the website is the correct solution.

Compare the options based on:

- Performance
- Development speed
- Code reuse
- UX
- Native APIs
- Push notifications
- Camera
- Location
- Background tasks
- Deep links
- Authentication
- Payments
- Offline support
- App Store approval
- Long-term maintenance

Apple specifically warns against apps that are essentially repackaged websites without sufficient app-like functionality/value.

---

# 43. WEB → MOBILE ARCHITECTURE

Determine what should be shared between web and mobile.

Potential shared layers:

- [ ] Backend
- [ ] Database
- [ ] API
- [ ] Authentication
- [ ] Business logic
- [ ] Validation
- [ ] Types/schemas
- [ ] Analytics
- [ ] Design tokens
- [ ] Content
- [ ] Localization

Determine what should NOT be shared.

Document the recommended architecture.

---

# 44. MOBILE-SPECIFIC FEATURES

Identify all features that will eventually require mobile-specific implementation:

- [ ] Push notifications
- [ ] Deep links
- [ ] Universal links
- [ ] Camera
- [ ] Photo library
- [ ] Microphone
- [ ] Location
- [ ] Contacts
- [ ] Bluetooth
- [ ] Calendar
- [ ] Files
- [ ] Biometrics
- [ ] Apple Pay
- [ ] Sign in with Apple
- [ ] Background processing
- [ ] Share sheet
- [ ] Widgets
- [ ] Live Activities
- [ ] App shortcuts
- [ ] Haptics

Determine which of these are:

- Required
- Recommended
- Future

---

# 45. IOS AUTHENTICATION

Verify the future iOS implementation for:

- [ ] Sign in with Apple
- [ ] Email/password
- [ ] Google login if used
- [ ] Token exchange
- [ ] Secure token storage
- [ ] Keychain
- [ ] Session persistence
- [ ] Logout
- [ ] Account deletion
- [ ] Apple private relay email
- [ ] Account linking
- [ ] Account recovery

Sign in with Apple requires additional configuration on the web/service side, including appropriate Services ID/domain configuration where applicable.

---

# 46. IOS PERMISSIONS

For every permission determine:

- Why is it needed?
- When is it requested?
- Can the app work without it?
- What happens if the user denies it?
- What happens if the user later changes the permission?
- What purpose string is required?

Potential permissions:

- [ ] Notifications
- [ ] Location
- [ ] Camera
- [ ] Photos
- [ ] Microphone
- [ ] Contacts
- [ ] Bluetooth
- [ ] Calendar
- [ ] Health
- [ ] Tracking

Do not ask for permissions before they are contextually needed.

---

# 47. APP STORE REVIEW READINESS

Before release:

- [ ] App does not crash
- [ ] All major features function
- [ ] Backend is live during review
- [ ] App Review can access the product
- [ ] Demo account exists if required
- [ ] Review credentials documented
- [ ] Review notes prepared
- [ ] Non-obvious functionality explained
- [ ] In-app purchases explained
- [ ] Metadata accurate
- [ ] Screenshots accurate
- [ ] Privacy Policy accessible
- [ ] Terms accessible where appropriate
- [ ] Age rating completed
- [ ] App category selected
- [ ] Copyright/content rights completed
- [ ] Export compliance evaluated
- [ ] Pricing/subscription configuration correct
- [ ] Support URL
- [ ] Marketing URL if applicable

Apple explicitly asks developers to provide full review access, ensure backend services are live, and explain non-obvious features/in-app purchases in review notes.

---

# 48. APP STORE PRIVACY

Verify the App Store Connect privacy declarations against the actual application.

- [ ] Data collected
- [ ] Data linked to user
- [ ] Data used for tracking
- [ ] Third-party SDK data
- [ ] Analytics
- [ ] Advertising
- [ ] Diagnostics
- [ ] Account information
- [ ] Location
- [ ] Contacts
- [ ] Photos
- [ ] Camera
- [ ] User content
- [ ] Other relevant data

The App Store privacy answers must reflect the app's actual data practices, including third-party partners/SDKs.

---

# 49. ENCRYPTION / EXPORT COMPLIANCE

Determine exactly what encryption is used.

- [ ] HTTPS
- [ ] Authentication encryption
- [ ] Database encryption
- [ ] Third-party SDK encryption
- [ ] Custom cryptography
- [ ] End-to-end encryption if applicable

Determine whether App Store Connect export-compliance questions/documentation apply.

Apple requires developers to determine export-compliance obligations when apps use/access/incorporate encryption.

---

# 50. APP STORE ASSETS

Prepare:

- [ ] App icon
- [ ] App name
- [ ] Subtitle
- [ ] Description
- [ ] Keywords
- [ ] Screenshots
- [ ] App previews if needed
- [ ] Promotional text
- [ ] Support URL
- [ ] Privacy URL
- [ ] Marketing URL
- [ ] Localization
- [ ] Age rating
- [ ] Category

Verify that screenshots and marketing materials accurately represent the actual product. Apple specifically flags inaccurate screenshots and misleading functionality.

---

# 51. DEEP LINKS / UNIVERSAL LINKS

Design this before mobile development.

- [ ] Universal Links
- [ ] Web URL → App
- [ ] Email → App
- [ ] Notification → App
- [ ] Shared link → App
- [ ] Login redirect
- [ ] Password reset
- [ ] Content links
- [ ] Fallback to website
- [ ] Logged-in behavior
- [ ] Logged-out behavior

---

# 52. PUSH NOTIFICATION ARCHITECTURE

If applicable:

- [ ] Device token handling
- [ ] APNs setup
- [ ] Token refresh
- [ ] User preferences
- [ ] Notification categories
- [ ] Deep links
- [ ] Background notification behavior
- [ ] Badge count
- [ ] Notification cancellation
- [ ] Server-side notification system
- [ ] Failure/retry handling

---

# 53. RELEASE MANAGEMENT

Define:

- [ ] Version numbering
- [ ] Build numbering
- [ ] Staging release
- [ ] Internal testing
- [ ] Beta testing
- [ ] TestFlight
- [ ] Production release
- [ ] Rollback procedure
- [ ] Hotfix procedure
- [ ] Database migration procedure
- [ ] App update strategy

---

# 54. POST-LAUNCH READINESS

Before launch, answer:

- [ ] Who monitors errors?
- [ ] Who handles customer support?
- [ ] Who handles security incidents?
- [ ] Who handles payments?
- [ ] Who manages App Store releases?
- [ ] Who manages backend?
- [ ] Who handles database backups?
- [ ] Who handles user deletion requests?
- [ ] Who handles abuse reports?
- [ ] Who receives critical alerts?
- [ ] What happens if the app suddenly gets 10x traffic?

---

# 55. BUSINESS CONTINUITY

Identify:

- [ ] Single points of failure
- [ ] Single developer dependency
- [ ] Single vendor dependency
- [ ] Single API dependency
- [ ] Single database dependency
- [ ] Domain ownership
- [ ] Apple Developer account ownership
- [ ] Cloud account ownership
- [ ] GitHub/repository ownership
- [ ] Third-party account ownership
- [ ] Password/access documentation

Critical accounts must ultimately be owned by the actual business/product owner rather than being dependent on one individual's personal account.

---

# 56. DOCUMENTATION

Before launch, create:

- [ ] Architecture documentation
- [ ] Database documentation
- [ ] API documentation
- [ ] Environment variables documentation
- [ ] Deployment documentation
- [ ] Backup documentation
- [ ] Recovery documentation
- [ ] Third-party services documentation
- [ ] Authentication documentation
- [ ] Analytics documentation
- [ ] Admin documentation
- [ ] Mobile architecture documentation
- [ ] Release documentation

A new developer should be able to understand and deploy the project without asking the original developer every question.

---

# 57. FINAL “RED TEAM” REVIEW

Now stop thinking like the developer.

Pretend you are:

### A malicious user

- [ ] Can I access another user's data?
- [ ] Can I bypass authentication?
- [ ] Can I manipulate requests?
- [ ] Can I upload malicious files?
- [ ] Can I abuse APIs?
- [ ] Can I spam the system?
- [ ] Can I impersonate another user?

### A completely confused user

- [ ] Can I understand what to do?
- [ ] Can I recover when I make a mistake?
- [ ] Can I always understand what happened?

### A user on a terrible internet connection

- [ ] Does the app remain usable?
- [ ] Do actions duplicate?
- [ ] Does data disappear?
- [ ] Can I recover?

### An App Store reviewer

- [ ] Can I understand the app immediately?
- [ ] Can I access every major feature?
- [ ] Does it work exactly as advertised?
- [ ] Are privacy requirements satisfied?
- [ ] Are login requirements satisfied?
- [ ] Are purchases implemented correctly?
- [ ] Does it provide enough value to justify being a native app?

### A future developer

- [ ] Can I understand the code?
- [ ] Can I deploy it?
- [ ] Can I debug it?
- [ ] Can I modify it safely?

---

# 58. CRITICAL GAP ANALYSIS

After completing the audit, produce the following final report.

## A. MUST FIX BEFORE WEB LAUNCH

List everything that blocks the web MVP launch.

## B. MUST FIX BEFORE IOS DEVELOPMENT

List everything that would cause architectural problems if we started building the mobile app now.

## C. MUST FIX BEFORE IOS APP STORE SUBMISSION

List everything required specifically for iOS/App Store readiness.

## D. SHOULD FIX

Important but not launch-blocking.

## E. FUTURE

Things that can safely wait.

## F. TECHNICAL DEBT

Things that work now but should eventually be improved.

## G. HIGH-RISK DECISIONS

List any current architectural/product decisions that could become expensive or difficult to change later.

---

# 59. MOST IMPORTANT FINAL QUESTIONS

Answer these explicitly:

1. **What did we forget?**

2. **What exists only in the design but not in the actual implementation?**

3. **What exists in the implementation but was never represented in the design?**

4. **What major edge cases are missing?**

5. **What will most likely break in production?**

6. **What would you change architecturally before we continue?**

7. **What could cause Apple App Review rejection?**

8. **What should we build differently now because we plan to create the mobile app later?**

9. **What security vulnerabilities or privacy risks currently exist?**

10. **What parts of the system will become problematic at scale?**

11. **What dependencies create vendor lock-in?**

12. **What happens if our database, hosting provider, authentication provider, payment provider, email provider, AI provider, or other major third-party service goes down?**

13. **Can the entire application be restored from backups if the production environment is destroyed?**

14. **Can another developer take over this project without me or you explaining everything manually?**

15. **Is the current architecture genuinely ready to become a serious production product, or are we still at prototype/MVP quality?**

---

# 60. FINAL DELIVERABLE

Do not simply answer these questions in prose.

Produce:

### 1. Overall readiness score

Score:

- Product
- UX
- UI
- Frontend
- Backend
- Database
- Security
- Privacy
- Accessibility
- Performance
- Testing
- Infrastructure
- Analytics
- Web launch readiness
- iOS readiness
- App Store readiness

Use 0–100.

### 2. Critical issues

Rank all critical problems from highest to lowest priority.

### 3. Missing functionality

List every missing feature/functionality discovered.

### 4. Technical risks

List every significant architectural/technical risk.

### 5. App Store risks

List every potential Apple review/compliance issue.

### 6. Recommended architecture changes

Tell me exactly what should change now before we move toward the mobile app.

### 7. Launch checklist

Create a final ordered checklist of everything we need to complete before:

**A. Web MVP launch**

**B. iOS development**

**C. TestFlight**

**D. App Store submission**

**E. Public launch**

### 8. Decision

At the very end answer:

> **“Would you personally consider this project production-ready today?”**

Answer **YES / NO / YES WITH CONDITIONS**, followed by the exact conditions.

Most importantly: **do not optimize this audit for making me feel confident. Optimize it for finding problems.**