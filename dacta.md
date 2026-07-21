TÀI LIỆU ĐẶC TẢ KIẾN TRÚC VÀ NGHIỆP VỤ HỆ THỐNG SPOTON (F&B O2O REAL-TIME SYSTEM)
Tài liệu này được thiết kế làm Blueprint kỹ thuật toàn diện cho AI Engine thiết kế Database Schema, xây dựng RESTful API và lập trình luồng WebSockets đồng bộ trạng thái thời gian thực cho dự án SpotOn.
I. KIẾN TRÚC HỆ THỐNG VÀ CƠ CHẾ XỬ LÝ ĐỒNG THỜI (CONCURRENCY PATTERNS)
1. Cơ chế khóa bàn hai giai đoạn (Two-Stage Locking via Redis)
Để giải quyết triệt để hiện tượng tranh chấp tài nguyên đồng thời (Race Condition) khi nhiều khách hàng cùng chọn một vị trí bàn tại một thời điểm, hệ thống triển khai cơ chế khóa phân tán qua Redis:
Giai đoạn 1 (Holding State): Khi khách hàng chọn bàn trên sơ đồ và chuyển tiếp đến bước chọn Menu, hệ thống khởi tạo một khóa với cú pháp lệnh SET table_lock_{branch_id}_{table_id} {customer_id} EX 600 NX. Khóa có hiệu lực trong vòng 10 phút (TTL = 600s). Nếu lệnh trả về null, hệ thống lập tức chặn và thông báo bàn đã bị giữ chỗ. Trạng thái hiển thị bàn trên UI sơ đồ của tất cả các máy khách khác sẽ chuyển sang màu vàng (Holding) thông qua cổng WebSockets.
Giai đoạn 2 (Pending Payment State): Khi khách hàng xác nhận danh sách món ăn Pre-order và bấm "Tiến hành thanh toán", hệ thống khởi tạo bản ghi đơn đặt bàn trong Database với trạng thái PENDING_PAYMENT. Đồng thời, hệ thống gia hạn thời gian khóa của các mã bàn liên quan trên Redis lên 15 phút thông qua lệnh EXPIRE table_lock_{branch_id}_{table_id} 900 để đảm bảo thời gian an toàn cho khách thực hiện giao dịch trên cổng thanh toán VNPay.
2. Mô hình truyền thông thời gian thực (Real-time Pub/Sub Architecture)
Hệ thống sử dụng kiến trúc WebSockets mã kết nối mở liên tục (Persistent Connections) để truyền tải trạng thái biến động của nhà hàng thay vì cơ chế Polling liên tục gây nghẽn Database:
Mạng lưới kết nối: Máy POS của Manager, Máy tính bảng (Tablet) của Waiter, Máy tính bảng của Điều phối viên Bếp (Coordinator), và Màn hình TV hiển thị của Đầu bếp (Chef KDS) đều kết nối chung vào một Socket Server được chia phòng (Room Clustering) theo định danh branch_{branch_id}.
Luồng dữ liệu sự kiện (Event-Driven Flow): Mọi thao tác cập nhật trạng thái đơn hàng, gọi thêm món từ iPad tại bàn, hay xác nhận ra đồ từ bếp đều kích hoạt một Event đẩy thẳng qua Socket Server để đồng bộ giao diện cho các thiết bị liên quan trong thời gian dưới 0.1 giây.
II. LUỒNG DỮ LIỆU TÀI CHÍNH VÀ TRẠNG THÁI BOOKING (STATE MACHINE)
1. Quy tắc ràng buộc dữ liệu tài chính (Financial Schema Rules)
Để đảm bảo tính minh bạch cho khâu kế toán và đối soát dòng tiền, dữ liệu tài chính trong bảng Bookings không được gộp chung mà phải phân tách thành các trường lưu trữ độc lập:
table_deposit_amount: Số tiền cọc bàn cố định, tự động tính toán dựa trên sức chứa hoặc phân loại phân khu bàn (Ví dụ: Khu VIP, Khu phòng máy lạnh, Khu sân vườn).
pre_order_total_amount: Tổng giá trị tiền của các món ăn khách đã chọn đặt trước ở giai đoạn Pre-order.
pre_order_deposit_amount: Số tiền cọc cho đồ ăn, mặc định bằng 50% của pre_order_total_amount để đảm bảo chi phí nguyên vật liệu (COGS) cho nhà hàng trong trường hợp bị hủy đơn muộn.
voucher_discount_amount: Số tiền được giảm sau khi áp dụng mã khuyến mãi.
total_deposit_paid: Tổng số tiền cọc thực tế khách hàng đã chuyển khoản thành công qua cổng thanh toán (table_deposit_amount + pre_order_deposit_amount - voucher_discount_amount). Trường này là bất biến sau khi đơn hàng đã chuyển sang trạng thái CONFIRMED.
final_bill_amount: Tổng hóa đơn cuối cùng phải thanh toán khi khách ra về, tính bằng công thức:
$$\text{Final Bill} = \text{Tổng tiền món Pre-order} + \text{Tổng tiền món gọi thêm tại bàn} - \text{Total Deposit Paid}$$
2. Vòng đời Trạng thái Đơn hàng (Booking Status State Machine)
[GUEST/CUSTOMER] -> (Create) -> PENDING_PAYMENT --(Thanh toán thất bại / Timeout 15p)--> CANCELLED_TIMEOUT
                                        |
                             (Thanh toán thành công)
                                        v
                                    CONFIRMED 
                                        |
                   +--------------------+--------------------+
                   | (Hủy đơn >= 6h)                         | (Check-in thực tế)
                   v                                         v
       CANCELLED_REFUND_PENDING                           IN_USE
                   |                                         | (Gọi thêm món / Thanh toán)
       (Admin upload ảnh UNC)                                v
                   |                                     COMPLETED
                   v
            REFUND_COMPLETED

