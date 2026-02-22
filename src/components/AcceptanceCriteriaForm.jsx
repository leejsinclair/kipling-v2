import { useEffect, useState } from 'react';
import { scoreSingleCriterion } from '../criteriaScoring';

const FORMAT_HINTS = {
  gherkin: [
    'Start with "Given" to describe the context or precondition.',
    'Use "When" to describe the action or event that triggers the scenario.',
    'Use "Then" to describe the expected observable outcome.',
    'Use "And" to continue a Given, When, or Then step.'
  ],
  bullet: [
    'Start with "The system must..." or "The user can..." for clear ownership.',
    'Describe a single, testable behaviour per criterion.',
    'Reference specific UI elements (button, field, message) when possible.',
    'Avoid vague words like "basically", "sort of", or "maybe".'
  ]
};

const TEMPLATE_STORAGE_KEY = 'acceptanceCriteriaTemplates';
const MIN_CRITERIA_FIELDS = 3;
const MAX_CRITERIA_FIELDS = 7;

const DEFAULT_TEMPLATES = {
  gherkin: [
    {
      id: 'gui',
      label: 'GUI Changes',
      criteria: [
        'Given the user is viewing the dashboard page\nWhen they click the "Create Report" button in the top toolbar\nThen the system displays a modal dialog with the report configuration form\nAnd the modal appears centred on screen with a semi-transparent backdrop\nAnd keyboard focus is automatically placed on the "Report Name" input field',
        'Given the UI is loading data from the server\nWhen the request is in progress\nThen the system displays an accessible loading spinner in the center of the content area\nAnd the loading indicator includes ARIA labels for screen readers\nAnd interactive elements below the spinner are disabled during loading',
        'Given a user has entered invalid data in the email field\nAnd the user has left the password field empty\nWhen they click the submit button\nThen the system displays inline validation errors for both fields\nAnd the submit button remains disabled\nAnd focus is moved to the first invalid field'
      ]
    },
    {
      id: 'api',
      label: 'API / Backend',
      criteria: [
        'Given a valid request payload with all required fields\nWhen the POST /api/users endpoint is called\nThen the server validates the payload against the schema\nAnd creates a new user record in the database\nAnd returns a 201 response with the created user object including user_id and created_at timestamp',
        'Given an authenticated user with valid session token\nAnd the request payload contains all required fields\nAnd the user has the "editor" role\nWhen they call the PUT /api/documents/:id endpoint\nThen the server validates the payload schema\nAnd updates the document in the database\nAnd returns a 200 response with the updated document\nAnd the response includes the new modification timestamp',
        'Given an authenticated user without required permissions\nWhen they call the endpoint\nThen the server returns a 403 authorization error\nAnd includes an error message describing the missing permission'
      ]
    },
    {
      id: 'database',
      label: 'Database Features',
      criteria: [
        'Given a user attempts to create a new order record\nAnd the order contains line items with valid product IDs\nAnd the customer ID exists in the customers table\nWhen the transaction is committed\nThen the order is inserted into the orders table\nAnd all line items are inserted into the order_lines table\nAnd the customer\'s last_order_date is updated\nAnd the product inventory is decremented for each item',
        'Given a user updates a product record\nWhen the update operation is executed\nThen only the specified fields are modified in the database\nAnd the updated_at timestamp is set to the current UTC time\nAnd the version number is incremented by one',
        'Given a user attempts to delete a customer record\nAnd the customer has associated order records\nWhen the delete operation is executed\nThen the transaction is rejected with a foreign key constraint error\nAnd no data is modified in either the customers or orders tables'
      ]
    },
    {
      id: 'auth',
      label: 'Authentication & Access',
      criteria: [
        'Given a user has entered valid email and password\nAnd their account is active and not locked\nAnd two-factor authentication is enabled for their account\nWhen they click the sign-in button\nThen the system validates their credentials\nAnd sends a verification code to their registered mobile device\nAnd redirects them to the 2FA verification screen\nAnd the session remains unauthenticated until code verification',
        'Given a user enters incorrect password credentials\nWhen they submit the sign-in form\nThen the system displays an error message stating "Invalid email or password"\nAnd does not reveal which field was incorrect\nAnd increments the failed login attempt counter',
        'Given a user with only "viewer" role permissions\nWhen they attempt to access the admin dashboard\nThen the system returns a 403 Forbidden response\nAnd redirects them to their home page\nAnd displays an error message indicating insufficient permissions'
      ]
    },
    {
      id: 'search',
      label: 'Search & Filtering',
      criteria: [
        'Given the user is on the search page\nAnd they have selected the "Active" status filter\nAnd they have selected "Last 30 days" date range\nAnd they enter "invoice" in the search box\nWhen they click the search button\nThen the system displays only active records\nAnd all results are from the last 30 days\nAnd each result contains the word "invoice" in the title or description\nAnd results are sorted by relevance score with most recent first',
        'Given a user has applied category and date range filters\nWhen they enter a search term in the search box\nThen the results satisfy both the search term and all active filters\nAnd the result count shows the number of matching items\nAnd each filter displays the count of items it would include',
        'Given a user performs a search with no matching results\nWhen the search completes\nThen the system displays an empty state message "No results found"\nAnd shows suggestions to try different search terms\nAnd provides a "Clear filters" button to reset the search'
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      criteria: [
        'Given a high-priority order status changes to "shipped"\nAnd the customer has email notifications enabled\nAnd the customer has opted in to SMS notifications\nWhen the status change is saved\nThen an email notification is sent immediately to the customer\'s registered email\nAnd an SMS is sent to their mobile number\nAnd an in-app notification appears in their notification center\nAnd all three notifications contain the tracking number and estimated delivery date',
        'Given a user has notification preferences configured for email only\nWhen a new comment is posted on their document\nThen the system sends an email notification to their registered address\nAnd does not send browser push or SMS notifications\nAnd records the notification in the notifications table with sent_at timestamp',
        'Given an email notification fails to deliver\nWhen the system attempts retry after 5 minutes\nAnd the retry also fails\nThen the failure is logged in the failed_notifications table with error details\nAnd an admin alert is created\nAnd the user is not sent duplicate notifications on subsequent success'
      ]
    },
    {
      id: 'reporting',
      label: 'Reporting & Export',
      criteria: [
        'Given a user has selected a custom date range from Jan 1 to Dec 31\nAnd they have filtered by department "Sales" and region "North America"\nAnd they have chosen to group by month\nWhen they click "Generate Report"\nThen the system calculates totals for each month in the date range\nAnd displays only records matching Sales department and North America region\nAnd shows subtotals for each month and a grand total\nAnd the report loads within 5 seconds for datasets under 10,000 records',
        'Given a user views a completed report on screen\nWhen they click the "Export to CSV" button\nThen the system generates a CSV file with all visible columns\nAnd the filename includes the report name and current date\nAnd the browser downloads the file immediately\nAnd the CSV uses UTF-8 encoding with proper column headers',
        'Given a user requests a large report with over 50,000 records\nWhen the generation process exceeds 10 seconds\nThen the system displays a progress bar showing percentage complete\nAnd updates the progress indicator every 2 seconds\nAnd shows estimated time remaining\nAnd sends an email with a download link when the report is ready'
      ]
    },
    {
      id: 'workflow',
      label: 'Workflow & Approvals',
      criteria: [
        'Given an employee submits a purchase request over $5,000\nAnd the request requires manager approval\nAnd the employee\'s manager is "out of office"\nWhen the workflow engine processes the request\nThen the system identifies the manager\'s delegate from the settings\nAnd routes the approval task to the delegate\nAnd sends email notifications to both the delegate and the original manager\nAnd the request status shows "Pending Approval - Delegated"\nAnd the audit log records the delegation event with timestamp',
        'Given an approver views a pending request\nWhen they click the "Reject" button and provide a rejection reason\nThen the system updates the request status to "Rejected"\nAnd sends an email notification to the requester with the rejection reason\nAnd records the rejection in the workflow history table\nAnd allows the requester to edit and resubmit the request',
        'Given all required approvers have approved a request\nWhen the final approval is submitted\nThen the system marks the request status as "Approved"\nAnd triggers the downstream payment processing workflow\nAnd sends confirmation emails to the requester and all approvers\nAnd updates the audit log with the complete approval chain and timestamps'
      ]
    }
  ],
  bullet: [
    {
      id: 'gui',
      label: 'GUI Changes',
      criteria: [
        'The system displays a modal dialog centred on screen when the user clicks the "Create Report" button, automatically places keyboard focus on the first input field labeled "Report Name", allows closing via ESC key or clicking the semi-transparent backdrop, and includes a close button with an X icon in the top-right corner.',
        'When the user hovers over the primary navigation items, a dropdown menu appears within 200ms and remains visible while the cursor is over either the parent item or the dropdown, closes after 300ms when the cursor leaves both areas, and highlights the currently active navigation item with a blue underline indicator.',
        'The system displays form validation errors inline below each invalid field using red text and an error icon, announces errors to screen readers immediately upon blur event, keeps the submit button disabled until all required fields are valid and properly formatted, and automatically moves focus to the first invalid field when submit is attempted with invalid data.'
      ]
    },
    {
      id: 'api',
      label: 'API / Backend',
      criteria: [
        'The POST /api/orders endpoint validates the request schema against the OpenAPI specification, checks inventory availability for each line item in the order, calculates tax and shipping costs based on the delivery address, creates the order record with a unique order number, decrements inventory for all items atomically within a database transaction, and returns a 201 response with the complete order object including order_id, order_number, total_amount, and estimated_delivery_date within 2 seconds for orders with up to 50 line items.',
        'When a request is made with an expired or invalid authentication token, the server responds with 401 status code, includes the WWW-Authenticate header specifying the required authentication scheme, and returns a JSON error object with error_code and user-facing message without exposing sensitive security details.',
        'The system enforces rate limiting at 100 requests per minute per API key using a sliding window algorithm, returns 429 status when exceeded along with Retry-After header indicating seconds until limit resets, includes X-RateLimit-Remaining header showing remaining requests, and logs rate limit violations with IP address and timestamp for security monitoring.'
      ]
    },
    {
      id: 'database',
      label: 'Database Features',
      criteria: [
        'The user registration transaction creates a new user record in the users table with bcrypt-hashed password using cost factor 12, generates a unique verification token stored in user_tokens table with 24-hour expiration timestamp, creates a default user_preferences record linked by user_id foreign key, queues a verification email to the background job system, and commits all changes atomically using a database transaction that rolls back completely on any failure with no partial data persisted.',
        'The system implements soft deletes by setting the deleted_at timestamp to the current UTC time without removing the physical record, automatically excludes soft-deleted records from all default query scopes unless the withTrashed() scope is explicitly included in the query builder chain, and allows administrators to permanently delete records or restore them by setting deleted_at back to null.',
        'The audit log trigger captures user_id of the authenticated user, action type (INSERT/UPDATE/DELETE), affected table name, primary key value of the record, JSON object containing changed fields with both old and new values, IP address, user agent, and timestamp for all create, update, and delete operations on audited tables defined in the audit configuration.'
      ]
    },
    {
      id: 'auth',
      label: 'Authentication & Access',
      criteria: [
        'After successful login with valid email and password credentials, the system generates a JWT access token with 15-minute expiration containing user_id and role claims, creates a refresh token valid for 7 days stored as an httpOnly secure SameSite cookie, updates the user\'s last_login timestamp and increments login_count in the database, logs the authentication event with IP address and user agent to the security audit table, and redirects to the user\'s personalized role-based dashboard or their originally requested URL if they were redirected to login from a protected route.',
        'The system expires session tokens after 30 minutes of inactivity measured by the last API request timestamp, sends subsequent requests with expired tokens a 401 response triggering automatic redirect to the login page, displays a session timeout message to the user, and clears all locally stored authentication data from browser storage and cookies.',
        'Users with the "admin" role in their JWT claims can access all routes under /admin/* and see administrative menu options in the navigation bar, while users with only "viewer" role receive a 403 Forbidden response when attempting to access admin routes, are automatically redirected to their home page with an error toast notification stating "Insufficient permissions to access this resource", and have the admin menu items hidden from the UI.'
      ]
    },
    {
      id: 'search',
      label: 'Search & Filtering',
      criteria: [
        'The search functionality performs case-insensitive partial text matching across product name, SKU, description, and category fields using full-text search indexing, highlights matching query terms with yellow background in the results preview, displays results in a responsive paginated grid with 24 items per page and infinite scroll on mobile, shows the total result count and query execution time at the top of the results, and completes searches in under 500ms for product catalogs up to 50,000 items with proper database indexing.',
        'When the user applies the category multi-select dropdown, price range slider (min/max), customer rating filter (1-5 stars), and in-stock availability checkbox together, the system performs an AND operation showing only products that simultaneously match all selected filter criteria, updates the URL with query parameters to enable bookmarking and sharing of filtered views, and displays the count of active filters in a badge next to the "Clear All Filters" button.',
        'When no results match the search query and active filters combination, the system displays a "No products found" heading, shows the current search term and active filters with individual remove buttons for each filter, provides a "Clear all filters" button that resets to default state, suggests trying broader search terms or different filters in a help text block, and displays the three most popular products from the same category as alternative suggestions with images, prices, and star ratings.'
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      criteria: [
        'When a user receives a new direct message, the system checks their notification preferences from the user_settings table, sends a real-time browser push notification if enabled and the user has an active websocket connection, queues a digest email to be sent after 15 minutes if the message remains unread, displays a red numeric badge count on the messages icon in the navigation bar that updates in real-time via websocket, plays a configurable notification sound if audio alerts are enabled in preferences, and stores the notification in the notifications table with is_read=false including message preview, sender info, and timestamp.',
        'Users can configure individual notification preferences for each event type (new_message, mention, comment, status_update, reminder) by selecting from email, browser_push, SMS, and in_app channels using checkboxes in the settings page, can set quiet hours with start_time and end_time during which non-urgent notifications are suppressed and queued for delivery after the quiet period ends, and can test notification delivery for each channel using a "Send Test" button that triggers a sample notification immediately.',
        'When email notifications fail to deliver, the system automatically retries up to 3 times using exponential backoff delays (1 minute, 5 minutes, 15 minutes), logs permanent failures after all retries to the failed_notifications table with error details and timestamp for admin review, uses idempotency keys based on notification_id to guarantee that successfully delivered notifications are never sent as duplicates even if the acknowledgment is lost, and sends an admin alert after 10 failed notifications in a 1-hour period.'
      ]
    },
    {
      id: 'reporting',
      label: 'Reporting & Export',
      criteria: [
        'The sales performance report aggregates transaction data by user-selected date range (start_date, end_date) and region multi-select filter, calculates total revenue sum, average order value, order count, and unique customer count for each region using SQL aggregate functions, displays summary data in both a sortable table with column headers and an interactive bar chart visualization using Chart.js, allows drill-down into individual orders by clicking a region row which opens a modal with paginated order details, caches the computed results in Redis for 5 minutes with cache keys based on filter parameters, and completes report generation in under 3 seconds for datasets up to 100,000 transactions.',
        'The CSV export functionality includes all columns currently visible in the report view, uses UTF-8 encoding with BOM for international character support, formats numbers with proper thousand separators and two decimal places, wraps text fields in double quotes and escapes internal quotes by doubling them, includes a header row with human-readable column names, formats dates consistently as YYYY-MM-DD and timestamps as ISO 8601, and triggers a browser download with filename pattern "sales_report_YYYY-MM-DD_HHmmss.csv" including generation timestamp.',
        'When a user requests reports with more than 10,000 records, the system processes them asynchronously in a background job queue, displays a modal progress indicator showing percentage complete and estimated time remaining updated every 2 seconds via polling, stores the generated report file in cloud storage (S3/GCS) with a time-limited signed URL valid for 24 hours, sends an email notification with the download link when processing completes, and automatically cleans up generated files older than 7 days to manage storage costs.'
      ]
    },
    {
      id: 'workflow',
      label: 'Workflow & Approvals',
      criteria: [
        'When an employee submits an expense report, the workflow engine evaluates the total_amount field and applies different routing rules based on thresholds: requests under $500 route directly to the employee\'s immediate manager for single-level approval, requests from $500-$5000 route first to manager then to finance department for two-level sequential approval, requests over $5000 route through manager, finance director, and CFO for three-level approval, sends email notifications to each pending approver with a personalized link to the approval page including request summary, sets a configurable 48-hour SLA timer for each approval step, and automatically escalates to the approver\'s designated delegate if the SLA expires without action.',
        'When an approver clicks the "Reject" button, the system requires them to enter a rejection reason in a multi-line text field with minimum 10 characters validation, updates the request status to "Rejected" with timestamp, records the rejection in workflow_history table with approver_id and reason, sends an email and in-app notification to the original submitter containing the rejection reason and a link to edit and resubmit, allows the submitter to modify the request and resubmit which creates a new workflow instance with fresh approval chain, and preserves all previous rejection history for audit purposes.',
        'After the final approver in the approval chain clicks "Approve", the system marks the request status as "Approved" with completion_time timestamp, triggers the downstream payment processing workflow by publishing an event to the message queue, calls the budget tracking API to decrement the department budget and record the approved expense allocation, sends confirmation emails to both the original submitter and all approvers in the chain with links to the completed request, records the complete approval chain with each approver\'s user_id, decision, timestamp, and IP address in the audit_log table, and updates reporting dashboards to reflect the approved expense in real-time metrics.'
      ]
    }
  ]
};

function normalizeCriteria(criteriaList) {
  const trimmed = criteriaList
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_CRITERIA_FIELDS);

  const padded = [...trimmed];
  while (padded.length < MIN_CRITERIA_FIELDS) {
    padded.push('');
  }
  return padded;
}

function loadSavedTemplates() {
  const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((template) => (
      template &&
      typeof template.id === 'string' &&
      typeof template.name === 'string' &&
      (template.format === 'gherkin' || template.format === 'bullet') &&
      Array.isArray(template.criteria)
    ));
  } catch {
    return [];
  }
}

