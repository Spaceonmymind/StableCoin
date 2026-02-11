package keeper

import (
	"context"

	"stbchain/x/stablecoin/types"
)

func (k Keeper) GetParams(ctx context.Context) (types.Params, error) {
	p, err := k.Params.Get(ctx)
	if err != nil {
		return types.DefaultParams(), err
	}
	return p, nil
}

func (k Keeper) SetParams(ctx context.Context, p types.Params) error {
	return k.Params.Set(ctx, p)
}
