export type Language = 'en' | 'zh';

export interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Define the translation structure for type safety
export interface Translations {
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    yes: string;
    no: string;
    logout: string;
    close: string;
    download: string;
    copy: string;
    search: string;
    filter: string;
    clearFilters: string;
    none: string;
    all: string;
    actions: string;
    back: string;
    preview: string;
    submit: string;
    reset: string;
    confirm: string;
    showing: string;
    filtered: string;
    noTags: string;
  };
  nav: {
    knowledgeBase: string;
    prompts: string;
    settings: string;
    documents: string;
  };
  auth: {
    signIn: string;
    signingIn: string;
    signInToContinue: string;
    username: string;
    password: string;
    enterUsername: string;
    enterPassword: string;
    dontHaveAccount: string;
    registerWithCode: string;
    loginFailed: string;
    networkError: string;
    accountDisabled: string;
    invalidCredentials: string;
  };
  documents: {
    title: string;
    newDocument: string;
    createDocument: string;
    noDocuments: string;
    noDocumentsMatch: string;
    getStarted: string;
    tryAdjustFilters: string;
    tableHeaders: {
      title: string;
      status: string;
      annotations: string;
      tags: string;
      uploadedBy: string;
      updated: string;
      sharing: string;
      edit: string;
      actions: string;
    };
    status: {
      raw: string;
      annotated: string;
      refined: string;
    };
    annotations: {
      macro: string;
      meso: string;
      micro: string;
    };
    loadingDocuments: string;
    totalDocuments: string;
    annotatedCount: string;
    totalAnnotations: string;
    deleteDocument: string;
    downloadAsMd: string;
    shared: string;
    private: string;
    clickToShare: string;
    clickToMakePrivate: string;
    membersCanEdit: string;
    readOnlyForMembers: string;
  };
  knowledge: {
    title: string;
    searchPlaceholder: string;
    noEntries: string;
    noEntriesMatch: string;
    createFirst: string;
    tryAdjustFilters: string;
    tableHeaders: {
      title: string;
      source: string;
      tags: string;
      created: string;
      actions: string;
    };
    statistics: {
      totalEntries: string;
      totalTags: string;
      recentlyAdded: string;
    };
    deleteEntry: string;
    downloadEntry: string;
  };
  prompts: {
    title: string;
    newPrompt: string;
    noPrompts: string;
    noPromptsMatch: string;
    createFirst: string;
    tableHeaders: {
      title: string;
      description: string;
      version: string;
      tags: string;
      created: string;
      actions: string;
    };
    deletePrompt: string;
    downloadPrompt: string;
  };
  settings: {
    title: string;
    tabs: {
      tags: string;
      trash: string;
      users: string;
      invitations: string;
    };
    tags: {
      title: string;
      createTag: string;
      tagName: string;
      tagColor: string;
      noTags: string;
      systemTag: string;
      yourTag: string;
      sharedTag: string;
      deleteTag: string;
    };
    trash: {
      title: string;
      emptyTrash: string;
      restore: string;
      permanentDelete: string;
      noTrash: string;
      trashEmpty: string;
    };
    users: {
      title: string;
      createUser: string;
      resetPassword: string;
      disableUser: string;
      enableUser: string;
      deleteUser: string;
      noUsers: string;
      tableHeaders: {
        username: string;
        displayName: string;
        role: string;
        organization: string;
        status: string;
        created: string;
        actions: string;
      };
      roles: {
        superAdmin: string;
        orgOwner: string;
        member: string;
      };
      status: {
        active: string;
        disabled: string;
      };
    };
    invitations: {
      title: string;
      createCode: string;
      noInvitations: string;
      tableHeaders: {
        code: string;
        usage: string;
        type: string;
        created: string;
        actions: string;
      };
      types: {
        owner: string;
        member: string;
      };
      deleteCode: string;
      copyCode: string;
    };
  };
  modals: {
    deleteConfirm: {
      title: string;
      permanentWarning: string;
      trashWarning: string;
      canRestore: string;
      deleting: string;
      deletePermanently: string;
    };
    tempPassword: {
      title: string;
      message: string;
      copyPassword: string;
    };
  };
  filters: {
    status: {
      all: string;
      raw: string;
      annotated: string;
      refined: string;
    };
    createdBy: string;
    selectUser: string;
    selectTags: string;
    clearAll: string;
  };
  errors: {
    networkError: string;
    loadFailed: string;
    saveFailed: string;
    deleteFailed: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
  };
}

export const STORAGE_KEY = 'expert-note-language';
export const DEFAULT_LANGUAGE: Language = 'en';