/**
 * Generate a context-sensitive hint for a single criterion string.
 * Returns null when the criterion is empty.
 */
function getHintForCriterion(criterion, format) {
  const text = criterion.trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  if (format === 'gherkin') {
    if (!lower.startsWith('given') && !lower.startsWith('when') && !lower.startsWith('then') && !lower.startsWith('and')) {
      return 'Try starting with "Given", "When", or "Then" to follow Gherkin format.';
    }
    if (lower.startsWith('given') && !lower.includes('when') && !lower.includes('then')) {
      return 'Add a "When" clause to describe the action, and a "Then" clause for the outcome.';
    }
    if (lower.startsWith('when') && !lower.includes('then')) {
      return 'Add a "Then" clause to describe the expected observable outcome.';
    }
  }

  if (format === 'bullet') {
    if (!lower.startsWith('the system') && !lower.startsWith('the user') &&
        !lower.startsWith('user can') && !lower.startsWith('system must')) {
      return 'Start with "The system must..." or "The user can..." for a clear, testable statement.';
    }
  }

  const VAGUE_WORDS = ['basically', 'sort of', 'kind of', 'maybe', 'probably', 'might', 'somewhat'];
  const hasVague = VAGUE_WORDS.some(w => lower.includes(w));
  if (hasVague) {
    return 'Replace vague words with specific, measurable language.';
  }

  if (text.split(/\s+/).length < 5) {
    return 'This criterion is quite short – add more detail to make it testable.';
  }

  return null;
}

