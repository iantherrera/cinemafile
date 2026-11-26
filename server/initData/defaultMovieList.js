const initMovieData = require("./initMovieData.json");

// Fresh objects each call, so a caller cannot mutate the module's copy and
// change what every later reset produces.
function defaultMovieList() {
    return initMovieData.map((movie) => ({ ...movie }));
}

module.exports = { defaultMovieList };
