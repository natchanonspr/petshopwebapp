package user

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func RegisterUser(req *UserRegister) error {
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
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = userID
	claims["role"] = role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	jwtSecretKey := os.Getenv("JWT_SECRET")
	return token.SignedString([]byte(jwtSecretKey))
}

func LoginUser(req *UserLogin) (string, error) {
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
type UpdateProfileRequest struct {
	Username       string `json:"username"`
	UserEmail      string `json:"email"`
	UserPhone      string `json:"phone"`
	UserPictureURL string `json:"picture_url"`
}

func GetProfileService(userID int64) (*User, error) {
	return GetUserByID(userID)
}

func UpdateProfileService(
	userID int64,
	req *UpdateProfileRequest,
) (*User, error) {

	user, err := GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	user.Username = req.Username
	user.UserEmail = req.UserEmail
	user.UserPhone = req.UserPhone
	user.UserPictureURL = req.UserPictureURL

	if err := UpdateUser(user); err != nil {
		return nil, err
	}

	return user, nil
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