/**
 * Get tooltip content for acceptance criteria scoring
 * Provides format-specific examples based on score tier
 */
function getCriterionTooltipContent(rating, format) {
  if (!rating) return null;

  const isGherkin = format === 'gherkin';

  if (rating.score >= 9) {
    // Excellent - show what makes it great
    return {
      good: isGherkin ? [
        '"Given user is logged in, When they click export, Then the system displays a success message"',
        '"When form is submitted with valid data, Then system shows confirmation and redirects to dashboard"',
        '"Given email field is empty, When user clicks submit, Then error message appears below the field"'
      ] : [
        '"The system displays inline error messages below each invalid field when user submits the form"',
        '"The user can filter search results by category, date range, and status using the sidebar filters"',
        '"The page shows a loading spinner in the center while data is being fetched from the API"'
      ],
      avoid: isGherkin ? [
        '"When something happens" (too vague)',
        '"Then it works" (not observable)',
        '"Given setup, When action, Then result" (too generic)'
      ] : [
        '"System works properly" (what does "properly" mean?)',
        '"User sees things change" (what things?)',
        '"The button does something" (what outcome?)'
      ]
    };
  } else if (rating.score >= 7) {
    // Good - needs more detail
    return {
      good: isGherkin ? [
        'Add specific UI elements: "Then error message appears below the field"',
        'Include observable outcomes: "displays", "shows", "redirects"',
        'Be specific about data: "with user profile data", "containing order ID"'
      ] : [
        'Add specific elements: "The system displays a confirmation modal"',
        'Include observable details: "updates the cart icon count"',
        'Be clear about outcomes: "shows validation errors below each field"'
      ],
      avoid: isGherkin ? [
        '"Then system responds" (how?)',
        '"Then page loads" (what does it show?)',
        'Missing specific observable outcomes'
      ] : [
        '"User can do things" (what things?)',
        '"System handles the request" (how is this visible?)',
        'Vague actions without observable results'
      ]
    };
  } else if (rating.score >= 5) {
    // Fair - needs structure or observables
    return {
      good: isGherkin ? [
        'Use full structure: "Given [context], When [action], Then [outcome]"',
        'Add observable outcomes: message displays, button appears, page redirects',
        'Be specific: mention field names, button labels, error messages'
      ] : [
        'Start with "The system..." or "The user can..."',
        'Include observable outcomes: displays, shows, enables, disables',
        'Reference specific UI elements: buttons, fields, modals, messages'
      ],
      avoid: isGherkin ? [
        'Incomplete Gherkin: only "When..." without "Then..."',
        'Generic terms: "something", "it", "stuff"',
        'No observable outcome mentioned'
      ] : [
        'Starting with just a verb: "Validate input"',
        'Too brief: "Error shown"',
        'No clear ownership or observable result'
      ]
    };
  } else {
    // Needs work - fundamental issues
    return {
      good: isGherkin ? [
        'Format: "Given [context], When [action], Then [observable outcome]"',
        'Example: "When user enters invalid email, Then error message displays below field"',
        'Always include an observable "Then" statement with specific UI feedback'
      ] : [
        'Format: "The system [action] [specific outcome]" or "The user can [capability]"',
        'Example: "The system displays a validation error when email format is invalid"',
        'Example: "The user can sort the table by clicking any column header"'
      ],
      avoid: isGherkin ? [
        '"It works" or "System processes" (not Gherkin format)',
        'Extremely brief: "Works correctly"',
        'Emotional/vague language: "makes user happy", "kind of good"'
      ] : [
        'Just verbs: "Validates", "Processes", "Handles"',
        'Too vague: "Works fine", "Does stuff"',
        'No observable outcome or UI feedback mentioned'
      ]
    };
  }
}

