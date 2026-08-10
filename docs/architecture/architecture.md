# HEX LEGION — Master Architecture (Bản Thiết Kế Kiến Trúc Tổng Thể)

> **Trạng thái**: Draft / Initial Release  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-08-10  
> **Engine**: Web Canvas / HTML5  
> **Ngôn ngữ**: TypeScript (Strict Mode)  
> **Tài liệu GDD áp dụng**: `game-concept.md`, `army-system.md`, `battle-system.md`, `systems-index.md`  

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

HEX LEGION được thiết kế theo mô hình **Server-Authoritative** (Server làm chủ hoàn toàn trạng thái trận đấu), giúp đảm bảo tính công bằng PvP và ngăn chặn gian lận (anti-cheat). Client hiển thị bàn cờ Hex bằng HTML5 Canvas 2D, nhận thao tác lập kế hoạch từ người chơi (10s / 10 AP) và gửi về Server để giải quyết lượt đấu.

---

## 2. Bảng Yêu Cầu Kỹ Thuật Cơ Bản (Technical Requirements Baseline)

| Req ID | GDD | Hệ thống (System) | Mô tả yêu cầu kỹ thuật | Tầng kiến trúc (Layer) |
|--------|-----|-------------------|------------------------|-----------------------|
| TR-concept-001 | game-concept.md | Matchmaking | Ghép đấu PvP 1v1 theo MMR & Tạo phòng PvP Private | Feature |
| TR-concept-002 | game-concept.md | PvE Bot | Bot AI đấu 1v1 với 4 độ khó (Easy, Medium, Hard, Very Hard) | Feature |
| TR-concept-003 | game-concept.md | Turn Engine | Lập kế hoạch đồng thời (Simultaneous Planning): 10s & 10 AP/lượt | Core |
| TR-concept-004 | game-concept.md | Security | Server-Authoritative Match State & Combat Resolution | Foundation |
| TR-concept-005 | game-concept.md | Deck System | Chọn và lưu trữ bộ bài tối đa 5 đơn vị quân | Feature |
| TR-army-001 | army-system.md | Army System | Quản lý chỉ số 12 loại quân (HP, ATK, DEF, AP, MP, Range, Initiative, Cooldown) | Core |
| TR-army-002 | army-system.md | Terrain System | Ma trận chi phí di chuyển MP theo loại địa hình (Đất, Đường, Rừng, Núi,...) | Core |
| TR-army-003 | army-system.md | Combat System | Ma trận khắc chế (Spear vs Cav, Cav vs Ranged,...) | Core |
| TR-army-004 | army-system.md | Ability System | Xử lý kỹ năng đặc trưng (Brace, Charge, Shield Wall, Shoot & Retreat,...) | Core |
| TR-army-005 | army-system.md | Progression | Bộ sưu tập quân bài, Army EXP, Leveling & Evolution | Feature |
| TR-battle-001 | battle-system.md | Hex Engine | Bàn cờ Hex (Tọa độ Axial $q, r$), tính khoảng cách & góc bắn | Core |
| TR-battle-002 | battle-system.md | Pathfinding | Tìm đường ngắn nhất A* trên lưới Hex & Xem trước di chuyển (Preview UI) | Core / UI |
| TR-battle-003 | battle-system.md | Resolution | Giải quyết lượt theo Initiative, phản công Brace vs Charge đồng thời | Core |
| TR-battle-004 | battle-system.md | Performance | Hiệu năng Canvas 2D 60 FPS, <100 draw calls/frame | Presentation |

---

## 3. Sơ Đồ Phân Tầng Hệ Thống (System Layer Map)

