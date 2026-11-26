// Every call to the API goes through here.
//
// credentials: "include" is the important part: the session lives in an
// httpOnly cookie that page scripts cannot read, so the browser has to be told
// to attach it to cross-origin requests. The server pairs this with
// cors({ credentials: true }) and an explicit origin.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function send(path, { method = "GET", body } = {}) {
    const options = {
        method,
        credentials: "include",
    };

    if (body !== undefined) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    // 204 and error pages may carry no JSON at all.
    let payload = null;
    try {
        payload = await response.json();
    } catch (err) {
        payload = null;
    }

    if (!response.ok) {
        const error = new Error((payload && payload.error) || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    return payload;
}

export const api = {
    me: () => send("/auth/me"),
    register: (userName, password) => send("/auth/register", { method: "POST", body: { userName, password } }),
    login: (userName, password) => send("/auth/login", { method: "POST", body: { userName, password } }),
    logout: () => send("/auth/logout", { method: "POST" }),
    getUserData: () => send("/userData"),
    saveMovieData: (movieData) => send("/update", { method: "POST", body: { movieData } }),
};
