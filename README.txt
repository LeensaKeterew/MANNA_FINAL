MANNA - IMY 220 Final Project
=============================

MANNA is a photo sharing website for recipes and the Bible verses that go with them.
The React frontend talks to an Express API backed by MongoDB Atlas, as required in the spec.

Tech used
  - Frontend: React (Vite), React Router, TailwindCSS v3
  - Backend: Node.js + ExpressJS
  - Database: MongoDB Atlas, using the official "mongodb" package (no Mongoose)
  - Docker + Docker Compose for running everything

Folder structure
  /backend    Express API. db/ has one file per collection, services/ has the logic,
              routes/ has the Express routes, seed.js adds the starting data
  /frontend   React app. All data comes from the API using the native Fetch API
  docker-compose.yml, README.txt and .gitignore are in the root


HOW TO RUN (Docker)
-------------------
The database connection string is in backend/.env (included in my submission ZIP).
The .env is not on GitHub because it has my database password.

Commands I used, run from the project root (the folder with docker-compose.yml):

  docker compose up --build        builds the images and starts both containers
  docker compose down              stops and removes the containers
  docker compose down -v           same as above but also deletes the uploads volume
  docker compose restart backend   restarts the backend (this also re-runs the seed)
  docker compose exec backend node seed.js    runs the seed by hand

Once it says "Connected to MongoDB Atlas" in the terminal, the site is at:

  http://localhost:8080

The frontend runs in nginx on port 8080 and passes /api and /uploads on to the backend
container (port 3000). The Dockerfiles are in /backend and /frontend.

If the connection fails, the Atlas Network Access list needs to allow the computer
running Docker (I set it to 0.0.0.0/0).


DATABASE AND SEED DATA
----------------------
The database is hosted on MongoDB Atlas and is already filled in. The backend also runs
a seed script every time the container starts. It only adds records that are missing, so
it never creates duplicates and it never overwrites changes that were made on the site.

Seeded data: 9 users (1 admin), 24 posts, 13 albums (Naomi Levi has 14 posts and 8 albums, so the
"Load more" button shows on her profile), friendships (one pending request),
comments, likes, hashtags, 6 report reasons, open reports (one post has 3, so it shows the
"reported post" warning), the activity feed items and some messages.

PASSWORDS
---------
The project spec asks for passwords NOT to be hashed so they can be tested, so passwords are
stored and compared as plain text. In a real application they would be hashed (e.g. bcrypt).
Accounts made before this change still held a bcrypt hash; the seed converts the seeded ones
and any other old account is converted to plain text the first time it signs in.


LOGINS (username or email)
--------------------------
  Admin   manna_admin     admin@manna.test      Admin123!
  User    miriam_okafor   miriam@manna.test     Password123!
  User    david_mensah    david@manna.test      Password123!
  User    ruth_adeyemi    ruth@manna.test       Password123!
  User    samuel_obi      samuel@manna.test     Password123!
  Test    test_user       test@test.com         test1234   (1 post, 1 album, 2 friends)
  User    esther_kimani   esther@manna.test     Password123!

miriam_okafor is the best one to test with. She is already friends with david_mensah
and ruth_adeyemi, and she has a pending friend request from esther_kimani on her profile.
Friends are needed for the local feed and for messaging.


WHAT IS IMPLEMENTED
-------------------
  - Sign up, log in and log out
  - View and edit your own profile, view other profiles, delete your account
  - Send, cancel, accept and decline friend requests, and unfriend
  - Create, edit and delete posts (image upload, description, hashtags)
  - Create, edit and delete albums, and add or remove posts in an album
  - View posts and albums, like and comment on posts, report posts
  - Splash page ("/") with the log in and register forms in two tabs, a short explanation of MANNA and a fade-in
  - Local feed (me + my friends) and global feed (everyone)
  - Dark mode: the sun/moon button (top bar, and top corner of the splash page) switches the whole site; the choice is
    remembered, and the first visit follows the device setting
  - A post page lists every album the post is in
  - Album hashtag suggestions: when editing an album, the hashtags used by its posts show as clickable chips, most used first
  - Deleting the only post in an album also deletes that album (an album with other posts just loses the post)
  - Admin page: edit/delete users, posts, albums and comments, and add new report reasons
  - Extras: search, trending hashtags and messaging between friends


API ROUTES
----------
All routes use JSON. Login is stored in an httpOnly cookie.

Auth
  POST   /api/auth/signup
  POST   /api/auth/signin
  POST   /api/auth/logout
  GET    /api/auth/me
Users
  GET    /api/users/me
  PUT    /api/users/me
  DELETE /api/users/me
  GET    /api/users/:id
  GET    /api/users/:id/posts | /albums | /friends
Friends
  GET    /api/friends
  GET    /api/friends/requests
  POST   /api/friends/request/:userId
  POST   /api/friends/accept/:userId
  POST   /api/friends/decline/:userId
  DELETE /api/friends/:userId
Posts
  GET    /api/posts
  POST   /api/posts
  GET    /api/posts/:id
  PUT    /api/posts/:id
  DELETE /api/posts/:id
  POST   /api/posts/:id/like  |  DELETE /api/posts/:id/like
Comments
  GET    /api/posts/:id/comments
  POST   /api/posts/:id/comments
  PUT    /api/comments/:id
  DELETE /api/comments/:id
Albums
  POST   /api/albums
  GET    /api/albums/:id
  PUT    /api/albums/:id
  DELETE /api/albums/:id
  POST   /api/albums/:id/posts
  DELETE /api/albums/:id/posts/:postId
Reports
  GET    /api/report-reasons
  POST   /api/posts/:id/report
  POST   /api/admin/report-reasons
  GET    /api/admin/reports
  POST   /api/admin/reports/:id/resolve
Feed, search and messages
  GET    /api/feed?scope=local|global
  GET    /api/hashtags/trending
  GET    /api/search?q=
  POST   /api/uploads
  GET    /api/messages  |  GET and POST /api/messages/:userId
Admin
  GET    /api/admin/users | /posts | /albums | /comments | /activity
  PUT    /api/admin/users/:id
  DELETE /api/admin/users/:id


NOTES
-----
Styling: I used TailwindCSS with my own colours, fonts, border radius and shadow set up as
theme values in tailwind.config.js. Those colours read CSS variables from index.css, and the
dark theme (data-theme="dark" on <html>) just changes the variables, so every page switches together. Tailwind's default fonts are replaced with Playfair
Display (headings) and Nunito Sans (body), both installed through @fontsource, and inputs
and buttons use the same body font so no default browser fonts show up. Preflight is turned
off so my D1 layout stayed the same. No templates or component libraries were used.

Console errors: browsers log every 4xx/5xx fetch as a red console error, even when the app
handles it (for example a wrong password). To keep the console clean, my frontend sends the
header "X-Soft-Errors: 1", and then the API returns errors as HTTP 200 with
{ ok: false, message, status }. Requests without that header (Postman, curl) get the normal
4xx/5xx status codes.

Other:
  - Passwords are stored as plain text because the project spec asks for it (see PASSWORDS above)
  - Images that fail to load fall back to a local placeholder image
  - Uploaded images are saved in a Docker volume called manna_uploads

GitHub Link: https://github.com/LeensaKeterew/MANNA_D2.git