/**
 * Get tooltip content for individual breakdown scores
 * Provides specific, actionable advice to improve each metric
 */
function getBreakdownTooltip(key, data, format) {
  // Only show tooltip if score is not at maximum
  if (data.score >= data.maxScore) return null;

  const isGherkin = format === 'gherkin';

  switch(key) {
    case 'format':
      if (isGherkin) {
        return {
          title: 'Improve Format Score',
          tips: [
            'Use complete Gherkin: "Given [context], When [action], Then [outcome]"',
            'Include "Given" for initial state (worth +1 point)',
            'Use "And" for multiple conditions or outcomes',
            'Example: "Given user is logged in\\nWhen they click export\\nThen system displays success"'
          ]
        };
      } else {
        return {
          title: 'Improve Format Score',
          tips: [
            'Start with "The system..." or "The user can..."',
            'Use "must" or "should" for requirements',
            'Be explicit about who does what',
            'Example: "The system displays an error message when validation fails"'
          ]
        };
      }

    case 'testability':
      return {
        title: 'Improve Testability Score',
        tips: [
          'Add observable outcomes: "displays", "shows", "redirects", "appears"',
          'Specify UI elements: "error message below field", "confirmation modal"',
          'Avoid vague results: instead of "processes", say "displays success message"',
          'Include measurable behaviour: "button becomes disabled", "icon updates to show 3 items"'
        ]
      };

    case 'specificity':
      return {
        title: 'Improve Specificity Score',
        tips: [
          'Name specific elements: "email field", "submit button", "user profile dropdown"',
          'Avoid vague terms: "kind of", "maybe", "probably", "somehow", "basically"',
          'Specify exact outcomes: not just "displays data" but "displays user name and email"',
          'Keep it concise but detailed (avoid overly long descriptions)',
          'Mention exact error messages or labels when relevant'
        ]
      };

    case 'alignment':
      return {
        title: 'Improve Alignment Score',
        tips: [
          'Connect to the story value: use similar action verbs (reduce, increase, improve)',
          'Reference the same goal or benefit mentioned in "So that..."',
          'Show how this criterion delivers on the story\'s promise',
          'Example: If story says "reduce errors", criterion should mention error prevention/detection'
        ]
      };

    default:
      return null;
  }
}

