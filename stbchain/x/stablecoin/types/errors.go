package types

// DONTCOVER

import (
	"cosmossdk.io/errors"
)

// x/stablecoin module sentinel errors
var (
	ErrInvalidSigner = errors.Register(ModuleName, 1100, "expected gov account as only signer for proposal message")
	ErrPaused        = errors.Register(ModuleName, 1, "stablecoin module is paused")
	ErrNotIssuer     = errors.Register(ModuleName, 2, "not issuer")
	ErrInvalidAmount = errors.Register(ModuleName, 3, "invalid amount")
	ErrInvalidDenom  = errors.Register(ModuleName, 4, "invalid denom")
	ErrInvalidIssuer = errors.Register(ModuleName, 5, "invalid issuer")
)
