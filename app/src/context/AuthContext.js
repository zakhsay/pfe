// src/context/AuthContext.js

import { createContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);

    const login = (token) => {
        setAuth(token);
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setAuth(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
