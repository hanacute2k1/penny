import type { SpendPlanItemKey, SpendPlanTemplateKey } from '@/lib/helper/spendPlans';
import type { PlanActivityKind } from '@/lib/type';
export type Dictionary = {
  brand: string;
  loading: string;
  common: {
    view: string;
    all: string;
    save: string;
    add: string;
    close: string;
    hide: string;
    optional: string;
    searchNotes: string;
    confirm: string;
    cancel: string;
    delete: string;
    edit: string;
  };
  nav: {
    overview: string;
    activity: string;
    plans: string;
  };
  month: {
    previous: string;
    next: string;
    today: string;
    yesterday: string;
    thisMonth: string;
  };
  dashboard: {
    income: string;
    expense: string;
    byCategory: string;
    net: string;
    surplus: string;
    deficit: string;
    even: string;
    periodMonth: string;
    periodYear: string;
    periodCustom: string;
    periodLabel: string;
    from: string;
    to: string;
    previousYear: string;
    nextYear: string;
    count: string;
    perDay: string;
    trendDay: string;
    trendMonth: string;
    point: string;
    empty: string;
    remainingBudget: string;
  };
  transactions: {
    allCategories: string;
    expense: string;
    income: string;
    empty: string;
    add: string;
    edit: string;
    addExpense: string;
    addIncome: string;
    amount: string;
    category: string;
    date: string;
    note: string;
    delete: string;
    deleteConfirm: string;
    fallbackName: string;
    modeCustom: string;
    modeCategory: string;
    whatFor: string;
    whatForPlaceholder: string;
    fromWhere: string;
    fromWherePlaceholder: string;
    frequent: string;
    customHint: string;
    typeAll: string;
    monthSummary: string;
  };
  settings: {
    title: string;
    categories: string;
    categoriesCount: string;
    fixedCosts: string;
    fixedCostsCount: string;
    plans: string;
    plansCount: string;
    currency: string;
    currencyHint: string;
    language: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeToDark: string;
    themeToLight: string;
    glass: string;
    glassOn: string;
    glassOff: string;
    glassHint: string;
    textSize: string;
    textSmaller: string;
    textLarger: string;
    textReset: string;
  };
  categories: {
    title: string;
    back: string;
    addExpense: string;
    namePlaceholder: string;
    expense: string;
    income: string;
    addIncome: string;
    add: string;
    edit: string;
    name: string;
    icon: string;
    customIcon: string;
    hide: string;
    hidden: string;
    show: string;
    hideHint: string;
    empty: string;
    delete: string;
    deleteConfirm: string;
    deleteUsed: string;
    manage: string;
    manageDone: string;
    addShort: string;
  };
  fixed: {
    title: string;
    subtitle: string;
    back: string;
    add: string;
    edit: string;
    name: string;
    namePlaceholder: string;
    amount: string;
    category: string;
    type: string;
    dayOfMonth: string;
    dayHint: string;
    startMonth: string;
    active: string;
    inactive: string;
    empty: string;
    delete: string;
    save: string;
    totalMonthly: string;
    postedBadge: string;
    everyMonth: string;
  };
  plans: {
    title: string;
    subtitle: string;
    back: string;
    add: string;
    edit: string;
    titleLabel: string;
    titlePlaceholder: string;
    note: string;
    notePlaceholder: string;
    amount: string;
    category: string;
    type: string;
    targetMonth: string;
    dayOfMonth: string;
    dayHint: string;
    empty: string;
    delete: string;
    save: string;
    upcoming: string;
    forMonth: string;
    posted: string;
    scheduled: string;
    autoHint: string;
    futureMonthHint: string;
  };
  spendPlans: {
    costList: string;
    addCost: string;
    editCost: string;
    costName: string;
    costNamePlaceholder: string;
    costPlace: string;
    costPlacePlaceholder: string;
    costDate: string;
    costTime: string;
    costNoDate: string;
    costEmpty: string;
    costDelete: string;
    costPaidAhead: string;
    title: string;
    subtitle: string;
    create: string;
    edit: string;
    empty: string;
    upcoming: string;
    review: string;
    done: string;
    name: string;
    namePlaceholder: string;
    icon: string;
    startDate: string;
    endDate: string;
    note: string;
    template: string;
    items: string;
    itemPlaceholder: string;
    addItem: string;
    removeItem: string;
    estimate: string;
    actual: string;
    extras: string;
    left: string;
    over: string;
    onTarget: string;
    diff: string;
    checked: string;
    notFilled: string;
    reviewHint: string;
    settle: string;
    settleHint: string;
    resettle: string;
    settled: string;
    reopen: string;
    delete: string;
    deleteConfirm: string;
    back: string;
    notFound: string;
    inDays: string;
    tomorrow: string;
    today: string;
    people: string;
    peopleCount: string;
    tabItinerary: string;
    tabCosts: string;
    tabPrepare: string;
    dayLabel: string;
    dayCount: string;
    activityCount: string;
    addActivity: string;
    editActivity: string;
    activityTitle: string;
    activityTitlePlaceholder: string;
    activityDay: string;
    activityTime: string;
    activityPlace: string;
    activityPlacePlaceholder: string;
    activityNote: string;
    kinds: Record<PlanActivityKind, string>;
    openMap: string;
    dayEmpty: string;
    unscheduled: string;
    unscheduledHint: string;
    deleteActivity: string;
    markDone: string;
    anyTime: string;
    deposit: string;
    remaining: string;
    perPerson: string;
    expected: string;
    estimateShort: string;
    checklistTitle: string;
    checklistPlaceholder: string;
    checklistAdd: string;
    checklistDone: string;
    checklistEmpty: string;
    suggestions: string;
    checklistSuggestions: string[];
    removeChecklist: string;
    share: string;
    shareTitle: string;
    shareBody: string;
    shareCreate: string;
    shareCopy: string;
    shareCopied: string;
    shareSend: string;
    shareStop: string;
    shareStopHint: string;
    shareOn: string;
    sharedFrom: string;
    sharedCta: string;
    sharedNotFound: string;
    readOnly: string;
    addStay: string;
    stayTitlePlaceholder: string;
    checkIn: string;
    checkOut: string;
    checkInDay: string;
    checkInTime: string;
    checkOutDay: string;
    checkOutTime: string;
    stayHint: string;
    sleepAt: string;
    mapLink: string;
    mapLinkPlaceholder: string;
    paste: string;
    copy: string;
    copied: string;
    mapLinkFound: string;
    mapLinkLoading: string;
    mapLinkNoPoint: string;
    mapLinkInvalid: string;
    route: string;
    routeTitle: string;
    routeSummary: string;
    routeEstimateHint: string;
    routeOpen: string;
    routePart: string;
    routeMissing: string;
    routeMissingHint: string;
    routeEmpty: string;
    routeDetour: string;
    routeDetourBody: string;
    routeReorder: string;
    routeTight: string;
    routeSpread: string;
    routeGood: string;
    routeStart: string;
    routeEnd: string;
    durMinutes: string;
    durHours: string;
    durHoursMinutes: string;
    km: string;
    longTripTitle: string;
    longTripHint: string;
    addOutbound: string;
    addReturn: string;
    depart: string;
    arrive: string;
    departDay: string;
    departTime: string;
    arriveDay: string;
    arriveTime: string;
    fromPlace: string;
    fromPlacePlaceholder: string;
    toPlace: string;
    toPlacePlaceholder: string;
    moveTitlePlaceholder: string;
    returnTitle: string;
    fromMapLink: string;
    toMapLink: string;
    arriveAt: string;
    arriveAtDay: string;
    routeScheduled: string;
    teamTitle: string;
    teamBody: string;
    teamStart: string;
    teamInviteLink: string;
    teamReset: string;
    teamResetHint: string;
    teamStop: string;
    teamStopHint: string;
    teamPeople: string;
    teamOwner: string;
    teamYou: string;
    teamGuest: string;
    teamRemove: string;
    teamRemoveConfirm: string;
    teamLeave: string;
    teamLeaveConfirm: string;
    teamPeopleError: string;
    teamMemberHint: string;
    teamBadge: string;
    teamJoined: string;
    viewOnlyTitle: string;
    joinTitle: string;
    joinNotFound: string;
    joinFailed: string;
    joinRetry: string;
    teamSyncHint: string;
    jumpToDay: string;
    happening: string;
    templates: Record<SpendPlanTemplateKey, string>;
    templateItems: Record<SpendPlanItemKey, string>;
    costsBefore: string;
    costsAfter: string;
    beforeHint: string;
    afterHint: string;
    planned: string;
    spentReal: string;
    gap: string;
    afterEmpty: string;
  };
  exchange: {
    title: string;
    open: string;
    from: string;
    to: string;
    amount: string;
    swap: string;
    updated: string;
    saved: string;
    loading: string;
    error: string;
    retry: string;
    notes: string;
    notesHint: string;
    disclaimer: string;
  };
  auth: {
    title: string;
    subtitle: string;
    linkError: string;
    genericError: string;
    rateLimited: string;
    welcome: string;
    heroTitle: string;
    perkPrivate: string;
    perkDevices: string;
    heroSubtitle: string;
    formTitle: string;
    formHint: string;
    privacyNote: string;
    sampleExpense: string;
    sampleIncome: string;
    or: string;
    withGoogle: string;
    asGuest: string;
    guestHint: string;
    providerError: string;
    guestName: string;
    guestOff: string;
    guestDeviceOnly: string;
    saveTitle: string;
    saveBody: string;
    guestSignOutTitle: string;
    guestSignOutBody: string;
    account: string;
    signOut: string;
    syncError: string;
    loadError: string;
    retry: string;
    importTitle: string;
    importBody: string;
    importYes: string;
    importNo: string;
    perkNoEmail: string;
    signUpTitle: string;
    signUpHint: string;
    signInTab: string;
    signUpTab: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    usernameHint: string;
    invalidUsername: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordHint: string;
    shortPassword: string;
    showPassword: string;
    hidePassword: string;
    signIn: string;
    signUp: string;
    working: string;
    wrongLogin: string;
    usernameTaken: string;
    setupNeeded: string;
    saveAccount: string;
    saveDone: string;
  };
  reset: {
    open: string;
    title: string;
    scopeThisMonth: string;
    scopeMonths: string;
    scopeAll: string;
    whatToDelete: string;
    transactions: string;
    budgets: string;
    pickMonths: string;
    noMonths: string;
    summary: string;
    nothing: string;
    allSummary: string;
    fixedNote: string;
    typeToConfirm: string;
    confirmWord: string;
    confirm: string;
    irreversible: string;
    done: string;
  };
  categoryNames: Record<
    | 'c-food'
    | 'c-transport'
    | 'c-home'
    | 'c-shop'
    | 'c-health'
    | 'c-fun'
    | 'c-edu'
    | 'c-other'
    | 'c-salary'
    | 'c-other-in',
    string
  >;
  languages: {
    en: string;
    vi: string;
    ko: string;
  };
};

