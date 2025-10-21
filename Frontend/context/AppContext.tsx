import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction } from '../types/context';
import { View, UserRole, Subsidiary } from '../types/models';

type RehydrateAction = { type: 'REHYDRATE_STATE'; payload: Partial<AppState> };

// L'état initial se concentre maintenant sur la session et l'UI.
// Les données (produits, commandes...) seront gérées par TanStack Query.
const SUBSIDIARY_STORAGE_KEY = 'caap-currentSubsidiary';

const initialState: AppState = {
    currentUser: null, 
    currentCustomer: null,
    currentSubsidiary: null,
    isSidebarOpen: false,
    isRestored: false, // Ajout pour suivre l'état de réhydratation
    isSidebarCollapsed: window.innerWidth < 768,
    showIdleModal: false,
    currentView: View.ANALYTICS,
};

const appReducer = (state: AppState, action: AppAction | RehydrateAction): AppState => {
    switch (action.type) {
        case 'REHYDRATE_STATE':
            return { ...state, ...action.payload, isRestored: true };
        case 'SET_SIDEBAR_OPEN':
            return { ...state, isSidebarOpen: action.payload };
        case 'SET_SIDEBAR_COLLAPSED':
            return { ...state, isSidebarCollapsed: action.payload };
        case 'SET_IDLE_MODAL':
            return { ...state, showIdleModal: action.payload };
        case 'LOGIN_SUCCESS': {
            // Sauvegarder la filiale dans le localStorage
            localStorage.setItem(SUBSIDIARY_STORAGE_KEY, JSON.stringify(action.payload.subsidiary));
            return {
                ...state,
                currentUser: action.payload.user,
                currentSubsidiary: action.payload.subsidiary,
            };
        }
        case 'LOGOUT':
            // Vider le localStorage à la déconnexion
            localStorage.removeItem(SUBSIDIARY_STORAGE_KEY);
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

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction | RehydrateAction> } | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        // Au premier chargement de l'app, on essaie de restaurer la filiale depuis le localStorage
        const savedSubsidiaryJSON = localStorage.getItem(SUBSIDIARY_STORAGE_KEY);
        if (savedSubsidiaryJSON) {
          try {
            const savedSubsidiary = JSON.parse(savedSubsidiaryJSON) as Subsidiary;
            // On "réhydrate" l'état avec la filiale sauvegardée
            dispatch({ type: 'REHYDRATE_STATE', payload: { currentSubsidiary: savedSubsidiary, isRestored: true } });
          } catch (error) {
            console.error("Failed to parse subsidiary from localStorage", error);
            localStorage.removeItem(SUBSIDIARY_STORAGE_KEY);
            dispatch({ type: 'REHYDRATE_STATE', payload: { isRestored: true } }); // Marquer comme restauré même en cas d'erreur
          }
        } else {
            dispatch({ type: 'REHYDRATE_STATE', payload: { isRestored: true } }); // Marquer comme restauré si rien n'est sauvegardé
        }
      }, []);

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