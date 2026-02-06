/**
 * Custom Hook: useSocket
 * Single Responsibility: Socket.IO event yönetimi için hook
 * Oda sistemi ile çalışır
 * Negatif senaryoları UI'a bildirir
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import { AVATARS } from '../utils/avatars';

export function useSocket() {
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

  const enrichProfile = (profile) => {
    if (!profile) return profile;
    if (profile.model) return profile;

    const keyCandidates = [profile.avatar, profile.name?.toLowerCase(), profile.id];
    const matchedAvatar = keyCandidates.reduce((found, key) => found || (key ? avatarLookup.get(key) : null), null);

    if (!matchedAvatar) return profile;

    return {
      ...profile,
      model: matchedAvatar.model,
    };
  };

  useEffect(() => {
    // Socket bağlantısını başlat
    const socket = socketService.connect();
    socketRef.current = socket;

    // Bağlantı event'leri
    socket.on('connect', () => {
      console.log('Socket bağlantısı kuruldu:', socket.id);
      setConnectionStatus('connected');
      setLastError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket bağlantısı kesildi:', reason);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket bağlantı hatası:', error);
      setConnectionStatus('error');
      setLastError('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    });

    // Profil event'leri
    socket.on('profileAdded', (profile) => {
      const hydrated = enrichProfile(profile);
      dispatch({ type: ACTION_TYPES.ADD_PROFILE, payload: hydrated });
      dispatch({
        type: ACTION_TYPES.UPDATE_VOTE,
        payload: { profileId: hydrated.id, count: 0 }
      });
    });

    // Profiller güncellendi (birisi ayrıldığında)
    socket.on('profilesUpdated', (profiles) => {
      const hydratedProfiles = profiles.map(enrichProfile);
      dispatch({ type: ACTION_TYPES.SET_PROFILES, payload: hydratedProfiles });
    });

    // Oy event'leri
    socket.on('voteUpdate', ({ profileId, count }) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_VOTE,
        payload: { profileId, count }
      });
    });

    // Oy onayı
    socket.on('voteConfirmed', (data) => {
      console.log('Oy onaylandı:', data.message);
    });

    // Oda istatistikleri
    socket.on('roomStats', (stats) => {
      dispatch({ type: ACTION_TYPES.SET_ROOM_STATS, payload: stats });
    });

    // Sonuç event'i
    socket.on('votingEnded', (results) => {
      dispatch({ type: ACTION_TYPES.SET_RESULTS, payload: results });
    });

    // Oda sıfırlama event'i
    socket.on('roomReset', (data) => {
      console.log('Oda sıfırlandı:', data.message);
      dispatch({ type: ACTION_TYPES.RESET });
      if (data.stats) {
        dispatch({ type: ACTION_TYPES.SET_ROOM_STATS, payload: data.stats });
      }
    });

    // Odadan ayrılma event'i
    socket.on('leftRoom', () => {
      console.log('Odadan ayrıldı');
      dispatch({ type: ACTION_TYPES.LEAVE_ROOM });
    });

    // Katılımcı ayrıldı event'i
    socket.on('participantLeft', (data) => {
      console.log('Bir katılımcı ayrıldı:', data.message);
      // Toast notification gösterilebilir
    });

    // Katılımcı katıldı event'i
    socket.on('participantJoined', (data) => {
      console.log('Yeni katılımcı:', data.message);
      // Toast notification gösterilebilir
    });

    // Hata event'i
    socket.on('error', (errorMessage) => {
      console.error('Socket hatası:', errorMessage);
      setLastError(errorMessage);
      // 5 saniye sonra hatayı temizle
      setTimeout(() => setLastError(null), 5000);
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('profileAdded');
      socket.off('profilesUpdated');
      socket.off('voteUpdate');
      socket.off('voteConfirmed');
      socket.off('roomStats');
      socket.off('votingEnded');
      socket.off('roomReset');
      socket.off('leftRoom');
      socket.off('participantLeft');
      socket.off('participantJoined');
      socket.off('error');
    };
  }, [dispatch]);

  return {
    socket: socketRef.current,
    connectionStatus,
    lastError,
    clearError: () => setLastError(null)
  };
}
