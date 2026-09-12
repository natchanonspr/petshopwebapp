package user

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func RegisterUser(req *UserRegister) error {
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return err
	}

	u := &User{
		Username: req.Username,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: string(hashedPassword),
		Role:     "user",
	}

	return CreateUser(u)
}

func LoginWithLine(req *LineLoginRequest) (string, error) {
	if req.LineUserID == "" {
		return "", errors.New("missing line_user_id")
	}

	existing := new(User)
	result := db.Where("line_user_id = ?", req.LineUserID).First(existing)

	var u *User
	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", result.Error
		}
		lineID := req.LineUserID
		u = &User{
			Username:   req.DisplayName,
			LineUserID: &lineID,
			PictureURL: req.PictureURL,
			Role:       "user",
		}
		if err := CreateUser(u); err != nil {
			return "", err
		}
	} else {
		existing.Username = req.DisplayName
		existing.PictureURL = req.PictureURL
		if err := db.Save(existing).Error; err != nil {
			return "", err
		}
		u = existing
	}

	return signToken(u.UserID, u.Role)
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

	result := db.Where("phone = ?", req.Phone).First(selectedUser)
	if result.Error != nil {
		return "", result.Error
	}

	//ตรวจสอบ password
	err :=
		bcrypt.CompareHashAndPassword(
			[]byte(selectedUser.Password),
			[]byte(req.Password),
		)
	if err != nil {
		return "", err
	}

	return signToken(selectedUser.UserID, selectedUser.Role)
}
