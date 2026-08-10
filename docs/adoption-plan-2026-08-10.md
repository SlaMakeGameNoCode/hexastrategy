# Kế Hoạch Chuyển Đổi Dự Án (Adoption Plan)

> **Ngày tạo**: 2026-08-10  
> **Giai đoạn dự án**: Systems Design  
> **Engine**: Chưa cấu hình ([TO BE CONFIGURED])  
> **Phiên bản Template**: v1.0+ (Claude Code Game Studios)  

Hãy thực hiện lần lượt các bước dưới đây. Đánh dấu `[x]` sau khi hoàn thành từng mục.  
Bạn có thể chạy lại lệnh `/adopt` bất kỳ lúc nào để kiểm tra tiến độ rà soát lại dự án.

---

## Bước 1: Sửa các lỗi Rào cản (Blocking Gaps)

### 1a. Di chuyển & Di tản các file GDD vào thư mục `design/gdd/`
Các file tài liệu thiết kế hiện đang nằm ở thư mục gốc (`overview (1).md`, `army (1).md`, `battle.md`). Cần di chuyển và chuẩn hóa tên file:
- `overview (1).md` → `design/gdd/game-concept.md`
- `army (1).md` → `design/gdd/army-system.md`
- `battle.md` → `design/gdd/battle-system.md`

**Thời gian dự kiến**: ~10 phút  
- [x] Tạo thư mục `design/gdd/` và di chuyển 3 file vào vị trí chuẩn.

### 1b. Tạo file Chỉ mục hệ thống `design/gdd/systems-index.md`
Tạo bảng chỉ mục theo dõi các hệ thống trong dự án (Game Concept, Army System, Battle System) với các cột: System, Layer, Priority, Status.

**Thời gian dự kiến**: ~15 phút  
- [x] Tạo file `design/gdd/systems-index.md`.


---

## Bước 2: Sửa các lỗi Ưu tiên cao (High-Priority Gaps)

### 2a. Cấu hình Game Engine chính thức
Cập nhật `.claude/docs/technical-preferences.md` để chọn Game Engine chính thức cho dự án (Đã cấu hình: **Web Canvas / HTML5 / TypeScript**).  
*Lệnh gợi ý*: `/setup-engine`  

**Thời gian dự kiến**: ~10 phút  
- [x] Chọn và lưu thông tin Game Engine chính thức.


### 2b. Chuẩn hóa cấu trúc định dạng các file GDD
Cập nhật 3 file GDD để bổ sung các mục chuẩn theo khung mẫu (Status header, Overview, Player Fantasy, Detailed Rules, Formulas, Edge Cases, Dependencies, Tuning Knobs, Acceptance Criteria).  

**Thời gian dự kiến**: ~30 phút  
- [x] Chuẩn hóa `design/gdd/game-concept.md`
- [x] Chuẩn hóa `design/gdd/army-system.md`
- [x] Chuẩn hóa `design/gdd/battle-system.md`


---

## Bước 3: Khởi tạo Hạ tầng Kiến trúc (Bootstrap Infrastructure)

### 3a. Đăng ký Yêu cầu Kỹ thuật (TR Registry & ADRs)
Đã tạo 4 ADRs chính (`ADR-0001` đến `ADR-0004`) để quy định hệ tọa độ Hex, Server WebSockets, Combat Resolution và Canvas Render Loop.  
**Thời gian dự kiến**: 1 buổi làm việc  
- [x] Tạo 4 file ADRs kiến trúc cốt lõi.

### 3b. Tạo Bảng quy chuẩn lập trình (Control Manifest)
Chạy lệnh `/create-control-manifest`  
**Thời gian dự kiến**: ~30 phút  
- [x] Tạo file `docs/architecture/control-manifest.md`


### 3c. Tạo file Theo dõi Sprint
Chạy lệnh `/sprint-plan update`  
**Thời gian dự kiến**: ~5 phút  
- [ ] Tạo file `production/sprint-status.yaml`

---

## Tự kiểm tra lại

Sau khi hoàn thành Bước 1 và Bước 2, hãy chạy lại lệnh `/adopt` để hệ thống tự động quét và xác nhận dự án đã hoàn toàn tương thích với các quy trình thiết kế tiếp theo.
