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
  todayLine: "Meet the difficult while it is easy.\nMeet the big while it is small.",
  roomTitle: "Room for today", roomLine: "How much you can hold, honestly.",
  roomLess: "Room for one fewer", roomMore: "Room for one more",
  kitchenEyebrow: "Everything waiting", kitchenTitle: "Kitchen",
  kitchenLine: "Dishes sit in the sink and harden the longer they wait. Herbs live on the windowsill and grow a ring each time you water them.",
  weekEyebrow: "The last 7 days", weekTitle: "Week",

  // actions
  wash: "Wash it", water: "Water it", watered: "Watered", undo: "Undo", putBack: "Put back",
  addToToday: "Add to today", todayFull: "Today is full", remove: "Remove",
  addFromKitchen: "Add", chooseForMe: "Choose for me",
  openSpace: "Open space",

  // states
  washedSaved: (n) => `Washed · saved ~<span class="num">${n}</span> min`,
  minsNow: (now) => `<span class="nw"><span class="num">${now}</span> min now</span>`,
  willGrow: (later, horizon) => `<span class="nw"><span class="num">${later}</span> min</span> in ${horizon === 7 ? "another week" : `<span class="nw">${horizon} more days</span>`}`,
  atCap: "It won't get any harder than this.",
  whyLabel: "How this estimate works",
  inSink: (days, now) => `<span class="nw">${days} day${days > 1 ? "s" : ""} in the sink</span> · <span class="nw"><span class="num">${now}</span> min now</span>`,
  rings: (n) => `<span class="num">${n}</span> ring${n === 1 ? "" : "s"}`,
  wateredToday: "Watered today", due: "Due", resting: "Resting",
  example: "example",
  rhythm: { 1: "every day", 2: "every other day", 3: "twice a week", 7: "once a week" },
  rhythmPick: { 1: "Every day", 2: "Every other day", 3: "Twice a week", 7: "Once a week" },
  // "Clients" is the stored key (kept so old backups load); people see "Work".
  who: { Family: "Family", Others: "Others", Clients: "Work", Me: "Me" },
  forWho: (w) => `For ${w === "Me" ? "me" : (S.who[w] || w).toLowerCase()}`,

  // today notes
  noteEmptyKitchen: "Your kitchen is empty. Add a dish or a herb in the Kitchen tab.",
  noteNothingPicked: "Pick what you'll hold today. The crustiest dishes and the herbs that are due are good places to start.",
  noteAllDoneFull: "All done. That's today. The kitchen will still be there tomorrow.",
  noteAllDoneRoom: "Everything you picked is done. There's still room if you want one more.",
  noteSome: (d, n) => `${d} of ${n} done.`,

  // kitchen empties
  sinkIntro: "A dish is a one-off task that hardens the longer you leave it undone: an email you need to send, a conversation you need to have, a promised commitment, an important to-do.",
  sillIntro: "A herb is a practice with a rhythm to cherish: drinking water, learning a skill, a light stretch, honest reflection.",
  sinkClear: "The sink is clear.", sinkEmpty: "Nothing in the sink yet.",
  sillAllOnToday: "Every herb is on today's list.", sillEmpty: "Nothing on the windowsill yet.",

  // first install: one example of each, so the kitchen explains itself
  starterDish: "Pay electricity bill", starterHerb: "Daily journal entry",

  // add sheet
  addDish: "Add a dish", addHerb: "Add a herb", close: "Close", kind: "Kind",
  submitDish: "Put it in the sink", submitHerb: "Put it on the windowsill",
  placeholderDish: "Book the dentist", placeholderHerb: "Drink a glass of water",
  hintDish: "A one-off. It gets about 30% harder each day it sits in the sink.",
  hintHerb: "A practice. It grows a ring each time you water it. A pale ring appears only when a whole rhythm passes.",
  fieldName: "What is it", fieldMins: "Minutes if done today", fieldRhythm: "How often", fieldWho: "Who it helps",

  // the "?" explainer, shared by every estimate
  whyTitle: "Small now, or big later",
  whyHTML: `
    <blockquote>Meet the difficult while it is easy.
Meet the big while it is small.</blockquote>
    <p class="eyebrow">Tao Te Ching, chapter 63 · Laozi</p>
    <div class="h">The estimate</div>
    <p class="meta">Every day a dish waits, its effort grows by about 30%. It compounds, so 10 minutes today becomes about 22 in three days and 63 in a week. After 12 days it stops growing.</p>
    <p class="meta">It isn't clock time. It's the weight of carrying something undone: remembering it, avoiding it, the follow-ups, the harder conversation it turns into. The 30% is a rule of thumb, not a measurement.</p>
    <div class="h">The thinking behind it</div>
    <ul>
      <li><b>Everything big starts small.</b> Most hard things begin as an easy moment you could have met.</li>
      <li><b>Waiting lets it grow.</b> Put off, small things gather weight until they feel too big to start.</li>
      <li><b>Quiet, steady action.</b> The sage doesn't wait for a crisis to act heroically. Small things done promptly keep the big ones from arriving.</li>
    </ul>
    <div class="h">In practice</div>
    <ul>
      <li>One plate washed now, not a mountain in the sink later.</li>
      <li>A quick, honest sentence before a misunderstanding sets into silence.</li>
    </ul>
    <p class="meta">When you wash a dish, the app notes the effort it saved: what it would have grown into, minus what it takes today.</p>`,

  // remove sheet
  removeTitle: (name) => `Remove “${name}”?`,
  removeRings: (n) => `Its ${n} ring${n === 1 ? "" : "s"} go with it. This can't be undone.`,
  removePlain: "It leaves the kitchen for good. This can't be undone.",
  keep: "Keep it", removeForGood: "Remove for good",

  // week
  statWashed: "Dishes washed", statSaved: (n) => `~${n} min of future effort saved`,
  statWatered: "Herbs watered", statWateredLine: "rings grown this week",
  statHelped: "Mostly helped",
  whoWeek: "This week", whoAll: "All time", statHelpedLine: (p) => `${p}% of this week's small things`, statHelpedNone: "Nothing done yet this week",

  // settings
  settings: "Settings", settingsTitle: "Settings",
  appearance: "Appearance", themeSystem: "System", themeLight: "Light", themeDark: "Dark",

  // backup
  backupTitle: "Backup",
  backupLine: "Your kitchen lives only on this device. Save a backup file somewhere safe, like Google Drive, or use one to move your kitchen to another device.",
  saveFile: "Save backup file", shareFile: "Send to…", copyBackup: "Copy as text", copied: "Copied",
  restoreTitle: "Restore", restoreLine: "Bring items back from a backup. Matching items are updated, nothing is deleted.",
  restoreFile: "From a file", restorePaste: "Paste text", pasteBackup: "Paste a backup",
  restoreDo: "Restore these items", backupText: "Backup text",
  lastBackup: (days) => days == null ? "No backup yet on this device."
    : days === 0 ? "Last backup: today." : days === 1 ? "Last backup: yesterday." : `Last backup: ${days} days ago.`,
  restoredTitle: "Backup restored",
  restored: (n) => `${n} item${n === 1 ? " is" : "s are"} back in your kitchen. Nothing else was removed.`,
  restoreBadTitle: "Couldn't restore",
  restoreEmptyTitle: "Nothing to restore",
  restoreEmpty: "That backup has no items in it. Nothing was changed.",
  restoreBad: "That doesn't look like a Small Beginnings backup. Nothing was changed.",
  version: (v, d) => `Version ${v} · ${d}`,

  // storage status
  savedDevice: "Saved on this device.",
  savedDeviceSoft: "Saved on this device. The browser may clear it if space runs low, so keep a backup.",
  savedNowhere: "This browser won't let the app save. Changes last until you close it.",
};
