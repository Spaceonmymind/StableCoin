package keeper

import (
	"cosmossdk.io/math"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"stbchain/x/stablecoin/types"
)

func (k Keeper) GetTotalSupply(ctx sdk.Context) math.Int {
	store := k.storeService.OpenKVStore(ctx)

	bz, err := store.Get(types.TotalSupplyKey)
	if err != nil || bz == nil {
		return math.ZeroInt()
	}

	amount, ok := math.NewIntFromString(string(bz))
	if !ok {
		return math.ZeroInt()
	}

	return amount
}

func (k Keeper) SetTotalSupply(ctx sdk.Context, amount math.Int) {
	store := k.storeService.OpenKVStore(ctx)

	_ = store.Set(types.TotalSupplyKey, []byte(amount.String()))
}
