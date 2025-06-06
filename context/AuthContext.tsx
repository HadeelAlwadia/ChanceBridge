'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { IUser } from '@/models/User'; 

interface AuthState {
    user: IUser | null;
    token:string|null
}

interface AuthContextType {
    state: AuthState;
    dispatch: React.Dispatch<AuthAction>;
}

type AuthAction = { type: 'LOGIN'; payload: IUser } | { type: 'LOGOUT' };

const initialState: AuthState = { 
    user: typeof window !== "undefined" ? JSON.parse(localStorage.getItem('user') || 'null') : null,
    token: JSON.parse(localStorage.getItem('user') || 'null')
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'LOGIN':
            localStorage.setItem('user', JSON.stringify(action.payload));  
            return {...state, user: action.payload };
            
        case 'LOGOUT':
            localStorage.removeItem('user');  
            localStorage.removeItem('token'); 
            return {...state, user: null };
        default:
            return state;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        async function checkAuth() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    dispatch({ type: 'LOGOUT' });
                    return;
                }

                const res = await fetch('/api/auth/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (res.ok && data.user) {
                    dispatch({ type: 'LOGIN', payload: data.user });
                } else {
                    dispatch({ type: 'LOGOUT' });
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                dispatch({ type: 'LOGOUT' });
            }
        }

        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
