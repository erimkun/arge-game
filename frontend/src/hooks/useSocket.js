/**
 * Custom Hook: useSocket
 * Single Responsibility: Socket.IO event yönetimi için hook
 * Oda sistemi ile çalışır
 */

import { useEffect, useMemo, useRef } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import { AVATARS } from '../utils/avatars';

export function useSocket() {
  const { dispatch } = useAppState();
  const socketRef = useRef(null);
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
    });

    socket.on('disconnect', () => {
      console.log('Socket bağlantısı kesildi');
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

    // Oy event'leri
    socket.on('voteUpdate', ({ profileId, count }) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_VOTE,
        payload: { profileId, count }
      });
    });

    // Sonuç event'i
    socket.on('votingEnded', (results) => {
      dispatch({ type: ACTION_TYPES.SET_RESULTS, payload: results });
    });

    // Oda sıfırlama event'i
    socket.on('roomReset', () => {
      console.log('Oda sıfırlandı');
      dispatch({ type: ACTION_TYPES.RESET });
    });

    // Odadan ayrılma event'i
    socket.on('leftRoom', () => {
      console.log('Odadan ayrıldı');
      dispatch({ type: ACTION_TYPES.LEAVE_ROOM });
    });

    // Katılımcı ayrıldı event'i
    socket.on('participantLeft', (data) => {
      console.log('Bir katılımcı ayrıldı:', data.message);
    });

    // Katılımcı katıldı event'i
    socket.on('participantJoined', (data) => {
      console.log('Yeni katılımcı:', data.message);
    });

    // Hata event'i
    socket.on('error', (errorMessage) => {
      console.error('Socket hatası:', errorMessage);
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('profileAdded');
      socket.off('voteUpdate');
      socket.off('votingEnded');
      socket.off('roomReset');
      socket.off('leftRoom');
      socket.off('participantLeft');
      socket.off('participantJoined');
      socket.off('error');
    };
  }, [dispatch]);

  return socketRef.current;
}
