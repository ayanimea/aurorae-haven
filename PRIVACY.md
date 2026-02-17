# Privacy Policy

**Last Updated:** January 15, 2026

## Overview

Aurorae Haven is designed with privacy as a core principle. We follow Privacy by Design practices and comply with GDPR requirements. All user data is stored locally on the user's device, and no data is transmitted to external servers.

## Data Storage

### Local-Only Storage

- **All user data** is stored locally using the browser's IndexedDB database
- **No cloud storage** or external servers are used
- **No data transmission** occurs outside the user's device
- Data remains under the complete control of the user

### Data Types Stored

The following data is stored locally:

- **Schedule events**: Title, date, start time, end time, event type (routine, task, meeting, habit)
- **Tasks**: Task details and completion status
- **Notes**: User-created notes and content
- **Habits**: Habit tracking data
- **User preferences**: Application settings and customization options

## Data Collection

### Logging Practices

For debugging and quality assurance purposes, the application logs certain user interactions. These logs are:

- **Stored locally only** in the browser's console
- **Not transmitted** to any external service
- **Not persistent** - cleared when the browser is closed or console is cleared
- **Minimal** - containing only non-personally identifiable information

#### What is Logged

- **Event interactions**: Only event IDs (numeric identifiers) when users interact with schedule events
- **Application errors**: Error messages and stack traces for debugging
- **Performance metrics**: Page load times and operation durations
- **User actions**: High-level action types (e.g., "event created", "view changed") without content details

#### What is NOT Logged

- Event titles, descriptions, or content
- Personal information
- Time-sensitive data beyond event IDs
- Any data that could be used to identify individuals

## Data Export and Portability

Users have full control over their data:

- **Export functionality**: Export all data in standard formats (JSON, Markdown)
- **Data portability**: Easily transfer data to other applications
- **No lock-in**: No proprietary formats or restrictions
- **Selective export**: Export specific data types or date ranges

## Data Deletion

Users can delete their data at any time:

- **Individual item deletion**: Delete specific events, tasks, notes, or habits
- **Bulk deletion**: Clear all data for a specific data type
- **Complete reset**: Clear all application data from the browser
- **Permanent deletion**: All deletions are immediate and permanent (no recovery possible)

## Third-Party Services

Aurorae Haven does **NOT** use:

- Analytics services (no Google Analytics, Mixpanel, etc.)
- Advertising networks
- Social media integrations
- External APIs for core functionality
- Tracking cookies or beacons
- CDNs for application code (all assets are self-hosted)

## Browser Permissions

The application requests only the following browser permissions:

- **Storage**: To store user data locally in IndexedDB
- **Local Storage**: To store user preferences and settings

The application does **NOT** request:

- Camera or microphone access
- Location services
- Notification permissions (optional, user-controlled if implemented)
- File system access beyond standard file upload/download dialogs

## Security Measures

### Data Protection

- **No transmission**: Data never leaves the device, eliminating network-based attacks
- **Browser isolation**: Uses browser's built-in security sandbox
- **Content Security Policy**: Strict CSP prevents XSS and injection attacks
- **Input validation**: All user input is validated and sanitized
- **No inline scripts**: No inline JavaScript or styles that could be injection vectors

### Authentication

- **No passwords**: Application doesn't require user accounts or passwords
- **Device-based access**: Access is controlled at the device/browser level
- **No cloud sync**: Eliminates password-related security risks

## User Rights (GDPR Compliance)

As per GDPR requirements, users have the right to:

1. **Access**: View all data stored by the application (via export functionality)
2. **Rectification**: Modify any stored data through the application interface
3. **Erasure**: Delete any or all data at any time
4. **Data portability**: Export data in machine-readable formats
5. **Object to processing**: Since no automated processing occurs, this doesn't apply
6. **Restrict processing**: Users control all data processing through the application

## Children's Privacy

This application is suitable for users of all ages. Since no data is collected or transmitted, and all data remains local, there are no special considerations for children's data under COPPA or similar regulations.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be:

- Documented with an updated "Last Updated" date
- Communicated through the application's changelog or update notes
- Non-retroactive (will not affect previously stored data without user consent)

## Contact

For privacy-related questions or concerns, please use:

- **GitHub Issues**: <https://github.com/aurorae-haven/aurorae-haven/issues>

## Commitment to Privacy

Aurorae Haven is committed to user privacy. We believe:

- Users own their data
- Privacy is a fundamental right, not a premium feature
- Local-first applications are the future of privacy-respecting software
- Transparency is essential for trust

This privacy policy reflects our core values and design decisions. By design, it is impossible for us to access, collect, or transmit user data because all data remains exclusively on the user's device.
