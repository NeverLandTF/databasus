package usecases_kingbase

import (
	"databasus-backend/internal/features/encryption/secrets"
	"databasus-backend/internal/util/logger"
)

var restoreKingbaseBackupUsecase = &RestoreKingbaseBackupUsecase{
	logger.GetLogger(),
	secrets.GetSecretKeyService(),
}

func GetRestoreKingbaseBackupUsecase() *RestoreKingbaseBackupUsecase {
	return restoreKingbaseBackupUsecase
}
