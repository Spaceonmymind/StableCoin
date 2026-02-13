package types

import (
	"strings"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

const (
	DefaultDenom  = "ustb"
	DefaultPaused = false
	DefaultIssuer = "cosmos1w30uyzhc0p88qt4udq58zjr8g6k6gthvu0x4z6"
)

// NewParams creates a new Params instance.
func NewParams(issuer, denom string, paused bool) Params {
	return Params{
		Issuer: issuer,
		Denom:  denom,
		Paused: paused,
	}
}

func DefaultParams() Params {
	return Params{
		Issuer: "cosmos19jvll7zgcj6fafavwa8e5gns77shtt8dr430g8", // alice
		Denom:  "ustb",
		Paused: false,
	}
}

// Validate validates the set of params.
func (p Params) Validate() error {
	// denom
	if strings.TrimSpace(p.Denom) == "" {
		return ErrInvalidDenom
	}

	// issuer
	if strings.TrimSpace(p.Issuer) == "" {
		return ErrInvalidIssuer
	}
	if _, err := sdk.AccAddressFromBech32(p.Issuer); err != nil {
		return ErrInvalidIssuer
	}

	return nil
}
