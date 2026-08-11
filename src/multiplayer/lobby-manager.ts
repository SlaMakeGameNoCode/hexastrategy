import { UserProfile } from '../firebase/auth-service.js';

export interface OnlineUser {
  uid: string;
  displayName: string;
  wins: number;
  losses: number;
  status: 'online' | 'in_match';
}

export interface ChallengeMessage {
  type: 'LOBBY_USERS' | 'CHALLENGE_REQUEST' | 'CHALLENGE_RESPONSE' | 'MATCH_START' | 'SURRENDER_MATCH' | 'GAME_ACTION';
  fromUid?: string;
  fromName?: string;
  toUid?: string;
  roomId?: string;
  accepted?: boolean;
  users?: OnlineUser[];
  firstTurnColor?: string;
  mapSeed?: number;
  // For GAME_ACTION
  kind?: string;
  actions?: Array<{ unitId: string; action: object }>;
}

export class LobbyManager {
  private ws: WebSocket | null = null;
  private currentUser: UserProfile | null = null;
  private onlineUsers: OnlineUser[] = [];
  private currentRoomId: string | null = null;

  private onMatchStartCallback?: (roomId: string, assignedColor: string, firstTurnColor: string, mapSeed: number) => void;
  private onSurrenderCallback?: (surrenderUid: string) => void;
  private onGameActionCallback?: (action: ChallengeMessage) => void;

  constructor() {}

  public connect(user: UserProfile): void {
    this.currentUser = user;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      console.warn('WebSocket connection fallback to local:', e);
      return;
    }

