# cinemafile

by Ian Herrera

11/17

[Project Notes & Wireframes](https://drive.google.com/file/d/194O0oHOlF9V_1GsRv403Ydp8lIth-PZk/view?usp=sharing)

Clone repository to run locally.

From /cinefile root directory, move to /server directory to start server:
```
cd server
```
```
node server
```
After startiing server, move to client directory to start React client application:
```
cd ../client
```
```
npm start
```
Application can be launched in browser on http://localhost:3000/

## Code Louisville Capstone Project
### OVERVIEW:
React application allowing registered users to access and customize their own saved list of the top 25 movies of all time (according to the AFI).

- Movie cards are rendered in a scrollable, responsive flex grid with a poster graphic and other metadata fetched from external API’s.
- Movie card gallery view is the default, but users can view data and options in a compact list.
- Users can favorite or delete movie entries and add a check to any film that has been viewed.
- Users can reset list to original default.
- User data for customized movie list will be saved to an external database and persist between sessions.

### Future Features:
- Requirement to register and log in to access application with unique stored data for each unique user. Application currently utilizes a single user's data with a hard-coded user_id in database. Database schema, application scoping, and database retrieval methods, however, are built to allow future implementation of multiple users and sets of data.

### PROJECT FEATURE REQUIREMENT LIST:

#### SECTION 1 :
☑  Use arrays, objects, sets or maps to store and retrieve information that is displayed in your app.
- Arrays, objects, and maps are used to manage data, store in database, and populate movie list information rendered for each movie entry.

☑  Analyze data that is stored in arrays, objects, sets or maps and display information about it in your app.
- Movie metadata stored in arrays, objects, and maps are filtered for desired data and mapping is used to iterate through arrays to display rendered components.

#### SECTION 2:
☑  Retrieve data from a third-party API and use it to display something within your app.
- Movie list data is updated and stored after user makes any changes to list properties. Components are dynamically rendered as database continues to change with user edits.

☑  Persist data to an external API and make the stored data accessible in your app (including after reload/refresh).
- Customized movie list data is persistent on MongoDB and updated user data in database is utilized for every new session and render.

#### SECTION 3: OPTIONAL
☑  Create a node.js web server using a modern framework such as Express.js or Fastify.  Serve at least one route that your app uses (must serve more than just the index.html file).
- Application utilizes a node server built with Express. Routes utilized retrieve data and update database.

☑  Interact with a database to store and retrieve information (e.g. MySQL, MongoDB, etc).
- Application utilizes MongoDB for data storage and retrieval.

☑  Develop your project using a common JavaScript framework such as React, Angular, or Vue.
- Front-end application is developed with React and utilizes hooks, props, state, and component-based structures.
