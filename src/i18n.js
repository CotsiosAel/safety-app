const SUPPORTED_LOCALES = ['en', 'el'];
const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'safety-app-preferred-language';

const messages = {
  en: {
    nav: {
      home: 'Home',
      contacts: 'Contacts',
      safetyTools: 'Safety Tools',
      profile: 'Profile',
      settings: 'Settings',
    },
    pageTitle: {
      home: 'Home',
      contacts: 'Trusted contacts',
      safetyTools: 'Safety tools',
      profile: 'User profile',
      health: 'App health check',
      settings: 'Settings & safety',
    },
    common: {
      online: 'Online',
      offline: 'Offline',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      refresh: 'Refresh',
      save: 'Save',
      cancel: 'Cancel',
      call112: 'Call 112',
      call199: 'Call 199',
      sos: 'SOS',
      tap: 'Tap',
      preparing: 'Preparing…',
      locating: 'Locating…',
      contact: 'contact',
      emergencyContact: 'Emergency contact',
      allContacts: 'All contacts',
      localFile: 'local file',
      status: 'Status',
      active: 'Active',
      ended: 'Ended',
      testSos: 'Test SOS',
      realSos: 'Real SOS',
      localProfile: 'Local profile',
      signedIn: 'Signed in',
      notSignedIn: 'Not signed in',
      syncActive: 'Sync active',
      show: 'Show',
      hide: 'Hide',
      email: 'Email',
      password: 'Password',
      minutes: 'minutes',
      minute: 'minute',
      ready: 'ready',
      ok: 'OK',
      attention: 'Attention',
      incomplete: 'Incomplete',
      english: 'English',
      greek: 'Ελληνικά',
    },
    pullRefresh: {
      pull: 'Pull to refresh',
      release: 'Release to refresh',
      refreshing: 'Refreshing',
      done: 'App refreshed',
      blocked: 'SOS is active. Refresh manually only if needed.',
      manual: 'Refresh manually',
      failed: 'Could not refresh. Check your connection.',
    },
    home: {
      eyebrow: 'IMMEDIATE HELP PANEL',
      title: 'Need help right now?',
      subtitle: 'Quick access to SOS, trusted contacts, and location.',
      readinessEyebrow: 'SAFEME READINESS',
      readinessTitle: 'SafeMe readiness',
      testModeBadge: 'SOS test mode on',
      testModeHelper: 'No real emergency message is sent.',
      testModeLabel: 'SOS test mode',
      testModeHint: 'No real emergency alert is sent.',
      sosAvailable: 'SOS is available on this device.',
      sosPrompt: 'Press SOS once for immediate activation.',
      setupGuide: 'See the quick setup guide first.',
      readyToUse: 'SafeMe is ready to use.',
      trustedContacts: 'Trusted contacts',
      openContactsList: 'Open the list and add contacts.',
      addContact: 'Add contact',
      gpsLocation: 'GPS / Location',
      openLocationCheck: 'Open location check.',
      updateGps: 'Update GPS',
      accountSync: 'Account / sync',
      openSignIn: 'Open sign-in.',
      signInToSync: 'Sign in to sync',
      quickActionsEyebrow: 'QUICK ACTIONS',
      quickActionsTitle: 'Quick help',
      emergencyCallTitle: 'Emergency call',
      emergencyCallNote: 'Use emergency numbers only in a real emergency.',
      setupTitle: 'SafeMe first-time setup',
      setupSubtitle: 'Short essential steps before a real emergency.',
      setupSummary: 'These steps are a preparation guide and do not block SOS.',
      setupReady: 'SafeMe is ready to use.',
      setupCompleteTitle: 'SafeMe is ready',
      setupCompleteSubtitle: 'You have completed the basic safety steps.',
      showSteps: 'Show steps',
      hideSteps: 'Hide',
      safetyStatus: 'Status',
      safetyReady: 'SOS is ready when you need it',
      contactsReady: '{{count}} trusted contacts ready for alerts',
      onlineChip: 'Online',
      offlineChip: 'Offline',
      contactsChip: '{{count}} trusted contacts',
      locationAvailable: 'Location available',
      locationNeeded: 'GPS needed',
      contactsAvailable: '{{count}} contacts available{{primary}}',
      primaryContact: ' • primary: {{name}}',
      locationAccuracy: 'Location available{{accuracy}}',
      accuracySuffix: ' • accuracy about {{meters}}m',
      accountSyncActive: 'Sync active',
    },
    sos: {
      activeTitle: 'SOS active',
      messageReady: 'The SOS message is ready.',
      testNoRealAlert: 'No real emergency message is sent.',
      sendSmsAll: 'Send SMS to all contacts',
      endSos: 'End SOS',
      endOldSos: 'End previous SOS',
      sosInfo: 'SOS details',
      started: 'Started',
      lastLocation: 'Last location',
      lastSync: 'Last sync',
      liveUpdate: 'Live update',
      liveTracking: 'Live tracking',
      location: 'Location',
      noLocation: 'No location',
      locationInMessage: 'Location was added to the SOS message.',
      locationMissing: 'No location found. SOS can still be sent without location.',
      trackingReady: 'Live tracking ready',
      trackingUnavailable: 'Live tracking unavailable in this test.',
      openLiveTracking: 'Open live tracking',
      openGoogleMaps: 'Open in Google Maps',
      noLocationHint: 'No location — allow Location in the browser or tap “Refresh GPS now”. SOS stays active.',
      liveNote: 'Automatic updates work while the app stays open. If GPS, map, or sync fails, keep this screen open and use copy, share, or call.',
      liveActive: 'Live update active',
      contactsAndSends: 'Contacts & sends',
      safetyNote: 'For safety, your phone may ask you to confirm send inside the SMS app.',
      prepareNote: 'SafeMe prepares the message. Sending happens from your device where required.',
      notificationHistory: 'Notification history',
      diagnostics: 'Diagnostics',
      browserLocationPermission: 'Browser location permission',
      lastBrowserGps: 'Last browser GPS',
      lastSupabaseSync: 'Last Supabase sync',
      supabaseSyncResult: 'Supabase sync result',
      lastError: 'Last error',
      testLiveSync: 'Test live sync now',
      refreshGpsNow: 'Refresh GPS now',
      disableTracking: 'Disable tracking link',
      shareLocation: 'Share location',
      copyTracking: 'Copy tracking',
      updateGps: 'Update GPS',
      autoUpdateActive: 'Automatic update active',
      autoUpdateInactive: 'Automatic update inactive',
      notYet: 'Not yet',
      activated: 'SOS activated',
      activatedTest: 'SOS test mode. SOS was activated for testing.',
      activatedReal: 'SOS activated. We prepared a help message with your location.',
      modalTitle: 'SOS activated',
      modalDescription: 'We prepared a help message with your location.',
      sendSms: 'Send via SMS',
      sendWhatsapp: 'Send via WhatsApp',
      copyMessage: 'Copy SOS message',
      share: 'Share',
      closeSos: 'Close SOS',
      confirmEnd: 'Are you sure you want to end the active SOS?',
      confirmDisableTracking: 'Are you sure you want to disable the tracking link? Contacts will no longer see the location.',
      previousEnded: 'The previous SOS has ended. The app is back to normal.',
      smsQueueComplete: 'SMS queue completed',
      smsQueueProgress: 'SMS {{current}}/{{total}} to {{name}}',
      testSms: 'Test SMS',
      smsContactsProgress: 'SMS contacts: {{opened}} of {{total}} opened. {{status}} SafeMe opened SMS. You must tap send in the messaging app.',
      queueComplete: 'SMS queue completed.',
      openedForContact: 'Opened SMS for {{name}}. If you sent it, continue to the next contact.',
      willOpenSms: 'SafeMe will open SMS for each contact, one at a time.',
      noTrustedContacts: 'No trusted contacts.',
      noPhoneContacts: 'No emergency contacts with a phone number. Add numbers to prepare SMS for all contacts.',
      prepareSmsEach: 'SafeMe prepares SMS for each contact with a phone number, one at a time. Sending happens from your device.',
      testSmsQueue: 'Test SMS queue. The message clearly states it is a test.',
      noTrackingNote: 'SafeMe prepares the message. Sending happens from your device where required. No live tracking.',
      addContactForSms: 'No trusted contacts with a phone number. Add a contact to prepare SOS SMS.',
      resetSmsQueue: 'SMS queue reset to the first contact.',
      copiedForContact: 'SOS message copied for {{name}}.',
      opened: 'Opened',
      sent: 'Sent',
      failed: 'Failed',
      notifyAllCapable: 'Add contact',
      inviteTitle: 'Trusted contact briefing',
      inviteDescription: 'You can send a ready-made message via SMS or WhatsApp so your contact knows what to do if they receive SOS from you. Nothing is sent automatically — choose how to send manually.',
      inviteMessage1: 'I added you as a trusted contact in SafeMe.',
      inviteMessage2: 'If you receive SOS from me, open the location link and try to contact me.',
      inviteMessage3: 'If you believe there is immediate danger, call emergency services at 112 or 199.',
      messageIntroTest: '🧪 SafeMe SOS TEST — No real emergency.',
      messageIntroReal: '🚨 SOS from SafeMe',
      messageTestHeader: '🧪 SafeMe SOS TEST',
      messageTestNoEmergency: 'No real emergency.',
      messageRealHeader: '🚨 SafeMe SOS',
      messageNeedHelp: 'I need help NOW.',
      messageTestLocation: '📍 Test location:',
      messageMyLocation: '📍 My location:',
      messageNavigate: '🧭 Navigate to me:',
      messageNavigateTest: '🧭 Navigate to point:',
      messageGoogleFallback: 'If links do not open correctly, try Google Maps:',
      messageCoords: 'Coordinates: {{lat}}, {{lng}}',
      messageLocationUnavailable: 'Location: Not available right now.',
      messageLiveTracking: '🔗 Live tracking:',
      messageName: '👤 Name: {{name}}',
      messagePhone: '📞 Phone: {{phone}}',
      messageTime: '🕒 Alert time: {{time}}',
    },
    contacts: {
      title: 'Trusted contacts',
      eyebrow: 'Trusted circle',
      noneYet: 'No contacts yet',
      addContact: 'Add contact',
      addFirstContact: 'Add first contact',
      closeForm: 'Close form',
      name: 'Name',
      relationship: 'Relationship',
      phone: 'Phone',
      emailOptional: 'Email (optional)',
      saveContact: 'Save contact',
      sync: 'Sync',
      localMode: 'Local mode',
      autoSync: 'Auto sync',
      refreshFromAccount: 'Refresh contacts from account',
      uploadLocal: 'Save local contacts to account',
      note: 'Trusted contacts should know in advance what SafeMe is.',
      advanced: 'Advanced actions',
      advancedSummary: 'Contact management actions',
      clearContacts: 'Clear contacts',
      call: 'Call',
      edit: 'Edit',
      delete: 'Delete',
      setPrimary: 'Set as primary SOS',
      invite: 'Brief contact',
      missingPhone: 'Missing phone',
      confirmDelete: 'Are you sure you want to delete this contact?',
      deleteFailed: 'Could not delete the contact. Try again.',
      saveFailed: 'Could not save the contact. Try again.',
      setPrimaryFailed: 'Could not set primary SOS contact. Try again.',
      confirmClear: 'Are you sure you want to remove all trusted contacts?',
      confirmClearSignedIn: 'Are you sure you want to remove all trusted contacts? Signed-in contacts will also be removed from your account.',
      validationName: 'Enter a contact name.',
      validationRelationship: 'Enter the contact relationship.',
      validationPhoneOrEmail: 'Enter a phone number or email for the contact.',
      validationEmail: 'Enter a valid email or leave it blank.',
      validationPhone: 'Enter a valid phone number, e.g. 99878765 or +35799878765.',
      savedToAccount: 'Contact saved to account.',
      syncedAuto: 'Contacts sync automatically.',
      localOnly: 'Local mode: contacts stay on this device only.',
      syncError: 'Contact sync failed. Check your connection and try again.',
      syncing: 'Syncing contacts with account…',
      signedInAs: 'Signed in as: {{email}}',
      noEmail: 'no email',
      supabaseAutoSync: 'Status: Supabase auto sync',
      remoteContacts: 'Remote contacts: {{count}}',
      lastLoad: 'Last load from account: {{time}}',
      lastSave: 'Last save to account: {{time}}',
      supabaseError: 'Supabase error: {{error}}',
      signInToSync: 'Sign in to sync contacts',
      syncDisabled: 'Account sync actions are disabled.',
    },
    safetyTools: {
      eyebrow: 'Safety tools',
      title: 'Safety tools',
      subtitle: 'Prevention and location tools in one place, separate from home SOS.',
      safeWalk: 'Safe Walk',
      safeWalkDesc: 'Start a monitored trip. If you do not confirm arrival, SafeMe activates SOS.',
      startSafeWalk: 'Start Safe Walk',
      checkIn: 'Safety check-in',
      checkInDesc: 'Send a quick confirmation that you are OK.',
      doCheckIn: 'Check in',
      currentLocation: 'Current location',
      currentLocationDesc: 'View and share your current position with contacts.',
      viewLocation: 'View location',
      testSos: 'SOS test',
      testSosDesc: 'Try SOS without sending a real alert.',
      testMode: 'Test mode',
      safeWalkEyebrow: 'SafeMe monitored trip',
      safeWalkIntro: 'Start a monitored trip. For a quick test choose “1 minute test”. If you do not confirm arrival before time runs out, SafeMe activates SOS.',
      whereGoing: 'Where are you going?',
      estimatedDuration: 'Estimated duration',
      oneMinuteTest: '1 minute test',
      customMinutes: 'Custom minutes',
      arrivedSafe: 'I arrived / I am OK',
      refreshLocation: 'Refresh location',
      cancelSafeWalk: 'Cancel Safe Walk',
      destination: 'Destination',
      startedTime: 'Started time',
      expectedArrival: 'Expected arrival time',
      latestLocationTime: 'Latest location time',
      checkInEyebrow: 'SafeMe check-in timer',
      checkInTitle: 'Safety check-in',
      checkInIntro: 'Set a timer. If you do not confirm you are OK before it expires, SafeMe activates SOS while the app is open.',
      quickTime: 'Quick time selection',
      customTime: 'Custom time',
      startCheckIn: 'Start check-in',
      iAmOk: 'I am OK',
      cancelCheckIn: 'Cancel check-in',
      expiryTime: 'Expiry time',
      locationPrompt: 'Tap refresh to find your position.',
      safeWalkActive: 'Safe Walk active',
      safeWalkMonitoring: 'SafeMe is monitoring your trip while the app is open.',
      checkInActive: 'Check-in active',
      checkInMonitoring: 'SafeMe is monitoring the safety timer.',
    },
    profile: {
      eyebrow: 'User profile',
      fillProfile: 'Complete your profile',
      noPhone: 'No phone added',
      localProfile: 'Local profile',
      notSignedIn: 'You are not signed in.',
      signedInEmail: 'Signed in • {{email}}',
      noEmail: 'no email',
      localHint: 'SOS works locally, but contacts, history, and live tracking do not sync.',
      signInToSync: 'Sign in to sync',
      profileDetails: 'Profile details',
      editProfile: 'Edit profile',
      username: 'Display name',
      phone: 'Phone',
      saveProfile: 'Save profile',
      medicalNotes: 'Medical notes',
      medicalNotesField: 'Emergency note / medical notes',
      medicalPlaceholder: 'Optional: allergies, medications, or other important details',
      medicalHelper: 'Optional: allergies, medications, or other important details',
      saveChanges: 'Save changes',
      clearData: 'Clear data',
      notesEmpty: 'Not filled in',
      sosHistory: 'SOS history',
      noHistory: 'No history yet',
      sosLog: 'SOS log',
      historyStatus: 'SOS events are saved to your account and local copy.',
      lastSos: 'Last SOS',
      totalSos: 'Total SOS',
      viewHistory: 'View history',
      showAll: 'Show all',
      hideHistory: 'Hide history',
      account: 'Account',
      signIn: 'Sign in',
      signInHelper: 'Sign in to sync contacts and SOS history.',
      signedInAs: 'Signed in as',
      createAccount: 'Create account',
      repeatPassword: 'Repeat password',
      rememberEmail: 'Remember my email',
      rememberHelper: 'Only the email is stored.',
      signupNote: 'Phone/SMS sign-in will be added in a future update.',
      logout: 'Sign out',
      noAccount: 'No account? Create one',
      hasAccount: 'Already have an account? Sign in',
      forgotPassword: 'Forgot password',
      passwordResetEyebrow: 'Password reset',
      passwordResetTitle: 'Set a new password',
      passwordResetHelper: 'Enter your new password to continue.',
      newPassword: 'New password',
      repeatNewPassword: 'Repeat new password',
      changePassword: 'Change password',
      localImportEyebrow: 'Saved on this device',
      localImportTitle: 'Local emergency details found',
      localImportSummary: 'Do you want to save them to your account?',
      saveToAccount: 'Save to account',
      skip: 'Skip',
      validationName: 'Enter a profile name.',
      validationPhone: 'Enter a profile phone number.',
      savedSynced: 'Details saved and synced to Supabase.',
      savedLocal: 'Details saved locally on your device.',
      savedSessionOnly: 'Profile updated for this session, but the browser blocked localStorage.',
      savedLocalSyncFailed: 'Saved locally, but Supabase sync failed: {{error}}',
      confirmClearData: 'Are you sure you want to delete all stored data from this device?',
      confirmLogout: 'Are you sure you want to sign out of this account?',
    },
    auth: {
      signedOut: 'Not signed in. Data is stored securely on this device only.',
      signedIn: 'Sync active.',
      signupSuccess: 'Account created and you are signed in.',
      signupPending: 'If this is a new email, check your inbox for confirmation. If you already have an account, tap Sign in.',
      logoutSuccess: 'Signed out successfully.',
      passwordResetSent: 'We sent a password reset email if an account exists with this address.',
      passwordResetReady: 'Password reset form is open.',
      passwordResetSuccess: 'Password changed. You can sign in with your new password.',
      networkError: 'Could not reach the sign-in service. Check your connection and try again.',
      resetEmailRequired: 'Enter your email first so we can send reset instructions.',
      serviceNotLoaded: 'Sign-in service did not load. Refresh and try again.',
      supabaseLocal: 'Supabase did not load. The app is in local mode.',
      invalidCredentials: 'Email or password is incorrect.',
      emailNotConfirmed: 'Email is not confirmed yet.',
      noConnection: 'No connection to the sign-in service.',
      accountExists: 'An account already exists with this email. Tap Sign in or use Forgot password.',
      passwordRejected: 'Password was not accepted. Use at least 6 characters.',
      genericError: 'Sign-in action could not be completed. Try again shortly.',
      openProfile: 'Not signed in. Open sign-in in Profile',
      appOnline: 'App is online',
      signupHelper: 'Create an account to sync SOS.',
      loginHelper: 'Sync contacts and SOS history.',
      passwordMismatch: 'Passwords do not match.',
      storageSignedIn: 'Supabase + local copy',
      storageLocal: 'Local profile on this device',
      accountActiveSos: 'Account active: SOS data syncs.',
      sosOnDevice: 'SOS available on this device.',
      emergencyInProgress: 'Emergency status is in progress.',
    },
    settings: {
      eyebrow: 'Control center',
      title: 'SafeMe settings',
      subtitle: 'Quick check for account, SOS, GPS, and data.',
      sosMode: 'SOS mode',
      realMode: 'Real mode',
      testActive: 'Test active',
      testModeToggle: 'SOS test mode',
      testModeNote: 'Test mode does not send a real emergency message.',
      locationGps: 'Location & GPS',
      locationAvailable: 'Location available',
      needsUpdate: 'Needs update',
      noLocationYet: 'No location available yet.',
      locationUsage: 'Location is used for SOS messages and live tracking.',
      sync: 'Sync',
      autoSyncActive: 'Auto sync active',
      localMode: 'Local mode',
      syncStatusSignedIn: 'Signed in as {{email}}. Contact sync is active.',
      syncStatusLocal: 'Local mode on this device.',
      syncNote: 'Contacts and history sync when you are signed in.',
      openProfile: 'Open profile',
      openContacts: 'Open contacts',
      recheckApp: 'Recheck app',
      privacy: 'Privacy & important note',
      privacySummary: 'Safety, data, and responsible use',
      privacy1: 'SafeMe is a personal safety helper and is not a certified emergency service. It does not replace official emergency services. In immediate danger call 112 or local authorities.',
      privacy2: 'Your details, trusted contacts, and location are used only for safety features such as SOS, sync, and location sharing. Do not use the app for false alerts or abusive tracking.',
      privacy3: 'Before using SOS in a real emergency, test in a safe environment.',
      privacy4: 'Profile, trusted contacts, last location, SOS test mode, and recent actions are stored locally on the device.',
      privacy5: 'When signed in, profile, contacts, SOS history, and active live tracking sessions sync with Supabase.',
      legal: 'Legal & privacy',
      privacyPolicy: 'Privacy Policy',
      terms: 'Terms of Use',
      support: 'Support',
      displayLanguage: 'Display & language',
      currentLanguage: 'Current language: {{language}}.',
      languageLabel: 'App language',
      languageHelp: 'Choose the language for menus, buttons, and SOS messages.',
      immediateHelp: 'Immediate help',
      immediateHelpSummary: '112 and SOS actions',
      immediateHelpNote: 'Quick access to official emergency calls when you need immediate help.',
      emergencyOnly: 'Use emergency calls only in a real emergency.',
      advanced: 'Advanced actions',
      advancedSummary: 'Management actions',
      advancedNote: 'The actions below change or delete app state and require confirmation.',
      appVersion: 'App version',
      version: 'Version:',
      loaded: 'Loaded:',
      environment: 'Environment:',
      clearLocalData: 'Clear local data',
      accuracyAbout: '{{location}} • accuracy about {{meters}}m',
    },
    accountBanner: {
      notSignedIn: 'You are not signed in.',
      localSos: 'Local mode: SOS works on this device.',
      signInToSync: 'Sign in to sync',
    },
    topbar: {
      personalSafety: 'Personal safety',
      shareLocation: 'Share location',
    },
    sidebar: {
      ariaNav: 'Main navigation menu',
      brandAria: 'SafeMe home',
      menuAria: 'App menu',
      helper: 'Quick access to help, wherever you are.',
      safetyApp: 'Safety app',
    },
    location: {
      shareText: 'My current location from SafeMe.',
      shareFailed: 'Could not share location. Try again.',
      searching: 'Looking for your current position…',
      checking: 'Checking location…',
      updated: 'Location updated successfully.',
      unavailable: 'No location available yet. Check browser permissions.',
      permissionDenied: 'Location permission was not granted. Enable Location for this browser.',
      unavailableRetry: 'Could not find position. Try again in a few seconds.',
      deviceUnavailable: 'Location is not available on this device.',
      blocked: 'Location access is blocked. Tap the lock next to the URL and allow Location.',
      permissionGranted: 'Allowed',
      permissionDeniedShort: 'Blocked',
      permissionPrompt: 'Permission will be asked',
      refreshPrompt: 'Tap refresh to find your position.',
      onlineSyncHint: 'App is online. For account sync, sign in from Profile.',
    },
    health: {
      eyebrow: 'SafeMe app health',
      title: 'App health check',
      subtitle: 'Run a quick check to confirm SafeMe is ready.',
      copyReport: 'Copy health report',
      quickActions: 'Quick health actions',
      openProfile: 'Open profile',
      openContacts: 'Open contacts',
      checkLocation: 'Check location',
      testSos: 'Test SOS',
      testCheckIn: 'Test check-in',
      testSafeWalk: 'Test Safe Walk',
      readyBeta: 'SafeMe is ready for beta testing.',
      needsAttention: 'Some items still need attention.',
      reportCopied: 'Health report copied.',
      reportCopyFailed: 'Could not copy the report. Try again.',
      disclaimer: 'This check does not replace real mobile testing and does not guarantee background operation.',
      reportTitle: 'SafeMe health report',
      account: 'Account',
      profile: 'Profile',
      contacts: 'Contacts',
      location: 'Location',
      liveTracking: 'Live tracking',
      testSosLabel: 'Test SOS',
      checkin: 'Check-in',
      safeWalk: 'Safe Walk',
      accountOk: 'Active sign-in with sync features available.',
      accountWarn: 'Without sign-in, SafeMe works locally but has no live tracking link.',
      profileOk: 'Name and phone are in the SOS profile.',
      profileIncomplete: 'Add name and phone for a more useful SOS message.',
      contactsOk: '{{count}} trusted contacts available.',
      contactsIncomplete: 'Add at least one trusted contact for alerts.',
      locationOk: 'A recent location is stored on this device.',
      locationWarn: 'No location yet. Check browser permission/GPS.',
      liveTrackingOk: 'Active signed-in SOS with share token for public tracking link.',
      liveTrackingWarn: 'Live tracking requires a signed-in active SOS. The app can create a share token when SOS starts.',
      liveTrackingIncomplete: 'Live tracking requires sign-in and active SOS. Without sign-in SOS stays local.',
      testSosOk: 'A test SOS has been completed on this device.',
      testSosIncomplete: 'Enable test mode and prepare a SOS without a real emergency.',
      checkinOk: 'Check-in is available from Safety Tools.',
      checkinWarn: 'Not all Check-in Timer elements were found on the page.',
      safeWalkOk: 'Safe Walk is available from Safety Tools.',
      safeWalkWarn: 'Not all Safe Walk elements were found on the page.',
      trustedContact: 'Trusted contact',
      checkInTimer: 'Check-in Timer',
      reportDateTime: 'Date/time: {{datetime}}',
    },
    setup: {
      completeProfile: 'Complete profile',
      openProfile: 'Open profile',
      addContact: 'Add trusted contact',
      openContacts: 'Open contacts',
      checkGps: 'Check GPS',
      testSos: 'Run SOS test',
    },
    publicTracking: {
      eyebrow: 'SafeMe SOS link',
      title: 'Active SafeMe SOS',
      loading: 'Loading SOS status…',
      diagnosticCode: 'Diagnostic code: {{code}}',
      statusActive: 'Active',
      statusEnded: 'Ended',
      bannerActive: 'There is an active SOS.',
      bannerEnded: 'SOS has ended.',
      status: 'Status',
      started: 'SOS started',
      lastLocation: 'Last location',
      lastRefresh: 'Last page refresh',
      guidanceTitle: 'What to do now',
      step1: 'Try to contact the person.',
      step2: 'Open the SafeMe SOS location in Google Maps.',
      step3: 'If you believe there is immediate danger, call emergency services.',
      locationTitle: 'SafeMe SOS location',
      mapTitle: 'SafeMe SOS location',
      locationNote: 'This is the person\'s last known location.',
      coordinates: 'Coordinates: {{coords}}',
      copyCoordinates: 'Copy coordinates',
      noLocation: 'No location available yet. Try again in a few seconds.',
      navigateGoogle: 'Navigate in Google Maps',
      navigateApple: 'Navigate in Apple Maps',
      openGoogle: 'Open in Google Maps',
      refreshLocation: 'Refresh location',
      autoRefresh: 'This page refreshes automatically while SOS is active.',
      notReady: 'Live tracking is not ready yet. Check your connection and try refresh.',
      permissionDenied: 'Public live tracking access is not allowed (RPC/RLS). An administrator must run the SQL from supabase/schema.sql.md.',
      invalidToken: 'The SOS link is not valid.',
      networkError: 'Could not reach live tracking. Try refresh.',
    },
    global: {
      errorRecover: 'Something went wrong, but the app stays open. Try again.',
      supabaseUnknown: 'Unknown Supabase error',
    },
    shareLocation: {
      button: 'Share location',
    },
    runtime: {
      permissionGranted: 'Allowed',
      permissionBlocked: 'Blocked',
      errorLabel: 'Error',
      sosActivated: 'SOS activated.',
      activeSosStarted: 'Active SOS started.',
      checkInExpiredSos: 'Check-in expired and SOS was activated locally.',
      noLiveLocationSupport: 'This device does not support live location.',
      autoLocationUpdateFailed: 'Automatic location update failed. You can tap update manually.',
      sosLocationUpdated: 'SOS location updated.',
      updatingSosLocation: 'Updating SOS location...',
      noLocationForLiveUpdate: 'No location available for live update yet.',
      testingLiveSync: 'Testing live sync with Supabase...',
      liveSyncSuccess: 'Success: live sync updated Supabase now.',
      requestingGps: 'Requesting new GPS position from browser...',
      sosMessageCopied: 'SOS message copied.',
      sosMessageCopyFailed: 'Could not copy SOS message. Try again.',
      trackingLinkCopied: 'Tracking link copied.',
      trackingLinkCopyFailed: 'Could not copy tracking link. Try again.',
      trackingLinkDisabled: 'Tracking link disabled.',
      endingSos: 'Ending SOS...',
      sosEndedLocal: 'SOS ended locally.',
      sosEndedPublic: 'SOS ended. The public tracking link now shows ended/inactive.',
      activatingSos: 'activating SOS',
      checkInActiveBlockSafeWalk: 'A check-in is already active. End it before starting Safe Walk.',
      completeProfileFirst: 'Complete your profile with name and phone first.',
      addContactFirst: 'Add at least one trusted contact first.',
      addContactFirstCheckIn: 'Add at least one trusted contact before starting check-in.',
      refreshLocationFirst: 'Tap Refresh on location and allow Location in the browser first.',
      safeWalkActiveBlockCheckIn: 'Safe Walk is already active. End it before starting check-in.',
      destinationNotSet: 'Not set',
      notYetAvailable: 'Not yet',
      safeWalkTestStarted: 'Started 1-minute Safe Walk test. Tap “I arrived / I am OK” before it ends.',
      safeWalkStarted: 'Safe Walk started. Confirm you arrived / are OK before time runs out.',
      safeWalkCompleted: 'Safe Walk completed. You are safe.',
      safeWalkCancelled: 'Safe Walk cancelled.',
      safeWalkRefreshingLocation: 'Refreshing Safe Walk location...',
      safeWalkLocationUpdated: 'Safe Walk location updated.',
      safeWalkNoLocation: 'No location available yet.',
      safeWalkExpiredBackground: 'Safe Walk expired while the app was inactive. Press SOS if you need help.',
      safeWalkRestored: 'Active Safe Walk was restored on this device.',
      safeWalkExpiredSos: 'Safe Walk expired and SOS was activated.',
      checkInStarted: 'Check-in started. Tap “I am OK” before it expires.',
      checkInCompleted: 'Check-in completed. You are safe.',
      checkInCancelled: 'Check-in cancelled.',
      checkInExpiredBackground: 'Check-in expired while the app was inactive. Press SOS if you need help.',
      checkInRestored: 'Active check-in was restored on this device.',
      checkInExpiredSos: 'Check-in expired and SOS was activated.',
      checkInExpiredSosLocal: 'Check-in expired and SOS was activated locally. Sign in for a live tracking link.',
      unknownTime: 'Unknown time',
      unknownPermission: 'Unknown',
      unknownPermissionUnsupported: 'Unknown (not supported by browser)',
      shareLocationTitle: 'SafeMe location',
      shareLocationReady: '{{location}} • Location is ready to share.',
      shareLinkCopied: '{{location}} • Link copied.',
      myCurrentLocation: 'My current location: {{url}}',
      smsOpenedAll: 'SMS opened for all contacts. SMS queue completed.',
      smsOpenFailed: 'Could not open SMS for {{name}}. Check the number and continue.',
      smsOpenedAllDetail: 'Opened SMS for {{name}}. SafeMe opened SMS. You must tap send in the messaging app. SMS opened for all contacts.',
      smsOpenedContinue: 'Opened SMS for {{name}}. If you sent it, continue to the next contact. SafeMe opened SMS. You must tap send in the messaging app.',
      appWillKeepTrying: '{{message}} The app will keep trying while it stays open.',
      syncErrorSource: 'Error ({{source}})',
      syncSuccessSource: 'Success ({{source}})',
      sosNotUpdated: 'SOS was not updated: {{error}}',
      supabaseLiveSyncError: 'Supabase live sync error: {{error}}',
      browserReturnedCoords: 'Browser returned coordinates: {{location}}.',
      trackingDisableFailed: 'Could not disable tracking link: {{error}}',
      sosEndedNoPublicUpdate: 'SOS ended locally and will not restore after refresh. Public tracking link was not updated: {{error}}',
      safeWalkInProgress: 'active / in progress',
      safeWalkExpiredNote: 'Safe Walk expired without confirmation.{{destination}}',
      destinationPrefix: ' Destination: {{name}}.',
      activeSosUpdateFailed: '{{message}} Could not update active_sos_sessions: {{error}}',
      sosHistoryNotSaved: 'SOS was not saved to history.',
      manualSendNote: '{{message}} SMS or WhatsApp was not sent automatically — choose manual send below.',
      noSosHistory: 'No SOS history yet.',
      openLocation: 'Open location',
      primaryContactLine: 'Primary contact: {{name}} ({{phone}})',
      smsReadyFor: 'Opened ready SMS for {{name}}. Tap send.',
      whatsappReady: 'Opened WhatsApp with pre-filled SOS message.',
      shareOpened: 'SOS share opened.',
      testTrackingNotCreated: 'Live tracking was not created. Test SOS works locally.',
      inviteReady: 'Ready message for {{name}}. Choose SMS or WhatsApp and tap send in the app that opens.',
      inviteSmsReady: 'Opened ready SMS for {{name}}. Tap send if you want to send it.',
      inviteWhatsappReady: 'Opened WhatsApp with pre-filled message. Choose recipient and tap send.',
      supabaseErrorPrefix: 'Supabase error: {{error}}',
      localImportFound: 'Found {{parts}} saved on this device. Do you want to save them to your account?',
      contactsCount: '{{count}} contact(s)',
      andJoin: ' and ',
      sosHistoryLoadFailed: 'Could not load SOS history: {{error}}',
      opened: 'Opened',
      noPrimaryContact: 'No primary contact found.',
      sosLocalOnly: 'SOS works locally on this device. Sign in for a live tracking link.',
      testModeActive: 'SOS test mode. This is not a real emergency.',
      copyTrackingLink: 'Copy tracking link',
      noContactsForTestSms: 'No trusted contacts with a phone number. Add a contact to prepare test SMS.',
      shareNotSupported: 'Sharing is not supported in this browser.',
      shareCancelled: 'Share cancelled.',
      shareFailed: 'Could not open share.',
      needContactForSos: 'Add at least one trusted contact before using SOS.',
      needProfileForSos: 'Complete your name and phone before using SOS.',
      testSosWithTracking: 'Test SOS with live tracking ready.',
      sosWithoutLocation: 'SOS activated without available location. You can tap “Update location now”.',
      sosCreated: 'Active SOS created.',
      sosLocalNoTracking: 'SOS activated locally on this device. Live tracking link not created yet.',
      sosLocalSignInTracking: 'SOS activated on this device. Sign in for a live tracking link.',
      sosPreparedSaved: 'SOS prepared and saved to history.',
      sosPreparedNotSaved: 'SOS prepared but not saved to history.',
      sosActivateFailed: 'Could not activate SOS. Try again.',
      inviteCopied: 'Message copied.',
      inviteCopyFailed: 'Could not copy message. Try again.',
      uploadingContacts: 'Saving local contacts to account...',
      contactsUploaded: 'Local contacts saved to account.',
      importingLocal: 'Saving local details to account...',
      importSaved: 'Local details saved to account.',
      importFailed: 'Not saved to account. Details remain on device and you can try again.',
      importSkipped: 'Import skipped. Local details remain on this device.',
      restoredActiveSos: 'There is a valid active SOS from a previous session. If it was a test, tap End SOS.',
      previousSosEnded: 'The previous SOS had ended and was not restored.',
      restoredSosStatus: 'Active SOS restored from a previous session.',
      accountSyncFailed: 'Account sync did not complete. SOS remains available locally and you can try again.',
      passwordMinLength: 'Password must be at least 6 characters.',
      passwordsMismatch: 'Passwords do not match.',
      dataCleared: 'Stored data was deleted from this device.',
      localDataCleared: 'Local data was deleted from this device.',
      copiedForContact: 'SOS message copied for {{name}}.',
      profilePart: 'profile',
      contactsPart: 'contacts',
    },
  },
  el: {
    nav: {
      home: 'Αρχική',
      contacts: 'Επαφές',
      safetyTools: 'Εργαλεία Ασφάλειας',
      profile: 'Προφίλ',
      settings: 'Ρυθμίσεις',
    },
    pageTitle: {
      home: 'Αρχική σελίδα',
      contacts: 'Έμπιστες επαφές',
      safetyTools: 'Εργαλεία Ασφάλειας',
      profile: 'Προφίλ χρήστη',
      health: 'Έλεγχος εφαρμογής',
      settings: 'Ρυθμίσεις & ασφάλεια',
    },
    common: {
      online: 'Online',
      offline: 'Offline',
      close: 'Κλείσιμο',
      copy: 'Αντιγραφή',
      copied: 'Αντιγράφηκαν',
      copyFailed: 'Αποτυχία αντιγραφής',
      refresh: 'Ανανέωση',
      save: 'Αποθήκευση',
      cancel: 'Ακύρωση',
      call112: 'Κλήση 112',
      call199: 'Κλήση 199',
      sos: 'SOS',
      tap: 'Πατήστε',
      preparing: 'Ετοιμάζω...',
      locating: 'Εντοπισμός...',
      contact: 'επαφή',
      emergencyContact: 'Επαφή έκτακτης ανάγκης',
      allContacts: 'Όλες οι επαφές',
      localFile: 'τοπικό αρχείο',
      status: 'Κατάσταση',
      active: 'Ενεργό',
      ended: 'Τερματισμένο',
      testSos: 'Δοκιμή SOS',
      realSos: 'Πραγματικό SOS',
      localProfile: 'Τοπικό προφίλ',
      signedIn: 'Συνδεδεμένος',
      notSignedIn: 'Χωρίς σύνδεση',
      syncActive: 'Συγχρονισμός ενεργός',
      show: 'Εμφάνιση',
      hide: 'Απόκρυψη',
      email: 'Email',
      password: 'Κωδικός',
      minutes: 'λεπτά',
      minute: 'λεπτό',
      ready: 'έτοιμο',
      ok: 'OK',
      attention: 'Προσοχή',
      incomplete: 'Δεν ολοκληρώθηκε',
      english: 'English',
      greek: 'Ελληνικά',
    },
    pullRefresh: {
      pull: 'Τράβηξε για ανανέωση',
      release: 'Άφησε για ανανέωση',
      refreshing: 'Ανανέωση...',
      done: 'Η εφαρμογή ανανεώθηκε',
      blocked: 'Το SOS είναι ενεργό. Ανανέωσε χειροκίνητα μόνο αν χρειάζεται.',
      manual: 'Χειροκίνητη ανανέωση',
      failed: 'Δεν ήταν δυνατή η ανανέωση. Έλεγξε τη σύνδεση.',
    },
    home: {
      eyebrow: 'ΠΙΝΑΚΑΣ ΑΜΕΣΗΣ ΒΟΗΘΕΙΑΣ',
      title: 'Χρειάζεσαι άμεση βοήθεια;',
      subtitle: 'Άμεση πρόσβαση σε SOS, έμπιστες επαφές και τοποθεσία.',
      readinessEyebrow: 'ΕΤΟΙΜΟΤΗΤΑ SAFEME',
      readinessTitle: 'Ετοιμότητα SafeMe',
      testModeBadge: 'Δοκιμή SOS ενεργή',
      testModeHelper: 'Δεν αποστέλλεται πραγματικό μήνυμα έκτακτης ανάγκης.',
      testModeLabel: 'Δοκιμή SOS',
      testModeHint: 'Δεν αποστέλλεται πραγματική ειδοποίηση έκτακτης ανάγκης.',
      sosAvailable: 'SOS διαθέσιμο σε αυτή τη συσκευή.',
      sosPrompt: 'Πάτησε SOS μία φορά για άμεση ενεργοποίηση.',
      setupGuide: 'Δες τον σύντομο οδηγό πρώτης ρύθμισης.',
      readyToUse: 'Το SafeMe είναι έτοιμο για χρήση.',
      trustedContacts: 'Έμπιστες επαφές',
      openContactsList: 'Άνοιγμα λίστας και προσθήκης.',
      addContact: 'Προσθήκη επαφής',
      gpsLocation: 'GPS / Τοποθεσία',
      openLocationCheck: 'Άνοιγμα ελέγχου τοποθεσίας.',
      updateGps: 'Ενημέρωση GPS',
      accountSync: 'Λογαριασμός / sync',
      openSignIn: 'Άνοιγμα σύνδεσης.',
      signInToSync: 'Σύνδεση για συγχρονισμό',
      quickActionsEyebrow: 'ΓΡΗΓΟΡΕΣ ΕΝΕΡΓΕΙΕΣ',
      quickActionsTitle: 'Γρήγορη βοήθεια',
      emergencyCallTitle: 'Άμεση κλήση έκτακτης ανάγκης',
      emergencyCallNote: 'Χρησιμοποίησε τους αριθμούς έκτακτης ανάγκης μόνο σε πραγματική ανάγκη.',
      setupTitle: 'Πρώτη ρύθμιση SafeMe',
      setupSubtitle: 'Σύντομα βασικά βήματα πριν από πραγματική ανάγκη.',
      setupSummary: 'Τα βήματα είναι οδηγός προετοιμασίας και δεν μπλοκάρουν το SOS.',
      setupReady: 'Το SafeMe είναι έτοιμο για χρήση.',
      setupCompleteTitle: 'Το SafeMe είναι έτοιμο',
      setupCompleteSubtitle: 'Έχεις ολοκληρώσει τα βασικά βήματα ασφάλειας.',
      showSteps: 'Προβολή βημάτων',
      hideSteps: 'Απόκρυψη',
      safetyStatus: 'Κατάσταση',
      safetyReady: 'Το SOS είναι έτοιμο όταν το χρειαστείς',
      contactsReady: '{{count}} έμπιστες επαφές έτοιμες για ειδοποίηση',
      onlineChip: 'Σε σύνδεση',
      offlineChip: 'Εκτός σύνδεσης',
      contactsChip: '{{count}} έμπιστες επαφές',
      locationAvailable: 'Τοποθεσία διαθέσιμη',
      locationNeeded: 'Χρειάζεται GPS',
      contactsAvailable: '{{count}} επαφές διαθέσιμες{{primary}}',
      primaryContact: ' • κύρια: {{name}}',
      locationAccuracy: 'Τοποθεσία διαθέσιμη{{accuracy}}',
      accuracySuffix: ' • ακρίβεια περίπου {{meters}}μ.',
      accountSyncActive: 'Συγχρονισμός ενεργός',
    },
    sos: {
      activeTitle: 'SOS ενεργό',
      messageReady: 'Το μήνυμα SOS είναι έτοιμο.',
      testNoRealAlert: 'Δεν αποστέλλεται πραγματικό μήνυμα έκτακτης ανάγκης.',
      sendSmsAll: 'Αποστολή SMS σε όλες τις επαφές',
      endSos: 'Τερματισμός SOS',
      endOldSos: 'Τερματισμός παλιού SOS',
      sosInfo: 'Πληροφορίες SOS',
      started: 'Έναρξη',
      lastLocation: 'Τελευταία τοποθεσία',
      lastSync: 'Τελευταίος συγχρονισμός',
      liveUpdate: 'Live ενημέρωση',
      liveTracking: 'Live tracking',
      location: 'Τοποθεσία',
      noLocation: 'Χωρίς τοποθεσία',
      locationInMessage: 'Η τοποθεσία προστέθηκε στο μήνυμα SOS.',
      locationMissing: 'Δεν βρέθηκε τοποθεσία. Το SOS μπορεί να σταλεί χωρίς τοποθεσία.',
      trackingReady: 'Live tracking έτοιμο',
      trackingUnavailable: 'Live tracking μη διαθέσιμο σε αυτή τη δοκιμή.',
      openLiveTracking: 'Άνοιγμα live tracking',
      openGoogleMaps: 'Άνοιγμα στο Google Maps',
      noLocationHint: 'Χωρίς τοποθεσία — επίτρεψε Location στον browser ή πάτα «Ανανέωση GPS τώρα». Το SOS παραμένει ενεργό.',
      liveNote: 'Η αυτόματη ενημέρωση δουλεύει όσο η εφαρμογή μένει ανοιχτή. Αν GPS, χάρτης ή sync αποτύχουν, κράτα ανοιχτό αυτό το screen και χρησιμοποίησε αντιγραφή, κοινοποίηση ή κλήση.',
      liveActive: 'Live ενημέρωση ενεργή',
      contactsAndSends: 'Επαφές & αποστολές',
      safetyNote: 'Για λόγους ασφαλείας, το κινητό σου μπορεί να ζητήσει να πατήσεις αποστολή μέσα στο SMS app.',
      prepareNote: 'Το SafeMe ετοιμάζει το μήνυμα. Η αποστολή γίνεται από τη συσκευή σου όπου απαιτείται.',
      notificationHistory: 'Ιστορικό ειδοποιήσεων',
      diagnostics: 'Διαγνωστικά',
      browserLocationPermission: 'Άδεια browser location',
      lastBrowserGps: 'Τελευταίο browser GPS',
      lastSupabaseSync: 'Τελευταίο Supabase sync',
      supabaseSyncResult: 'Αποτέλεσμα Supabase sync',
      lastError: 'Τελευταίο σφάλμα',
      testLiveSync: 'Δοκιμή live sync τώρα',
      refreshGpsNow: 'Ανανέωση GPS τώρα',
      disableTracking: 'Απενεργοποίηση tracking link',
      shareLocation: 'Κοινή χρήση τοποθεσίας',
      copyTracking: 'Αντιγραφή',
      updateGps: 'Ενημέρωση GPS',
      autoUpdateActive: 'Ενεργή αυτόματη ενημέρωση',
      autoUpdateInactive: 'Ανενεργή αυτόματη ενημέρωση',
      notYet: 'Δεν υπάρχει ακόμα',
      activated: 'Το SOS ενεργοποιήθηκε',
      activatedTest: 'Λειτουργία δοκιμής SOS. Το SOS ενεργοποιήθηκε για δοκιμή.',
      activatedReal: 'Το SOS ενεργοποιήθηκε. Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.',
      modalTitle: 'Το SOS ενεργοποιήθηκε',
      modalDescription: 'Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.',
      sendSms: 'Αποστολή με SMS',
      sendWhatsapp: 'Αποστολή με WhatsApp',
      copyMessage: 'Αντιγραφή μήνυμα SOS',
      share: 'Κοινή χρήση',
      closeSos: 'Κλείσιμο',
      confirmEnd: 'Θέλεις σίγουρα να τερματίσεις το ενεργό SOS;',
      confirmDisableTracking: 'Θέλεις σίγουρα να απενεργοποιήσεις το tracking link; Η επαφή δεν θα μπορεί πλέον να βλέπει την τοποθεσία.',
      previousEnded: 'Το προηγούμενο SOS έχει τερματιστεί. Η εφαρμογή είναι σε κανονική κατάσταση.',
      smsQueueComplete: 'Ολοκληρώθηκε η σειρά SMS',
      smsQueueProgress: '{{prefix}} {{current}}/{{total}} προς {{name}}',
      testSms: 'Δοκιμή SMS',
      smsContactsProgress: 'Επαφές SMS: {{opened}} από {{total}} άνοιξε. {{status}} Το SafeMe άνοιξε το SMS. Πρέπει να πατήσεις αποστολή μέσα στην εφαρμογή μηνυμάτων.',
      queueComplete: 'Ολοκληρώθηκε η σειρά SMS.',
      openedForContact: 'Άνοιξε SMS προς {{name}}. Αν το έστειλες, συνέχισε στην επόμενη επαφή.',
      willOpenSms: 'Το SafeMe θα ανοίξει SMS για κάθε επαφή, μία-μία.',
      noTrustedContacts: 'Δεν υπάρχουν έμπιστες επαφές.',
      noPhoneContacts: 'Δεν υπάρχουν επαφές έκτακτης ανάγκης με αριθμό τηλεφώνου. Πρόσθεσε αριθμούς για να ετοιμαστεί SMS προς όλες τις επαφές.',
      prepareSmsEach: 'Το SafeMe ετοιμάζει SMS προς κάθε επαφή με αριθμό τηλεφώνου, μία-μία. Η αποστολή γίνεται από τη συσκευή σου.',
      testSmsQueue: 'Δοκιμαστική σειρά SMS. Το μήνυμα γράφει καθαρά ότι είναι δοκιμή.',
      noTrackingNote: 'Το SafeMe ετοιμάζει το μήνυμα. Η αποστολή γίνεται από τη συσκευή σου όπου απαιτείται. Δεν υπάρχει live tracking.',
      addContactForSms: 'Δεν υπάρχουν έμπιστες επαφές με αριθμό τηλεφώνου. Πρόσθεσε επαφή για να ετοιμαστεί SMS SOS.',
      resetSmsQueue: 'Η σειρά SMS επανήλθε στην πρώτη επαφή.',
      copiedForContact: 'Το SOS μήνυμα αντιγράφηκε για {{name}}.',
      opened: 'Άνοιξε',
      sent: 'Στάλθηκε',
      failed: 'Απέτυχε',
      notifyAllCapable: 'Προσθήκη επαφής',
      inviteTitle: 'Ενημέρωση έμπιστης επαφής',
      inviteDescription: 'Μπορείς να στείλεις ένα έτοιμο μήνυμα με SMS ή WhatsApp, ώστε η επαφή σου να γνωρίζει από πριν τι να κάνει αν λάβει SOS από εσένα. Δεν στέλνεται τίποτα αυτόματα — διάλεξε χειροκίνητα τον τρόπο αποστολής.',
      inviteMessage1: 'Σε έχω προσθέσει ως έμπιστη επαφή στο SafeMe.',
      inviteMessage2: 'Αν λάβεις SOS από εμένα, άνοιξε το link τοποθεσίας και προσπάθησε να επικοινωνήσεις μαζί μου.',
      inviteMessage3: 'Αν πιστεύεις ότι υπάρχει άμεσος κίνδυνος, κάλεσε τις υπηρεσίες έκτακτης ανάγκης στο 112 ή 199.',
      messageIntroTest: '🧪 ΔΟΚΙΜΗ SafeMe SOS — Δεν υπάρχει πραγματική ανάγκη.',
      messageIntroReal: '🚨 SOS από SafeMe',
      messageTestHeader: '🧪 ΔΟΚΙΜΗ SafeMe SOS',
      messageTestNoEmergency: 'Δεν υπάρχει πραγματική ανάγκη.',
      messageRealHeader: '🚨 SOS SafeMe',
      messageNeedHelp: 'Χρειάζομαι βοήθεια ΤΩΡΑ.',
      messageTestLocation: '📍 Τοποθεσία δοκιμής:',
      messageMyLocation: '📍 Τοποθεσία μου:',
      messageNavigate: '🧭 Πλοήγηση προς εμένα:',
      messageNavigateTest: '🧭 Πλοήγηση προς το σημείο:',
      messageGoogleFallback: 'Αν δεν ανοίξει σωστά, δοκίμασε Google Maps:',
      messageCoords: 'Συντεταγμένες: {{lat}}, {{lng}}',
      messageLocationUnavailable: 'Τοποθεσία: Δεν είναι διαθέσιμη αυτή τη στιγμή.',
      messageLiveTracking: '🔗 Live tracking:',
      messageName: '👤 Όνομα: {{name}}',
      messagePhone: '📞 Τηλέφωνο: {{phone}}',
      messageTime: '🕒 Ώρα ειδοποίησης: {{time}}',
    },
    contacts: {
      title: 'Έμπιστες επαφές',
      eyebrow: 'Trusted circle',
      noneYet: 'Δεν υπάρχουν ακόμα επαφές',
      addContact: 'Προσθήκη επαφής',
      addFirstContact: 'Προσθήκη πρώτης επαφής',
      closeForm: 'Κλείσιμο φόρμας',
      name: 'Όνομα',
      relationship: 'Σχέση',
      phone: 'Τηλέφωνο',
      emailOptional: 'Email (προαιρετικό)',
      saveContact: 'Αποθήκευση επαφής',
      sync: 'Συγχρονισμός',
      localMode: 'Τοπική λειτουργία',
      autoSync: 'Αυτόματος συγχρονισμός',
      refreshFromAccount: 'Ανανέωση επαφών από λογαριασμό',
      uploadLocal: 'Αποθήκευση τοπικών επαφών στον λογαριασμό',
      note: 'Καλό είναι οι έμπιστες επαφές να γνωρίζουν από πριν τι είναι το SafeMe.',
      advanced: 'Προχωρημένες ενέργειες',
      advancedSummary: 'Ενέργειες διαχείρισης επαφών',
      clearContacts: 'Καθαρισμός επαφών',
      call: 'Κλήση',
      edit: 'Επεξεργασία',
      delete: 'Διαγραφή',
      setPrimary: 'Ορισμός ως κύρια SOS',
      invite: 'Ενημέρωση επαφής',
      missingPhone: 'Χωρίς τηλέφωνο',
      confirmDelete: 'Θέλεις σίγουρα να διαγράψεις αυτή την επαφή;',
      deleteFailed: 'Δεν μπόρεσα να διαγράψω την επαφή. Δοκίμασε ξανά.',
      saveFailed: 'Δεν μπόρεσα να αποθηκεύσω την επαφή. Δοκίμασε ξανά.',
      setPrimaryFailed: 'Δεν μπόρεσα να ορίσω κύρια επαφή SOS. Δοκίμασε ξανά.',
      confirmClear: 'Θέλεις σίγουρα να διαγράψεις όλες τις έμπιστες επαφές;',
      confirmClearSignedIn: 'Θέλεις σίγουρα να διαγράψεις όλες τις έμπιστες επαφές; Οι επαφές του λογαριασμού θα διαγραφούν επίσης.',
      validationName: 'Συμπλήρωσε όνομα επαφής.',
      validationRelationship: 'Συμπλήρωσε τη σχέση της επαφής.',
      validationPhoneOrEmail: 'Συμπλήρωσε τηλέφωνο ή email για την επαφή.',
      validationEmail: 'Συμπλήρωσε έγκυρο email ή άφησέ το κενό.',
      validationPhone: 'Συμπλήρωσε έγκυρο τηλέφωνο, π.χ. 99878765 ή +35799878765.',
      savedToAccount: 'Η επαφή αποθηκεύτηκε στον λογαριασμό.',
      syncedAuto: 'Οι επαφές συγχρονίζονται αυτόματα.',
      localOnly: 'Τοπική λειτουργία: οι επαφές μένουν μόνο σε αυτή τη συσκευή.',
      syncError: 'Δεν έγινε συγχρονισμός επαφών. Έλεγξε τη σύνδεση και δοκίμασε ξανά.',
      syncing: 'Συγχρονίζω τις επαφές με τον λογαριασμό...',
      signedInAs: 'Συνδεδεμένος ως: {{email}}',
      noEmail: 'χωρίς email',
      supabaseAutoSync: 'Κατάσταση: Αυτόματος συγχρονισμός Supabase',
      remoteContacts: 'Remote contacts: {{count}}',
      lastLoad: 'Τελευταία φόρτωση από λογαριασμό: {{time}}',
      lastSave: 'Τελευταία αποθήκευση στον λογαριασμό: {{time}}',
      supabaseError: 'Σφάλμα Supabase: {{error}}',
      signInToSync: 'Συνδέσου για συγχρονισμό επαφών',
      syncDisabled: 'Οι ενέργειες συγχρονισμού λογαριασμού είναι απενεργοποιημένες.',
    },
    safetyTools: {
      eyebrow: 'Safety tools',
      title: 'Εργαλεία Ασφάλειας',
      subtitle: 'Όλα τα εργαλεία πρόληψης και τοποθεσίας σε ένα καθαρό σημείο, ξεχωριστά από το SOS της αρχικής.',
      safeWalk: 'Safe Walk',
      safeWalkDesc: 'Ξεκίνα μια ασφαλή διαδρομή. Αν δεν επιβεβαιώσεις ότι έφτασες, το SafeMe θα ενεργοποιήσει SOS.',
      startSafeWalk: 'Έναρξη Safe Walk',
      checkIn: 'Check-in Ασφαλείας',
      checkInDesc: 'Στείλε γρήγορη επιβεβαίωση ότι είσαι καλά.',
      doCheckIn: 'Κάνε Check-in',
      currentLocation: 'Τρέχουσα Τοποθεσία',
      currentLocationDesc: 'Δες και μοιράσου την τρέχουσα θέση σου με τις επαφές σου.',
      viewLocation: 'Προβολή τοποθεσίας',
      testSos: 'Δοκιμή SOS',
      testSosDesc: 'Δοκίμασε το SOS χωρίς να σταλεί πραγματική ειδοποίηση.',
      testMode: 'Test Mode',
      safeWalkEyebrow: 'SafeMe monitored trip',
      safeWalkIntro: 'Ξεκίνα μια ασφαλή διαδρομή. Για γρήγορη δοκιμή διάλεξε «1 λεπτό test». Αν δεν επιβεβαιώσεις ότι έφτασες/είσαι καλά πριν λήξει ο χρόνος, το SafeMe θα ενεργοποιήσει SOS.',
      whereGoing: 'Πού πας;',
      estimatedDuration: 'Εκτιμώμενη διάρκεια',
      oneMinuteTest: '1 λεπτό test',
      customMinutes: 'Προσαρμοσμένα λεπτά',
      arrivedSafe: 'Έφτασα / Είμαι καλά',
      refreshLocation: 'Ανανέωση τοποθεσίας',
      cancelSafeWalk: 'Ακύρωση Safe Walk',
      destination: 'Destination',
      startedTime: 'Started time',
      expectedArrival: 'Expected arrival time',
      latestLocationTime: 'Latest location time',
      checkInEyebrow: 'SafeMe check-in timer',
      checkInTitle: 'Check-in ασφαλείας',
      checkInIntro: 'Βάλε χρονόμετρο. Αν δεν πατήσεις ότι είσαι καλά πριν λήξει, το SafeMe θα ενεργοποιήσει SOS όσο η εφαρμογή είναι ανοιχτή.',
      quickTime: 'Γρήγορη επιλογή χρόνου',
      customTime: 'Προσαρμοσμένος χρόνος',
      startCheckIn: 'Έναρξη check-in',
      iAmOk: 'Είμαι καλά',
      cancelCheckIn: 'Ακύρωση check-in',
      expiryTime: 'Expiry time',
      locationPrompt: 'Πάτησε ανανέωση για να βρεθεί η θέση σου.',
      safeWalkActive: 'Safe Walk ενεργό',
      safeWalkMonitoring: 'Το SafeMe παρακολουθεί τη διαδρομή όσο η εφαρμογή είναι ανοιχτή.',
      checkInActive: 'Check-in ενεργό',
      checkInMonitoring: 'Το SafeMe παρακολουθεί το χρονόμετρο ασφαλείας.',
    },
    profile: {
      eyebrow: 'Προφίλ χρήστη',
      fillProfile: 'Συμπλήρωσε το προφίλ σου',
      noPhone: 'Δεν έχει προστεθεί τηλέφωνο',
      localProfile: 'Τοπικό προφίλ',
      notSignedIn: 'Δεν είσαι συνδεδεμένος.',
      signedInEmail: 'Συνδεδεμένος • {{email}}',
      noEmail: 'χωρίς email',
      localHint: 'Το SOS λειτουργεί τοπικά, αλλά οι επαφές, το ιστορικό και το live tracking δεν συγχρονίζονται.',
      signInToSync: 'Σύνδεση για συγχρονισμό',
      profileDetails: 'Στοιχεία προφίλ',
      editProfile: 'Επεξεργασία προφίλ',
      username: 'Όνομα χρήστη',
      phone: 'Τηλέφωνο',
      saveProfile: 'Αποθήκευση προφίλ',
      medicalNotes: 'Ιατρικές σημειώσεις',
      medicalNotesField: 'Σημείωση έκτακτης ανάγκης / ιατρικές σημειώσεις',
      medicalPlaceholder: 'Προαιρετικό: αλλεργίες, φάρμακα ή άλλο σημαντικό στοιχείο',
      medicalHelper: 'Προαιρετικό: αλλεργίες, φάρμακα ή άλλο σημαντικό στοιχείο',
      saveChanges: 'Αποθήκευση αλλαγών',
      clearData: 'Καθαρισμός δεδομένων',
      notesEmpty: 'Δεν έχουν συμπληρωθεί',
      sosHistory: 'Ιστορικό SOS',
      noHistory: 'Δεν υπάρχει ακόμα ιστορικό',
      sosLog: 'SOS log',
      historyStatus: 'Τα SOS αποθηκεύονται στον λογαριασμό σου και στο τοπικό αντίγραφο.',
      lastSos: 'Τελευταίο SOS',
      totalSos: 'Σύνολο SOS',
      viewHistory: 'Προβολή ιστορικού',
      showAll: 'Προβολή όλων',
      hideHistory: 'Απόκρυψη ιστορικού',
      account: 'Λογαριασμός',
      signIn: 'Σύνδεση',
      signInHelper: 'Συνδέσου για συγχρονισμό επαφών και ιστορικού SOS.',
      signedInAs: 'Συνδεδεμένος ως',
      createAccount: 'Δημιουργία λογαριασμού',
      repeatPassword: 'Επανάληψη κωδικού',
      rememberEmail: 'Να θυμάσαι το email μου',
      rememberHelper: 'Αποθηκεύεται μόνο το email.',
      signupNote: 'Στο επόμενο στάδιο θα προστεθεί σύνδεση με τηλέφωνο/SMS.',
      logout: 'Αποσύνδεση',
      noAccount: 'Δεν έχεις λογαριασμό; Δημιουργία',
      hasAccount: 'Έχεις ήδη λογαριασμό; Σύνδεση',
      forgotPassword: 'Ξέχασα τον κωδικό μου',
      passwordResetEyebrow: 'Επαναφορά κωδικού',
      passwordResetTitle: 'Ορισμός νέου κωδικού',
      passwordResetHelper: 'Γράψε τον νέο κωδικό σου για να συνεχίσεις.',
      newPassword: 'Νέος κωδικός',
      repeatNewPassword: 'Επανάληψη νέου κωδικού',
      changePassword: 'Αλλαγή κωδικού',
      localImportEyebrow: 'Saved on this device',
      localImportTitle: 'Βρέθηκαν τοπικά στοιχεία έκτακτης ανάγκης',
      localImportSummary: 'Θέλεις να τα αποθηκεύσεις στον λογαριασμό σου;',
      saveToAccount: 'Αποθήκευση στον λογαριασμό',
      skip: 'Παράλειψη',
      validationName: 'Συμπλήρωσε όνομα προφίλ.',
      validationPhone: 'Συμπλήρωσε τηλέφωνο προφίλ.',
      savedSynced: 'Τα στοιχεία αποθηκεύτηκαν και συγχρονίστηκαν στο Supabase.',
      savedLocal: 'Τα στοιχεία αποθηκεύτηκαν τοπικά στη συσκευή σου.',
      savedSessionOnly: 'Το προφίλ ενημερώθηκε για αυτή τη συνεδρία, αλλά ο browser δεν επέτρεψε localStorage.',
      savedLocalSyncFailed: 'Αποθηκεύτηκε τοπικά, αλλά απέτυχε ο συγχρονισμός Supabase: {{error}}',
      confirmClearData: 'Θέλεις σίγουρα να σβήσεις όλα τα αποθηκευμένα στοιχεία από αυτή τη συσκευή;',
      confirmLogout: 'Θέλεις σίγουρα να αποσυνδεθείς από αυτόν τον λογαριασμό;',
    },
    auth: {
      signedOut: 'Χωρίς σύνδεση. Τα στοιχεία αποθηκεύονται με ασφάλεια μόνο σε αυτή τη συσκευή.',
      signedIn: 'Συγχρονισμός ενεργός.',
      signupSuccess: 'Ο λογαριασμός δημιουργήθηκε και είσαι συνδεδεμένη.',
      signupPending: 'Αν αυτό είναι νέο email, έλεγξε το inbox σου για επιβεβαίωση. Αν έχεις ήδη λογαριασμό, πάτησε Σύνδεση.',
      logoutSuccess: 'Αποσυνδέθηκες επιτυχώς.',
      passwordResetSent: 'Σου στείλαμε email για επαναφορά κωδικού, αν υπάρχει λογαριασμός με αυτό το email.',
      passwordResetReady: 'Άνοιξε η φόρμα για να ορίσεις νέο κωδικό.',
      passwordResetSuccess: 'Ο κωδικός άλλαξε. Μπορείς να συνδεθείς με τον νέο κωδικό.',
      networkError: 'Δεν ήταν δυνατή η επικοινωνία με την υπηρεσία σύνδεσης. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
      resetEmailRequired: 'Συμπλήρωσε πρώτα το email σου για να στείλουμε οδηγίες επαναφοράς.',
      serviceNotLoaded: 'Η υπηρεσία σύνδεσης δεν φορτώθηκε. Κάνε refresh και δοκίμασε ξανά.',
      supabaseLocal: 'Το Supabase δεν φορτώθηκε. Η εφαρμογή είναι σε τοπική λειτουργία.',
      invalidCredentials: 'Το email ή ο κωδικός δεν είναι σωστός.',
      emailNotConfirmed: 'Το email δεν έχει επιβεβαιωθεί ακόμη.',
      noConnection: 'Δεν υπάρχει σύνδεση με την υπηρεσία σύνδεσης.',
      accountExists: 'Υπάρχει ήδη λογαριασμός με αυτό το email. Πάτησε Σύνδεση ή χρησιμοποίησε ‘Ξέχασα τον κωδικό μου’.',
      passwordRejected: 'Ο κωδικός δεν έγινε δεκτός. Χρησιμοποίησε τουλάχιστον 6 χαρακτήρες.',
      genericError: 'Δεν ολοκληρώθηκε η ενέργεια σύνδεσης. Δοκίμασε ξανά σε λίγο.',
      openProfile: 'Χωρίς σύνδεση. Άνοιγμα σύνδεσης στο Προφίλ',
      appOnline: 'Η εφαρμογή είναι online',
      signupHelper: 'Φτιάξε λογαριασμό για συγχρονισμό SOS.',
      loginHelper: 'Συγχρόνισε επαφές και ιστορικό SOS.',
      passwordMismatch: 'Οι κωδικοί δεν ταιριάζουν.',
      storageSignedIn: 'Supabase + τοπικό αντίγραφο',
      storageLocal: 'Τοπικό προφίλ σε αυτή τη συσκευή',
      accountActiveSos: 'Λογαριασμός ενεργός: τα στοιχεία SOS συγχρονίζονται.',
      sosOnDevice: 'SOS διαθέσιμο σε αυτή τη συσκευή.',
      emergencyInProgress: 'Η κατάσταση ανάγκης είναι σε εξέλιξη.',
    },
    settings: {
      eyebrow: 'Κέντρο ελέγχου',
      title: 'Ρυθμίσεις SafeMe',
      subtitle: 'Σύντομος έλεγχος για λογαριασμό, SOS, GPS και δεδομένα.',
      sosMode: 'SOS λειτουργία',
      realMode: 'Πραγματική λειτουργία',
      testActive: 'Δοκιμή ενεργή',
      testModeToggle: 'Λειτουργία δοκιμής SOS',
      testModeNote: 'Η λειτουργία δοκιμής δεν στέλνει πραγματικό μήνυμα έκτακτης ανάγκης.',
      locationGps: 'Τοποθεσία & GPS',
      locationAvailable: 'Τοποθεσία διαθέσιμη',
      needsUpdate: 'Χρειάζεται ενημέρωση',
      noLocationYet: 'Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα.',
      locationUsage: 'Η τοποθεσία χρησιμοποιείται για το μήνυμα SOS και το live tracking.',
      sync: 'Συγχρονισμός',
      autoSyncActive: 'Αυτόματος συγχρονισμός ενεργός',
      localMode: 'Τοπική λειτουργία',
      syncStatusSignedIn: 'Συνδεδεμένος ως {{email}}. Ο συγχρονισμός επαφών είναι ενεργός.',
      syncStatusLocal: 'Τοπική λειτουργία σε αυτή τη συσκευή.',
      syncNote: 'Οι επαφές και το ιστορικό συγχρονίζονται όταν είσαι συνδεδεμένος.',
      openProfile: 'Άνοιγμα προφίλ',
      openContacts: 'Άνοιγμα επαφών',
      recheckApp: 'Επανέλεγχος εφαρμογής',
      privacy: 'Απόρρητο & σημαντική σημείωση',
      privacySummary: 'Ασφάλεια, δεδομένα και υπεύθυνη χρήση',
      privacy1: 'Το SafeMe είναι βοηθητικό εργαλείο προσωπικής ασφάλειας και δεν αποτελεί πιστοποιημένη υπηρεσία έκτακτης ανάγκης. Δεν αντικαθιστά τις επίσημες υπηρεσίες έκτακτης ανάγκης. Σε άμεσο κίνδυνο κάλεσε αμέσως το 112 ή τις τοπικές αρχές.',
      privacy2: 'Τα στοιχεία σου, οι έμπιστες επαφές και η τοποθεσία χρησιμοποιούνται μόνο για λειτουργίες ασφάλειας όπως SOS, συγχρονισμό και κοινοποίηση τοποθεσίας. Μην χρησιμοποιείς την εφαρμογή για ψεύτικες ειδοποιήσεις ή καταχρηστική παρακολούθηση.',
      privacy3: 'Πριν χρησιμοποιήσεις το SOS σε πραγματική ανάγκη, κάνε δοκιμή σε ασφαλές περιβάλλον.',
      privacy4: 'Το προφίλ, οι έμπιστες επαφές, η τελευταία τοποθεσία, η λειτουργία δοκιμής SOS και πρόσφατες ενέργειες κρατούνται τοπικά στη συσκευή.',
      privacy5: 'Όταν είσαι συνδεδεμένος, το προφίλ, οι επαφές, το ιστορικό SOS και οι ενεργές συνεδρίες live tracking συγχρονίζονται με Supabase.',
      legal: 'Νομικά & απόρρητο',
      privacyPolicy: 'Πολιτική Απορρήτου',
      terms: 'Όροι Χρήσης',
      support: 'Υποστήριξη',
      displayLanguage: 'Εμφάνιση & γλώσσα',
      currentLanguage: 'Τρέχουσα γλώσσα: {{language}}.',
      languageLabel: 'Γλώσσα εφαρμογής',
      languageHelp: 'Επίλεξε γλώσσα για μενού, κουμπιά και μηνύματα SOS.',
      immediateHelp: 'Άμεση βοήθεια',
      immediateHelpSummary: '112 και SOS ενέργειες',
      immediateHelpNote: 'Γρήγορη πρόσβαση σε επίσημες κλήσεις έκτακτης ανάγκης όταν χρειάζεσαι άμεση βοήθεια.',
      emergencyOnly: 'Χρησιμοποίησε τις κλήσεις έκτακτης ανάγκης μόνο σε πραγματική ανάγκη.',
      advanced: 'Προχωρημένες ενέργειες',
      advancedSummary: 'Ενέργειες διαχείρισης',
      advancedNote: 'Οι παρακάτω ενέργειες αλλάζουν ή διαγράφουν κατάσταση της εφαρμογής και ζητούν επιβεβαίωση.',
      appVersion: 'Έκδοση εφαρμογής',
      version: 'Έκδοση:',
      loaded: 'Φορτώθηκε:',
      environment: 'Περιβάλλον:',
      clearLocalData: 'Καθαρισμός τοπικών δεδομένων',
      accuracyAbout: '{{location}} • ακρίβεια περίπου {{meters}}μ.',
    },
    accountBanner: {
      notSignedIn: 'Δεν είσαι συνδεδεμένος.',
      localSos: 'Τοπική λειτουργία: το SOS λειτουργεί σε αυτή τη συσκευή.',
      signInToSync: 'Σύνδεση για συγχρονισμό',
    },
    topbar: {
      personalSafety: 'Προσωπική ασφάλεια',
      shareLocation: 'Μοιράσου θέση',
    },
    sidebar: {
      ariaNav: 'Βασικό μενού πλοήγησης',
      brandAria: 'SafeMe αρχική',
      menuAria: 'Μενού εφαρμογής',
      helper: 'Γρήγορη πρόσβαση σε βοήθεια, όπου κι αν βρίσκεσαι.',
      safetyApp: 'Safety app',
    },
    location: {
      shareText: 'Η τρέχουσα θέση μου από το SafeMe.',
      shareFailed: 'Δεν μπόρεσα να μοιραστώ τη θέση. Δοκίμασε ξανά.',
      searching: 'Ψάχνω την τρέχουσα θέση σου...',
      checking: 'Γίνεται έλεγχος τοποθεσίας...',
      updated: 'Η τοποθεσία ενημερώθηκε επιτυχώς.',
      unavailable: 'Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα. Έλεγξε τα δικαιώματα του browser.',
      permissionDenied: 'Δεν δόθηκε άδεια τοποθεσίας. Ενεργοποίησε Location permission για τον browser.',
      unavailableRetry: 'Δεν μπόρεσα να βρω τη θέση. Δοκίμασε ξανά σε λίγα δευτερόλεπτα.',
      deviceUnavailable: 'Η τοποθεσία δεν είναι διαθέσιμη σε αυτή τη συσκευή.',
      blocked: 'Η πρόσβαση στην τοποθεσία είναι μπλοκαρισμένη. Πάτα το λουκετάκι δίπλα από το URL και επίτρεψε Location.',
      permissionGranted: 'Επιτρέπεται',
      permissionDeniedShort: 'Μπλοκαρισμένη',
      permissionPrompt: 'Θα ζητηθεί άδεια',
      refreshPrompt: 'Πάτησε ανανέωση για να βρεθεί η θέση σου.',
      onlineSyncHint: 'Η εφαρμογή είναι online. Για συγχρονισμό λογαριασμού, συνδέσου από το Προφίλ.',
    },
    health: {
      eyebrow: 'SafeMe app health',
      title: 'Έλεγχος εφαρμογής',
      subtitle: 'Κάνε έναν γρήγορο έλεγχο για να βεβαιωθείς ότι το SafeMe είναι έτοιμο.',
      copyReport: 'Αντιγραφή αναφοράς ελέγχου',
      quickActions: 'Γρήγορες ενέργειες ελέγχου',
      openProfile: 'Άνοιγμα προφίλ',
      openContacts: 'Άνοιγμα επαφών',
      checkLocation: 'Έλεγχος τοποθεσίας',
      testSos: 'Δοκιμή SOS',
      testCheckIn: 'Δοκιμή Check-in',
      testSafeWalk: 'Δοκιμή Safe Walk',
      readyBeta: 'Το SafeMe είναι έτοιμο για beta δοκιμή.',
      needsAttention: 'Υπάρχουν ακόμα σημεία που χρειάζονται έλεγχο.',
      reportCopied: 'Η αναφορά ελέγχου αντιγράφηκε.',
      reportCopyFailed: 'Δεν μπόρεσα να αντιγράψω την αναφορά. Δοκίμασε ξανά.',
      disclaimer: 'Ο έλεγχος δεν αντικαθιστά πραγματική δοκιμή σε κινητό και δεν εγγυάται λειτουργία στο background.',
      reportTitle: 'SafeMe αναφορά ελέγχου',
      account: 'Λογαριασμός',
      profile: 'Προφίλ',
      contacts: 'Επαφές',
      location: 'Τοποθεσία',
      liveTracking: 'Live tracking',
      testSosLabel: 'Δοκιμαστικό SOS',
      checkin: 'Check-in',
      safeWalk: 'Safe Walk',
      accountOk: 'Υπάρχει ενεργή σύνδεση και οι δυνατότητες συγχρονισμού είναι διαθέσιμες.',
      accountWarn: 'Χωρίς σύνδεση, το SafeMe δουλεύει τοπικά αλλά δεν έχει live tracking link.',
      profileOk: 'Το όνομα και το τηλέφωνο υπάρχουν στο προφίλ SOS.',
      profileIncomplete: 'Συμπλήρωσε όνομα και τηλέφωνο για πιο χρήσιμο μήνυμα SOS.',
      contactsOk: 'Υπάρχουν {{count}} έμπιστες επαφές διαθέσιμες.',
      contactsIncomplete: 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή για ειδοποίηση.',
      locationOk: 'Υπάρχει πρόσφατη τοποθεσία αποθηκευμένη στη συσκευή.',
      locationWarn: 'Δεν υπάρχει ακόμα τοποθεσία. Κάνε έλεγχο permission/GPS στον browser.',
      liveTrackingOk: 'Υπάρχει ενεργό signed-in SOS με share token για δημόσιο tracking link.',
      liveTrackingWarn: 'Το live tracking απαιτεί signed-in ενεργό SOS. Η εφαρμογή μπορεί να δημιουργήσει share token όταν ξεκινήσει SOS.',
      liveTrackingIncomplete: 'Το live tracking απαιτεί σύνδεση και ενεργό SOS. Χωρίς σύνδεση το SOS μένει τοπικό.',
      testSosOk: 'Έχει ολοκληρωθεί δοκιμαστικό SOS σε αυτή τη συσκευή.',
      testSosIncomplete: 'Ενεργοποίησε λειτουργία δοκιμής και ετοίμασε ένα SOS χωρίς πραγματική ανάγκη.',
      checkinOk: 'Η λειτουργία Check-in υπάρχει και είναι έτοιμη για δοκιμή από τα Εργαλεία Ασφάλειας.',
      checkinWarn: 'Δεν εντοπίστηκαν όλα τα στοιχεία του Check-in Timer στη σελίδα.',
      safeWalkOk: 'Η λειτουργία Safe Walk υπάρχει και είναι έτοιμη για δοκιμή από τα Εργαλεία Ασφάλειας.',
      safeWalkWarn: 'Δεν εντοπίστηκαν όλα τα στοιχεία του Safe Walk στη σελίδα.',
      trustedContact: 'Έμπιστη επαφή',
      checkInTimer: 'Check-in Timer',
      reportDateTime: 'Ημερομηνία/ώρα: {{datetime}}',
    },
    setup: {
      completeProfile: 'Συμπλήρωσε προφίλ',
      openProfile: 'Άνοιγμα προφίλ',
      addContact: 'Πρόσθεσε έμπιστη επαφή',
      openContacts: 'Άνοιγμα επαφών',
      checkGps: 'Έλεγξε GPS',
      testSos: 'Κάνε δοκιμή SOS',
    },
    publicTracking: {
      eyebrow: 'SafeMe SOS link',
      title: 'Ενεργό SOS SafeMe',
      loading: 'Φορτώνω την κατάσταση SOS...',
      diagnosticCode: 'Κωδικός διαγνωστικών: {{code}}',
      statusActive: 'Ενεργό',
      statusEnded: 'Τερματισμένο',
      bannerActive: 'Υπάρχει ενεργό SOS.',
      bannerEnded: 'Το SOS έχει τερματιστεί.',
      status: 'Κατάσταση',
      started: 'Έναρξη SOS',
      lastLocation: 'Τελευταία τοποθεσία',
      lastRefresh: 'Τελευταία ανανέωση σελίδας',
      guidanceTitle: 'Τι να κάνεις τώρα',
      step1: 'Προσπάθησε να επικοινωνήσεις με το άτομο.',
      step2: 'Άνοιξε την Τοποθεσία SOS SafeMe στο Google Maps.',
      step3: 'Αν πιστεύεις ότι υπάρχει άμεσος κίνδυνος, κάλεσε τις υπηρεσίες έκτακτης ανάγκης.',
      locationTitle: 'Τοποθεσία SOS SafeMe',
      mapTitle: 'Τοποθεσία SOS SafeMe',
      locationNote: 'Αυτή είναι η τελευταία γνωστή τοποθεσία του ατόμου.',
      coordinates: 'Συντεταγμένες: {{coords}}',
      copyCoordinates: 'Αντιγραφή συντεταγμένων',
      noLocation: 'Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα. Δοκίμασε ξανά σε λίγα δευτερόλεπτα.',
      navigateGoogle: 'Πλοήγηση στο Google Maps',
      navigateApple: 'Πλοήγηση στο Apple Maps',
      openGoogle: 'Άνοιγμα στο Google Maps',
      refreshLocation: 'Ανανέωση τοποθεσίας',
      autoRefresh: 'Η σελίδα ανανεώνεται αυτόματα όσο το SOS είναι ενεργό.',
      notReady: 'Το live tracking δεν είναι έτοιμο ακόμα. Έλεγξε τη σύνδεσή σου και δοκίμασε ανανέωση.',
      permissionDenied: 'Δεν επιτρέπεται η δημόσια πρόσβαση στο live tracking (RPC/RLS). Ο διαχειριστής πρέπει να εκτελέσει το SQL από το supabase/schema.sql.md.',
      invalidToken: 'Ο σύνδεσμος SOS δεν είναι έγκυρος.',
      networkError: 'Δεν ήταν δυνατή η επικοινωνία με το live tracking. Δοκίμασε ανανέωση.',
    },
    global: {
      errorRecover: 'Κάτι πήγε στραβά, αλλά η εφαρμογή παραμένει ανοιχτή. Δοκίμασε ξανά.',
      supabaseUnknown: 'Άγνωστο σφάλμα Supabase',
    },
    shareLocation: {
      button: 'Μοιράσου θέση',
    },
    runtime: {
      permissionGranted: 'Επιτρέπεται',
      permissionBlocked: 'Μπλοκαρισμένη',
      errorLabel: 'Σφάλμα',
      sosActivated: 'Το SOS ενεργοποιήθηκε.',
      activeSosStarted: 'Το ενεργό SOS ξεκίνησε.',
      checkInExpiredSos: 'Το check-in έληξε και ενεργοποιήθηκε SOS τοπικά.',
      noLiveLocationSupport: 'Η συσκευή δεν υποστηρίζει live τοποθεσία.',
      autoLocationUpdateFailed: 'Η αυτόματη ενημέρωση τοποθεσίας απέτυχε. Μπορείς να πατήσεις χειροκίνητα ενημέρωση.',
      sosLocationUpdated: 'Η τοποθεσία SOS ενημερώθηκε.',
      updatingSosLocation: 'Ενημερώνω την τοποθεσία SOS...',
      noLocationForLiveUpdate: 'Δεν υπάρχει διαθέσιμη τοποθεσία για live ενημέρωση ακόμα.',
      testingLiveSync: 'Δοκιμάζω live sync στο Supabase...',
      liveSyncSuccess: 'Επιτυχία: το live sync ενημέρωσε το Supabase τώρα.',
      requestingGps: 'Ζητάω νέα θέση GPS από τον browser...',
      sosMessageCopied: 'Το μήνυμα SOS αντιγράφηκε.',
      sosMessageCopyFailed: 'Δεν μπόρεσα να αντιγράψω το μήνυμα SOS. Δοκίμασε ξανά.',
      trackingLinkCopied: 'Το tracking link αντιγράφηκε.',
      trackingLinkCopyFailed: 'Δεν μπόρεσα να αντιγράψω το tracking link. Δοκίμασε ξανά.',
      trackingLinkDisabled: 'Το tracking link απενεργοποιήθηκε.',
      endingSos: 'Τερματίζω το SOS...',
      sosEndedLocal: 'Το SOS τερματίστηκε τοπικά.',
      sosEndedPublic: 'Το SOS τερματίστηκε. Το public tracking link δείχνει πλέον τερματισμένο/inactive.',
      activatingSos: 'ενεργοποίηση SOS',
      checkInActiveBlockSafeWalk: 'Υπάρχει ήδη ενεργό check-in. Τερμάτισέ το πριν ξεκινήσεις Safe Walk.',
      completeProfileFirst: 'Συμπλήρωσε πρώτα το προφίλ σου με όνομα και τηλέφωνο.',
      addContactFirst: 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή πριν ξεκινήσεις Safe Walk.',
      addContactFirstCheckIn: 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή πριν ξεκινήσεις check-in.',
      refreshLocationFirst: 'Πάτησε πρώτα «Ανανέωση» στην τοποθεσία και επίτρεψε Location στον browser για Safe Walk.',
      safeWalkActiveBlockCheckIn: 'Υπάρχει ήδη ενεργό Safe Walk. Τερμάτισέ το πριν ξεκινήσεις check-in.',
      destinationNotSet: 'Δεν ορίστηκε',
      notYetAvailable: 'Δεν υπάρχει ακόμα',
      safeWalkTestStarted: 'Ξεκίνησε 1-minute Safe Walk test. Πάτησε «Έφτασα / Είμαι καλά» πριν μηδενίσει για να ολοκληρωθεί.',
      safeWalkStarted: 'Το Safe Walk ξεκίνησε. Επιβεβαίωσε ότι έφτασες/είσαι καλά πριν λήξει.',
      safeWalkCompleted: 'Το Safe Walk ολοκληρώθηκε. Είσαι ασφαλής.',
      safeWalkCancelled: 'Το Safe Walk ακυρώθηκε.',
      safeWalkRefreshingLocation: 'Ανανεώνω την τοποθεσία Safe Walk...',
      safeWalkLocationUpdated: 'Η τοποθεσία Safe Walk ενημερώθηκε.',
      safeWalkNoLocation: 'Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα.',
      safeWalkExpiredBackground: 'Το Safe Walk έληξε όσο η εφαρμογή δεν ήταν ενεργή. Πάτησε SOS αν χρειάζεσαι βοήθεια.',
      safeWalkRestored: 'Το ενεργό Safe Walk αποκαταστάθηκε σε αυτή τη συσκευή.',
      safeWalkExpiredSos: 'Το Safe Walk έληξε και ενεργοποιήθηκε SOS.',
      checkInStarted: 'Το check-in ξεκίνησε. Πάτησε «Είμαι καλά» πριν λήξει.',
      checkInCompleted: 'Το check-in ολοκληρώθηκε. Είσαι ασφαλής.',
      checkInCancelled: 'Το check-in ακυρώθηκε.',
      checkInExpiredBackground: 'Το check-in έληξε όσο η εφαρμογή δεν ήταν ενεργή. Πάτησε SOS αν χρειάζεσαι βοήθεια.',
      checkInRestored: 'Το ενεργό check-in αποκαταστάθηκε σε αυτή τη συσκευή.',
      checkInExpiredSos: 'Το check-in έληξε και ενεργοποιήθηκε SOS.',
      checkInExpiredSosLocal: 'Το check-in έληξε και ενεργοποιήθηκε SOS τοπικά. Συνδέσου για live tracking link.',
      noPrimaryContact: 'Δεν βρέθηκε κύρια επαφή.',
      sosLocalOnly: 'Το SOS λειτουργεί τοπικά σε αυτή τη συσκευή. Συνδέσου για live tracking link.',
      testModeActive: 'Λειτουργία δοκιμής SOS. Δεν πρόκειται για πραγματική ανάγκη.',
      copyTrackingLink: 'Αντιγραφή tracking link',
      noContactsForTestSms: 'Δεν υπάρχουν έμπιστες επαφές με αριθμό τηλεφώνου. Πρόσθεσε επαφή για να ετοιμαστεί δοκιμαστικό SMS.',
      shareNotSupported: 'Η κοινή χρήση δεν υποστηρίζεται σε αυτόν τον browser.',
      shareCancelled: 'Η κοινή χρήση ακυρώθηκε.',
      shareFailed: 'Δεν μπόρεσα να ανοίξω την κοινή χρήση.',
      needContactForSos: 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή πριν χρησιμοποιήσεις το SOS.',
      needProfileForSos: 'Συμπλήρωσε το όνομα και το τηλέφωνό σου πριν χρησιμοποιήσεις το SOS.',
      testSosWithTracking: 'Δοκιμαστικό SOS με live tracking έτοιμο.',
      sosWithoutLocation: 'Το SOS ενεργοποιήθηκε χωρίς διαθέσιμη τοποθεσία. Μπορείς να πατήσεις «Ενημέρωση τοποθεσίας τώρα».',
      sosCreated: 'Δημιουργήθηκε ενεργό SOS.',
      sosLocalNoTracking: 'Το SOS ενεργοποιήθηκε τοπικά σε αυτή τη συσκευή. Δεν δημιουργήθηκε ακόμη live tracking link.',
      sosLocalSignInTracking: 'Το SOS ενεργοποιήθηκε σε αυτή τη συσκευή. Συνδέσου για live tracking link.',
      sosPreparedSaved: 'Το SOS αποθηκεύτηκε στο ιστορικό.',
      sosPreparedNotSaved: 'Το SOS δεν αποθηκεύτηκε στο ιστορικό.',
      sosActivateFailed: 'Δεν μπόρεσα να ενεργοποιήσω SOS. Δοκίμασε ξανά.',
      inviteCopied: 'Το μήνυμα αντιγράφηκε.',
      inviteCopyFailed: 'Δεν μπόρεσα να αντιγράψω το μήνυμα. Δοκίμασε ξανά.',
      uploadingContacts: 'Αποθηκεύω τις τοπικές επαφές στον λογαριασμό...',
      contactsUploaded: 'Οι τοπικές επαφές αποθηκεύτηκαν στον λογαριασμό.',
      importingLocal: 'Αποθηκεύω τα τοπικά στοιχεία στον λογαριασμό...',
      importSaved: 'Τα τοπικά στοιχεία αποθηκεύτηκαν στον λογαριασμό.',
      importFailed: 'Δεν αποθηκεύτηκαν στον λογαριασμό. Τα στοιχεία παραμένουν στη συσκευή και μπορείς να δοκιμάσεις ξανά.',
      importSkipped: 'Παράλειψη εισαγωγής. Τα τοπικά στοιχεία παραμένουν σε αυτή τη συσκευή.',
      restoredActiveSos: 'Υπάρχει έγκυρο ενεργό SOS από προηγούμενη χρήση. Αν ήταν δοκιμή, πάτησε Τερματισμός SOS.',
      previousSosEnded: 'Το προηγούμενο SOS είχε τερματιστεί και δεν αποκαταστάθηκε.',
      restoredSosStatus: 'Αποκαταστάθηκε ενεργό SOS από προηγούμενη χρήση.',
      accountSyncFailed: 'Δεν έγινε συγχρονισμός λογαριασμού. Το SOS παραμένει διαθέσιμο τοπικά και μπορείς να δοκιμάσεις ξανά.',
      passwordMinLength: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.',
      passwordsMismatch: 'Οι κωδικοί δεν ταιριάζουν.',
      dataCleared: 'Τα αποθηκευμένα στοιχεία διαγράφηκαν από αυτή τη συσκευή.',
      localDataCleared: 'Τα τοπικά δεδομένα διαγράφηκαν από αυτή τη συσκευή.',
      copiedForContact: 'Το SOS μήνυμα αντιγράφηκε για {{name}}.',
      profilePart: 'προφίλ',
      contactsPart: 'επαφές',
    },
  },
};

