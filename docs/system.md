Bạn là một senior fullstack architect + senior backend engineer + senior frontend engineer + DevOps engineer.

Tôi muốn xây dựng một dự án AI chatbot/AI agent hoàn chỉnh chạy thực tế trên VPS của tôi.

## Mục tiêu dự án
Xây dựng một hệ thống web app AI có:
- frontend cho người dùng đăng ký, đăng nhập, chat với AI
- backend quản lý user, auth, quota, conversation, agent jobs
- chỉ user đã đăng ký và đăng nhập thành công mới được sử dụng AI
- backend giữ API key AI, frontend không được gọi trực tiếp tới OpenAI/Gemini
- hỗ trợ chat nhiều model trong tương lai
- có thể mở rộng agent cho GitHub/repo/code tasks về sau
- deploy thực tế lên VPS với domain riêng

## Công nghệ mong muốn
- Frontend: Next.js
- Backend: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Cache / rate limit / queue: Redis
- Reverse proxy: Nginx
- Containerization: Docker + Docker Compose
- AI provider: ưu tiên Gemini hoặc OpenAI qua backend
- Auth: JWT access token + refresh token bằng httpOnly cookie
- Có thể bổ sung email verification
- Có thể bổ sung GitHub integration ở phase sau

## Yêu cầu kiến trúc
Thiết kế hệ thống theo hướng production-ready, clean architecture, dễ mở rộng, bảo mật tốt.

Bắt buộc đảm bảo:
1. User phải đăng ký tài khoản với hệ thống của tôi
2. User phải đăng nhập mới được dùng AI
3. Tất cả request AI phải đi qua backend của tôi
4. API key của AI chỉ nằm ở backend/server
5. Frontend không bao giờ được chứa API key AI
6. Có cơ chế quota/rate limit để tránh spam
7. Có lưu conversation history và messages
8. Có thể mở rộng thêm agent jobs trong tương lai
9. Có role user/admin
10. Có thiết kế rõ ràng giữa MVP và phase nâng cao

## Tôi muốn bạn làm theo thứ tự sau

### Phần 1: Phân tích yêu cầu
- Phân tích business flow của hệ thống
- Xác định actor, use cases
- Xác định luồng đăng ký, đăng nhập, chat AI, logout, refresh token, history
- Giải thích tại sao phải để backend gọi AI thay vì frontend

### Phần 2: Thiết kế kiến trúc tổng thể
Hãy mô tả đầy đủ:
- high-level architecture
- luồng request từ frontend -> backend -> AI provider
- luồng auth
- luồng conversation/message
- luồng quota/rate limit
- luồng admin quản lý user
- luồng future agent

Vẽ sơ đồ dạng text/ascii rõ ràng.

### Phần 3: Thiết kế database chi tiết
Hãy đề xuất schema PostgreSQL đầy đủ cho các bảng sau (và thêm bảng nếu cần):
- users
- refresh_tokens hoặc user_sessions
- roles / permissions nếu cần
- plans
- user_subscriptions
- conversations
- messages
- usage_logs
- agent_runs
- email_verifications
- password_resets
- github_connections (nếu cần cho phase sau)

Với mỗi bảng, hãy nêu:
- mục đích
- các cột
- kiểu dữ liệu gợi ý
- primary key
- foreign key
- index nên tạo
- các unique constraints

Sau đó hãy viết Prisma schema đầy đủ.

### Phần 4: Thiết kế backend NestJS
Hãy thiết kế chi tiết module backend:
- AppModule
- AuthModule
- UsersModule
- ChatModule
- ConversationsModule
- MessagesModule
- UsageModule
- AgentModule
- AdminModule
- ConfigModule
- PrismaModule
- RedisModule

Yêu cầu:
- giải thích nhiệm vụ từng module
- gợi ý folder structure chuẩn, rõ ràng, dễ maintain
- đề xuất DTOs, Guards, Interceptors, Decorators, Services, Repositories
- tách layer hợp lý
- đưa ra best practices bảo mật

### Phần 5: Thiết kế auth hoàn chỉnh
Tôi muốn auth chuẩn production:
- register
- login
- logout
- refresh token
- get current user
- optional email verification
- forgot password
- reset password

Yêu cầu:
- password hash bằng bcrypt/argon2
- refresh token phải lưu hash trong DB
- access token sống ngắn
- refresh token sống dài hơn
- dùng httpOnly cookie nếu phù hợp
- giải thích vì sao không nên lưu access token trong localStorage nếu có rủi ro
- có route guard cho các route cần đăng nhập

Hãy mô tả chi tiết flow auth.

### Phần 6: Thiết kế API contract
Hãy liệt kê API REST đầy đủ, ví dụ:
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- GET /auth/me
- POST /chat/send
- GET /conversations
- GET /conversations/:id/messages
- DELETE /conversations/:id
- POST /agents/run
- GET /agents/runs
- GET /admin/users
- PATCH /admin/users/:id/status
...

