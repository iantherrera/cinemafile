# cinemafile

by Ian Herrera

11/17

[Project Notes & Wireframes](https://drive.google.com/file/d/194O0oHOlF9V_1GsRv403Ydp8lIth-PZk/view?usp=sharing)

#### Video Demo:  <https://youtu.be/ykbVYPiow3U>

## Code Louisville Capstone Project

### Project summary & main features:

#### Full-stack React application allowing users to customize a list of the top 100 movies of all time (according to the AFI) that is persistent between sessions.

- Movie cards are rendered in a scrollable, responsive flex grid with a poster graphic and other metadata fetched from external API’s.
- Movie card gallery view is the default, but users can view data and options in a compact list.
- Users can favorite or delete movie entries and add a check to any film that has been viewed.
- Users can reset list to original default.
- User data for customized movie list will be saved to an external database and persist between sessions.
- Front-end application is developed with React and utilizes hooks, props, state, and component-based structures.
- Back-end application utilizes a Node server built with Express.
- Application utilizes MongoDB for data storage and retrieval.

### Client Application:

- MovieCard.js is the primary component for the the front-end React application, rendered by App.js. MovieCard.js contains the render template for movie cards, which takes in props from the MovieCards function. MovieCard.js contains functions providing functionality for toggling Favorites & Viewed films, deleting movie entries from the user's list, making requests to the server for updating the user's database as movie cards are edited by the user, and re-rendering the movie card components according to the updated database. The MovieCard component passes props down to the Header component, which passes props down to ViewStyleButton & ResetButton, providing feature functionality for the navigation bar. ViewStyleButton toggles movie card list between gallery style viewing to list style viewing by changing classes. ResetButton re-initializes user data with initMovieData.json and updates the user database, triggering a re-render of movie card components.

### Server application:

- Server.js initializes the server application and opens up a port that can be utilized for client requests. Server connection is defined by conn.js. Routes provided by userData.js enable user data retrieval and updating user data in the MongoDB database for client requests.

### Future features:

- Plans for future features include user registration and login. Components are currently scoped to accommodate future login and registration components. Database requests currently utilize a single hard-coded userid for accessing records, but the server requests and database schema are set up for accessing multiple user accounts containing user-specific data for each account.

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