let currentLocale = DEFAULT_LOCALE;
let onLocaleChange = null;

function normalizeLocale(value) {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'el' || next.startsWith('el-')) return 'el';
  if (next === 'en' || next.startsWith('en-')) return 'en';
  return null;
}

function getNestedMessage(locale, key) {
  const parts = String(key || '').split('.');
  let node = messages[locale];
  for (const part of parts) {
    if (!node || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, name) => (
    vars[name] !== undefined && vars[name] !== null ? String(vars[name]) : ''
  ));
}

export function t(key, vars) {
  const primary = getNestedMessage(currentLocale, key);
  const fallback = getNestedMessage(DEFAULT_LOCALE, key);
  const value = primary ?? fallback ?? key;
  return vars ? interpolate(value, vars) : value;
}

export function getLocale() {
  return currentLocale;
}

export function getDateLocale() {
  return currentLocale === 'el' ? 'el-GR' : 'en-GB';
}

export function getLanguageLabel(locale = currentLocale) {
  return locale === 'el' ? messages.el.common.greek : messages.en.common.english;
}

export function getPageTitleKey(page) {
  return `pageTitle.${page}`;
}

export function getPublicTrackingError(key) {
  return t(`publicTracking.${key}`);
}

export function resolveLocaleFromUrl(searchParams = new URLSearchParams(window.location.search)) {
  return normalizeLocale(searchParams.get('lang'));
}

