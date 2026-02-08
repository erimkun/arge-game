/**
 * Custom Hook: useSocket
 * Single Responsibility: Socket.IO event yönetimi için hook
 * Oda sistemi ile çalışır
 * Negatif senaryoları UI'a bildirir
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import { AVATARS } from '../utils/avatars';

export function useSocket(props = {}) {
  // Default prop: listenToGlobalEvents = true
  const listenToGlobalEvents = props.listenToGlobalEvents !== false;

  const { state, dispatch } = useAppState();
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastError, setLastError] = useState(null);

  const avatarLookup = useMemo(() => {
    const map = new Map();
    AVATARS.forEach((avatar) => {
      if (avatar.image) map.set(avatar.image, avatar);
      if (avatar.name) map.set(avatar.name.toLowerCase(), avatar);
      if (avatar.id) map.set(avatar.id, avatar);
    });
    return map;
  }, []);

  const enrichProfile = useCallback((profile) => {
    if (!profile) return profile;
    if (profile.model) return profile;

    const keyCandidates = [profile.avatar, profile.name?.toLowerCase(), profile.id];
    const matchedAvatar = keyCandidates.reduce((found, key) => found || (key ? avatarLookup.get(key) : null), null);

    if (!matchedAvatar) return profile;

    return {
      ...profile,
      model: matchedAvatar.model,
    };
  }, [avatarLookup]);

  useEffect(() => {
    // Socket bağlantısını başlat
    const socket = socketService.connect();
    socketRef.current = socket;

    // ----- HANDLERS -----

    // Bağlantı Handler'ları
    const handleConnect = () => {
      console.log('Socket bağlantısı kuruldu:', socket.id);
      setConnectionStatus('connected');
      setLastError(null);
    };

    const handleDisconnect = (reason) => {
      console.log('Socket bağlantısı kesildi:', reason);
      setConnectionStatus('disconnected');
    };

    const handleConnectError = (error) => {
      console.error('Socket bağlantı hatası:', error);
      setConnectionStatus('error');
      setLastError('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    };

    const handleError = (errorMessage) => {
      console.error('Socket hatası:', errorMessage);
      setLastError(errorMessage);
      setTimeout(() => setLastError(null), 5000);
    };

    // Global Game Logic Handler'ları
    const handleProfileAdded = (profile) => {
      const hydrated = enrichProfile(profile);
      dispatch({ type: ACTION_TYPES.ADD_PROFILE, payload: hydrated });
      dispatch({
        type: ACTION_TYPES.UPDATE_VOTE,
        payload: { profileId: hydrated.id, count: 0 }
      });
    };

    const handleProfilesUpdated = (profiles) => {
      const hydratedProfiles = profiles.map(enrichProfile);
      dispatch({ type: ACTION_TYPES.SET_PROFILES, payload: hydratedProfiles });
    };

    const handleVoteUpdate = ({ profileId, count }) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_VOTE,
        payload: { profileId, count }
      });
    };

    const handleVoteConfirmed = (data) => {
      console.log('Oy onaylandı:', data.message);
    };

    const handleRoomStats = (stats) => {
      dispatch({ type: ACTION_TYPES.SET_ROOM_STATS, payload: stats });
    };

    const handleVotingEnded = (results) => {
      dispatch({ type: ACTION_TYPES.SET_RESULTS, payload: results });
    };

    const handleRoomReset = (data) => {
      console.log('Oda sıfırlandı:', data.message);
      dispatch({ type: ACTION_TYPES.RESET });
      if (data.stats) {
        dispatch({ type: ACTION_TYPES.SET_ROOM_STATS, payload: data.stats });
      }
    };

    const handleLeftRoom = () => {
      console.log('Odadan ayrıldı');
      dispatch({ type: ACTION_TYPES.LEAVE_ROOM });
    };

    const handleParticipantLeft = (data) => {
      console.log('Bir katılımcı ayrıldı:', data.message);
    };

    const handleParticipantJoined = (data) => {
      console.log('Yeni katılımcı:', data.message);
    };

    // ----- LISTENERS REGISTRATION -----

    // Her zaman dinle (Connection Status)
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('error', handleError);

    // Global event'ler opsiyonel
    if (listenToGlobalEvents) {
      socket.on('profileAdded', handleProfileAdded);
      socket.on('profilesUpdated', handleProfilesUpdated);
      socket.on('voteUpdate', handleVoteUpdate);
      socket.on('voteConfirmed', handleVoteConfirmed);
      socket.on('roomStats', handleRoomStats);
      socket.on('votingEnded', handleVotingEnded);
      socket.on('roomReset', handleRoomReset);
      socket.on('leftRoom', handleLeftRoom);
      socket.on('participantLeft', handleParticipantLeft);
      socket.on('participantJoined', handleParticipantJoined);
    }

    // ----- CLEANUP -----
    return () => {
      // Spesifik handler'ları kaldır (Diğer listener'ları etkilemez)
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('error', handleError);

      if (listenToGlobalEvents) {
        socket.off('profileAdded', handleProfileAdded);
        socket.off('profilesUpdated', handleProfilesUpdated);
        socket.off('voteUpdate', handleVoteUpdate);
        socket.off('voteConfirmed', handleVoteConfirmed);
        socket.off('roomStats', handleRoomStats);
        socket.off('votingEnded', handleVotingEnded);
        socket.off('roomReset', handleRoomReset);
        socket.off('leftRoom', handleLeftRoom);
        socket.off('participantLeft', handleParticipantLeft);
        socket.off('participantJoined', handleParticipantJoined);
      }
    };
  }, [dispatch, enrichProfile, listenToGlobalEvents]);

  return {
    socket: socketRef.current,
    connectionStatus,
    lastError,
    clearError: () => setLastError(null)
  };
}
