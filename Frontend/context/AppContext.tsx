import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { AppState, AppAction } from '../types/context';
import { View, UserRole } from '../types/models';

// L'état initial se concentre maintenant sur la session et l'UI.
// Les données (produits, commandes...) seront gérées par TanStack Query.
const initialState: AppState = {
    currentUser: null, 
    currentCustomer: null,
    currentSubsidiary: null,
    isSidebarOpen: false,
    isSidebarCollapsed: window.innerWidth < 768,
    showIdleModal: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_SIDEBAR_OPEN':
            return { ...state, isSidebarOpen: action.payload };
        case 'SET_SIDEBAR_COLLAPSED':
            return { ...state, isSidebarCollapsed: action.payload };
        case 'SET_IDLE_MODAL':
            return { ...state, showIdleModal: action.payload };
        case 'LOGIN_SUCCESS': {
            return {
                ...state,
                currentUser: action.payload.user,
                currentSubsidiary: action.payload.subsidiary,
            };
        }
        case 'LOGOUT':
            return { ...initialState };
        case 'CHANGE_ROLE':
            if (state.currentUser) {
                const updatedUser = { ...state.currentUser, role: action.payload };
                let defaultView = View.ANALYTICS;
                const userRole = action.payload;
                if (userRole === UserRole.CAISSIER) defaultView = View.CAISSE;
                else if (userRole === UserRole.COMMERCIAL) defaultView = View.CRM;
                else if (userRole === UserRole.PURCHASING_MANAGER) defaultView = View.PURCHASING;
                else if (userRole === UserRole.SECRETARY) defaultView = View.SECRETARIAT;
                else if (userRole === UserRole.HR_MANAGER) defaultView = View.HR_MANAGEMENT;
                else if (userRole === UserRole.PRODUCTION_DIRECTOR) defaultView = View.PRODUCTION;
                // La redirection sera gérée par le composant qui appelle ce dispatch
                return { ...state, currentUser: updatedUser };
            }
            return state;

        case 'CUSTOMER_LOGIN_SUCCESS':
            return { ...state, currentCustomer: action.payload };

        case 'CUSTOMER_LOGOUT':
            return { ...state, currentCustomer: null };

        // Les actions de manipulation de données (CRUD) seront supprimées
        // et remplacées par des mutations TanStack Query dans les composants concernés.

        default:
            return state;
    }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};