export function readStoredLocale() {
  try {
    const standalone = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    if (standalone) return standalone;

    const profileRaw = localStorage.getItem('safety-app-user-profile');
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      const fromProfile = normalizeLocale(profile?.preferredLanguage || profile?.preferred_language);
      if (fromProfile) return fromProfile;
    }
  } catch {}
  return DEFAULT_LOCALE;
}

export function persistLocale(locale) {
  const normalized = normalizeLocale(locale) || DEFAULT_LOCALE;
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {}
  return normalized;
}

export function setLocale(nextLocale, options = {}) {
  const normalized = normalizeLocale(nextLocale) || DEFAULT_LOCALE;
  if (!SUPPORTED_LOCALES.includes(normalized)) return currentLocale;
  currentLocale = normalized;
  if (options.persist !== false) persistLocale(normalized);
  document.documentElement.lang = normalized;
  if (typeof onLocaleChange === 'function') onLocaleChange(normalized);
  return currentLocale;
}

export function initLocale(preferredLocale) {
  const fromArg = normalizeLocale(preferredLocale);
  const fromUrl = resolveLocaleFromUrl();
  const fromStorage = readStoredLocale();
  const resolved = fromUrl || fromArg || fromStorage || DEFAULT_LOCALE;
  return setLocale(resolved, { persist: false });
}