function parseStoryText(storyText) {
  if (!storyText) return null;

  const normalized = storyText.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^As a\s+(.+?),\s*I want\s+(.+?)\s+so that\s+(.+?)(?:\.)?$/i);

  if (!match) return null;

  return [
    { label: 'As a', value: match[1].trim() },
    { label: 'I want', value: match[2].trim() },
    { label: 'So that', value: match[3].trim() }
  ];
}

export default function AcceptanceCriteriaForm({ onSubmit, storyText, initialCriteriaData = null }) {
  const [criteria, setCriteria] = useState(() => normalizeCriteria(
    Array.isArray(initialCriteriaData?.criteria) ? initialCriteriaData.criteria : []
  ));
  const [format, setFormat] = useState(() => (
    initialCriteriaData?.format === 'bullet' ? 'bullet' : 'gherkin'
  ));
  const [hints, setHints] = useState({});
  const [ratings, setRatings] = useState({});
  const [savedTemplates, setSavedTemplates] = useState(() => loadSavedTemplates());
  const [templateName, setTemplateName] = useState('');
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState('');
  const [isHintsExpanded, setIsHintsExpanded] = useState(false);
  const parsedStoryText = parseStoryText(storyText);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  const applyTemplateCriteria = (templateCriteria) => {
    setCriteria(normalizeCriteria(templateCriteria));
    setHints({});
    setRatings({});
  };

  const handleCriterionChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index] = value;
    setCriteria(newCriteria);

    setHints((prev) => ({ ...prev, [index]: null }));
    setRatings((prev) => ({ ...prev, [index]: null }));
  };

  const addCriterion = () => {
    if (criteria.length < MAX_CRITERIA_FIELDS) {
      setCriteria([...criteria, '']);
      setHints((prev) => ({ ...prev, [criteria.length]: null }));
    }
  };

  const removeCriterion = (index) => {
    if (criteria.length > 1) {
      const newCriteria = criteria.filter((_, i) => i !== index);
      setCriteria(newCriteria);
      setHints((prev) => {
        const next = {};
        newCriteria.forEach((_, i) => {
          const oldIndex = i >= index ? i + 1 : i;
          next[i] = prev[oldIndex] || null;
        });
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const filledCriteria = criteria.filter(c => c.trim());
    if (filledCriteria.length > 0) {
      onSubmit({ criteria: filledCriteria, format });
    }
  };

  const handleReset = () => {
    setCriteria(['', '', '']);
    setFormat('gherkin');
    setHints({});
    setRatings({});
  };

  const handleSaveTemplate = () => {
    const filledCriteria = criteria.filter(c => c.trim());
    if (filledCriteria.length === 0) return;

    const name = templateName.trim() || `${format === 'gherkin' ? 'Gherkin' : 'Bullet'} Template`;
    const newTemplate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      format,
      criteria: filledCriteria,
      createdAt: Date.now()
    };

    setSavedTemplates((prev) => [newTemplate, ...prev]);
    setTemplateName('');
    setSelectedSavedTemplateId(newTemplate.id);
  };

  const handleApplyDefaultTemplate = (templateId) => {
    const template = DEFAULT_TEMPLATES[format].find(item => item.id === templateId);
    if (!template) return;
    applyTemplateCriteria(template.criteria);
  };

  const handleApplySavedTemplate = () => {
    if (!selectedSavedTemplateId) return;
    const template = savedTemplates.find(item => item.id === selectedSavedTemplateId);
    if (!template) return;

    setFormat(template.format);
    applyTemplateCriteria(template.criteria);
  };

  const handleDeleteSavedTemplate = () => {
    if (!selectedSavedTemplateId) return;
    setSavedTemplates((prev) => prev.filter(item => item.id !== selectedSavedTemplateId));
    setSelectedSavedTemplateId('');
  };

  const handleBlur = (index, value) => {
    const hint = getHintForCriterion(value, format);
    setHints(prev => ({ ...prev, [index]: hint }));

    // Score the criterion for real-time feedback
    if (value.trim()) {
      // Extract "So that..." value from story text for alignment scoring
      const soThatMatch = storyText?.match(/so that\s+(.+?)(?=\n|$)/i);
      const storyValue = soThatMatch ? soThatMatch[1].trim() : '';
      
      const rating = scoreSingleCriterion(value, format, storyValue);
      setRatings(prev => ({ ...prev, [index]: rating }));
    } else {
      setRatings(prev => ({ ...prev, [index]: null }));
    }
  };

  const filledCount = criteria.filter(c => c.trim()).length;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Step 2 of 2: Write Acceptance Criteria
          </h2>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer whitespace-nowrap">
            <span>Bullet point format</span>
            <input
              type="checkbox"
              checked={format === 'bullet'}
              onChange={(e) => {
                setFormat(e.target.checked ? 'bullet' : 'gherkin');
                setHints({});
              }}
              aria-label="Bullet point format"
              className="h-4 w-4 accent-blue-600"
            />
          </label>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Define testable conditions that specify when this story is complete
        </p>
        
        {/* Story Context */}
        {storyText && (
          <div className="bg-gray-100 dark:bg-slate-900 px-3 py-2 rounded mb-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold mb-1">Your Story:</p>
              {parsedStoryText ? (
                <div className="space-y-1">
                  {parsedStoryText.map((part) => (
                    <p key={part.label}>
                      <span className="font-semibold">{part.label}</span> {part.value}
                    </p>
                  ))}
                </div>
              ) : (
                <p>{storyText}</p>
              )}
            </div>
          </div>
        )}

        {/* Acceptance Criteria Hints */}
        <div className="bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded mb-4">
          <button
            type="button"
            onClick={() => setIsHintsExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={isHintsExpanded}
            aria-controls="acceptance-criteria-hints"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Acceptance Criteria Hints
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400" aria-hidden="true">
              {isHintsExpanded ? '▾' : '▸'}
            </span>
          </button>
          {isHintsExpanded && (
            <ul id="acceptance-criteria-hints" className="mt-2 space-y-1">
              {FORMAT_HINTS[format].map((tip, i) => (
                <li key={i} className="text-xs text-gray-500 flex gap-1">
                  <span>•</span><span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4 rounded border border-gray-700">
          <div className="dark:bg-slate-800 px-3 py-2 rounded">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Default {format === 'gherkin' ? 'Gherkin' : 'Bullet'} Templates:
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TEMPLATES[format].map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleApplyDefaultTemplate(template.id)}
                  className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Use {template.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dark:bg-slate-800 px-3 py-2 rounded">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Saved Templates:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name (optional)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={filledCount === 0}
                className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Current
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedSavedTemplateId}
                onChange={(e) => setSelectedSavedTemplateId(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                aria-label="Saved templates"
              >
                <option value="">Select a saved template</option>
                {savedTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.format})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplySavedTemplate}
                disabled={!selectedSavedTemplateId}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load
              </button>
              <button
                type="button"
                onClick={handleDeleteSavedTemplate}
                disabled={!selectedSavedTemplateId}
                className="px-3 py-2 text-sm rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Inputs */}
      <div className="space-y-3">
        {criteria.map((criterion, index) => (
          <div key={index} className="relative">
            <label 
              htmlFor={`criterion-${index}`} 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Criterion {index + 1} {index < 1 && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
              <textarea
                id={`criterion-${index}`}
                value={criterion}
                onChange={(e) => handleCriterionChange(index, e.target.value)}
                onBlur={() => handleBlur(index, criterion)}
                placeholder={
                  format === 'gherkin'
                    ? 'Given [context]\nWhen [action]\nThen [outcome]'
                    : 'The system/user must...'
                }
                rows={format === 'gherkin' ? 3 : 2}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required={index === 0}
              />
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  aria-label="Remove criterion"
                >
                  ✕
                </button>
              )}
            </div>
            {ratings[index] && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    ratings[index].color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' :
                    ratings[index].color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                    ratings[index].color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' :
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                  }`}>
                    {ratings[index].score}/{ratings[index].maxScore} - {ratings[index].grade}
                  </span>
                  {ratings[index].breakdown && (
                    <div className="flex gap-2 text-xs flex-wrap">
                      {Object.entries(ratings[index].breakdown).map(([key, data]) => {
                        const tooltip = getBreakdownTooltip(key, data, format);
                        return (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-400">{data.label}:</span>
                            <span className={`font-semibold ${
                              data.score >= data.maxScore * 0.8 ? 'text-green-600 dark:text-green-400' :
                              data.score >= data.maxScore * 0.6 ? 'text-blue-600 dark:text-blue-400' :
                              data.score >= data.maxScore * 0.4 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-orange-600 dark:text-orange-400'
                            }`}>
                              {data.score}/{data.maxScore}
                            </span>
                            {tooltip && (
                              <div className="relative group/breakdown inline-flex">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                <div className="invisible group-hover/breakdown:visible absolute left-0 bottom-full mb-2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 border border-slate-700">
                                  <div className="font-semibold text-blue-400 mb-2">{tooltip.title}</div>
                                  <ul className="list-disc list-inside space-y-1 text-gray-200">
                                    {tooltip.tips.map((tip, idx) => (
                                      <li key={idx} className="leading-relaxed">{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="relative group inline-flex">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="w-4 h-4 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-help flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {(() => {
                      const tooltipContent = getCriterionTooltipContent(ratings[index], format);
                      if (!tooltipContent) return null;
                      return (
                        <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-80 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 border border-slate-700">
                          <div className="mb-2">
                            <div className="font-semibold text-green-400 mb-1">
                              ✓ {ratings[index].score >= 9 ? 'Excellent examples' : 'To improve'}:
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-gray-200">
                              {tooltipContent.good.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="font-semibold text-red-400 mb-1">✗ Avoid:</div>
                            <ul className="list-disc list-inside space-y-1 text-gray-200">
                              {tooltipContent.avoid.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {ratings[index].feedback && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {ratings[index].feedback}
                  </div>
                )}
              </div>
            )}
            {hints[index] && (
              <p style={{backgroundColor: 'rgba(0,0,0,0.1)'}} className="mt-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-1" role="note">
                💡 {hints[index]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add Criterion Button */}
      {criteria.length < MAX_CRITERIA_FIELDS && (
        <button
          type="button"
          onClick={addCriterion}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          + Add Another Criterion (max 7)
        </button>
      )}

      {/* Criteria Count */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Criteria filled: <span className="font-semibold">{filledCount}</span>
          <span className="text-gray-400 dark:text-gray-500 ml-2">(recommended: 3-7)</span>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Reset
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={filledCount === 0}
        >
          Score My Criteria
        </button>
      </div>
    </form>
  );
}
