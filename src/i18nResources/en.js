export default {
  navigation: {
    siteTitle: "Indonesia Explorer",
    siteSubtitle: "PT MoonStar Global Indonesia",
     taglineTravelOrg: "Travel organization",
     taglineWeddingGuidance: "Wedding guidance",
    home: "Home",
    about: "About",
    corporate: "Corporate",
    travel: "Travel",
    wedding: "Wedding Guidance",
    matchmaking: "Uniqah",
    panel: "My profile",
    documents: "Documents",
    youtube: "YouTube",
    contact: "Contact",
    language: "Language",
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
      match: 'Match',
      profile: 'Profile',
      verified: 'Verified',
      unknown: 'Unknown',
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
    },

    accessInbox: {
      title: 'Profile access requests ({{count}})',
      requested: 'Requests access to view your profile',
      approve: 'Allow',
      reject: 'Reject',
    },

    pool: {
      title: 'Pool',
      backToMatches: '← Back to matches',
      refresh: 'Refresh',
      lastUpdated: 'Auto-refreshes (20s).',
      countHint: 'Total: {{total}} • Shown: {{shown}}',
      filtersHint: 'Age range: {{min}} – {{max}}',
      empty: 'No profiles found with these filters.',
      requestProfileNow: 'Send match request',
      requesting: 'Requesting…',
      requestSent: 'Request sent',
      openProfile: 'Open profile',
      profileModalTitle: 'Profile',
      actionsSoon: 'Coming soon: short message',
      notInTheirRange: "To interact, you must also be within their age range.",
      notInTheirRangeShort: 'Age range mismatch',
    },

    paywall: {
      upgradeTitle: 'Membership required',
      upgradeToInteract: 'An active membership is required to do this. Upgrade to a paid plan to like and send messages.',
      upgradeToReply: 'An active membership is required to reply. Upgrade to a paid plan to send messages.',
      upgradeCta: 'Upgrade',
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
        message: 'Message',
      },
      banners: {
        locked: 'You have an active match — others are locked',
        newMessage: 'New message',
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
      howItems: {
        likeFirst: 'First, Like a profile (if mutual, “Mutual like” is created).',
        startActive: 'After mutual like, if both sides confirm “Start active match”, long chat opens.',
        onlyOneActive: 'You can start only 1 active match at a time.',
        lockUntilCancel: 'Until the active match is mutually cancelled, likes/messaging with other profiles are locked.',
      },
      activeLockTitle: 'You have an active match',
      activeLockBody: 'Interactions with other profiles are locked. Go to the <link>active match page</link> to manage it.',
      requestFailed: 'Match request failed: {{error}}',
      requestOk: 'Request sent. It may appear in your list within seconds.',
      loading: 'Loading…',
      loadFailed: 'Matches could not be loaded. ({{error}})',
      noneTitle: 'No matches yet.',
      noneBody: 'If you just created a profile, the first match can be generated within seconds. You can also trigger it manually here.',
      shortModal: {
        subtitle: 'Short message (limit 5) • for quick, profile-external info',
        remaining: 'Remaining: {{remaining}} / {{limit}}',
        noMessages: 'No messages yet.',
        translateError: 'Translation error: {{error}}',
        translating: 'Translating…',
        translate: 'Translate',
        placeholder: 'Write a short question…',
      },
      errors: {
        activeLocked: 'You cannot message other profiles while you have an active match. First, mutually cancel your active match.',
        shortLimit: 'You have used all your short messages (5). To continue, after mutual like you must start the active match.',
      },
    },
    chat: {
      backToMatches: '← Back to matches',
      chatTitle: 'Chat',
      emoji: 'Emoji',
      emojiHint: 'You can add emojis',
      matchTestOnlyActive: 'Match test can only be opened in an active match.',
      shortAreaTitle: 'Short message area',
      shortAreaDesc:
        'This area is only for learning more about the person (topics not in the profile, short questions about character).',
      shortAreaLimit: 'Your limit is {{limit}} messages. Remaining: {{remaining}}',
      otherActiveLock: 'Because your active match is with someone else, long chat is not available in this match.',
      noMessages: 'No messages yet. Send the first message.',
      matchLoading: 'Loading match…',
      matchNotFound: 'Match not found.',
      messagesLoading: 'Loading messages…',
      sendFailed: 'Message could not be sent: {{error}}',
      inputPlaceholderLong: 'Write a message…',
      inputPlaceholderShort: 'Write a short question/message…',
      notAvailable: 'Messaging is currently unavailable.',
      lockedTitle: 'Other matches are temporarily locked',
      lockedBody: 'While you have an active match, messaging in other matches is disabled. It will re-open when the lock expires.',
      notAllowed: 'You are not allowed to view this chat.',
      notOpenTitle: 'Messaging is not open yet',
      notOpenBody: 'Messaging opens after the match becomes active (mutual approval).',
      you: 'You',
      remainingTime: '{{hours}}h {{minutes}}m',
      lock48h: {
        title: '48-hour private chat + contact sharing',
        subtitle: 'After mutual confirmation and the timer completes, contact details can be shared.',
        lockedRemaining: 'Still locked. Remaining: {{time}}',
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
        confirmError: 'Confirmation error: {{error}}',
        contactRequestError: 'Contact request error: {{error}}',
        contactApproveError: 'Contact approval error: {{error}}',
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
      profileTitle: 'Profile info',
      contactHidden:
        'Contact details are hidden. They are not shown while filling the form or in the app UI. They may only be shared after the 48-hour active match period if a definitive match is achieved, and only with your approval.',
      rulesTitle: 'Rules (quick)',
      rules: {
        likeFirst: 'If the like is mutual, “Mutual like” is created.',
        startActive: 'Long chat opens after both sides confirm “Start active match”.',
        onlyOneActive: 'Only 1 active match can exist; while active, likes/messaging with other profiles are locked.',
        unlockAfterCancel: 'Other profiles re-open only after the active match is mutually cancelled.',
      },
      activeStart: {
        starting: 'Starting…',
        waiting: 'Waiting for confirmation',
        start: 'Start active match',
        confirmPrompt:
          'You are about to start the active match.\n\n- You can have only 1 active match (other profiles will be locked).\n- After activation, you cannot cancel for the first 2 hours.\n\nDo you confirm?',
      },
      cancel: {
        title: 'Cancel active match',
        desc: 'Cancellation is mutual. After you cancel, the other side must also cancel.',
        cooldown: 'To prevent abuse, cancellation is disabled for the first 2 hours after activation. Remaining: {{time}}',
        request: 'Cancel active match',
        requestSent: 'Cancel request sent',
        waitingOther: 'Waiting for the other side to cancel.',
        confirmPrompt:
          'You are about to cancel the active match.\n\n- Cancellation is mutual: the match closes only after both sides cancel.\n- After cancellation, the interaction lock with other profiles is removed.\n\nDo you confirm?',
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
      subscriptionTitle: 'Subscription',
      subscriptionActiveDesc: 'Your membership is active. You can access all features.',
      subscriptionPassiveDesc: 'Your membership is inactive. Some actions may be restricted without membership.',
      buySoon: 'Buy membership (soon)',
      activateMembership: 'Activate my membership',
      cancelMembership: 'Cancel membership',
      membershipActivated: 'Membership activated.',
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
      idType: 'ID type',
      idTypeTrId: 'National ID',
      idTypePassport: 'Passport',
      idTypeDriver: 'Driver license',
      verifyPhotosHint: 'Photos are used only for verification.',
      idFront: 'ID front',
      idBack: 'ID back',
      selfie: 'Selfie',
      verifyMissingFiles: 'Please upload the front/back of your ID and a selfie.',
      verifySubmitted: 'Your verification request has been received. It is under review.',
      submitVerification: 'Submit',
      confirmDelete: 'Do you want to permanently delete your account? This cannot be undone.',

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

  matchmakingHub: {
    metaTitle: 'Uniqah',
    badge: 'Private & moderated process',
    title: 'Marriage matchmaking system',
    description:
      'A closed matchmaking system that brings together people who are serious about marriage—on equal and safe terms. Profiles are not public; the system shows the most compatible candidates in your panel and helps you find the right person faster.',
    actions: {
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
      subtitle: 'From signup to matching, the process is transparent and controlled.',
      steps: [
        { title: 'Sign up and create a profile', desc: 'After signup, you create your profile by filling out the form.' },
        { title: 'See matched profiles in your panel', desc: 'The system lists the most compatible profiles (limited preview).' },
        { title: 'Like / pass', desc: 'Like a profile you are interested in; mutual likes complete the first step.' },
        { title: '48-hour in-site chat', desc: 'After mutual acceptance, the first 48 hours are in-site chat only, to get to know each other safely.' },
        { title: 'Request contact sharing', desc: 'After 48 hours, you can send a contact request; if the other person approves, phone numbers become visible.' },
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
    baseTitle: "Indonesia Explorer | PT MoonStar Global Indonesia",
    baseDescription:
      "Indonesia Explorer (PT MoonStar Global Indonesia) provides tour organization in Indonesia, honeymoon and bespoke travel planning, plus wedding guidance services.",
    pages: {
      home: { title: "Indonesia Explorer | PT MoonStar Global Indonesia" },
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
      badge: "Guidance for Turkish–Indonesian couples",
      title: "We’re with you for your wedding preparation in Indonesia",
      description:
        "We plan the paperwork, official procedures, family-to-family communication, and the full organization process in Indonesia together—turning it into a reassuring journey away from uncertainty.",
      actions: {
        openForm: "Open the Wedding Plan Form",
        matchmakingHub: "Matchmaking",
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
      quickChatMessage: "Hello, I'd like to get information about getting married in Indonesia.",
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
          title: "Ongoing guidance & visas",
          items: [
            "Continuous guidance until the marriage is completed",
            "Visa and residence permit guidance for living in Indonesia",
            "Spouse visa and residence process guidance for living in Turkey",
          ],
        },
      ],
      flexibleTitle: "Flexible service approach",
      flexibleP1:
        "You can benefit from all our services end-to-end, or request support only in the areas you need.",
      flexibleP2:
        "You can get to know the process, us, and how we work better by watching the videos on our YouTube channel.",
      flexibleNote:
        'You can fill out the "Wedding Plan" form below, or review the required documents in detail from the "Marriage Documents in Indonesia" tab.',
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
          "From your arrival in Indonesia until the marriage is completed, we’re with you at every step.",
      },
    ],
    images: {
      prepAlt: "Wedding preparation details in Indonesia",
      ceremonyAlt: "Wedding ceremony in Indonesia",
    },
    tabs: {
      plan: "Wedding Plan",
      documents: "Marriage Documents in Indonesia",
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
      title: "Required documents for foreign–Indonesian marriage in Indonesia",
      subtitle:
        "The headings below are for general information. We check the exact and up-to-date list for your situation together.",
      foreignSpouse: {
        title: "Documents for the foreign spouse",
        intro: "In general, these are the core documents requested from the foreign spouse:",
        items: [
          "Valid passport (with at least 6 months validity)",
          "Indonesian entry visa or ITAS/ITAP",
          "Certificate of no impediment to marriage (from the Turkish Embassy in Indonesia)",
          "Birth certificate (multilingual)",
          "Single status certificate (translated into Indonesian and apostilled)",
          "If applicable, divorce decree or death certificate (translated and notarized)",
          "Proof of residence",
          "Passport photo taken within the last 6 months",
        ],
      },
      indonesianSpouse: {
        title: "Documents for the Indonesian spouse",
        intro: "For the Indonesian citizen spouse, the following documents are commonly required:",
        items: [
          "KTP (identity card)",
          "Akte Lahir (birth certificate)",
          "Kartu Keluarga (family card)",
          "Marital status letter (single / divorced / widowed)",
          "Forms N1–N10 and RW/RT approvals",
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
          "For many documents, apostille and Indonesian translation are mandatory. (Check with the KUA your partner is affiliated with)",
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
          "Hello, I'd like to get information about the marriage process and required documents in Indonesia.",
      },
    },
    faq: {
      items: [
        {
          q: "How long does the marriage process take on average in Indonesia?",
          a: "Depending on your document readiness, the city you apply in, and institutional workload, the planning and official procedures typically take from a few weeks to a few months.",
        },
        {
          q: "What should be my first step for getting married in Indonesia?",
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
    loading: 'Loading…',
    downloadPdf: "Download PDF",
    learnMore: "Learn more",
    back: "Go back",
    privacySecurity: {
      title: "Privacy & Security",
      text: "This page is tracked with Google Analytics. Your data is protected with SSL/TLS encryption.",
      policyLink: "Privacy Policy",
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

  floatingWhatsapp: {
    label: "WhatsApp",
    ariaLabel: "Chat on WhatsApp",
    messages: {
      default: "Hi, I'd like to get more information.",
      home: "Hi, I'd like to get information about Endonezya Kaşifi.",
      explore: "Hi, I'd like to get information about Indonesia's destinations.",
      travel: "Hi, I'd like to get information about planning an Indonesia holiday.",
      wedding: "Hi, I'd like to get information about getting married in Indonesia.",
      youtube: "Hi, I'd like to get information about your YouTube videos.",
      contact: "Hi, I'd like to get information about contacting you.",
      tours: "Hi, I'd like to get information about your tour packages.",
      documents: "Hi, I'd like to get information about your documents.",
    },
  },

  home: {
    hero: {
      badgeCompany: "Registered in Indonesia: PT MoonStar Global Indonesia",
      badgeSocial: "endonezyakasifi social accounts",
      title: "Indonesia Explorer",
      subtitle: "Tour organization • Wedding guidance • On-the-ground support",
      description:
        "We design boutique tour packages and tailor-made travel plans in Indonesia focused on honeymoon, exploration and relaxation. We also guide couples coming to Indonesia for marriage—step by step—through hotel, transport, interpretation and official paperwork.",
      note: "A Indonesia-based setup founded by a Turkish entrepreneur living in Indonesia.",
      ctaTours: "Browse tour packages",
      ctaBrochures: "Download brochures (PDF)",
      ctaTrust: "Trust & Legal",
    },
    trust: {
      items: [
        {
          title: "Clear process",
          description: "Pre-registration → written offer → contract/payment steps are straightforward.",
        },
        {
          title: "Turkish support",
          description: "WhatsApp support via Türkiye line; operations in Indonesia.",
        },
        {
          title: "Legal structure",
          description: "Indonesia Explorer is a brand registered under PT MoonStar Global Indonesia in Indonesia.",
        },
      ],
    },
    services: {
      title: "What do we do for you?",
      cards: {
        joinTours: {
          title: "Join scheduled group tours",
          description:
            "You can join our planned tour packages to Bali, Lombok, Komodo and other Indonesian islands—solo, with family or with friends.",
        },
        groupTours: {
          title: "Corporate group tours",
          description:
            "For companies, schools, associations and friend groups we plan custom Indonesia group tours based on your dates, group size and budget—plus meetings, events and team programs.",
        },
        privateTravel: {
          title: "Private / family travel",
          description:
            "We prepare tailor-made Indonesia holiday plans including flights, accommodation and routes—so you can explore Bali and beyond at your own pace.",
        },
        wedding: {
          title: "Wedding consulting",
          description:
            "We support you throughout the marriage process—documents, legal procedures, guidance, interpretation, transport and accommodation—so you can complete your wedding in Indonesia smoothly.",
        },
        youtube: {
          title: "YouTube videos",
          description:
            "Watch selected videos from our travels and wedding journey here; discover more on our YouTube channel and get to know Indonesia and our support better.",
        },
        dameturk: {
          title: "DaMeTurk (sub-brand)",
          aria: "DaMeTurk - Authentic Turkish ice cream",
          description:
            "Under PT MoonStar Global Indonesia, we run the DaMeTurk brand for authentic Turkish ice cream in Indonesia. Visit dameturk.com for details and updates.",
        },
      },
    },

    howItWorks: {
      title: "How do we proceed?",
      steps: [
        {
          title: "1) Pre-registration",
          description: "Free and non-binding. We clarify your needs.",
        },
        {
          title: "2) Written package",
          description: "Program + inclusions/exclusions + important notes are shared in writing.",
        },
        {
          title: "3) Approval & payment",
          description: "Review contract → payment → reservation is confirmed.",
        },
      ],
      ctaTours: "See tour packages",
      ctaDocuments: "Documents",
    },

    features: {
      title: "Why is it easier with us?",
      items: [
        {
          title: "Guidance from real experience",
          description:
            "We use our on-the-ground experience of living in Indonesia and organizing tours for route selection, accommodation and daily flow.",
        },
        {
          title: "Simple, transparent communication",
          description:
            "With Indonesian, Turkish and English support, we explain everything clearly and remove question marks from the start.",
        },
        {
          title: "Planning that fits your budget",
          description:
            "By considering travel, accommodation and daily expenses together, we build a plan that minimizes surprises.",
        },
      ],
    },

    cta: {
      eyebrow: "Ask anything freely",
      title: "Let’s clarify everything about Indonesia together",
      description:
        "Whether it’s our tour packages or your personal Indonesia travel plan… you can ask in Turkish and we’ll make the process simple and clear together.",
      ctaContact: "Open the contact form",
      ctaWhatsapp: "Ask via WhatsApp",
    },
  },

  about: {
    hero: {
      title: "About",
      subtitle:
        "We make your travel and tour experience in Indonesia easier step by step with our on-the-ground structure and experience.",
    },
    brand: {
      title: "Our brand structure",
      p1:
        "This website is the showcase and contact point for the services we operate under PT MoonStar Global Indonesia. Our public-facing brand communication is carried out under the name Indonesia Explorer.",
      p2:
        "MoonStar Global Indonesia was created by a Turkish entrepreneur living in Indonesia to build an on-the-ground setup that understands and solves Turkish guests’ expectations locally. Tour packages and sales communication are carried out under the Indonesia Explorer brand for a clearer experience.",
      cards: {
        toursTitle: "Tour organization",
        toursDesc: "Planned tours and bespoke travel plans for Bali, Lombok, Komodo and more.",
        weddingTitle: "Wedding guidance",
        weddingDesc: "End-to-end follow-up including hotels, transport, interpretation and official paperwork.",
        dameturkTitle: "DaMeTurk",
        dameturkDesc:
          "Our authentic Turkish ice cream brand under PT MoonStar Global Indonesia. Visit dameturk.com for details.",
      },
      socialNote:
        "Our YouTube and Instagram handles remain endonezyakasifi and support this brand through content production.",
    },
    philosophy: {
      title: "How we see travel",
      intro:
        "We don’t see travel as simply going to a destination. For us, travel—when planned right—is an experience that doesn’t exhaust you, truly refreshes you, sparks a sense of discovery, and makes you say ‘I’m glad I came’. We built our entire organization around this idea.",
      sections: {
        direct: {
          title: "Direct organization, local planning",
          p1:
            "All our tour programs are planned and executed directly by our on-the-ground team in Indonesia. We don’t offer desk-made packages copied from catalogs and passed through multiple intermediaries. The key difference: your budget goes to the experience itself, not to intermediary costs.",
          p2:
            "This means richer content, better activities and clearer, more transparent inclusions for the same budget.",
        },
        planning: {
          title: "We plan deliberately, measure and balance",
          p1:
            "Each tour is designed with route logic, daily pace, the balance between free time and guided days, physical fatigue factors, and different participant profiles in mind. Our goal is not to ‘look packed’ but to be smooth, balanced and genuinely enjoyable.",
          bullets: [
            "On guided days we include key activities to experience together.",
            "On free days we give guests space and flexibility.",
            "Optional experiences are clarified from the start.",
          ],
          p2: "So no one is left wondering what’s included and what’s extra.",
        },
        transparency: {
          title: "Transparency is a standard, not an option",
          p1:
            "What a tour includes and doesn’t include is clear from the beginning. Vague wording, surprise costs and last-minute extra payments are not part of how we work. Activities on guided days are included; during free time choices belong to guests—and this is stated clearly.",
        },
        comfort: {
          title: "A pleasant and peaceful holiday for everyone",
          p1:
            "Our tours are organized so each participant can equally enjoy their holiday. Group harmony, mutual respect and courtesy are as important to us as the itinerary.",
          p2:
            "Our aim is a calm, safe and balanced environment where no one spoils someone else’s holiday—and everyone returns home happy.",
        },
        guidance: {
          title: "Not just tours—real guidance",
          p1:
            "Our service goes far beyond a tour package. We work with a team that is on the ground, knows the region well, and can solve issues quickly when needed. Feeling safe during the journey is a core part of the organization.",
        },
        wedding: {
          title: "Wedding guidance in Indonesia",
          p1:
            "In addition to travel organization, we also provide guidance for special and sensitive processes such as getting married in Indonesia. We treat it as a separate service because we understand its responsibility.",
          p2:
            "Wedding guidance requires mastery of official procedures, local practices, timing and coordination. Our guidance is a natural result of our field experience and local knowledge.",
        },
        expectation: {
          title: "Those who travel with us know what to expect",
          p1:
            "People who travel with us know what they are getting and what they are paying for—and can focus on their holiday while leaving the logistics to us.",
        },
      },
      outro:
        "For more information about the <1>Uniqah</1> matchmaking system and <3>Wedding</3> guidance in Indonesia, you can explore these pages. For official texts and policies, use the <5>Documents</5> section.",
    },
    story: {
      title: "Our short story",
      steps: [
        "We moved to Indonesia and built our life and routine here.",
        "We traveled across different islands, got to know the country closely, and settled into its rhythm.",
        "We started sharing our life in Indonesia and travel experiences by launching our YouTube channel.",
        "Today, we guide travelers planning trips and tours to Indonesia—and couples going through the wedding process—using this experience.",
      ],
      stepLabel: "Step",
    },

    support: {
      title: "How we can support you",
      items: {
        joinScheduled: {
          title: "Join scheduled tours as an individual / family",
          description:
            "You can join our planned Indonesia tour packages on your own, with your spouse or with your family. You can choose a tour with clearly stated dates, capacity and scope and make a direct reservation via the Tours page.",
        },
        translation: {
          title: "Translation & communication support",
          description:
            "A Turkish-speaking interpreter can accompany you on guided days, during free time, and even for individual shopping—helping remove the language barrier and making you feel safer in Indonesia.",
        },
        privatePlan: {
          title: "Private travel & honeymoon planning",
          description:
            "If you prefer not to join a group tour and want to plan your own Indonesia trip or honeymoon, we design flights, accommodation, daily routes and experience suggestions together and create a plan tailored to you.",
        },
        privateGroups: {
          title: "Custom tours for corporate & friend groups",
          description:
            "For companies, schools, associations or friend groups, we design fully custom tour programs based on your dates, budget and expectations. You can submit a request via the Group Tours page.",
        },
        logistics: {
          title: "Accommodation & transport planning",
          description:
            "Even without buying a full tour package, you can benefit from extra services such as hotel booking, flight ticketing or car rental. We choose reliable alternatives that fit your budget and comfort.",
        },
        wedding: {
          title: "Guidance for getting married in Indonesia",
          description:
            "For couples planning to marry in Indonesia, we provide guidance on timing, local practices and overall coordination. We cover the details as a separate topic on the wedding guidance page.",
        },
      },
    },

    galleryTeaser: {
      title: "A few examples from our travels",
      description:
        "Below you can see a few selected moments from our travels and on-the-ground experiences in Indonesia. For more, you can visit our gallery.",
      cta: "Visit our gallery to see all photos",
      previewAlt1: "A moment from our life in Indonesia",
      previewAlt2: "A moment from a day we spent together in Indonesia",
      previewAlt3: "A moment from a special memory in Indonesia",
    },

    youtubeHighlights: {
      title: "Videos that describe us best",
      description:
        "On our YouTube channel, you can find videos about our life in Indonesia, our travels and discoveries. The two videos below summarize us and the support we provide best.",
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
          title: "Work directly with the organizer",
          description:
            "Instead of intermediaries, you work with the team that plans and runs the tour on the ground—decisions and answers come from the source.",
        },
        {
          title: "Transparent, clear costs",
          description:
            "We clarify what’s included and excluded from the start and offer a predictable, open cost picture instead of hidden fees.",
        },
        {
          title: "A team that takes responsibility on the ground",
          description:
            "We’re not only there when selling the tour—we stay with you on the ground, follow the flow, and produce solutions when needed.",
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
      consentPrefix: "I have read and accept the privacy policy.",
      privacyLink: "Privacy Policy",
      submit: "Send",
      submitting: "Sending…",
    },
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
    signupGuide: 'To sign up, select gender and nationality, then confirm the age requirement.',
    or: 'or',
    labels: {
      email: 'Email',
      password: 'Password',
      gender: 'Gender',
      nationality: 'Nationality',
      nationalityOther: 'Other nationality (specify)',
    },
    placeholders: {
      email: 'example@email.com',
      password: 'Your password',
      nationality: 'Select nationality',
      nationalityOther: 'e.g., Germany',
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
      ageConfirm: 'I confirm that I am at least {{minAge}} years old. (Open the agreement for details)',
      ageConfirmLink: 'Agreement',
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
      googleFailed: 'Google sign-in failed.',
      invalidCredential: 'Invalid email or password (or the account was not found). If you forgot your password, use “Forgot password”.',
      invalidEmail: 'That email address looks invalid. Please check it and try again.',
      emailAlreadyInUse: 'An account already exists with this email. Please sign in or use “Forgot password”.',
      weakPassword: 'Password is too weak. Please choose a stronger password (e.g., at least 6 characters).',
      emailPasswordRequired: 'Email and password are required.',
      genderRequired: 'Please select your gender to sign up.',
      nationalityRequired: 'Please select your nationality to sign up.',
      nationalityOtherRequired: 'Please specify your nationality.',
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
        lead: 'Upload 3 new photos. They will be updated after admin approval.',
        pending: 'Under review',
        cta: 'Send request',
        uploading: 'Uploading…',
        success: 'Request received. Your photos will be updated after review.',
        errors: {
          photosRequired: 'Please choose 3 photos.',
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
    actions: {
      logout: 'Sign out',
      profileForm: 'Profile form',
      whatsapp: 'Message on WhatsApp',
      remove: 'Remove',
      sending: 'Sending…',
      pending: 'Pending…',
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
      editOnceUsed: 'This one-time edit has already been used. The form cannot be edited again.',
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
      freeActiveTitle: 'Women: free active membership',
      freeActiveBody: 'If you are identity-verified, you can apply for free active membership. This can unlock actions without a paid membership (48/24h inactivity rules apply).',
      freeActiveNeedsVerification: 'Identity verification is required for free active membership.',
      paymentTitle: 'Paid membership (monthly) / payment',
      paymentBody: 'To activate membership, pay with one of the methods below, then submit a payment report with your receipt/reference details.',
      selectMatchTitle: 'Select a match for the payment report',
      selectMatchHelp: 'Technically, payment reports are attached to a match. If you have no match, contact support via WhatsApp.',
      selectMatchPlaceholder: 'Select a match…',
      matchOption: '{{status}} • {{matchCode}}',
      selectMatchRequired: 'You must select a match to send a payment report.',
    },
    payment: {
      success: 'Your payment report has been received. Your membership will be activated after admin approval.',
      errors: {
        sendFailed: 'Payment report could not be sent.',
        rateLimited: 'You are submitting payment reports too frequently. Please wait and try again.',
        notReady: 'Payment step is not available right now. Please contact support.',
      },
    },
    receipt: {
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
      membershipOrVerificationRequired: 'This action requires a paid membership or (for women) identity verification + free active membership.',
      freeActiveMembershipRequired: 'This action requires your free active membership to be active. If you are verified, you can apply from the panel.',
      freeActiveMembershipBlocked: 'Your free active membership privilege is disabled. You need a paid membership for this action.',
      otherUserMatched: 'This person is already matched with someone else.',
      alreadyMatched: 'You already have a match.',
      userLocked: 'Your match process is locked. This action is not allowed.',
      pendingContinueExists: 'You already selected someone to continue with. Decide on that match first.',
      requestNewFailed: 'Could not request a new match.',
      requestNewRateLimited: 'You are requesting too often. Please try again later.',
      requestNewQuotaExhausted: 'You have used up today’s new match quota (3/3). Please try again tomorrow.',
      requestNewFreeActiveBlocked: 'You cannot request a new match because your free active membership privilege was cancelled. You need a paid membership to reactivate.',
      freeSlotFailed: 'Free slot action failed.',
      freeSlotQuotaExhausted: 'You have used today\'s free slot quota (1/1). Please try again tomorrow.',
      cooldownActive: 'Please wait a bit before doing this again. Remaining: {{remaining}}',
      newUserSlotAlreadyActive: 'Your new-user slot is already active. Please wait for a suitable new sign-up, or use the normal refresh.',
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
      lead: 'Membership terms:',
      inactiveMale: 'Membership is not active. For men, membership is required to use matching actions (accept/reject, chat/contact).',
      inactiveFemale: 'Membership is not active. Matching and preview are available without membership. To take actions, you need free active membership (with verification) or a paid membership.',
      activeViaVerification: 'You are identity-verified. To take actions, you can apply for free active membership or buy a paid membership.',
      freeActiveActive: 'Your free active membership is active (via identity verification).',
      freeActiveTermsTitle: 'Free active membership terms',
      freeActiveTermsBody: 'If you get free active membership via identity verification and you are inactive for 48 hours, the free active membership is cancelled. On re-application, the window drops to 24 hours. If you are inactive again, you cannot get free active membership until you purchase a paid membership, and you cannot request a new match.',
      freeActiveApplying: 'Applying…',
      freeActiveApplied: 'Free active membership enabled. Window: {{hours}} hours.',
      daysLeft_one: 'Time left: {{count}} day.',
      daysLeft_other: 'Time left: {{count}} days.',
      until: 'Ends: {{date}}.',
    },
    membershipNotice: {
      title: 'Like / details / contact notice',
      male: {
        lead: 'Flow for male users:',
        points: [
          'Matching and limited previews are free.',
          'Viewing full details, like/reject and contacting require a paid membership.',
        ],
      },
      female: {
        lead: 'Flow for female users:',
        points: [
          'Matching and limited previews are free.',
          'Viewing full details, like/reject and contacting require identity verification + free active membership or a paid membership.',
          'Free active membership has inactivity rules (see the terms section in the panel).',
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
            a: 'For male users, a paid membership is required. For female users, identity verification + free active membership or a paid membership is required.',
          },
          {
            q: 'What is identity verification for?',
            a: 'It is a trust badge. It strengthens complaint handling with evidence and (for female users) can unlock the free active membership flow.',
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
      unverifiedBodyFemale: 'Identity verification is optional. Note: women can use actions with membership or identity verification.',
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
      cancel: 'Cancel my membership',
      cancelDisabledHint: 'You cannot cancel until membership is active.',
      deleteAccount: 'Delete account',
      deleteTypePrompt: 'If you really want to delete the account: type "hesabımı sil".',
      deleteFinalConfirm: 'Your account will be permanently deleted from the system. Are you sure?',
      deleteCancel: 'Cancel',
      deleteContinue: 'Continue',
      deleteBack: 'Back',
      deleteYes: 'Yes, delete my account',
      loading: 'Working…',
      alreadyActive: 'Your membership is already active',
      successActivated: 'Your membership was activated.',
      promoActivated: 'Your Eco plan was activated for free. Ends on {{date}} ({{count}} days left).',
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
        placeholder: 'Write a message…',
        send: 'Send',
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
        referencePlaceholder: 'Receipt no, description, sender name…',
        note: 'Note (optional)',
        notePlaceholder: 'Add extra details if you want',
        receipt: 'Receipt (optional)',
        receiptHelp: 'You can upload a photo or paste a receipt link below.',
        receiptLink: 'Receipt link (optional)',
        viewReceipt: 'View receipt',
        uploadingReceipt: 'Uploading receipt…',
        sendPayment: 'Send payment notice ({{amount}} {{currency}})',
        supportWhatsapp: 'WhatsApp support',
        supportWhatsappMessage: 'I need help with membership/payment in my matchmaking process. Match Code: {{matchCode}}',
      },
    },
    intro: {
      title: 'How matchmaking works',
      body: 'Our goal is to help people with serious marriage intent meet safely. The points below describe how the system actually works.',
      cta: 'Fill the matchmaking form',
      eligibilityPointMale: 'Matching and previewing the matched profile inside the site do not require membership. To view full profile details, accept/reject, or contact the matched person, you must purchase an active membership.',
      eligibilityPointFemale: 'Matching and viewing limited profile info inside the site do not require membership. To accept/reject and contact the matched person, you must either apply for free active membership with identity verification or purchase a paid membership.',
      points: [
        'Profiles are not public. Only matched users can view each other’s details.',
        'Up to 3 / 5 / 10 candidates are shown depending on your plan. Marking/liking a candidate does not delete the others; you can choose to show only your marked candidate if you want.',
        'Step 1: Review the candidate → Accept or Reject. If one side rejects, the match is canceled.',
        'Step 2 (second approval): If both sides accept, choose the next step in the panel (in-site chat or contact sharing). The step activates only when both sides choose the same option.',
        'Lock: When step 2 is agreed, the process is locked and you cannot request a new match until it is resolved/canceled.',
        'In-site chat blocks phone/WhatsApp, social media and links. If contact sharing is unlocked, responsibility belongs to the individuals.',
        'New match requests: If you were rejected, you can remove that match from your panel and request a new one (daily quota: 3).',
        '{{eligibilityPoint}}',
        'Safety: If rules are violated (false info, insults/harassment, sexual abuse, financial exploitation, dating/entertainment intent) and proven with screenshots/evidence, the user is permanently banned and cannot request refunds.',
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
    form: {
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
            title: 'More details',
            desc: 'Lifestyle and language preferences help matching.',
          },
          identity: {
            title: 'About you & what you seek',
            desc: 'Select your nationality/gender and who you’re looking for.',
          },
          photos: {
            title: 'Photos & short intro',
            desc: 'Upload 3 photos and introduce yourself briefly.',
          },
          preferences: {
            title: 'Partner preferences & consents',
            desc: 'Finalize preferences and submit your application.',
          },
        },
      },
      labels: {
        childrenLivingSituation: 'Do you live with your children?',
      },
      placeholders: {
        occupation: 'e.g., Teacher / Doctor / Engineer',
      },
      options: {
        childrenLivingSituation: {
          withChildren: 'I live with my children',
          separate: 'I live separately from my children',
        },
      },
      confirmGender: {
        title: 'Confirm gender',
        text: 'You selected your gender as "{{gender}}". Confirm?',
        cancel: 'Cancel',
        confirm: 'Confirm',
      },
      hints: {
        lookingForGenderAuto: 'The gender you are looking for is set automatically based on your gender.',
      },
      errors: {
        childrenLivingSituation: 'Please select your living situation with your children.',
        occupation: 'Please enter your occupation.',
      },
    },
  },

  matchmakingMembership: {
    title: 'Membership activation',
    lead: 'You can activate your membership here.',
    planTitle: 'Monthly membership',
    monthlyPrice: 'Price: ${{amount}} / month',
    promoTitle: 'Promo: Free activation',
    promoBody: 'Membership activation is free until {{date}}.',
    promoEndedTitle: 'Promo ended',
    promoEndedBody: 'After {{date}}, membership activation is paid and becomes active after payment.',
    freeActivateCta: 'Activate my membership for free',
    paidActivationCta: 'Continue to payment',
    activating: 'Activating…',
    activated: 'Membership activated.',
    activatedUntil: 'Membership activated. Valid until: {{date}}',
    freeActivatedInfo:
      'Your free membership is assigned until {{date}}.\nWith this membership, you can like/reject match profiles and use {{translatedCount}} translated messages.\nYour daily match-change limit is {{dailyLimit}}.',
    promoExpired: 'Promo expired. After {{date}}, activations are paid and become active after payment.',
    promoDisabled: 'The promo is currently disabled. Please try again later.',
    activateFailed: 'Could not activate membership. Please try again.',
    errors: {
      notAuthenticated: 'Session could not be verified. Please log out and log in again.',
      serverNotConfigured: 'Server configuration is missing. Please contact support.',
      apiUnavailableDev: 'API is not reachable. In local dev, run `npm run dev` (api+web).',
    },
    backToPanel: 'Back to panel',
    paymentMethodsSoon: 'Note: Membership activation is free until {{date}}.',
    paidAdminApprovalNote: 'Note: After {{date}}, activation is paid and becomes active after payment.',
  },
};
