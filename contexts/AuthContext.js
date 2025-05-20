import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
const [user, setUser] = useState(null);

const signIn = (u) => setUser(u);
const signOut = () => setUser(null);

return (
<AuthContext.Provider value={{ user, signIn, signOut }}>
{children}
</AuthContext.Provider>
);
}