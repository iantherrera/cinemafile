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
        } finally {
            // Drop the local view of the session even if the request failed;
            // leaving the UI signed in would be worse than signing out twice.
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
