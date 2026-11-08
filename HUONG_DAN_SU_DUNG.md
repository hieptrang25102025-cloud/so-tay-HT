# SỔ TAY HT – HƯỚNG DẪN SỬ DỤNG VÀ VẬN HÀNH DỄ DÀNG

> **"Ghi nhớ thông minh – Quản lý dễ dàng – Đồng hành cùng bạn trong mọi công việc!"**

Ứng dụng **SỔ TAY HT** được thiết kế đặc biệt cho người thợ: thao tác nhanh, nút bấm to rõ, hỗ trợ giọng nói tiếng Việt tự nhiên và quản lý tồn kho chính xác tuyệt đối.

---

## 1. CÁCH MỞ VÀ CÀI ĐẶT LÊN ĐIỆN THOẠI (IPHONE & ANDROID)

### Cách mở trên máy tính hoặc mạng nội bộ:
1. Nhấp đúp vào tệp `start.bat` trong thư mục `so-tay-ht`.
2. Màn hình màu xanh sẽ tự động hiển thị chính xác địa chỉ IP của máy bạn:
   - **Trên máy tính:** `http://localhost:5173`
   - **Trên điện thoại:** `http://192.168.2.6:5173` (hoặc địa chỉ IP hiển thị trên màn hình đen `start.bat`)
3. Để mở trên điện thoại (khi điện thoại và máy tính cùng kết nối 1 mạng Wi-Fi):
   - Mở trình duyệt Safari (trên iPhone) hoặc Chrome (trên Android).
   - Nhập: `http://192.168.2.6:5173`
   *(Lưu ý: Nếu Windows Firewall hỏi cho phép Node.js truy cập mạng, hãy chọn "Allow access / Cho phép").*

### Cách cài thành ứng dụng lên màn hình chính điện thoại (PWA):
- **Trên iPhone (Safari):**
  1. Nhấn vào biểu tượng **Chia sẻ** (hình ô vuông có mũi tên chỉ lên ở dưới màn hình).
  2. Chọn **"Thêm vào MH chính"** (Add to Home Screen).
  3. Ứng dụng sẽ xuất hiện trên màn hình điện thoại như một app tải từ App Store với logo SỔ TAY HT màu vàng kim sang trọng!
- **Trên Android (Chrome / Samsung Internet):**
  1. Nhấn vào dấu **3 chấm** ở góc trên bên phải màn hình.
  2. Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.

---

## 2. QUY TRÌNH SỬ DỤNG HẰNG NGÀY

### Bước 1: Ghi nhận sử dụng bằng giọng nói (Đa nền tảng)
1. Ở màn hình chính, nhấn vào nút lớn màu vàng kim: **GHI NHANH BẰNG GIỌNG NÓI**.
2. Nhấn nút Micro ở giữa để bắt đầu nói. Ứng dụng sẽ thu âm bằng `MediaRecorder` chuẩn:
   - Trên iPhone Safari: chuẩn AAC/MP4.
   - Trên Android & Máy tính: chuẩn WebM Opus.
3. Khi nói xong, chạm lại vào micro hoặc bấm **"Hoàn tất nói"**.
4. Âm thanh được chuyển lên Backend để AI nhận diện tiếng Việt có dấu và giữ nguyên mã vật tư:
   - *Câu nói mẫu:* `"Hôm nay gắn cho anh Tuấn 2 sợi dây CORO A123."`
5. Màn hình **Xác nhận thông tin** sẽ tự động bóc tách:
   - **Khách hàng:** Anh Tuấn
   - **Vật tư:** Dây CORO A123 (Số lượng: 2 Sợi)
   - **Ghi chú:** Gắn cho khách anh Tuấn
6. Nhấn **✓ Lưu giao dịch**:
   - Tồn kho tự động trừ chính xác 2 sợi.
   - Giao dịch được lưu vào Lịch sử.
   - Trang chủ tự động cập nhật số liệu.

*(Lưu ý: Nếu đang ở nơi ồn ào không tiện nói, bạn bấm nút **"⌨ Nhập tay"** để chọn nhanh vật tư).*

---

## 3. CẤU HÌNH NHẬN DIỆN GIỌNG NÓI (SPEECH-TO-TEXT BACKEND)