Với mỗi endpoint, hãy mô tả:
- mục đích
- auth required hay không
- request body
- response body
- error cases
- status codes

### Phần 7: Thiết kế luồng chat AI
Tôi muốn user chat với AI theo kiểu ChatGPT-like.

Yêu cầu:
- mỗi user có nhiều conversations
- mỗi conversation có nhiều messages
- message có role: system/user/assistant/tool
- backend nhận prompt từ frontend
- backend kiểm tra auth + quota + plan + trạng thái user
- backend gọi AI provider
- backend lưu toàn bộ message vào DB
- backend trả response về frontend
- hỗ trợ streaming ở phase nâng cao

Hãy mô tả:
- luồng xử lý chi tiết
- cách lưu messages
- cách đặt title conversation
- cách quản lý model_name/provider
- cách log token usage / estimated cost

### Phần 8: Thiết kế quota / rate limit / plans
Tôi muốn có free plan và có thể mở rộng pro plan.

Ví dụ:
- free: giới hạn số lượt chat/ngày hoặc tháng
- pro: nhiều lượt hơn, mở model cao cấp hơn
- admin có thể khóa quyền AI của user

Hãy thiết kế:
- bảng dữ liệu liên quan
- logic check quota trước khi gọi AI
- rate limit tránh spam
- cách reset quota theo ngày/tháng
- cách log usage để sau này tính billing

### Phần 9: Thiết kế frontend Next.js
Tôi muốn frontend có các trang:
- landing page
- register page
- login page
- chat page
- conversation history sidebar
- profile page
- admin page cơ bản (nếu role admin)
- logout

Yêu cầu:
- cấu trúc thư mục frontend rõ ràng
- dùng app router
- gợi ý state management
- cách xử lý auth guard ở frontend
- cách gọi API backend
- cách lưu trạng thái user hiện tại
- UI chat cơ bản giống ChatGPT

### Phần 10: Thiết kế bảo mật
Hãy liệt kê đầy đủ security checklist:
- password hashing
- CSRF/XSS/CORS
- httpOnly cookie
- secure cookie
- rate limiting
- input validation
- audit log
- secret management
- API key management
- Redis security
- PostgreSQL security
- Nginx security headers
- brute force protection
- banning/suspending users

### Phần 11: Thiết kế deploy lên VPS
Bối cảnh thực tế:
- Tôi có domain riêng
- Tôi có VPS Linux
- Tôi muốn deploy bằng Docker Compose
- Reverse proxy bằng Nginx
- SSL bằng Let's Encrypt
- Dùng environment variables
- Có database, redis, backend, frontend

Hãy đưa ra:
- docker-compose.yml hoàn chỉnh
- cấu trúc thư mục deploy
- file .env mẫu
- Nginx config mẫu
- quy trình deploy từng bước
- quy trình update version
- quy trình backup database
- log monitoring cơ bản

### Phần 12: Thiết kế phase agent tương lai
Trong tương lai tôi muốn thêm:
- AI agent chạy tác vụ dài
- GitHub integration
- đọc repo
- tạo PR
- chạy code task

Hãy thiết kế ngay từ bây giờ để sau này dễ mở rộng:
- agent_runs table
- jobs/queue design
- event-driven flow
- status tracking
- background workers
- GitHub OAuth hoặc PAT design

### Phần 13: Folder structure hoàn chỉnh
Hãy đề xuất:
- folder structure cho backend NestJS
- folder structure cho frontend Next.js
- folder structure cho deploy/infrastructure

### Phần 14: Roadmap triển khai
Hãy chia roadmap thành:
- MVP
- Phase 2
- Phase 3

Ví dụ:
- MVP: auth + basic chat + conversation history
- Phase 2: quota + admin + email verification
- Phase 3: agent + GitHub + billing

### Phần 15: Output format
Tôi muốn câu trả lời:
- cực kỳ chi tiết
- có cấu trúc rõ ràng
- không trả lời chung chung
- có ví dụ thực tế
- có code mẫu khi cần
- có sơ đồ ascii
- có bảng khi cần
- có Prisma schema đầy đủ
- có API contract rõ ràng
- có Docker Compose mẫu
- có Nginx config mẫu
- có checklist production readiness

## Điều rất quan trọng
- Không được đề xuất frontend gọi trực tiếp OpenAI/Gemini
- Không được để lộ API key ra client
- Không thiết kế kiểu chỉ login giao diện nhưng API chat lại public
- Tất cả AI usage phải đi qua backend của tôi
- Chỉ user đã đăng nhập mới được dùng AI
- Hãy luôn ưu tiên kiến trúc thực tế, dễ code, dễ deploy, dễ mở rộng

Bây giờ hãy bắt đầu từ Phần 1 và làm toàn bộ thật chi tiết.