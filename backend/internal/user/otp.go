package user

import (
	"crypto/rand"
	"errors"
	"fmt"
	"sync"
	"time"
)

const otpExpireDuration = 5 * time.Minute

type OTPData struct {
	UserID    int64
	OTP       string
	ExpiresAt time.Time
}

var (
	otpStore = make(map[string]OTPData)
	otpMu    sync.RWMutex
)

// generateOTP สร้าง OTP 6 หลัก
func generateOTP() (string, error) {
	var number [6]byte

	for i := range number {
		var b [1]byte

		if _, err := rand.Read(b[:]); err != nil {
			return "", err
		}

		number[i] = b[0] % 10
	}

	return fmt.Sprintf(
		"%d%d%d%d%d%d",
		number[0],
		number[1],
		number[2],
		number[3],
		number[4],
		number[5],
	), nil
}

// เก็บ OTP
func saveOTP(phone string, userID int64, otp string) {
	otpMu.Lock()
	defer otpMu.Unlock()

	otpStore[phone] = OTPData{
		UserID:    userID,
		OTP:       otp,
		ExpiresAt: time.Now().Add(otpExpireDuration),
	}
}

// ตรวจสอบ OTP
func verifyOTP(phone string, otp string) (int64, error) {
	otpMu.RLock()
	data, exists := otpStore[phone]
	otpMu.RUnlock()

	if !exists {
		return 0, errors.New("ไม่พบ OTP กรุณาขอ OTP ใหม่")
	}

	if time.Now().After(data.ExpiresAt) {
		deleteOTP(phone)
		return 0, errors.New("OTP หมดอายุแล้ว กรุณาขอ OTP ใหม่")
	}

	if otp != data.OTP {
		return 0, errors.New("OTP ไม่ถูกต้อง")
	}

	// OTP ใช้ได้ครั้งเดียว
	deleteOTP(phone)

	return data.UserID, nil
}

// ลบ OTP
func deleteOTP(phone string) {
	otpMu.Lock()
	defer otpMu.Unlock()

	delete(otpStore, phone)
}

type VerifiedOTPData struct {
	UserID    int64
	ExpiresAt time.Time
}

var (
	verifiedOTPStore = make(map[string]VerifiedOTPData)
	verifiedOTPMu    sync.RWMutex
)

func saveVerifiedOTP(phone string, userID int64) {
	verifiedOTPMu.Lock()
	defer verifiedOTPMu.Unlock()

	verifiedOTPStore[phone] = VerifiedOTPData{
		UserID:    userID,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
}

func getVerifiedOTP(phone string) (int64, error) {
	verifiedOTPMu.RLock()
	data, exists := verifiedOTPStore[phone]
	verifiedOTPMu.RUnlock()

	if !exists {
		return 0, errors.New("กรุณายืนยัน OTP ก่อน")
	}

	if time.Now().After(data.ExpiresAt) {
		deleteVerifiedOTP(phone)
		return 0, errors.New("การยืนยัน OTP หมดอายุ กรุณาขอ OTP ใหม่")
	}

	return data.UserID, nil
}

func deleteVerifiedOTP(phone string) {
	verifiedOTPMu.Lock()
	defer verifiedOTPMu.Unlock()

	delete(verifiedOTPStore, phone)
}
