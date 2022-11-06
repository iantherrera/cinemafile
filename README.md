# cinemafile

by Ian Herrera

10/22

[Project Notes & Wireframes](https://drive.google.com/file/d/194O0oHOlF9V_1GsRv403Ydp8lIth-PZk/view?usp=sharing)

Clone repository to run locally
To start backend server, change from project directory to server directory:
```
cd server
```
```
node index.js
```
After startiing server, return to project directory root to start React frontend application:
```
cd ..
```
```
npm start
```

## Code Louisville Capstone Project
### OVERVIEW:
React application allowing registered users to access and customize their own saved list of the top 25 movies of all time (according to the AFI).
- Users are required to register and log in to access application.
- Movie cards are rendered in a scrollable, responsive grid with a poster graphic and other metadata fetched from external API’s.
- Movie card gallery view is the default, but users can view data and options in a compact list.
- Users can favorite or delete movie entries and add a check to any film that has been viewed.
- User data for login, password, and customized movie list will be saved to an external database and persist between user sessions.

### PROJECT FEATURE REQUIREMENT LIST:

#### SECTION 1 :
☑  Use arrays, objects, sets or maps to store and retrieve information that is displayed in your app.
- Arrays, objects, and maps will be used for customized movie lists and populate the information rendered for each movie entry.

☑  Analyze data that is stored in arrays, objects, sets or maps and display information about it in your app.
- Metadata for each movie will be filtered for desired data and displayed in a gallery or list format.

☑  Use a regular expression to validate user input and either prevent the invalid input or inform the user about it (in all cases prevent invalid input from being stored or saved).
- Registration and login forms will utilize regular expressions for validation before posting and alert users to invalid input.

#### SECTION 2:
☑  Retrieve data from a third-party API and use it to display something within your app.
- Metadata retrieved from a third-party API about each movie entry will be displayed on its gallery card or in its list-view data.

☑  Create a form and store the submitted values using an external API (e.g. a contact form, survey, etc).
- User registration form data will be saved on an external API.

☑  Persist data to an external API and make the stored data accessible in your app (including after reload/refresh).
- User profile data from registration will be persistent on an external API for login confirmation and contain customized user-associated movie list data.

#### SECTION 3: OPTIONAL
☑  Create a node.js web server using a modern framework such as Express.js or Fastify.  Serve at least one route that your app uses (must serve more than just the index.html file).
- Application will utilize a node server built with Express.

☑  Interact with a database to store and retrieve information (e.g. MySQL, MongoDB, etc).
- Application will utilize MongoDB for data storage.

☑  Develop your project using a common JavaScript framework such as React, Angular, or Vue.
- Front-end application will be developed with React.
