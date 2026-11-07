/* strings.js — every word the app shows, in one place.
 * Renaming "herb" (or anything else) should only ever mean editing this file.
 * Static text in index.html is filled from here via data-s="key".
 * Voice: short, plain, warm. No exclamation marks, emoji or streak language.
 */

export const S = {
  // nouns
  dish: "dish", Dish: "Dish", dishes: "dishes", Dishes: "Dishes",
  herb: "herb", Herb: "Herb", herbs: "herbs", Herbs: "Herbs",
  sink: "The sink", sill: "The windowsill",

  // views
  navToday: "Today", navKitchen: "Kitchen", navWeek: "Week",
  todayTitle: "Today",
  todayLine: "Meet the difficult while it is easy. Meet the big while it is small.",
  roomTitle: "Room for today", roomLine: "How much you can hold, honestly.",
  roomLess: "Room for one fewer", roomMore: "Room for one more",
  kitchenEyebrow: "Everything waiting", kitchenTitle: "Kitchen",
  kitchenLine: "Dishes sit in the sink and harden the longer they wait. Herbs live on the windowsill and grow a ring each time you water them.",
  weekEyebrow: "The last 7 days", weekTitle: "Week",

  // actions
  wash: "Wash it", water: "Water it", watered: "Watered", undo: "Undo", putBack: "Put back",
  addToToday: "Add to today", todayFull: "Today is full", remove: "Remove",
  chooseFromKitchen: "Choose from kitchen", chooseForMe: "Choose for me",
  openSpace: "Open space", examples: "Show me with examples",

  // states
  washedSaved: (n) => `Washed · saved ~<span class="num">${n}</span> min`,
  minsNow: (now, wk) => `<span class="num">${now}</span> min now · <span class="num">${wk}</span> in a week`,
  inSink: (days, now) => `${days} day${days > 1 ? "s" : ""} in the sink · <span class="num">${now}</span> min now`,
  rings: (n) => `<span class="num">${n}</span> ring${n === 1 ? "" : "s"}`,
  wateredToday: "Watered today", due: "Due", resting: "Resting",
  example: "example",
  rhythm: { 1: "every day", 2: "every other day", 3: "twice a week", 7: "once a week" },
  rhythmPick: { 1: "Every day", 2: "Every other day", 3: "Twice a week", 7: "Once a week" },
  who: { Family: "Family", Others: "Others", Clients: "Clients", Me: "Me" },
  forWho: (w) => `For ${w === "Me" ? "me" : w.toLowerCase()}`,

  // today notes
  noteEmptyKitchen: "Your kitchen is empty. Add a dish or a herb in the Kitchen tab, or load a few examples there.",
  noteNothingPicked: "Pick what you'll hold today. The crustiest dishes and the herbs that are due are good places to start.",
  noteAllDoneFull: "All done. That's today. The kitchen will still be there tomorrow.",
  noteAllDoneRoom: "Everything you picked is done. There's still room if you want one more.",
  noteSome: (d, n) => `${d} of ${n} done.`,

  // kitchen empties
  sinkClear: "The sink is clear.",
  sinkIntro: "A dish is a one-off that hardens if left: the email you keep circling, the invoice to chase, the photos to sort.",
  sillAllOnToday: "Every herb is on today's list.",
  sillIntro: "A herb is a practice with a rhythm: standing practice, a few lines to each child, one honest note about the studio.",

  // add sheet
  addDish: "Add a dish", addHerb: "Add a herb", close: "Close", kind: "Kind",
  submitDish: "Put it in the sink", submitHerb: "Put it on the windowsill",
  placeholderDish: "Reply to Alex about the template", placeholderHerb: "Standing practice",
  hintDish: "A one-off. It gets about 30% harder each day it sits in the sink.",
  hintHerb: "A practice. It grows a ring each time you water it. A pale ring appears only when a whole rhythm passes.",
  fieldName: "What is it", fieldMins: "Minutes if done today", fieldRhythm: "How often", fieldWho: "Who it helps",

  // remove sheet
  removeTitle: (name) => `Remove “${name}”?`,
  removeRings: (n) => `Its ${n} ring${n === 1 ? "" : "s"} go with it. This can't be undone.`,
  removePlain: "It leaves the kitchen for good. This can't be undone.",
  keep: "Keep it", removeForGood: "Remove for good",

  // week
  statWashed: "Dishes washed", statSaved: (n) => `~${n} min of future effort saved`,
  statWatered: "Herbs watered", statWateredLine: "rings grown this week",
  statHelped: "Mostly helped", statHelpedLine: (p) => `${p}% of this week's small things`, statHelpedNone: "Nothing done yet this week",

  // backup
  backupTitle: "Backup",
  backupLine: "Copy everything as text to keep somewhere safe, or paste a backup to restore it. This is also how you move your kitchen to another device.",
  copyBackup: "Copy backup", copied: "Copied", restore: "Restore", pasteBackup: "Paste a backup",
  restoreDo: "Restore these items", backupText: "Backup text",
  restored: (n) => `Restored ${n} item${n === 1 ? "" : "s"}.`,
  restoreBad: "That doesn't look like a backup. Paste the full text you copied.",

  // storage status
  savedDevice: "Saved on this device.",
  savedDeviceSoft: "Saved on this device. The browser may clear it if space runs low, so keep a backup.",
  savedNowhere: "This browser won't let the app save. Changes last until you close it.",
};
