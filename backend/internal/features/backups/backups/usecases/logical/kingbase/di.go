package usecases_logical_kingbase

import (
	"databasus-backend/internal/features/encryption/secrets"
	"databasus-backend/internal/util/encryption"
	"databasus-backend/internal/util/logger"
)

var createKingbaseBackupUsecase = &CreateKingbaseBackupUsecase{
	logger.GetLogger(),
	secrets.GetSecretKeyService(),
	encryption.GetFieldEncryptor(),
}

func GetCreateKingbaseBackupUsecase() *CreateKingbaseBackupUsecase {
	return createKingbaseBackupUsecase
}
