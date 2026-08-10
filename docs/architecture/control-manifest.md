# Control Manifest — Bảng Quy Chuẩn Lập Trình (Programmers Rule Sheet)

> **Project**: HEX LEGION  
> **Manifest Version**: 1.0.0  
> **Ngày cập nhật**: 2026-08-10  

Tài liệu này tổng hợp các quy tắc lập trình bắt buộc trích xuất từ các ADRs đã duyệt. Tất cả Lập trình viên AI BẮT BUỘC tuân thủ các quy tắc này khi viết code.

---

## 1. Quy tắc Tầng Cốt lõi & Toán Hexagon (ADR-0001)

- **BẮT BUỘC**: Sử dụng tọa độ Axial (`q`, `r`) cho toàn bộ vị trí ô Hex và tính toán khoảng cách.
- **BẮT BUỘC**: Sử dụng thuật toán A* để tính đường di chuyển của đơn vị quân.
- **TUYỆT ĐỐI KHÔNG**: Hardcode tọa độ pixel màn hình trong logic tính toán game.
- **TUYỆT ĐỐI KHÔNG**: Dùng công thức khoảng cách 2D Cartesian ($x^2 + y^2$) cho bàn cờ Hex.

---

## 2. Quy tắc Server & Mạng (ADR-0002)

- **BẮT BUỘC**: Server phải kiểm tra hợp lệ toàn bộ gói tin ($\sum \text{ActionCost} \le 10 \text{ AP}$).
- **BẮT BUỘC**: Giữ trạng thái trận đấu (`MatchState`) làm chủ hoàn toàn trên Server.
- **TUYỆT ĐỐI KHÔNG**: Cho phép Client tự sửa HP, vị trí hay Cooldown.
- **TUYỆT ĐỐI KHÔNG**: Chấp nhận gói tin vượt quá 10 AP/lượt.

---

## 3. Quy tắc Combat & Phân giải Lượt (ADR-0003)

- **BẮT BUỘC**: Sắp xếp hành động theo `PriorityScore` trước khi giải quyết lượt.
- **BẮT BUỘC**: Kích hoạt đòn phản công `Brace` của Long Spear TRƯỚC KHI đòn `Charge` của Kỵ binh gây sát thương.
- **BẮT BUỘC**: Hủy bỏ hiệu ứng hất văng của Kỵ binh khi đâm vào đơn vị đang thủ giáo (`Brace`).
- **TUYỆT ĐỐI KHÔNG**: Dùng giải quyết ngẫu nhiên không định tính cho các hành động đồng thời.

---

## 4. Quy tắc Đồ họa & Giao diện Canvas (ADR-0004)

- **BẮT BUỘC**: Duy trì 60 FPS sử dụng `requestAnimationFrame`.
- **BẮT BUỘC**: Cache bản đồ địa hình tĩnh trên Offscreen Canvas để tối ưu render.
- **BẮT BUỘC**: Tự động scale độ phân giải Canvas theo `window.devicePixelRatio` cho màn hình Retina/Mobile.
- **TUYỆT ĐỐI KHÔNG**: Thay đổi biến trạng thái game trực tiếp bên trong vòng lặp Render.
- **TUYỆT ĐỐI KHÔNG**: Truy vấn DOM (document.getElementById) bên trong vòng lặp 60 FPS.

---

## 5. Quy Chuẩn Đặt Tên (Naming Conventions)

- **Classes**: PascalCase (`HexGridMap`, `ArmyUnit`, `BattleState`)
- **Variables / Functions**: camelCase (`actionPoints`, `calculateDamage()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ACTION_POINTS`, `GRID_WIDTH`)
- **Files**: kebab-case (`hex-grid-map.ts`, `army-unit.ts`)
