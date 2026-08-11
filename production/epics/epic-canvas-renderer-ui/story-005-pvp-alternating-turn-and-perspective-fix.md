# Story 005: Alternating PvP Turn Flow & Inverted Click Matrix Fix

> **Epic**: Canvas 2D Renderer & Game UI  
> **Status**: Complete  
> **Layer**: Gameplay / UI  
> **Type**: Logic  
> **Estimate**: 2 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-11  

---

## Context

**UX Specification**: [design/ux/hud.md](file:///f:/prototype/hexastreragy/design/ux/hud.md)  
**GDD**: [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
**Requirement**: `TR-battle-004` & `TR-pvp-001`  

**ADR Governing Implementation**: [ADR-0002: Server-Authoritative State & WebSocket Payload Protocol](file:///f:/prototype/hexastreragy/docs/architecture/adr-0002-server-authoritative-websocket-protocol.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] **AC-1**: Modal `⏳ ĐANG CHỜ ĐỐI THỦ...` KHÔNG BAO GIỜ hiển thị bên trong trận đấu.
- [x] **AC-2**: Banner trạng thái lượt hiển thị chính xác `🟢 LƯỢT CỦA BẠN (15s)` khi đến lượt ta và `🔴 LƯỢT ĐỐI THỦ (15s)` khi đến lượt đối phương. Nút `"Kết Thúc Lượt"` bị làm mờ (Disabled) khi không phải lượt của mình.
- [x] **AC-3**: Sửa triệt để lỗi click chuột lệch ô cho Player 2 (`myPvpColor === '#EF4444'`). Tọa độ `getCanvasHex` đảo chính xác 1 lần `(-q, -r)` để chọn chuẩn 100% quân lính ở nửa dưới màn hình.

---

## Implementation Notes

- Cập nhật `src/main.ts`:
  - Đảm bảo `getCanvasHex` tính toán chuẩn không bị nhân đôi phép đảo tọa độ.
  - Xóa bỏ tất cả lệnh gọi `showPvpWaiting(true)` trong trận đấu.
  - Bổ sung kiểm tra `currentTurnColor` để bật/tắt quyền tương tác và cập nhật Banner.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/ui/pvp_turn_fix_test.ts` — must exist and pass.  