```text
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Tầng Hiển Thị)                         │
│  - CanvasRenderer (Bàn cờ Hex, Đơn vị quân, Hiệu ứng)      │
│  - HUDOverlay (Đếm ngược 10s, Thanh 10 AP, Chọn quân)      │
│  - CollectionUI (Xếp đội hình, Nâng cấp level, Gacha)       │
├─────────────────────────────────────────────────────────────┤
│  FEATURE LAYER (Tầng Tính Năng)                             │
│  - Matchmaker & RoomManager (Ghép đấu PvP Ranked/Private)   │
│  - BotAIController (AI Bot 4 độ khó)                        │
│  - ProgressionManager (Sưu tầm, EXP, Tiến hóa quân)         │
├─────────────────────────────────────────────────────────────┤
│  CORE LAYER (Tầng Cốt Lõi)                                  │
│  - HexGridEngine (Tọa độ Axial, Khoảng cách Hex, Thuật toán A*)│
│  - CombatResolver (Giải quyết sát thương, Khắc chế, Charge/Brace)│
│  - TurnManager (Đếm ngược 10s, Kiểm soát ngân sách 10 AP)  │
├─────────────────────────────────────────────────────────────┤
│  FOUNDATION LAYER (Tầng Nền Tảng)                           │
│  - WebSocketClient/Server (Truyền nhận dữ liệu thời gian thực)│
│  - GameStateStore (Quản lý trạng thái trận đấu Authoritative)│
│  - EventBus (Hệ thống phát sự kiện nội bộ decoupled)        │
├─────────────────────────────────────────────────────────────┤
│  PLATFORM LAYER (Tầng Nền Tảng Trình Duyệt)                 │
│  - HTML5 Canvas 2D API / WebGL Context                      │
│  - WebSockets / HTTP Fetch API                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Bản Đồ Sở Hữu Module (Module Ownership Map)

| Module | Quản lý độc quyền (Owns) | Cung cấp cho module khác (Exposes) | Tiêu thụ từ module khác (Consumes) |
|---|---|---|---|
| **HexGridEngine** | Bản đồ Hex, Tọa độ ô, Chi phí địa hình | `getDistance()`, `findPath()`, `isValidHex()` | `TerrainMatrixData` |
| **TurnManager** | Timer 10s, Ngân sách 10 AP, Trạng thái lượt | `submitAction()`, `validateAP()`, `onRoundEnd` | `GameStateStore` |
| **CombatResolver**| Tính sát thương, Initiative order, Charge/Brace | `resolveTurn()`, `calculateDamage()` | `HexGridEngine`, `ArmyStats` |
| **GameStateStore**| Toàn bộ HP, Vị trí quân, Cooldown, Trạng thái sống/chết | `getState()`, `updateState()`, `serialize()` | `TurnManager`, `CombatResolver` |
| **CanvasRenderer**| Canvas Context, Sprite batching, Render Loop 60 FPS | `render()`, `showPathPreview()` | `GameStateStore`, `HexGridEngine` |
| **BotAIController**| Logic suy luận bot (Easy/Medium/Hard/Very Hard) | `generateBotTurn()` | `GameStateStore`, `CombatResolver` |

---

## 5. Dòng Luồng Dữ Liệu (Data Flow)

### Luồng xử lý một lượt đấu (Round Sequence Data Flow):
```text
Player UI (Client)                Server (TurnManager)              CombatResolver
    │                                     │                                │
    ├─ (1) Chọn hành động (AP <= 10) ────►│                                │
    │   Lệnh di chuyển/đánh/kỹ năng       │                                │
    │                                     ├─ (2) Kiểm tra hợp lệ (10 AP)   │
    ├─ (3) Hết 10s đếm ngược ────────────►│                                │
    │                                     ├─ (4) Khóa lệnh & Gửi lượt ────►│
    │                                     │                                ├─ (5) Xếp thứ tự Initiative
    │                                     │                                ├─ (6) Tính Charge vs Brace
    │                                     │                                ├─ (7) Trừ HP & Trừ Cooldown
    │                                     │◄─ (8) Trả về kết quả lượt ─────┤
    │◄─ (9) Render hoạt họa trận đấu ─────┤                                
```

---

## 6. Các Quyết Định Kiến Trúc Cần Thiết (Required ADRs)

Dựa trên bản thiết kế tổng thể, các quyết định kiến trúc quan trọng nhất (ADRs) cần được lập ra trước khi viết code:

1. **ADR-0001 (Foundation):** `Hex Grid Coordinate System & Math Strategy`  
   *Nội dung*: Chọn hệ tọa độ Axial ($q, r$) cho bàn cờ Hex và thuật toán tìm đường A*.
2. **ADR-0002 (Foundation):** `Server-Authoritative State & WebSocket Payload Protocol`  
   *Nội dung*: Cấu trúc gói tin truyền nhận giữa Client và Server để xử lý 10s Simultaneous Planning và 10 AP.
3. **ADR-0003 (Core):** `Simultaneous Combat Resolution & Initiative Determinism`  
   *Nội dung*: Quy tắc ưu tiên giải quyết lượt (Initiative) và tính toán sát thương phản công khi 2 đơn vị tấn công nhau cùng lúc.
4. **ADR-0004 (Presentation):** `HTML5 Canvas 2D Batching & Render Loop Architecture`  
   *Nội dung*: Thiết kế bộ vẽ Canvas 60 FPS, quản lý Sprite và hiển thị xem trước di chuyển (Path Preview).

---

## 7. Nguyên Tắc Kiến Trúc (Architecture Principles)

1. **Server Authoritative First**: Mọi thay đổi về chỉ số, vị trí, sát thương và kết quả trận đấu BẮT BUỘC do Server tính toán. Client chỉ đóng vai trò hiển thị và nhận lệnh.
2. **Deterministic Resolution**: Cùng một đầu vào trong lượt Simultaneous Planning phải luôn cho ra 1 kết quả giải quyết giống nhau hoàn toàn.
3. **Zero Magic Coordinates**: Toàn bộ vị trí trên bàn cờ sử dụng tọa độ Hex Axial ($q, r$), không dùng tọa độ pixel cứng trong logic game.
4. **Decoupled UI & Logic**: Hệ thống logic trận đấu (`TurnManager`, `CombatResolver`) hoàn toàn tách biệt với Canvas Renderer thông qua `EventBus` và `GameStateStore`.
