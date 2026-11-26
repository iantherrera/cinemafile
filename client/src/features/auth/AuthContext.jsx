import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "./api";

const AuthContext = createContext(null);

export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return value;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    // Starts true because on first paint we genuinely do not know whether
    // there is a session yet. Rendering the login page before the check
    // returns would flash it at users who are already signed in.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        api.me()
            .then((data) => { if (!cancelled) setUser(data.user); })
            .catch(() => { if (!cancelled) setUser(null); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    const login = useCallback(async (userName, password) => {
        const data = await api.login(userName, password);
        setUser(data.user);
        return data.user;
    }, []);

    const register = useCallback(async (userName, password) => {
        const data = await api.register(userName, password);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch (err) {
            // Swallowed, not rethrown. The local session is cleared either
            // way, so there is nothing for the caller to do about it -- and
            // rethrowing would strand callers mid-sign-out, leaving the button
            // disabled and the redirect unrun.
            console.warn('Sign-out request failed; clearing the session locally.', err);
        }
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
