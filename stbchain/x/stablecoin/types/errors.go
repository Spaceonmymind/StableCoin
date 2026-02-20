package types

// DONTCOVER

import (
	"cosmossdk.io/errors"
)

// x/stablecoin module sentinel errors
var (
	ErrPaused           = errors.Register(ModuleName, 1, "stablecoin module is paused")
	ErrNotIssuer        = errors.Register(ModuleName, 2, "not issuer")
	ErrInvalidAmount    = errors.Register(ModuleName, 3, "invalid amount")
	ErrInvalidDenom     = errors.Register(ModuleName, 4, "invalid denom")
	ErrInvalidIssuer    = errors.Register(ModuleName, 5, "invalid issuer")
	ErrInvalidSigner    = errors.Register(ModuleName, 6, "invalid signer")
	ErrInvalidMaxSupply = errors.Register(ModuleName, 7, "invalid max supply")
)
