export default {
    previewGate: {
      title: 'You need to sign up first',
      body: 'To do this, you must sign up and complete the matchmaking form first.',
      signup: 'Sign up',
      dismiss: 'Skip',
    },
  appErrorBoundary: {
    title: 'Something went wrong',
    body: 'The page could not be loaded. Please try refreshing.',
    tryAgain: 'Try again',
    reload: 'Reload page',
  },
    pwa: {
      install: {
        title: 'Install the app',
        lead:
          'Add to your home screen for faster access. Enable notifications to get instant alerts for messages, likes, and match requests.',
        installButton: 'Install app',
        installed: 'Installed',
      preview: {
        matches: {
          title: 'My Profile: Matches',
          body: 'Matches, requests and chats are managed from the My Profile screen.',
        },
        pool: {
          title: 'Pool: Candidates',
          body: 'You can browse candidates and send requests or likes.',
        },
        request: {
          title: 'Send a match request',
          body: 'These buttons are a preview. To perform real actions, you must sign up and complete the application form first.',
        },
      },
        installedHint: 'The app is on your home screen. You can also enable notifications.',
        installAvailableHint: 'Your browser supports installation. Click to install.',
        installNotAvailableHint:
          'If you don’t see an install button: use your browser menu and choose “Add to Home Screen / Install app” (on some devices it appears after the first visit over HTTPS).',
        ios: {
          title: 'For iPhone/iPad (Safari)',
          step1: 'Open the site in Safari.',
          step2: 'Tap Share (square with arrow).',
          step3: 'Choose “Add to Home Screen” and confirm.',
        },
        notifications: {
          title: 'Notifications',
          lead: 'If you enable notifications (when supported), we can notify you about:',
          button: 'Enable notifications',
          testButton: 'Send test notification',
          testHint: 'Enable notifications first (push token registration).',
          testTitle: 'Test notification',
          testBody: 'This is a test notification.',
          testSent: 'Test notification sent (it may take a few seconds).',
          testFailed: 'Could not send test notification (no token or missing setup).',
          testNoTokens: 'No push token found. Click "Enable notifications" first, then try again.',
          alreadyEnabled: 'Notification permission is already enabled.',
          enabled: 'Notifications enabled.',
          enabledButNotSaved:
            'Notifications are enabled, but we could not save your push token to the server. Please log in and try again (or refresh).',
          denied: 'Notification permission was not granted. You can allow it in your browser settings.',
          notSupported: 'Notifications are not supported on this browser/device.',
          notSecureContext: 'Notifications require HTTPS. Please open the site over https.',
          serviceWorkerNotReady: 'Notification system is not ready yet. Refresh and try again.',
          missingSetup: 'Push setup missing: VAPID key is not configured.',
          invalidVapidKey: 'Push setup is invalid: VAPID key is not valid. Copy the correct Public key from Firebase Console.',
          notLoggedIn: 'You need to be logged in to enable notifications.',
          error: 'Could not enable notifications. Please try again.',
          note:
            'Note: On some devices you must add the app to the home screen first. Background push notifications may require additional setup.',
          items: {
            newMessage: 'New message in the active match',
            newLike: 'Like / interaction',
            profileAccess: 'Profile view request / approval',
            shortMessage: 'Short message / first message',
            activeMatch: 'Active match request / approval',
            poolCandidates: 'New candidates in the pool',
          },
          photos: {
            showMine: 'Show my photos',
            hideMine: 'Hide my photos',
            reciprocityHint: 'Note: If you hide your photos, you also cannot see their photos (reciprocity).',
            reciprocityConfirm:
              "If you hide your photos, you also cannot see this person’s photos (reciprocity). Continue?",
            reciprocityBlocked: 'Photos are locked because you hid your photos.',
          },
          photoAccess: {
            needOtherPermission: "To view photos, you need the other person’s permission.",
            request: 'Request photo access',
            status: {
              pending: 'Request sent (pending)',
              approved: 'Request approved',
              granted: 'Access already granted',
              unknown: 'Status: {{status}}',
            },
            actions: {
              requested: 'Request sent',
              granted: 'Access granted',
            },
          },
        },
      },
    },

    panel: {
      membership: {
        title: 'Membership terms',
        lead: 'Membership terms:',
        freeActiveTermsTitle: 'Free activation terms',
      },
    },

  navigation: {
    siteTitle: "Uniqah",
    siteSubtitle: "PT MoonStar Global Indonesia",
     taglineTravelOrg: "Travel organization",
     taglineWeddingGuidance: "Wedding guidance",
    home: "Home",
    about: "About",
    corporate: "Corporate",
    travel: "Travel",
    explore: "Explore",
    tours: "Tours",
    wedding: "Wedding Guidance",
    matchmaking: "Matchmaking",
    panel: "My profile",
    documents: "Documents",
    youtube: "YouTube",
    contact: "Contact",
    language: "Language",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    close: "Close",
  },

  matchmakingPreview: {
    badge: 'My Profile preview',
    title: 'Preview the My Profile screen (tutorial)',
    subtitle:
      'The sections below are a preview. To send requests, like, or message, you must sign up first and complete the application form.',
    actions: {
      signup: 'Sign up',
      goProfile: 'Go to My Profile',
      goApply: 'Fill the form',
    },
    gate: {
      title: 'You must sign up first',
      body: 'To like, message, or send a match request, you must sign up and complete the form first.',
      ctaSignup: 'Sign up and fill the form',
      ctaApply: 'Go to the form',
    },
    cards: {
      matches: {
        title: 'Matches',
        body: 'Track requests, likes, and matches here.',
        cta: 'View matches',
      },
      pool: {
        title: 'Pool',
        body: 'Browse candidates and send requests or likes.',
        cta: 'Go to pool',
        request: 'Send match request',
        like: 'Like',
      },
      chat: {
        title: 'Chat',
        body: 'If you match, you can chat here.',
        mockTitle: 'Sample chat',
        mockSystem: 'System',
        mockMsg1: 'Hi, how are you?',
        mockMsg2: 'I’m good, thanks. How about you?',
        inputPlaceholder: 'Type a message…',
        send: 'Send',
        gateHint: 'Sign up first to chat.',
      },
    },
    note: 'Note: This is a preview; real data appears on your profile page.',
  },

  footer: {
    brandBlurb:
      'A brand of {{company}}. We connect people with care — and support your journey from meeting to marriage.',
    brandsTitle: 'Brands',
    brandNoteDameturk: '',
    sections: {
      quickLinks: 'Quick Links',
      legal: 'Legal',
      contact: 'Contact',
      social: 'Social',
    },
    links: {
      membership: 'Membership',
      whatsapp: 'WhatsApp',
    },
    legal: {
      documents: 'Documents',
      userAgreement: 'Matchmaking User Agreement',
      kvkkNotice: 'Personal Data Notice (KVKK)',
      siteRules: 'Site Rules',
      refundPolicy: 'Cancellation & Refund Policy',
        confirmError: 'Confirmation failed: {{error}}',
        contactRequestError: 'Contact request failed: {{error}}',
        contactApproveError: 'Contact approval failed: {{error}}',
      title: 'Company Information',
      labels: {
        legalName: 'Legal name',
        address: 'Address',
        tax: 'Tax',
        nib: 'NIB',
      },
    },
    phoneNotes: {
      trLine: 'WhatsApp line',
      idLine: 'Alternative WhatsApp line',
    },
    whatsappMessages: {
      general: 'Hello, I’d like to get information.',
      wedding: 'Hello, I’d like to get information about wedding guidance and the Uniqah process.',
      youtube: 'Hello, I have a question about your YouTube content.',
      contact: 'Hello, I want to contact you.',
      home: 'Hello, I’m visiting your site and would like more information.',
    },
    social: {
      instagram: 'Instagram',
      youtube: 'YouTube',
      whatsapp: 'WhatsApp',
    },
    copyright: '© {{year}} {{company}}. All rights reserved.',
  },

  tour: {
    common: {
      skip: 'Skip',
      next: 'Next',
      done: 'Done',
      missingHint: 'This step is not visible right now. You can continue.',
    },
    onboarding: {
      matches: {
        title: 'Matches',
        body: 'Manage likes, requests, and matches on this screen.',
      },
      pool: {
        title: 'Pool',
        body: 'Browse candidates and send a match request.',
      },
      request: {
        title: 'Match request',
        body: 'Send a match request. If the other user approves, a match is created.',
      },
    },
    like: {
      title: 'Like',
      body: 'Use Like to show interest. You can undo it later.',
    },
    activeStart: {
      title: 'Active match',
      body: 'After mutual like, start the active match to open chat.',
    },
    chat: {
      input: {
        title: 'Message',
        body: 'Type your message here.',
      },
      send: {
        title: 'Send',
        body: 'Use this button to send your message.',
      },
    },
    profileDetails: {
      title: 'Profile details',
      body: 'Request permission to view profile details.',
    },
  },

  ui: {
    lightbox: {
      close: 'Close',
      prev: 'Previous',
      next: 'Next',
      imageAlt: 'Image {{index}}',
    },
  },

  studio: {
    common: {
      back: 'Back',
      open: 'Open',
      close: 'Close',
      cancel: 'Cancel',
      send: 'Send',
      loading: 'Loading…',
      processing: 'Processing…',
      readMore: 'Read more',
      readLess: 'Show less',
      match: 'Match',
      profile: 'Profile',
      verified: 'Verified',
      unknown: 'Unknown',
      zoom: 'Enlarge',
      enlargePhotoAria: 'Enlarge photo of {{name}}',
    },

    presence: {
      online: 'Online',
      lastSeenMinutes_one: 'Last active: {{count}} min ago',
      lastSeenMinutes_other: 'Last active: {{count}} min ago',
      lastSeenHours_one: 'Last active: {{count}} hour ago',
      lastSeenHours_other: 'Last active: {{count}} hours ago',
      lastSeenDays_one: 'Last active: {{count}} day ago',
      lastSeenDays_other: 'Last active: {{count}} days ago',
    },

    errors: {
      generic: 'Error',
    },

    referral: {
      title: 'Invite a Friend',
      description: 'Invite a friend. Once both of you complete identity verification, you both get free membership.',
      myCodeLabel: 'Your invite code',
      copy: 'Copy',
      copied: 'Copied.',
      enterCodeLabel: 'Invite code',
      enterCodePlaceholder: 'UC-1001',
      acceptButton: 'Confirm code',
      invitedByLabel: 'Invited by',
      claimButton: 'Claim free membership',
      statusAccepted: 'Invite code saved.',
      statusAlreadyAccepted: 'This invite code is already saved.',
      statusClaimed: 'Reward applied. Your membership has been updated.',
      statusAlreadyClaimed: 'Reward already claimed.',
      errors: {
        referralDisabled: 'Referral system is currently disabled.',
        userCodeMissing: 'Your invite code is not ready yet. Please try again later.',
        invalidInviteCode: 'Invalid invite code.',
        inviteCodeNotFound: 'Invite code not found.',
        selfReferralNotAllowed: 'You cannot use your own code.',
        alreadyReferred: 'You have already used an invite code.',
        referralNotFound: 'Referral record not found.',
        referralNotAccepted: 'Referral is not accepted yet.',
        referralMismatch: 'Referral data mismatch.',
        verificationRequired: 'Both users must be identity-verified to claim the reward.',
      },
    },

    feedback: {
      nav: 'Support / Report',
      backToProfile: 'Back to my profile',
      title: 'Support • Feedback • Report an issue',
      subtitle: 'Send suggestions/comments or report steps that are not working.',
      urgentNote: 'For urgent complaints that require evidence, fastest path:',
      whatsappCta: 'WhatsApp support',
      kindLabel: 'Category',
      kinds: {
        bug: 'Bug / Not working',
        suggestion: 'Suggestion / Feedback',
        complaint: 'Complaint (short)',
        other: 'Other',
      },
      matchIdLabel: 'Match ID (optional)',
      matchIdPlaceholder: 'If you have a matchId',
      stepLabel: 'Step (optional)',
      stepPlaceholder: 'e.g. “Send chat message”',
      messageLabel: 'Message',
      messagePlaceholder:
        'What happened, what did you expect, on which screen? If possible add date/time and brief details. (Do not share contact info.)',
      privacyNote: 'Privacy: Do not share contact information.',
      submit: 'Submit',
      success: 'We received your report. Thank you!',
      ticketId: 'Ticket',
      error: 'Error',
      footerNote: 'Note: This form is sent to support. Response time may vary based on workload.',

      screenshotLabel: 'Screenshot (optional)',
      screenshotDisabled: 'Screenshot upload is disabled in this environment (Cloudinary not configured).',
      selectedFile: 'Selected file',
      uploading: 'Uploading screenshot…',
      uploadFailed: 'Upload failed',

      sendToWhatsApp: 'WhatsApp support with ticket',
      sendToWhatsAppHint: 'Ticket and matchId are included automatically.',
    },

    inbox: {
      likesTitle: 'Incoming likes ({{count}})',
      likeReceived: 'Sent you a like',
      viewProfile: 'View profile',
      accept: 'Like back',
      reject: 'Reject',
      modalTitleMessages: 'Messages',
      modalTitleRequests: 'Requests',
    },

    accessInbox: {
      title: 'Profile access requests ({{count}})',
      requested: 'Requests access to view your profile',
      approve: 'Allow',
      reject: 'Reject',
      openButton: 'Incoming requests',
      openButtonWithCount: 'Incoming requests ({{count}})',
    },

    inboxModal: {
      emptyMessages: 'No new messages right now.',
      emptyRequests: 'No new requests right now.',
      new: 'New',
      markRead: 'Mark read',
      read: 'Read',
      reviewProfile: 'Review profile',
      hideProfile: 'Hide profile',
      approve: 'Approve',
      allow: 'Allow',
      prev: 'Prev',
      next: 'Next',
      photoAlt: 'Photo',
      wantChildren: 'Wants children',
      requestText: {
        preMatch: 'Sent a pre-match request.',
        photoAccess: 'Requests permission to view your photos.',
        profileAccess: 'Requests permission to view your profile.',
      },
    },

    pool: {
      title: 'Explore',
      backToMatches: '← Back to matches',
      refresh: 'Refresh',
      lastUpdated: 'Auto-refreshes (20s).',
      countHint: 'Total: {{total}} • Shown: {{shown}}',
      filtersHint: 'Age range: {{min}} – {{max}}',
      empty: 'No profiles to show right now.',
      requestProfileNow: 'Send match request',
      requesting: 'Requesting…',
      requestSent: 'Request sent',
      openProfile: 'Open profile',
      goToMatchCard: 'Go to match card',
      profileModalTitle: 'Profile',
      actionsSoon: 'Coming soon: short message',
      notInTheirRange: 'To interact, you must be within their age range.',
      notInTheirRangeShort: 'Age range mismatch',
    },

    waitingNote: {
      title: 'We are looking for a suitable match',
      body:
        'We are searching for matches that fit your profile information and criteria. Suitable profiles will appear in the <explore>Explore</explore> tab. Install the app and enable notifications to get instant updates.',
    },

    paywall: {
      upgradeTitle: 'Membership activation required',
      upgradeToInteract: 'Activate membership to continue. Free for now.',
      upgradeToReply: 'Activate membership to reply. Free for now.',
      upgradeCta: 'Activate membership (Free)',
    },

    profileGate: {
      important: 'IMPORTANT',
      title: 'Complete your profile',
      body: 'Complete the profile form to chat and send/answer requests.',
      cta: 'Fill the profile form',
      badge: 'Unknown user',
    },

    membershipModal: {
      deletePhrase: 'delete my account',
      deleteTypePrompt: 'If you really want to delete the account: type "{{phrase}}".',
    },
    myInfo: {
      title: 'My info',
      subtitle: 'A summary of the information you provided in your application.',
      noProfile: 'Profile record not found.',
      appMissing: 'Application details not found. (Application record or user profile data may be missing.)',
      sections: {
        basic: 'Basic info',
        contact: 'Contact',
        details: 'Details',
        partner: 'Partner preferences',
        about: 'About you',
        membership: 'Membership & verification',
      },

      contactPrivacyNotice:
        'Your contact details (WhatsApp/email/Instagram) are private. They are not shown publicly while you fill the form or in the app UI. They may only be shared with the person you are definitively matched with after the 48-hour active match period, and only with your approval.',
      fields: {
        username: 'Username',
        fullName: 'Full name',
        age: 'Age',
        gender: 'Gender',
        city: 'City',
        country: 'Country',
        nationality: 'Nationality',
        whatsapp: 'WhatsApp',
        email: 'Email',
        instagram: 'Instagram',
        heightCm: 'Height (cm)',
        weightKg: 'Weight (kg)',
        occupation: 'Occupation',
        education: 'Education',
        educationDepartment: 'Department',
        maritalStatus: 'Marital status',
        hasChildren: 'Has children?',
        childrenCount: 'Children count',
        childrenLivingSituation: 'Lives with children?',
        familyApprovalStatus: 'Family approval',
        religion: 'Religion',
        religiousValues: 'Religious values',
        incomeLevel: 'Income',
        marriageTimeline: 'Marriage timeline',
        relocationWillingness: 'Relocation',
        preferredLivingCountry: 'Preferred living country',
        communicationLanguage: 'Communication language',
        communicationLanguageOther: 'Communication language (other)',
        smoking: 'Smoking',
        alcohol: 'Alcohol',
        nativeLanguage: 'Native language',
        nativeLanguageOther: 'Native language (other)',
        foreignLanguages: 'Foreign languages',
        foreignLanguageOther: 'Foreign language (other)',
        lookingForGender: 'Looking for (gender)',
        lookingForNationality: 'Looking for (nationality)',
        partnerAgeMin: 'Age (min)',
        partnerAgeMax: 'Age (max)',
        partnerHeightMinCm: 'Height (min cm)',
        partnerHeightMaxCm: 'Height (max cm)',
        partnerMaritalStatus: 'Marital status',
        partnerReligion: 'Religion',
        partnerCommunicationMethods: 'Communication methods',
        partnerLivingCountry: 'Living country',
        partnerSmokingPreference: 'Smoking',
        partnerAlcoholPreference: 'Alcohol',
        partnerChildrenPreference: 'Children',
        partnerEducationPreference: 'Education',
        partnerOccupationPreference: 'Occupation',
        partnerFamilyValuesPreference: 'Family values',
        about: 'About',
        expectations: 'Expectations',
        membershipPlan: 'Membership plan',
        membershipActive: 'Membership active',
        membershipValidUntil: 'Membership ends',
        identityVerified: 'Identity verified',
        identityStatus: 'Identity status',
        identityMethod: 'Verification method',
        identityRef: 'Reference',
      },
      developerView: 'Developer view (JSON)',
      developerHint: 'You can share this with admin if needed.',
    },
    match: {
      tier: {
        pre_match: 'Pre-match',
      },
      status: {
        proposed: 'Intro',
        mutual_interest: 'Mutual like',
        mutual_accepted: 'Active',
        contact_unlocked: 'Contact unlocked',
        cancelled: 'Cancelled',
      },
      avatarAlt: "{{name}}'s profile photo",
      actions: {
        like: 'Like',
        liked: 'Liked',
        unlike: 'Undo like',
        message: 'Short message',
        messageLong: 'Message',
        profileDetails: 'Profile details',
      },
      photos: {
        showMine: 'Show my photos',
        hideMine: 'Hide my photos',
        reciprocityHint: "Note: If you hide your photos from someone, you won't be able to view their photos either (reciprocity).",
        reciprocityConfirm:
          "If you hide your photos, you won't be able to view this person's photos either (reciprocity). Continue?",
        reciprocityBlocked: 'Photos locked: because you hid yours.',
      },
      photoAccess: {
        needOtherPermission: 'To view photos, you must get permission from the other side.',
        request: 'Request photo access',
        status: {
          pending: 'Request sent (pending)',
          approved: 'Request approved',
          granted: 'Access already granted',
          unknown: 'Status: {{status}}',
        },
        actions: {
          requested: 'Request sent',
          granted: 'Access granted',
        },
      },
      banners: {
        locked: 'You have an active match — others are locked',
        newMessage: 'New message',
        incomingLikeNote: 'This person sent you a like',
        activeChatStarted: 'Your active match has started. Tap the Message button to begin unlimited messaging.',
      },
    },
    matches: {
      title: 'My matches',
      showingCount: 'Showing {{count}} matches.',
      emptyHint: 'Your matches will appear here.',
      backToProfile: '← Back to profile',
      findNew: 'Find new match',
      finding: 'Searching…',
      howTitle: 'How it works',
      howReadMore: 'Read more',
      howReadLess: 'Show less',
      howItems: [
        'Suitable profiles are reviewed in Explore.',
        'A pre-match request is sent to the profiles that are desired in the match list.',
        'The request appears on the other person’s approval screen; if approved, both sides see each other in the match list.',
        'At this stage, match cards become interactive: likes, short messages, and detailed profile review.',
        'If a like is mutual, the system starts the active match step.',
        'When the active match starts, messaging begins with translation support.',
        'After this step begins, interactions with other profiles are disabled for both sides.',
        'Until the active match is mutually cancelled, matching/likes/short messages and other profile detail review are disabled.',
        'To prevent abuse, the active match cannot be cancelled during the first 2 hours after it starts; and another active match cannot be started while one is active.',
        'After the 48-hour active match period, both sides gain the right to share contact details.',
        'Contact details become visible in profile details only to each other.',
        'After that, conversation can continue either inside the site or via personal contact channels.',
        'After 48 hours, an interpreter-assisted video call can be requested via support.',
        'Background checks / detailed research can also be requested via support.',
      ],
      activeLockTitle: 'You have an active match',
      activeLockBody: 'Interactions with other profiles are locked. Go to the <link>active match page</link> to manage it.',
      requestFailed: 'Request failed: {{error}}',
      requestOk: 'Request sent. It may appear in your list within seconds.',
      loading: 'Loading…',
      loadFailed: 'Matches could not be loaded: {{error}}',
      noneTitle: 'No matches yet.',
      noneBody:
        'If you have just created a new profile, you can interact in your match list by sending requests from the Explore page to suitable profiles, or by approving incoming requests to add them to your match list. Once you match, you can use likes, short messages, and detailed profile viewing. If you couldn’t find a suitable match, install the app on your phone and enable notifications so you can be informed instantly about updates. If your goal is marriage, finding the right person can take time; we recommend being patient.',
      shortModal: {
        subtitle: 'Short message (limit 5) • for quick, profile-external info',
        remaining: 'Remaining: {{remaining}} / {{limit}}',
        noMessages: 'No messages yet.',
        translateError: 'Translation failed: {{error}}',
        translating: 'Translating…',
        translate: 'Translate',
        placeholder: 'Write a short question…',
      },
      inboxSync: {
        title: 'Inbox issue',
        refresh: 'Refresh from server',
        refreshing: 'Refreshing…',
        note: 'Note: Fetches the same data from the server if Firestore listeners are broken.',
        permissionDenied: 'No Firestore read permission (permission-denied). Firebase project: {{projectId}} (try refreshing from server)',
        listenFailed: 'Firestore inbox ({{kind}}) failed: {{error}} (try refreshing from server)',
        kinds: {
          likes: 'likes',
          requests: 'requests',
          profileAccess: 'profile access',
          messages: 'messages',
        },
      },
      errors: {
          goToMatchCard: 'Go to match card',
        activeLocked: 'You cannot message other profiles while you have an active match. End your active match first.',
        shortLimit: 'You used all short messages (5). To continue, start the active match.',
      },
    },
    chat: {
      backToMatches: '← Back to matches',
      chatTitle: 'Chat',
      emoji: 'Emoji',
      emojiHint: 'You can add emojis',
      matchTestOnlyActive: 'Match test can only be opened in an active match.',
      shortAreaTitle: 'Short message area',
      shortAreaDesc: 'For quick questions (topics not in the profile).',
      shortAreaLimit: 'Limit: {{limit}} • Left: {{remaining}}',
      otherActiveLock: 'Your active match is with someone else. Long chat is closed here.',
      noMessages: 'No messages yet. Send the first message.',
      matchLoading: 'Loading match…',
      matchNotFound: 'Match not found.',
      messagesLoading: 'Loading messages…',
      sendFailed: 'Message could not be sent. {{error}}',
      inputPlaceholderLong: 'Write a message…',
      inputPlaceholderShort: 'Write a short question/message…',
      notAvailable: 'Messaging is currently unavailable.',
      lockedTitle: 'Other matches are temporarily locked',
      lockedBody: 'While you have an active match, messaging in other matches is disabled.',
      notAllowed: 'You are not allowed to view this chat.',
      notOpenTitle: 'Messaging is not open yet',
      notOpenBody: 'Messaging opens when the match becomes active.',
      you: 'You',
      remainingTime: '{{hours}}h {{minutes}}m',
      lock48h: {
        title: '48-hour private chat + contact sharing',
        subtitle: 'Contact unlocks after confirmation + time.',
        lockedRemaining: 'Locked. Left: {{time}}',
        confirming: 'Confirming…',
        confirmed: 'Confirmed',
        confirm: 'Confirm 48 hours',
        requesting: 'Sending request…',
        requestContact: 'Request contact sharing',
        approving: 'Approving…',
        approveContact: 'Approve contact sharing',
        confirmStatusLabel: 'Confirmation status:',
        confirmStatus: {
          both: 'Mutually confirmed',
          you: 'You confirmed (waiting for the other side)',
          other: 'Other side confirmed (waiting for you)',
          none: 'No confirmations yet',
        },
        contactStatusLabel: 'Contact sharing:',
        contactStatus: {
          approved: 'Shared',
          pendingMine: 'Request sent (waiting for approval)',
          pendingOther: 'Other side requested (you can approve)',
          closed: 'Closed',
        },
        confirmError: 'Confirmation failed: {{error}}',
        contactRequestError: 'Contact request failed: {{error}}',
        contactApproveError: 'Contact approval failed: {{error}}',
        whatsappTitle: 'WhatsApp',
        openInWhatsApp: 'Open in WhatsApp',
      },
    },

    matchProfile: {
      askShort: 'Ask a short question',
      viewProfile: 'View profile',
      hideProfile: 'Hide profile',
      prevPhoto: 'Previous photo',
      nextPhoto: 'Next photo',
      tabs: {
        preview: 'Preview',
        details: 'Profile details',
      },
      detailsAccess: {
        needsPermission: 'To view the detailed profile, this user must grant permission.',
        grantedHint: 'You can now view the profile details.',
        status: {
          pending: 'Request sent (pending)',
          approved: 'Request approved',
          granted: 'Access already granted',
          unknown: 'Status: {{status}}',
        },
        actions: {
          request: 'Send request',
          requested: 'Request sent',
          granted: 'Access granted',
        },
        retry: 'Try again',
        refresh: 'Refresh',
        viewPersonProfile: 'View person profile',
        mayRequireApproval: 'Details may require the other side’s approval.',
      },
      photos: {
        onlyAllowed: 'Only allowed users can view',
        reciprocityBlocked: 'Photos locked: because you hid yours.',
      },
      profileTitle: 'Profile info',
      contactHidden:
        'Contact details are hidden. They are not shown while filling the form or in the app UI. They may only be shared after the 48-hour active match period if a definitive match is achieved, and only with your approval.',
      rulesTitle: 'Rules (quick)',
      rules: {
        generic: 'Error',
        likeFirst: 'If the like is mutual, “Mutual like” is created.',
        startActive: 'Long chat opens after both sides confirm “Start active match”.',
        onlyOneActive: 'Only 1 active match can exist; while active, likes/messaging with other profiles are locked.',
        unlockAfterCancel: 'Other profiles re-open only after the active match is mutually cancelled.',
      },
      activeStart: {
        starting: 'Starting…',
        waiting: 'Waiting for confirmation',
        start: 'Start active match',
        activatedNotice: 'Active match started — long chat is now open.',
        waitingNotice: 'Your confirmation was sent. Long chat will open once the other person confirms.',
        confirmPrompt:
          'You are about to start the active match.\n\n- You can have only 1 active match (other profiles will be locked).\n- After activation, you cannot cancel for the first 2 hours.\n\nDo you confirm?',
      },
      cancel: {
        title: 'End active match',
        desc: 'Ending is mutual. After you end it, the other side must also end it.',
        cooldown: 'To prevent abuse, cancellation is disabled for the first 2 hours after activation. Remaining: {{time}}',
        request: 'End active match',
        requestSent: 'End request sent',
        waitingOther: 'Waiting for the other side to end it.',
        confirmPrompt:
          'You are about to end the active match.\n\n- Ending is mutual: the match closes only after both sides end it.\n- After ending, the interaction lock with other profiles is removed.\n\nDo you confirm?',
      },
      mutualLike: {
        title: 'You have a mutual like',
        body: 'Long chat opens only after both sides confirm “Start active match”.',
      },
      longChatClosedTitle: 'Long chat is closed',
      longChatClosedBody: 'Long chat is available only after starting the active match. At this stage you can only use short messages.',
      shortModal: {
        title: 'Short message',
      },
      translate: {
        errors: {
          tooLong: 'This message is too long; shorten it to translate.',
          onlyIncoming: 'Only incoming messages can be translated.',
          notConfigured: 'Translation service is not configured.',
          rateLimited:
            'Translation is busy (Gemini has a 15/min rate limit). Try again in 1 minute or upgrade your plan.',
          piiBlocked: 'Automatic translation was blocked due to personal/contact info. Please remove it.',
          failed: 'Translation failed.',
        },
      },
      time: {
        minutes: '{{minutes}} min',
        hours: '{{hours}} h',
        hm: '{{hours}} h {{minutes}} min',
      },
      errors: {
        activeMatchLocked: 'While you have an active match, you cannot interact with another profile. First, mutually cancel your active match.',
        otherUserActiveMatch: 'The other side currently has an active match. This match cannot be activated.',
        cancelCooldown: 'To prevent abuse, cancellation is disabled for the first 2 hours after activation. Remaining: {{time}}',
        notAvailable: 'This action is not available at this stage.',
        forbidden: 'You are not allowed to perform this action.',
        activeStartLocked: 'You cannot start a new active match while you already have an active match.',
      },
    },
    profile: {
      membershipLabel: 'Membership',
      membershipActive: 'Active',
      membershipPassive: 'Inactive',
      endsAt: 'Ends',
      editProfile: 'Edit profile',
      myMatches: 'My matches',
      logout: 'Logout',
      bannerAlt: 'Profile banner',
      aboutTitle: 'About',
      noBio: 'No description yet.',
      textsTitle: 'Profile texts',
      aboutLabel: 'Tell us briefly about yourself',
      expectationsLabel: 'Describe who you are looking for',
      aboutPlaceholder: 'Write a short intro about yourself…',
      expectationsPlaceholder: 'Write what you are looking for…',
      saveTexts: 'Save',
      textsSaved: 'Saved.',

      partnerPrefsTitle: 'Partner preferences',
      partnerPrefsCta: 'Edit',
      partnerPrefsSave: 'Save',
      partnerPrefsSaving: 'Saving…',
      partnerPrefsSaved: 'Saved.',
      partnerPrefsErrors: {
        failed: 'Could not save. Please try again.',
      },

      subscriptionTitle: 'Subscription',
      subscriptionActiveDesc: 'Your membership is active. You can access all features.',
      subscriptionPassiveDesc: 'Your membership is inactive. Some actions may be restricted without membership.',
      buySoon: 'Buy membership (soon)',
      activateMembership: 'Activate account for free',
      cancelMembership: 'Cancel membership',
      membershipActivated: 'Account activated.',
      membershipCancelled: 'Membership cancelled.',
      confirmCancelMembership: 'Do you want to cancel your membership?',
      myInfo: 'My info',
      identityTitle: 'Identity verification',
      identityVerified: 'Your identity appears verified.',
      identityStatus: 'Status',
      verifyNow: 'Verify my identity',
      identityHelp: 'By verifying your identity, you can increase trust and remove membership/feature restrictions.',
      accountTitle: 'Account',
      accountDeleteDesc: 'You can permanently delete your account and related data.',
      deleteAccount: 'Delete account',
      deleting: 'Deleting…',
      oldPanel: 'Old panel (temporary)',
      verifyModalTitle: 'Identity verification',
      verifyModalInfo:
        'We use identity verification to help users trust each other.\nAfter approval, your identity information is deleted from the system.\nIdentity verification is not mandatory.\nThe verified profile badge is designed to help you appear more trustworthy.',
      verifyMethodUpload: 'Upload ID photos',
      verifyMethodWhatsApp: 'WhatsApp video call',
      verifyWhatsAppTitle: 'Verify via WhatsApp video call',
      verifyWhatsAppBody: 'Verification is done via a WhatsApp video call. You can create a request and open WhatsApp.',
      verifyWhatsAppCta: 'Open WhatsApp',
      idType: 'ID type',
      idTypeTrId: 'National ID',
      idTypePassport: 'Passport',
      idTypeDriver: 'Driver license',
      verifyPhotosHint: 'Photos are used only for verification.',
      verifyPrivacyNote: 'You do not need to show the full ID; your name/surname and date of birth are enough.',
      idFront: 'ID front',
      idBack: 'ID back',
      selfie: 'Selfie',
      verifyMissingFiles: 'Please upload the front/back of your ID and a selfie.',
      verifySubmitted: 'Your verification request has been received. It is under review.',
      submitVerification: 'Submit',
      confirmDelete: 'Do you want to permanently delete your account? This cannot be undone.',

      photoPrivacy: {
        title: 'Photos',
        body:
          'When you blur your photos, they appear blurred in match cards and only people you explicitly allow can see them clearly.',
        toggleLabel: 'Blur my photos',
        stateOn: 'On',
        stateOff: 'Off',
        hintOn: 'In your match list, you can allow per person using the “Show my photos” button on each card.',
        hintOff: 'When blur is off, the extra photo permission button is not shown on match cards.',
        fairnessWarning:
          'Fair use: After you blur your photos, photos in match cards can only be viewed for people you explicitly allow.',
        rules: {
          firstBlurLock48h: 'After you blur your photos for the first time, you cannot make them visible again for 48 hours.',
          unblurLock48h: 'After you make your photos visible, you cannot blur them again for 48 hours.',
          onlyAllowed:
            'When visibility is off, only people you allow can view your photos; and you can only view photos of people you allowed.',
        },
        cooldownError: 'There is a waiting period for this action. Remaining: {{time}}',
      },

      userCode: {
        label: 'User Code',
      },

      guidance: {
        button: 'Wedding Guidance',
        modalTitle: 'Wedding Guidance',
        subtitle: 'Our system is not only matchmaking',
        intro:
          'Our system is not only a matchmaking platform. After you decide to get married, we guide Turkish and Indonesian citizens throughout the entire journey—before marriage, during the marriage process, and after marriage—so you can complete all steps smoothly.',
        learnMore: 'Learn more (Wedding page)',
        whatsappCta: 'Message on WhatsApp',
        whatsappMessage: 'Hello, I would like to get information about wedding guidance.',
        sections: {
          gettingToKnow: {
            title: '1) Getting to know each other',
            items: [
              'Research/background checks about the prospective spouse',
              'Meeting with families',
              'Mediation and interpreting for video calls between prospective spouses',
              'Mediation and interpreting for communication between families',
            ],
          },
          preparations: {
            title: '2) Marriage preparations',
            panel: {
              membership: {
                title: 'Membership terms',
                lead: 'Membership terms:',
                freeActiveTermsTitle: 'Free activation terms',
              },
            },
            items: [
              'Preparing the required documents',
              'Starting legal procedures',
              'Setting the wedding date',
              'Calculating the total marriage costs',
            ],
          },
          marriageStage: {
            title: '3) Marriage stage',
            items: [
              'Flight tickets to Indonesia',
              'Hotel accommodation in Indonesia',
              'Planning domestic transportation in Indonesia (private car, plane, train, or ship)',
              'Completing legal procedures in Indonesia',
              'Wedding/nikah preparations',
              'Interpreting and guidance during your stay in Indonesia',
            ],
          },
          afterMarriage: {
            title: '4) After marriage',
            items: [
              'Registering the marriage with Turkish and Indonesian authorities',
              'Planning post-marriage administrative steps based on your country of residence',
            ],
          },
        },
      },

      applySuccess: {
        title: 'Application received',
        subtitle: 'Next steps: review the pool from your panel and follow your match suggestions.',
        steps: [
          'In the pool, compatible profiles are listed (limited preview).',
          'When likes are mutual, a 48-hour in-site chat opens.',
          'After 48 hours, you can request contact sharing; if approved, phone numbers become visible.',
        ],
        applicationIdLabel: 'Application ID',
        ctas: {
          pool: 'Go to pool',
          matches: 'My matches',
          learn: 'How it works',
        },
      },
    },
    errors: {
      generic: 'Error',
      profileNotFound: 'Profile record not found.',
      apiUnavailable: 'API is not reachable. In local dev, run `npm run dev` (api+web).',
      serverNotConfigured: 'Server configuration is missing. Please contact support.',
      activeLocked: 'While you have an active match, you cannot interact with another profile. First, mutually cancel your active match.',
      shortLimit: 'You have used all your short messages (5). To continue, after mutual like you must start the active match.',
      shortMessageTooLong: 'Message is too long. Max 240 characters.',
      filtered: 'Do not share contact info (links, phone, social media).',
      notInTheirAgeRange: 'Your age range is not compatible for this person.',
      ageRequired: 'Your age information is missing. Please complete your profile and try again.',
      notAvailable: 'This action is not available at this stage.',
      forbidden: 'You are not allowed to perform this action.',
      cancelCooldown: 'To prevent abuse, cancellation is temporarily disabled. Remaining: {{time}}',
    },
  },

  admin: {
    userTools: {
      prompts: {
        blockReason: 'Block reason (optional):',
        noteOptional: 'Note (optional):',
      },
      defaults: {
        whatsappVerificationNote: 'WhatsApp verification',
      },
      confirms: {
        grantMembershipDays: 'Grant {{days}} days of membership to this user?',
        revokeMembership: 'Deactivate this user\'s paid membership?',
        grantTranslationPackDays: 'Grant {{days}} days of translation pack to this user?',
        revokeTranslationPack: 'Deactivate this user\'s translation pack?',
        resetFreeActiveMembership:
          'Reset free active membership (freeActiveMembership)? (blocked=false, active=false, counters=0)',
      },
      messages: {
        userBlocked: 'User blocked.',
        userUnblocked: 'User unblocked.',
        whatsappVerified: 'User verified via WhatsApp verification.',
        membershipGranted: 'Membership activated. Ends: {{until}}',
        membershipRevoked: 'Membership deactivated.',
        translationPackGranted: 'Translation pack activated. Ends: {{until}}',
        translationPackRevoked: 'Translation pack deactivated.',
        freeActiveReset: 'Free active membership state was reset.',
      },
      errors: {
        userIdRequired: 'Enter a user ID.',
        applicationNotFoundForMk: 'No application found for this MK code.',
        applicationMissingUserId: 'Application found but userId is missing.',
        userReadFailed: 'Could not load the user.',
        actionFailed: 'Action failed.',
        daysRange: 'Days must be between 1 and 365.',
        translationTierInvalid: 'Tier must be standard or pro.',
      },
    },

    matchmakingMatches: {
      titles: {
        page: 'Matches (Admin)',
        tab: 'Matches',
        tabSubtitle: 'Mutual approval and contact-unlocked matches.',
      },
      nav: {
        identityVerifications: 'Identity verification',
        paymentNotifications: 'Payment notifications',
        adminPanel: 'Admin panel',
        openDetailedPage: 'Open detailed matches page',
      },
      common: {
        loading: 'Loading…',
        empty: 'No records.',
      },
      labels: {
        total: 'Total',
        match: 'Match:',
        score: 'Score: {{score}}',
        recordId: 'Record ID:',
      },
      actions: {
        cancel: 'Cancel match (unlock)',
        copy: 'copy',
      },
      sections: {
        mutual: 'Mutual accepted (waiting for step-2 choice)',
        contactUnlocked: 'Contact unlocked (lock active)',
      },
      manual: {
        title: 'Manual match',
        titleTest: 'Manual match (for testing)',
        description:
          'Enter an “Application ID” or “Username” for A and B. This creates a match document between two users (to test like/reject/chat flows).',
        descriptionShort:
          'Enter an “Application ID” or “Username” for A and B. This creates a match document between two users.',
        notePrefix: 'Note: The lists on this page show only',
        noteAnd: 'and',
        noteSuffix: 'statuses.',
        labels: {
          a: 'A (Application ID / Profile code)',
          b: 'B (Application ID / Profile code)',
          startStatus: 'Initial status',
          overwrite: 'Overwrite if match exists',
        },
        placeholders: {
          a: 'e.g. moonstar_34 or applicationId',
          b: 'e.g. blueocean_21 or applicationId',
        },
        statusOptions: {
          proposed: 'proposed (like/reject test)',
          mutualAccepted: 'mutual_accepted (chat/contact choice test)',
          contactUnlocked: 'contact_unlocked (contact unlocked test)',
        },
        actions: {
          create: 'Create match',
          clear: 'Clear fields',
        },
      },
      confirms: {
        cancelMatch: 'This match will be marked as cancelled and the lock will be removed. Continue?',
      },
      messages: {
        cancelSuccess: 'Match cancelled. Lock removed; new matches can be shown.',
        manualCreated: 'Manual match created. Match ID: {{matchId}}{{extra}}',
        manualExtraUpdated: ' (Already existed: updated)',
        manualExtraSkipped: ' (Already existed: skipped)',
        copySuccess: 'Record ID copied.',
        copyFailed: 'Copy failed.',
      },
      errors: {
        loadFailed: 'Failed to load matches.',
        actionFailed: 'Action failed.',
        manualInputRequired: 'Please enter an Application ID or Profile Code for both A and B.',
      },
    },

    matchmakingPayments: {
      titles: {
        page: 'Payment Notifications (Admin)',
        tab: 'Payment Notifications',
        tabSubtitle: 'Manage pending/approved/rejected payment notifications.',
      },
      nav: {
        matches: 'Matches',
        adminPanel: 'Admin panel',
      },
      notices: {
        indexFallback: 'Note: Using fallback listing because a Firestore index is missing (may be a bit slower).',
        receiptViaWhatsApp: 'Note: The user marked that they will send the receipt via WhatsApp. (No link was uploaded from the panel.)',
      },
      common: {
        loading: 'Loading…',
        empty: 'No records.',
      },
      statuses: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      },
      statusHeadings: {
        pending: 'Pending notifications',
        approved: 'Approved',
        rejected: 'Rejected',
      },
      labels: {
        shown: 'Shown',
        total: 'Total',
        package: 'Plan',
        method: 'Method',
        user: 'User',
        userId: 'User ID',
        match: 'Match',
        reference: 'Reference',
        receiptChannel: 'Receipt channel',
        note: 'Note',
        receipt: 'Receipt',
        readyMessage: 'Quick message',
      },
      receiptChannels: {
        whatsapp: 'WhatsApp',
        upload: 'Upload',
      },
      tiers: {
        eco: 'Eco',
        standard: 'Standard',
        pro: 'Pro',
      },
      methods: {
        eft_fast: 'EFT / FAST',
        swift_wise: 'SWIFT / Wise',
        qris: 'QRIS',
        card: 'Credit card',
        other: 'Other',
      },
      actions: {
        copy: 'Copy',
        open: 'Open',
        approve: 'Approve',
        reject: 'Reject',
        copyApprovalMessage: 'Copy approval message',
        copyRejectionMessage: 'Copy rejection message',
      },
      copy: {
        copied: '{{what}} copied.',
        failed: 'Copy failed.',
        what: {
          userId: 'User ID',
          translateTargetLabel: 'Translate to',
          matchId: 'Match ID',
          reference: 'Reference',
          receiptLink: 'Receipt link',
          approvalMessage: 'Approval message',
          rejectionMessage: 'Rejection message',
        },
      },
      warnings: {
        amountMismatch: 'Warning: Amount does not match expected price. Expected: {{expected}}',
      },
      confirms: {
        approve: 'This payment will be APPROVED and the "{{tier}}" plan will be activated. Continue?',
        reject: 'This payment will be REJECTED. Continue?',
      },
      messages: {
        approvedWithUntil: 'Payment approved; membership activated. Ends: {{until}}',
        approved: 'Payment approved; membership activated.',
        rejected: 'Payment rejected.',
      },
      errors: {
        actionFailed: 'Action failed.',
      },
      templates: {
        whatsapp: {
          approved:
            'Hello, your matchmaking membership payment has been approved. You can unlock contact details from your panel. Thank you.',
          rejected:
            'Hello, we could not verify your payment notification. Please check the receipt/reference and submit a new payment notification.',
        },
      },
      alts: {
        receipt: 'receipt',
      },
    },

    photoUpdates: {
      titles: {
        tab: 'Photo Update Requests',
        tabSubtitle: 'Review and approve/reject the new photos uploaded by the user.',
      },
      common: {
        loading: 'Loading…',
        empty: 'No records.',
        noPhoto: 'No photo.',
      },
      statuses: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      },
      labels: {
        shown: 'Shown',
        requestId: 'Request',
        userId: 'User ID',
        applicationId: 'Application',
      },
      actions: {
        copy: 'Copy',
        approve: 'Approve',
        reject: 'Reject',
      },
      copy: {
        copied: '{{what}} copied.',
        failed: 'Copy failed.',
        what: {
          userId: 'User ID',
          applicationId: 'Application ID',
        },
      },
      confirms: {
        approve: 'This photo update request will be APPROVED and the application photos will be updated. Continue?',
        reject: 'This photo update request will be REJECTED. Continue?',
      },
      messages: {
        approved: 'Photo update approved.',
        rejected: 'Photo update rejected.',
      },
      errors: {
        actionFailed: 'Action failed.',
      },
      alts: {
        photo: 'Photo',
      },
    },
  },

  matchmakingHub: {
    metaTitle: 'Matchmaking',
    badge: 'Private & moderated process',
    title: 'Marriage matchmaking system',
    description:
      'The system is new—please be patient. Matches usually arrive within 1–3 days. Install the app and enable notifications so you don’t miss updates.',
    preview: {
      title: "What will you see in 'My Profile' after signing up?",
      subtitle:
        'These sample cards are not real user data; they are only a quick walkthrough of how the system works after registration.',
      cta: 'Sign up free',
      cards: {
        matches: {
          title: 'Matches & statuses',
          body: 'Mutual interest, activation, and communication steps progress here—each step is controlled.',
          mockTitle: 'Example',
          mockItem1: 'Suggested match',
          mockItem1Sub: 'Status: mutual interest (example)',
          mockTag1: 'Review',
          mockItem2: 'Active match',
          mockItem2Sub: 'Status: chat open (example)',
          mockTag2: 'Message',
        },
        pool: {
          title: 'Pool (candidates)',
          body: 'Browse eligible candidates, send a request, or skip. If the other side approves, a match card opens.',
          mockTitle: 'Example',
          mockItem1: 'Candidate profile card (example)',
          mockItem1Sub: 'Age • City • Short summary (example)',
          mockCta: 'Send request',
        },
        chat: {
          title: 'Safer messaging',
          body: 'Messages are filtered; early-stage phone/email/link sharing is blocked.',
          mockTitle: 'Example',
          mockSystem: 'System: Safer communication enabled',
          mockMsg1: 'Hi, how are you? (example)',
          mockMsg2: 'Chat first, then approval steps (example)',
          mockHint: 'Note: Contact sharing unlocks after 48 hours + mutual approval.',
        },
      },
    },
    actions: {
      loginExisting: 'Log in if you already have a profile',
        package: 'Package',
        packageEco: 'Eco',
        packageStandard: 'Standard',
        packagePro: 'Pro',
        perMonth: 'monthly subscription',
        badgeValue: 'Best value',
        badgePopular: 'Popular',
        badgePro: 'Top',
        descEco: 'Basic access and moderate translation.',
        descStandard: 'More candidates and sponsored translation.',
        descPro: 'Max candidates and high translation allowance.',
        featureMaxCandidates: 'Up to {{count}} candidates in your panel',
        featureTranslateMonthly: '{{count}} translated messages / month',
        sponsoredIfOther: 'May be sponsored if the other user is Standard/Pro',
        sponsorsOthers: 'Sponsored translation for the other user (cost billed to you)',
        feature48hLock: 'Contact sharing: approve after 48h of chat',
        translationCostEstimate: 'Estimated translation API cost: ~$ {{amount}} / month',
        packageHelp: 'Price and permissions are applied based on the selected package.',
      apply: 'Apply for matchmaking',
      goPanel: 'My profile',
      tour: 'Show panel tour',
      backWedding: 'Back to wedding page',
      supportWhatsApp: 'WhatsApp support',
    },
    whatsappSupportMessage: 'Hello, I need support about the matchmaking system. I have a complaint/review request.',
    cards: {
      private: {
        title: 'No public profiles',
        desc: 'Profiles are not publicly listed; evaluation is handled by the system.',
      },
      review: {
        title: 'System evaluation',
        desc: 'When a suitable match is found, the process continues safely in your panel.',
      },
      panel: {
        title: 'Panel-based flow',
        desc: 'You manage matching, preview and next steps from your panel.',
      },
        showEmptyFields: 'Show empty fields',
        hideEmptyFields: 'Hide empty fields',
        partnerAgeMin: 'Min age',
        partnerAgeMax: 'Max age',
        progress: {
          title: 'Progress',
          steps: {
            proposed: 'Intro',
            mutualAccepted: 'Mutual approval',
            confirm48h: '48h confirmation',
            contact: 'Contact',
          },
          remaining: 'Time left: {{h}}h {{m}}m',
        },
      steps: [
        { title: 'Sign up and create a profile', desc: 'After signup, you create your profile by filling out the form.' },
        { title: 'See matched profiles in your panel', desc: 'The system lists the most compatible profiles (limited preview).' },
        { title: 'Like / pass', desc: 'Like a profile you are interested in; mutual likes complete the first step.' },
        { title: '48-hour in-site chat', desc: 'After mutual acceptance, the first 48 hours are in-site chat only, to get to know each other safely.' },
        { title: 'Request contact sharing', desc: 'After 48 hours, you can send a contact request; if the other person approves, phone numbers become visible.' },
      ],
    },

    how: {
      title: 'How does it work?',
      subtitle: 'A controlled flow: Explore → pre-match request → active match → contact sharing.',
      steps: [
        { title: 'Review profiles in Explore', desc: 'In the panel’s Explore tab, profiles that fit the criteria are shown (limited preview).' },
        { title: 'Send a pre-match request', desc: 'A pre-match request is sent to the profiles you want to add to your match list.' },
        { title: 'They review and approve', desc: 'If approved, both sides can see each other in “My Matches”.' },
        { title: 'Interact on the match card', desc: 'Likes, short messages and detailed profile review become available at this stage.' },
        { title: 'Active match (48 hours)', desc: 'When likes are mutual, an active match starts: translation-assisted chat opens and other profiles are locked.' },
        { title: 'Contact sharing & support', desc: 'After 48 hours, contact sharing can be approved; you can request interpreter video call or background checks via support.' },
      ],
    },

    matching: {
      title: 'How do we match?',
      subtitle: 'The goal is not “random”; it is criteria compatibility and safe progression. Your profile is not public.',
      badge: 'Criteria • Mutual consent • Controlled contact',
      points: [
        'The system generates suggestions from the candidate pool based on your age range, core preferences, and application details.',
        'Interaction progresses with mutual consent—there is no forced contact flow.',
        'Contact info is not shared immediately: first 48 hours in-site chat, then contact-request approval.',
      ],
      note: 'Note: This section is for transparency. Moderation and reporting mechanisms apply for safety.',
    },
    safety: {
      title: 'Safety and quality',
      subtitle: 'Unlike public browsing platforms, this system narrows the space for bad actors.',
      points: [
        'Because profiles are not public, unwanted access and harassment are significantly reduced.',
        'Scams, financial exploitation and similar abuse can be blocked quickly via detection and reports.',
        'Send reports to WhatsApp support; after review, the account is removed from the system.',
      ],
      tagline: 'Moderation + reporting line',
    },

    brandAlt: 'Turk&Indo',
    miniCard: {
      title: 'Uniqah',
      desc: 'A closed system, a controlled candidate pool, and a step-by-step process.',
      stats: {
        privateTitle: 'Private',
        privateSubtitle: 'profiles',
        fairTitle: 'Fair',
        fairSubtitle: 'matching',
        safeTitle: 'Safe',
        safeSubtitle: 'contact',
      },
    },
    benefits: {
      b1Title: 'Benefit',
      b1Body: 'No public browsing; the process stays focused.',
      b2Title: 'Control',
      b2Body: 'Like/pass and contact choice from your panel.',
      b3Title: 'Speed',
      b3Body: 'Match suggestions focused on criteria compatibility.',
    },
    flow: {
      title: 'Step-by-step process',
      badge: 'Uniqah flow',
    },

    faq: {
      title: 'Frequently asked questions',
      subtitle: 'Quick answers to the most common questions about the application and the process.',
      sideNote: 'WhatsApp support is always available.',
      items: [
        {
          q: 'Is my profile public?',
          a: 'No. Profiles are not publicly listed; the process progresses in a controlled way through your panel.',
        },
        {
          q: 'When is contact information shared?',
          a: 'After mutual acceptance, the first 48 hours are in-site chat only. After 48 hours, you can request contact sharing; if approved, phone numbers become visible.',
        },
        {
          q: 'Who can see my photos?',
          a: 'Photos are used within the process and for safety. They are shown in a controlled way through the panel during matching.',
        },
        {
          q: 'What if I face inappropriate behavior?',
          a: 'Report it to WhatsApp support with evidence (screenshots). After review, the account may be removed from the system.',
        },
      ],
    },

    trust: {
      title: 'Designed for trust',
      subtitle: 'The system progresses with privacy, moderation, and controlled communication steps.',
      badge: 'Privacy • Moderation • Controlled communication',
      cards: {
        privacy: {
          title: 'Privacy',
          desc: 'Your profile is not publicly published; it is shown only in-process via your panel.',
        },
        review: {
          title: 'Control & moderation',
          desc: 'Reporting and review flows help prevent and stop bad actors quickly.',
        },
        support: {
          title: 'Support',
          desc: 'If you get stuck, you can reach us via WhatsApp.',
        },
      },
    },

    cta: {
      title: 'Ready to start?',
      subtitle: 'Complete the application in 1–3 minutes and see matches in your panel.',
    },
  },

  meta: {
    baseTitle: 'Uniqah | Marriage Matchmaking',
    baseDescription:
      'Uniqah is a closed matchmaking system focused on marriage and safer in-app communication.',
    pages: {
      home: { title: 'Uniqah | Marriage Matchmaking' },
      about: { title: "About" },
      corporate: { title: "Corporate" },
      contact: { title: "Contact" },
      travel: { title: "Travel" },
      tours: {
        title: "Tours",
        description:
          "Planned Indonesia tour packages and group tours: on-the-ground programs for Bali, Lombok, Komodo and more.",
      },
      wedding: {
        title: "Wedding Guidance",
        description:
          "Guidance for your wedding process in Indonesia: end-to-end support for hotels, transport, interpretation and official paperwork.",
      },
      explore: { title: "Explore" },
      youtube: { title: "YouTube" },
      gallery: { title: "Gallery" },
      privacy: { title: "Privacy Policy" },
      documents: { title: "Documents" },
    },
  },

  weddingPage: {
    hero: {
      badge: 'Guidance for the marriage process',
      title: 'We’re with you for your wedding preparation',
      description:
        'We plan the paperwork, official procedures, family-to-family communication, and the key organization steps together—turning it into a reassuring journey away from uncertainty.',
      actions: {
        openForm: "Open the Wedding Plan Form",
        matchmakingHub: "Matchmaking",
        matchmakingApply: 'Apply for matchmaking',
        quickChat: "Quick chat on WhatsApp",
        enableNotifications: 'Enable notifications',
        notificationsEnabled: 'Notifications are enabled.',
        notificationsDenied: 'Notification permission was not granted.',
        notificationsNotSupported: 'This browser does not support notifications.',
        notificationTitle: 'New message',
        notificationBody: 'You have a new message from your match.',
      },
    },
    whatsapp: {
      quickChatMessage: "Hello, I'd like to get information about wedding preparation and guidance.",
    },
    stickyBackToProfile: {
      label: 'Back to my profile',
      aria: 'Go back to profile page',
    },
    intro: {
      servicesTitle: "Our services",
      cards: [
        {
          title: "Paperwork & official procedures",
          items: [
            "Preparation and review of all required documents",
            "Official marriage application and process tracking",
            "Completion of post-marriage official procedures",
          ],
        },
        {
          title: "Communication & interpretation",
          items: [
            "Communication support with your partner and their family",
            "Interpretation for WhatsApp and in-person meetings",
            "Clear answers to your questions throughout the process",
          ],
        },
        {
          title: "Transport & accommodation",
          items: [
            "Travel plan support for first-time international travelers",
            "Private-vehicle transport organization within Indonesia",
            "Hotel and accommodation planning",
          ],
        },
        {
          title: "Ongoing guidance",
          items: [
            "Continuous guidance until the marriage is completed",
            "General guidance on official steps (via official authorities)",
            "A high-level post-marriage administrative roadmap",
          ],
        },
      ],
      flexibleTitle: "Flexible service approach",
      flexibleP1:
        "You can benefit from all our services end-to-end, or request support only in the areas you need.",
      flexibleP2:
        "You can get to know the process, us, and how we work better by watching the videos on our YouTube channel.",
      flexibleNote:
        'You can fill out the "Wedding Plan" form below, or review the required documents in detail from the "Marriage Documents" tab.',
    },
    steps: [
      {
        title: "We understand you and your situation",
        description:
          "You fill out the form; with the information you provide, we clarify your needs.",
      },
      {
        title: "We plan it together with you",
        description:
          "We shape the documents, dates, and steps together based on your budget and expectations.",
      },
      {
        title: "We manage the process step by step",
        description:
          'From your arrival until the marriage is completed, we’re with you at every step.',
      },
    ],
    images: {
      prepAlt: 'Wedding preparation details',
      ceremonyAlt: 'Wedding ceremony',
    },
    tabs: {
      plan: "Wedding Plan",
      documents: 'Marriage Documents',
    },
    plan: {
      title: "Share your wedding plan with us",
      subtitle:
        "Fill in the fields below; we’ll get back to you with a tailored response as soon as possible.",
      successTitle: "Your request has been sent successfully!",
      successText:
        "Thank you for filling out the form. We will get back to you within 24 hours.",
      form: {
        sections: {
          basicInfo: {
            title: "1. Your basic information",
            labels: {
              name: "Full name",
              phone: "Contact number",
              city: "City",
              age: "Age",
            },
            placeholders: {
              name: "Your full name",
              phone: "+90 555 034 3852",
              city: "Your city",
              age: "Your age",
            },
          },
          privacyNote:
            'Privacy note: Your application details are processed for matchmaking and safety; your profile is not listed publicly. If rules are violated, you can contact support with evidence (e.g., screenshots).',
        },
        services: {
          title: "2. Services you need",
          hint:
            "You can select multiple options. If you're not sure, you can leave them blank.",
          options: {
            consulting: "Consulting",
            paperworkTracking: "Paperwork tracking",
            familyCommunication: "Family-to-family communication",
            transport: "Transport",
            interpretation: "Interpretation",
            ongoingGuidance: "Ongoing guidance throughout the process",
            accommodation: "Accommodation",
            honeymoon: "Honeymoon",
          },
        },
        schedule: {
          weddingDateLabel: "Planned wedding date",
          privacyConsent:
            "I have read and agree to the <privacyLink>Privacy Policy</privacyLink>.",
          privacyNote:
            "The information you share will be used only for wedding planning purposes and will never be shared with third parties.",
        },
        actions: {
          submit: "Get a quote for my wedding plan",
          submitting: "Sending...",
        },
        errors: {
          privacyConsent: "You must confirm that you have read and accepted the Privacy Policy.",
          sendFailed: "An error occurred while sending your request. Please try again.",
        },
        note:
          "If you don't want to fill out the form, you can reach us directly via the WhatsApp button at the bottom of the page.",
      },
    },
    documents: {
      title: 'Required documents for marriage (general checklist)',
      subtitle:
        "The headings below are for general information. We check the exact and up-to-date list for your situation together.",
      foreignSpouse: {
        title: "Documents for the foreign spouse",
        intro: "In general, these are the core documents requested from the foreign spouse:",
        items: [
          "Valid passport (with at least 6 months validity)",
          'Entry/residency requirements (if applicable)',
          'Certificate of no impediment to marriage (from the relevant consulate/authority)',
          "Birth certificate (multilingual)",
          'Single status certificate (translated/apostilled if required)',
          "If applicable, divorce decree or death certificate (translated and notarized)",
          "Proof of residence",
          "Passport photo taken within the last 6 months",
        ],
      },
      indonesianSpouse: {
        title: 'Documents for the local spouse',
        intro: 'For the locally registered spouse, the following documents are commonly required:',
        items: [
          'National identity document',
          'Birth certificate',
          'Family registry document',
          'Marital status letter (single / divorced / widowed)',
          'Local application forms and required approvals',
          "Passport photo taken within the last 6 months",
        ],
      },
      extras: {
        title: "Additional documents that may be requested",
        intro:
          "Not mandatory in every case, but in some cities the following documents may also be requested:",
        items: [
          "Proof of income or financial statement",
          "Criminal record certificate",
          "Medical report",
          "Diploma",
        ],
      },
      importantNotes: {
        title: "📌 Important notes",
        items: [
          'For many documents, apostille and local-language translation may be required (check with the relevant authority).',
          "A single typo, a missing document, or an incorrect processing order can negatively affect the whole application.",
          "The required documents and workflow may vary by city, institution, and officer.",
        ],
      },
      personalDifferences: {
        title: "⚠️ Personal situation differences",
        p1:
          "These headings describe the general framework; factors such as previous marriage, children, or citizenship can change your document list.",
        p2:
          "We verify the exact list for your situation together and guide you step by step so you can prepare everything correctly.",
      },
      faqTitle: "Frequently asked questions",
      whatsappCta: {
        title: "Not sure about the documents?",
        description:
          "Message us; based on your city, citizenship, and situation, let’s clarify the most up-to-date document list together.",
        action: "Ask my document list on WhatsApp",
        message:
          "Hello, I'd like to get information about the marriage process and required documents.",
      },
    },
    faq: {
      items: [
        {
          q: 'How long does the marriage process take on average?',
          a: "Depending on your document readiness, the city you apply in, and institutional workload, the planning and official procedures typically take from a few weeks to a few months.",
        },
        {
          q: 'What should be my first step for getting married?',
          a: "First, you should clarify which documents are required for your case. After reviewing the list, you can contact us on WhatsApp so we can build an up-to-date checklist based on your city and situation.",
        },
        {
          q: "Do you manage the full process from start to finish?",
          a: "Depending on your request, we can support specific steps only, or we can organize the entire paperwork, appointments, and official procedures end-to-end.",
        },
        {
          q: "Can I handle the marriage process on my own?",
          a: "Yes, you can—but it’s crucial to be sure you understand every step and required document in detail. A small mistake, an incorrect application, or a missing document can lead to significant time and financial loss and can also be emotionally stressful.",
        },
      ],
    },
    bottomCta: {
      title: "Let’s plan your wedding together",
      description: "Fill out the form below or contact us on WhatsApp right away.",
      action: "Ask now on WhatsApp",
      message: "Hello, I'd like to get information about the wedding package.",
      note:
        "We reply in Turkish; if needed, we also help you communicate with your partner’s family in Indonesian.",
    },
  },

  common: {
    open: "Open",
    close: 'Close',
    loading: 'Loading…',
    downloadPdf: "Download PDF",
    learnMore: "Learn more",
    back: "Go back",
    you: 'You',
    them: 'Them',
    enlarge: 'Enlarge',
    time: {
      minutesShort: '{{minutes}} min',
      hmShort: '{{h}}h {{m}}m',
    },
    privacySecurity: {
      title: "Privacy & Security",
      text: "This page is tracked with Google Analytics. Your data is protected with SSL/TLS encryption.",
      policyLink: "Privacy Policy",
    },
  },

  apply: {
    form: {
      options: {
        common: {
          yes: 'Yes',
          no: 'No',
        },
      },
    },
  },

  myInfo: {
    fields: {
      about: 'About me',
      city: 'City',
      education: 'Education',
      gender: 'Gender',
      hasChildren: 'Has children',
      maritalStatus: 'Marital status',
      occupation: 'Occupation',
    },
  },

  documentsHub: {
    title: "Documents",
    subtitle:
      "Access the package tour agreement, distance sales agreement, privacy notice, cancellation/refund policy, and payment instructions on one page.",
    sidebarTitle: "DOCUMENTS",
    openNewTab: "Open in a new tab",
    source: "Source: {{file}}",
    note:
      "Note: This page only displays documents. In payment/reservation steps, the relevant consent checkboxes still apply.",
  },

  youtubePage: {
    hero: {
      title: "YouTube Videos",
      subscribe: "Subscribe",
    },
    intro: {
      title: "Videos",
      text:
        "Here you can find videos about our life in Indonesia, our tours, and our journeys.",
    },
    video: {
      watch: "Watch",
    },
    cta: {
      title: "Visit our channel for more",
      text: "Visit our YouTube channel and subscribe to avoid missing new videos.",
      visit: "Visit channel",
    },
  },

  galleryPage: {
    hero: {
      title: "Photo Gallery",
      description:
        "Short snapshots from our wedding journey in Indonesia, our travels, and our daily life.",
    },
    content: {
      title: "Snapshots from Indonesia",
      description:
        "In our photo gallery you can find moments from our wedding, our explorations in Indonesia, and daily life. We will keep updating this page with our latest photos over time.",
      backToAbout: "Back to About",
      footerNote:
        "We’ll update the visuals on this page over time with real photos from our own archive.",
    },
    modal: {
      close: "Close",
    },
    images: {
      "1": { alt: "A snapshot from Siti Gunung Waterfall, Sukabumi" },
      "2": { alt: "A memory from our temple visit" },
      "3": { alt: "A moment from the temples of Yogyakarta" },
      "4": { alt: "A moment from the tea gardens of Ciwidey" },
      "5": { alt: "A snapshot from a walk in Indonesia’s nature" },
      "6": { alt: "A snapshot from the view of Situ Patenggan Lake" },
      "7": { alt: "A moment from Salih and Tini’s wedding" },
      "8": { alt: "A memory from our Yogyakarta temple tour" },
      "9": { alt: "A snapshot from Salih and Tini’s wedding day" },
      "10": { alt: "A snapshot from an ATV tour on Pangandaran beach" },
      "11": { alt: "A memory from our resort stay in Pangandaran" },
      "12": { alt: "Views from the Sukabumi waterfalls" },
      "13": { alt: "A snapshot from the Citumang body rafting area" },
    },
  },

  privacyPage: {
    title: "Privacy Policy",
    sections: {
      intro: {
        title: "1. Introduction",
        text:
          "Uniqah respects customer privacy and data protection rights. This privacy policy explains how your personal data is collected, used, and protected.",
      },
      dataCollected: {
        title: "2. Data Collected",
        text: "Through our website, we may collect the following data:",
        items: [
          "Full name",
          "Email address",
          "Phone number",
          "Application/profile information",
          "Browser and device information",
        ],
      },
      dataUsage: {
        title: "3. Use of Data",
        text: "Collected data is used for the following purposes:",
        items: [
          "Provide matchmaking and guidance services",
          "Provide communication and customer support",
          "Improve the website",
          "Send marketing and promotional messages (with consent)",
        ],
      },
      security: {
        title: "4. Data Security",
        text:
          "Your personal data is protected using industry-standard encryption and security measures. However, no transmission over the internet is 100% secure.",
      },
      rights: {
        title: "5. Your Rights",
        text:
          "You may request information about your personal data, request correction, or request deletion by contacting us in writing.",
      },
      contact: {
        title: "6. Contact",
        text:
          "If you have questions about this privacy policy, you can reach us at <emailLink>{{email}}</emailLink>."
      },
    },
    lastUpdated: "Last updated: {{date}}",
  },

  notFoundPage: {
    title: "Page Not Found",
    backHome: "Back to Home",
  },

  floatingWhatsapp: {
    label: "WhatsApp",
    ariaLabel: "Chat on WhatsApp",
    messages: {
      default: "Hi, I'd like to get more information.",
      home: "Hi, I'd like to get information about Uniqah.",
      explore: "Hi, I'd like to get more information.",
      travel: "Hi, I'd like to get more information.",
      wedding: "Hi, I'd like to get information about the marriage process.",
      youtube: "Hi, I'd like to get information about your YouTube videos.",
      contact: "Hi, I'd like to get information about contacting you.",
      tours: "Hi, I'd like to get more information.",
      documents: "Hi, I'd like to get information about your documents.",
    },
  },

  home: {
    hero: {
      badgeCompany: 'PT MoonStar Global Indonesia',
      badgeSocial: "Uniqah social channels",
      title: "Uniqah",
      subtitle: 'Matchmaking • Wedding guidance • Safer in-app communication',
      description:
        'Uniqah is our marriage-oriented matchmaking system. We aim for a safe, respectful, and transparent process with clear steps. When needed, we also provide translation and process guidance.',
      note: 'A marriage-oriented setup with privacy and safety as priorities.',
      ctaTours: "Start application",
      ctaBrochures: "View documents",
      ctaTrust: "Trust & Legal",
      ctaHow: "How it works",
    },
    trust: {
      items: [
        {
          title: "Clear process",
          description: "Pre-registration → written offer → contract/payment steps are straightforward.",
        },
        {
          title: 'Fast support',
          description: 'WhatsApp-based support; multi-language help when needed.',
        },
        {
          title: "Legal structure",
          description: "Uniqah is a brand operated under PT MoonStar Global Indonesia.",
        },
      ],
    },
    services: {
      title: "What do we do for you?",
      cards: {
        joinTours: {
          title: 'Application & profile support',
          description: 'Step-by-step support for application, profile creation, and process management.',
        },
        groupTours: {
          title: 'Family/community coordination',
          description: 'Guidance for family communication and coordination when needed.',
        },
        privateTravel: {
          title: 'Practical guidance',
          description: 'Practical on-the-ground guidance when needed.',
        },
        matchmaking: {
          title: "Uniqah matchmaking",
          description:
            "A structured matchmaking experience for serious-intent users: application, eligibility, profile flow, chat and mutual decision steps.",
        },
        communityContent: {
          title: "Community content",
          aria: "Community content",
          description:
            "We share guides and helpful content focused on relationships, communication and a respectful process for the Uniqah community.",
        },
        wedding: {
          title: "Wedding guidance in Indonesia",
          description:
            "Step-by-step guidance for paperwork, local procedures, translation, transport and accommodation—so your process is calmer and more manageable.",
        },
        youtube: {
          title: "YouTube videos",
          description:
            "Get to know our approach through videos about Indonesia life, culture, travel and the wedding journey.",
        },
        dameturk: {
          title: "DaMeTurk (sub-brand)",
          aria: "DaMeTurk - Authentic Turkish ice cream",
          description:
            "Under PT MoonStar Global Indonesia, we run DaMeTurk for authentic Turkish ice cream production and sales in Indonesia. Visit dameturk.com for details.",
        },
      },
    },

    howItWorks: {
      title: "How do we proceed?",
      steps: [
        {
          title: "1) Apply",
          description: "Confirm the rules and complete your application.",
        },
        {
          title: "2) Profile & verification",
          description: "Create your profile and clarify your photos and details.",
        },
        {
          title: "3) Matching & chat",
          description: "Chat with suitable matches and decide mutually.",
        },
      ],
      ctaTours: "Go to Uniqah",
      ctaDocuments: "Documents",
    },

    features: {
      title: "Why is it easier with us?",
      items: [
        {
          title: "Safety and process discipline",
          description:
            "Our goal is not random matching—it's a safe and respectful environment with clear, step-by-step flow.",
        },
        {
          title: "Clear communication",
          description:
            "With Turkish and Indonesian support, we help both sides express themselves correctly and reduce misunderstandings.",
        },
        {
          title: "Real on-the-ground support",
          description:
            "When needed, we provide practical support for matchmaking and wedding guidance on the ground.",
        },
      ],
    },

    faq: {
      title: 'Short FAQs',
      items: [
        {
          q: 'Is the application free?',
          a: 'Starting the application and entering basic details is free. As the process progresses (verification/membership/special support), pricing and details are shared step-by-step.',
        },
        {
          q: 'How do you keep it safe?',
          a: "We don’t aim for random introductions. We use rules, basic eligibility checks and a step-by-step flow to build a more respectful and safer environment.",
        },
        {
          q: 'How long does it take?',
          a: 'It varies by person. Depending on profile clarity, verification and mutual decision speed, it can take from a few days to a few weeks.',
        },
      ],
    },

    cta: {
      open: 'Message',
      eyebrow: "Ask anything freely",
      title: "Let’s clarify everything about Uniqah and the Indonesia process",
      description:
        "Matchmaking flow or wedding guidance… ask anything on your mind and we’ll make it simple and clear together.",
      ctaTryFree: "Try for free",
      ctaContact: "Open the contact form",
      ctaWhatsapp: "Ask via WhatsApp",
    },
  },

  about: {
    hero: {
      title: "About",
      subtitle:
        "Uniqah is our Indonesia-focused matchmaking and wedding journey support system. Our goal is to bring the right people together through a safe, respectful and transparent process—while providing real on-the-ground help when needed (translation, logistics, official steps).",
    },
    brand: {
      title: "Our brand structure",
      p1:
        "This website is the showcase and contact point for the Uniqah service we operate under PT MoonStar Global Indonesia.",
      p2:
        "MoonStar Global Indonesia was founded by a Turkish entrepreneur living in Indonesia to build a reliable bridge between two cultures, manage wedding processes correctly, and produce practical solutions on the ground for people traveling to Indonesia.",
      cards: {
        communityContentTitle: "Community content",
        communityContentDesc:
          "Guides and helpful content focused on relationships, communication and process clarity.",
        toursTitle: "Wedding guidance",
        toursDesc: "Guidance on official steps, translation and coordination.",
        weddingTitle: "Uniqah – Matchmaking",
        weddingDesc:
          "Serious-intent matchmaking with safety steps, profile management, chat flow and a clear decision process.",
        dameturkTitle: "DaMeTurk",
        dameturkDesc:
          "Our authentic Turkish ice cream production and sales operations in Indonesia—built as a local brand value under PT MoonStar Global Indonesia. dameturk.com",
      },
      socialNote:
        "We support the Uniqah community through guides and content.",
    },
    philosophy: {
      title: "How we see matchmaking",
      intro:
        "For us, marriage is not just meeting someone—it’s a journey built on mutual respect, compatibility and trust. We built Uniqah with that mindset: a system that clarifies the process, prioritizes safety, and enables healthy communication between two cultures.",
      sections: {
        direct: {
          title: "System + on-the-ground responsibility",
          p1:
            "Uniqah is not a public listing board. Profiles, photos and the overall flow are designed to reduce misuse. When needed, we step in with manual review and support and take responsibility for the process.",
          p2:
            "Our goal is a respectful environment where serious-intent users feel safe and can meet the right person.",
        },
        planning: {
          title: "Step-by-step, compatibility-first",
          p1:
            "We don’t leave it to chance. We treat application, eligibility, profile creation, matching and chat as a staged flow. This keeps expectations clear and decisions healthier.",
          bullets: [
            "Application and eligibility checks (age/rules).",
            "Profile creation and photo verification.",
            "Matching, chat and mutual decision.",
            "Translation and cultural communication guidance when needed.",
          ],
          p2: "This keeps the process human—yet measurable and consistent.",
        },
        transparency: {
          title: "Transparency and privacy",
          p1:
            "Process steps, rules and expectations should be clear from the start. At the same time, privacy is fundamental: personal data and communication are handled in a controlled way, with support and reporting channels when needed.",
        },
        comfort: {
          title: "Respectful communication and boundaries",
          p1:
            "Mutual respect, courtesy and boundaries are non-negotiable for us. The Uniqah community follows rules and safety mechanisms that aim to protect communication quality.",
          p2:
            "With reporting, blocking and support flows, we aim to prevent negative experiences from repeating.",
        },
        guidance: {
          title: 'A bridge across languages and cultures',
          p1:
            'When cross-language communication and cultural differences are not managed well, processes become harder. We help both sides express themselves through translation, communication support and guidance.',
        },
        wedding: {
          title: 'Wedding guidance',
          p1:
            'Alongside matchmaking, we guide couples planning their wedding process on timing, local practices and overall coordination.',
          p2:
            "From paperwork and appointments to translation, accommodation/transport and ceremony planning, we take responsibility as an on-the-ground team.",
        },
        expectation: {
          title: "Clear expectations, realistic timing",
          p1:
            "In Uniqah, process steps, rules and likely timelines are discussed openly—so users know what to expect and move forward without rushing decisions.",
        },
      },
      outro:
        'For more information about the <1>Uniqah</1> matchmaking system and <3>Wedding</3> guidance, you can explore these pages. For official texts and policies, use the <5>Documents</5> section.',
    },
    story: {
      title: "Our short story",
      steps: [
        "We moved to Indonesia and built our life and routine here.",
        "We built an on-the-ground network and a community that strengthens communication between two cultures.",
        "We started producing content and guides to make the overall process easier to understand.",
        "Today, we run Uniqah matchmaking together with wedding guidance and complementary services under the MoonStar Global Indonesia umbrella.",
      ],
      stepLabel: "Step",
    },

    support: {
      title: "How we can support you",
      items: {
        joinScheduled: {
          title: "Application & profile support",
          description:
            "Step-by-step support for your application, profile setup and process management.",
        },
        translation: {
          title: "Translation & communication support",
          description:
            'We can support cross-language communication with interpreters for matchmaking chats and official meetings—reducing the language barrier and increasing confidence.',
        },
        privatePlan: {
          title: "Process planning",
          description:
            "A clear, step-by-step plan for official steps and coordination.",
        },
        privateGroups: {
          title: "Family/community coordination",
          description:
            "Guidance for family communication and coordination when needed.",
        },
        logistics: {
          title: "Practical guidance",
          description:
            "Practical guidance on the ground when needed.",
        },
        wedding: {
          title: 'Wedding guidance',
          description:
            'For couples planning to marry, we provide guidance on timing, local practices, translation and overall coordination.',
        },
      },
    },

    galleryTeaser: {
      title: "A few moments from our life and work",
      description:
        "Below you can see a few selected moments from our life in Indonesia, our on-the-ground work and our trips. For more, you can visit our gallery.",
      cta: "Visit our gallery to see all photos",
      previewAlt1: "A moment from our life in Indonesia",
      previewAlt2: "A moment from a day we spent together in Indonesia",
      previewAlt3: "A moment from a special memory in Indonesia",
    },

    youtubeHighlights: {
      title: "Videos that describe us best",
      description:
        "On our YouTube channel, we share life in Indonesia, culture, travel and our on-the-ground experience. The two videos below summarize our approach and the support we provide best.",
      v1Title: "A couple’s story we supported during their wedding process in Indonesia",
      v1Desc:
        "You can see a couple’s experience going through the Indonesia wedding process with us and how we supported them.",
      v1ThumbAlt: "A couple’s story we supported during their wedding process in Indonesia",
      v2Title: "You won’t believe a place like this exists in Indonesia! Our Citumang adventure",
      v2Desc: "A fun slice of nature, adventure and daily life in Indonesia.",
      v2ThumbAlt: "Citumang adventure video",
    },

    whyUs: {
      title: "Why us?",
      items: [
        {
          title: "System + on-the-ground experience",
          description:
            "We combine a structured system with on-the-ground experience—taking responsibility in matchmaking, communication and process guidance.",
        },
        {
          title: "Safety and privacy-first",
          description:
            "Rules, steps and privacy principles are clear. We operate with safety mechanisms designed to reduce misuse.",
        },
        {
          title: "Healthy communication across cultures",
          description:
            'With translation and communication guidance across languages, we reduce misunderstandings and support a healthier process.',
        },
      ],
    },

    modal: {
      close: "Close",
    },
  },


  contact: {
    hero: {
      title: "Contact",
      p1: "Reach out for questions, suggestions or your travel plan. We’re happy to help.",
      p2:
        "Feel free to contact us for anything on your mind. We offer free consultation. Fill out the form or reach us quickly via WhatsApp.",
    },
    sidebar: {
      title: "Contact information",
      socialTitle: "Social",
      phone: "Phone",
      email: "Email",
      whatsapp: "WhatsApp",
      location: "Location",
      askNow: "Ask now",
      indonesia: "Indonesia",
    },
    form: {
      title: "Send us a message",
      success: "Thanks for your message. We’ll get back to you within 24 hours.",
      privacyError: "You must confirm that you have read and accepted the privacy policy.",
      sendError: "An error occurred while sending your message. Please try again.",
      labels: {
        name: "Full name *",
        email: "Email *",
        phone: "Phone",
        subject: "Subject *",
        message: "Message *",
      },
      placeholders: {
        name: "Your full name",
        email: "example@email.com",
        phone: "+90 5xx xxx xx xx",
        subject: "Short subject",
        message: "Write your message",
      },
      consent: "I have read and accept the <privacyLink>Privacy Policy</privacyLink>.",
      privacyLink: "Privacy Policy",
      submit: "Send",
      submitting: "Sending…",
    },
  },

  corporatePage: {
    hero: {
      badge: 'Trust & Legal',
      description:
        'This page is a corporate information hub that answers clearly: “Who owns this site?”, “Who collects payments?”, and “Which legal entity is the contract party?”.',
    },
    summary: {
      brandLine:
        'It is the brand of the Indonesia-registered company {{company}}. The contract party and collection/payment processes are handled through this legal entity.',
      documents: 'Documents & Contracts',
      brochures: 'Documents (PDF)',
    },
    brandInfo: {
      title: 'Brand and company information',
      labels: {
        brand: 'Brand',
        legalName: 'Legal name',
        tax: 'NPWP',
        nib: 'NIB',
      },
      socialNote:
        'We support the Uniqah community through guides and content.',
    },
    contact: {
      title: 'Contact and address',
      trLabel: 'TR / WhatsApp',
      idLabel: 'ID',
    },
    parentCompany: {
      badge: 'Parent company',
      caption: 'The legal umbrella of {{brand}} operations',
    },
    billing: {
      title: 'Payments, collections and contracts',
      items: {
        collection: {
          title: 'Collections',
          body: 'Payments may appear in banking records under the name {{company}}.',
        },
        contract: {
          title: 'Contract party',
          body: 'In service / distance sales contracts, the legal entity listed is {{company}}.',
        },
      },
    },
    documents: {
      title: 'Document center',
      body: 'All up-to-date documents, contracts and policies are here.',
      cta: 'Open documents',
      brochureNote: 'Additional documents:',
      brochureLink: 'Documents',
    },
    otherBrand: {
      title: 'Our other brand',
      aria: 'Open DaMeTurk website',
      body: 'Our original Turkish ice-cream brand under {{company}}.',
    },
    faq: {
      title: 'Short FAQs',
      items: {
        siteCompany: {
          q: 'Which company is this site affiliated with?',
          a: '{{brand}} is a brand of the Indonesia-registered company {{company}}. Contract and collection processes are handled through this legal entity.',
        },
        paymentCompany: {
          q: 'What if I see a different company name on the payment screen?',
          a: 'That can be normal: since collections and contracts are handled through {{company}}, that legal name may appear in payment channels.',
        },
        dameturk: {
          q: 'Is DaMeTurk yours?',
          a: 'Yes. DaMeTurk is one of our brands operating under {{company}} and serves via its own website.',
        },
      },
      editOnce: {
        usernameLocked: 'In edit mode, the username cannot be changed (one-time fix).',
        photosLocked: 'In edit mode, photo updates are disabled. You can only fix form fields.',
      },
    },
    partnerAgeMin: 'Min age',
    partnerAgeMax: 'Max age',
  },

  authPage: {
    title: 'Sign in / Sign up',
    context: {
      payment: 'Please sign in to continue to payment.',
      panel: 'Please sign in to continue to your profile.',
      generic: 'Please sign in to continue.',
    },
    forceInfo: 'A fresh sign-in was requested for this action. Please sign in again.',
    googleCta: 'Continue with Google',
    googleSignupCta: 'Sign up with Google',
    redirecting: 'Redirecting to Google sign-in…',
    redirectScreen: {
      title: 'Redirecting…',
      body: 'Opening your profile. If this takes too long, you can continue using the button below.',
      goProfile: 'Go to my profile',
      refresh: 'Refresh',
    },
    signupGuide: 'To sign up, enter your gender, nationality, and age.',
    or: 'or',
    labels: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      gender: 'Gender',
      nationality: 'Nationality',
      nationalityOther: 'Other nationality (specify)',
      age: 'Age',
    },
    placeholders: {
      email: 'example@email.com',
      password: 'Your password',
      confirmPassword: 'Repeat your password',
      nationality: 'Select nationality',
      nationalityOther: 'e.g., Germany',
      age: 'e.g., 27',
    },
    actions: {
      login: 'Sign in',
      signup: 'Sign up',
      switchToSignup: 'No account? Sign up',
      switchToLogin: 'Already have an account? Sign in',
      forgot: 'Forgot password',
    },
    signup: {
      genderMale: "I'm a man",
      genderFemale: "I'm a woman",
      nationalityTr: 'Turkey',
      nationalityId: 'Indonesia',
      nationalityOther: 'Other',
      ageHint: 'You must be at least {{minAge}} years old.',
    },
    forgotHint: {
      prefix: 'If you forgot your password, click',
      suffix: 'to receive a reset link by email.',
    },
    legal: {
      prefix: 'By continuing, you agree to the',
      contract: 'User / Membership agreement',
      cancelRefund: 'Cancellation & refund policy',
      privacy: 'Privacy Policy',
    },
    resetSent: 'A password reset link has been sent to your email.',
    errors: {
      noAccountFoundSignupRequired:
        "We couldn't find an account for this Google login. You need to sign up first. We've switched you to sign-up—please choose gender/nationality, enter your age, and try again.",
      accountExistsWithDifferentCredential:
        'An account already exists with this email using a different sign-in method. Please sign in with email/password first; then we can link Google sign-in.',
      domainNotFound: '(domain not found)',
      googleFailedDev:
        'Google sign-in failed ({{code}}).\n\nIn Firebase Console → Authentication → Settings → Authorized domains, add: {{host}}\nAlso verify VITE_FIREBASE_AUTH_DOMAIN in your env.',
      googleUnauthorizedDomain:
        'Google sign-in failed (unauthorized-domain).\n\nIn Firebase Console → Authentication → Settings → Authorized domains, add: {{host}}',
      googleOperationNotAllowed:
        'Google sign-in is disabled. Enable the Google provider in Firebase Console → Authentication → Sign-in method.',
      firebaseAuthInvalidConfig:
        'Firebase Auth configuration is invalid. Check `VITE_FIREBASE_*` values in `.env.local` (and Vercel env).',
      googleFailed: 'Google sign-in failed.',
      invalidCredential: 'Invalid email or password (or the account was not found). If you forgot your password, use “Forgot password”.',
      invalidEmail: 'That email address looks invalid. Please check it and try again.',
      emailAlreadyInUse: 'An account already exists with this email. Please sign in or use “Forgot password”.',
      weakPassword: 'Password is too weak. Please choose a stronger password (e.g., at least 6 characters).',
      passwordsDoNotMatch: 'Passwords do not match. Please type the same password again.',
      emailPasswordRequired: 'Email and password are required.',
      genderRequired: 'Please select your gender to sign up.',
      nationalityRequired: 'Please select your nationality to sign up.',
      nationalityOtherRequired: 'Please specify your nationality.',
      ageRequired: 'Please enter your age to sign up.',
      ageMin: 'To sign up, you must be at least {{minAge}} years old.',
      ageConfirmRequired: 'To sign up, you must confirm that you are at least {{minAge}} years old.',
      loginFailed: 'Sign-in failed.',
      resetEmailRequired: 'Enter your email to reset your password.',
      resetFailed: 'Could not send password reset email.',
      emailNotVerified: 'Email not verified. Please click the verification link in your inbox.',
      emailVerificationSent: 'Verification email sent. Please check your inbox.',
      emailVerificationSend: 'Resend verification email',
      emailVerificationFailed: 'Verification email could not be sent. Please try again.',
    },
  },

  newsletter: {
    title: 'Uniqah Newsletter',
    subtitle: 'Leave your email to receive Uniqah updates, new features, and important announcements.',
    placeholderEmail: 'Your email address',
    cta: {
      subscribe: 'Subscribe',
      sending: 'Sending…',
    },
    success: 'Saved successfully! Thank you.',
    error: 'This email is already subscribed or an error occurred.',
    privacy: 'We respect your privacy. You can unsubscribe anytime.',
  },

  matchmakingPanel: {
        profile: {
          guidanceAfterConfirm: {
            title: 'Support after confirmation',
            body:
              'After the final match confirmation, you can get services from our guidance team via our wedding guidance page to help build trust between candidates and support steps such as family-to-family communication, interpreting, verifying the accuracy of the information provided before the wedding decision, and many other conveniences.',
            cta: 'Open wedding guidance',
          },
        },
    title: 'My Profile',
    subtitle: 'Your matchmaking, membership and contact steps will appear here.',
    studioBanner: {
      text: 'The new Studio UI is available. Switch for a cleaner profile + matches view.',
    },
    membershipPromo: {
      freeLabel: 'Free',
      until: 'Until {{date}}',
    },
    tabs: {
      info: 'Info / Rules',
      matches: 'My matches',
    },
    photos: {
      title: 'My photos',
      lead: 'Photos you uploaded while filling the form.',
      empty: 'No photos uploaded yet.',
      updateRequest: {
        title: 'Photo update request',
        lead: 'Upload 1–3 new photos. They will be updated after admin approval.',
        pending: 'Under review',
        cta: 'Send request',
        uploading: 'Uploading…',
        success: 'Request received. Your photos will be updated after review.',
        errors: {
          photosRequired: 'Please choose at least 1 photo.',
          photoType: 'Please select image files only (jpg/png/webp).',
          applicationNotFound: 'Application not found. Please fill the form first.',
          failed: 'Could not send request. Please try again.',
        },
      },
    },
    trust: {
      title: 'Why do we ask you to fill the form?',
      lead:
        'This is not random browsing. It’s a closed matching system that works with your information. Filling the form once helps us select suitable candidates more accurately and run the process safely. Your profile is not publicly listed.',
      cards: {
        quality: {
          title: 'Better matches',
          body: 'Core details like age, location and expectations help us find a suitable candidate faster.',
        },
        privacy: {
          title: 'Privacy-first flow',
          body: 'Your profile is not public. Candidates appear in your panel in a controlled way; contact is not shared without mutual approval.',
        },
        control: {
          title: 'You stay in control',
          body: 'You move forward with accept/reject in your panel. If you need changes, you can update via WhatsApp.',
        },
      },
      rulesTitle: 'System rules (quick)',
      rules: [
        'This system is designed only for people whose intention is marriage.',
        'Flirting, entertainment, killing time, or relationships outside the purpose of marriage are strictly not allowed.',
        'Mutual respect is essential on this site; swearing, slang, and insulting language are prohibited.',
        'Immoral behavior is never tolerated.',
        'Fraud, deception, digital money traps, or similar profit-seeking attempts are prohibited.',
        'Sexual abuse is strictly prohibited.',
        'Users who violate the rules will be blocked as soon as violations are detected; any active membership will be cancelled and no refunds will be issued.',
        'Anyone who creates an account is deemed to have read and accepted these rules.',
      ],
    },

    agreement: {
      title: 'Usage agreement & safety',
      intro:
        'This matchmaking system is moderated. Keep communication respectful and follow the safety rules. If you face suspicious behavior, report it with evidence.',
      safety: {
        title: 'Safety rules',
        s1: 'Do not share contact info (phone, social media, links, IBAN, etc.) before contact sharing is unlocked.',
        s2: 'Harassment, insults, sexual content, and financial exploitation are strictly not tolerated.',
        s3: 'If you see suspicious behavior, report it to support with screenshots/evidence.',
      },
      complaint: {
        title: 'Complaints / reports',
        body:
          'Complaints are reviewed based on evidence. If a violation is confirmed, the account can be removed from the system.',
        c1Title: 'Evidence required',
        c1Body: 'Provide screenshots, dates/times and a short description of what happened.',
        c2Title: 'Fast response',
        c2Body: 'Serious complaints with clear evidence are prioritized for faster review.',
        c3Title: 'Privacy',
        c3Body: 'Do not share other users’ private information publicly; send evidence only to support.',
        extraMale: 'Male users: membership-related payments are non-refundable if a rule violation is confirmed.',
        extraFemale: 'Female users: contact sharing is always optional and requires mutual approval; report any pressure immediately.',
      },
      enforcement: {
        title: 'Sanctions & refund policy',
        e1a: 'Users who violate the rules (if proven with screenshots/evidence) will be',
        e1b: 'permanently blocked',
        e1c: 'and their matches will be cancelled.',
        e2a: 'If the violator has',
        e2b: 'an active membership, it will still be cancelled.',
        e3a: 'Even if the membership is cancelled,',
        e3b: 'no refunds are issued.',
        e4a: 'All users of this platform are deemed to have',
        e4b: 'read and accepted these rules.',
      },
    },
    actions: {
      logout: 'Sign out',
      profileForm: 'Profile form',
      goToStudio: 'Go to Studio',
      whatsapp: 'Message on WhatsApp',
      remove: 'Remove',
      copy: 'Copy',
      sending: 'Sending…',
      pending: 'Pending…',
      canceling: 'Cancelling…',
      accept: 'Accept',
      accepted: 'Accepted',
      reject: 'Reject',
      rejected: 'Rejected',
      rejectAll: 'Reject all',
      rejectAllConfirm: 'Are you sure you want to reject all candidates?',
      rejectAllSuccess_one: '{{count}} match was rejected.',
      rejectAllSuccess_other: '{{count}} matches were rejected.',
      showOldMatches: 'Show previous candidates',
      hideOldMatches: 'Show only my choice',
      dismissMatch: 'Remove this match from my panel',
      requestNew: 'Request a new match',
      requestNewWithRemaining: 'Request a new match ({{remaining}}/{{limit}})',
      requestingNew: 'Requesting…',
      requestNewQuotaHint: 'Daily quota: {{remaining}}/{{limit}}',
      requestNewSuccess: 'Your request was received. A new candidate will appear when available.',
      freeSlot: 'Free a slot (daily 1)',
      freeSlotHint: 'This opens a dedicated slot for new sign-ups. The slot will stay empty until a {{threshold}}+ match from a newly signed-up user appears. If you want an immediate candidate from the existing pool, use “Request a new match”.',
      freeSlotConfirm: 'Remove this candidate and open the new-user slot? (Daily 1)',
      freeSlotSuccess: 'Slot freed. {{creditGranted}} credit granted. The slot will stay empty until a new sign-up ({{threshold}}+) matches you. Cooldown: {{remaining}}',
      removedCreditNotice: 'This match was removed from your list. 1 credit was granted for requesting a new match. Cooldown: {{remaining}}',
    },
    chat: {
      sidebarTitle: 'Chat',
      noActiveChat: 'No active chat right now.',
      inputPlaceholderShort: 'Write a short message…',
      lock48h: {
        approving: 'Approving…',
      },
    },
    profileForm: {
      loading: 'Loading form…',
      empty: 'No matchmaking application form found yet. Please fill the form first.',
      openOriginalEditOnce: 'Open original form (edit once)',
      detailsToggle: 'Show application details',
      applicationId: 'Application ID',
      applicantNationality: 'Your nationality',
      applicantGender: 'Your gender',
      partnerNationality: "The person you're looking for: nationality",
      partnerGender: "The person you're looking for: gender",
      moreDetailsTitle: 'More details',
      partnerPrefsTitle: 'Partner preferences',
      editOnceTitle: 'Fix the form (one-time)',
      editOnceLead:
        'If you left fields empty or entered something wrong, you can update it here. This can be used only once (cannot be changed again after saving).',
      editOnceCta: 'Save changes (one-time)',
      editOnceSaving: 'Saving…',
      editOnceSuccess: 'Update received. Your form has been updated.',
      editOnceUsed: 'Profile information can be updated only once. Your request failed because you have no edits left.',
      editOnceWarning: 'Warning: this is a one-time edit. Please make sure your information is correct before submitting.',
      editOnceErrors: {
        failed: 'Update failed. Please try again.',
        empty: 'You cannot submit an empty update. Please fill at least one field.',
        notFound: 'Application not found. You need to fill the form first.',
      },
    },
    activation: {
      title: 'Membership activation & payment',
      lead: 'You can follow membership/action-unlock steps here. If your membership is not active, make the payment and send a “payment report” with your receipt/reference (membership is activated after admin approval).',
      freePaidMembershipCta: 'Activate my membership for free',
      paidMembershipCta: 'Activate membership',
      freeActiveTitle: 'Free activation',
      freeActiveBody: 'If you are identity-verified, you can activate your account for free. (48/24h inactivity rules apply.)',
      freeActiveNeedsVerification: 'Identity verification is required for free activation.',
      paymentTitle: 'Paid membership (monthly) / payment',
      paymentBody: 'To activate membership, pay with one of the methods below, then submit a payment report with your receipt/reference details.',
      selectMatchTitle: 'Select a match for the payment report',
      selectMatchHelp: 'Technically, payment reports are attached to a match. If you have no match, contact support via WhatsApp.',
      selectMatchPlaceholder: 'Select a match…',
      matchOption: '{{status}} • {{matchCode}}',
      selectMatchRequired: 'You must select a match to send a payment report.',
    },
    payment: {
      title: 'Payments',
      empty: 'No payment records found.',
      status: 'Status',
      amount: 'Amount',
      date: 'Date',
      invoice: 'Invoice / reference',
      actions: {
        pay: 'Pay',
        view: 'View',
      },
      success: 'Your payment report has been received. Your membership will be activated after admin approval.',
      errors: {
        sendFailed: 'Payment report could not be sent.',
        rateLimited: 'You are submitting payment reports too frequently. Please wait and try again.',
        notReady: 'Payment step is not available right now. Please contact support.',
      },
    },
    receipt: {
      view: 'View receipt',
      errors: {
        uploadFailed:
          'Receipt upload failed. In local dev, make sure `npm run dev` (API+Web) is running and Cloudinary server env vars are configured.',
      },
    },
    choice: {
      title: 'You marked a candidate.',
      body: 'Other candidates are not deleted. You can choose to show only your marked candidate or view previous candidates anytime.',
    },
    errors: {
      actionFailed: 'Action failed.',
      rejectAllFailed: 'Reject all failed.',
      membershipRequired: 'An active membership is required to accept/reject.',
      verificationRequired: 'Identity verification is required to perform this action.',
      membershipOrVerificationRequired: 'This action requires an active membership.',
      freeActiveMembershipRequired: 'This action requires an active account.',
      freeActiveMembershipBlocked: 'Your activation privilege is disabled. Please contact support.',
      otherUserMatched: 'This person is already matched with someone else.',
      alreadyMatched: 'You already have a match.',
      userLocked: 'Your match process is locked. This action is not allowed.',
      pendingContinueExists: 'You already selected someone to continue with. Decide on that match first.',
      applicationRequired: 'You must complete your matchmaking application first.',
      noCandidatesNow: 'No suitable candidates available right now.',
      noMatchGeneratedNow: 'A new match could not be generated right now.',
      requestNewFailed: 'Could not request a new match.',
      requestNewRateLimited: 'You are requesting too often. Please try again later.',
      requestNewQuotaExhausted: 'You have used up today’s new match quota (3/3). Please try again tomorrow.',
      requestNewFreeActiveBlocked: 'You cannot request a new match because your activation privilege was cancelled. Please contact support.',
      freeSlotFailed: 'Free slot action failed.',
      freeSlotQuotaExhausted: 'You have used today\'s free slot quota (1/1). Please try again tomorrow.',
      cooldownActive: 'Please wait a bit before doing this again. Remaining: {{remaining}}',
      newUserSlotAlreadyActive: 'Your new-user slot is already active. Please wait for a suitable new sign-up, or use the normal refresh.',
    },
    hints: {
      creditNotSpentSuffix: ' (credit not spent)',
    },
    afterSubmit: {
      title: 'Application received.',
      body: 'You can see your application details below. If you need changes, message us on WhatsApp.',
    },
    account: {
      title: 'Account',
      usernameLabel: 'Username',
      nameLabel: 'Name',
    },
    application: {
      title: 'Matchmaking Application',
      empty: 'You do not have a matchmaking application yet.',
      profileNotCreatedHint: 'Your profile is not created yet. Please fill the application form first.',
      goToForm: 'Go to the application form',
      fallbackName: 'Application',
      profileNo: 'Application Code',
      username: 'Username',
      applicationId: 'Application ID',
      photoAlt: 'Profile',
    },
    common: {
      status: 'Status',
      age: 'Age',
      whatsapp: 'WhatsApp',
      email: 'Email',
      instagram: 'Instagram',
      cityCountry: 'City/Country',
      readOnly: 'This field is currently read-only.',
    },
    contact: {
      errors: {
        fetchFailed: 'Contact details could not be fetched. Please try again.',
        notConfirmed: 'Contact details are not available before the match is confirmed.',
      },
    },
    statuses: {
      proposed: 'Proposed',
      mutual_accepted: 'Mutually accepted',
      contact_unlocked: 'Contact unlocked',
      cancelled: 'Cancelled',
      rejected: 'Rejected',
      pending: 'Pending',
      approved: 'Approved',
    },
    update: {
      title: 'Update info',
      body: "We don't edit the form online. If you'd like to update your info, message us on WhatsApp.",
      whatsappMessage: "I'd like to update my matchmaking application info.\nFull name: {{fullName}}\nApplication Code: {{profileCode}}",
    },
    onboarding: {
      title: 'Before you start',
      intro:
        'This panel manages your matchmaking process. To create a profile, you fill out the form once. After the profile is created, every login opens this panel directly.',
      rulesTitle: 'System purpose & rules',
      rules: {
        r1: 'This is not a public browsing area; profiles are not listed publicly.',
        r2: 'Your information is used for matching and safe communication.',
        r3: 'If a suitable match exists, it appears in your panel; you proceed with like/pass.',
        r4: 'Contact sharing opens with mutual approval and based on the rules.',
      },
      confirm: 'I have read the explanations and rules.',
      createProfile: 'Create profile',
      startForm: 'Fill the form to start matching',
      howWorks: 'How does the system work?',
      note: 'Note: After creating your profile, submit the form once. On subsequent logins, you won’t be redirected to the form again.',
    },
    membership: {
      title: 'Membership terms',
      active: 'Your membership is active.',
      planLabels: {
        eco: 'Eco',
        standard: 'Standard',
        pro: 'Pro',
      },
      lead: 'Membership terms:',
      inactive: 'Membership is not active. Until it is active, some actions may be restricted.',
      inactiveMale: 'Membership is not active. For men, membership is required to use matching actions (accept/reject, chat/contact).',
      inactiveFemale: 'Membership is not active. Matching and preview are available without membership. To take actions, you need an active account.',
      activeViaVerification: 'You are identity-verified. You can activate your account.',
      freeActiveActive: 'Your account is active.',
      freeActiveTermsTitle: 'Free activation terms',
      freeActiveTermsBody:
        'If you activate your account for free and you are inactive for 48 hours, activation may be cancelled. On re-activation, the window drops to 24 hours. If you are inactive again, activation may be cancelled again and new match requests may be restricted.',
      freeActiveApply: 'Activate account for free',
      freeActiveApplying: 'Applying…',
      freeActiveApplied: 'Free activation enabled. Window: {{hours}} hours.',
      daysLeft_one: 'Time left: {{count}} day.',
      daysLeft_other: 'Time left: {{count}} days.',
      until: 'Ends: {{date}}.',
    },

    membershipInfo: {
      title: 'Membership info',
      subtitle: 'Your membership type and dates.',
      details: {
        type: 'Type',
        start: 'Start',
        end: 'End',
      },
    },
    membershipNotice: {
      title: 'Like / details / contact notice',
      male: {
        lead: 'Flow for male users:',
        points: [
          'Matching and limited previews are free.',
          'Viewing full details, like/reject and contacting require an active membership (free for now).',
        ],
      },
      female: {
        lead: 'Feature access:',
        points: [
          'Matching and limited previews are free.',
          'Viewing full details, like/reject and contacting require an active account.',
        ],
      },
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'How it works, rules and FAQs — in one place.',
      faq: {
        title: 'Frequently asked questions',
        items: [
          {
            q: 'Why don’t I see profiles publicly?',
            a: 'This is a closed system. Profiles are not publicly listed; the most compatible candidates appear in your panel.',
          },
          {
            q: 'What is required for likes / details / contacting?',
            a: 'Likes / full details / contacting require an active account.',
          },
          {
            q: 'What is identity verification for?',
            a: 'It is a trust badge. It strengthens complaint handling with evidence and can unlock some flows.',
          },
          {
            q: 'What if I encounter suspicious behavior or scams?',
            a: 'Contact WhatsApp support. After review, the account can be blocked from the system.',
          },
        ],
      },
    },
    verification: {
      title: 'Identity verification',
      cta: 'Verify identity',
      verifiedBadge: 'Identity verified',
      requiredTitle: 'Identity verification (badge)',
      requiredBody: 'Identity verification is not mandatory; it is a trust badge. If there is a rule violation, you can file a complaint with screenshots/evidence.',
      unverifiedTitle: 'Not verified (badge)',
      unverifiedBodyMale: 'Identity verification is optional. Note: actions for men require an active membership.',
      unverifiedBodyFemale: 'Identity verification is optional. Note: identity verification can unlock some flows.',
      referenceCode: 'Verification code',
      manualUpload: {
        title: 'Verify on the site (manual)',
        lead: 'Not mandatory. Upload the front/back of your ID and a selfie. After review, a badge will be assigned to your account.',
        idFrontLabel: 'ID (front)',
        idBackLabel: 'ID (back)',
        selfieLabel: 'Selfie',
        submit: 'Submit',
        uploading: 'Uploading…',
        success: 'Your documents were submitted. Pending review.',
        pendingHint: 'Status: pending review',
        reviewNote: 'After you submit your files, your identity verification will be reviewed and approved by the system.',
      },
      actions: {
        startWhatsapp: 'Verify via WhatsApp',
        startKyc: 'Automatic KYC (ID + selfie)',
        startManual: 'Request manual approval',
        openWhatsapp: 'Send verification message on WhatsApp',
      },
      errors: {
        kycNotConfigured: 'Automatic KYC is not configured yet. Please use WhatsApp or manual verification.',
        whatsappNotConfigured: 'WhatsApp number is not configured. Please use manual verification.',
        missingFiles: 'Please choose ID (front/back) and a selfie.',
      },
    },

    membershipModal: {
      openFree: 'Activate free membership',
      open: 'Membership status',
      title: 'Membership actions',
      statusLabel: 'Membership',
      activate: 'Activate my membership',
      freeActivateCta: 'Activate membership for free',
      cancel: 'Cancel my membership',
      cancelDisabledHint: 'You cannot cancel until membership is active.',
      deleteAccount: 'Delete account',
      deletePhrase: 'delete my account',
      deleteTypePrompt: 'If you really want to delete the account: type "{{phrase}}".',
      deleteFinalConfirm: 'Your account will be permanently deleted from the system. Are you sure?',
      deleteCancel: 'Cancel',
      deleteContinue: 'Continue',
      deleteBack: 'Back',
      deleteYes: 'Yes, delete my account',
      loading: 'Working…',
      alreadyActive: 'Your membership is already active',
      successActivated: 'Your membership was activated.',
      successActivatedUntil: 'Your membership was activated. Valid until: {{date}} ({{count}} days left).',
      promoActivated: 'Your Eco plan was activated for free. Ends on {{date}} ({{count}} days left).',
      freeNowTitle: 'Membership is free for now',
      freeNowBody: 'Membership is currently free and can be activated instantly.\nOnce we reach enough members, we may add a payment step and switch to a paid model.',
      successCancelled: 'Your membership was cancelled.',
    },
    membershipGate: {
      title: 'Membership required',
      body: 'Until membership is active, you can only view photo, username, age, city and marital status. Membership is required to accept/reject. You can remove the match and request a new one.',
    },
    membershipOrVerificationGate: {
      title: 'Membership or identity verification required',
      body: 'Until you have an active membership or identity verification, you can only view limited profile details. You can still remove the match and request a new one.',
    },
    lock: {
      title: 'Your match process is ongoing.',
      body: 'After mutual acceptance, this match becomes your active process. The first 48 hours are in-site chat only. After 48 hours, you can send a contact request; phone numbers are shown only if the other person approves.',
      matchId: 'Match Code',
    },
    matches: {
      autoRunNotice: 'Our automatic matching runs approximately every {{minutes}} minutes. You can also request a new match manually here.',
      pendingContinueExists: 'You already selected someone to continue with. Decide on that match first.',
      cancelConfirm: 'Are you sure you want to cancel this match?',
      errors: {
        activeLocked: 'Your match process is locked. This action is not allowed.',
      },
      proposedActions: {
        interested: 'Interested',
        notSuitable: 'Not a fit',
      },
      proposedChat: {
        title: 'Direct message',
        noticeTitle: 'Notice',
        noticeBody: 'This is a limited direct-message channel. Keep it short and respectful.',
      },
      rejectReason: {
        title: 'Choose a reason…',
      },
      contactShare: {
        title: 'Contact sharing',
        approved: 'Contact details were shared with mutual approval.',
        pending: 'Contact request sent. Waiting for the other person to approve.',
        lock48h: 'To share phone numbers, 48 hours of in-site chat is required. Time left: {{time}}.',
        requestCta: 'Request contact sharing',
        requestHint: 'If the other person approves, phone numbers will become visible.',
      },
      presence: {
        online: 'Online',
        lastSeen: 'Last active: {{time}}',
        unknown: 'Last active: -',
      },

      progress: {
        title: 'Progress',
        steps: {
          proposed: 'Intro',
          mutualAccepted: 'Mutual approval',
          confirm48h: '48h confirmation',
          contact: 'Contact',
        },
        remaining: 'Time left: {{h}}h {{m}}m',
      },

      quickQuestions: {
        title: '3 quick questions',
        lead: 'If you want, answer 3 quick questions with one tap to get to know each other faster. Optional.',
        yourAnswer: 'You',
        otherAnswer: 'Them',
        pickOne: 'Pick one',
        otherAnswered: 'Answered',
        otherNotAnswered: 'Not answered yet',
        questions: {
          q1: {
            title: 'What pace do you prefer?',
            options: {
              slow: 'Slow',
              normal: 'Normal',
              fast: 'Fast',
            },
          },
          q2: {
            title: 'Family vs independence?',
            options: {
              family: 'Family-focused',
              balanced: 'Balanced',
              independent: 'Independent',
            },
          },
          q3: {
            title: 'Relocation / changing cities?',
            options: {
              local: 'Same city',
              open: 'Open to it',
              flexible: 'Flexible',
            },
          },
        },
      },

      matchTest: {
        button: 'Match test',
        title: 'Match test',
        lead: 'See how compatible you are in 3 quick questions.',
        score: 'Score: {{points}} / {{max}}',
        close: 'Close',
        questionCounter: 'Question {{cur}} / {{total}}',
        sameAnswer: 'Same answer: +10 points',
        differentAnswer: 'Different answer',
        prev: 'Prev',
        next: 'Next',
      },
      title: 'Your Matches',
      subtitle: 'Up to 3 / 5 / 10 candidates are shown depending on your plan.',
      inactivityNotice: {
        title: 'Inactivity rule (24 hours)',
        body:
          'If you are inactive for more than 24 hours, your match list will be reset. People in your list will be returned to the match pool. When you become active again, you can request matches later—but you will lose your current matches.',
      },
      newUserSlotNotice: {
        title: 'New-user slot is active',
        body:
          'This slot is currently empty. It will be filled automatically when a newly signed-up user produces a {{threshold}}+ match with your profile. If you want an immediate candidate, use “Request a new match”.',
      },
      inactiveReset: {
        title: 'Match reset due to inactivity',
        body: 'This match was cancelled and returned to the pool because one side was inactive for more than 24 hours.',
      },
      focusActiveReset: {
        title: 'This match was closed',
        body: 'The other person is currently progressing another introduction window. This is not a negative judgement about you; the system will show new candidates when appropriate.',
      },
      empty: 'There are no matches to show right now.',
      savePage: 'Save page',
      savePageAlready: 'This page already looks like it is added to your home screen / installed as an app.',
      savePageIosHint: "iPhone/iPad: In Safari, tap Share → ‘Add to Home Screen’. (Link copied.)",
      savePageAndroidHint: 'Android: From the browser menu choose “Add to Home screen” or “Install app”. (Link copied.)',
      savePageDesktopHint: 'Desktop: From the browser menu choose “Install app” (if available) or add a bookmark (Ctrl+D). (Link copied.)',
      waitingOther: "Waiting for the other person's response.",
      mutualAcceptedNotice: 'Both sides accepted. You can choose the next step.',
      rejectedByOther: {
        title: 'This person rejected you.',
        body: 'You can remove this match from your panel and request a new candidate (daily limit applies).',
      },
      interaction: {
        title: 'Next step',
        lead: 'The action happens only when both sides choose the same option. You can change your choice; the system applies it once both sides agree.',
        offsite: 'Continue off-site',
        cancel: 'Cancel match',
        offsiteShort: 'Continue off-site',
        cancelShort: 'Cancel match',
        offsiteInfoTitle: 'If you continue off-site',
        offsiteInfoBody: 'If both sides choose this, contact details are unlocked for both and you can continue on WhatsApp etc.',
        cancelInfoTitle: 'If you cancel the match',
        cancelInfoBody: 'If both sides choose this, the match ends, the lock is removed, and other candidates become visible again.',
        choosePrompt: 'Choose an option to continue.',
        yourChoice: 'Your choice: {{choice}}',
        membershipRequired: 'An active membership is required for this step.',
        verificationRequired: 'Identity verification is required for this step.',
        otherPrefersOffsite: '{{name}} selected “continue off-site”. You can unlock contacts by selecting it too.',
        otherPrefersCancel: '{{name}} selected “cancel match”. You can end the match by selecting cancel too.',
        offsiteWaiting: 'Your choice is saved. Waiting for the other person to choose the same option.',
      },
      chat: {
        open: 'Messages',
        directMessage: 'Direct message',
        title: 'In-site Chat',
        lead: 'You can chat here before deciding. Sharing contact/IG/FB/links is blocked.',
        enableNotifications: 'Enable notifications',
        notificationsEnabled: 'Notifications enabled.',
        notificationsDenied: 'Notification permission denied.',
        notificationsNotSupported: 'This browser does not support notifications.',
        notificationTitle: 'New message',
        notificationBody: 'You have a new message from your match.',
        timeLeft: 'Time left: {{minutes}} min',
        timeUnknown: 'Time left: -',
        rulesTitle: 'Rules',
        rulesBody: 'Phone/WhatsApp, Instagram/Facebook and links are not allowed at this stage.',
        empty: 'No messages yet. You can send the first one.',
        lastMessages: 'Last messages',
        placeholder: 'Write a message…',
        send: 'Send',
        lockedByActive: {
          title: 'This chat is closed',
          body:
            'This chat is closed because you currently have an active match. To keep messaging other matches, you need to cancel your active match from the chat screen.',
          cancelCta: 'Cancel active match',
        },
        system: {
          contactRequest: {
            mine: 'You requested contact sharing.',
            other: 'The other person wants to share contact details.',
            approveHint: 'Once you approve, phone numbers will appear in messages.',
          },
          contactShared: 'Contact details shared:\n{{aWhatsapp}}\n{{bWhatsapp}}',
        },
        translate: {
          title: 'Translate message',
          cta: 'Translate',
          translating: 'Translating…',
          billing: {
            sponsored: 'Sponsored translation (charged to the other side)',
            self: 'Used from your translation quota',
          },
          usageWarning: 'You used %{{usagePercent}} of your limit.',
          errors: {
            quotaExceededWithUsage:
              'You used %{{usagePercent}} of your limit. It renews monthly, or upgrade your plan / Boost.',
            quotaExceeded: 'Your translation limit is reached. It renews monthly, or upgrade your plan / Boost.',
            tooLong: 'This message is too long; shorten it to translate.',
            onlyIncoming: 'Only incoming messages can be translated.',
            authRequired: 'Login required.',
            notConfigured: 'Translation service is not configured.',
            rateLimited:
              'Translation is busy (Gemini has a 15/min rate limit). Try again in 1 minute or upgrade your plan.',
            piiBlocked: 'Automatic translation was blocked due to personal/contact info. Please remove it.',
            failed: 'Translation failed.',
          },
        },
        continue: 'Continue (Approve)',
        reject: 'Not a fit (Reject)',
        proposedLimit: {
          counter: 'Chat: {{used}} / {{limit}}',
          reachedTitle: 'Decision time',
          reachedBody: 'The message limit is reached. Approve to continue or reject if it’s not a fit.',
          startActive: 'Start active match',
          pendingYou: 'Your active match request was sent. Waiting for the other person to approve.',
          pendingIncomingTitle: '{{name}} requested an active match',
          pendingIncomingBody: 'Approve to start the active match.',
        },
        rejectReasons: {
          hint: 'Rejection reason (optional):',
          notFeeling: 'Not feeling it',
          values: 'Values/compatibility',
          distance: 'Distance/location',
          communication: 'Communication style',
          notReady: 'Not ready right now',
          other: 'Other',
        },
        pause: {
          focusTitle: 'This chat is on hold',
          focusBody: 'Because you are currently progressing another match, this chat is temporarily paused. You can’t send messages.',
          otherTitle: 'Chat temporarily on hold',
          otherBody: 'Your messages are not delivered right now; it will automatically resume when available.',
          heldBadge: 'On hold (not delivered yet)',
          deliveredBadge: 'Delivered',
        },
        heldSummary: {
          title: '{{count}} messages on hold',
          body: 'While this chat was on hold, the other person sent messages. You can choose to view them now.',
          show: 'Show messages',
          keepHidden: 'Keep hidden for now',
          releaseFailed: 'Could not open messages. Please try again.',
        },
        limitReachedNotice: {
          title: 'You reached the message limit',
          body:
            'To keep talking, you need to start an active match. Starting an active match will put your other matches on hold, and you will only continue chatting with your active match.',
          dismiss: 'OK',
        },
        errors: {
          filtered: 'Your message looks like contact/social/link and was blocked.',
          rateLimited: 'You are sending too fast. Please wait a moment.',
          closed: 'Chat expired or is closed.',
          notEnabled: 'In-site chat is not enabled for this match.',
          membershipRequired: 'An active membership is required to chat.',
          verificationRequired: 'Identity verification is required to chat.',
          limitReached: 'Message limit reached. You need to decide.',
          chatPaused: 'This chat is temporarily on hold.',
          messageTooLong: 'Message is too long. Max 240 characters.',
          serverNotConfigured: 'Firebase Admin is not configured in local dev. Add FIREBASE_SERVICE_ACCOUNT_JSON_FILE to .env.local and restart the dev process.',
          authRequired: 'You must be logged in to send messages (anonymous users are not supported).',
          sendFailed: 'Message could not be sent.',
          decisionFailed: 'Decision could not be saved.',
        },

        confirm48h: {
          title: '48 hours passed: Confirm this match',
          body:
            'From this point, your match will be marked as “confirmed” and the contact-sharing step (phone number) will be enabled. After confirmation, other suggestions in your match slots may be removed.',
          note: 'After you confirm, we will wait for the other person to confirm as well.',
          confirmButton: 'Confirm match',
          cancelButton: 'Cancel',
          waitingOther: 'You confirmed. Waiting for the other person to confirm.',
          confirmed: 'Match confirmed. You can request contact sharing.',
          contactLockedUntilConfirm: 'To request contact sharing, you must confirm this match first.',
          errors: {
            locked: 'You cannot confirm before 48 hours pass.',
            confirmRequired: 'Contact sharing requires match confirmation first.',
            contactLocked: 'You cannot request contact sharing before 48 hours pass.',
            approveLocked: 'You cannot approve before 48 hours pass.',
            contactNotPending: 'There is no pending contact request to approve.',
          },
        },
      },
      candidate: {
        fallbackName: 'Candidate',
        verifiedBadge: 'Identity verified',
        proBadge: 'PRO',
        standardBadge: 'STANDARD',
        badges: {
          activeRecent: 'Active recently',
          mutualAccepted: 'Mutual approval',
          confirmed: 'Confirmed',
          contactUnlocked: 'Contact unlocked',
          contactPending: 'Contact request pending',
        },
        matchedProfile: 'Match profile',
        score: 'Match score',
        likeBadge: '♥ You received a like',
        likeSentBadge: '✓ Like sent',
        profileInfo: 'Show profile info',
        hideProfileInfo: 'Hide',
        profileInfoTitle: 'Profile info (excluding contact)',
        photoAlt: 'Photo',
        maritalStatus: 'Marital status',
        detailsTitle: 'Details',
        aboutLabel: 'About',
        expectationsLabel: 'Expectations',
        heightLabel: 'Height',
        partnerAgeMin: 'Min age',
        partnerAgeMax: 'Max age',
        educationLabel: 'Education',
        occupationLabel: 'Occupation',
        religionLabel: 'Religion',
      },
      contactUnlocked: {
        title: 'Contact sharing is unlocked.',
        body: 'You can open contact details from the panel. Please keep communication respectful and follow the rules.',
      },
      contactLocked: {
        title: 'Contact details (locked for 48 hours)',
        body: 'Contact details unlock 48 hours after the chat becomes active. Until then, you can chat inside the site.',
      },
      paymentStatus: {
        pending: 'Your payment notice is pending. Membership will be activated after admin approval.',
        rejected: 'Your last payment notice was rejected. Please check your receipt/reference details and submit again.',
        approved: 'Payment approved. Membership activated.',
      },
      contact: {
        title: 'Contact details',
      },
      contactUnlock: {
        membershipActiveTitle: 'You are eligible',
        membershipActiveBody: 'Click the button to unlock contact details. (The other person must also meet the eligibility rules.)',
        lockedTitle: 'Contact locked',
        lockedBody: 'Contact details unlock 48 hours after chat starts. Time left: {{time}}',
        lockedBodyNoTime: 'Contact details unlock 48 hours after chat starts.',
        opening: 'Opening…',
        open: 'Share my contact details',
        verificationRequired: 'Identity verification is required to unlock contact details.',
      },
      payment: {
        membershipRequiredTitle: 'Membership required',
        membershipRequiredBody: 'Monthly membership unlocks contact details.',
        pendingNotice: 'Your payment notice for this match is pending.',
        trTitle: 'Turkey',
        idTitle: 'Indonesia',
        amount: 'Amount',
        package: 'Package',
        packageEco: 'Eco',
        packageStandard: 'Standard',
        packagePro: 'Pro',
        perMonth: 'monthly subscription',
        badgeValue: 'Best value',
        badgePopular: 'Popular',
        badgePro: 'Top',
        descEco: 'Basic access and moderate translation.',
        descStandard: 'More candidates and sponsored translation.',
        descPro: 'Max candidates and high translation allowance.',
        featureMaxCandidates: 'Up to {{count}} candidates in your panel',
        featureTranslateMonthly: '{{count}} translated messages / month',
        sponsoredIfOther: 'May be sponsored if the other user is Standard/Pro',
        sponsorsOthers: 'Sponsored translation for the other user (cost billed to you)',
        feature48hLock: 'Contact sharing: approve after 48h of chat',
        translationCostEstimate: 'Estimated translation API cost: ~$ {{amount}} / month',
        packageHelp: 'Amounts and permissions apply based on the selected plan.',
        recipient: 'Recipient',
        iban: 'IBAN',
        detailsSoon: 'Account details will be added soon.',
        payWithQris: 'Pay with QRIS (link)',
        reportTitle: 'Payment notice',
        currency: 'Currency',
        currencyTRY: 'TRY (Turkey)',
        currencyIDR: 'IDR (Indonesia)',
        currencyUSD: 'USD (Dollar)',
        method: 'Payment method',
        methodEftFast: 'EFT / FAST',
        methodSwiftWise: 'SWIFT / Wise',
        methodQris: 'QRIS',
        methodOther: 'Other',
        reference: 'Reference / description (optional)',
        referenceHint: 'When paying, write this in the reference/description field: {{code}}',
        referencePlaceholder: 'Receipt no, description, sender name…',
        note: 'Note (optional)',
        notePlaceholder: 'Add extra details if you want',
        noteHelpEftFastWise:
          'When sending EFT/transfer (or Wise/SWIFT), you must write the MK user code above exactly in the bank “Reference / Description” field.',
        noteHelpEftFastExtra:
          'With EFT/FAST, payments go to the authorized person’s Turkey bank account on behalf of our company.',
        noteHelpOther: 'Depending on the payment method, the reference field may not be required. Still, keep the reference info above.',
        receipt: 'Receipt (optional)',
        receiptHelp: 'You can upload a photo or paste a receipt link below.',
        receiptLink: 'Receipt link (optional)',
        viewReceipt: 'View receipt',
        uploadingReceipt: 'Uploading receipt…',
        receiptViaUpload: 'Upload receipt',
        receiptViaWhatsapp: 'I will send the receipt via WhatsApp',
        sendPayment: 'Send payment notice ({{amount}} {{currency}})',
        supportWhatsapp: 'WhatsApp support',
        supportWhatsappMessage: 'I need help with membership/payment in my matchmaking process. Match Code: {{matchCode}}',
      },
    },
    intro: {
      title: 'How matchmaking works',
      body: 'We offer a controlled flow that starts in Explore and continues with pre-match → active match → contact sharing. The points below summarize how the system works.',
      cta: 'Fill the matchmaking form',
      eligibilityPointMale: 'Matching and previewing the matched profile inside the site do not require membership. To view full profile details, accept/reject, or contact the matched person, you must purchase an active membership.',
      eligibilityPointFemale: 'Matching and viewing limited profile info inside the site do not require membership. To accept/reject and contact the matched person, you need an active account.',
      points: [
        'Profiles are not public. Only users with a match/request relationship can view each other.',
        'In Explore, up to 3 / 5 / 10 profiles are shown depending on your plan (limited preview).',
        'A pre-match request is sent to the profiles you want to add to your match list.',
        'The other person reviews the request. If they approve, both sides can see each other in “My Matches”.',
        'At this stage, match cards become interactive: likes, short messages, and detailed profile review.',
        'When a like is mutual, the system starts the “active match” step and translation-assisted chat opens.',
        'After an active match starts, interactions with other profiles are disabled until the active match is mutually cancelled (no new matching/likes/short messages/details).',
        'An active match lasts 48 hours. After the timer completes, both sides can share contact details; contact info becomes visible in profile details only to each other (with mutual approval).',
        'After 48 hours, you can continue either inside the site or through your own contact channels. You can also request interpreter-assisted video call or background checks via support.',
        'New match requests: If you were rejected, you can remove that match from your panel and request a new one (daily quota: 3).',
        '{{eligibilityPoint}}',
        'Safety: If rules are violated (false info, insults/harassment, sexual abuse, financial exploitation, non-marriage intent) and proven with screenshots/evidence, the user is permanently banned and cannot request refunds.',
      ],

      quickQuestions: {
        title: '3 quick questions',
        lead: 'If you want, answer 3 quick questions with one tap to get to know each other faster. Optional.',
        yourAnswer: 'You',
        otherAnswer: 'Them',
        pickOne: 'Pick one',
        otherAnswered: 'Answered',
        otherNotAnswered: 'Not answered yet',
        questions: {
          q1: {
            title: 'What pace do you prefer?',
            options: {
              slow: 'Slow',
              normal: 'Normal',
              fast: 'Fast',
            },
          },
          q2: {
            title: 'Family vs independence?',
            options: {
              family: 'Family-focused',
              balanced: 'Balanced',
              independent: 'Independent',
            },
          },
          q3: {
            title: 'Relocation / changing cities?',
            options: {
              local: 'Same city',
              open: 'Open to it',
              flexible: 'Flexible',
            },
          },
        },
      },
    },
    rules: {
      title: 'Matchmaking: Our Promise, Rules & Safety',
      lead: 'This platform is not for dating/entertainment. It is designed to make marriage-focused introductions safer and more controlled.',
      open: 'View rules and process',
      why: {
        title: 'Why are there so many rules?',
        body:
          'These rules are not meant to punish users. They exist to keep the platform safe and focused for people who genuinely intend to marry, and to filter out scams, fake profiles, and “just for fun” usage as early as possible.',
        points: [
          'Safety: reduces fraud, money requests, harassment, and fake profiles.',
          'Serious intent: makes it harder for non-marriage intent users to stay in the system.',
          'Quality: prevents pool congestion and repeated low-quality loops.',
          'Clarity: limits/cooldowns/48h steps reduce uncertainty in the process.',
        ],
        note:
          'If the goal were only maximum engagement, we could remove many of these safeguards and allow looser communication and more public browsing.\nBut we built this specifically for people who want to build a family — quality over quantity.',
      },
      promise: {
        title: 'What do we promise?',
        p1Title: 'Marriage-focused system',
        p1Body: 'The goal is not dating or games. It is a controlled process for meeting with serious marriage intent.',
        p2Title: 'Privacy',
        p2Body: 'Profiles are not public. Your details are shown only to the person you are matched with.',
        p3Title: 'Decision mechanism',
        p3Body: 'Matches progress with accept/reject decisions. Without mutual acceptance, nothing continues; a single rejection ends the match.',
        p4Title: 'Second approval + membership',
        p4Body: 'After mutual acceptance, both sides complete the second approval by choosing the same option in the panel (in-site chat or contact sharing). The process is locked only after this agreement.',
        p5Title: 'Zero tolerance for bad intent',
        p5Body: 'Insults, fraud, deception and similar behavior are not allowed.',
      },
      zeroTolerance: {
        title: 'Strict rules (zero tolerance)',
        r1Title: 'Disrespect/slang/insults',
        r1Body: 'Profanity, humiliation, threats, and harassment are strictly prohibited.',
        r2Title: 'Non-marriage intent',
        r2Body: 'Dating/entertainment intent, benefit-seeking, sexual harassment/abuse, or usage without marriage intent is prohibited.',
        r3Title: 'Fraud / money requests',
        r3Body: 'Asking for money, links, investment/crypto requests, “urgent money” scenarios and similar attempts are prohibited.',
        r4Title: 'Misleading info & fake profiles',
        r4Body: 'Using unrelated info/photos or clear lies in critical fields (identity/age/marital status, etc.) is prohibited.',
        r5Title: 'Spam & abuse',
        r5Body: 'Bulk messaging, persistent stalking, manipulation, fake reports, or exploiting system weaknesses are prohibited.',
        r6Title: 'Sharing with third parties',
        r6Body: 'Sharing the other person’s photos/messages/info with third parties without consent is prohibited.',
      },
      enforcement: {
        title: 'Enforcement & refund policy',
        e1a: 'Users who violate the rules (when verified by screenshots/evidence) are',
        e1b: 'permanently banned',
        e1c: 'and their matches are canceled.',
        e2a: 'If the violator has an',
        e2b: 'active membership, it will still be canceled',
        e3a: 'Even if the membership is canceled, the violator',
        e3b: 'cannot request any refund',
        e4a: 'Everyone who uses this platform is deemed to have',
        e4b: 'read and accepted these rules',
      },
      complaint: {
        title: 'Complaints / evidence submission',
        body: 'If during in-site chat or WhatsApp conversations you think the other party has non-marriage intent, provided false/misleading info, insulted you, or attempted fraud/money requests:',
        lead: 'If during in-site chat or WhatsApp conversations you think the other party has non-marriage intent, provided false/misleading info, insulted you, or attempted fraud/money requests: {{complaintLeadExtra}}',
        extraFemale: 'If someone uses insulting language toward you, uses sexual or obscene phrases, swears, seeks a non-marriage relationship, or you realize their profile details are false, you can report them with screenshots via our WhatsApp support line.',
        extraMale: 'If someone asks for money from day one, tries to lure you into other sites or token/crypto traps, plays games without marriage intent, or their profile details do not match, you can send screenshots to our WhatsApp support line.',
        c1Title: 'Collect evidence',
        c1Body: 'screenshots, messages, money request details, etc.',
        c2Title: 'Send to us',
        c2Body: 'message our WhatsApp support from the panel and explain the situation.',
        c3Title: 'Review',
        c3Body: 'After review, the offending party is banned and their membership is canceled.',
      },
      safety: {
        title: 'Safety reminders',
        s1: 'Be cautious during the introduction process; share personal information carefully.',
        s2: 'Never send money; if you see a money request, report it immediately.',
        s3: 'Verifying profile information is the user’s responsibility; if unsure, ask for support.',
      },
          editOnce: {
            usernameLocked: 'In edit mode, the username cannot be changed (one-time fix).',
            photosLocked: 'In edit mode, photo updates are disabled. You can only fix the form fields.',
          },
    },
  },

  matchmakingPage: {
    title: 'Matchmaking Application',
    intro:
      'This page is the matchmaking application form for finding a suitable spouse candidate. Profiles are not publicly listed; applications are viewed only by our team. The system will show matched people on your “My Profile” page.',
    privacyNote:
      'Important: This is not a public “browse/search profiles” area. The information you share is used only for evaluation and communication. Please ensure your information is accurate; you are responsible for what you submit, and matches are made based on it. Intentionally false information leads to a permanent ban; any active membership is cancelled and no refund is provided.',
    authGate: {
      message: 'To submit a matchmaking application, please sign in or create an account.',
      login: 'Sign in',
      signup: 'Sign up',
      note: 'After signing in, you will be redirected back to this page automatically.',
    },
    bottomNote:
      'Note: This form is a marriage-focused matchmaking application; profiles are not publicly listed on the site.',
    form: {
      previewProfile: {
        title: 'Preview the My Profile screen (tutorial)',
        body: 'Before submitting, quickly see how the My Profile screen works. The preview opens in a new tab.',
        open: 'Open profile preview',
      },
      preSubmitTour: {
        title: 'Before sending, let’s preview the My Profile screen',
        body:
          'After you send your application, you will manage your matches from the “My Profile” screen. Before the final submission, let’s show a quick tutorial. (It opens in a new tab; this form stays open.)',
        open: 'Open My Profile (new tab)',
        continue: 'Continue and send application',
        later: 'Not now',
      },
      applicationIdLabel: 'Application ID',
      deferCta: 'Fill later',
      deferError: 'Could not redirect right now. Please try again.',
      wizard: {
        badge: 'Quick Application',
        step: 'Step {{current}} / {{total}}',
        back: 'Back',
        next: 'Next',
        steps: {
          basic: {
            title: 'Contact & basics',
            desc: 'Let’s start with your core info and contact details.',
          },
          details: {
            title: 'Details',
            desc: 'Let’s clarify lifestyle and communication preferences.',
          },
          identity: {
            title: 'Me & who I’m looking for',
            desc: 'Select your nationality, gender and preferences.',
          },
          photos: {
            title: 'Photos & intro',
            desc: 'Upload 3 photos and introduce yourself briefly.',
          },
          preferences: {
            title: 'Partner preferences & consents',
            desc: 'Choose preferences and complete your application.',
          },
        },
      },
      editOnce: {
        usernameLocked: 'In edit mode, the username cannot be changed (one-time fix).',
        photosLocked: 'In edit mode, photo updates are disabled. You can only fix form fields.',
      },
      photo: {
        choose: 'Choose file',
        noFileChosen: 'No file chosen',
        uploaded: 'Uploaded',
      },
      sections: {
        me: 'Me',
        lookingFor: 'Looking for',
        details: 'Details',
        moreDetails: 'Additional info',
        partnerPreferences: 'Partner preferences',
      },
      contactPrivacyNotice:
        'Your contact details (WhatsApp/email/Instagram) are private. They are not shown publicly while filling the form or in the app UI. They may only be shared after the 48-hour active match period, and only with your approval.',
      confirmGender: {
        title: 'Confirm gender',
        text: 'You selected your gender as "{{gender}}". Do you confirm?',
        cancel: 'Cancel',
        confirm: 'Confirm',
      },
      labels: {
        username: 'Username',
        fullName: 'Full name',
        age: 'Age',
        city: 'City',
        country: 'Country',
        whatsapp: 'WhatsApp',
        email: 'Email',
        instagram: 'Instagram',
        nationality: 'Nationality',
        gender: 'Gender',
        lookingForNationality: 'Looking for: nationality',
        lookingForGender: 'Looking for: gender',
        height: 'Height (cm)',
        weight: 'Weight (kg)',
        occupation: 'Occupation',
        education: 'Education',
        educationDepartment: 'Department',
        maritalStatus: 'Marital status',
        hasChildren: 'Has children?',
        childrenLivingSituation: 'Do you live with your children?',
        childrenCount: 'Children count',
        incomeLevel: 'Income level',
        religion: 'Religion',
        religiousValues: 'Religious values',
        familyApprovalStatus: 'Family approval',
        familyObstacle: 'Is there a family obstacle for an international marriage?',
        marriageTimeline: 'Marriage timeline',
        relocationWillingness: 'Relocation willingness',
        preferredLivingCountry: 'Preferred living country',
        nativeLanguage: 'Native language',
        nativeLanguageOther: 'Native language (other)',
        foreignLanguages: 'Foreign languages',
        foreignLanguageOther: 'Foreign language (other)',
        communicationLanguages: 'Communication languages',
        communicationLanguageOther: 'Communication language (other)',
        smoking: 'Smoking',
        alcohol: 'Alcohol',
        partnerHeightMin: 'Partner height (min)',
        partnerHeightMax: 'Partner height (max)',
        partnerAgeMaxOlderYears: 'Partner can be older by (max years)',
        partnerAgeMaxYoungerYears: 'Partner can be younger by (max years)',
        partnerMaritalStatus: 'Partner marital status',
        partnerReligion: 'Partner religion',
        partnerChildrenPreference: 'Partner children preference',
        partnerEducationPreference: 'Partner education preference',
        partnerOccupationPreference: 'Partner occupation preference',
        partnerFamilyValuesPreference: 'Partner family values preference',
        partnerCommunicationLanguages: 'Partner communication languages',
        partnerCommunicationLanguageOther: 'Partner communication language (other)',
        partnerCommunicationMethods: 'Partner communication methods',
        partnerTranslationApp: 'Use translation app with partner?',
        partnerLivingCountry: 'Partner living country preference',
        partnerSmokingPreference: 'Partner smoking preference',
        partnerAlcoholPreference: 'Partner alcohol preference',
        photo: 'Photo',
        photos: 'Photos (3)',
        photo1: 'Photo 1',
        photo2: 'Photo 2',
        photo3: 'Photo 3',
        about: 'About',
        expectations: 'Expectations',
      },
      placeholders: {
        username: 'e.g., moonstar_34',
        fullName: 'e.g., John Doe',
        age: 'e.g., 29',
        city: 'e.g., Istanbul',
        country: 'e.g., Turkey',
        whatsapp: 'e.g., +90 5xx xxx xx xx',
        email: 'e.g., example@mail.com',
        instagram: 'e.g., @username',
        height: 'e.g., 175',
        weight: 'e.g., 72',
        educationDepartment: 'e.g., Computer Engineering',
        childrenCount: 'e.g., 1',
        foreignLanguageOther: 'e.g., French',
        nativeLanguageOther: 'e.g., French',
        communicationLanguageOther: 'e.g., Arabic',
        partnerCommunicationLanguageOther: 'e.g., Arabic',
        occupation: 'e.g., Teacher / Doctor / Engineer',
        religiousValues: 'Briefly describe your religious values…',
        familyObstacleDetails: 'Briefly explain the obstacle (if any)…',
        about: 'Introduce yourself briefly (lifestyle, language, work, family plans, etc.)',
        expectations: 'e.g., Communication, lifestyle, age/height preferences, family values…',
      },
      options: {
        common: {
          select: 'Select',
          yes: 'Yes',
          no: 'No',
          unsure: 'Not sure',
          doesntMatter: "Doesn't matter",
        },
        childrenLivingSituation: {
          withChildren: 'I live with my children',
          separate: 'I live separately from my children',
        },
        nationality: {
          tr: 'Turkish',
          id: 'Indonesian',
          other: 'Other',
        },
        gender: {
          male: 'Male',
          female: 'Female',
        },
        maritalStatus: {
          single: 'Single',
          widowed: 'Widowed',
          divorced: 'Divorced',
          other: 'Other',
          doesnt_matter: "Doesn't matter",
        },
        education: {
          secondary: 'Secondary',
          highSchool: 'High school',
          university: 'University',
          masters: "Master's",
          phd: 'PhD',
          other: 'Other',
        },
        occupation: {
          civilServant: 'Civil servant',
          employee: 'Employee',
          retired: 'Retired',
          businessOwner: 'Business owner',
          other: 'Other',
        },
        familyValues: {
          religious: 'Religious',
          liberal: 'Liberal',
        },
        partnerChildren: {
          wantChildren: 'Wants/has children',
          noChildren: 'No children',
        },
        income: {
          low: 'Low',
          medium: 'Medium',
          good: 'Good',
          veryGood: 'Very good',
          preferNot: 'Prefer not to say',
        },
        ageDiff: {
          none: '0 (no preference)',
          years: '{{count}} years',
          years_one: '{{count}} year',
          years_other: '{{count}} years',
        },
        familyApproval: {
          approved: 'Approved',
          inProgress: 'In progress / not sure',
          problem: 'Not approved / there is an issue',
        },
        religion: {
          islam: 'Islam',
          christian: 'Christianity',
          hindu: 'Hinduism',
          buddhist: 'Buddhism',
          other: 'Other',
        },
        religiousValues: {
          weak: 'Low',
          medium: 'Medium',
          conservative: 'Conservative',
        },
        languageLevel: {
          none: "None / I don't know",
          basic: 'Basic',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
          native: 'Native',
        },
        commLanguage: {
          tr: 'Turkish',
          id: 'Indonesian',
          en: 'English',
          translationApp: 'Via a translation app',
          other: 'Other (specify)',
        },
        foreignLanguages: {
          none: "I don't speak any foreign languages",
        },
        livingCountry: {
          tr: 'Turkey',
          id: 'Indonesia',
        },
        partnerCommunicationMethods: {
          ownLanguage: 'My own language',
          foreignLanguage: 'My foreign language skills',
          translationApp: 'Translation app',
        },
        timeline: {
          '0_3': '0–3 months',
          '3_6': '3–6 months',
          '6_12': '6–12 months',
          '1_plus': '1 year or more',
        },
      },
      hints: {
        lookingForGenderAuto: 'The gender you are looking for is set automatically based on your gender.',
        partnerAgeComputed: 'Estimated range: {{min}}–{{max}}',
        partnerAgeNeedsYourAge: 'Note: Please enter your correct age to compute the range.',
        multiSelect: 'You can select more than one option.',
        foreignLanguages:
          'Note: After selecting your native language, it may not appear below. If you don’t know any, choose “I don’t speak any foreign languages”.',
      },
      photoHint:
        'Upload image files only. The system compresses and uploads automatically (tip: clear, recent and showing your face).',
      consents: {
        age: 'I confirm that I am older than {{minAge}}.',
        privacy:
          'I have read the <privacyLink>Privacy Policy</privacyLink> and the <kvkkLink>Personal Data Notice (KVKK)</kvkkLink> and agree to my data being processed for evaluation/communication purposes.',
        terms: 'I have read and accept the <termsLink>User Agreement</termsLink>.',
        photo: 'I agree that the admin team can view my photo(s) for evaluation purposes (profile is not public).',
      },
      submit: 'Submit application',
      submitting: 'Submitting…',
      success: 'Your application was received. Matches will appear on your panel.',
      errors: {
        blocked: 'This account is blocked from submitting matchmaking applications. Please contact support if you think this is a mistake.',
        mustLogin: 'You must be signed in to submit the application.',
        alreadySubmitted: 'You already have a matchmaking application. You can update your info from your Profile page.',
        profileTextWriteOnceUsed: 'Your “About” and “Expectations” texts can only be written once. They cannot be edited afterwards.',
        profileTextPII: 'Do not share contact info (phone, email, link, Instagram, IBAN, etc.) in “About” or “Expectations”.',
        consentsRequired:
          'To submit, you must check the consent boxes ({{minAge}}+, Privacy Policy, User Agreement, Photo consent).',
        consent18Plus: 'To continue, you must confirm that you are {{minAge}}+.',
        consentPrivacy: 'To continue, you must accept the privacy policy.',
        consentPhotoShare: 'To continue, you must accept the photo consent.',
        permissionDenied:
          'Could not submit the application (permission error). Please sign in with the correct account or check Firestore rules.',
        honeypotTriggered:
          'Form could not be submitted. Browser autofill may have filled a hidden field. Refresh the page, disable autofill, and try again.',
        photoUploadFailed:
          'Photo upload failed. In local dev, ensure `npm run dev` (api+web) is running and Cloudinary env vars are configured.',
        submitFailed: 'Application could not be submitted. Please try again.',
        tooFast: 'Form was submitted too quickly. Please fill it and try again.',
        rateLimited: 'Too many attempts in a short time. Please try again in 1 minute.',
        recaptchaFailed: 'Spam verification failed. Please refresh and try again.',
        recaptchaRejected: 'Your application could not be accepted due to spam protection. Please try again later.',

        username: 'Please choose a username.',
        usernameTaken: 'This username is already taken. Please choose another.',
        fullName: 'Please enter your full name.',
        age: 'Please enter your age.',
        ageRange: 'Age must be between {{minAge}} and 99.',
        email: 'Please enter your email address.',
        city: 'Please enter your city.',
        country: 'Please enter your country.',
        whatsapp: 'Please enter your WhatsApp number.',
        gender: 'Please select your gender.',
        nationality: 'Please select your nationality.',
        lookingForGender: 'Please select the gender you are looking for.',
        lookingForNationality: 'Please select the nationality you are looking for.',
        heightRequired: 'Please enter your height.',
        weightRequired: 'Please enter your weight.',
        heightRange: 'Height must be between 120–230 cm (you can also leave it empty).',
        weightRange: 'Weight must be between 35–250 kg (you can also leave it empty).',
        occupation: 'Please enter your occupation.',
        education: 'Please select your education level.',
        educationDepartment: 'Please enter your department.',
        maritalStatus: 'Please select your marital status.',
        hasChildren: 'Please select whether you have children.',
        childrenLivingSituation: 'Please select your living situation with your children.',
        childrenCount: 'Children count must be between 1 and 20.',
        incomeLevel: 'Please select your income level.',
        religion: 'Please select your religion.',
        religiousValues: 'Please enter your religious values briefly.',
        nativeLanguage: 'Please select your native language.',
        nativeLanguageOther: 'Please specify your native language.',
        foreignLanguages: 'Please select your foreign languages.',
        foreignLanguageOther: 'Please specify the other foreign language.',
        communicationLanguage: 'Please select a communication language.',
        communicationLanguageOther: 'Please specify the other language.',
        smoking: 'Please answer the smoking question.',
        alcohol: 'Please answer the alcohol question.',
        instagram: 'Please enter a valid Instagram username or leave it empty.',
        familyObstacle: 'Please answer the family obstacle question.',
        familyObstacleDetails: 'Please briefly explain the family obstacle.',
        familyApprovalStatus: 'Please answer the family approval question.',
        marriageTimeline: 'Please select your marriage timeline.',
        relocationWillingness: 'Please answer the relocation question.',
        preferredLivingCountry: 'Please select your preferred living country.',

        translationApp: 'Please select your translation app preference.',
        partnerTranslationApp: 'Please select whether you can use a translation app with your partner.',
        partnerAgeRange: 'Min age cannot be greater than max age.',
        languageLevelTr: 'Please select your Turkish level.',
        languageLevelEn: 'Please select your English level.',
        languageLevelId: 'Please select your Indonesian level.',

        partnerAgeMaxOlderYears: 'Please select how many years older your partner can be.',
        partnerAgeMaxYoungerYears: 'Please select how many years younger your partner can be.',
        partnerHeightMin: 'Please select the minimum partner height.',
        partnerHeightMax: 'Please select the maximum partner height.',
        partnerHeightRange: 'Minimum partner height cannot be greater than maximum.',
        partnerMaritalStatus: 'Please select preferred marital status.',
        partnerReligion: 'Please select preferred religion.',
        partnerLivingCountry: 'Please select preferred living country.',
        partnerSmokingPreference: 'Please select partner smoking preference.',
        partnerAlcoholPreference: 'Please select partner alcohol preference.',
        partnerChildrenPreference: 'Please select children preference.',
        partnerEducationPreference: 'Please select education preference.',
        partnerOccupationPreference: 'Please select occupation preference.',
        partnerFamilyValuesPreference: 'Please select family values preference.',
        partnerCommunicationLanguage: 'Please select partner communication language.',
        partnerCommunicationLanguageOther: 'Please specify other partner communication language.',

        about: 'Please write a short introduction.',
        expectations: 'Please describe what you are looking for in a spouse.',

        photo1Required: 'Please upload photo 1.',
        photo2Required: 'Please upload photo 2.',
        photo3Required: 'Please upload photo 3.',
        photoRequired: 'Please upload at least one photo.',
        photoType: 'Please select a valid image file.',
      },
    },
  },

  matchmakingMembership: {
    title: 'Membership activation',
    lead: 'Membership is free for now. You can activate it with one click.',
    freeNowTitle: 'Free for now',
    freeNowBody: 'Membership is currently free. Once we reach enough members, we may add payment and switch to a paid model.',
    freeActivateCta: 'Activate my membership for free',
    activating: 'Activating…',
    activated: 'Membership activated.',
    activatedUntil: 'Membership activated. Valid until: {{date}}',
    freeActivatedInfo:
      'Your free membership is assigned until {{date}}.\nWith this membership, you can like/reject match profiles and use {{translatedCount}} translated messages.\nYour daily match-change limit is {{dailyLimit}}.',
    freeDisabled: 'Free membership activation is currently disabled. Please try again later.',
    activateFailed: 'Could not activate membership. Please try again.',
    errors: {
      notAuthenticated: 'Session could not be verified. Please log out and log in again.',
      serverNotConfigured: 'Server configuration is missing. Please contact support.',
      apiUnavailableDev: 'API is not reachable. In local dev, run `npm run dev` (api+web).',
    },
    backToPanel: 'Back to panel',
    freeNowFootnote: 'Note: Membership is free for now. A payment step may be added later.',
  },

  memberFeed: {
    badge: {
      newUser: 'New',
    },
    toast: {
      title: 'Live',
      closeAria: 'Close',
      generic: 'A new activity happened.',
      signupAnonymous: 'Someone just joined the system.',
      signupKnown: '{{label}} just joined the system.',
      profileCompletedAnonymous: 'A new user completed their profile.',
      profileCompletedKnown: '{{label}} completed their profile.',
    },
  },
};
