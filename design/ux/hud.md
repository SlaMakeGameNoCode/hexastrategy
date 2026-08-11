# HUD Design

> **Status**: In Design  
> **Author**: User + UX Designer  
> **Last Updated**: 2026-08-11  
> **Template**: HUD Design  

---

## HUD Philosophy

**Adaptive & Contextual Strategy HUD**:
Trải nghiệm chiến thuật 5 phút đòi hỏi sự tập trung tối đa vào bàn cờ lục giác. HUD tuân theo nguyên tắc:
- **Tập trung cao độ khi Lập Kế Hoạch**: Nổi bật đồng hồ đếm ngược (10s Timer) và Ngân sách điểm hành động (10 AP Budget). Các thông tin phụ tự động làm mờ để tránh làm xao nhãng.
- **Hiển thị theo ngữ cảnh (Contextual Inspection)**: Chỉ hiển thị bảng chỉ số chi tiết, tầm đánh, kỹ năng khi người chơi click/chọn một đơn vị quân cụ thể.
- **Tối ưu không gian hiển thị**: Giữ cho khu vực bản đồ giao tranh trung tâm được thoáng và rộng nhất trên cả màn hình Desktop lẫn Mobile.

---

## Information Architecture

### Full Information Inventory & Categorization

| Nhóm Thông Tin | Các Phần Tử HUD | Quy Tắc Hiển Thị |
|---|---|---|
| **1. Must Show (Luôn Hiện)** | • Đồng hồ đếm ngược (10s Timer)<br>• Thanh AP còn lại / Tổng AP (10 AP Budget)<br>• Tên Phase hiện tại (DEPLOYMENT / PLANNING / RESOLUTION)<br>• Nút "Kết Thúc Lượt" & "Đầu Hàng" | Luôn cố định ở thanh trạng thái đỉnh và góc dưới màn hình. |
| **2. Contextual (Theo Ngữ Cảnh)** | • Card thông tin Unit được chọn (Tên, Class, HP, Atk, Def, Range, Move)<br>• Nút kích hoạt Kỹ Năng / Skill đặc biệt<br>• Tầm di chuyển & tầm đánh (Highlight trên các ô Hex)<br>• Đường xem trước lượt di chuyển (Path Preview) | Chỉ xuất hiện khi người chơi click chọn 1 đơn vị quân trên bàn cờ. |
| **3. On Demand (Yêu Cầu Mới Hiện)** | • Modal so sánh tương quan lực lượng (Matchup Summary Sheet)<br>• Chi tiết hiệu ứng địa hình ô Hex (khi rê chuột hover) | Bật khi nhấn nút thông tin hoặc rê chuột vào địa hình. |
| **4. Hidden (Ẩn - Hiện Trực Quan)** | • Sát thương gây ra (Floating Damage Numbers)<br>• Trạng thái Fog of War (Lớp mù trên bàn cờ)<br>• Thanh HP nhỏ trên đầu từng Unit | Tích hợp trực tiếp vào thế giới game 2D trên Canvas. |

---

## Layout Zones & Wireframe

### Bố Cục 5 Phân Vùng HUD (Layout Zones)

1. **Zone Top Header (Thanh Trạng Thái Đỉnh)**: Chứa thông tin Người chơi, Tỉ lệ Thắng/Thua, Tên Phase trận đấu, và trạng thái Sảnh PvP / Đăng nhập.
2. **Zone Top-Center (Cụm đếm giờ & AP)**: Chứa Đồng hồ đếm ngược (10s Ring Timer) và Thanh Ngân sách AP (AP Bar) để người chơi dễ quan sát nhất.
3. **Zone Bottom-Left (Card Đơn Vị Được Chọn)**: Hiển thị thông số chi tiết của Quân lính đang được chọn, kèm nút Kỹ Năng / Skill đặc biệt.
4. **Zone Bottom-Right (Cụm Thao Tác)**: Chứa các nút hành động chính như "Kết Thúc Lượt", "Bắt Đầu Trận", "Đầu Hàng".
5. **Zone Center Canvas (Bàn Cờ Lục Giác)**: Không gian chính 15x13 ô Hex cho di chuyển, Fog of War, VFX và combat.

