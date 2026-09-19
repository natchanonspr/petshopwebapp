package user

import (
	"errors"
	"net/mail"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrEmptyUsername = errors.New("กรุณากรอกชื่อผู้ใช้")
	ErrInvalidEmail  = errors.New("รูปแบบอีเมลไม่ถูกต้อง")
	ErrInvalidPhone  = errors.New("รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง")
	ErrShortPassword = errors.New("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
)

func validateUserFields(username string, email string, phone string) (string, string, string, error) {
	username = strings.TrimSpace(username)
	email = strings.TrimSpace(strings.ToLower(email))
	phone = strings.TrimSpace(phone)

	if username == "" {
		return "", "", "", ErrEmptyUsername
	}

	if email == "" {
		return "", "", "", errors.New("กรุณากรอกอีเมล")
	}

	// ตรวจรูปแบบ email
	parsedEmail, err := mail.ParseAddress(email)
	if err != nil || parsedEmail.Address != email {
		return "", "", "", ErrInvalidEmail
	}

	// เบอร์ไทย 10 หลัก
	phoneRegex := regexp.MustCompile(`^0[0-9]{9}$`)
	if !phoneRegex.MatchString(phone) {
		return "", "", "", ErrInvalidPhone
	}

	return username, email, phone, nil
}

func validatePassword(password string) error {
	if password == "" {
		return errors.New("กรุณากรอกรหัสผ่าน")
	}

	if len(password) < 6 {
		return ErrShortPassword
	}

	return nil
}

func RegisterUser(req *UserRegister) error {
	if req == nil {
		return errors.New("ข้อมูลไม่ถูกต้อง")
	}

	username, email, phone, err := validateUserFields(req.Username, req.UserEmail, req.UserPhone)
	if err != nil {
		return err
	}

	if err := validatePassword(req.UserPassword); err != nil {
		return err
	}

	req.Username = username
	req.UserEmail = email
	req.UserPhone = phone

	var existing User
	// ตรวจเบอร์ซ้ำ
	if result := db.Where("user_phone = ?", req.UserPhone).First(&existing); result.Error == nil {
		return errors.New("เบอร์โทรนี้ถูกใช้งานแล้ว")
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return result.Error
	}

	// ตรวจเมลซ้ำ
	if result := db.Where("LOWER(user_email) = LOWER(?)", req.UserEmail).First(&existing); result.Error == nil {
		return errors.New("อีเมลนี้ถูกใช้งานแล้ว")
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return result.Error
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.UserPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return err
	}

	u := &User{
		Username:     req.Username,
		UserEmail:    req.UserEmail,
		UserPhone:    req.UserPhone,
		UserPassword: string(hashedPassword),
		UserRole:     "user",
	}

	return CreateUser(u)
}

func LoginWithLine(req *LineLoginRequest) (string, error) {
	if req.UserLineID == "" {
		return "", errors.New("missing user_line_id")
	}

	existing := new(User)
	result := db.Where("user_line_id = ?", req.UserLineID).First(existing)

	var u *User
	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", result.Error
		}
		lineID := req.UserLineID
		u = &User{
			Username:       req.DisplayUserName,
			UserLineID:     &lineID,
			UserPictureURL: req.UserPictureURL,
			UserRole:       "user",
		}
		if err := CreateUser(u); err != nil {
			return "", err
		}
	} else {
		u = existing
	}

	return signToken(u.UserID, u.UserRole)
}

func signToken(userID int64, role string) (string, error) {
	jwtSecretKey := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if jwtSecretKey == "" {
		return "", errors.New("JWT_SECRET is not configured")
	}

	if userID <= 0 {
		return "", errors.New("invalid user id")
	}

	if role != "user" && role != "admin" {
		return "", errors.New("invalid role")
	}

	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = userID
	claims["role"] = role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	return token.SignedString([]byte(jwtSecretKey))
}

func LoginUser(req *UserLogin) (string, error) {
	if req == nil {
		return "", errors.New("ข้อมูลไม่ถูกต้อง")
	}

	req.UserPhone = strings.TrimSpace(req.UserPhone)

	if req.UserPhone == "" || req.UserPassword == "" {
		return "", errors.New("กรุณากรอกเบอร์โทรและรหัสผ่าน")
	}
	//หา user ผ่านเบอร์โทร
	selectedUser := new(User)

	result := db.Where("user_phone = ?", req.UserPhone).First(selectedUser)
	if result.Error != nil {
		return "", result.Error
	}

	//ตรวจสอบ password
	err :=
		bcrypt.CompareHashAndPassword(
			[]byte(selectedUser.UserPassword),
			[]byte(req.UserPassword),
		)
	if err != nil {
		return "", err
	}

	return signToken(selectedUser.UserID, selectedUser.UserRole)
}

// ส่วน Profile
func GetProfileService(userID int64) (*User, error) {
	return GetUserByID(userID)
}