export function registerLocaleChangeHandler(handler) {
  onLocaleChange = handler;
}

export function applyStaticTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (!key) return;
    element.textContent = t(key);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (!key) return;
    element.setAttribute('placeholder', t(key));
  });

  root.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    const key = element.getAttribute('data-i18n-aria');
    if (!key) return;
    element.setAttribute('aria-label', t(key));
  });

  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const key = element.getAttribute('data-i18n-title');
    if (!key) return;
    element.setAttribute('title', t(key));
  });
}

function setDomText(root, selector, key, vars) {
  root.querySelectorAll(selector).forEach((element) => {
    element.textContent = t(key, vars);
  });
}

function setDomAria(root, selector, key) {
  root.querySelectorAll(selector).forEach((element) => {
    element.setAttribute('aria-label', t(key));
  });
}

function setDomPlaceholder(root, selector, key) {
  root.querySelectorAll(selector).forEach((element) => {
    element.setAttribute('placeholder', t(key));
  });
}

export function applyDomBindings(root = document) {
  setDomAria(root, '.sidebar', 'sidebar.ariaNav');
  setDomAria(root, '.brand', 'sidebar.brandAria');
  setDomAria(root, '.nav-list', 'sidebar.menuAria');
  setDomText(root, '.sidebar-card p', 'sidebar.helper');
  setDomText(root, '.topbar .eyebrow', 'topbar.personalSafety');
  setDomText(root, '#share-location-button', 'topbar.shareLocation');
  setDomAria(root, '#online-status-pill', 'auth.appOnline');
  setDomText(root, '#pull-refresh-message', 'pullRefresh.pull');
  setDomText(root, '#pull-refresh-manual', 'pullRefresh.manual');

  setDomText(root, '.home-emergency-intro .eyebrow', 'home.eyebrow');
  setDomText(root, '.home-emergency-intro h2', 'home.title');
  setDomText(root, '.home-emergency-intro p', 'home.subtitle');
  setDomText(root, '#home-readiness-card .home-dashboard-card-header .eyebrow', 'home.readinessEyebrow');
  setDomText(root, '#home-readiness-title', 'home.readinessTitle');
  setDomText(root, '#home-test-mode-badge', 'home.testModeBadge');
  setDomText(root, '#home-test-mode-helper', 'home.testModeHelper');
  setDomText(root, '.home-sos-test-toggle strong', 'home.testModeLabel');
  setDomText(root, '.home-sos-test-toggle small', 'home.testModeHint');
  setDomText(root, '#sos-button small', 'common.tap');
  setDomText(root, '#home-quick-actions-title', 'home.quickActionsTitle');
  setDomText(root, '.home-quick-actions .eyebrow', 'home.quickActionsEyebrow');
  setDomText(root, '#emergency-call-title', 'home.emergencyCallTitle');
  setDomText(root, '.emergency-call-section > p', 'home.emergencyCallNote');

  const quickCardSpan = root.querySelector('.quick-card > span');
  if (quickCardSpan) quickCardSpan.textContent = t('home.contactsReady', { count: '' }).replace(/\{\{count\}\}\s*/, '');

  setDomText(root, '#contacts-readiness-card h3', 'home.trustedContacts');
  setDomText(root, '#location-readiness-card h3', 'home.gpsLocation');
  setDomText(root, '#account-readiness-card h3', 'home.accountSync');
  setDomText(root, '#home-add-contact-cta', 'home.addContact');
  setDomText(root, '#home-refresh-gps-cta', 'home.updateGps');
  setDomText(root, '#home-login-sync-cta', 'home.signInToSync');

  setDomText(root, '.home-quick-action[data-open-tool="contacts"]', 'nav.contacts');
  setDomText(root, '.home-quick-action[data-open-tool="gps"]', 'home.updateGps');
  setDomText(root, '.home-quick-action[data-open-tool="sos-settings"]', 'settings.sosMode');
  setDomText(root, '.home-quick-action[data-open-tool="sos-history"]', 'profile.sosHistory');
  setDomText(root, '.home-quick-action[data-open-tool="share-location"]', 'topbar.shareLocation');

  setDomText(root, '#active-sos-title', 'sos.activeTitle');
  setDomText(root, '#active-sos-test-mode-label', 'common.testSos');
  setDomText(root, '.active-sos-info summary', 'sos.sosInfo');
  setDomText(root, '.active-sos-contacts summary', 'sos.contactsAndSends');
  setDomText(root, '.active-sos-debug summary', 'sos.diagnostics');
  setDomText(root, '#sos-contact-notify-title', 'sos.contactsAndSends');
  setDomText(root, '.active-sos-safety-note', 'sos.safetyNote');
  setDomText(root, '#sos-contact-notify .sos-contact-notify-header > div > p:last-child', 'sos.prepareNote');
  setDomText(root, '#sos-notification-history-title', 'sos.notificationHistory');
  setDomText(root, '#notify-all-sos-contacts-action', 'sos.sendSmsAll');
  setDomText(root, '#notify-all-sos-contacts', 'sos.sendSmsAll');
  setDomText(root, '#active-sos-call-112', 'common.call112');
  setDomText(root, '#copy-active-sos-message', 'common.copy');
  setDomText(root, '#share-active-sos-location', 'sos.shareLocation');
  setDomText(root, '#copy-active-sos-tracking', 'common.copy');
  setDomText(root, '#update-active-sos-location', 'sos.updateGps');
  setDomText(root, '#active-sos-live-note', 'sos.liveNote');
  setDomText(root, '#test-active-sos-live-sync', 'sos.testLiveSync');
  setDomText(root, '#refresh-active-sos-gps', 'sos.refreshGpsNow');
  setDomText(root, '#disable-active-sos-tracking', 'sos.disableTracking');

  root.querySelectorAll('.active-sos-details dt, .active-sos-debug-details dt').forEach((dt) => {
    const label = dt.textContent.trim();
    const map = {
      'Κατάσταση': 'common.status', Status: 'common.status',
      'Έναρξη': 'sos.started', Started: 'sos.started',
      'Τελευταία τοποθεσία': 'sos.lastLocation', 'Last location': 'sos.lastLocation',
      'Τελευταίος συγχρονισμός': 'sos.lastSync', 'Last sync': 'sos.lastSync',
      'Live ενημέρωση': 'sos.liveUpdate', 'Live update': 'sos.liveUpdate',
      'Live tracking': 'sos.liveTracking',
      'Τοποθεσία': 'sos.location', Location: 'sos.location',
      'Άδεια browser location': 'sos.browserLocationPermission',
      'Τελευταίο browser GPS': 'sos.lastBrowserGps',
      'Τελευταίο Supabase sync': 'sos.lastSupabaseSync',
      'Αποτέλεσμα Supabase sync': 'sos.supabaseSyncResult',
      'Τελευταίο σφάλμα': 'sos.lastError',
    };
    if (map[label]) dt.textContent = t(map[label]);
  });

  setDomText(root, '#contacts .contacts-summary-card h2', 'contacts.title');
  setDomText(root, '#contacts-add-cta', 'contacts.addContact');
  setDomText(root, '#contacts-add-toggle strong', 'contacts.addContact');
  setDomText(root, '#contacts-sync-toggle strong', 'contacts.sync');
  setDomText(root, '#contacts-advanced-toggle strong', 'contacts.advanced');
  setDomText(root, '#contacts-advanced-toggle small', 'contacts.advancedSummary');
  setDomText(root, '.contacts-note', 'contacts.note');
  setDomText(root, '#clear-contacts-button', 'contacts.clearContacts');
  setDomText(root, '#refresh-account-contacts', 'contacts.refreshFromAccount');
  setDomText(root, '#upload-local-contacts', 'contacts.uploadLocal');
  setDomText(root, '#contact-form label:nth-child(1) span', 'contacts.name');
  setDomText(root, '#contact-form label:nth-child(2) span', 'contacts.relationship');
  setDomText(root, '#contact-form label:nth-child(3) span', 'contacts.phone');
  setDomText(root, '#contact-form label:nth-child(4) span', 'contacts.emailOptional');
  setDomText(root, '#contact-form [type="submit"]', 'contacts.saveContact');
  setDomText(root, '[data-close-add-contact]', 'common.close');

  setDomText(root, '#safety-tools .section-heading h2', 'safetyTools.title');
  setDomText(root, '#safety-tools .section-heading p', 'safetyTools.subtitle');
  setDomText(root, '#safe-walk-title', 'safetyTools.safeWalk');
  setDomText(root, '.safe-walk-intro', 'safetyTools.safeWalkIntro');
  setDomText(root, '.safe-walk-destination-label span', 'safetyTools.whereGoing');
  setDomText(root, '.safe-walk-custom-label span', 'safetyTools.customMinutes');
  setDomText(root, '#safe-walk-start-button', 'safetyTools.startSafeWalk');
  setDomText(root, '#safe-walk-safe-button', 'safetyTools.arrivedSafe');
  setDomText(root, '#safe-walk-refresh-location', 'safetyTools.refreshLocation');
  setDomText(root, '#safe-walk-cancel-button', 'safetyTools.cancelSafeWalk');
  setDomText(root, '#checkin-title', 'safetyTools.checkInTitle');
  setDomText(root, '.checkin-intro', 'safetyTools.checkInIntro');
  setDomText(root, '.checkin-custom-label span', 'safetyTools.customTime');
  setDomText(root, '#checkin-start-button', 'safetyTools.startCheckIn');
  setDomText(root, '#checkin-safe-button', 'safetyTools.iAmOk');
  setDomText(root, '#checkin-cancel-button', 'safetyTools.cancelCheckIn');
  setDomText(root, '#current-location-card h3', 'safetyTools.currentLocation');
  setDomText(root, '#refresh-location-button', 'common.refresh');

  setDomText(root, '#profile-edit-toggle strong', 'profile.profileDetails');
  setDomText(root, '#profile-medical-toggle strong', 'profile.medicalNotes');
  setDomText(root, '#profile-sos-toggle strong', 'profile.sosHistory');
  setDomText(root, '#profile-account-toggle strong', 'profile.account');
  setDomText(root, '#profile-details-panel label span', 'profile.username', null);
  setDomText(root, '#profile-details-panel label:nth-child(2) span', 'profile.phone');
  setDomText(root, '#profile-details-panel [type="submit"]', 'profile.saveProfile');
  setDomText(root, '#profile-medical-panel label span', 'profile.medicalNotesField');
  setDomText(root, '#profile-medical-panel .field-helper', 'profile.medicalHelper');
  setDomText(root, '#profile-medical-panel [type="submit"]', 'profile.saveChanges');
  setDomText(root, '#clear-data-button', 'profile.clearData');
  setDomText(root, '#sos-history-title', 'profile.sosHistory');
  setDomText(root, '.sos-history-status-line', 'profile.historyStatus');
  setDomText(root, '#sos-history-toggle', 'profile.viewHistory');
  setDomText(root, '#sos-history-show-all', 'profile.showAll');
  setDomText(root, '#sos-history-collapse', 'profile.hideHistory');

  setDomText(root, '#settings-summary-title', 'settings.title');
  setDomText(root, '.settings-summary-copy .eyebrow', 'settings.eyebrow');
  setDomText(root, '.settings-summary-copy > p', 'settings.subtitle');
  setDomText(root, '#settings-sos-toggle strong', 'settings.sosMode');
  setDomText(root, '#settings-location-toggle strong', 'settings.locationGps');
  setDomText(root, '#settings-sync-toggle strong', 'settings.sync');
  setDomText(root, '#settings-privacy-toggle strong', 'settings.privacy');
  setDomText(root, '#settings-privacy-toggle small', 'settings.privacySummary');
  setDomText(root, '#settings-display-toggle strong', 'settings.displayLanguage');
  setDomText(root, '#settings-help-toggle strong', 'settings.immediateHelp');
  setDomText(root, '#settings-help-toggle small', 'settings.immediateHelpSummary');
  setDomText(root, '#settings-advanced-toggle strong', 'settings.advanced');
  setDomText(root, '#settings-advanced-toggle small', 'settings.advancedSummary');
  setDomText(root, '#settings-language-label', 'settings.languageLabel');
  setDomText(root, '#settings-language-help', 'settings.languageHelp');
  setDomText(root, '#settings-refresh-location', 'home.updateGps');
  setDomText(root, '#settings-open-profile', 'settings.openProfile');
  setDomText(root, '#settings-open-contacts', 'settings.openContacts');
  setDomText(root, '#settings-refresh-app', 'settings.recheckApp');
  setDomText(root, '#settings-logout', 'profile.logout');
  setDomText(root, '#settings-clear-data', 'settings.clearLocalData');

  setDomText(root, '#contact-invite-title', 'sos.inviteTitle');
  setDomText(root, '#contact-invite-description', 'sos.inviteDescription');
  setDomText(root, '#contact-invite-sms', 'sos.sendSms');
  setDomText(root, '#contact-invite-whatsapp', 'sos.sendWhatsapp');
  setDomText(root, '#contact-invite-copy', 'common.copy');
  setDomText(root, '#sos-action-title', 'sos.modalTitle');
  setDomText(root, '#sos-action-description', 'sos.modalDescription');
  setDomText(root, '#sos-emergency-call-title', 'home.emergencyCallTitle');
  setDomText(root, '#sos-send-sms', 'sos.sendSms');
  setDomText(root, '#sos-send-whatsapp', 'sos.sendWhatsapp');
  setDomText(root, '#sos-copy-message', 'sos.copyMessage');
  setDomText(root, '#sos-native-share', 'sos.share');
  setDomText(root, '[data-close-sos]', 'common.close');

  root.querySelectorAll('.emergency-call-button, #active-sos-call-112, a[href="tel:112"]').forEach((el) => {
    if (el.textContent.includes('112')) el.textContent = t('common.call112');
  });
  root.querySelectorAll('a[href="tel:199"]').forEach((el) => {
    el.textContent = t('common.call199');
  });
}

export { DEFAULT_LOCALE, SUPPORTED_LOCALES, STORAGE_KEY };