### ASCII Wireframe

```
+-----------------------------------------------------------------------------------+
|  👤 Player (PvP)          [Round 1: Lập Kế Hoạch]           🚪 Đăng Xuất / Sảnh  |
|                         ( 10s ) [======== 10 AP ========]                        |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                                                                                   |
|                                BÀN CỜ LỤC GIÁC (HEX GRID)                         |
|                                     (15 x 13 HEXES)                               |
|                                                                                   |
|                                                                                   |
+-----------------------------------------------------+-----------------------------+
|  [🛡️ GIÁO NGẮN]                                      |                             |
|  HP: 100/100  AP: 2   Tầm: 1    Di chuyển: 3          |    [🏳️ Đầu Hàng]             |
|  [⚡ Skill: Đội Hình Giáo]                           |    [⚔️ KẾT THÚC LƯỢT]        |
+-----------------------------------------------------+-----------------------------+
```

---

## HUD Elements & Dynamic Behaviors

### 1. Chi Tiết Các Phần Tử HUD (HUD Elements)
- **Timer Ring**: Đồng hồ dạng hình tròn đếm lùi từ 10s về 0s. Màu sắc chuyển đổi từ Vàng (`#F59E0B`) sang Đỏ flash nhẹ khi còn dưới 3 giây.
- **Thanh AP (AP Budget Bar)**: Hiển thị 10 khối AP tương ứng 10 điểm. Khi đặt lệnh di chuyển/tấn công, các ô AP tương ứng sẽ nhấp nháy dự báo chi phí.
- **Card Đơn Vị (Unit Card)**: Nằm ở góc dưới bên trái, xuất hiện hiệu ứng Slide-up 0.2s khi click chọn unit. Hiển thị Icon, HP Bar, Chỉ số và Nút kích hoạt Skill.
- **Lớp Overlay Chờ (PvP Waiting Overlay)**: Xuất hiện màn hình mờ với Icon đồng hồ xoay `⏳ ĐANG CHỜ ĐỐI THỦ...` khi người chơi đã gửi lệnh nhưng chờ đối thủ hoàn tất.

### 2. Hành Vi Động (Dynamic Behaviors)
- **Tự động ẩn/hiện theo Phase**:
  - Phase **DEPLOYMENT**: Hiện thanh danh sách xếp quân (Deck Drawer), hiện nút "Bắt Đầu Trận".
  - Phase **PLANNING**: Ẩn thanh xếp quân, hiện cụm Timer + AP + Nút "Kết Thúc Lượt".
  - Phase **RESOLUTION**: Làm mờ các nút thao tác, ưu tiên toàn màn hình hiển thị hoạt cảnh combat & VFX di chuyển/tấn công.
- **Xoay Bàn Cờ PvP (Perspective Flip)**: Tự động áp dụng `rotate(180deg)` cho Player 2 (Quân Đỏ) để bàn cờ luôn hướng quân của mình ở phía dưới màn hình.

---

## Accessibility & Responsive Adaptations

- **Hỗ trợ Cảm Ứng (Touch Support)**: Các nút thao tác ("Kết Thúc Lượt", Nút Skill) có kích thước tối thiểu `44x44px` đáp ứng chuẩn chạm trên thiết bị di động.
- **Tương Phản & Độ Rõ Nét**: Font chữ Outfit/Roboto với tương phản màu cao (`#F8FAFC` trên nền tối `#0F172A`).
- **Giảm Thiểu Chuyển Động (Reduced Motion)**: Các hiệu ứng rung màn hình (Screen Shake) hoặc flash ánh sáng khi nổ có thể tắt trong cài đặt.

---

## Open Questions & Next Steps

1. **Hệ thống Chat / Quick Emoji**: Có nên bổ sung thêm tính năng thả Emoji nhanh trong trận đấu PvP không?
2. **Âm thanh HUD**: Cần thiết kế Sound Effect (SFX) cho tiếng đếm ngược 3-2-1s và tiếng click chọn nút AP.
3. **Tiếp theo**: Chuyển tài liệu này cho `ui-programmer` kiểm tra tính khả thi và tiến hành nâng cấp UI trong `index.html` / `src/ui/`.
