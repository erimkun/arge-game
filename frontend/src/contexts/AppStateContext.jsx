/**
 * App State Context
 * Single Responsibility: Global uygulama durumu yönetimi
 * Oda sistemi desteği ile
 */

import { createContext, useContext, useReducer } from 'react';

// App State Types
export const APP_STATES = {
  LOBBY: 'LOBBY',      // Oda seçimi/oluşturma
  JOIN: 'JOIN',        // Profil oluşturma
  VOTING: 'VOTING',    // Oylama
  RESULTS: 'RESULTS'   // Sonuçlar
};

// Initial State
const initialState = {
  currentState: APP_STATES.LOBBY,  // Başlangıç: Lobby
  currentRoom: null,               // { code: 'ABC123' }
  myProfile: null,
  profiles: [],
  votes: {},
  results: null
};

// Action Types
export const ACTION_TYPES = {
  SET_STATE: 'SET_STATE',
  SET_ROOM: 'SET_ROOM',
  SET_MY_PROFILE: 'SET_MY_PROFILE',
  SET_PROFILES: 'SET_PROFILES',
  ADD_PROFILE: 'ADD_PROFILE',
  UPDATE_VOTE: 'UPDATE_VOTE',
  SET_RESULTS: 'SET_RESULTS',
  RESET: 'RESET',
  LEAVE_ROOM: 'LEAVE_ROOM'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_STATE:
      return { ...state, currentState: action.payload };

    case ACTION_TYPES.SET_ROOM:
      return {
        ...state,
        currentRoom: action.payload,
        currentState: APP_STATES.JOIN  // Odaya katılınca JOIN'e geç
      };

    case ACTION_TYPES.SET_MY_PROFILE:
      return { ...state, myProfile: action.payload };

    case ACTION_TYPES.SET_PROFILES:
      return { ...state, profiles: action.payload };

    case ACTION_TYPES.ADD_PROFILE:
      return {
        ...state,
        profiles: [...state.profiles, action.payload]
      };

    case ACTION_TYPES.UPDATE_VOTE:
      return {
        ...state,
        votes: {
          ...state.votes,
          [action.payload.profileId]: action.payload.count
        }
      };

    case ACTION_TYPES.SET_RESULTS:
      return {
        ...state,
        currentState: APP_STATES.RESULTS,
        results: action.payload
      };

    case ACTION_TYPES.LEAVE_ROOM:
      return {
        ...initialState,
        currentState: APP_STATES.LOBBY
      };

    case ACTION_TYPES.RESET:
      return {
        ...state,
        myProfile: null,
        profiles: [],
        votes: {},
        results: null,
        currentState: APP_STATES.JOIN
      };

    default:
      return state;
  }
}

// Context
const AppStateContext = createContext(null);

// Provider Component
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom Hook
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