III. DANH SÁCH ACTOR VÀ MA TRẬN USE CASE NÂNG CẤP
1. Actor: Guest (Khách vãng lai chưa đăng nhập account)
UC-01: Sign Up: Đăng ký tài khoản hệ thống qua Email/Mật khẩu hoặc Google OAuth.
UC-02: Read Articles & View Branch Info: Xem danh sách bài viết tin tức, thông tin địa chỉ, giờ mở cửa và menu của các chi nhánh mà không cần xác thực danh tính.
2. Actor: Customer (Khách hàng đã đăng nhập hệ thống)
UC-2.1: Update Profile & Preferences: Cập nhật thông tin cá nhân, lưu ý dị ứng thực phẩm, món ăn yêu thích phục vụ cho cá nhân hóa dịch vụ.
UC-2.2: View Booking History & Receipts: Truy xuất lịch sử các đơn đặt bàn, trạng thái xử lý cọc và xem các biên lai thanh toán điện tử cũ.
UC-2.3: Search Availability & View Table Map: Thực hiện truy vấn kiểm tra bàn trống thời gian thực dựa vào khung giờ, ngày và số lượng khách, đồng thời xem sơ đồ phân khu bàn của chi nhánh.
UC-2.4: Send Booking Request (Xử lý khóa bàn nâng cao): Kích hoạt luồng giữ bàn tạm thời trên Redis, đảm bảo độc quyền chiếm dụng tài nguyên bàn ăn trong khi hoàn thiện danh sách món ăn.
UC-2.5: Pay Deposit (Tích hợp VNPay Webhook): Thực hiện thanh toán cọc bảo đảm. Luồng xử lý ngầm (Webhook Listener) độc lập có trách nhiệm verify cấu trúc mã băm SHA512 để ghi nhận trạng thái đơn thành CONFIRMED.
UC-2.6: Cancel Booking & Refund Request (Tự động hóa chính sách hủy phạt):
Nghiệp vụ khó: Hệ thống tính toán khoảng cách thời gian giữa thời điểm hủy đơn và thời điểm check-in dự kiến:
Hủy trước 12 tiếng: Hoàn lại 100\% giá trị total_deposit_paid. Trạng thái chuyển thành CANCELLED_REFUND_PENDING.
Hủy từ 6 tiếng đến dưới 12 tiếng: Hoàn lại 50\% giá trị total_deposit_paid. Trạng thái chuyển thành CANCELLED_REFUND_PENDING.
Hủy dưới 6 tiếng: Hoàn lại 0\% (Phạt mất cọc toàn bộ). Trạng thái chuyển thành CANCELLED.
Đối với trường hợp được hoàn tiền, hệ thống kích hoạt gửi mã OTP về Email. Khách hàng bắt buộc nhập đúng mã OTP mới được điền Số tài khoản (STK), Tên ngân hàng để tạo lệnh yêu cầu hoàn tiền thủ công cho kế toán.
UC-2.7: Self-Ordering at Table (Gọi món tại bàn qua iPad): Dành cho khách ngồi tại quán. Khách hàng thêm món vào giỏ hàng. Khi bấm "Gửi Bếp", hệ thống kích hoạt chốt chặn hiển thị popup xác nhận điều khoản không thể hủy món sau khi gửi. Lệnh thực thi sẽ gửi trực tiếp một WebSockets Event xuống KDS bếp chi nhánh mà không cần thông qua bước Waiter duyệt để đẩy tốc độ vận hành lên tối đa.
UC-2.8: Submit Dining Review (Đánh giá sau bữa ăn):
Nghiệp vụ khó: Hệ thống thiết lập quy tắc chốt chặn nghiêm ngặt: Chỉ những tài khoản có ID gắn liền với bản ghi Booking mang trạng thái COMPLETED mới được mở quyền đánh giá. Khách hàng sau khi nhấn gửi bình luận và số sao đánh giá thì dữ liệu ghi xuống là bất biến, khách hàng không được quyền tự xóa bài đánh giá của chính mình để đảm bảo tính khách quan cho dữ liệu toàn hệ thống.
3. Actor: Waiter (Nhân viên phục vụ phân khu - Zone)
UC-W01: Manage Daily Booking List: Xem danh sách lịch trình đặt bàn phân bổ riêng cho Phân khu (Zone) mình được quản lý trong ca làm việc.
UC-W02: Update Table Status: Điều chỉnh trạng thái vật lý của bàn ăn (Trống, Đang dọn dẹp, Đã setup sẵn sàng) đồng bộ trực tiếp lên hệ thống Core để khách đặt online nhìn thấy dữ liệu phòng ốc sạch sẽ.
UC-W03: Send Additional Orders (Ghi món bổ sung): Hỗ trợ khách vãng lai hoặc khách không thao tác được trên iPad. Nhân viên chọn món trên máy POS cầm tay, hệ thống tự động nhận diện booking_id đang hoạt động của bàn đó để cộng dồn giá trị vào trường final_bill_amount, đồng thời phát Websockets event báo xuống KDS bếp làm đồ.
UC-W04: Mark Served (Xác nhận lên món và giải phóng màn hình bếp):
Nghiệp vụ khó: Khi Waiter nhận tín hiệu báo đồ ăn chín từ bếp, chạy vào quầy nhận đĩa thức ăn mang ra cho khách. Sau khi đặt đĩa đồ ăn xuống bàn khách, Waiter bắt buộc mở Tablet POS của mình bấm nút SERVED cho món đó. Lệnh này đổi trạng thái món trong Database, đồng thời bắn WebSockets gửi tín hiệu điều hướng quay ngược lại màn hình Smart TV của Đầu bếp nhằm lập tức xóa dòng hiển thị của món ăn đó đi, giúp màn hình bếp luôn gọn gàng, không bị tràn dòng chữ vào giờ cao điểm.
4. Actor: Coordinator / Checker (Điều phối viên bộ phận bếp)
UC-K03: Mark Ready & Undo (Xác nhận kiểm thử chất lượng món ăn tại quầy đồ ra):
Nghiệp vụ khó: Coordinator đứng cố định ở quầy ranh giới giữa Bếp và Sảnh ăn, tay khô ráo để điều khiển Tablet KDS. Khi đầu bếp nấu xong đĩa thức ăn đưa ra quầy ra đồ, Coordinator kiểm tra trang trí, định lượng. Nếu đạt chuẩn, chạm nút READY_TO_SERVE trên màn hình. Hệ thống lưu trạng thái vào DB và bắn Socket Notification phát chuông/rung đích danh đến thiết bị Tablet/Smartwatch của nhóm nhân viên Waiter đang được phân quyền trông coi Phân khu (Zone) chứa cái bàn đó.
Hệ thống thiết lập tính năng Undo: Trong vòng 30 giây sau khi bấm, nếu phát hiện bấm nhầm bàn hoặc món chưa thực sự hoàn thiện, Coordinator được bấm nút Hoàn tác để lùi trạng thái đơn đồ ăn về lại COOKING, hệ thống tự động thu hồi thông báo đã gửi cho Waiter để tránh nhân viên sảnh chạy vào lấy đồ "hụt".
5. Actor: Chef (Đầu bếp nhà hàng - Tác nhân Read-Only)
UC-K01: View Kitchen Queue (Theo dõi hàng đợi chế biến món ăn):
Nghiệp vụ khó: Đầu bếp chỉ tiếp cận thông tin thụ động thông qua màn hình Smart TV lớn treo trên cao trong bếp. Giao diện được thiết kế với độ tương phản cực cao (High Contrast). Hệ thống tự động kích hoạt cơ chế gộp các món ăn cùng loại của các bàn khác nhau lại thành một dòng lệnh tổng (Ví dụ: Bàn 2 gọi 1 cơm chiên, Bàn 5 gọi 2 cơm chiên, Bàn 9 gọi 2 cơm chiên -> Màn hình TV hiển thị: Tổng: 5 x Cơm chiên hải sản (Bàn: 2, 5, 9) để đầu bếp xào luôn một mẻ lớn cho tiết kiệm thời gian).
Hệ thống tự động chạy bộ đếm ngược SLA thời gian ra món của bếp: Món mới gọi dưới 10 phút hiển thị màu xanh lá, từ 10-20 phút chuyển chữ vàng cảnh báo, quá 20 phút chữ nhấp nháy đỏ báo động kẹt bếp để điều phối viên thúc giục nhân sự.
6. Actor: Branch Manager (Quản lý và vận hành tổng thể chi nhánh)
UC-M01: Input Walk-in Booking: Tiếp tiếp nhận khách vãng lai không đặt trước, kiểm tra sơ đồ bàn vật lý và tạo đơn đặt bàn trực tiếp tại quầy thu ngân.
UC-M02: Update Branch Menu & Manage Local Promos: Thực hiện ẩn các món ăn tạm thời hết nguyên liệu tại bếp chi nhánh, điều chỉnh khung biên độ giá trong khoảng cho phép của tổng chuỗi và cấu hình các chương trình giảm giá cục bộ cho chi nhánh.
UC-M03: View Branch Dashboard & Reply to Feedback: Theo dõi biểu đồ báo cáo doanh thu, mật độ lấp đầy bàn ăn theo giờ và trực tiếp viết phản hồi giải trình các khiếu nại, đánh giá 1-2 sao của khách tại chi nhánh mình quản lý.
UC-M04: Check-in & Device Binding (Thủ tục mở khóa iPad tại bàn):
Nghiệp vụ khó: Khi khách đặt bàn online đến quán đọc Số điện thoại, Manager bấm nút Check-in trên máy POS. Hệ thống đổi Booking sang IN_USE, Table sang OCCUPIED. Đồng thời, hệ thống phát tín hiệu WebSockets mang tên ACTIVATE_IPAD chứa dữ liệu gói tin bao gồm: Tên khách hàng, lời chào cá nhân hóa, danh sách món ăn đã Pre-order chuyển thẳng tới Socket Client ID của chiếc iPad đang được cấu hình IP tĩnh cố định tại vị trí bàn đó để thiết bị tự động mở khóa giao diện, chào mừng khách ngồi xuống ăn uống.
UC-M05: Modify Booking (Đặc quyền sửa đơn hàng của bên quản lý):
Nghiệp vụ khó: Khi khách đã ngồi vào bàn muốn gọi điện hoặc đổi món ăn, chỉ có Manager có quyền can thiệp chỉnh sửa trên hệ thống. Quy tắc vàng hệ thống: Giữ nguyên trường total_deposit_paid đã thu, không thực hiện hoàn cọc lắt nhắt hay bắt khách quét mã thanh toán thêm cọc online lần 2 gây phiền hà. Hệ thống tự động tính toán lại giá trị Menu mới, nếu bill mới lớn hơn cũ hoặc nhỏ hơn cũ, số tiền chênh lệch sẽ được tự động cộng/trừ thẳng vào biến final_bill_amount hiển thị trên màn hình thanh toán.
UC-M06: Moderate Branch Feedback (Quản lý bình luận chi nhánh):
Nghiệp vụ khó: Để đảm bảo tính trung thực của thương hiệu SpotOn, Branch Manager tuyệt đối không được cấp quyền xóa bất kỳ bình luận hay lượt đánh giá nào của khách hàng, kể cả bài viết bôi xấu hay đánh giá 1 sao. Manager chỉ được quyền xem chi tiết hóa đơn liên đới của bài đánh giá đó và thực hiện viết phản hồi (UC-M03). Nếu phát hiện bình luận vi phạm pháp luật hoặc chứa từ ngữ độc hại, Manager phải bấm nút Report để đẩy yêu cầu lên tầng Super Admin xử lý duyệt xóa.
UC-M07: Handle Overload Alerts (Ứng phó khủng hoảng kẹt bếp/thiên tai):
Nghiệp vụ khó: Khi phát hiện nhà hàng bị quá tải bàn ăn thực tế hoặc gặp sự cố bất khả kháng (Ví dụ: Phân khu sân ngoài trời bị dột do mưa lớn), Manager bấm nút kích hoạt trạng thái khẩn cấp: Đổi trạng thái chi nhánh thành FULL hoặc MAINTENANCE. Ngay lập tức, API của hệ thống lõi sẽ khóa toàn bộ các luồng tìm kiếm và ẩn nút đặt bàn của chi nhánh này trên tất cả các thiết bị App/Web của người dùng Customer bên ngoài để ngăn chặn việc phát sinh thêm đơn đặt bàn mới.
UC-M08: Checkout (Thủ tục đóng bàn và in hóa đơn): Khi khách bấm yêu cầu tính tiền trên iPad tại bàn, màn hình POS của Manager hiện thông báo. Thu ngân bấm xác nhận thanh toán, hệ thống chốt số tiền cuối cùng cần thu của khách sau khi đã khấu trừ tiền cọc. Bấm hoàn tất giao dịch, trạng thái Booking đổi sang COMPLETED, Table chuyển về AVAILABLE và phát tín hiệu WebSockets ép chiếc iPad tại bàn xóa sạch session đăng nhập của khách cũ, quay trở lại màn hình nền chờ (Screensaver) của nhà hàng.
7. Actor: Admin (Quản trị viên tối cao của toàn chuỗi hệ thống)
UC-A01: Master Data Management: Cấu hình toàn bộ danh mục cây Menu tổng, quản lý danh sách chi nhánh, phê duyệt cấp tài khoản và phân quyền Role cho nhân sự cấp dưới (Manager, Waiter, Thu ngân) theo từng cơ sở cụ thể.
UC-A02: Configure System & View Chain Dashboard: Tinh chỉnh các tham số cấu hình hệ thống ngầm (Ví dụ: Thời gian giữ bàn Redis, tỷ lệ % phạt tiền khi hủy đơn, cài đặt cấu hình thông số kết nối Email SMTP). Theo dõi báo cáo doanh thu, dữ liệu khách hàng trung thành trên toàn hệ thống chuỗi.
UC-A03: Oversee Chain Feedback & Moderation (Cơ chế bộ lọc đánh giá tối cao):
Nghiệp vụ khó: Admin sở hữu một giao diện quản lý Feedback tập trung của tất cả các chi nhánh. Khác với Manager, Admin là Actor duy nhất trong hệ thống có đặc quyền bấm nút Xóa (Delete) vĩnh viễn bài đánh giá và bình luận của khách hàng ra khỏi hệ thống cơ sở dữ liệu công khai. Quyền này chỉ được thực thi sau khi Admin thẩm định các đơn khiếu nại (Report) từ các chi nhánh gửi lên, xác minh bình luận chứa nội dung bôi nhọ, từ ngữ thô tục vô căn cứ hoặc vi phạm chính sách cộng đồng của chuỗi F&B. Mọi hành động xóa bình luận của Admin bắt buộc phải được ghi nhận vào bảng hệ thống lưu trữ lịch sử nhật ký hoạt động (Audit Logs) để kiểm soát nội bộ.
8. Actor: System / Worker (Tác nhân hệ thống tự động xử lý ngầm)
UC-S01: Delayed Auto-Unlock Table (Dọn dẹp rác bộ nhớ đệm chống kẹt bàn): Hệ thống tích hợp một hàng đợi xử lý tác vụ trễ (Delayed Task Queue như BullMQ hoặc cơ chế lắng nghe Expired Event __keyevent@0__:expired của Redis). Khi hết thời gian 15 phút đếm ngược của giai đoạn thanh toán cọc mà luồng Webhook VNPay chưa trả về kết quả thành công, hệ thống tự động quét DB. Nếu trạng thái đơn vẫn là PENDING_PAYMENT, Worker sẽ cập nhật Booking sang trạng thái CANCELLED_TIMEOUT, đồng thời giải phóng mã bàn ăn về trạng thái AVAILABLE trên sơ đồ hệ thống.
UC-S02: Auto-Cancel No-show Bookings (Chống chiếm dụng tài nguyên bàn vật lý): Hệ thống chạy một Cronjob tự động quét cơ sở dữ liệu định kỳ mỗi 5 phút một lần. Nếu một đơn đặt bàn đã ở trạng thái CONFIRMED, nhưng thời gian khách đăng ký đến quán đã quá 30 phút (Grace Period) mà Manager chưa bấm thủ tục Check-in trên máy POS, hệ thống sẽ tự động chuyển trạng thái đơn hàng sang mã NO_SHOW. Khách hàng bị phạt mất cọc $100\%$ số tiền đã đóng, vị trí bàn ăn vật lý lập tức được giải phóng trở về trạng thái AVAILABLE để nhường quyền sử dụng cho khách vãng lai (Walk-in) tại quán.
IV. QUY TRÌNH PHỐI HỢP CÁC BỘ PHẬN TRONG GIỜ CAO ĐIỂM (OPERATIONAL WORKFLOW)
Khách hàng đặt bàn từ nhà vượt qua 2 lớp khóa bảo vệ dữ liệu của System Worker (UC-C11), thực hiện chuyển khoản thành công qua VNPay (UC-C12) -> Hệ thống xác nhận giữ chỗ an toàn (CONFIRMED).
Khách đến quán, Manager thực hiện thủ tục Check-in (UC-M04), hệ thống đẩy toàn bộ danh sách món ăn Pre-order xuống Chef KDS (UC-K01) và tự động mở khóa màn hình chiếc iPad đặt tại bàn ăn vật lý đó.
Trong bữa ăn, Khách hàng tự gọi thêm đồ uống qua màn hình iPad tại bàn (UC-C14), dữ liệu món mới tự động đồng bộ thời gian thực nhảy số tiền trên máy của Manager (UC-M05) và hiển thị nhấp nháy trên màn hình Smart TV của các Đầu bếp để chế biến món ăn.
Món ăn nấu xong đưa ra quầy, Coordinator kiểm tra chất lượng thức ăn đạt chuẩn rồi nhấn Tablet phát tín hiệu (UC-K02), thiết bị của Waiter phân khu báo chuông, nhân viên chạy vào quầy lấy đĩa thức ăn mang ra phục vụ bàn khách.
Waiter đặt đồ ăn xuống bàn và bấm xác nhận trên thiết bị POS cầm tay (UC-W04), luồng dữ liệu truyền ngược lại xóa dòng văn bản hiển thị trên màn hình Smart TV của nhà bếp để đầu bếp tập trung nấu các món tiếp theo.
Khách ăn xong, Manager bấm chốt thanh toán hóa đơn (UC-M08), in hóa đơn VAT, reset trạng thái bàn về sạch sẽ và khóa thiết bị iPad chờ lượt phục vụ tiếp theo. Khách hàng sau khi rời quán sẽ mở thiết bị cá nhân để viết bài đánh giá chất lượng bữa ăn (UC-C15), dữ liệu được quản lý chéo nghiêm ngặt giữa Manager (UC-M06) và Admin (UC-A08) để bảo vệ độ uy tín cho thương hiệu nhà hàng.