Hệ thống hỗ trợ 3 dịch vụ nhận diện giọng nói tiếng Việt cao cấp:
1. **Google Gemini Flash (Khuyên dùng - Miễn phí):**
   - Nhận diện tiếng Việt chuẩn xác nhất, giữ nguyên mã sản phẩm như `CORO A123`.
   - Lấy API Key miễn phí (không cần thẻ tín dụng) tại: [https://aistudio.google.com/](https://aistudio.google.com/)
2. **Groq Whisper Large-v3 (Miễn phí & Cực nhanh):**
   - Lấy API Key tại: [https://console.groq.com/](https://console.groq.com/)
3. **OpenAI Whisper-1:**
   - Dùng tài khoản OpenAI API.

### Cách nhập API Key:
- **Cách 1 (Ngay trên điện thoại hoặc máy tính):**
  1. Mở app, bấm biểu tượng **Cài đặt (bánh răng)** ở góc trên bên phải.
  2. Tại mục **"Dịch vụ giọng nói (Speech-to-Text)"**, dán API Key vào ô.
  3. Bấm **"Lưu cấu hình giọng nói"** (Hệ thống sẽ ghi nhớ an toàn).
- **Cách 2 (Trên Hosting qua biến môi trường):**
  - Đặt biến `GEMINI_API_KEY=your_key_here` trong tệp `.env` hoặc cấu hình Environment Variables trên hosting.

---

## 4. ĐI CHỢ MUA HÀNG (KHÔNG LO QUÊN ĐỒ)
1. Nhấn vào tab **"Đi chợ"** ở thanh điều hướng phía dưới.
2. Ứng dụng tự động gom các món cần mua theo từng nhóm (Nhóm Dây CORO, Nhóm Bóng đèn,...).
3. Các món sắp hết hoặc hết hàng trong kho sẽ **tự động được gợi ý** vào danh sách. Bạn cũng có thể bấm **"➕ Thêm thủ công"** hoặc **"🎙 Thêm bằng giọng nói"** để bổ sung món muốn mua.
4. Khi đi chợ:
   - Mua đến món nào, tích tròn vào món đó.
   - Mua xong, bấm nút vàng: **"✓ Đánh dấu đã mua"**.
   - Ứng dụng cho phép nhập số lượng thực tế bạn đã mua.
   - **Tồn kho sẽ tự động cộng thêm** số lượng bạn vừa mua, và món đó chuyển sang mục "Đã mua".
   - Nếu bạn mua chưa đủ số lượng (ví dụ cần 5 nhưng tiệm chỉ còn 3), số lượng 2 còn thiếu sẽ tự động được giữ lại trong danh sách cho lần sau!

---

## 5. QUẢN LÝ DANH MỤC VẬT TƯ
1. Nhấn vào tab **"Vật tư"**.
2. Nhấn nút **"+ Thêm vật tư mới"** để thêm bất kỳ món nào bạn quản lý:
   - Tên vật tư (VD: Dây COGO, Bóng đèn LED 12W, Dây điện 2.5...)
   - Mã hàng (VD: A123, 12W, CV 2.5...)
   - Nhóm (chọn nhóm có sẵn hoặc bấm "+ Tạo nhóm mới" ngay trong ô chọn)
   - Đơn vị tính (sợi, cái, mét, cuộn, bộ, hộp...)
   - Tồn kho ban đầu và mức tồn tối thiểu để báo động khi sắp hết.
3. Khi kho sắp hết hàng (`tồn <= mức tối thiểu`), thẻ sẽ hiện màu vàng cam **"Sắp hết"** hoặc đỏ **"Hết hàng"**.

---

## 6. LỊCH SỬ & HOÀN TÁC GIAO DỊCH AN TOÀN
1. Nhấn vào tab **"Lịch sử"**.
2. Bạn có thể lọc theo **7 ngày**, **30 ngày** hoặc **Tất cả**.
3. Xem chi tiết từng lần Nhập hàng (màu xanh lá `+`), Xuất dùng (màu đỏ `-`), hoặc Điều chỉnh kiểm kê.
4. Nếu lỡ ghi nhầm:
   - Bấm vào giao dịch đó -> Nhấn nút **"Hoàn tác giao dịch & Khôi phục tồn kho"**.
   - Hệ thống sẽ trả lại số lượng tồn kho nguyên vẹn như trước khi ghi nhầm.

---

## 7. KẾT NỐI CƠ SỞ DỮ LIỆU ĐÁM MÂY SUPABASE (ONLINE 24/7)
1. Đăng ký tài khoản miễn phí tại: [https://supabase.com](https://supabase.com).
2. Tạo một Project mới (đặt tên ví dụ: `so-tay-ht`).
3. Vào mục **SQL Editor** trong Supabase:
   - Dán tệp `supabase_schema.sql` có sẵn trong thư mục ứng dụng vào và nhấn **Run**.
4. Vào mục **Project Settings** -> **API**:
   - Sao chép **Project URL** và **anon public key**.
5. Trong ứng dụng SỔ TAY HT, bấm biểu tượng **Cài đặt**:
   - Dán URL và Anon Key vào.
   - Bấm **"Kiểm tra kết nối"** -> Báo màu xanh là thành công!
   - Bấm **"Đồng bộ dữ liệu"** để đưa toàn bộ vật tư lên mây.

---

## 8. TRIỂN KHAI LÊN HOSTING (VERCEL / RENDER / RAILWAY / VPS)
- Dự án đã tích hợp sẵn máy chủ Node.js độc lập tại `server/index.js`.
- Lệnh chạy trên hosting:
  ```bash
  npm run build
  npm start
  ```
- Trên hosting, chỉ cần cấu hình biến môi trường `GEMINI_API_KEY` (hoặc `GROQ_API_KEY`) là toàn bộ tính năng ghi âm giọng nói sẽ hoạt động trên tất cả iPhone, Android và máy tính qua đường link HTTPS công khai!
