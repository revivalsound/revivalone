// Local-development preview data only. posts.ts loads this file solely when
// import.meta.env.DEV is true and the posts table doesn't exist yet.
import type { Author, Post } from './posts'

const ada: Author = { id: 'sample-ada', full_name: 'Ada Okafor', avatar_url: null, city: 'Lagos', church: 'Harvest House' }
const daniel: Author = { id: 'sample-daniel', full_name: 'Daniel Mensah', avatar_url: null, city: 'Accra', church: 'Upper Room Fellowship' }
const grace: Author = { id: 'sample-grace', full_name: 'Grace Wanjiru', avatar_url: null, city: 'Nairobi', church: 'City Light Church' }

const hours = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString()

function post(id: string, author: Author, fields: Omit<Post, 'id' | 'author_id' | 'author'>): Post {
  return { id, author_id: author.id, author, ...fields }
}

export const SAMPLE_POSTS: Post[] = [
  post('sample-1', ada, {
    kind: 'word', opportunity_type: null, scripture: 'Isaiah 40:31', link_url: '', tags: ['waiting', 'strength'], created_at: hours(1),
    title: 'Waiting is not wasted time',
    body: 'This morning the Lord reminded me that waiting on Him is active. It is leaning in, listening and letting Him renew what life has drained.\n\nIf you are in a season where nothing seems to move, keep showing up. The strength comes in the waiting, not after it.\n\nWho else is in a waiting season? Let us carry each other.',
  }),
  post('sample-2', daniel, {
    kind: 'opportunity', opportunity_type: 'job', scripture: '', link_url: 'https://example.com/apply', tags: ['jobs', 'media'], created_at: hours(3),
    title: 'Hiring: video editor for a gospel media team',
    body: 'Our ministry media team in Accra is hiring a full-time video editor. You will cut sermon clips, testimonies and event recaps.\n\nWe are looking for someone skilled in Premiere or DaVinci who loves the house of God and works well with a team. Remote applicants in West Africa are welcome.\n\nSend your reel through the link.',
  }),
  post('sample-3', grace, {
    kind: 'study', opportunity_type: null, scripture: 'Nehemiah 1–2', link_url: '', tags: ['leadership', 'prayer'], created_at: hours(6),
    title: 'Nehemiah: prayer before the plan',
    body: 'Nehemiah heard about the broken walls and his first response was not a strategy. He wept, fasted and prayed for days.\n\nOnly after that did he stand before the king with a clear request and a plan. Three things stood out to me:\n\n1. Burden comes before building.\n2. Prayer shapes the plan, it does not decorate it.\n3. God gives favour to people who have already been on their knees.\n\nWhat is the broken wall God has put on your heart?',
  }),
  post('sample-4', ada, {
    kind: 'question', opportunity_type: null, scripture: '', link_url: '', tags: ['prayer', 'family'], created_at: hours(20),
    title: 'How do you keep a prayer rhythm with young children?',
    body: 'Since our second baby arrived my quiet times have become very loud. I still want to meet with God every morning.\n\nParents in the community, what has worked for you? Short prayers, praying together as a family, audio Bible on the school run?',
  }),
  post('sample-5', daniel, {
    kind: 'opportunity', opportunity_type: 'investment', scripture: 'Proverbs 21:5', link_url: '', tags: ['business', 'agriculture'], created_at: hours(30),
    title: 'Looking for partners in a faith-led farm cooperative',
    body: 'We are raising support for a poultry and maize cooperative that employs young people from our church community.\n\nWe have land, a business plan and two years of small-scale results. We are looking for two or three partners who share the vision of building wealth that serves people. Message me to see the numbers.',
  }),
  post('sample-6', grace, {
    kind: 'word', opportunity_type: null, scripture: 'Psalm 23', link_url: '', tags: ['peace', 'strength'], created_at: hours(52),
    title: 'He restores',
    body: 'The Shepherd does not only lead, He restores. Some of us need restoring before we need more direction.\n\nTake ten minutes today to simply rest in Him.',
  }),
  post('sample-7', grace, {
    kind: 'opportunity', opportunity_type: 'volunteer', scripture: '', link_url: '', tags: ['outreach', 'youth'], created_at: hours(80),
    title: 'Volunteers needed for a youth outreach in Nairobi',
    body: 'We are running a three-day youth outreach next month and need volunteers for worship, counselling, logistics and media.\n\nNo experience needed, just a willing heart. Training happens the week before.',
  }),
]
