# Backend API Contract Documentation

The Express server listens on port `5000` by default. The API versioning base is `/api/v1`.

## Endpoints Summary

### 1. Authentication
- `POST /api/v1/auth/customer/send-otp`: Request customer OTP verification code.
- `POST /api/v1/auth/customer/login`: Verify OTP and return JWT access token and session cookie.
- `POST /api/v1/auth/customer/register`: Register new customer with OTP.
- `POST /api/v1/auth/worker/send-otp`: Request worker OTP.
- `POST /api/v1/auth/worker/login`: Verify OTP and login.
- `POST /api/v1/auth/worker/register`: Register new worker.

### 2. Jobs Management
- `POST /api/v1/jobs`: Create new job matching request (Customer).
- `GET /api/v1/jobs`: List customer's created jobs.
- `GET /api/v1/jobs/:id`: View details of a specific job.
- `POST /api/v1/jobs/worker/matches/:matchId/respond`: Accept or decline matching invite (Worker).
