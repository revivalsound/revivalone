// Example content carried over from the Next.js build. Listings are
// illustrative until they are served from Supabase.

export type EventItem = { category: string; title: string; place: string; date: string; time: string; online: boolean }
export type Cell = { initials: string; name: string; city: string; schedule: string; members: number; focus: string }
export type Episode = { title: string; summary: string }
export type Course = { slug: string; category: string; title: string; teacher: string; lessons: number; summary: string; episodes: Episode[] }
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

type CourseSource = Omit<Course, 'lessons'>

const COURSE_SOURCE: CourseSource[] = [
  {
    slug: 'built-in-the-secret-place', category: 'Spiritual formation', title: 'Built in the Secret Place', teacher: 'Pastor Nath Ade',
    summary: 'Daily rhythms of prayer, Scripture and stillness that keep you rooted when life gets loud.',
    episodes: [
      { title: 'The invitation to abide', summary: 'Why intimacy with God comes before activity for God, and what it means to remain in Him.' },
      { title: 'Making room for stillness', summary: 'Simple ways to quiet a busy mind and build a daily place of meeting with God.' },
      { title: 'Praying the Scriptures', summary: 'How to turn what you read into prayer so the Word shapes the way you talk with God.' },
      { title: 'Listening prayer', summary: 'Learning to wait, listen and recognise the gentle leading of the Holy Spirit.' },
      { title: 'When the secret place feels dry', summary: 'Staying faithful in seasons when prayer feels hard and God seems quiet.' },
      { title: 'A rule of life', summary: 'Shaping a sustainable weekly rhythm of rest, prayer, Scripture and community.' },
    ],
  },
  {
    slug: 'leading-with-fire', category: 'Leadership', title: 'Leading with Fire', teacher: 'Sarah Kalu',
    summary: 'Servant leadership for cell leaders and ministry teams: vision, care and multiplication.',
    episodes: [
      { title: 'The heart of a servant leader', summary: 'Leadership in the Kingdom starts with a towel and a basin, not a title.' },
      { title: 'Casting a clear vision', summary: 'Helping people see where God is leading the group and why it matters.' },
      { title: 'Caring for people well', summary: 'Pastoral care for the people you lead, without burning yourself out.' },
      { title: 'Building a team', summary: 'Spotting, inviting and releasing others to serve alongside you.' },
      { title: 'Handling conflict with grace', summary: 'Biblical ways to work through tension and keep unity in the group.' },
      { title: 'Multiplying leaders', summary: 'Raising up the next leader so the group can grow and plant new cells.' },
    ],
  },
  {
    slug: 'enterprise-for-impact', category: 'Kingdom business', title: 'Enterprise for Impact', teacher: 'Femi Adebayo',
    summary: 'Build work that honours God, serves people and funds Kingdom impact.',
    episodes: [
      { title: 'Work as worship', summary: 'Seeing your business or career as part of your calling, not separate from it.' },
      { title: 'Finding the problem worth solving', summary: 'Turning a God-given burden into a clear problem that people will pay to solve.' },
      { title: 'Integrity in the marketplace', summary: 'Staying honest and generous when the pressure is on.' },
      { title: 'Stewarding money wisely', summary: 'Budgets, pricing and cash flow through the lens of faithful stewardship.' },
      { title: 'Hiring and leading a team', summary: 'Building a culture that reflects the Kingdom in how people are treated.' },
      { title: 'Generosity by design', summary: 'Planning for giving and impact from the very start of your enterprise.' },
    ],
  },
  {
    slug: 'the-gospel-in-your-city', category: 'Evangelism', title: 'The Gospel in Your City', teacher: 'David Ojo',
    summary: 'Share your faith naturally with friends, family and neighbours.',
    episodes: [
      { title: 'Good news worth sharing', summary: 'A clear and simple picture of the Gospel you can explain in a few minutes.' },
      { title: 'Your story matters', summary: 'Shaping your testimony so it points people to Jesus.' },
      { title: 'Starting real conversations', summary: 'Moving from small talk to spiritual conversations without pressure.' },
      { title: 'Answering hard questions', summary: 'Responding with honesty and kindness when people push back.' },
      { title: 'Praying for the people around you', summary: 'How prayer opens doors and softens hearts before you say a word.' },
      { title: 'Following up new believers', summary: 'Helping someone take their first steps after they say yes to Jesus.' },
    ],
  },
  {
    slug: 'walking-through-acts', category: 'Bible', title: 'Walking Through Acts', teacher: 'Dr. Ada James',
    summary: 'The early church, chapter by chapter, and what it means for revival today.',
    episodes: [
      { title: 'Waiting for the promise', summary: 'Acts one: the disciples pray together and wait for the Holy Spirit.' },
      { title: 'The day of Pentecost', summary: 'Acts two: the Spirit is poured out and the church is born.' },
      { title: 'Healing at the Beautiful Gate', summary: 'Acts three and four: a miracle, a message and boldness under pressure.' },
      { title: 'A church that shares', summary: 'The generosity and unity of the first believers, and what it costs.' },
      { title: 'Scattered with a message', summary: 'Persecution pushes the Gospel out of Jerusalem and into new places.' },
      { title: 'To the ends of the earth', summary: 'The journeys of Paul and the call to take the message everywhere.' },
    ],
  },
  {
    slug: 'watchmen-on-the-wall', category: 'Prayer', title: 'Watchmen on the Wall', teacher: 'Kemi Alabi',
    summary: 'Intercession for your family, your church and your nation.',
    episodes: [
      { title: 'The call to intercede', summary: 'What it means to stand in the gap for others in prayer.' },
      { title: 'Praying for your family', summary: 'Covering your household with faith-filled, persistent prayer.' },
      { title: 'Praying for your church', summary: 'Lifting up leaders, members and the mission of your local church.' },
      { title: 'Praying for your city', summary: 'Asking God for transformation in the streets and systems around you.' },
      { title: 'Praying for the nations', summary: 'Joining the heart of God for every nation, tribe and language.' },
      { title: 'Staying on the wall', summary: 'Building endurance in prayer when the answer takes time.' },
    ],
  },
]

export const COURSES: Course[] = COURSE_SOURCE.map(course => ({ ...course, lessons: course.episodes.length }))

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
