import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { io } from 'socket.io-client';
import { server } from '../server.js';

const PORT = 3001;
const SERVER_URL = `http://localhost:${PORT}`;

describe('Avatar Voting Game Backend Tests', () => {
    let hostSocket, userSocket;

    beforeAll((done) => {
        server.listen(PORT, () => {
            console.log(`Test server listening on port ${PORT}`);
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    beforeEach((done) => {
        hostSocket = io(SERVER_URL, {
            forceNew: true,
            transports: ['websocket']
        });
        userSocket = io(SERVER_URL, {
            forceNew: true,
            transports: ['websocket']
        });

        let connected = 0;
        const checkDone = () => {
            connected++;
            if (connected === 2) done();
        }

        hostSocket.on('connect', checkDone);
        userSocket.on('connect', checkDone);

        hostSocket.on('connect_error', (err) => console.error('Host connection error:', err));
        userSocket.on('connect_error', (err) => console.error('User connection error:', err));
    });

    afterEach(() => {
        if (hostSocket) hostSocket.close();
        if (userSocket) userSocket.close();
    });

    describe('1. Room Management', () => {
        it('should allow host to create a room', () => new Promise((resolve, reject) => {
            hostSocket.emit('createRoom');
            hostSocket.on('roomCreated', (data) => {
                try {
                    expect(data.code).toBeDefined();
                    expect(data.code).toHaveLength(6);
                    resolve();
                } catch (e) { reject(e); }
            });
        }));

        it('should allow user to join a valid room', () => new Promise((resolve, reject) => {
            let roomCode;
            hostSocket.emit('createRoom');
            hostSocket.on('roomCreated', (data) => {
                roomCode = data.code;
                userSocket.emit('joinRoom', roomCode);
            });

            userSocket.on('roomJoined', (data) => {
                try {
                    expect(data.code).toBe(roomCode);
                    resolve();
                } catch (e) { reject(e); }
            });
        }));

        it('should fail when joining with invalid code', () => new Promise((resolve, reject) => {
            userSocket.emit('joinRoom', 'INV000');
            userSocket.on('error', (err) => {
                try {
                    expect(err).toContain('Oda bulunamad');
                    resolve();
                } catch (e) { reject(e); }
            });
        }));

        it('should fail when joining with 3-char code', () => new Promise((resolve, reject) => {
            userSocket.emit('joinRoom', 'ABC');
            userSocket.on('error', (err) => {
                try {
                    expect(err).toContain('6 haneli');
                    resolve();
                } catch (e) { reject(e); }
            });
        }));
    });

    describe('2. Synchronization', () => {
        it('should notify host when user joins', () => new Promise((resolve, reject) => {
            let roomCode;
            hostSocket.emit('createRoom');

            hostSocket.on('roomCreated', (data) => {
                roomCode = data.code;
                userSocket.emit('joinRoom', roomCode);
            });

            hostSocket.on('participantJoined', (data) => {
                try {
                    expect(data.participantCount).toBe(2);
                    resolve();
                } catch (e) { reject(e); }
            });
        }));

        it('should broadcast updated stats to all', () => new Promise((resolve, reject) => {
            let roomCode;
            hostSocket.emit('createRoom');

            hostSocket.on('roomCreated', (data) => {
                roomCode = data.code;
                userSocket.emit('joinRoom', roomCode);
            });

            let hostStats = false;
            let userStats = false;
            const check = () => {
                if (hostStats && userStats) resolve();
            }

            hostSocket.on('roomStats', (stats) => {
                try {
                    if (stats.participantCount === 2) {
                        hostStats = true;
                        check();
                    }
                } catch (e) { reject(e); }
            });

            userSocket.on('roomStats', (stats) => {
                try {
                    if (stats.participantCount === 2) {
                        userStats = true;
                        check();
                    }
                } catch (e) { reject(e); }
            });
        }));
    });

    describe('3. Profile Feature', () => {
        it('should allow creating a profile', () => new Promise((resolve, reject) => {
            hostSocket.emit('createRoom');
            hostSocket.on('roomCreated', (data) => {
                hostSocket.emit('createProfile', { name: 'HostUser', avatar: 'avatar1' });
            });

            hostSocket.on('profileAdded', (profile) => {
                try {
                    expect(profile.name).toBe('HostUser');
                    resolve();
                } catch (e) { reject(e); }
            });
        }));
    });
});