export const en: Dictionary = {
  brand: 'Penny',
  loading: 'Loading…',
  common: {
    view: 'View ›',
    all: 'All',
    save: 'Save',
    add: 'Add',
    close: 'Close',
    hide: 'Hide',
    optional: 'Optional',
    searchNotes: 'Search notes…',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
  },
  nav: {
    overview: 'Overview',
    activity: 'Activity',
    plans: 'Plans',
  },
  month: {
    previous: 'Previous month',
    next: 'Next month',
    today: 'Today',
    yesterday: 'Yesterday',
    thisMonth: 'This month',
  },
  dashboard: {
    income: 'Income',
    expense: 'Spent',
    byCategory: 'Spending by category',
    net: 'Balance',
    surplus: 'Saved {amount}',
    deficit: 'Short by {amount}',
    even: 'Even',
    periodMonth: 'Month',
    periodYear: 'Year',
    periodCustom: 'Dates',
    periodLabel: 'Period',
    from: 'From',
    to: 'To',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    count: '{count} transactions',
    perDay: 'About {amount} a day',
    trendDay: 'Spending by day',
    trendMonth: 'Spending by month',
    point: '{label}: {amount}',
    empty: 'No transactions in this period yet.',
    remainingBudget: 'Left to spend',
  },
  transactions: {
    allCategories: 'All categories',
    expense: 'Expense',
    income: 'Income',
    empty: 'No matching transactions',
    add: 'Add transaction',
    edit: 'Edit transaction',
    addExpense: 'Add expense',
    addIncome: 'Add income',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    note: 'Note',
    delete: 'Delete transaction',
    deleteConfirm: 'Delete this transaction? This cannot be undone.',
    fallbackName: 'Transaction',
    modeCustom: 'Type it',
    modeCategory: 'Pick a category',
    whatFor: 'What was it for?',
    whatForPlaceholder: 'e.g. Parking, water, snacks',
    fromWhere: 'Where did it come from?',
    fromWherePlaceholder: 'e.g. Sold old phone, gift',
    frequent: 'You often type',
    customHint: 'Saved under “{category}” so it still counts in your reports.',
    typeAll: 'All',
    monthSummary: 'This month',
  },
  settings: {
    title: 'Settings',
    categories: 'Categories',
    categoriesCount: '{count} categories',
    fixedCosts: 'Fixed monthly costs',
    fixedCostsCount: '{count} items',
    plans: 'Upcoming costs',
    plansCount: '{count} coming up',
    currency: 'Currency',
    currencyHint: "Changes the unit only. Amounts you've entered aren't converted.",
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
    glass: 'Liquid Glass',
    glassOn: 'Turn off Liquid Glass',
    glassOff: 'Turn on Liquid Glass',
    glassHint: 'Frosted-glass look for the bars and buttons',
    textSize: 'Text size',
    textSmaller: 'Smaller text',
    textLarger: 'Larger text',
    textReset: 'Reset',
  },
  categories: {
    title: 'Categories',
    back: '‹ Settings',
    addExpense: 'Add expense category',
    namePlaceholder: 'Category name',
    expense: 'Expense',
    income: 'Income',
    addIncome: 'Add income category',
    add: 'Add category',
    edit: 'Edit category',
    name: 'Name',
    icon: 'Icon',
    customIcon: 'Or type an emoji',
    hide: 'Hide',
    hidden: 'Hidden',
    show: 'Show again',
    hideHint: 'Hidden categories disappear from pickers; past transactions keep them.',
    empty: 'No categories yet.',
    delete: 'Delete category',
    deleteConfirm: 'Delete this category?',
    deleteUsed:
      'It already has transactions, so it will be hidden instead — past transactions keep it.',
    manage: 'Edit',
    manageDone: 'Done',
    addShort: 'Add',
  },
  fixed: {
    title: 'Fixed monthly costs',
    subtitle: 'Added automatically every month on the day you pick',
    back: '‹ Settings',
    add: 'Add fixed cost',
    edit: 'Edit fixed cost',
    name: 'Name',
    namePlaceholder: 'e.g. Rent, Wifi',
    amount: 'Amount',
    category: 'Category',
    type: 'Type',
    dayOfMonth: 'Day of month',
    dayHint: 'Day {day} every month',
    startMonth: 'Start month',
    active: 'Active',
    inactive: 'Paused',
    empty: 'None yet. Add rent, wifi or subscriptions.',
    delete: 'Delete',
    save: 'Save',
    totalMonthly: 'Each month',
    postedBadge: 'Fixed',
    everyMonth: 'Every month',
  },
  plans: {
    title: 'Upcoming costs',
    subtitle: "Note costs for future months — they're added when the month comes",
    back: '‹ Settings',
    add: 'Add plan',
    edit: 'Edit plan',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Wedding gift, Flight tickets',
    note: 'Detail',
    notePlaceholder: 'Optional detail',
    amount: 'Amount',
    category: 'Category',
    type: 'Type',
    targetMonth: 'For month',
    dayOfMonth: 'Day of month',
    dayHint: 'Will post on day {day}',
    empty: 'No upcoming costs yet.',
    delete: 'Delete',
    save: 'Save',
    upcoming: 'Coming up',
    forMonth: 'Planned this month',
    posted: 'Posted',
    scheduled: 'Scheduled',
    autoHint: "When the month comes, it's added to your transactions.",
    futureMonthHint: 'A future month — nothing has been charged yet',
  },
  spendPlans: {
    costList: 'Costs',
    addCost: 'Add a cost',
    editCost: 'Edit cost',
    costName: 'What for',
    costNamePlaceholder: 'e.g. Flights, seafood dinner',
    costPlace: 'Where',
    costPlacePlaceholder: 'e.g. Night market',
    costDate: 'Day',
    costTime: 'Time',
    costNoDate: 'No day set',
    costEmpty: 'No costs yet. Add tickets, rooms, meals… with when and where you pay.',
    costDelete: 'Delete cost',
    costPaidAhead: '{amount} paid',
    title: 'Plans',
    subtitle: 'Itinerary, costs and packing for every trip',
    create: 'New plan',
    edit: 'Edit plan',
    empty: 'No trips yet. Plan your next one.',
    upcoming: 'Upcoming',
    review: 'To check',
    done: 'Done',
    name: 'Name',
    namePlaceholder: 'e.g. Da Lat trip',
    icon: 'Icon',
    startDate: 'From',
    endDate: 'To',
    note: 'Note',
    template: 'Quick start',
    items: 'Planned',
    itemPlaceholder: 'Item',
    addItem: 'Add item',
    removeItem: 'Remove',
    estimate: 'Planned',
    actual: 'Actual',
    extras: 'Extra costs',
    left: 'Left over {amount}',
    over: 'Over by {amount}',
    onTarget: 'Right on plan',
    diff: 'Difference',
    checked: '{checked} of {planned} filled in',
    notFilled: 'Not filled',
    reviewHint: 'Done? Enter what you really spent.',
    settle: 'Close out & record',
    settleHint: 'Adds actual costs to Transactions so they count in your budget.',
    resettle: 'Update transactions',
    settled: 'Recorded {count} transactions',
    reopen: 'Reopen',
    delete: 'Delete plan',
    deleteConfirm: 'Delete this plan? Recorded transactions stay.',
    back: '‹ Plans',
    notFound: 'Plan not found',
    inDays: 'In {count} days',
    tomorrow: 'Tomorrow',
    today: 'Today',
    people: 'People',
    peopleCount: '{count} people',
    tabItinerary: 'Itinerary',
    tabCosts: 'Costs',
    tabPrepare: 'Packing',
    dayLabel: 'Day {n}',
    dayCount: '{count} days',
    activityCount: '{count} stops',
    addActivity: 'Add a stop',
    editActivity: 'Edit stop',
    activityTitle: 'What',
    activityTitlePlaceholder: 'e.g. Breakfast at the market',
    activityDay: 'Day',
    activityTime: 'Time',
    activityPlace: 'Place',
    activityPlacePlaceholder: 'e.g. Xuan Huong Lake',
    activityNote: 'Note',
    kinds: {
      move: 'Travel',
      stay: 'Stay',
      food: 'Food',
      see: 'Sights',
      other: 'Other',
    },
    openMap: 'Open map',
    dayEmpty: 'Nothing planned for this day',
    unscheduled: 'Not on a day',
    unscheduledHint: "These fall outside the trip's dates. Tap one to move it.",
    deleteActivity: 'Delete stop',
    markDone: 'Mark as done',
    anyTime: 'Any time',
    deposit: 'Deposit',
    remaining: 'Left to pay',
    perPerson: 'Per person',
    expected: 'Expected total',
    estimateShort: 'Planned {amount}',
    checklistTitle: 'To pack & prepare',
    checklistPlaceholder: 'Add something to bring',
    checklistAdd: 'Add',
    checklistDone: '{done} of {total} ready',
    checklistEmpty: 'Nothing yet. Pick a suggestion below or add your own.',
    suggestions: 'Suggestions',
    checklistSuggestions: [
      'ID / Passport',
      'Power bank',
      'Medicine',
      'Clothes',
      'Toiletries',
      'Sunscreen',
      'Cash',
      'Raincoat',
    ],
    removeChecklist: 'Remove',
    share: 'Share',
    shareTitle: 'Share plan',
    shareBody:
      'Anyone with the link can see the itinerary, costs and packing list, no account needed. They can only view it.',
    shareCreate: 'Create share link',
    shareCopy: 'Copy link',
    shareCopied: 'Copied',
    shareSend: 'Send with another app',
    shareStop: 'Stop sharing',
    shareStopHint: "The current link won't open any more.",
    shareOn: 'Shared',
    sharedFrom: 'A plan shared with Penny',
    sharedCta: 'Plan your own with Penny',
    sharedNotFound: "This link doesn't open any more. The owner may have stopped sharing it.",
    readOnly: 'View only',
    addStay: 'Stay',
    stayTitlePlaceholder: 'Hotel, homestay…',
    checkIn: 'Check in',
    checkOut: 'Check out',
    checkInDay: 'Check-in day',
    checkInTime: 'Check-in time',
    checkOutDay: 'Check-out day',
    checkOutTime: 'Check-out time',
    stayHint: 'Check-in and check-out go into the itinerary on their own.',
    sleepAt: 'Night at {name}',
    mapLink: 'Google Maps link',
    mapLinkPlaceholder: 'Paste a link from Google Maps',
    paste: 'Paste',
    copy: 'Copy',
    copied: 'Copied',
    mapLinkFound: 'Location found, it will show on the route map.',
    mapLinkLoading: 'Reading the location…',
    mapLinkNoPoint: "Couldn't read a location from this link. It still saves, just not on the map.",
    mapLinkInvalid: "This isn't a Google Maps link.",
    route: 'Route',
    routeTitle: 'Route · {day}',
    routeSummary: '{km} · about {time} on the move',
    routeEstimateHint:
      'Straight-line distances and rough times. Open Google Maps for real roads and traffic.',
    routeOpen: 'Open route in Google Maps',
    routePart: 'Part {n}',
    routeMissing: "{count} stops aren't on the map",
    routeMissingHint: 'Add a Google Maps link to these stops to place them.',
    routeEmpty:
      "No stop has a location yet. Add Google Maps links to this day's stops to see the route.",
    routeDetour: 'You may be doubling back',
    routeDetourBody: 'Going {order} is about {km} shorter.',
    routeReorder: 'Use this order, keep the times',
    routeTight: '{from} → {to} takes about {need}, but the plan leaves {gap}.',
    routeSpread: 'Stops are up to {km} apart. Consider splitting this day.',
    routeGood: 'This order looks efficient.',
    routeStart: 'Leave from',
    routeEnd: 'Back to',
    durMinutes: '{m} min',
    durHours: '{h} h',
    durHoursMinutes: '{h} h {m} min',
    km: '{n} km',
    longTripTitle: 'Going far?',
    longTripHint: 'Add the ride there, the stay and the ride back. They land on the right days.',
    addOutbound: 'Trip there',
    addReturn: 'Trip back',
    depart: 'Departure',
    arrive: 'Arrival',
    departDay: 'Departure day',
    departTime: 'Departs',
    arriveDay: 'Arrival day',
    arriveTime: 'Arrives',
    fromPlace: 'From',
    fromPlacePlaceholder: 'e.g. Mien Dong bus station',
    toPlace: 'To',
    toPlacePlaceholder: 'e.g. Da Lat bus station',
    moveTitlePlaceholder: 'e.g. Sleeper bus, flight VN123',
    returnTitle: 'Trip back',
    fromMapLink: 'Google Maps link (from)',
    toMapLink: 'Google Maps link (to)',
    arriveAt: 'arrives {time}',
    arriveAtDay: 'arrives {time}, {day}',
    routeScheduled: '{km} · {time} by schedule',
    teamTitle: 'Plan together',
    teamBody:
      'Invite friends to add stops, costs and packing items. Anyone with the invite link can edit this plan.',
    teamStart: 'Create invite link',
    teamInviteLink: 'Invite link (can edit)',
    teamReset: 'New invite link',
    teamResetHint: 'The old link stops working. People already in stay.',
    teamStop: 'Turn off invite link',
    teamStopHint: 'Nobody new can join. People already in stay.',
    teamPeople: 'People',
    teamOwner: 'Owner',
    teamYou: 'You',
    teamGuest: 'Guest',
    teamRemove: 'Remove',
    teamRemoveConfirm:
      "Remove {name} from this plan? They won't be able to see or edit it anymore.",
    teamLeave: 'Leave plan',
    teamLeaveConfirm:
      "Leave this plan? You won't be able to see or edit it unless you're invited again.",
    teamPeopleError: "Couldn't load the people in this plan.",
    teamMemberHint: 'Only the owner can close out costs, change links or delete the plan.',
    teamBadge: 'Planning together',
    teamJoined: 'Invited',
    viewOnlyTitle: 'View-only link',
    joinTitle: 'Joining the plan…',
    joinNotFound: 'This invite link no longer works. Ask for a new one.',
    joinFailed: "Couldn't join the plan.",
    joinRetry: 'Try again',
    teamSyncHint: "Everyone's changes show up after a few seconds.",
    jumpToDay: 'Pick a day',
    happening: 'Happening now',
    templates: {
      outing: 'Outing',
      trip: 'Trip',
      party: 'Party',
      shopping: 'Shopping',
    },
    templateItems: {
      travel: 'Travel',
      food: 'Food',
      tickets: 'Tickets',
      stay: 'Stay',
      gifts: 'Gifts',
      drinks: 'Drinks',
      decor: 'Decor',
      clothes: 'Clothes',
      household: 'Household',
    },
    costsBefore: 'Before the trip',
    costsAfter: 'After the trip',
    beforeHint: 'Plan each cost and note what you already paid.',
    afterHint: 'Back home? Enter what each cost really was.',
    planned: 'Planned',
    spentReal: 'Spent',
    gap: 'Difference',
    afterEmpty: 'Nothing entered yet. Fill in the real amounts below.',
  },
  exchange: {
    title: 'Money exchange',
    open: 'Exchange',
    from: 'From',
    to: 'To',
    amount: 'Amount',
    swap: 'Swap currencies',
    updated: 'Updated {time}',
    saved: 'Offline — rates from {time}',
    loading: 'Getting rates…',
    error: "Couldn't get rates.",
    retry: 'Try again',
    notes: '{code} banknotes',
    notesHint: 'Tap a note to convert it',
    disclaimer: 'Mid-market rate, for reference. Exchange counters usually give 1–3% less.',
  },
  auth: {
    title: 'Sign in to Penny',
    subtitle: 'Sign in with your username and password.',
    linkError: "That sign-in didn't go through. Please try again.",
    genericError: 'Something went wrong. Please try again in a moment.',
    rateLimited: 'Too many tries for now. Wait a few minutes, then try again.',
    welcome: 'Welcome to Penny',
    heroTitle: 'Money made easy, every month',
    perkPrivate: 'Only you see your data',
    perkDevices: 'Synced on every device',
    heroSubtitle: 'Jot down what you spend in seconds and always know how much is left.',
    formTitle: 'Welcome back',
    formHint: 'Sign in with your Penny username.',
    privacyNote: 'Only you can see your data',
    sampleExpense: 'Lunch',
    sampleIncome: 'Salary',
    or: 'or',
    withGoogle: 'Continue with Google',
    asGuest: 'Continue as guest',
    guestHint:
      'No account needed. Your data saves on this device; create an account in Settings to use it on others.',
    providerError: "Couldn't sign in. Please try again.",
    guestName: 'Guest',
    guestOff: "Guest mode isn't available right now. Please sign in.",
    guestDeviceOnly: 'Data on this device only',
    saveTitle: 'Create an account',
    saveBody:
      'Pick a username and password to keep this data. Then sign in with them on any device.',
    guestSignOutTitle: 'Sign out of guest mode?',
    guestSignOutBody:
      "You haven't created an account, so you won't be able to get back to this guest data.",
    account: 'Account',
    signOut: 'Sign out',
    syncError: "Couldn't save — will retry",
    loadError: "Couldn't load your data. Check your connection and try again.",
    retry: 'Try again',
    importTitle: 'Bring your data along?',
    importBody: 'This device has data saved from before you signed in. Move it into your account?',
    importYes: 'Move it',
    importNo: 'Start fresh',
    perkNoEmail: 'No email needed',
    signUpTitle: 'Create your account',
    signUpHint: 'Just a username and a password. No email needed.',
    signInTab: 'Sign in',
    signUpTab: 'Sign up',
    usernameLabel: 'Username',
    usernamePlaceholder: 'e.g. hana',
    usernameHint: '3–24 characters: lowercase letters, numbers, . _ -',
    invalidUsername: 'Usernames are 3–24 characters: lowercase letters, numbers, . _ -',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
    passwordHint: 'At least {min} characters',
    shortPassword: 'Your password needs at least {min} characters.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signIn: 'Sign in',
    signUp: 'Create account',
    working: 'Just a moment…',
    wrongLogin: "That username or password isn't right.",
    usernameTaken: 'That username is taken. Try another one.',
    setupNeeded: "Can't create accounts right now. Please try again later.",
    saveAccount: 'Create account',
    saveDone: 'Done! Sign in as {name} on any device to see your data.',
  },
  reset: {
    open: 'Delete data',
    title: 'What do you want to delete?',
    scopeThisMonth: 'This month',
    scopeMonths: 'Choose months',
    scopeAll: 'Everything',
    whatToDelete: 'Delete',
    transactions: 'Transactions',
    budgets: 'Budgets',
    pickMonths: 'Which months?',
    noMonths: 'No months with data yet',
    summary: '{transactions} transactions and {budgets} budgets will be deleted.',
    nothing: 'Nothing to delete with these choices.',
    allSummary:
      'Deletes all transactions, budgets, fixed costs, upcoming costs, plans and transit logs. Categories go back to the defaults.',
    fixedNote: 'Active fixed costs will be added again for the current month.',
    typeToConfirm: 'Type {word} to confirm',
    confirmWord: 'DELETE',
    confirm: 'Delete',
    irreversible: "This can't be undone.",
    done: 'Deleted',
  },
  categoryNames: {
    'c-food': 'Food & Drink',
    'c-transport': 'Transport',
    'c-home': 'Housing',
    'c-shop': 'Shopping',
    'c-health': 'Health',
    'c-fun': 'Entertainment',
    'c-edu': 'Education',
    'c-other': 'Other',
    'c-salary': 'Salary',
    'c-other-in': 'Other income',
  },
  languages: {
    en: 'English',
    vi: 'Tiếng Việt',
    ko: '한국어',
  },
};