    this.ws.onopen = () => {
      if (this.ws && this.currentUser) {
        this.ws.send(JSON.stringify({
          type: 'JOIN_LOBBY',
          user: {
            uid: this.currentUser.uid,
            displayName: this.currentUser.displayName,
            wins: this.currentUser.wins,
            losses: this.currentUser.losses,
            status: 'online'
          }
        }));
      }
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg: ChallengeMessage = JSON.parse(evt.data);
        this.handleServerMessage(msg);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => {
        if (this.currentUser) this.connect(this.currentUser);
      }, 3000);
    };
  }

  private handleServerMessage(msg: ChallengeMessage): void {
    switch (msg.type) {
      case 'LOBBY_USERS':
        if (msg.users) {
          this.onlineUsers = msg.users;
          this.renderLobbyUI();
        }
        break;

      case 'CHALLENGE_REQUEST':
        if (msg.fromUid && msg.fromName) {
          this.showIncomingChallengeModal(msg.fromUid, msg.fromName);
        }
        break;

      case 'CHALLENGE_RESPONSE':
        if (!msg.accepted) {
          alert(`❌ Người chơi ${msg.fromName || 'đối thủ'} đã từ chối lời mời thách đấu!`);
        }
        break;

      case 'MATCH_START':
        if (msg.roomId && this.onMatchStartCallback) {
          this.currentRoomId = msg.roomId;
          // player1 (fromUid) = Blue, player2 (accepter) = Red
          const assignedColor = msg.fromUid === this.currentUser?.uid ? '#3B82F6' : '#EF4444';
          const firstColor = msg.firstTurnColor || '#3B82F6';
          const seed = msg.mapSeed || Math.floor(Math.random() * 9000000);
          this.onMatchStartCallback(msg.roomId, assignedColor, firstColor, seed);
        }
        break;

      case 'GAME_ACTION':
        if (this.onGameActionCallback) {
          this.onGameActionCallback(msg);
        }
        break;

      case 'SURRENDER_MATCH':
        if (msg.fromUid && this.onSurrenderCallback) {
          this.onSurrenderCallback(msg.fromUid);
        }
        break;
    }
  }

  public sendChallenge(targetUid: string): void {
    if (!this.ws || !this.currentUser) return;
    this.ws.send(JSON.stringify({
      type: 'SEND_CHALLENGE',
      fromUid: this.currentUser.uid,
      fromName: this.currentUser.displayName,
      toUid: targetUid
    }));
  }

  public respondChallenge(fromUid: string, accept: boolean): void {
    if (!this.ws || !this.currentUser) return;
    this.ws.send(JSON.stringify({
      type: 'RESPOND_CHALLENGE',
      fromUid: this.currentUser.uid,
      fromName: this.currentUser.displayName,
      toUid: fromUid,
      accepted: accept
    }));
  }

  public surrenderMatch(): void {
    if (!this.ws || !this.currentUser || !this.currentRoomId) return;
    this.ws.send(JSON.stringify({
      type: 'SURRENDER_MATCH',
      roomId: this.currentRoomId,
      fromUid: this.currentUser.uid
    }));
  }

  /**
   * Send game action (planned moves) to server for relay to opponent.
   */
  public sendGameAction(kind: string, actions: Array<{ unitId: string; action: object }>): void {
    if (!this.ws || !this.currentUser || !this.currentRoomId) return;
    this.ws.send(JSON.stringify({
      type: 'GAME_ACTION',
      roomId: this.currentRoomId,
      fromUid: this.currentUser.uid,
      kind,
      actions
    }));
  }

  public onMatchStart(cb: (roomId: string, assignedColor: string, firstTurnColor: string, mapSeed: number) => void): void {
    this.onMatchStartCallback = cb;
  }

  public onSurrender(cb: (surrenderUid: string) => void): void {
    this.onSurrenderCallback = cb;
  }

  public onGameAction(cb: (action: ChallengeMessage) => void): void {
    this.onGameActionCallback = cb;
  }

  private renderLobbyUI(): void {
    const listEl = document.getElementById('lobby-users-list');
    if (!listEl) return;

    if (this.onlineUsers.length <= 1) {
      listEl.innerHTML = `<div style="text-align: center; color: #94A3B8; padding: 20px;">Đang chờ người chơi khác truy cập Sảnh PvP...</div>`;
      return;
    }

    listEl.innerHTML = this.onlineUsers
      .filter(u => u.uid !== this.currentUser?.uid)
      .map(u => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.7); padding: 10px 14px; margin-bottom: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
          <div>
            <div style="font-weight: 700; color: #F8FAFC;">⚔️ ${u.displayName}</div>
            <div style="font-size: 0.8rem; color: #94A3B8;">Thắng: <span style="color: #10B981;">${u.wins}</span> | Thua: <span style="color: #EF4444;">${u.losses}</span></div>
          </div>
          <button class="btn-challenge" data-uid="${u.uid}" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; cursor: pointer;">
            ⚔️ Thách Đấu
          </button>
        </div>
      `).join('');

    const btnChallenges = listEl.querySelectorAll('.btn-challenge');
    btnChallenges.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = (e.currentTarget as HTMLElement).dataset.uid;
        if (uid) {
          this.sendChallenge(uid);
          alert('⚔️ Đã gửi lời mời thách đấu! Vui lòng chờ đối thủ phản hồi...');
        }
      });
    });
  }

  private showIncomingChallengeModal(fromUid: string, fromName: string): void {
    const modal = document.getElementById('challenge-modal');
    const descEl = document.getElementById('challenge-desc');
    const btnAccept = document.getElementById('btn-accept-challenge');
    const btnDecline = document.getElementById('btn-decline-challenge');

    if (descEl) descEl.innerText = `⚔️ Người chơi "${fromName}" muốn gửi lời mời thách đấu PvP với bạn!`;

    if (modal) modal.style.display = 'flex';

    if (btnAccept) {
      btnAccept.onclick = () => {
        this.respondChallenge(fromUid, true);
        if (modal) modal.style.display = 'none';
      };
    }

    if (btnDecline) {
      btnDecline.onclick = () => {
        this.respondChallenge(fromUid, false);
        if (modal) modal.style.display = 'none';
      };
    }
  }
}
