const initMovieData = require("./initMovieData.json");

// The default AFI top 100, used to seed a new account and to restore an
// existing one. The server owns this list rather than the client uploading a
// copy of it: there is then one source of truth, and resetting costs a request
// with no body instead of shipping a hundred records back up the wire.
//
// Returns fresh objects each time so a caller cannot mutate the module's copy
// and change what every later reset produces.
function defaultMovieList() {
    return initMovieData.map((movie) => ({ ...movie }));
}

module.exports = { defaultMovieList };