func UpdateProfileService(userID int64, req *UpdateProfileRequest) (*User, error) {
	user, err := GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	if req == nil {
		return nil, errors.New("ข้อมูลไม่ถูกต้อง")
	}

	username := strings.TrimSpace(req.Username)
	email := strings.TrimSpace(strings.ToLower(req.UserEmail))
	phone := strings.TrimSpace(req.UserPhone)

	if username == "" {
		return nil, ErrEmptyUsername
	}

	if email == "" {
		return nil, errors.New("กรุณากรอกอีเมล")
	}

	// ตรวจเมล
	parsedEmail, err := mail.ParseAddress(email)
	if err != nil || parsedEmail.Address != email {
		return nil, ErrInvalidEmail
	}

	// ตรวจเบอร์
	if phone != "" {
		phoneRegex := regexp.MustCompile(`^0[0-9]{9}$`)

		if !phoneRegex.MatchString(phone) {
			return nil, ErrInvalidPhone
		}

		var existing User
		if result := db.Where("user_phone = ? AND user_id <> ?", phone, userID).First(&existing); result.Error == nil {
			return nil, errors.New("เบอร์โทรนี้ถูกใช้งานแล้ว")
		} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
	}

	//ตรวจอีเมลซ่้ำ
	var existing User
	if result := db.Where("LOWER(user_email) = LOWER(?) AND user_id <> ?", email, userID).First(&existing); result.Error == nil {
		return nil, errors.New("อีเมลนี้ถูกใช้งานแล้ว")
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, result.Error
	}

	user.Username = username
	user.UserEmail = email
	user.UserPictureURL = strings.TrimSpace(req.UserPictureURL)

	if phone != "" {
		user.UserPhone = phone
	}

	if err := UpdateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func ChangePasswordService(userID int64, req *ChangePasswordRequest) error {
	if req == nil {
		return errors.New("ข้อมูลไม่ถูกต้อง")
	}

	if err := validatePassword(req.NewPassword); err != nil {
		return err
	}

	user, err := GetUserByID(userID)
	if err != nil {
		return err
	}

	if user.UserPassword == "" {
		return errors.New("บัญชีนี้ไม่มีรหัสผ่าน")
	}

	// เช็ครหัสเดิม
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.UserPassword),
		[]byte(req.OldPassword),
	); err != nil {
		return errors.New("รหัสผ่านเดิมไม่ถูกต้อง")
	}

	// ไม่ให้ใช้ password เดิมซ้ำ
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.UserPassword),
		[]byte(req.NewPassword),
	); err == nil {
		return errors.New("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.NewPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return err
	}

	return UpdatePassword(userID, string(hashedPassword))
}

// Admin : ดูผู้ใช้งานทั้งหมด
func AdminListUsers() ([]User, error) {
	var users []User

	err := db.
		Order("created_at desc").
		Find(&users).Error

	return users, err
}

// Admin : ดูผู้ใช้งานคนเดียว
func AdminGetUser(userID int64) (*User, error) {
	var user User

	err := db.
		Where("user_id = ?", userID).
		First(&user).Error

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// Admin : ลบบัญชีผู้ใช้
func AdminDeleteUser(userID int64) error {
	return db.Delete(&User{}, userID).Error
}

// Admin : ปรับเปลี่ยน Role
func AdminUpdateUserRole(userID int64, role string) (*User, error) {
	if role != "user" && role != "admin" {
		return nil, errors.New("role ไม่ถูกต้อง")
	}

	user, err := AdminGetUser(userID)
	if err != nil {
		return nil, err
	}

	if role == "user" && user.UserRole == "admin" {
		var adminCount int64

		if err := db.
			Model(&User{}).
			Where("user_role = ?", "admin").
			Count(&adminCount).
			Error; err != nil {
			return nil, err
		}

		if adminCount <= 1 {
			return nil, errors.New(
				"ต้องมี Admin อย่างน้อย 1 คน",
			)
		}
	}

	user.UserRole = role

	if err := db.
		Model(user).
		Update("user_role", role).
		Error; err != nil {
		return nil, err
	}

	return user, nil
}

func ForgotPassword(phone string) (string, error) {
	phone = strings.TrimSpace(phone)

	// ตรวจสอบรูปแบบเบอร์โทร
	if !regexp.MustCompile(`^0[0-9]{9}$`).MatchString(phone) {
		return "", ErrInvalidPhone
	}

	var u User
	result := db.Where("user_phone = ?", phone).First(&u)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", errors.New("ไม่พบบัญชีจากเบอร์โทรนี้")
		}
		return "", result.Error
	}

	otp, err := generateOTP()
	if err != nil {
		return "", err
	}
	saveOTP(phone, u.UserID, otp)
	return otp, nil
}

func VerifyPasswordResetOTP(phone string, otp string) error {
	phone = strings.TrimSpace(phone)
	otp = strings.TrimSpace(otp)

	if phone == "" || otp == "" {
		return errors.New("กรุณากรอกเบอร์โทรและ OTP")
	}

	userID, err := verifyOTP(phone, otp)
	if err != nil {
		return err
	}

	saveVerifiedOTP(phone, userID)

	return nil
}

func ResetPasswordService(phone string, newPassword string) error {
	phone = strings.TrimSpace(phone)

	userID, err := getVerifiedOTP(phone)
	if err != nil {
		return err
	}

	if err := validatePassword(newPassword); err != nil {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(newPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return err
	}

	if err := UpdatePassword(userID, string(hashedPassword)); err != nil {
		return err
	}

	// ใช้สิทธิ์ยืนยัน OTP ไปแล้ว
	deleteVerifiedOTP(phone)

	return nil
}
