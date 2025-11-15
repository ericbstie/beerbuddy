## BeerBuddy – social beer feed

### One-line
Social feed for nights out drinking beer. Share photos + beer count with friends in an infinite reel.

### Core idea
- Capture beer nights as quick posts: photo, title, short text, beers consumed.
- Track how much you drink; share counts with friends (Home) or with everyone (Explore).
- Flow: open app when out, snap photo, log beers, scroll friends' nights.

### Users
- **Normal user**: creates account, posts nights, adds friends.
- **Friends**: see each other's beer count and posts in Home.
- No admin / business roles yet.

### Main pages
- **Home**: infinite scroll feed of you + friends; newest first; like, comment, see beer count.
- **Explore**: global public feed; discover new people; layout like Home.
- **Profile**: your avatar, name, short bio; list of your posts; entry to edit profile.

### Post concept
- Image of the night.
- Title + short description.
- Beers consumed for that post (integer).
- Author, created time.
- Likes and comments thread.

### Product principles
- Fun, light, social beer moments.
- Track beers for awareness, not shaming.
- Mobile-first feel; fast to post, fast to scroll.
- No tech stack notes here; product only.

### Sprint roadmap (each sprint = shippable mini-app)
1. **Sprint 1 – Auth shell**
   - Simple landing + email/password signup and login.
   - After login: blank placeholder screen. Works as standalone auth demo.

2. **Sprint 2 – Personal beer log**
   - User can create basic post: title + beers count + short text.
   - Simple text list of own posts only. No images, no friends. Personal beer log app.

3. **Sprint 3 – Images + own feed**
   - Add photo upload to posts.
   - Replace text list with single-column feed of own posts; still only your content.

4. **Sprint 4 – Friends + Home feed**
   - Add simple friend / follow relation.
   - Home tab shows infinite scroll of you + friends’ posts, newest first, with beer count.

5. **Sprint 5 – Explore feed**
   - Explore tab shows infinite scroll of all public posts globally.
   - High-level content rules only (no explicit / harmful content).

6. **Sprint 6 – Likes + comments**
   - Users can like posts and add comments.
   - Home and Explore show like + comment counts and open comments view.

7. **Sprint 7 – Profile page**
   - Profile tab with avatar, display name, small bio.
   - Shows this user’s posts; basic profile edit screen.

### Scope / non-goals (for now)
- No chat, stories, or video.
- No groups, events, or location check-ins.
- No deep analytics beyond beer counts in posts.

### For future LLMs / Cursor
- Use this README as source of truth for product idea and scope.
- Build features sprint-by-sprint in roadmap order; each sprint should work as its own usable app.
- Keep this file product-only; put technical and stack details in other docs.


