import type { SpendPlanItemKey, SpendPlanTemplateKey } from '@/lib/helper/spendPlans';
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
    currencyUnit: string;
    confirm: string;
    cancel: string;
    delete: string;
    edit: string;
  };
  nav: {
    overview: string;
    activity: string;
    budget: string;
    reports: string;
    transport: string;
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
    remainingBudget: string;
    budgetSpent: string;
    income: string;
    expense: string;
    byCategory: string;
    recent: string;
    noTransactions: string;
    addExpense: string;
    fixedThisMonth: string;
    manageFixed: string;
    upcomingNotes: string;
    managePlans: string;
    addIncome: string;
    nearLimit: string;
    overBudget: string;
    noBudget: string;
    setBudget: string;
  };
  transactions: {
    allCategories: string;
    incomeAndExpense: string;
    expense: string;
    income: string;
    filterTotal: string;
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
  };
  budgets: {
    totalLimit: string;
    spentLeft: string;
    copyPrevious: string;
    spent: string;
    limit: string;
    save: string;
    saved: string;
    copyConfirm: string;
    copyConfirmButton: string;
    copied: string;
    undo: string;
    noPrevious: string;
  };
  reports: {
    tabYear: string;
    tabMonth: string;
    breakdown: string;
    spent: string;
    daily: string;
    day: string;
    topCategories: string;
    empty: string;
  };
  year: {
    title: string;
    previous: string;
    next: string;
    yearTotals: string;
    balance: string;
    activeMonths: string;
    avgExpense: string;
    monthlySpend: string;
    highestSpend: string;
    bestBalance: string;
    monthList: string;
    vsPrevious: string;
    expenseDelta: string;
    balanceDelta: string;
    noChange: string;
    empty: string;
    upToNow: string;
    upcomingNotes: string;
    notesCount: string;
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
    language: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    glass: string;
    glassOn: string;
    glassOff: string;
    modules: string;
    modulesHint: string;
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
  transport: {
    title: string;
    subtitle: string;
    monthTotal: string;
    open: string;
    addMeter: string;
    editMeter: string;
    name: string;
    namePlaceholder: string;
    icon: string;
    empty: string;
    back: string;
    viewMode: string;
    viewCalendar: string;
    viewStrip: string;
    today: string;
    logToday: string;
    dayAmount: string;
    clear: string;
    save: string;
    cancel: string;
    noSpend: string;
    daysLogged: string;
    archive: string;
    archiveConfirm: string;
    legsHint: string;
    leg: string;
    addLeg: string;
    removeLeg: string;
    from: string;
    to: string;
    dayTotal: string;
    noLegs: string;
    unnamedLeg: string;
    chooseIcon: string;
  };
  spendPlans: {
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
    extrasHint: string;
    addExtra: string;
    extraPlaceholder: string;
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
    templates: Record<SpendPlanTemplateKey, string>;
    templateItems: Record<SpendPlanItemKey, string>;
  };
  auth: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    send: string;
    sending: string;
    sentTitle: string;
    sentBody: string;
    resend: string;
    useAnother: string;
    linkError: string;
    genericError: string;
    invalidEmail: string;
    welcome: string;
    heroTitle: string;
    perkNoPassword: string;
    perkPrivate: string;
    perkDevices: string;
    heroSubtitle: string;
    formTitle: string;
    formHint: string;
    privacyNote: string;
    sampleExpense: string;
    sampleIncome: string;
    account: string;
    signOut: string;
    syncError: string;
    loadError: string;
    retry: string;
    importTitle: string;
    importBody: string;
    importYes: string;
    importNo: string;
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
    currencyUnit: 'đ',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
  },
  nav: {
    overview: 'Overview',
    activity: 'Activity',
    budget: 'Budget',
    reports: 'Reports',
    transport: 'Transit',
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
    remainingBudget: 'Left to spend',
    budgetSpent: 'Spent {spent} of {budget}',
    income: 'Income',
    expense: 'Expense',
    byCategory: 'By category',
    recent: 'Recent',
    noTransactions: 'No transactions yet',
    addExpense: 'Add expense',
    fixedThisMonth: 'Fixed this month',
    manageFixed: 'Manage ›',
    upcomingNotes: 'Coming up',
    managePlans: 'All plans ›',
    addIncome: 'Add income',
    nearLimit: 'Close to your limit — slow down a little',
    overBudget: 'Over budget by {amount}',
    noBudget: 'No budget yet',
    setBudget: 'Set one up ›',
  },
  transactions: {
    allCategories: 'All categories',
    incomeAndExpense: 'Income & Expense',
    expense: 'Expense',
    income: 'Income',
    filterTotal: 'Total:',
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
  },
  budgets: {
    totalLimit: 'Total limit',
    spentLeft: 'Spent {spent} · left {left}',
    copyPrevious: 'Copy from previous month',
    spent: 'Spent {amount}',
    limit: 'Limit',
    save: 'Save budget',
    saved: 'Saved ✓',
    copyConfirm: "Copy last month's budget into this month? Current limits will be replaced.",
    copyConfirmButton: 'Copy',
    copied: "Copied last month's budget",
    undo: 'Undo',
    noPrevious: 'Last month has no budget to copy',
  },
  reports: {
    tabYear: 'Year',
    tabMonth: 'This month',
    breakdown: 'Where did it go?',
    spent: 'Spent',
    daily: 'Daily spend',
    day: 'Day {day}: {amount}',
    topCategories: 'Top categories',
    empty: 'No expenses to report yet',
  },
  year: {
    title: 'Year review',
    previous: 'Previous year',
    next: 'Next year',
    yearTotals: 'Year totals',
    balance: 'Balance',
    activeMonths: 'Months tracked: {count}',
    avgExpense: 'About {amount}/month',
    monthlySpend: 'Monthly spend',
    highestSpend: 'Biggest spending month',
    bestBalance: 'Best saving month',
    monthList: 'Months',
    vsPrevious: 'vs previous month',
    expenseDelta: 'Spend',
    balanceDelta: 'Balance',
    noChange: '0',
    empty: 'No activity in this year yet',
    upToNow: 'Up to {month}',
    upcomingNotes: 'Coming up',
    notesCount: '{count} planned',
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
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    glass: 'Liquid Glass',
    glassOn: 'Turn off Liquid Glass',
    glassOff: 'Turn on Liquid Glass',
    modules: 'Sections',
    modulesHint: "Turn off what you don't use. Overview and Transactions stay on.",
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
  transport: {
    title: 'Transit',
    subtitle: 'Log Grab, fuel, bus… day by day',
    monthTotal: 'Spent this month',
    open: 'Log spend ›',
    addMeter: 'Add transit type',
    editMeter: 'Edit type',
    name: 'Name',
    namePlaceholder: 'e.g. Bus, Train, Bike',
    icon: 'Icon',
    empty: 'No types yet. Add Grab, fuel, bus…',
    back: '‹ Back to Transit',
    viewMode: 'How to view',
    viewCalendar: 'Calendar view',
    viewStrip: 'List view',
    today: 'Today',
    logToday: 'Log today’s spend',
    dayAmount: 'Amount for {date}',
    clear: 'Delete this day’s spend',
    save: 'Save spend',
    cancel: 'Cancel',
    noSpend: 'No spend yet',
    daysLogged: 'Days logged: {count}',
    archive: 'Remove {name}',
    archiveConfirm: 'Remove {name} from Transit? Past logs stay in Activity.',
    legsHint: 'e.g. Home → Office',
    leg: 'Leg',
    addLeg: 'Add another leg',
    removeLeg: 'Remove this leg',
    from: 'From',
    to: 'To',
    dayTotal: 'Day total',
    noLegs: 'No legs logged',
    unnamedLeg: 'Trip',
    chooseIcon: 'Choose an icon',
  },
  spendPlans: {
    title: 'Plans',
    subtitle: 'Plan a trip or event, then compare',
    create: 'New plan',
    edit: 'Edit plan',
    empty: 'No plans yet. Make one for your next trip or party.',
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
    extrasHint: "Things you didn't plan for",
    addExtra: 'Add extra',
    extraPlaceholder: 'e.g. Parking',
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
  },
  auth: {
    title: 'Sign in to Penny',
    subtitle: "We'll email you a sign-in link — no password needed.",
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    send: 'Send me a link',
    sending: 'Sending…',
    sentTitle: 'Check your email',
    sentBody: 'We sent a sign-in link to {email}. Open it on this device to continue.',
    resend: 'Send again',
    useAnother: 'Use a different email',
    linkError: 'That link has expired or was already used. Please request a new one.',
    genericError: "Couldn't send the email. Please try again in a moment.",
    invalidEmail: 'Please enter a valid email.',
    welcome: 'Welcome to Penny',
    heroTitle: 'Money made easy, every month',
    perkNoPassword: 'No password',
    perkPrivate: 'Only you see your data',
    perkDevices: 'Synced on every device',
    heroSubtitle: 'Jot down what you spend in seconds and always know how much is left.',
    formTitle: 'Start with your email',
    formHint: "We'll send you a link to sign in. No password to remember.",
    privacyNote: 'Only you can see your data',
    sampleExpense: 'Lunch',
    sampleIncome: 'Salary',
    account: 'Account',
    signOut: 'Sign out',
    syncError: "Couldn't save — will retry",
    loadError: "Couldn't load your data. Check your connection and try again.",
    retry: 'Try again',
    importTitle: 'Bring your data along?',
    importBody: 'This device has data saved from before you signed in. Move it into your account?',
    importYes: 'Move it',
    importNo: 'Start fresh',
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
