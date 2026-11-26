// Example content carried over from the Next.js build. Listings are
// illustrative until they are served from Supabase.

export type EventItem = { category: string; title: string; place: string; date: string; time: string; online: boolean }
export type Cell = { initials: string; name: string; city: string; schedule: string; members: number; focus: string }
export type Course = { category: string; title: string; teacher: string; lessons: number; summary: string }
export type Prayer = { title: string; text: string; praying: number }

export const EVENTS: EventItem[] = [
  { category: 'Prayer gathering', title: 'Tuesday Fire Prayer', place: 'Online', date: 'Dec 2', time: '8:00 PM WAT', online: true },
  { category: 'Worship night', title: 'The Upper Room', place: 'The Civic Centre · Lagos', date: 'Dec 13', time: '6:00 PM WAT', online: false },
  { category: 'Gospel bootcamp', title: 'Light Up Abuja', place: 'Millennium Park · Abuja', date: 'Jan 10', time: '3:00 PM WAT', online: false },
  { category: 'Tent meeting', title: 'Revival Sound 2027', place: 'Tafawa Balewa Square · Lagos', date: 'Feb 6', time: '4:00 PM WAT', online: false },
  { category: 'Bible study', title: 'The Book of Acts', place: 'Yaba Central Cell · Lagos', date: 'Dec 5', time: '5:00 PM WAT', online: false },
  { category: 'Outreach', title: 'Love Your City', place: 'Ajegunle · Lagos', date: 'Dec 20', time: '9:00 AM WAT', online: false },
  { category: 'Prayer gathering', title: 'Midnight Watch', place: 'Online', date: 'Dec 31', time: '11:00 PM WAT', online: true },
]

export const CELLS: Cell[] = [
  { initials: 'VI', name: 'Victoria Island Cell', city: 'Lagos', schedule: 'Thursdays · 6:30 PM', members: 18, focus: 'Prayer & Scripture' },
  { initials: 'LP', name: 'Lekki Phase 1', city: 'Lagos', schedule: 'Saturdays · 5:00 PM', members: 24, focus: 'Young professionals' },
  { initials: 'YC', name: 'Yaba Central', city: 'Lagos', schedule: 'Fridays · 6:00 PM', members: 31, focus: 'Students & campus' },
  { initials: 'WU', name: 'Wuse II Fellowship', city: 'Abuja', schedule: 'Wednesdays · 7:00 PM', members: 15, focus: 'Families' },
  { initials: 'GR', name: 'GRA Revival Cell', city: 'Port Harcourt', schedule: 'Sundays · 4:00 PM', members: 20, focus: 'Outreach' },
]

export const COURSES: Course[] = [
  { category: 'Spiritual formation', title: 'Built in the Secret Place', teacher: 'Pastor Nath Ade', lessons: 8, summary: 'Daily rhythms of prayer, Scripture and stillness that keep you rooted when life gets loud.' },
  { category: 'Leadership', title: 'Leading with Fire', teacher: 'Sarah Kalu', lessons: 12, summary: 'Servant leadership for cell leaders and ministry teams: vision, care and multiplication.' },
  { category: 'Kingdom business', title: 'Enterprise for Impact', teacher: 'Femi Adebayo', lessons: 10, summary: 'Build work that honours God, serves people and funds Kingdom impact.' },
  { category: 'Evangelism', title: 'The Gospel in Your City', teacher: 'David Ojo', lessons: 7, summary: 'Share your faith naturally with friends, family and neighbours.' },
  { category: 'Bible', title: 'Walking Through Acts', teacher: 'Dr. Ada James', lessons: 14, summary: 'The early church, chapter by chapter, and what it means for revival today.' },
  { category: 'Prayer', title: 'Watchmen on the Wall', teacher: 'Kemi Alabi', lessons: 9, summary: 'Intercession for your family, your church and your nation.' },
]

export const PRAYERS: Prayer[] = [
  { title: 'Courage to share the Gospel', text: 'Pray for people sharing their faith with family and friends this week.', praying: 128 },
  { title: 'Wisdom for outreach teams', text: 'Ask God for provision, unity and wisdom for teams preparing to serve their cities.', praying: 86 },
  { title: 'Healing for the sick', text: 'Lift up members and families walking through illness and recovery.', praying: 214 },
  { title: 'Students in exam season', text: 'Pray for peace, focus and faithfulness for students across our cells.', praying: 64 },
]

export const TODAYS_WORD = {
  slug: 'isaiah-40-31',
  reference: 'Isaiah 40:31',
  title: 'Strength for the waiting',
  summary: 'Find renewed strength when the road ahead feels long.',
  /** Devotional paraphrase; licensed translations load from /api/bible-passage. */
  paraphrase: 'Those who place their hope in the Lord receive fresh strength. They rise beyond exhaustion, keep moving through resistance, and are sustained for the long road.',
}
