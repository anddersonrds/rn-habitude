import type { SourceLocale } from "@/i18n/types";

/* The source catalog: every other locale is typed against these keys. */
const en = {
  tag: "en",
  label: "English",
  matches: ["en"],
  translations: {
    common: {
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      addHabit: "Add habit",
      newHabit: "New habit",
      noHabitsYet: "No habits yet",
      deleteHabitTitle: 'Delete "{{name}}"?',
      deleteHabitBody: "This permanently deletes the habit and its history.",
    },
    tabs: {
      today: "Today",
      habits: "Habits",
      settings: "Settings",
    },
    settings: {
      notifications: "Notifications",
      notificationsFooter:
        "Reminders are scheduled on this device only. habitude never sends anything to a server.",
      permission: "Permission",
      permissionPending: "…",
      permissionAllowed: "Allowed",
      permissionNotRequested: "Not requested",
      permissionDenied: "Denied",
      allowNotifications: "Allow notifications",
      openIosSettings: "Open iOS Settings",
      sendTestNotification: "Send test notification",
      data: "Data",
      dataFooter:
        "Sample data seeds five habits with twelve weeks of history, so the heat graph and the widget have something to show.",
      loadSampleData: "Load sample data",
      deleteAllData: "Delete all data",
      about: "About",
      viewOnboarding: "View onboarding",
      habits: "Habits",
      checkIns: "Check-ins",
      version: "Version",
      notificationsOffTitle: "Notifications are off",
      notificationsOffBody:
        "Allow notifications in iOS Settings to receive reminders.",
      openSettings: "Open Settings",
      testSentTitle: "Test notification sent",
      testSentBody:
        "It arrives in a few seconds. Leave the app open or lock the screen to see the banner.",
      loadSampleTitle: "Load sample data?",
      loadSampleBody:
        "This adds five example habits with twelve weeks of history. Your own habits are kept.",
      load: "Load",
      deleteAllTitle: "Delete all data?",
      deleteAllBody: "This permanently deletes every habit and its history.",
      deleteEverything: "Delete Everything",
    },
    language: {
      title: "Language",
      systemDefault: "System default",
    },
  },
} satisfies SourceLocale;

export default en;
