import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { AppState, AppAction } from "../types/context";

const SIDEBAR_OPEN_KEY = "caap-isSidebarOpen";
const SIDEBAR_COLLAPSED_KEY = "caap-isSidebarCollapsed";

type RehydrateAction = { type: "REHYDRATE_STATE"; payload: Partial<AppState> };

const initialState: AppState = {
  isSidebarOpen: false,
  isRestored: false, // Ajout pour suivre l'état de réhydratation
  isSidebarCollapsed: window.innerWidth < 768,
  showIdleModal: false,
};

const appReducer = (
  state: AppState,
  action: AppAction | RehydrateAction,
): AppState => {
  switch (action.type) {
    case "REHYDRATE_STATE":
      return { ...state, ...action.payload, isRestored: true };
    case "SET_SIDEBAR_OPEN": {
      localStorage.setItem(SIDEBAR_OPEN_KEY, JSON.stringify(action.payload));
      return { ...state, isSidebarOpen: action.payload };
    }
    case "SET_SIDEBAR_COLLAPSED": {
      localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        JSON.stringify(action.payload),
      );
      return { ...state, isSidebarCollapsed: action.payload };
    }
    case "SET_IDLE_MODAL":
      return { ...state, showIdleModal: action.payload };

    default:
      return state;
  }
};

const AppContext = createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<AppAction | RehydrateAction>;
      /**
       * Ref stable miroitant state.isRestored en temps reel - a lire depuis
       * router.tsx (loader du dashboard) au lieu de state.isRestored: le
       * contexte passe au loader est un instantane fige au moment de
       * l'invocation, voir le meme correctif sur AuthContext.authLive pour
       * le detail du bug que ca evite (page bloquee indefiniment sur un
       * refresh direct sur /dashboard/*).
       */
      isRestoredLive: React.MutableRefObject<boolean>;
    }
  | undefined
>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isRestoredLive = useRef(false);
  isRestoredLive.current = state.isRestored;

  useEffect(() => {
    // Au premier chargement de l'app, on essaie de restaurer l'état de l'UI depuis le localStorage
    const rehydratedState: Partial<AppState> = {};

    const savedSidebarOpen = localStorage.getItem(SIDEBAR_OPEN_KEY);
    if (savedSidebarOpen) {
      rehydratedState.isSidebarOpen = JSON.parse(savedSidebarOpen);
    }

    const savedSidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedSidebarCollapsed) {
      rehydratedState.isSidebarCollapsed = JSON.parse(savedSidebarCollapsed);
    }

    // Marquer la restauration comme terminée et dispatcher l'état réhydraté
    dispatch({
      type: "REHYDRATE_STATE",
      payload: rehydratedState,
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, isRestoredLive }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
